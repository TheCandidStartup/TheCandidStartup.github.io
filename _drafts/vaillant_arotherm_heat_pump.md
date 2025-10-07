---
title: Vaillant aroTHERM plus 7kW Air Source Heat Pump
tags: gear
---

wise words

* Heat Geek
* Blakemore Heating and Plumbing
* Survey
  * 6 kW heat loss at -3 degrees C
* Design
  * 45 degree design rather than 55, replaced six crufty old radiators, same footprint, double/triple width
  * 110L MiniStore Tall for hot water as minimal room in airing cupboard where boiler lives
  * MiniStore is small cylinder plumbed in reverse to act as a heat store / "combi"
  * aroTherm plus 7kW with weather compensation and a 0.7 heat curve
  * Expansion vessel, no buffer
  * Single open heating circuit, DHW circuit with switch between the two
* Install date
  * Either earlier week where they would be working two jobs, so Damon only available some of the time
  * Dedicated week end of September
  * In no hurry so went with end of September. Also, just starting cold weather so better time for seeing whether it's working properly

* NanoStore guinea pigs
  * Offer from Heat Geek to be one of the first NanoStore installs
  * Plate heat exchanger
  * Rather than using water as heat store, use metal body of heat exchanger
  * More compact, higher energy density, much better energy transfer
  * Discount and guarantee to replace with MiniStore if it didn't work for us

* Install
  * Text from Damon saying he was needed on another job but the rest of the team would be here first thing Monday
  * Monday: Delivery of materials, including heat pump. NanoStore and radiators, changed four radiators. One radiator missing, one damaged. Boiler left in place for another day of hot water. No heating but not needed, still warm
  * Tuesday: Removed boiler, sited heat pump, started work on external piping, electrician on site installing dedicated consumer unit for Heat Pump
  * Wednesday: Finished most of external work and most plumbing in the airing cupboard. Much swearing wresting with Heat Exchanger
  * Thursday: Final two radiators delivered and changed. Plumbing in the heat exchanger. Done by midday. Filled system, found heat exchanger connection that leaked. Adjusted, tried again. Repeatedly until 7pm.
  * Friday: Damon arrive at 7am to apply his magic touch. Had it working by 8am, then rushed off to another job. Frantic effort to finish everything off and tidy up as storm Amy hit. Damon back at 3pm to hand system over. 

* Thermal Siphoning
  * First proper test on Saturday
  * Tail end of Storm Amy, much colder day. Never above 10 degrees, mostly around 8.
  * Heat pump running but only for DHW cycles, every 60-90 minutes. No heating cycle at all. 
  * Messaged Damon who replied almost instantly. Suggested bumping heat curve right up to 2.2 to give 55 degree flow temp, to force heating to kick in.
  * After a long drawn out few minutes it finally kicked in. Took an hour to get house up to temperature. I went back to design heat curve of 0.7.
  * House stayed at temperature but behavior was the same. A DHW cycle every 60-90 minutes. No heating cycle. COP around 2.5. 
  * Used live monitoring feature on controller to try and work out what was going on.
  * Had to read up on Vaillant's energy integral cycle to control when to turn heat pump on and off when running at minimum output
  * Energy integral never got low enough for heating cycle to start before next DHW cycle.
  * Target flow temperature was around 25 degrees and actual flow temperature was about that or higher most of the time
  * Where was the heat coming from? Given rapid loss of heat from heat exchanger (without airing cupboard or outside of insulation feeling over warm) seemed most likely that it was escaping into the heating circuit.
  * Almost at the same time got a message from Damon saying it was most likely to be thermal siphoning which would need to be fixed by adding no-return valves to the installation. 
  * Turned off the hot water. We can heat on demand when we need it and use immediately.
  * Normal heating cycle kicked in after a couple of hours. Much more reasonable COP around 5.
  * At minimum level heat pump kicks out 3 kW of heat using 600 W of electricity. With a temperature delta of 7 degrees, heat pump was on 50% of the time. Cycle it settled at was 45 minutes on, 45 minutes off. Can tweak the energy integral threshold for starting a new cycle to change cycle length. May try increasing it to see how much more efficient a longer cycle is (and whether it makes room temperature oscillate too much).
  * Damon messaged again the following day. Whole team were heading out for a remote week long job but would send one of them back a day early so they can fit the valves on Friday. Also offered to cover my electricity costs until problem sorted.

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
