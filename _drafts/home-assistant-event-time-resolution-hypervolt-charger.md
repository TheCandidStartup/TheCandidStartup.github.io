---
title: Home Assistant Event Time Resolution
tags: gear home-assistant
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
* Ended up using `session_energy` entity which tracks accumulated energy delivered during charging session. Once that gets above `10Wh` assume its a real start.
* Composite automation pattern so have multiple triggers for different parts handled by a choice action

{% include candid-image.html src="/assets/images/home-assistant/hypervolt-on-conditions.png" alt="SQLite Query Results" %}

* The `hypervolt_on` trigger is fired when the `session_energy` threshold has passed. I then check that smart charging is enabled and, because I'm paranoid, that the hypervolt charger is on. 

# Action didn't run

* Two charging sessions today
* The Off-Peak electricity helper wasn't turned on for the second session

{% include candid-image.html src="/assets/images/home-assistant/hypervolt-charger-activity.png" alt="Hypervolt Charger Activity" %}

* Looking at the trace for the automation, the `session_energy` trigger fired but the following conditions weren't all satisfied

{% include candid-image.html src="/assets/images/home-assistant/automation-trace.png" alt="Automation Trace" %}

* Unfortunately the trace doesn't show you which condition failed. However, as `session_energy` was the trigger, and `smart_charge` is always on, it must have been `hypervolt-charging`.
* Which doesn't make any sense
* When I check Home Assistant history `hypervolt_charging` and `session_energy` both changed at 13:30:58

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

{% include candid-image.html src="/assets/images/home-assistant/sqlite-query-results.png" alt="SQLite Query Results" %}