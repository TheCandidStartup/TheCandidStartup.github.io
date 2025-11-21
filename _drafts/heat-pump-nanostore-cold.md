---
title: Heat Pump Cold Weather Performance
tags: gear home-assistant
---

wise words

| Day | Outdoor °C | Indoor °C | Solar kWh | DHW mins | Daily COP | Insta COP | Power W | Runs |
|-|-|-|-|-|-|-|-|
| 12 | 11.3➤12.5 | 16.7➤16.9 | 0.1 | 100 | 5.53 | 6.0 | 550 | 20% |
| 13 | 10.2➤11.9➤8.1 | 16.3➤17.6➤17.3 | 2.1 | 34 | 5.2 | 5.7➤5.9➤5.3 | 550 | 20% |
| 14 | 7.7➤6.0 | 17.2➤16.7 | 0 | 43 | 4.89 | 5.0 | 600 | 50% |
| 15↑ | 6.5➤8.2➤7.5 | 16.5➤16.9 | 0 | 46 | 5.35 | 5.2➤5.4➤5.3 | 580 | 50% |
| 16↓ | 6➤6.3➤4.2 | 16.8➤17.5➤17.3 | 0.8 | 22 | 4.42 | 4.6➤4.4 | 630 | 66% |
| 17 | 1.7➤4.2➤0.6 | 16.7➤18➤16.9 | 5 | 48 | 3.99 | 4.0➤4.4➤4.1 | 630 | 80% | 
| 18↑↑ | 1➤5.2➤3.9 | 15.9➤15.3➤15.9 | 1.3 | 26 | 4.45 | 4.3➤4.9➤4.5 | 630 | 75% |
| 19 | 0.7➤1.2➤-1.1 | 16.3➤17.1➤16.1 | 1.95 | 86 | 3.72 | 4.0➤4.1➤3.7 | 700➤900 | 100% |
| 20 | -1➤1.5➤0.3 | 16.2➤17.5➤16.9 | 4.19 | 0 | 3.93 | 3.6➤4.2➤4.0 | 900➤650 ➤750 | 100% |

* Nov 12: Outdoor: 11-13°C, Solar: 0.1kWh, Indoor: 16.3-16.9°C, Peak COP: 5.5, Insta COP: 6.0, 550W 20%, HC: 0.55
* Nov 13: Outdoor 8-12°C, Solar: 2.1kWh, Indoor: 16.2-17.6°C, Peak COP: 5.2, Insta COP: 5.8, 550W 20%, HC: 0.55
* Nov 14: Outdoor: 6-8°C, Solar: 0kWh, Indoor: 16.2-17.3°C, Peak COP: 4.9, Insta COP: 5.0, 600W 50%, HC: 0.55
* Nov 15: Outdoor: 6-8°C, Solar: 0kWh, Indoor: 16.1-16.9°C, Peak COP: 5.3, Insta COP: 5.4, 580W 50%, HC: 0.55 -> 0.60
* Nov 16: Outdoor: 4-7°C, Solar: 0.8kWh, Indoor: 16.3-17.5°C, Peak COP: 4.4, Insta COP: 4.6, 630W 66%, HC: 0.60 -> 0.55
* Nov 17: Outdoor: 1-4°C, Solar: 5kWh, Indoor: 16.5-18°C, Peak COP: 4.0, Insta COP: 4.3, 630W 80%, HC: 0.55, Defrost first thing in morning, last thing at night
* Nov 18: Outdoor: 1.5-5.2°C, Solar: 1.3kWh, Indoor: 15.3-16.2°C, Peak COP: 4.4, Insta COP: 4.6, 630W 75%, HC: 0.55-> 0.60 -> 0.65, Couple of defrosts overnight
* Nov 19: Outdoor 0.5-3°C, 770W 100%, HC: 0.65, Defrosts every 2 hours

# Heating Forecast

