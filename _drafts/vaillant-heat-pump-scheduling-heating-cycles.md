---
title: >
  Vaillant Heat Pump: Scheduling Heating Cycles
tags: gear home-assistant
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

