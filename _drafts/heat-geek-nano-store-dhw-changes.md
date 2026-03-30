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
* Best guess is that water is getting to 75°C but for whatever reason temperature sensor is seeing 20°C less
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
