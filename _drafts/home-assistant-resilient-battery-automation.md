---
title: >
  Home Assistant: Resilient Battery Automation
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

It's been a while since I investigated Home Assistant's [concurrency model]({% link _posts/2025-10-20-home-assistant-concurrency-model.md %}). I was worried about contention between different automations manipulating the same resource. I came to the conclusion that all automations manipulating the same resource should be merged into one using the composite automation pattern.

Now it's time to put theory into practice. I have [two automations]({% link _posts/2025-09-15-home-assistant-helpers-template-solar-forecasts.md %}) that modify the charging settings of my [Alpha ESS Home Battery]({% link _posts/2023-08-28-alpha-ess-smile5-home-battery.md %}). Once changes the settings to prevent the battery discharging while my EV is charging, the other sets a target SOC (state of charge) based on tomorrow's solar generation and heating forecasts. 

The problem is that there's a single action which changes all the settings. Each automation does the equivalent of a read-modify-write process to change the settings its interested in. If the two automations run concurrently you can end up in a mess. At the moment I try to avoid the problem by running the target SOC automation at a time when I'm unlikely to charge the EV and blocking it from running if the EV is charging.

Let's see if we now have the tools to do this right.

# Composite Automation Pattern

{% capture conc_url %}
{% link _posts/2025-10-20-home-assistant-concurrency-model.md %}
{% endcapture %}

The [Composite Automation Pattern]({{ conc_url | append: "#composite-automations" }}) uses multiple triggers combined with a `choose` action. The `choose` action executes a different set of sub-actions for each trigger id. In my case, I'll have triggers for start charging, end charging and forecast updated.

The automation uses queued mode which prevents concurrent execution *and* makes sure that any concurrent triggers are queued up and run when the previous invocation has completed.

# Refactoring

The Composite Automation Pattern works best when automations are focused on modifications of the shared resource. In queued mode, automation actions are equivalent to a critical section. You want to keep them as short as possible and in particular avoid asynchronous operations when possible. 

Anything that doesn't need to be inside the critical section should be factored out into a separate automation.

# Extracting Dispatched Off-Peak Tracking

The current battery management automation is conceptually simple. We force home battery charging on when Octopus has scheduled a smart charge session. If this happens during peak hours we'll only be charged off-peak rates. The difficult part is determining when these "dispatched" off-peak periods occur.

The Octopus API accessed via the Octopus Home Assistant integration reports planned dispatches. These are the periods when smart charging is planned. They change often, sometimes at the last minute before a session starts.

The planned dispatches data is retrieved via [polling a rate limited API]({% link _posts/2025-10-06-home-assistant-octopus-repair-blueprint.md %}). It can be up to five minutes out of date. Sometimes the car starts charging before the dispatch is confirmed.

Instead of using the planned dispatches data, the automation uses EV charging as the trigger. Unfortunately, there's more complexity. There are occasional transient spikes of charging, typically only a few seconds and low total energy used. I don't know if this is a problem with Octopus or the charger. The spikes don't trigger off-peak rates. There's extra logic to filter the spikes out.

The current automation is mixing concerns. The battery management automation should react to start/end dispatched off-peak periods. All the complexity of figuring out when those periods start and end should be factored out.

# Dispatched Off-Peak Automation

* Using a boolean helper for dispatched off-peak on/off together with an automation to enable/disable
* Gives us a lot more flexibility than implementing as a template sensor
* Using the composite automation pattern. Not strictly needed as there's no async operations involved. However, nice to try it out. Also keeps all the related code together and makes it easy to add async operations in future if needed.
* Use session energy threshold to start charging so that spikes are filtered out.
* Now want to extend charging period to end of nearest half hour to match Octopus pricing.
* Also let's us reuse for other purposes. e.g. For a combined live off-peak sensor. Currently some duplication of logic. Boosting hot water during the day if electricity is cheap.

{% raw %}

```yaml
triggers:
  - trigger: numeric_state
    entity_id: sensor.hypervolt_session_energy
    above: 10
    id: hypervolt_on
  - trigger: numeric_state
    entity_id: sensor.hypervolt_charger_current
    above: 2
    id: hypervolt_on
  - trigger: time_pattern
    minutes: /30
    id: end_period
  - trigger: state
    entity_id: switch.hypervolt_charging
    to: "off"
    from: "on"
    id: hypervolt_off
  - trigger: numeric_state
    entity_id: sensor.hypervolt_charger_current
    below: 1
    id: hypervolt_off
actions:
  - choose:
      - conditions:
          - condition: trigger
            id: hypervolt_on
          - condition: state
            entity_id: switch.octopus_energy_XXXXX_intelligent_smart_charge
            state: "on"
          - condition: state
            entity_id: switch.hypervolt_charging
            state: "on"
          - condition: numeric_state
            entity_id: sensor.hypervolt_session_energy
            above: 10
        sequence:
          - action: input_boolean.turn_on
            metadata: {}
            target:
              entity_id: input_boolean.dispatched_off_peak_electricity
            data: {}
      - conditions:
          - condition: trigger
            id: end_period
          - condition: state
            entity_id: input_boolean.dispatched_off_peak_electricity
            state: "on"
          - condition: state
            entity_id: switch.hypervolt_charging
            state: [ "off", unknown, unavailable ]
        sequence:
          - action: input_boolean.turn_off
            metadata: {}
            target:
              entity_id: input_boolean.dispatched_off_peak_electricity
            data: {}
      - conditions:
          - condition: trigger
            id: hypervolt_off
          - condition: template
            alias: Within a minute of 30 minute period boundary
            value_template: |-
              {% set minute = now().minute %}
              {{ minute > 58 or minute < 2 or (28 < minute < 32) }}
        sequence:
          - action: input_boolean.turn_off
            metadata: {}
            target:
              entity_id: input_boolean.dispatched_off_peak_electricity
            data: {}
mode: queued
max: 4
```

