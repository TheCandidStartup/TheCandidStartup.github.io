---
title: >
  Vaillant Heat Pump: Shoulder Season
tags: gear home-assistant
---

We're often told that heat pumps run best low and slow. The advice is to leave the heating on all the time and let the heat pump use weather compensation to add just the right amount of heat. It's clearly going to be more efficient to have the heat pump running at minimum power 24/7, than at twice the power for half the time. 

What happens when you need *less* heat than the minimum power provides? The heat pump cycles on and off. At the most marginal times of year, it can be on for 20 minutes at a time or less.

Welcome to shoulder season.

# Shoulder Season

The heating has been switched off all summer. The heat pump has been relegated to domestic hot water (DHW) runs. At the end of each run the water in the circuit is at 50-60°C. The heat just sits there, slowly radiating away from the insulated pipes on the outside of the house. Most days we're more concerned with keeping cool rather than worrying about wasted heat.

As the nights start drawing in, we could make use of that heat to give the house a little boost. I added a simple Home Assistant automation to turn the heating on during each DHW run and then turn it off at the end of the heating cycle.

That got me thinking. What else could I do to put off the moment when I had to turn the heating on fully?

Shoulder season has a wide diurnal range. Temperatures drop overnight and the house needs additional heating in the morning. However, the house soon warms up with the heating hardly needed during the middle of the day. On sunny days there's masses of solar gain and the heating may not be needed at all. 

Can we extend the idea of a post-DHW heating cycle to run the heat pump at minimum power until the house is up to temperature, then stop? When (or if)the temperature falls below a threshold, run another heating cycle.

This is similar to Vaillant's [expanded mode](https://energy-stats.uk/sensocomfort-room-temp-mod-inactive-active-or-expanded/#Room_Temp_Mod_Expanded) but with the heat pump forced to run as efficiently as possible. Expanded mode is a blunt instrument with the heat pump forced to stop outside a very narrow range of temperatures, which can lead to short cycles.

# Anatomy of a Heating Cycle

To understand why short cycles are so bad, we need to understand what happens during a heating cycle. 

Vaillant heat pumps control their heat output by modulating the performance of the compressor which drives the movement of heat. The compressor can modulate smoothly between 25% and 100% of its full power.

Each heating cycle starts with the heat pump ramping up quickly to around 40% compressor modulation. This draws around 800W of electrical power on my 7kW model. After a couple of minutes the heat pump controller will adjust the modulation to try and hit a target flow temperature. The target temperature is determined by Vaillant's weather compensation logic and depends on the user's heat curve setting, the current outdoor temperature and the desired indoor temperature.

If the current flow temperature is below target, the compressor will modulate up. If it's above target, the compressor will modulate down. If it's a long way from target, the change will be more aggressive. During shoulder season, the compressor will eventually end up at 25% modulation, with the flow temperature continuing to rise above the target temperature. 

{% include candid-image.html src="/assets/images/home-assistant/heat-cycle-may-day-12c.png" alt="Heat Cycle 12C outside" %}

During mild weather the initial 2 minute burst immediately gets the flow temperature above target. The compressor modulates down to the minimum level but it's too late, the flow temperature keeps climbing. There's an initial burst of heat, followed by a very pronounced dip in performance after the first 10 minutes. The heat pump reaches a steady state, with consistent heat output, after 20 minutes. 

When short cycling, the heat pump doesn't make it through the dip, resulting in a low coefficient of performance (COP) for the cycle as a whole. In contrast, if allowed to run for another 20 minutes at steady state, my heat pump achieves a COP well over 5. 

{% include candid-image.html src="/assets/images/home-assistant/heat-cycle-may-night-6c.png" alt="Heat Cycle 6C outside" %}

During colder weather, the flow temperature is still below target after the initial burst. The compressor ramps up aggressively until the target is hit and then modulates down. Of course, the flow temperature continues to sail up beyond the target because the compressor can't modulate down enough.

# Energy Integral

