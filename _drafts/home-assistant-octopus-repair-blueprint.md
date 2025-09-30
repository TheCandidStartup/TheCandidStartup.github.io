---
title: >
  Home Assistant: Octopus Integration, Repairs and Blueprints
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

[Last time]({% link _posts/2025-09-29-home-assistant-dashboard-custom-cards-statistics.md %}), we touched briefly on how to extract electricity meter readings from the [Home Assistant Octopus Energy](https://bottlecapdave.github.io/HomeAssistant-OctopusEnergy/) integration. I think it's worth doing a deeper dive. 

There's nothing like looking at a real world integration to better understand the strengths and weaknesses of the Home Assistant data model.

# Electricity Meter

The integration exposes separate devices for each energy meter (electricity and gas in my case). Each device has a set of sensors which can be logically divided into two groups. The first group relates to the *previous* days consumption of energy. There are separate sensors for the energy consumed, the cost of the energy consumed and the applicable rates during the day.

The second group relates to the *current* state of the tariff you're on. There are sensors for the standing charge each day, off-peak times, and per-unit rates.

The Home Assistant data model for all entities includes a current [state](https://www.home-assistant.io/docs/configuration/state_object/) which is a simple, understandable, scalar value. This is the headline value that you see in the UI for each entity, the value that you see graphed over time in history views and that is aggregated in statistics views.

Each entity also has a collection of [attributes](https://www.home-assistant.io/docs/configuration/state_object/#about-entity-state-attributes). These can be anything the integration wants to add. Typical examples include additional values related to the state and metadata for the entity.

{% include candid-image.html src="/assets/images/home-assistant/prev-accum-consumption.png" alt="Octopus Previous Accumulative Consumption entity" %}

As we saw last time, the Octopus Energy integration adds a huge collection of attributes to it's sensors. Why is that?

# Mapping Sensors to API Calls

How do integrations like Octopus Energy work? They retrieve data by making API calls to external services over the internet. Typically, an API call will return a package of data, such as all the meter readings for one day. The integration needs to decide how to expose that data as entities in Home Assistant.

It's not practical to expose every item of data as a separate sensor. It would be overwhelming for the end user, use a lot of Home Assistant resources and create a lot of work for the integration author. 

Most integrations pick a small selection of things that are most likely to be useful as state that changes over time. You may end up with multiple sensors driven by data from the same API call, like previous consumption costs and rates.

What do you do with all the data that you didn't expose as state? You could make a decision and discard anything that isn't relevant. However, everything could be relevant for somebody. 

Attributes are stored as a big blob of structured data (think JSON or YAML). It's easy to add whatever you want, so most integration authors dump whatever data is left into attributes.

# Repairs

The [Home Assistant Repairs](https://www.home-assistant.io/integrations/repairs/) system informs you about issues in your Home Assistant instance that should be fixed to keep it healthy. Third party integrations can add their own notices to the repairs system.

A notification badge appears on the "Settings" item in the navigation pane where there are updates or repairs available. A couple of days after installing the Octopus Energy integration I saw this. 

{% include candid-image.html src="/assets/images/home-assistant/octopus-repair.png" alt="Octopus Integration repair notice in Settings" %}

I guess I should stop procrastinating and do something about it.

# Live Data

The Home Assistant data model encourages integrations to expose their most important data as entities with state that represents the current moment in time. The data is presented "as live". Always up to date, tracking changes as they happen in the real world. 

How does an integration like Octopus Energy do that? It calls an external service over the internet to get the current state. Then it does it again, over and over, as fast as it can. 

You can imagine how much stress this can put on the external service if there are thousands of Home Assistant instances, all doing the same thing. Octopus Energy estimate that about 95% of their API traffic comes from the Home Assistant Octopus Energy integration. Which, to be clear, is maintained by a third party, not Octopus Energy. 

Service providers protect themselves by enforcing rate limits for repeated API calls from the same caller and by working with integration authors to reduce their impact. The Octopus Integration carefully manages the [rate at which data is refreshed](https://bottlecapdave.github.io/HomeAssistant-OctopusEnergy/faq/#how-often-is-data-refreshed) to mitigate the impact on the Octopus API service.

# Intelligent Dispatch

The Octopus Energy integration creates a "Charger" device if you're on a smart charging tariff, like Octopus Intelligent Go. The `intelligent_dispatching` and `intelligent_state` sensors are both driven by results from the same API call. 

Intelligent Dispatching is a binary sensor whose state determines whether you're in a planned smart charge period or within the standard off-peak period. Intelligent State is an enumeration of values that specify the current state of the smart provider. There are three states that you'll see once everything is setup and working correctly.
  * `SMART_CONTROL_NOT_AVAILABLE` - Car not plugged in or not at home
  * `SMART_CONTROL_CAPABLE` - Car plugged in and ready but no smart charging schedule determined
  * `SMART_CONTROL_IN_PROGRESS` - Charging periods are scheduled or in progress

These are sensors that you want to be refreshed frequently while the car is plugged in and completely irrelevant the rest of the time. The underlying API has a rate limit that prevents it being called more than once a minute and at most 20 times in an hour. By default, the integration calls it continuously every 3 minutes.

The repair notice is inviting you to be a good citizen. If you have another integration that tells you when the car is plugged in, you can turn off the automatic refresh and write your own automation to refresh when needed. There's a [blueprint](https://bottlecapdave.github.io/HomeAssistant-OctopusEnergy/blueprints/#manual-intelligent-dispatch-refreshes) provided which does one call 30 seconds after the car is plugged in, then at the normal 3 minute refresh intervals while the car continues to be plugged in.

There's an install link in the documentation which is meant to redirect into Home Assistant. It didn't work for me. Instead, I copied the source link (a GitHub URL), went to "Settings -> Automations -> Blueprints", pressed "Import Blueprint" and pasted the link. Once the Blueprint has imported, you can open it and configure it.

{% include candid-image.html src="/assets/images/home-assistant/octopus-refresh-blueprint.png" alt="Octopus Manual Refresh Blueprint" %}

A Blueprint is a pre-packaged parameterized automation. Provide the required details and a new automation is created using the Blueprint. You can change the parameters of a Blueprint automation and update to the latest version if the source Blueprint changes.

I decided to start with the Blueprint and tweak it if needed. The first hurdle is that there's no "Intelligent Dispatches Data Last Retrieved" entity. The documentation says it's disabled by default. Enabling it was harder than I thought. If you go to the Octopus Energy integration page in Home Assistant, it's not listed with the other Charger entities, or any other device on the page. You need to choose "Entities" from the top hamburger menu and scroll to the bottom of the list. You can then click on the disabled icon to enable it. 

Next, I had a look at the [source](https://bottlecapdave.github.io/HomeAssistant-OctopusEnergy/blueprints/octopus_energy_spin_wheel_of_fortune_dual.yml). The dispatch sensor state is refreshed while the car continues to be plugged in. As soon as it's unplugged, there are no refreshes, which means the sensors are left in their active state. I did a quick test and confirmed that the Intelligent State never goes back to `SMART_CONTROL_NOT_AVAILABLE` after unplugging the car. 

The Blueprint allows 30 seconds for a smart schedule to become available before calling the Octopus API. It's never that quick for me. Which meant I had to wait another 3 minutes before the next scheduled refresh came round. 

If you need to tweak a Blueprint automation you can "Take Control" (from the hamburger menu) to convert it into a normal automation. 

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
  - trigger: state
    entity_id:
      - binary_sensor.hypervolt_car_plugged
    to: "off"
    for:
      minutes: 1
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
          - delay:
              seconds: 60
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
