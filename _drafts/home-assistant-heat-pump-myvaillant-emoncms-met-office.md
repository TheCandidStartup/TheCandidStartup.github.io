---
title: >
  Home Assistant Heat Pump: myVaillant, Emoncms and Met Office
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

wise words

* Predicting energy use
  * Heat loss formula is Heat Loss = House specific constant x dT
  * Design says 6.11 kW heat loss at 18 degrees inside, -3 outside
  * dT = 21, therefore heat loss is 291 W per degree
  * Passive gain equivalent to three degrees an hour from occupant heat, solar gain, other electricial devices. Equivalent to target temperate - OT threshold (cut off below which heat pump won't bother turning on)
  * Get hourly weather forecast and determine dT for each hour
  * Sum up 291 * dT for each hour to get Wh of heat needed
  * Electricity needed to generate that heat is heat needed / COP. 
  * Design gives minimum efficiency guarantee of 3.8 at max 45 degrees flow rate (dT up to 21 degrees)
  * Measured efficiency of 5 running at minimum output at 10 degrees outside.
  * Actual COP [depends on](https://energy-stats.uk/how-to-measure-vaillant-arotherm-cop/) your installation, outside temperature and flow temperature
  * Given fixed target temperature, fixed installation, flow temp is a function of outside temperature (via heat curve)
  * Pragmatic approach is to measure COP at different outside temperatures and use a lookup table for expected COP given expected temperature

* Jinja
  * Can't modify variables defined at outer scope (e.g. increment sum inside a loop)
  * Have to create a namespace object to hold the variable which can be modified from any scope

* Stats
  * Split electric/heat energy from open energy monitoring into heating and hot water using utility meter (daily)
  * Energy stats for myVaillant are too coarse grained and infrequently updated
  * Calculate COP for each per day just before daily reset, also time when nothing running.
  * More complicated to get fine grained COP and also less meaningful as dependent on where cycle boundaries lie
  * Hack to make stats somewhat useful. Mark entity as `unavailable` for period during day before COP calculated.
  * Avoids having previous days value used for average/max/min
  * Average of daily COP across year is NOT SCOP. For that need to calculate total energy output/used. Which would need a custom dashboard card with `energy-date-selection` integration. Or read off the graphs and use a calculator if you really want to know ...
  