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


# Anatomy of heating cycle

* Initial fast ramp up to 40% compressor modulation, about 800W of power
* Hold steady for 2 or 3 minutes. Presumably building up performance data history for pid controller
* Now apply pid logic to adjust compressor modulation to try and match target temperature
* About 10 minutes in there seems to be some kind of internal gear change. Flow temperature from the heat pump loses momentum, presumably
heat being directed somewhere internal. Takes 5 minutes to get back to normal.
* Now transition into steady state running
* Ideally heat pump will have zeroed in on compressor modulation required to maintain desired flow temp
* In shoulder season HP ends up at minimum 25% modulation and flow temperature slowly rises until energy integral ends the cycle

{% include candid-image.html src="/assets/images/home-assistant/heat-cycle-may-day-12c.png" alt="Heat Cycle 12C outside" %}

* During mild weather the initial 2 minute burst gets flow temp above target
* Compressor modulates down to minimum but its too late, temp keeps climbing
* Gear change is very pronounced with flow temperature dropping and then recovering
* Heat pump is working extra hard during the dip, using more power, which accentuates the dip in COP
* Barely gets through it's startup sequence, in extreme cases doesn't get into steady state running at all
* Instant COP outside the dip well over 5

{% include candid-image.html src="/assets/images/home-assistant/heat-cycle-may-night-6c.png" alt="Heat Cycle 6C outside" %}

* During cold weather, flow temp is still below target after initial burst
* pid controller ramps up compressor until target is hit
* Now ramps down to minimum but flow temp keeps sailing up
* Instant COP in steady state below 5

# Shoulder Season Mode

* Also have solar gain, wide diurnal range, heating hardly needed during middle of day
* Have set back overnight for sleeping comfort
* Can we extend idea of post DHW heating cycle to run heat pump at minimum power until house is up to temperature, then stop
* Once temp falls below threshold, run another heating cycle
* Similar to expanded mode but heat pump forced to run at minimum power with no cycles
* Expanded mode more of a blunt instrument. Still uses energy integral cycle but adds a hard stop once above desired range, then resume once below.

# Hacking the Heat Pump

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

* In normal operation energy integral update is suspended during a DHW run. Obviously, house is still losing heat during these periods, so infuriating that heating doesn't come on immediately when requested again.
* Heat pump is already running, house is below temperature, no inefficient compressor startup to go through if heating picks up when DHW turns off.
* The trick is simply to turn the heating off, wait for heat pump to go into idle state, then turn back on. Heating starts immediately with energy integral reset.
* Leave heating "off" by default. Turn on when needed to trigger a heating cycle, then turn off when cycle ends. Use DHW run and inside temperature below threshold as triggers.

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
* To save my sanity made sure that the minimum I set is also rounded to 0.5C. To account for difference in temperatures measured by vaillant and OEM, I biased the threshold so that OEM actual is between 0.7C below and 0.3C above target.

* Can now run for as long as I like at minimum
* Problem is that COP gets worse the longer you let it run. Starts at 5.5+ and then degrades to 4.5
* Flow temperature keeps going up (flattens out at around 34C)
* DeltaT stays pretty much the same, around 2C. Maybe a little wider at higher flow temp but not significant
* As flow temp goes up, the heat pump draws more power to support the higher temperature, even though compressor is at the same minimum 25% rate throughout.

* Can actually get better efficiency by letting heat pump cycle, so it spends more time at the most efficient flow temperatures
* Put a cap on increase in minimum flow temperature. Doesn't stop temperature going up, but does mean energy integral gets consumed, triggering end of cycle.
* Keep heating active so pump keeps working. Wait for flow temp to fall back to 23C, ready to start again.
* Explicitly resetting energy integral can only be done by turning off heating, waiting a few minutes for everything to settle down and then restarting.
* Tried increasing flow temp to 35C so that energy integral would quickly fall back to starting point. Instead, this immediately starts a new heating cycle *without* resetting energy integral. Starts with current value so you get a really short cycle.
* In the end left minimum flow temp at level it reached (typically limit of 30C) and let energy integral fall back naturally. Usually gets back to start around the time that flow temp gets back to 23C.

* Current strategy for managing minimum flow temp stops the energy integral from being consumed. However, realized that compressor doesn't reach minimum modulation until steady state running. Unsurprisingly, if you keep target close to actual, the pid controller will keep modulation steady. It's not incentivized to drop it until we hit the limit for moving the target up.
* Switched my strategy for the first 10 minutes of a cycle, or until HP electrical power falls below 600W. During this time we keep target just below actual. Energy integral is consumed, but slowly. pid controller always ramps down after the initial burst.

# The Dip

* Obsessed by the dip in heat pump performance after 10 minutes
* Not just my heat pump - see the same thing for lots of other Vaillants on HeatPumpMonitor.org
* Also lots of Vaillants that don't have a dip. They have initial ramp up of power, then fall gracefully back to steady state
* Also weather dependent. Dip is most pronounced during mild conditions, as it gets colder it becomes more of a plateau
* Initially assumed that compressor was modulating up during dip due to increased power consumption
* When I stood and watched what was happening on live monitor, saw that compressor ramped down to 25% in first few minutes and stayed there through the run. The extra power consumption is because the heat pump is working extra hard.

* At start of cycle flow temperature shoots up as compressor driven to initial 40% modulation
* It takes 2 minutes before return temperature goes up
* Flow rate is 20L/min, which means there's 40L of water on shortest path round heating circuit
* Radiators are plumbed BBOE (bottom to bottom opposite ends) so minimum path is pipes + along the bottom of each radiator
* Radiators have a volume of 50L which suggests a total volume of up to 90L
* As the water continues to circulate cold water from the top of the radiators is mixed in to return flow
* The heat pump doesn't have to work hard to raise the temperature of cold water by 2-3 degrees
* Flow temp rises very quickly, faster than return temp. Heat pump is overperforming due to inertia of cold water. Will have to be paid back.
* Once it modulates down to 25%, power consumption is only a little over 400W, deltaT hits 3 degrees, creating the massive spike in COP
* As all the water reaches temperature, compressor has to work harder.
* Heat pump works by pumping coolant around an evaporate/condense cycle
* As temperatures go up, the heat pump needs more coolant in the circuit which it draws from an internal reservoir
* Some of the heat that would otherwise go into heating water is taken by the additional coolant
* Combination of heat taken up by coolant, water reaching consistent temperature triggering payback of out performance causes dip
* Maybe

# Reflection

* Can run heating cycle at minimum (after inescapable startup ramp) for as long as I want
* Roller coaster first 20 minutes until system hits steady state
* Want at least 20 minutes after hitting steady state to payback startup costs
* Instant COP declines as flow temperature continues to rise, with reduction in overall COP after another 20-40 minutes
* Don't cut heating cycles short, don't let them run indefinitely
* Question now is how to best schedule heating cycles through day
* Is current approach of DHW + temperature threshold good enough?

* Best efficiency at night by scheduling heating cycle that transitions into DHW and back to heating
* Starting DHW with 30C+ flow temp avoids wasteful ramp up, shortens time needed for DHW
* Starting follow on heating cycle with flow temp at 65C and high compressor modulation avoids the startup dip
* Could work out heat lost during setback period and then start pre-DHW cycle to replace it all.
