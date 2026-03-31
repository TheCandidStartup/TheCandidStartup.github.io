---
title: Heat Geek NanoStore DHW Changes
tags: gear
---

Wise words
* Two months ago everything looked rosy
* Subjectively, everything still fine
* Open Energy Monitoring tells a different story for my overnight DHW runs

# Water Heating Theory

* Heating water uses 1.16Wh of energy per litre per degree
* Previously [worked out]({% link _posts/2025-11-17-heat-geek-nano-store.md %}) that the NanoStore holds 45.5L of water and that it's 100Kg of steel has the same heat capacity as 12.5L of water.
* The NanoStore has two separate circuits, each holding 22.75L of water.
* During a DHW run the heat pump circulates hot water through one circuit, heating the water in the other circuit and the body of the heat exchanger.
* Open Energy Monitoring determines the energy transferred to the NanoStore based on the difference between flow and return temperatures
* This energy raises the temperature of 22.75 + 12.5 = 35.25L of water (or equivalent)
* Need 40.89Wh to raise by 1C
* 1kWh of energy is enough to raise temperature by 24.5C
* When the DHW run ends the water flowing through the heat pump circuit is trapped in the store. We know exactly how hot this water is. Stratified with final flow temp at the top and return temp at the bottom. Average temp should be pretty close to average of flow and return temp.
* We only have a vague idea of how hot the other circuit and heat exchanger body is
* Temperature measured on body of heat exchanger near the bottom. This tells you minimum temperature of the store. The store is stratified so temperature will be higher at the top.
* A plate heat exchanger with water flowing through both circuits will usually manage to heat the top of the cold circuit within a degree or two of the incoming flow temperature through the hot circuit.
* During a DHW run there's no flow through the cold circuit. In combi mode the deltaT between flow and return is around 6C, during DHW run its 3C.
* In January I was able to [measure the temperature]({% link _posts/2026-02-09-heat-geek-nano-store-conclusion.md %}) at the top of the heat store before the insulation was applied. I was seeing 66°C at the top, after a DHW run with a flow temperature just under 70°C.
* Conservative estimate is that top temperature should be within 5°C of final flow temperature. 

# January 29th

{% include candid-image.html src="/assets/images/home-assistant/dhw-jan-29.png" alt="DHW Run January 29th" %}

* 1.37kWh of heat added, 0.833kWh of electricity used, COP 1.64
* Peak flow and return 66.8°C and 63.8°C
* Tank temp at start of DHW run 30°C (after boost shower at 8pm night before)
* Enough energy to raise temp by 33.5°C
* If tank temp equalized before run, would have average temp of 63.5°C by end
* Will be some heat loss 

# March 27th

{% include candid-image.html src="/assets/images/home-assistant/dhw-mar-27.png" alt="DHW Run March 27th" %}

* 1.677kWh heat, 1.414kWh electric for non-error portions
* 0.177kWh of heat, 0.15kWh electric for 3 minutes data recorded around 5.20
* Missing 12 minutes of data either side
* Filling in the gaps give `1.677+4*0.177` = 2.385kWh heat, `1.414 + 4*0.15` = 2.014kWh electricity, COP 1.18
* Peak flow and return 77.7°C and 75.7°C
* Tank temp at start of DHW run 23.5°C
* Enough energy to raise temp by 58.3°C
* Temp at end 81.8°C, but would expect significant heat loss at these temperatures

{% include candid-image.html src="/assets/images/home-assistant/dhw-flow-tank-temps.png" alt="Flow vs Tank Temps March 27th" %}

* Measured tank temp doesn't quite reach target of 60°C. Heat pump ran on until it hit some internal max temp limit and shut itself down
* Temperature sensor is all over the place. Either conditions in the store are turbulent or the sensor is misbehaving
* Best guess is that water is getting to 75°C but for whatever reason temperature sensor is seeing 20°C less with lots of variation
* Sensor on other side of an air bubble? Sensor become slightly detached from side of heat exchanger?

