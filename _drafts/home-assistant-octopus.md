---
title: >
  Home Assistant: Octopus Energy Integration
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

wise words

* All about the Octopus integration
* Looked at `previous_accumulative_consumption` entity last time and how to extra electricity meter readings
* Worth a deeper dive

# Electricity Meter

# Repairs

* Notification badge on Settings in navigation pane when there are updates or [repairs](https://www.home-assistant.io/integrations/repairs/) available

{% include candid-image.html src="/assets/images/home-assistant/octopus-repair.png" alt="Octopus Integration repair notice in Settings" %}

What's this all about?

# Internet Service Integrations

* How do integrations like Octopus Energy work?
* They try to show data supplied by an external service over the Internet as if it's updating live
* Typically that means calling the external service at regular intervals, aka polling
* You can imagine how much stress this can put on the service if there are thousands of Home Assistant all doing the same thing
* Octopus Energy estimate that about 95% of their API traffic comes from the Home Assistant Octopus Integration
* Service providers protect themselves by enforcing rate limits for repeated API calls from the same caller and by working with integration authors to reduce their impact
* The Octopus Integration carefully manages the [rate at which data is refreshed](https://bottlecapdave.github.io/HomeAssistant-OctopusEnergy/faq/#how-often-is-data-refreshed) to mitigate the impact on the service

# Intelligent Dispatch

* `intelligent_dispatching` and `intelligent_state` sensors both driven by result from same API call
* Dispatching is a binary sensor whose state determines whether you're in a planned smart charge period or within the standard off-peak period
* State is an enumeration of values the specify the current state of the smart provider. 
* There are three states that you'll see once everything is setup and working correctly
  * SMART_CONTROL_NOT_AVAILABLE - Car not plugged in or not at home
  * SMART_CONTROL_CAPABLE - Car plugged in and ready but no smart charging schedule determined
  * SMART_CONTROL_IN_PROGRESS - Charging periods are scheduled or in progress

* These are sensors that you want to be refreshed frequently while the car is plugged in and irrelevant otherwise
* The underlying API has a rate limit that prevents it being called more than once a minute and at most 20 times in an hour
* By default the integration calls it continuously every 3 minutes
* Repair notice is inviting you to be a good citizen
* You can turn off the automatic refresh and write your own automation to refresh when needed
* [Blueprint](https://bottlecapdave.github.io/HomeAssistant-OctopusEnergy/blueprints/#manual-intelligent-dispatch-refreshes) provided which does one call 30 seconds after car plugged in, then at normal 3 minute refresh interval while car continues to be plugged in
* Install link in documentation was broken for me
* Instead copy link to source (GitHub URL) then go to "Settings -> Automations -> Blueprints", press "Import Blueprint" and paste the link.
* Blueprint will be imported and can then be opened to configure it.

{% include candid-image.html src="/assets/images/home-assistant/octopus-refresh-blueprint.png" alt="Octopus Manual Refresh Blueprint" %}

* Blueprint is a pre-packaged parameterized automation. Provide the required details and a new automation is created using the Blueprint.
* You can change the parameters of a Blueprint automation and update it if the source Blueprint changes.
* Start with that and tweak as needed
* Had a look at the source. Couple of things jumped on. First, it depends on an Octopus Energy [diagnostics sensor](https://bottlecapdave.github.io/HomeAssistant-OctopusEnergy/entities/diagnostics/) (`intelligent-dispatches-data-last-retrieved` that is disabled by default. 
* Enabling it was harder than I thought. If you go to the Octopus Energy integration page in Home Assistant it's not listed with the other Charger entities, or any other group on the page. You need to choose "Entities" from the top hamburger menu and scroll to the bottom of the list. You can then click on the disabled icon to enable it. 
* The dispatch sensor state is refreshed while the car continues to be plugged in. As soon as it's unplugged, there are no refreshes, which means the sensors are left in their active state.
* Does it ever report SMART_CONTROL_NOT_AVAILABLE after session completes?
* No it doesn't. Also, schedule wasn't available after 30 seconds which meant it was another 3 minutes before it updated.
* If you need to tweak a Blueprint automation you can "take control" (from the hamburger menu) to convert it into a normal automation. 

# Taking Control

* Use my 20 requests an hour budget more wisely. As fast as I can after car plugged in to get initial schedule
* After that every 5 minutes + on significant events like charger's schedule being update, charging start/end, but making sure no more often than normal 3 minute refresh interval
* Once car unplugged for a minute to hopefully pick up final state
* Continue while state is still active
* Using the triggers - choose pattern to implement everything in a single automation

```yaml
triggers:
  - trigger: state
    id: car_plugged_in
    entity_id:
      - binary_sensor.hypervolt_car_plugged
    to: "on"
    for:
      hours: 0
      minutes: 1
      seconds: 0
  - trigger: state
    entity_id:
      - binary_sensor.hypervolt_car_plugged
    to: "off"
    for:
      hours: 0
      minutes: 1
      seconds: 0
  - trigger: state
    entity_id:
      - time.hypervolt_schedule_session_1_start_time
    to: null
  - trigger: state
    entity_id:
      - switch.hypervolt_charging
    to: null
  - trigger: time_pattern
    minutes: /5
```

* Long list of triggers with id for the one that needs special handling

```yaml
conditions:
  - condition: or
    conditions:
      - condition: state
        entity_id: binary_sensor.hypervolt_car_plugged
        state: "on"
      - condition: state
        entity_id: sensor.octopus_energy_XXXXX_intelligent_state
        state: SMART_CONTROL_IN_PROGRESS
      - condition: state
        entity_id: sensor.octopus_energy_XXXXX_intelligent_state
        state: SMART_CONTROL_CAPABLE
```

* Automation should be active while car plugged in or smart charging state active

{% raw %}

```yaml
actions:
  - choose:
      - conditions:
          - condition: template
            alias: Trigger is car plugged in
            value_template: "{{ trigger.id == 'car_plugged_in' }}"
        sequence:
          - action: octopus_energy.refresh_intelligent_dispatches
            target:
              entity_id: binary_sensor.octopus_energy_XXXXX_intelligent_dispatching
          - repeat:
              while:
                - condition: template
                  alias: Planned Dispatches not available (5 trys)
                  value_template: >-
                    {{ state_attr(intelligent_dispatches_sensor,
                    'planned_dispatches') | count == 0 and repeat.index < 5 }}
              sequence:
                - delay:
                    seconds: 60
                - action: octopus_energy.refresh_intelligent_dispatches
                  target:
                    entity_id: >-
                      binary_sensor.octopus_energy_XXXXX_intelligent_dispatching
      - conditions:
          - condition: template
            alias: Next refresh is due
            value_template: >-
              {{ state_attr(intelligent_dispatches_data_last_retrieved_sensor,
              'next_refresh') | as_datetime | as_local < now() }}
        sequence:
          - delay:
              milliseconds: "{{ millisecond_jitter }}"
          - action: octopus_energy.refresh_intelligent_dispatches
            target:
              entity_id: binary_sensor.octopus_energy_XXXXX_intelligent_dispatching
```

* Two choices. If the trigger was the car being plugged in we run our loop of refreshing until we get an initial schedule (up to 5 trys)
* All other triggers use the other choice of refreshing if it's been long enough since last refresh. We throw some jitter into this one (copied from Blueprint) to avoid requests hitting on minute boundary. Not needed for car plugging in as that's not aligned with anything.

{% endraw %}

* PICTURE of dashboard showing dispatches
