---
title: >
  Vaillant Heat Pump: Scheduling Heating Cycles
tags: heat-pump home-assistant
---

wise words

# Long Cycles

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

# Reflection


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

* Use weather forecast at 21:30 to predict heat loss from 21:00 through until 5:00
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
* Plug that into a [heating calculator](https://heatpumptools.co.uk/radiator-flow-temperature-calculator/) with my 6110W heating requirement and it suggests a flow temp of 49.8C for design temp of -3C outside.
* Looking back at last winter, heat pump actually ran with flow temp of about 38C at -3C
* If I reduce heat loss in calculator by `166/300`, it gives me a flow temperature of, drum roll please, 38.5C.
* My installer recommended a heat curve of 0.7 which is where I've settled. If this was based on design, why is flow temp so much lower?
* Using equation that calculates flow temperature given Vaillant Heat Curve and inside and outside temperatures
* `TFlow = a * (HC * (Tset - Tout))^b + Tset` where `a = 2.55` and `b=0.78`
* A heat curve of 0.7 would give 37C at design temperature
* Which suggests installer knew that calculated heat loss was a massive overestimate. You'd need a heating curve of 1.3 to get a flow temperature of 49.4C.

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
* Or maybe HA is parsing as python literal maps and arrays which just happen to have same syntax as JSON?

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

* Good test of solar gain, November 10th. Blue sky and sunshine all day. No wind. Between 2°C and 5°C outside.
* Heating cycle ended at 10am and then had enough solar gain to keep house warm until 3pm
* Average temperatures for each hour 2.5, 3.5, 4.5, 5 and 5. House at 17°C.
* Two people in the house, so assume 400W from occupancy.
* Heat loss should be `(14.5 + 13.5 + 12.5 + 12 + 12) * 166Wh - 5 * 400Wh = 8.7kWh`
* Calculating solar gain from building orientation and glazing is complex. Use generation from solar panels as a proxy.
* Generation from solar panels during this time is 4.8kWh. So, can use forecast solar generation * 1.8 as an estimate for solar gain.

| Heat Curve | Design Flow Temp |
| 0.6 | 34.7 |
| 0.65 | 35.9 |
| 0.7 | 37.0 | 
| 0.75 | 38.1 |
| 0.8 | 39.2 |
| 0.85 | 40.2 | 
| 0.9 | 41.3 |
| 1.0 | 43.4 | 
| 1.6 | 55.1 |

* Heating Calculator: design heat loss = 20*heat loss, -3C design outside, 17C room temp, heating balance temp set to get constant gains of 500W (e.g. 14C at 166W), flow return deltaT=5

| Heat Loss | Design Flow Temp | Heat Curve |
| 150 | 34.8 | 0.6
| 160 | 35.7 | 0.65
| 166 | 36.2 | 0.65
| 170 | 36.5 | 0.7
| 180 | 37.5 | 0.7
| 190 | 38.4 | 0.75
| 200 | 39.2 | 0.8
| 250 | 43.5 |
| 300 | 47.4 | 
| 350 | 51.3 | 
| 400 | 55 | 

* Trying to work out what heat curve will produce required heat over forecast period
* Required heat already takes constant gains into account
* Treat heat curve logic as machine that will produce `x * deltaT` watts
* Vaillant logic doesn't handle constant gains apart from turning off heat pump at threshold outdoor temperature
* Rerun calculation *without constant gains* to get design flow temp for given value of `x`
* Calculate total `deltaT` over forecast period, then `x = heat required / total deltaT`

| Heat Loss | Design Flow Temp | Heat Curve |
| 150 | 37 | 0.7
| 160 | 37.9 | 0.75
| 166 | 38.5 | 0.75
| 170 | 38.8 | 0.8
| 180 | 39.7 | 0.8
| 190 | 40.7 | 0.85
| 200 | 41.4 | 0.9
| 250 | 45.5 |
| 300 | 49.4 | 
| 350 | 53.2 | 
| 400 | 56.8 | 
| 450 | 60.3 |
| 500 | 63.8 | 

* Overnight run 17 Nov
* Heat Required 17.5kWh
* Calculated heat curve 1.1
* Heating much too quickly
* Dropped heat curve to 0.85 at 1:48, then to 0.75 at 2:16
* Still generated 18.438kWh overall

| Time | Current Temp | Desired Temp | Outside Temp | DeltaT | Heat Generated | Target Flow Temp | Average Flow Temp | Flow Temp Profile | Steady State
| 23:30 | 15.8 | 15 | 1.7 | 6 (startup) | 3.311 | 35.67 | 29.5 | 15 -> 37 | Ramping up
| 00:00 | 15.6 | 15.5 | 1.6 | 2.56 | 1.858 | 36.9 | 35.9 | 37 -> 34.8 | Ramping down
| 00:30 | 16.3 | 15.5 | 1.6 | 2.24 | 1.633 | 36.9 | 34.8 | 34.8 | 850W -> 35.0 -> 3150W
| 01:00 | 16.4 | 16 | 1.6 | Defrost | 1.950* | 36.42 | 34.8 | 34.8 -> 14.5 -> 38.3 | Defrost
| 01:30 | 16.6 | 16 | 1.3 | 2.14 | 1.599 | 34.28 -> 32.58 | 36.4 | 38.3 -> 34.8 | Ramping down
| 02:00 | 16.8 | 16.5 | 1.0 | 1.82 | 1.022* | 35.55 -> 33.78 | 32.1 | 34.8 -> 12.9 -> 34.5 -> 32.9 | 700W -> 34.2 -> 2550W
| 02:30 | 16.9 | 16.5 | 1.0 | 1.84 | 1.722 | 33.78 | 33.7 | 34.6 -> 34.5 -> 33.3 -> 34.3 | 660W -> 33.2 -> 2550W
| 03:00 | 16.9 | 17 | 0.8 | Defrost | 1.773* | 34.89 | 33.0 | 34.3 -> 8.6 -> 37.0 | Defrost
| 03:30 | 16.9 | 17 | 0.7 | 2.23 | 1.585 | 34.97 | 35.3 | 37.0 -> 34.6 | 820W -> 34.5 -> 3100W
| 04:00 | 16.9 | 17 | 0.7 | 2.24 | 1.457 | 34.97 | 32.9 | 34.6 -> 13.9 -> 36.0 | 820W -> 34.5 -> 3100W
| 04:30 | 17 | 17 | 0.8

* Active mode reducing flow temp when current temp above desired
* Still more heat than needed judging by rate of temperature increase
* Assumed deltaT of 5 at design temp of -3°C when using heating calculator to determine flow temp for given heat output
* Biggest deltaT I saw was 2.24 at 0.7°C with a flow temp of 34.5°C. Not convinced we'll actually see 5 at -3°C
* Try redoing calculation with 0.7°C as design temperature, then adjust heat loss until we get 34.5°C out.
* Get 168w/k heat loss
* Heat Curve at 0.7°C design temperature

| Heat Curve | Design Flow Temp | Heat Loss
| 0.6 | 32.1 | 137
| 0.65 | 33.1 | 150
| 0.7 | 34.0 | 162
| 0.75 | 35.0 | 175
| 0.8 | 35.9 | 187
| 0.85 | 36.8 | 200
| 0.9 | 37.7 | 212
| 0.95 | 38.6 | 225
| 1.0 | 39.5 | 238
| 1.05 | 40.4 | 251
| 1.1 | 41.2 | 263

* How does that compare with actual measured heat output at steady state? What heat curve and heat loss coefficient would that correspond to?
* Steady state is when flow temp, heat output and outside temperature (OAT) have all been stable for an hour. Then take values in the middle of the hour.
* `HLC = output / (17-OAT)`
* Heat Curve is one whose calculated flow temp is closest to actual
* Heat curves are spaced so that flow temperatures for neighbouring curves are about 1°C apart
* HC error is value to add to calculated flow temp to get actual
* Ordered by heat curve, then HLC for samples with same heat curve

| Outside | Flow Temp | DeltaT | Output | Heat Loss Coefficient | Heat Curve | HC Error
| 1.6 | 30.9 | 1.90 | 2550 | 166 | 0.55 | 0.4
| 1.9 | 32.5 | 2.02 | 2800 | 185 | 0.65 | 0.36
| 0.5 | 34.03 | 2.29 | 3190 | 193 | 0.7 | -0.16
| 1.9 | 32.99 | 2.17 | 3000 | 199 | 0.7 | -0.05
| 3.4 | 31.96 | 2.00 | 2760 | 203 | 0.7 | 0.17
| 3.4 | 32.12 | 2.02 | 2790 | 205 | 0.7 | 0.33
| 0.7 | 34.5 | 2.24 | 3100 | 190 | 0.75 | -0.47
| 5.8 | 31.9 | 1.89 | 2630 | 235 | 0.85 | 0.11
| 2.7 | 35.42 | 2.45 | 3400 | 238 | 0.9 | -0.29
| 1.7 | 38.13 | 2.84 | 3960 | 259 | 1.0 | -0.28

* Reality is messy so some outliers (e.g heat curve 0.75 with smaller HLC than the heat curve 0.7 samples)
* Heating Curve logic apparently implemented using lookup tables. Wouldn't be surprised if inputs and outputs rounded to nearest 0.5°C. Another source of errors.
* Feel confident about the heat curve 0.7 values. Nice error bracket. Happy to go with actual HLC of 200W for 0.7 heat curve.
* Actual HLC is higher than all the calculations I tried. 
* For 0.7 heat curve I calculated 150, 162, 166 and 170.
* Makes sense if you think about what the heating calculator is for. Used by heating engineer to size radiators for each room. If like rest of heat loss calculation, will be conservative.
* Explains why heating overnight so over the top
* How come heat curve of 0.7 worked last winter if actual HLC for house is 166W?
* I initially ran in inactive mode and tried dialling in the curve. Reduced it to 0.55 at one point but kept running in days house too cold.
* Based on measurements in table above 0.55 is right for a HLC of 166W. However, that only applies in light wind. On a windy day, ACH will be higher and could easily need 200W or more.
* In the end I went back to 0.7 and Active mode. Active mode adjusts flow temperature by [up to 3°C](https://energy-stats.uk/sensocomfort-room-temp-mod-inactive-active-or-expanded/#More_Inactive_versus_Active), which is equivalent to 3 steps of heating curve. i.e. Active mode and heat curve of 0.7 effectively adjusts heat curve between 0.55 and 0.85.

# Defrosts

* Never thought I'd be running in shoulder mode when defrosts happen
* Defrost effectively starts the heating cycle again, taking flow temperature down to 15°C or less
* Current logic only moves target temperature up. After defrost, heat pump's logic ramps up quickly to get back to where it was. Inevitably overshoots by a couple of degrees and ratcheting target temperature higher.
* Have a limit of 700W where I stop increasing, but still not ideal
* Interestingly, the crazy ramp means the heat pump ends up putting out more heat than without the defrost (at terrible efficiency)
* Updated my heat pump state template sensor to distinguish between Active and Defrost states. Defrost if enough power for heat pump to be active but return temperature is higher than flow.
* During the day I don't need the aggressive ramp up. Treat end of defrost like a new heating cycle and reset target.
* Can add 10% margin when deciding between shoulder or normal heating to account for possibility of defrosts. Continuous minimum running only needed below 2°C outside, so definitely in defrost territory when at the limit.
* For overnight running where we want to hit temperature at fixed time, can still ramp up aggressively to get back what we lost. Probably try tempering a little, setting target to ramp to a couple of degrees below target to allow for overshoot.