# Bleeding Radiators

* Open Energy Monitoring has [advice](https://docs.openenergymonitor.org/heatpumps/removing_air.html#removing-air-from-heating-systems) on removing air from heating systems
* Lots of talk about Automatic Air Vents (AAVs)
* No idea if I have any AAVs or how to use them if I did
* One mention of bleeding highest radiator. That I can do.
* Lots of trapped air, enough to reduce pressure in circuit by 0.2 bar
* Topped back up again and waited to see what would happen

# March 30th

* To my surprise it fixed the reported air issues. Seems counter-intuitive that removing air from the top of the heating circuit will have an effect on DHW circuit but I guess it's all interconnected.

{% include candid-image.html src="/assets/images/home-assistant/dhw-mar-30.png" alt="DHW Run March 30th" %}

* 2.183kWh of heat added, 1.302kWh of electricity used, COP 1.68
* Peak flow adn return 75.2°C and 72.2°C
* Tank temp at start of DHW run 25°C
* Enough energy to raise temp by 53.4°C
* If tank equalized before run, would have average temp 78.4°C at end. Not possible given flow temps but probably getting significant heat loss with temps this high. 
* Did hit 60°C target without hitting heat pump internal limit but still getting close. Still using way too much energy given target.

{% include candid-image.html src="/assets/images/home-assistant/dhw-temps-mar-30.png" alt="Flow vs Tank Temps March 30th" %}

* Still some odd behavior from the temperature sensor as flow temperature ramps up but behaves normally once DHW cycle ends
* Hard to see what's really going on as myVaillant only updates every 5 minutes

# Eco Mode

* With large hot water cylinder use eco mode to heat most efficiently - low and slow
* Limits compressor so heat pump operates in it's most efficient range
* Global setting. No good for us because we need full power during the day for combi mode showers.
* Can achieve the same effect using noise reduction mode. Also limits compressor. Runs on a schedule.
* Already using since early days with heat pump to try and improve efficiency
* Default noise reduction mode is less aggressive than eco mode
* Can change the `compr. noise reduct.` setting in the heat pump appliance interface (white box, not the SensoComfort). Default is 40%. Taking it to maximum of 60% is equivalent to eco mode.
* Hoping that heating more slowly will let temperature sensor catch up with actual temperature in the store

# March 31st

* Started DHW run 10 minutes earlier to allow for slower heating

{% include candid-image.html src="/assets/images/home-assistant/dhw-mar-31.png" alt="DHW Run March 31st" %}

* Took 45 minutes compared with previous days 35 minutes
* Definitely using less power and ramping more gradually
* 2.357kWh of heat added, 1.217kWh of electricity used, COP 1.94
* Peak flow and return 73.5°C and 71.2°C
* Tank temp at start of DHW run 22°C
* Enough energy to raise temp by 57.6°C
* Expected average temp at end (before losses) 79.6°C
* Not much difference in peak temperatures and heat added but definitely more efficient

{% include candid-image.html src="/assets/images/home-assistant/dhw-temps-mar-31.png" alt="Flow vs Tank Temps March 31st" %}

* Longer run gives us more temperature samples. Can see pronounced fluctuations as flow temperature ramps up but again normal once DHW cycle ends

# Home Assistant

* Expected temperature in tank given energy added tracks flow temperature pretty well. A few degrees less early in run, a few degrees more at the end
* Instead of ending DHW run using the lottery that is the temperature sensor reading, can use Home Assistant to end when we hit a target flow temperature
* Already use this approach for boost showers using our Home Assistant shower dashboard
* Want DHW runs to primarily use Vaillant schedule so that they still happen even if something goes wrong with Home Assistant
* Add a Home Assistant integration that drops target tank temperature when we hit target flow temperature, should indirectly end run
* Already manipulate target tank temperature for boost showers so should fit in nicely