[Energy Integral](https://energy-stats.uk/vaillant-arotherm-firmware-351-06-07-problems-energy-integral/) is the mechanism Vaillant uses to control cycling of the heat pump when the minimum modulation produces too much heat. Energy integral is implemented as a counter. Every few seconds the difference between the current flow temperature and the target flow temperature is added to the counter. 

If the current flow temperature is too high, the counter goes up. The heating cycle starts with the counter at -60 (can be configured in the settings). If the counter goes over zero, the heating cycle ends. If the current flow temperature is too low, the counter goes down. Once it reaches the starting value, another heating cycle is started.

This system ensures that the average flow temperature matches the target, while smoothing out the effects of short term deviations in flow temperature.

# Hacking the Heat Pump

I'm particularly annoyed by the heat pump's behavior in colder weather. It wastes energy ramping the modulation up to exceed the target temperature as soon as possible. Then wastes more energy because the cycle is then shorter than it would otherwise need to be. 

Is there some way I can hack the heat pump to force it to run at minimum modulation? Unfortunately, there are no settings that let you directly control the compressor level. Everything goes through the weather compensation and energy integral logic.  

Then I read about [Havenwise](https://energy-stats.uk/havenwise-review-vaillant-heat-pump/).

# Havenwise

Havenwise is a cloud based system that takes over control of your heat pump. It uses the same myVaillant API as Home Assistant does. So, how does it work?

The flow of logic in the heat pump is as follows.
1. Use Heating Curve parameter together with outside temperature and desired temperature to calculate target flow temperature.
2. Clamp the target so that it doesn't exceed the range defined by the min and max flow temperature parameters.
3. Feed target and current flow temperatures into energy integral logic which decides how to modulate the compressor and when to end the heating cycle.

Havenwise set the heating curve to it's lowest possible value of 0.1. This produces an incredibly low target flow temperature. Set a minimum temperature above that and you can directly control target temperature. 

Havenwise sidesteps Vaillant's weather compensation logic and uses it's own to directly drive target flow temperature. However, it still relies on Vaillant's energy integral logic to achieve the target flow temperature and handle cycling. 

I want to go one step further. 

# One Step Beyond

The heat pump will cycle if you set target temperature below the minimum that the heat pump can produce. The trick is to keep setting the target temperature to match the current flow temperature. This will extend the cycle time indefinitely if you get it bang on.

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
* Tried forcing cycling after 80 minutes run time with same approach of letting energy integral naturally run down and restart.
* You're ending cycle before you've delivered enough heat, so you don't want to wait too long before starting the next. 
* Even with 20-30 minutes off time, flow temperature doesn't drop enough. Falls back about the same amount as the initial ramp up at start of cycle. You go through all the shutdown and startup costs to end up in steady state no more efficient than when you stopped.
* Does work really well when you don't need that much heat and minimum 40 minute cycle delivers enough heat for an hour or more of down time. 
* Question now is how to best schedule heating cycles through day
* Is current approach of DHW + temperature threshold good enough?

* Best efficiency at night by scheduling heating cycle that transitions into DHW and back to heating
* Starting DHW with 30C+ flow temp avoids wasteful ramp up, shortens time needed for DHW
* Starting follow on heating cycle with flow temp at 65C and high compressor modulation avoids the startup dip
* Can work out heat lost during setback period and then start pre-DHW cycle to replace it all.

# Predicting Overnight Energy Requirement

* Use weather forecast at 21:30 to predict heat loss through until 5:30
* Diff from outside temp to 14C each hour, sum up, multiply by 300W

# Home Assistant Implementation

* Do all the calculations in a template and put result in a variable that other actions can use
* Define variables action lets you define multiple variables

```yaml
variables:
  variable1: "First value"
  variable2: "second value"
```

* First try was to put template logic at top of yaml then return results by defining as many variables as I needed to capture everything
* Didn't work. Action expects explicit yaml for variable definitions with separate templates allowed for each value.
* Have to put all the logic in a value definition and return output of template as a single variable

{% raw %}

```yaml
variables:
  output: >
    {% set v = 0 %}
    {# Calculate whatever v should be #}
    {{ v }}
```

{% endraw %}

* Have to respect indentation of outer structure and indent each line twice
* Visual editor keeps removing line breaks making it hard to manage

# Results

* Gives me twice as much heat, compared with what I put in by running a heat cycle whenever inside temperature drops too low
* For first trial dropped heat loss to 150W but compensated by using apparent temperature in forecast to try and factor in effect of wind
* Still too much
* Looked in detail at model for calculating apparent temperature. Looks at expected heat loss from your face when walking at 3mph.
* Always lower than air temperature, even when no wind, like last night. Not appropriate.
* Conversely during the last storm that came through, could barely maintain overnight temperature while generating 41kWh of heat over 8 hours at 7C outside
* That's 730W per degree using 14C cutoff

# Heat Loss Calculation

* [Heat Loss](https://www.heatgeek.com/articles/heat-geeks-guide-to-understanding-heat-loss-calculations) per degree = Fabric Loss + Air Change Loss
* Fabric Loss = Sum(Surface Area * U value) for all external walls/roofs/floors/doors/windows
* Air Change Loss = Volume of Air * ACH * 0.33 where ACH = Air Changes per Hour
* Heat Geek Design provided to me just gives final heat loss figure + heat loss for each room
* Don't have volume, surface area or U values used so can't see how accurate 300W figure is, or balance between air loss and fabric loss
* The internet says a house like mine (1930s semi with cavity wall insulation + double glazing) is typically one third air loss, two thirds fabric loss
* UK guidance suggests using an ACH of 1.5 for older houses. Latest thinking says this can be a significant overestimate and upgraded house like mine could be as low as 0.5.
* High wind has a big impact on ACH for older houses, in worst cases going as high a 6.
* Looking at plans for my house I reckon volume is about 200m3, which is 66W with an ACH of 1
* If I assume 0.5 ACH in the still conditions where I "measured" actual 150W per degree heat loss, ends up with 33W air loss, 117W fabric loss, potential heat loss range of 150W to 513W depending on wind
* If I go with rule of thumb that air loss is a third I get 50W air loss, 100W fabric loss (ACH=0.75) with a possible range of 150W to 496W
* If Heat Geek used the standard guidance of ACH 1.5, that would give 100W air loss and with the thirds rule of thumb 200W fabric loss which is suspiciously on the money for the 300W figure.
* Another quick snapshot this morning in still conditions with no significant solar gain has 8kWh of heat generated over 6 hours at 8C outside. Which is 220W per degree with a 14C basis.
* 13.49kWH over 12 hours at 8C outside -> 187W
* 6kWh over 12 hours at 9C outside (6pm->6am) -> 100W (significant solar gain during day, could heat have lingered in fabric?)
* Where does 14C cutoff come from? It's to allow for heat generated by occupancy. Assumption is you get 3 degrees for free. If its 14C outside, it'll be 17C inside without any additional heating. With a 300W loss, that's 900W of occupancy heating, which seems high. However, does seem to work in practice.
* Human body produces about 100W, with 3 occupants that's 300W. Base electrical load for house is about 200W. Overnight figure (when heat pump not running). Fridge, freezer, lots of devices on standby. Ultimately all of that energy is converted to heat.
* Let's assume 500W for occupancy. That's 166W per degree for a 14C cutoff.
* That's nicely within the "measured" range of heat loss that I'm seeing in still conditions
* With 0.5 ACH, would break down as 33W air loss and 133W fabric loss. 
* Fabric loss calculation depends on knowing U values. In practice have to use best guess values for type of building construction, erring on the side of caution. Typically 20-50% too high. 200W is a 50% increase on 133W, so still within the realms of plausibility.
* Gives me a range of heat loss between 166W and 529W.
* Let's look at data from storm again. We have 41kWh heat generated over 8 hours at 7C. That's 5.1kW per hour, or 5.6kW including occupancy. With a 10C deltaT between inside and outside, we get 560W heat loss. Close enough to my expected maximum of 529W given margin of error in my "measurements".

* Total emitters (all steel rads) output 11710W at dt50 (radiator 50C hotter than room temperature)
* Plug that into a [heating calculator](https://heatpumptools.co.uk/radiator-flow-temperature-calculator/) and it suggest a flow temp of 50.8C for design temp of -3C outside.
* Looking back at last winter, heat pump actually ran with flow temp of about 38C at -3C
* If I reduce heat loss in calculator by `166/300`, it gives me a flow temperature of, drum roll please, 38.7C.
* My installer recommended a heat curve of 0.7 which is where I've settled. If this was based on design, why is flow temp so much lower
* Using equation that calculates flow temperature given Vaillant Heat Curve and inside and outside temperatures
* `TFlow = a * (HC * (Tset - Tout))^b + Tset` where `a = 2.55` and `b=0.78`
* A heat curve of 0.7 would give, drum roll please, 38.7C at design temperatures
* Which suggests installer knew that calculated heat loss was a massive overestimate. You'd need a heating curve of 1.25 to get a flow temperature of 50.6C.

* Loss=166W, TFlow=38.7C, HC=0.7
* Loss=300W, TFlow=50.6C, HC=1.25
* Loss=500W, TFlow=65.1C, HC=2

* Max target flow temperature set to 55C. If we get a super cold day that is also blowing a gale, we have a wood burner to top up heat
* To a first approximation, ACH [scales linearly](https://industrialmonitordirect.com/blogs/knowledgebase/estimating-building-air-exchange-as-wind-speed-changes) with wind speed. `ACHactual = ACHref * Vactual / Vref`
* UK guidance uses 4.5m/s (16 kn/h) as basis for ACH in heat loss calculations
* Also matches observed experience of minimum heat loss below this speed
* Use ACH=0.5, Speed = 16km/h as basis. Anything below that speed also uses ACH=0.5. Anything above that speed scales ACH linearly. 
* Updated heating forecast logic for overnight runs and extracted as a separate script to make it easier to test/manage

# Home Assistant Implementation

* Define fields for start and end times so you can calculate forecast over any time you want

```yaml
fields:
  start:
    selector:
      datetime: {}
    name: Start
    required: true
  end:
    selector:
      datetime: {}
    name: End
    required: true
```

* Selector defines input control shown in form when you run script manually
* Each field has a name and a key. Key defaults to lower case version of name.
* Can access value of field in any template in the script
* Docs bit vague on how you do that
* First thought was as a variable using the key name
* Put a test case together, ran the script and got error message that `start` was undefined
* Wasted an awful lot of time trying to figure out how to get hold of field values
* In the end seems to be some sort of bug when manually running the script. When you run it, form pops up to set field values with button to run actions.
* Typically first run after making a change it runs as if you didn't set any values in the UI. Run it again and `start` variable is defined and it works.
* My script compares a `datetime` from the forecast with `start` and `end` to see if it's relevant
* Kept getting type errors in comparison
* Whatever selector you use, field values are passed through as strings. You need to add an `as_datetime` filter.
* The `datetime` produced by a field selector doesn't include a timezone. The `datetime` from the weather forecast does. I had to use `as_local` to add the local time zone to the field value before I could use it in a comparison.

* Lots of ideas on how I can reuse script: schedule heating during the day, deciding when to use normal heating, adjusting heat curve to match wind
* Want to calculate and return a few different things from the script
* Should be easy. Response from script is a key/value map that gets assigned to a variable in the calling automation
* You define the response by assigning it to a variable and specifying the variable name to return in the Stop action
* So back to figuring out how to write a template that defines multiple variables in a Define Variables action
* A key/value map variable looks like this

```yaml
variables:
  response:
    key1: "First value"
    key2: "second value"
```

{% raw %}

* I went down a rabbit hole trying to first define a `run` variable that contains multiple values from my forecast template, then using per key templates to extract the appropriate value from `run`.
* Pulling my hair out trying to build a json string value in `run` that `from_json` would accept.
* Kept ending up with double quoted strings
* The trick is to use `{% set %}` and `{% endset %}` around the JSON and then return the defined variable
* To my surprise, Home Assistant parses the JSON automatically and defines a variable with the corresponding key/value map

```yaml
variables:
  result: >
    {# Calculate sum=9.2 and count=8 using Jinja variables #}
    {% set ret %}
    { 
      "heat_kwh": {{ sum }}, 
      "count": {{ count }} 
    } 
    {% endset %} 
    {{ ret }}
```

{% endraw %}

*  Results in 

```yaml
variables:
  result:
    heat_kwh: 9.2
    count: 8
```

