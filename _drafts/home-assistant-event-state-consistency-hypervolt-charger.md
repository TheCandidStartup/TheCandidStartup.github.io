---
title: Home Assistant Event State Consistency
tags: home-assistant
---

wise words

* Home Assistant UI shows events with one second accuracy
* Nearly everything in home assistant driven by [core timer](/https://developers.home-assistant.io/docs/architecture/core/) which sends a `time_changed` event every second
* Most integrations use `time_changed` to poll for changes in the external systems they monitor and update state to match
* My assumption was that you get a set of state changes made every second, forming a consistent view that automations run off
* Turns out *nearly* is doing a lot of heavy lifting

# Hypervolt Charger

* Smart Charging at off peak rates during the day
* Want to disable home battery discharge
* Have an automation which tracks when off-peak rates are available
* Used as input by battery management automation which disables discharge during off-peak periods
* Octopus schedule changes frequently, often with delay. Instead look at when charger is active while smart charging is enabled
* Hypervolt charger doesn't use polling, has a websockets API which pushes changes to Home Assistant
* Data is noisy with occasional false starts
* Charger turns on, sometimes reports a little bit of charging current for a few seconds, then turns off
* A "real" charging session triggers off-peak pricing for the entire half-hour period in which it occurs. Other automations take advantage of that. Don't want to get it wrong.
* Ended up using `session_energy` entity which tracks accumulated energy delivered during charging session. In a real charging session you see `hypervolt_charging` turn on and then a few seconds later, see `session_energy` start to climb. Once it gets above `10Wh` assume its a real start.
* Composite automation pattern so have multiple triggers for different parts handled by a choice action

{% include candid-image.html src="/assets/images/home-assistant/hypervolt-on-conditions.png" alt="SQLite Query Results" %}

* The `hypervolt_on` trigger is fired when the `session_energy` threshold has passed. I then check that smart charging is enabled and, in case there's been some funny glitch, that the hypervolt charger is still on. 

# The Case of the Unrecognized Charging Session

* Two charging sessions today
* The Off-Peak electricity helper wasn't turned on for the second session

{% include candid-image.html src="/assets/images/home-assistant/hypervolt-charger-activity.png" alt="Hypervolt Charger Activity" %}

* Looking at the trace for the automation, the `session_energy` trigger fired but the following conditions weren't all satisfied

{% include candid-image.html src="/assets/images/home-assistant/automation-trace.png" alt="Automation Trace" %}

* Unfortunately, Home Assistant only retains the last 5 traces for each automation. The trace I needed disappeared before I had a chance to look at the failing conditions in detail. However, as `session_energy` was the trigger, and `smart_charge` is always on, it must have been because `hypervolt_charging` was off.
* Which doesn't make any sense
* When I check Home Assistant history `hypervolt_charging` and `session_energy` both turned on at 13:30:58
* Surely if they both change at the same time, my automation will either see them both on or both off. Right?

# Event State Consistency

* Looked at details of event bus when [investigating concurrency guarantees]({% link _posts/2025-10-20-home-assistant-concurrency-model.md %})
* The `time_changed` event fires every second. Most components use `time_changed` to trigger polling and then update their state. 
* This is a [standard pattern](https://developers.home-assistant.io/docs/integration_fetching_data/) in Home Assistant. Most components use the provided `DataUpdateCoordinator` class to manage the process. One of the many benefits is that all changes made to entities by the update are applied together before further events are raised.
* Changes to state raise events which can trigger other components to make further changes. However, the processing of those events are added to the end of the queue rather then being handled immediately.
* End result is that all the changes triggered by original `time_changed` event are handled first. Any automations triggered by changes in state should generally see consistent state for all updates that second.
* Hypervolt Charger integration doesn't use polling, changes are pushed
* If each change is pushed separately, then throw in some network weirdness, and my automation could end up seeing an inconsistent state

# Microsecond Resolution

* All times in the Home Assistant UI are shown to the nearest second
* Internally state timestamps use the python `datetime` type which has microsecond resolution
* That resolution is preserved when writing history to Home Assistant's database

# SQLite Web

* HA extension that lets you query HA database
* Gemini generated template SQL for me when I asked Google "How to see events with microsecond resolution in home assistant"
* I hacked it around to look for changes to entities my automation uses

```sql
SELECT 
  sm.entity_id,
  s.state, 
  datetime(s.last_updated_ts, 'unixepoch', 'localtime') AS local_time,
  (s.last_updated_ts - CAST(s.last_updated_ts AS INT)) * 1000000 AS microseconds
FROM states s
INNER JOIN states_meta sm ON s.metadata_id = sm.metadata_id
WHERE sm.entity_id = 'switch.hypervolt_charging' OR sm.entity_id = 'sensor.hypervolt_session_energy'
ORDER BY s.last_updated_ts DESC 
LIMIT 500;
ORDER BY last_updated_ts DESC 
LIMIT 500;
```

* It didn't take long to spot the smoking gun

{% include candid-image.html src="/assets/images/home-assistant/sqlite-query-results.png" alt="SQLite Query Results" %}

* The `session_energy` entity is updated to 94, triggering my automation, 14ms before `hypervolt_charging` is turned on. 

# The Fix

* My first thought was to change the `session_energy` trigger so that it fires once `session_energy` is above the threshold for one second. That would give enough time for the `hypervolt_charging` state to be updated.
* Would work in this case, but what if the `hypervolt_charging` update was delayed for longer? Normally I see `hypervolt_charging` turn on 10-30 seconds before `session_energy` increases. If it can be delayed that long, it can be delayed much longer.
* In the end I decided to add a second, fallback trigger to the automation. I've only ever seen this happen once, so don't need to use a hair-trigger.
* My new trigger fires if `hypervolt_charging` has been on for two minutes, which should be long enough to ignore any false starts.

{% include candid-image.html src="/assets/images/home-assistant/hypervolt-charging-triggers.png" alt="Hypervolt Charging Triggers" %}