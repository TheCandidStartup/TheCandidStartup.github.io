---
title: Heat Pump Cold Weather Performance
tags: gear home-assistant
---

We had a cold snap here in the UK. Over a few days, temperatures dropped from consistently over 10°C to days at or below freezing. Perfect weather for dialing in a heat pump. 

# Weather Compensation

Heat pumps run best using [weather compensation](https://www.vaillant.co.uk/advice/understanding-heating-technology/heating-controls/keep-your-home-in-balance-the-benefits-of-weather-compensation/). The amount of heat lost by a house is proportional to the difference in temperature between the outside and inside. Weather compensation uses an external sensor to measure the outside temperature and determine the amount of heat required to match the heat lost. 

We have a [Vaillant Arotherm plus]({% link _posts/2025-10-27-vaillant_arotherm_heat_pump.md %}) heat pump. Vaillant heat pumps use a constant flow rate around the heating circuit. They vary the flow temperature of the water to adjust the heat output. A heat curve parameter is used to map between `targetTemperature - outsideTemperature` and desired `flowTemperature`. The larger the heat curve parameter, the higher the flow temperature and the higher the heat output. 

The initial heat curve setting is calculated based on your expected heat loss. We have an expected heat loss of 6kW at -3°C outside and 17°C inside. That's equivalent to 300W per degree difference. The corresponding heat curve setting is 0.7.

The expected heat loss is an estimate. You typically need to nudge it up or down depending on how close the estimate is to the actual heat loss. This process works best in cold weather when other heat sources (solar gain, occupancy, cooking) are less significant.

The usual rule of thumb is to keep reducing the heat curve every few days, one step at a time, until you're too cold. Then nudge it back up one step and call it done. Since we've had the heat pump installed, I've gradually reduced the heat curve down to 0.55, where it's been for a while. 

In theory you can run the heating system entirely on weather compensation, ignoring the temperature reading from the sensoCOMFORT thermostat. Vaillant calls this "Inactive" mode and is how our system was commissioned. 

During the day we have a target temperature of 17°C. The other members of the household are cold-blooded and start complaining of being too hot if the temperature goes over 18°C. I start to feel properly cold below 16°C. There's a two degree comfortable range that I'm aiming for. 

# Reference Data

I've collected a set of hopefully useful data each day during the cold weather.

| Day | Outdoor °C | Indoor °C | Solar kWh | DHW mins | Daily COP | Insta COP | Power W | Runs |
|-|-|-|-|-|-|-|-|
| 12 | 11.3➤12.5 | 16.7➤16.9 | 0.1 | 100 | 5.53 | 6.0 | 550 | 20% |
| 13 | 10.2➤11.9➤8.1 | 16.3➤17.6➤17.3 | 2.1 | 34 | 5.2 | 5.7➤5.9➤5.3 | 550 | 20% |
| 14 | 7.7➤6.0 | 17.2➤16.7 | 0 | 43 | 4.89 | 5.0 | 600 | 50% |
| 15↑ | 6.5➤8.2➤7.5 | 16.5➤16.9 | 0 | 46 | 5.35 | 5.2➤5.4➤5.3 | 580 | 50% |
| 16↓ | 6➤6.3➤4.2 | 16.8➤17.5➤17.3 | 0.8 | 22 | 4.42 | 4.6➤4.4 | 630 | 66% |
| 17* | 1.7➤4.2➤0.6 | 16.7➤18➤16.9 | 5 | 48 | 3.99 | 4.0➤4.4➤4.1 | 630 | 80% | 
| 18↑↑ | 1➤5.2➤3.9 | 15.9➤15.3➤15.9 | 1.3 | 26 | 4.45 | 4.3➤4.9➤4.5 | 630 | 75% |
| 19* | 0.7➤1.2➤-1.1 | 16.3➤17.1➤16.1 | 1.95 | 86 | 3.72 | 4.0➤4.1➤3.7 | 700➤900 | 100% |
| 20* | -1➤1.5➤0.3 | 16.2➤17.5➤16.9 | 4.19 | 0 | 3.93 | 3.6➤4.2➤4.0 | 900➤650 ➤750 | 100% |
| 21* | -0.5➤2.8➤1.3 | 16.5➤18➤16.9 | 4.32 | 0 | 3.9 | 3.9➤4.2➤4.1 | 850➤650 | 90% |
| 22 | 2.5➤5.7➤4.3 | 15.8➤15.3➤16.5 | 0.45 | 78 | 4.31 | 4.4➤4.2➤4.5 | 650 | 90% |

The table is densely packed, so I have some explaining to do. Each day covers the peak time hours when heating is active with a target temperature of 17°C (6am to 9pm). There's a setback temperature of 15°C after 9pm to help promote sleep. The target temperature drives up during cheap off-peak hours to try and be back at 17°C for the start of the next day.

Days are dates in November 2025. Each day is annotated with significant events. Up (↑) and down (↓) arrows show when I nudged the heating curve up or down one step. Asterisks (*) show when the heat pump defrosted during the day (see more on that below).

Each column can have one, two or three values. There's one entry if the value is a summary for the entire day, or is a continuous changing value that was pretty much constant through the day. Two values describe a roughly linear change during the day starting at 6am with the first value, ending at 9pm with the second value. Three entries describe a curve between 6am and 9pm with the middle value being the maximum or minimum value during the day, depending on the shape of the curve. 

The Outdoor temperature is from the Vaillant sensoCOMFORT external sensor used for weather compensation. Indoor temperature is from the sensoCOMFORT thermostat in the hall. If all's going well it should be 16°C - 18°C.

Solar is energy produced by our solar panels. I'm using it as a crude proxy for the effect of solar gain. At this time of year, anything over 4kWh is a really sunny day. 

DHW is the number of minutes that the DHW circuit is active, and hence the heating is off. Daily COP is the overall COP during peak hours. Insta COP is instantaneous COP reported by [Open Energy Monitoring]({% link _posts/2025-11-10-open-energy-monitoring.md %}) once the heat pump has settled into a steady state during each heating cycle. 

Power is the instantaneous electrical power used by the heat pump. Runs is the percentage of the time that the heat pump is running. The heat pump has a minimum power level around 500-600W. If that produces too much heat, the heat pump has to cycle on and off. 

# Pointless Heating Cycles

I was surprised how low the outside temperature has to get before the heat pump runs continuously. There was always some cycling unless the temperature stayed consistently below 2°C. 

{% include candid-image.html src="/assets/images/home-assistant/pointless-cycles.png" alt="Pointless Cycling" %}

This is late in the day on Nov 17th. It's 1°C outside, 17.1°C inside. The heat curve is 0.55 with a corresponding target flow temperature around 29°C. I thought it would finally be cold enough for the heat pump to run continuously at minimum power. This is as close as it got. COP is 4.1.

When the heat pump starts up, it always has a power profile where it ramps up beyond the power it needs long term and then throttles back. This is normal behavior, just part of the startup sequence needed to get the heat pump running properly. In this case, it adds just enough additional heat to tip the energy integral over the edge and make the heat pump cycle.

It's a catch 22 situation. If the heat pump ran continuously at minimum power there would be no need to cycle. However, the heat pump is cycling, so it can't run continuously at minimum power. 

{% include candid-image.html src="/assets/images/home-assistant/continuous-running.png" alt="Continuous Running" %}

This is from Nov 20th. It's 1.5°C outside, 17.6°C inside. I've turned the heat curve up to 0.65 with a corresponding target flow temperature of 32°C. The heat pump ran continuously all day, at minimum power around midday. COP was also 4.1 despite the higher target flow temperature.

On Nov 21st we're cycling again. It's 2°C outside, which drops the target flow temperature to 31.5°C, just below what can be sustained at minimum power.

# Heating Forecast

I try to [predict]({% link _posts/2025-11-03-home-assistant-heat-pump-myvaillant-emoncms-met-office.md %}) the next day's peak time heating load so that I know how much charge I need to add to my home battery overnight. I don't want to charge to 100%, then find that it's a mild and sunny day and there's nowhere to put the excess solar I've generated. 

The initial implementation was based on limited performance data. At the time, outdoor temperature hadn't gone below 10°C and I was consistently seeing a COP around 5. My installation has a minimum performance guarantee of 380% efficiency, whatever that means. Given the lack of better data, my forecast uses a linear interpolation between a COP of 5 at 10°C and a COP of 3.8 at -3°C.

Now I have much better data. First, it looks like it's reasonable to assume a COP of 5 for temperatures above 6°C. After that it gets complicated and non-linear. However, it doesn't much matter. The point of the forecast is to determine how much to charge the battery. Wtih temperatures below 6°C, the battery will end up being charged to 100% anyway.

I'd still like to get the prediction somewhat close, with minimal effort, so will do a linear interpolation again from COP 5 at 6°C down to COP 4 at 0°C, then extrapolating after that.

{% raw %}

```jinja
{% set forecasts = forecast['weather.met_office_crookes'].forecast | list %}
{% set start = today_at('06:00') + timedelta(days=1) %}
{% set end = today_at('21:00') + timedelta(days=1) %}
{% set ns = namespace(sum=0.0) %}
{% for slot in forecasts %}
  {% set dt = slot.datetime | as_datetime %}
  {% set t = slot.temperature | float %}
  {% if dt >= start and dt < end and t < 14 %}
    {% set cop = 5.0 %}
    {% if t < 6 %}
      {% set cop = 5.0 - (6 - t) * 0.1666 %}
    {% endif %}
    {% set ns.sum = ns.sum + (14 - t) * 0.291 / cop %}
  {% endif %}
{% endfor %}
{{ ns.sum | round(3) }}
```

{% endraw %}

# Double DHW Cycles

{% include candid-image.html src="/assets/images/home-assistant/double-dhw.png" alt="Double DHW cycles overnight" %}

* Started on November 15th when the weather turned colder
* Have a 60 minute window for water heating using noise reduction mode to force low and slow behavior
* Tank sensor gets hot enough to turn off at 62°C but manages to drop 2.5°C within a few minutes, triggering another DHW run. 
* Think this is tank equalizing once DHW cycle ends. Also see dip in temperature that then recovers on milder nights.
* Increased hysteresis to 4°C and reduced window to 40 minutes. 
* Even on coldest night, hot water run taking just over 30 minutes. Also means 30 minutes less cooling time before water used.
* Doesn't matter if cycle is clipped slightly.



# Cold Weather Showers

{% include candid-image.html src="/assets/images/home-assistant/cold-weather-showers.png" alt="Cold Weather Showers" %}

* Nov 19th, 0°C outside, cold water at kitchen tap 7°C.
* Back to back showers using shower dashboard to ensure heat pump at full power and return temp over 55°C.
* Stable temperature at shower head, a little bit more heat than wanted available
* Still worked but maybe lucky that we both had quite quick showers. First was 9 minutes, second 5 minutes.
* Return flow down to 46°C at end of first shower

# Defrosts

* In cold weather ice can build up on the back of the heat pump which reduces performance. The heat pump will [defrost itself when needed](https://www.vaillant.co.uk/advice/understanding-heating-technology/heat-pumps/can-my-heat-pump-defrost-itself/) by reversing operation. It temporarily moves heat from inside the house to heat up the back of the heat pump and melt the ice. 
* The heat pump uses it's own temperature and pressure sensors to determine when a defrost is needed.
* The impact of ice built up is also visible in reduced performance
* Saw my first defrost cycle on Nov 17 when temperature was below 4°C all day.
* Usually one or two during the day
* At coldest point, morning of Nov 19 around 1°C, was defrosting every two hours.

{% include candid-image.html src="/assets/images/home-assistant/defrost-cycle.png" alt="Defrost Cycle" %}

* This cycle on Nov 21 with outdoor temperature at 0°C.
* Defrosts are easily recognized in Open Energy Monitoring from the V shaped flow temperature curve.
* Flow temperature drops below return temperature as heat is removed
* Blue line on graph is instantaneous COP
* Leading into defrost cycle COP is a steady 3.8
* Over a period of 30 minutes, COP falls off a cliff, down to 2.5 when heat pump starts defrost cycle
* Once cycle is over and heat pump has settled down, COP is up to 4.1
* When heating cycle restarts after defrost, seems to be an extra large ramp up before throttling back, resulting in noticeably higher starting flow temperature which in turn can trigger cycling. 

{% include candid-image.html src="/assets/images/home-assistant/heat-pump-defrost-steam.jpg" alt="Heat Pump Defrost Steam" %}

* Captured dramatic image at just the wrong moment
* When I arrived black panel at back of heat pump was white with a thin layer of frost
* Disappears seemingly all at once in clouds of steam (barely visible)
* Missed the most dramatic moment. When heat pump goes back to normal operation one last big cloud of steam is blown out of the front.
* Much more than usual level of condensate, first time I've seen water on the floor
* Fortunately there's a natural slope under the heat pump to the drain. No freezing hazard in front of the heat pump. 

{% include candid-image.html src="/assets/images/home-assistant/defrost-during-dhw.png" alt="Defrost during DHW cycle" %}

* Overnight DHW run, normally lasting from 4.50 to 5.30
* Defrost cycle starts at 5.12 and lasts until 5.18, characteristic V shape with return temperature above flow temperature
* Window not long enough to get water to target of 62°C if there's a defrost. Hot water temperature peaked at 50.5°C.
* Notice that the heat pump doesn't ramp the power up during the DHW cycle and heat output is dropping all the time, showing need for defrost.
* Interesting that it switches to heating circuit before running defrost. Avoids taking the heat from your hot water tank.
* [Chatter](https://community.openenergymonitor.org/t/arotherm-hot-water-starting-outside-schedule/28047/4) on the forums suggests that this is expected, Vaillant Arotherm always takes heat from heating circuit
* Important that it works this way given our NanoStore hot water system. Diverter valve returns water directly to heat pump if temperature below 45°C. Means there wouldn't be enough water volume for effective defrosting if DHW circuit remained active. 
* Heat for defrosting is taken from the circuit inside the house for defrosting. Needs to be enough volume of water that heat can be extracted without the return temperature falling below 13°C. Arotherm Plus 7kw requires 40L. 
* Nothing explicit in Vaillant docs. However, the descriptions of failure codes relating to defrosts always reference the heating circuit.
* If defrost cycle kicks in while you're having a shower in "combi" mode you'll get at most another 5 minutes of hot water before it turns cold. 
* Reduced performance pre-defrost means experience won't have been great before hand either

# Worst Case Scenario DHW Boost

{% include candid-image.html src="/assets/images/home-assistant/long-dhw-boost.png" alt="Long DHW Boost Time" %}

* The first time I saw this I thought I was seeing a defrost with DHW active. Which would have been bad.
* Before DHW cycle heat pump had been running continuously at minimum power with a steady COP of 4.4. None of the tell-tale signs that a defrost is needed.
* If you look really closely you can see that heat pump turned off just *before* the DHW demand came in. The drop in flow temperature is the normal end of heating cycle. Then once DHW circuit is active, some hot water is returned from the NanoStore and gets pumped round the circuit with the heat pump resulting in the rising part of the V.
* It then takes the heat pump much longer than normal to do it's pre-flight checks and power up again to start heating the water
* End result was that it took 22 minutes to be ready for showering rather than the usual 10
* If this happens with an instant how water setup you're going to be left very disappointed

# Hypervolt Charger Current Limit

{% include candid-image.html src="/assets/images/home-assistant/hypervolt-current-limiting.png" alt="Hypervolt Current Limiting" %}

* Hypervolt charger [includes](https://support.hypervolt.co.uk/en/knowledge-base/home-3-pro-installation-guide) an automatic load management (ALM) system which limits overall current coming from the grid by throttling down the charger when needed. 
* Wasn't sure what the installer had set mine to. The three documented settings are 60A, 80A and 100A. My supply fuse is 80A. 
* Finally get to see it in action. Evening of Nov 19. Plugged car in to charger and Octopus scheduled an immediate charge. Home battery was empty after running heat pump continuously all day so that started charging too. One of us was using the shower, so the heat pump was running flat out. Another was cooking adding another 2kW to the overall demand.
* Can see overall import from grid capped at 14kW, with hypervolt power mirroring change in demand from heat pump. Once shower ends, charger is running at full power. 
* UK [nominal voltage](https://www.claudelyons.com/understanding-uk-voltage-supply-variation/) is 230V with a tolerance of +10% to -6%. An upper limit of 14kW is consistent with an ALM limit of 60A at an actual voltage of 233V. 
* Glad that the installer went with the more conservative setting leaving plenty of head room below the supply fuse.

# Heating Curve Adjustments

As outdoor temperatures started dropping over the first four days, I noticed indoor temperatures were also trending down. Still in the comfortable range, but below 17°C all day by Nov 15th. I lost my nerve and nudged the heating curve up.

The following day, indoor temperature peaked at 17.5°C. I decided I'd panicked unnecessarily and nudged it back down. The following day, on the back of strong solar gain, we hit 18°C. 

Temperatures plunged close to freezing overnight, starting the following day at 15.9°C. The house never recovered, staying below 16°C all day. I nudged the curve up around midday, then again a few hours later after it seemed to have made no difference.

The next three days looked good. Indoor temperatures were always in the 16-18°C range. I thought I'd cracked it. Then on the final day temperatures were in the 15.3-16.5°C range.

# Active Mode

* Drunk the cool-aid and have been running in inactive mode until now. "It's the most efficient way of running a heat pump".
* Tune heat curve right and you'll generate the right amount of heat to compensate for your house's heat loss
* Problem is that there are too many other variables to take into account
* Solar gain on sunny days can increase temperature by a couple of degrees
* Increased occupancy, lots of cooking, long sessions on the PlayStation all add heat
* Heating off during DHW runs. With NanoStore you have a DHW run every time you take a shower. Time that heating is off varies unpredictably.
* Energy integral is paused during DHW, so nothing compensates for lost heating. Takes a long time for a perfectly tuned heat curve to recover temperature.
* Defrosts actively remove heat. Again, no compensation for what's been lost.
* Lost my fear of active mode after reading [Mick Wall's blog](https://energy-stats.uk/sensocomfort-room-temp-mod-inactive-active-or-expanded/)
* Active just tweaks the flow temperature by a degree or two. It doesn't cause excessive cycling. It's the equivalent of me nudging the heat curve up or down to try and compensate for solar gain or someone having a long shower.
* Switched to active mode on Nov 23.

| Day | Outdoor °C | Indoor °C | Solar kWh | DHW mins | Daily COP | Insta COP | Power W | Runs |
|-|-|-|-|-|-|-|-|
| 24 | 3.1➤6.3➤3.6 | 16.1➤17.0➤16.9 | 0.47 | 0 | 4.28 | 4.4➤4.7➤4.4 | 640 | 60% |