{% endraw %}

# Home Battery Management Automation

* Now much simpler
* Integration exposes single action that changes multiple parameters at once. Need to pass in current values for things you don't want to change.

{% raw %}

```yaml
alias: Force charge battery during Octopus Intelligent Smart Charge
triggers:
  - trigger: state
    entity_id: input_boolean.dispatched_off_peak_electricity
    to: "on"
actions:
  - action: alphaess.setbatterycharge
    data:
      cp2start: "05:30"
      cp2end: "23:30"
      chargestopsoc: "{{ states('input_number.alpha_ess_target_soc') }}"
  - wait_for_trigger:
      - trigger: state
        entity_id: input_boolean.dispatched_off_peak_electricity
        to: "off"
  - action: alphaess.setbatterycharge
    data:
      cp2start: "00:00"
      cp2end: "00:00"
      chargestopsoc: "{{ states('input_number.alpha_ess_target_soc') }}"
mode: restart
```

{% endraw %}

# Cold Weather Day Time Car Charging

* 10kWh home battery. Not enough to run heat pump all day during cold weather.
* Octopus changing their terms for Intelligent Go. Smart charging limited to 6 hours a day. Idea is to encourage you to plug car in more often, giving Octopus more charge to optimize when charging happens.
* Happy to comply. Used to add 50% once or twice a week. Now plugging car in first thing each morning and adding 10%. Give Octopus maximum chance of scheduling day time charging periods.

{% include candid-image.html src="/assets/images/home-assistant/dispatched-off-peak-graph.png" alt="Day Time Charging Scheduled by Octopus" %}

* Octopus Home Assistant integration provides "Intelligent Dispatching" entity which uses planned dispatches responses from API to predict when smart charging is occuring
* Notice that for second period it starts 5 minutes after car starts charging. Previous poll of API happened just before start of dispatch.
* Our "Dispatched Off Peak Electricity" helper is bang on, mirroring the car charger
* Octopus helpfully scheduled an extra 5 minutes of charging after 13:00 which means the entire 13:00 to 13:30 period should be charged at off-peak rates. We take full advantage, extending the "Dispatched Off Peak" period to the next half hour boundary.

{% include candid-image.html src="/assets/images/home-assistant/dispatched-off-peak-octopus-charges.png" alt="Day Time Charging Octopus Charges" %}

* Yes, I did confirm that Octopus charged off-peak rates for the entire 12:00 to 13:30 period.
* Gave us enough extra juice for the battery to last until peak shower time in the evening.

# Day Time Hot Water Boost

# Home Battery Management Refactor

* Combine setting target SOC based on solar forecast and overriding battery charge mode when car is charging
* Simple refactor of existing into composite pattern then add condition to make sure SOC target set just before fixed overnight charging period starts
* If there's a dispatched off peak period, SOC will be set anyway when it starts and ends.

{% raw %}

```yaml
  - trigger: state
    entity_id: input_boolean.dispatched_off_peak_electricity
    to: "on"
    id: off_peak_on
  - trigger: state
    entity_id: input_boolean.dispatched_off_peak_electricity
    to: "off"
    id: off_peak_off
  - trigger: time
    at: "23:15:00"
    id: update_soc
actions:
  - choose:
      - conditions:
          - condition: trigger
            id: off_peak_on
        sequence:
          - action: alphaess.setbatterycharge
            data:
              cp2start: "05:30"
              cp2end: "23:30"
              chargestopsoc: "{{ states('input_number.alpha_ess_target_soc') }}"
      - conditions:
          - condition: trigger
            id: off_peak_off
        sequence:
          - action: alphaess.setbatterycharge
            data:
              enabled: true
              cp2start: "00:00"
              cp2end: "00:00"
              chargestopsoc: "{{ states('input_number.alpha_ess_target_soc') }}"
      - conditions:
          - condition: trigger
            id: update_soc
        sequence:
          - if:
              - condition: state
                entity_id: input_boolean.dispatched_off_peak_electricity
                state: "on"
            then:
              - action: alphaess.setbatterycharge
                data:
                  cp2start: "05:30"
                  cp2end: "23:30"
                  chargestopsoc: "{{ states('input_number.alpha_ess_target_soc') }}"
            else:
              - action: alphaess.setbatterycharge
                data:
                  cp2start: "00:00"
                  cp2end: "00:00"
                  chargestopsoc: "{{ states('input_number.alpha_ess_target_soc') }}"
mode: queued
max: 4
```

{% endraw %}

* When updating target SOC I need to make sure charging period is set as it should be based on the "Dispatched Off-Peak" helper. I could have used some templating magic to do it with a single action but it was quicker to add an `if` and copy the `setbatterycharge` actions I already had for the `then` and `else` clauses.
* I've kept the calculation of target SOC in a separate automation which I run earlier. In queued mode, automation actions are equivalent to a critical section. Want to keep them as short as possible and in particular avoid asynchronous operations when possible. 
* Foundation for more complex logic. For example, letting battery discharge to target SOC if it was above desired level when charging starts. Or, updating forecast target several times during the day based on forecast for remains of the day.
