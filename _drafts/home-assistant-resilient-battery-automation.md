---
title: >
  Home Assistant: Resilient Battery Automation
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

wise words

# Battery Management Automation

* Combine setting target SOC based on solar forecast and overriding battery charge mode when car is charging
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
