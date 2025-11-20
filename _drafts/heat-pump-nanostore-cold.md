---
title: Heat Pump and Heat Geek NanoStore Cold Weather Performance
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
| 17 | 1.7➤4.2➤0.6 | 16.7➤18➤16.9 | 5 | 48 | 3.99 | 4.0➤4.4➤4.2 | 630 | 80% | 
| 18↑↑ | 1➤5.2➤3.9 | 15.9➤15.3➤15.9 | 1.3 | 26 | 4.45 | 4.3➤4.9➤4.5 | 630 | 75% |
| 19 | 0.7➤1.2➤-1.1 | 16.3➤17.1➤16.1 | 1.95 | 86 | 3.72 | 4.0➤4.1➤3.7 | 700➤900 | 100% |

* Nov 12: Outdoor: 11-13°C, Solar: 0.1kWh, Indoor: 16.3-16.9°C, Peak COP: 5.5, Insta COP: 6.0, 550W 20%, HC: 0.55
* Nov 13: Outdoor 8-12°C, Solar: 2.1kWh, Indoor: 16.2-17.6°C, Peak COP: 5.2, Insta COP: 5.8, 550W 20%, HC: 0.55
* Nov 14: Outdoor: 6-8°C, Solar: 0kWh, Indoor: 16.2-17.3°C, Peak COP: 4.9, Insta COP: 5.0, 600W 50%, HC: 0.55
* Nov 15: Outdoor: 6-8°C, Solar: 0kWh, Indoor: 16.1-16.9°C, Peak COP: 5.3, Insta COP: 5.4, 580W 50%, HC: 0.55 -> 0.60
* Nov 16: Outdoor: 4-7°C, Solar: 0.8kWh, Indoor: 16.3-17.5°C, Peak COP: 4.4, Insta COP: 4.6, 630W 66%, HC: 0.60 -> 0.55
* Nov 17: Outdoor: 1-4°C, Solar: 5kWh, Indoor: 16.5-18°C, Peak COP: 4.0, Insta COP: 4.3, 630W 80%, HC: 0.55, Defrost first thing in morning, last thing at night
* Nov 18: Outdoor: 1.5-5.2°C, Solar: 1.3kWh, Indoor: 15.3-16.2°C, Peak COP: 4.4, Insta COP: 4.6, 630W 75%, HC: 0.55-> 0.60 -> 0.65, Couple of defrosts overnight
* Nov 19: Outdoor 0.5-3°C, 770W 100%, HC: 0.65, Defrosts every 2 hours


{% include candid-image.html src="/assets/images/home-assistant/double-dhw.png" alt="Double DHW cycles overnight" %}

* Started on November 14th when the weather first turned colder
* Have a 60 minute window for water heating using noise reduction mode to force low and slow behavior
* Tank sensor gets hot enough to turn off at 62°C but manages to drop 2.5°C within a few minutes, triggering another DHW run. 
* Think this is tank equalizing once DHW cycle ends. Also see dip in temperature that then recovers on milder nights.
* Even on coldest night, hot water run only taking 30 minutes so shortened window. Also means 30 minutes less cooling time before water used.
* Doesn't matter if cycle is clipped slightly.


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

{% include candid-image.html src="/assets/images/home-assistant/cold-weather-showers.png" alt="Cold Weather Showers" %}

* Nov 19th, 0°C outside, cold water at kitchen tap 7°C.
* Back to back showers using shower dashboard to ensure heat pump at full power and return temp over 55°C.
* Stable temperature at shower head, a little bit more heat than wanted available
* Still worked but maybe lucky that we both had quite quick showers. First was 9 minutes, second 5 minutes.
* Return flow down to 46°C at end of first shower
