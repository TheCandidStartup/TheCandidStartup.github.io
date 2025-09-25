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
  * Just after the car has been plugged in to get initial schedule from Octopus
    * Wait 30 seconds then repeat x3 at one minute intervals until we have a schedule
  * At regular intervals while the car is plugged in, in case Octopus changes the schedule
    * When car starts or stops charging
    * Every 5 minutes otherwise
  * Just after the car has been unplugged to ensure we pick up final state
* Blueprint provided which does one call 30 seconds after car plugged in, then at normal 3 minute refresh interval while car continues to be plugged in
* Start with that and tweak as needed. e.g. Does it ever report SMART_CONTROL_NOT_AVAILABLE after session completes?

# Intelligent Charging Sensors

