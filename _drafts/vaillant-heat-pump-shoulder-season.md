---
title: >
  Vaillant Heat Pump: Shoulder Season
tags: gear home-assistant
---

wise words

* Heating off in the summer. Hot water in pipes between heat pump and DHW system just sits there at end of DHW run.
* In early shoulder season could do with that heat to give the house a little boost in the morning
* Run a single heating cycle after DHW run to get left over heat into heating circuit

* Heat Pump wants to run low and slow
* Advice to have heating on all the time
* More efficient to have heat pump running at minimum power 24/7 than at twice the power half the time
* All makes sense but what happens when you need less heat than minimum power provides
* This is shoulder season
* Heat pump cycles on and off - at most marginal times of year can be on for 30 minutes at a time or less
* Barely gets through it's startup sequence (lowest efficiency), doesn't get into steady state running at all
* Also have solar gain, wide diurnal range, heating hardly needed during middle of day
* Want heating off overnight for sleeping comfort
* Can we extend idea of post DHW heating cycle to run heat pump at minimum power until house is up to temperature, then stop
* Hacking heat pump logic
* How energy integral works
* How Havenwise overrides standard logic
* Why does it work? Logic is heating curve produces target flow temperature which is clamped by min/max limits, with result fed into energy integral calculation.
* If you turn heat curve right down, target temperature from heat curve is low. Set a minimum temperature above that and you can directly control target temperature.
* Heat pump will still cycle if you set target temperature below minimum that heat pump can produce
* Trick is to set minimum temperature to match the current flow temperature, extending the cycle time indefinitely if you get it bang on.
* Problem is flow temperature is a moving target
* Heat pump runs at minimum power (25% compressor modulation) and you get whatever flow temperature you get depending on local conditions. Even worse, it changes during a run depending on how effective your emitters are at using that heat.
* In my case, at this time of year, flow temp at min power goes up steadily during the cycle.
* Start with a best case guess (typical observed value) and update regularly once in steady state

* In normal operation energy integral update is suspended during a DHW run and when heating is explicitly turned off. Obviously, house is still losing heat during these periods, so infuriating that heating doesn't come on immediately when requested again.
* Particularly irritating after DHW runs. Heat pump is already running, house is below temperature, no inefficient compressor startup to go through if heating picks up when DHW turns off.
* Online searches find nothing when asked how to reset integral. Google AI summary says it can't be done.
* The trick is to change the parameters that determine target flow temperature, e.g. heating curve and minimum flow temperature. When heating resumes it checks whether parameters were changed and if they have resets energy integral to the starting point. Bingo: heating starts straight away.

* Startup behavior very different for DHW -> Heating vs Standby -> Heating
* For Standby case flow temperature starts to go up steadily as soon as heat pump has passed startup sequence and started using significant power
* For DHW case, flow temperature can be 60C+ which stays steady until cold water from the radiators reaches the sensor, at which point it plummets.
* Wait until temperature below 35C then until flow temperature starts to climb again.
* Tracking actual flow temperature for first few minutes after DHW run is too risky. What happens if I set min flow temp to 65C and then Vaillant cloud access goes down and I'm left with heating running full blast. Compromise is to use 35C as initial value for DHW case (22C for start from Standby). Will take a significant chunk from energy integral before hitting steady state but as long as I can hold integral from then on should be OK.

* Have to rely on Open Energy Monitoring to determine flow temperature and state of system (DHW, Heating or Standby). Vaillant cloud too infrequently updated, too high latency. 
* Have direct sensor on the ESBE value to determine when DHW circuit is active. For Heating vs Standby rely on power consumption of heat pump. Treat anything over 400W as actively heating.
* Managing minimum temperature is a balancing act. Don't want to update too frequently and hit Vaillant API rate limit. Don't want to be too far above current temp as heat pump will ramp up from minimum power. Don't want to be too far below as will eat up energy integral.
* After lots of trial and error came up with approach where I update minimum if current is over a degree different. I set minimum to 0.5C above actual and the threshold where I will update minimum another 0.5C past that.
* Idea is that actual will be under minimum roughly for same amount of time that it's over minimum.

* Slowed down rate of progress, but energy integral still being consumed.
* Temperature measured by OEM is less than the value reported in the Vaillant live monitor. The sensors are in different places (in the airing cupboard vs in the heat pump). There's 10 seconds latency on the OEM data but close to zero for the value used by the heat pump.
* Live monitor reports target flow temperature to nearest 0.5C. Don't know whether that's just display or actual value used in energy integral calculation.
* To save my sanity made sure that the minimum I set is also rounded to 0.5C. I account for difference in temperatures measured by vaillant and OEM, I biased the threshold so that OEM actual is between 0.7C below and 0.3C above target.

* Can now run for as long as I like at minimum
* Problem is that COP gets worse the longer you let it run. Starts at 5.5+ and then degrades to 4.5
* Flow temperature keeps going up (flattens out at around 34C)
* DeltaT stays pretty much the same, around 2C. Maybe a little wider at higher flow temp but not significant
* As flow temp goes up, the heat pump draws more power to support the higher temperature, even though compressor is at the same minimum 25% rate throughout.

* Can actually get better efficiency by letting heat pump cycle, so it spends more time at the most efficient flow temperatures
* Put a cap on increase in minimum flow temperature. Doesn't stop temperature going up, but does mean energy integral gets consumed, triggering end of cycle.
* Keep heating active so pump keeps working. Wait for flow temp to fall back to 23C, ready to start again.
* Tried resetting energy integral by messing with heat curve but couldn't get it to work without turning off heating, waiting a few minutes for everything to settle down and then restarting.
* Tried increasing flow temp to 35C so that energy integral would quickly fall back to starting point. Instead, this immediately starts a new heating cycle *without* resetting energy integral. Starts with current value so you get a really short cycle.
* In the end left minimum flow temp at level it reached (typically limit of 30C) and let energy integral fall back naturally. Usually gets back to start around the time that flow temp gets back to 23C.
