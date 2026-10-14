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
* Trick is to set target temperature to the minimum, extending the cycle time indefinitely if you get it bang on.
* Problem is flow temperature is a moving target
* Heat pump runs at minimum power (25% compressor modulation) and you get whatever flow temperature you get depending on local conditions. Even worse, it changes during a run depending on how effective your emitters are to using that heat.
* In my case, at this time of year, flow temp at min power goes up steadily during the cycle.
* Start with a best case guess (typical observed value) and update regularly once in steady state
