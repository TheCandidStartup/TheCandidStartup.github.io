---
title: Heat Pump and Heat Geek NanoStore Cold Weather Performance
tags: gear home-assistant
---

wise words

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
