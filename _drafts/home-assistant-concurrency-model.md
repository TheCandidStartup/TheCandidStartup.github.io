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

Home Assistant uses a heavily modular architecture built on a small core. The core consists of a event bus, the Home Assistant "state machine" and a service registry. Everything else, both built in functionality and third party integrations, is implemented as a large set of modular components.

{% include candid-image.html src="/assets/images/home-assistant/ha_architecture.svg" alt="Home Assistant Core Architecture" attrib="Open Home Foundation, [CC A-NC-SA 4.0](https://github.com/home-assistant/developers.home-assistant?tab=License-1-ov-file#readme), via developers.home-assistant" %}

Components define [events](https://www.home-assistant.io/docs/configuration/events/), [entities](https://www.home-assistant.io/docs/configuration/entities_domains/) and [services](https://data.home-assistant.io/docs/services/). 

Entities hold data. Just about everything you interact with in the Home Assistant UI is some type of entity. Entity data is represented using a [state](https://www.home-assistant.io/docs/configuration/state_object/) value and a set of [state attributes](https://www.home-assistant.io/docs/configuration/state_object/#about-entity-state-attributes).

Components notify the state machine when their entities state changes. The state machine keeps track of the changes, maintaining a map of all states in memory, recording each [change in a database](https://data.home-assistant.io/docs/states), and raising `state_changed` events on the event bus. 

# Concurrency Implementation

* Not much in the way of formal documentation about what behavior you can rely on
* Overlapping execution, race conditions, etc.
* Only thing is [automation mode](https://www.home-assistant.io/docs/automation/modes/) that controls concurrency for multiple instances of the *same* automation
* Common practical approach is to run automations that could conflict at different times, far enough apart that one will complete before the other starts
* What can you rely on between running instances of different automations?
* Python asyncio code
* async/await pattern common in many languages
* asyncio explicitly distinguishes between tasks and coroutines
* A coroutine is a function that can pause itself and be resumed (function declared as `async`)
* A task is a wrapper around a coroutine that allows it to be run on the event loop, you create a task using `asyncio.create_task` or one of the many wrappers around it. Home Assistant has `hass.async_create_task`.
* If you `await` a coroutine, control is transferred immediately to that coroutine without going via the event loop
* If you `await` a task, it gets added to the event loop's list of tasks to run, control is transferred back to the event loop and it resumes execution with the task at the front (usually) of the queue
* If you wait until some time later or for I/O to complete, the running coroutine is suspended until ready and control given back to the event loop
* Automation behavior depends on how code is divided into tasks and which operations depend on I/O
* Backwards compatibility for code that predates asyncio. Home Assistant used to use threading for concurrency. Any code that hasn't explicitly opted in to async way of working is run on a separate worker thread. Can't make any assumptions about concurrency in these cases. Should only be an issue with old third party integrations.
* Current state is kept in memory and is accessed synchronously
* This is why most things in Home Assistant only work with current state. Historical state and statistics have to be queried from a database which needs asynchronous IO. 
* Updates to state typically happen asynchronously in reaction to events on Home Assistant's internal event bus. Almost everything is driven by a regular timer event every second. Either directly for time based triggers or implicitly by polling triggered at regular intervals.
* Explicit use of task in automations
  * Executing a sequence of actions
  * Call to service action
* Home Assistant `async_create_task` has default option that uses low level event loop APIs to create "eager start" tasks which the event loop runs immediately
* Automations tasks are all eager start
* Implies that once an automation starts running it will keep running until it waits or performs external IO
* Mutex pattern using an `input_boolean` helper *should* work
* Just the start. Easy to use when you want to prevent conflicting automation from running entirely. What if you need it to run but not concurrently? In theory, you can use a helper entity to model a queue with an automation that picks up queued jobs.
* Massively over the top complicated, especially given how fiddly it is to implement logic as templates.

# Automation Mode

* For many use cases there's a better middle ground
* Replace multiple conflicting automations and combine them into one using the Trigger - Choose pattern. Generalization of the dispatches refresh automation we looked at last time.
* Given a set of simple automations: TriggersA - ConditionsA - ActionsA, TriggersB, - ConditionsB - ActionsB, TriggersC - ConditionsC - ActionsC, ...
* Combine them as

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

* Queued mode ensures that A, B and C can't run concurrently. Execution will be queued if triggered while another instance is running. Queued instances are run in order.
* The combined automation uses the trigger that fired to determine which conditions to check and then actions to run.
* Assume that the triggers used by A, B and C are disjoint. If not, you'll need to further merge the common parts. 
* Any conditions in the main `conditions` section are evaluated at the time the automation was triggered, *before* potentially being queued
* Any conditions in the action sequence are evaluated when the automation is executed, *after* potentially being queued
* Will need to decide whether you want to treat each sub-automation condition as a precondition, postcondition or both