* Original version assumed COP = 5 over 10°C, then linear interpolation down to 3.8 at -3°C due to lack of data
* Seems reasonable to assume COP of 5 down to 6°C
* Gets complicated and non-linear below that. However, doesn't much matter. Point is to determine how much to charge battery. Below 6°C battery will end up being charged to 100% anyway.
* Still like to get prediction close, so will do a linear interpolation again from COP 5 at 6°C down to COP 4 at 0°C, then extrapolating after that.

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

* Started on November 14th when the weather first turned colder
* Have a 60 minute window for water heating using noise reduction mode to force low and slow behavior
* Tank sensor gets hot enough to turn off at 62°C but manages to drop 2.5°C within a few minutes, triggering another DHW run. 
* Think this is tank equalizing once DHW cycle ends. Also see dip in temperature that then recovers on milder nights.
* Even on coldest night, hot water run only taking 30 minutes so shortened window. Also means 30 minutes less cooling time before water used.
* Doesn't matter if cycle is clipped slightly.

# Pointless Heating Cycles

{% include candid-image.html src="/assets/images/home-assistant/pointless-cycles.png" alt="Pointless Cycling" %}

* Nov 17th. 1°C outside, 17.1°C inside. Heat Curve 0.55. Target flow temperature 29°C. 
* Thought it would finally be cold enough for heat pump to run continuously at lowest power
* This as close as it got. COP 4.1
* When heat pump starts up it always has this power profile where it ramps up beyond the power it needs long term and then throttles back.
* In this case it does just enough to tip the energy integral over the edge and make the heat pump cycle
* If it just ran at minimum power it would be fine

{% include candid-image.html src="/assets/images/home-assistant/continuous-running.png" alt="Continuous Running" %}

* Nov 20th. 1.5°C outside, 17.6°C inside.  Heat Curve 0.65. Target flow temperature 32°C.
* Heat pump running continuously all day. COP also 4.1 despite higher target flow temperature due to higher heat curve. 
* Nov 21. 2°C outside, 17.6°C inside. Heat Curve 0.65. Target flow temperature 31.5°C. Just warm enough to throw some cycles in. 

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

* Overnight DHW run, normally lasting from 5.00 to 5.30
* Defrost cycle starts at 5.23, before water is up to temperature
* Notice that the heat pump doesn't ramp the power up during the DHW cycle and heat output is dropping all the time, showing need for defrost.
* Interesting that it switches to heating circuit before running defrost. Avoids taking the heat from your hot water tank.
* Still an unpleasant surprise if you're having a shower with heat pump running full blast DHW NanoStore combi mode when defrost cycle kicks in.
* Reduced performance pre-defrost means experience won't have been great before hand either

# Hypervolt Charger Current Limit

{% include candid-image.html src="/assets/images/home-assistant/hypervolt-current-limiting.png" alt="Hypervolt Current Limiting" %}

* Hypervolt charger [includes](https://support.hypervolt.co.uk/en/knowledge-base/home-3-pro-installation-guide) an automatic load management (ALM) system which limits overall current coming from the grid by throttling down the charger when needed. 
* Wasn't sure what the installer had set mine to. The three documented settings are 60A, 80A and 100A. My supply fuse is 80A. 
* Finally get to see it in action. Evening of Nov 19. Plugged car in to charger and Octopus scheduled an immediate charge. Home battery was empty after running heat pump continuously all day so that started charging too. One of us was using the shower, so the heat pump was running flat out. Another was cooking adding another 2kW to the overall demand.
* Can see overall import from grid capped at 14kW, with hypervolt power mirroring change in demand from heat pump. Once shower ends, charger is running at full power. 
* UK [nominal voltage](https://www.claudelyons.com/understanding-uk-voltage-supply-variation/) is 230V with a tolerance of +10% to -6%. An upper limit of 14kW is consistent with an ALM limit of 60A at an actual voltage of 233V. 
* Glad that the installer went with the more conservative setting leaving plenty of head room below the supply fuse.
