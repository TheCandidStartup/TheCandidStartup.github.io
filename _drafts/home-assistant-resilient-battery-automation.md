---
title: >
  Home Assistant: Resilient Battery Automation
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

wise words

# Extracting Dispatched Off-Peak Tracking

* Current battery management automation is conceptually simple - force charging on when Octopus has scheduled a smart charge session during peak hours as we'll only be charged off-peak rates
* Octopus API accessed via Octopus Home Assistant integration reports planned dispatches. Periods when smart charging is planned.
* Change often, sometimes at the last minute.
* Retried via polling a rate limited API, can be a few minutes out of date. Sometimes car starts charging before dispatch confirmed.
* Instead force battery charging on when EV charger turns on if smart charge is enabled.
* More complexity. Get occasional transient spikes of charging, typically only a few seconds and low total energy used. Don't know if this is a problem with Octopus or the charger. They don't trigger off-peak rates.
* Use session energy threshold to start charging so that spikes are filtered out.
* Now want to extend charging period to end of nearest half hour to match Octopus pricing.
* Mixing concerns. Battery management automation should only care about start/end of additional off-peak periods.
* Before refactoring battery automation to make it more resilient, let's extract dispatched off-peak tracking.
* Also let's us reuse for other purposes. e.g. For a combined live off-peak sensor. Currently some duplication of logic.

# Dispatched Off-Peak Automation

* Using a boolean helper for dispatched off-peak on/off together with an automation to enable/disable
* Gives us a lot more flexibility than implementing as a template sensor
* Using the composite automation pattern. Not strictly needed as there's no async operations involved. However, nice to try it out. Also keeps all the related code together and makes it easy to add async operations in future if needed.

{% raw %}

```yaml
alias: Manage  Dispatched Off Peak Electricity helper
description: ""
triggers:
  - trigger: numeric_state
    entity_id:
      - sensor.hypervolt_session_energy
    above: 10
    id: hypervolt_on
  - trigger: numeric_state
    entity_id:
      - sensor.hypervolt_charger_current
    above: 2
    id: hypervolt_on
  - trigger: time_pattern
    minutes: /30
    id: end_period
  - trigger: state
    entity_id:
      - switch.hypervolt_charging
    to:
      - "off"
    from:
      - "on"
    id: hypervolt_off
  - trigger: numeric_state
    entity_id:
      - sensor.hypervolt_charger_current
    below: 1
    id: hypervolt_off
conditions: []
actions:
  - choose:
      - conditions:
          - condition: trigger
            id:
              - hypervolt_on
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
            id:
              - end_period
          - condition: state
            entity_id: input_boolean.dispatched_off_peak_electricity
            state:
              - "on"
          - condition: state
            entity_id: switch.hypervolt_charging
            state:
              - "off"
              - unknown
              - unavailable
        sequence:
          - action: input_boolean.turn_off
            metadata: {}
            target:
              entity_id: input_boolean.dispatched_off_peak_electricity
            data: {}
      - conditions:
          - condition: trigger
            id:
              - hypervolt_off
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

```yaml
alias: Force charge battery during Octopus Intelligent Smart Charge
triggers:
  - trigger: state
    entity_id:
      - input_boolean.dispatched_off_peak_electricity
    to:
      - "on"
actions:
  - action: alphaess.setbatterycharge
    data:
      cp2start: "05:30"
      cp2end: "23:30"
      chargestopsoc: "{{ states('input_number.alpha_ess_target_soc') }}"
  - wait_for_trigger:
      - trigger: state
        entity_id:
          - input_boolean.dispatched_off_peak_electricity
        to:
          - "off"
  - action: alphaess.setbatterycharge
    data:
      cp2start: "00:00"
      cp2end: "00:00"
      chargestopsoc: "{{ states('input_number.alpha_ess_target_soc') }}"
mode: restart
```

# Home Batter Management Refactor

* Combine setting target SOC based on solar forecast and overriding battery charge mode when car is charging
* Consider factoring out calculation of target and setting corresponding helper into independent automation. Still some coupling as need to schedule a battery SOC update after forecast has run. 
* Currently schedule forecast automation to run at 2pm when unlikely to be charging
* Turns out that I plug in during the day quite often. Gives Octopus maximum opportunity to schedule bonus off-peak sessions.
* Also, for the most accurate forecast, I want to run automation a few times during day with final one just before main off peak charging period
* High chance of contention
* Don't want to queue for too long
* Current battery charge override runs for full duration of charging session
* Need to split into separate segments to minimize duration of critical section
* Use helper entity to track state - e.g. whether peak period override applied
* First segment triggers when charging starts and overrides battery charge mode and sets helper to true
* Second segment triggers when charging ends with condition that helper set to true, then resets override and sets helper to false
* Set forecast segment uses helper state to decide what charging period should be set to, same way that target SOC tells override segment want to set that to
* Foundation for more complex logic. For example, letting battery discharge to target SOC if it was above desired level when charging starts
