---
title: >
  Home Assistant: Concurrency Model
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

I like to think of myself as a computer scientist. I want to know how things work. Then I want to understand *why* they work that way.

I've got a few automations working using Home Assistant. I currently have multiple automations that change the settings on my home battery system. You can think of each automation as performing some variation on read-modify-write. 

Now I'm getting that itch. What is actually going on internally? What guarantees do I have when automations run concurrently? Will they conflict?

# Home Assistant Architecture

Home Assistant uses a heavily modular architecture built on a small core. The core consists of an event bus, the Home Assistant "state machine" and a service registry. Everything else, both built-in functionality and third party integrations, is implemented as a large set of modular components.

{% include candid-image.html src="/assets/images/home-assistant/ha_architecture.svg" alt="Home Assistant Core Architecture" attrib="Open Home Foundation, [CC A-NC-SA 4.0](https://github.com/home-assistant/developers.home-assistant?tab=License-1-ov-file#readme), via developers.home-assistant.io" %}

Components define [events](https://www.home-assistant.io/docs/configuration/events/), [entities](https://www.home-assistant.io/docs/configuration/entities_domains/) and [services](https://data.home-assistant.io/docs/services/). Entities hold data. Just about everything you interact with in the Home Assistant UI is some type of entity. Entity data is represented using a [state](https://www.home-assistant.io/docs/configuration/state_object/) value and a set of [state attributes](https://www.home-assistant.io/docs/configuration/state_object/#about-entity-state-attributes).

Components notify the state machine when the state in their entities changes. The state machine keeps track of the changes, maintaining a map of all states [in memory](https://developers.home-assistant.io/docs/dev_101_states), recording each [change in a database](https://data.home-assistant.io/docs/states), and raising `state_changed` events on the [event bus](https://developers.home-assistant.io/docs/dev_101_events). 

Services are actions that a component can perform. The set of defined services is stored in the service registry. Components can listen to events from the core or other components, invoke services provided by the core or other components and in turn update state and raise events of their own.

The `Timer` raises the `time_changed` event once a second, which drives most activity in Home Assistant. This includes explicit delays, waits and time based trigger conditions. It also includes invoking polling API calls at regular intervals. 

# Concurrency Guarantees

There's very little in the way of formal documentation about what behavior you can rely on. Nothing about overlapping execution or race conditions. A common practical approach is to run automations that could conflict at different times, far enough apart that one will complete before the other starts.

The only documented guarantee is provided by the [automation mode](https://www.home-assistant.io/docs/automation/modes/) that controls concurrency for multiple instances of the *same* automation. There are four options.
* `single` - Any new invocation is ignored if an existing instance is already running.
* `restart` - Start a new instance after stopping any existing instance.
* `queued` - Start a new instance after all previous instances complete. Instances are guaranteed to execute in the order they were queued.
* `parallel` - Start a new instance that runs in parallel with any existing instances.

What can you rely on between running instances of *different* automations? I particularly enjoyed this [discussion thread](https://community.home-assistant.io/t/what-is-home-assistants-concurrency-model) that tries and fails to extract any kind of formal commitment. The responses can be summarized as:
1. It does what it does. 
2. I use an `input_boolean` as a mutex and implement the mutex logic using conditions and actions. It works for me!
3. If you need to know more, read the code.

# Home Assistant Developer

Home Assistant is written in Python and [uses](https://developers.home-assistant.io/docs/asyncio_index) Python's [asyncio](https://docs.python.org/3/howto/a-conceptual-overview-of-asyncio.html) module to implement an event loop. The event loop is single threaded. It manages a queue of tasks, which are executed one at a time. The tasks are implemented as coroutines. They can pause themselves at any point and return control to the event loop. This typically happens if the task needs to delay for a time, is waiting for I/O, or for a response from another task. 

Like many modern languages, Python exposes coroutines using the `async` / `await` syntax. You declare a coroutine by adding the `async` prefix to a function. You wait for a call to a coroutine to complete using the `await` keyword. 

Asyncio explicitly distinguishes between tasks and coroutines. A coroutine is an `async` function that can pause itself and be resumed. A task is a wrapper around a coroutine that allows it to be run on the event loop. You create a task using [`asyncio.create_task`](https://docs.python.org/3/library/asyncio-task.html#creating-tasks) or one of the many wrappers around it. Home Assistant has [`hass.async_create_task`](https://developers.home-assistant.io/docs/asyncio_working_with_async/#starting-independent-task-from-async).

If you `await` a coroutine, control is transferred immediately to that coroutine without going via the event loop. If you `await` a task, it gets added to the event loop's list of tasks to run. Control is transferred back to the event loop and it resumes execution with the task at the front (usually) of the queue. If you wait until some time later or for I/O to complete, the running coroutine is suspended until ready and control given back to the event loop.

Automation behavior depends on how code is divided into tasks and which operations delay or depend on I/O.

Home Assistant provides backwards compatibility for code that predates asyncio. Any code that hasn't explicitly opted in to the async way of working is run on a separate worker thread. We can't make any assumptions about concurrency in these cases. Fortunately, it should only be an issue with old third party integrations.

# Reading the Code

The current state (and attributes) are managed by the state machine. The data is stored in memory and accessed synchronously. Reading or writing state won't suspend the running coroutine. 

This is why most things in Home Assistant only work with current state. Historical state and statistics have to be queried from a database which needs asynchronous IO. 

Updates to state typically happen asynchronously in reaction to events on the event bus. For example, a component reacts to a timer event by making a request to a REST API, suspending until a response is received, then updating the state machine. Anything else reading the state has immediate synchronous access to the most recent value reported to the state machine.

Updates to state raise `state_changed` events. Components can also raise their own events. The event bus determines all subscribers for each event and then adds tasks that deliver the events to each subscriber, once control has returned to the event loop and other queued tasks have been executed.

Most code in the automation core uses direct calls to `async` functions. These won't suspend the coroutine or transfer control to the event loop. There are two places with explicit use of a task. The execution of a sequence of actions is [wrapped in a dedicated task](https://github.com/home-assistant/core/blob/ec3dd7d1e571dfc00ca2addb53fde21e54d4dd1b/homeassistant/helpers/script.py#L637), as are [calls to service actions](https://github.com/home-assistant/core/blob/ec3dd7d1e571dfc00ca2addb53fde21e54d4dd1b/homeassistant/helpers/script.py#L1013). 

At first I thought this meant that automations can suspend between checking conditions and executing the sequence of actions. However, Home Assistant's `async_create_task` [isn't a simple wrapper](https://github.com/home-assistant/core/blob/d40eeee42293328fb793d1b1a1764b49d842c5d8/homeassistant/core.py#L810) around `asyncio.create_task`. It uses a [lower level interface](https://docs.python.org/3/library/asyncio-task.html#task-object) that allows tasks to be scheduled to run immediately. Both tasks created by automations do this. 

This implies that once an automation starts running it will keep running until it waits, or performs external IO. A good rule of thumb is to assume that any call to a service action may suspend unless you know that it doesn't perform external IO and that it isn't legacy code running in a dedicated thread.

The mutex pattern using an `input_boolean` helper *should* work. Condition evaluation can only access state and attributes, so won't suspend. The `turn_on` action on the `input_boolean` shouldn't either.

Implementing mutual exclusion is just the start. It's easy enough to prevent conflicting automations from running entirely. What if you need it to run but not concurrently? In theory, you can use a helper entity to implement a queue with an automation that picks up queued jobs. Which is massively over complicated. It's hard enough implementing your own low level currency primitives in a real programming language, let alone trying to do it using Home Assistant templating.

Even if you can roll your own, you need to think carefully about whether you want to rely on undocumented behavior inferred from reading the source code. Undocumented, means it can change at any time. Are there any other options?

# Composite Automations

There are good concurrency guarantees for multiple instances of the *same* automation. In many cases, we can combine a set of independent automations into one composite automation. 

This is a generalization of the "Trigger - Choose" pattern we previously used for our [Octopus Refresh Dispatches]({% link _posts/2025-10-06-home-assistant-octopus-repair-blueprint.md %}) automation.

In general an automation is a set of triggers, a set of conditions and a set of actions. Given separate automations TriggersA - ConditionsA - ActionsA, TriggersB - ConditionsB - ActionsB, TriggersC - ConditionsC - ActionsC, we can combine them as follows.

{% raw %}

```yaml
mode: queued
triggers:
  - TriggersA
    id: "A"
  - TriggersB
    id: "B"
  - TriggersC
    id: "C"
conditions:
  - or:
    - and:
      - condition: template
        alias: Trigger A
        value_template: "{{ trigger.id == 'A' }}"
      - PreConditionsA
    - and:
      - condition: template
        alias: Trigger B
        value_template: "{{ trigger.id == 'B' }}"
      - PreConditionsB
    - and:
      - condition: template
        alias: Trigger C
        value_template: "{{ trigger.id == 'C' }}"
      - PreConditionsC
actions:
  - choose:
      - conditions:
          - condition: template
            alias: Trigger A
            value_template: "{{ trigger.id == 'A' }}"
          - PostConditionsA
        sequence:
          - ActionsA
      - conditions:
          - condition: template
            alias: Trigger B
            value_template: "{{ trigger.id == 'B' }}"
          - PostConditionsB
        sequence:
          - ActionsB
      - conditions:
          - condition: template
            alias: Trigger C
            value_template: "{{ trigger.id == 'C' }}"
          - PostConditionsC
        sequence:
          - ActionsC
```

{% endraw %}

Queued mode ensures that A, B and C can't run concurrently. Execution will be queued if triggered while another instance is running. Queued instances are run in order.

The combined automation uses the trigger that fired to determine which conditions to check and then which actions to run. This assumes that the triggers used by A, B and C are disjoint. If not, you'll need to further merge the common parts.

Any conditions in the main `conditions` section are evaluated at the time the automation was triggered, *before* potentially being queued. Any conditions in the action sequence are evaluated when the automation is executed, *after* potentially being queued. You will need to decide whether you want to treat each sub-automation condition as a precondition, postcondition or both.

