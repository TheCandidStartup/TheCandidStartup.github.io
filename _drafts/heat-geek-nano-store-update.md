---
title: Heat Geek NanoStore Update
tags: gear
---

How it all turned out in the end

# Double DHW Cycles in Cold Weather

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

# Worst Case Scenario DHW Boost

{% include candid-image.html src="/assets/images/home-assistant/long-dhw-boost.png" alt="Long DHW Boost Time" %}

* The first time I saw this I thought I was seeing a defrost with DHW active. Which would have been bad.
* Before DHW cycle heat pump had been running continuously at minimum power with a steady COP of 4.4. None of the tell-tale signs that a defrost is needed.
* If you look really closely you can see that heat pump turned off just *before* the DHW demand came in. The drop in flow temperature is the normal end of heating cycle. Then once DHW circuit is active, some hot water is returned from the NanoStore and gets pumped round the circuit with the heat pump resulting in the rising part of the V.
* It then takes the heat pump much longer than normal to do it's pre-flight checks and power up again to start heating the water
* End result was that it took 22 minutes to be ready for showering rather than the usual 10
* If this happens with an instant how water setup you're going to be left very disappointed

