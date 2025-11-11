---
title: Heat Geek NanoStore
tags: gear
---

A few weeks ago I described our [heat pump installation]({% link _posts/2025-10-27-vaillant_arotherm_heat_pump.md %}), which included a mystery hot water system. There was more than enough to say about the heat pump itself. The mystery hot water system deserves its own post. As you'll see, it also needed a few weeks to work some of the kinks out. 

The mystery hot water system, as some of you already guessed, is a prototype Heat Geek NanoStore. 

Traditionally, heat pumps are paired with a large hot water cylinder. This is heated low and slow, the way heat pumps work best, once or twice a day. It needs enough capacity to cover the household's hot water needs for the day. Modern cylinders are supplied with a large amount of insulation preinstalled. You need plenty of space.

{% include candid-image.html src="/assets/images/home-assistant/airing-cupboard.jpg" alt="Airing Cupboard" %}

We didn't have much space. Our old combi boiler was installed in a narrow airing cupboard. The cupboard is 690mm deep, 600mm wide and 2400mm tall (floor to ceiling). The heat pump plumbing, controls and hot water system all had to fit in the same space. Ideally, leaving as much space as possible for storage. A modern hot water cylinder doesn't fit.

# MiniStore

Heat Geek have an existing solution for this problem, the MiniStore. A MiniStore is a small hot water cylinder plumbed in reverse. The heat pump directly heats the water in the tank. Cold water flows through a central coil, picking up heat, connecting into the domestic hot water supply. The cylinder acts as a heat store. 

There's enough stored heat to cover a few minutes of hot water demand. That, in theory, gives just enough time for the heat pump to kick in, ramp up and start replacing the lost heat. Our heat pump is capable of generating 9.5kW of heat when running flat out, equivalent power to an average electric shower. The end result is effectively a heat pump "combi".

Our original design included a 110L MiniStore Tall. The cylinder has a 475mm diameter and is 1100mm tall, including 50mm of insulation all round. The external volume is 0.195m³. Allowing room for access and pipework round the sides it will just fit. 

MiniStore's come in a variety of sizes, down to the 60L MiniStore XS. The smaller they get, the less well they work. There's less heat stored, fewer minutes of hot water, they're less effective at transferring heat. Any smaller than the XS and they don't work at all. 

# NanoStore

This is where the NanoStore comes in. Instead of starting with a hot water cylinder and adapting it to work as a heat exchanger, the NanoStore starts with a heat exchanger and adapts it to work as a heat store. 

Heat Geek have done some experiments of their own with [promising results](https://www.youtube.com/watch?v=Zbq4Mq4waNk). They were looking for volunteers to try a prototype NanoStore for real. They offered us a discount, free [Open Energy Monitoring]({% link _posts/2025-11-10-open-energy-monitoring.md %}), and a guarantee to replace it with a MiniStore if it didn't work out for us. 

The NanoStore in Adam's video is built around a [Nordic Tec BA-115-100](https://nordictec-store.com/ba-115-serie-0115mplate-2-thread-/323-plate-heat-exchanger-nordic-ba-115-100-2-3400kw.html) plate heat exchanger. Heat is stored in the metal body of the heat exchanger as well as the 30L of water inside it. Add a thick layer of insulation and you have a heat store. It's more compact than a MiniStore, with much better energy transfer.

{% include candid-image.html src="/assets/images/home-assistant/plate-heat-exchanger-nordic-ba-115.jpg" alt="Nordic Tec Plate Heat Exchanger BA-115" %}

The complete solution adds two mixing valves. One blends hot water from the heat exchanger down to a safe temperature, which also increases the volume of water that can be supplied. The other is on the heat pump side of the exchanger. It acts as a diverting valve so that water flowing from the heat pump only goes into the heat exchanger when it's reached a suitable temperature.

{% include candid-image.html src="/assets/images/home-assistant/original-plumbing-schematic.svg" alt="Plumbing Schematic" %}

Our heat exchanger is twice the size of the one in the video. Based on the external dimensions, it looks like a [BA-115-170](https://nordictec-store.com/ba-115-serie-0115mplate-2-thread-/1472-plate-heat-exchanger-nordic-ba-115-170-25-6300kw.html). It weighs over 100kg, so very difficult for two people to maneuver up the stairs and into a narrow cupboard. It's about the same size as the old combi boiler, but has to sit on the floor as it's too heavy to wall mount. 

The heat exchanger is 535mm deep, 253mm wide and 428mm high. However, it's been heavily insulated and sits on feet. The overall dimensions are 620mm deep, 320mm wide and 550mm high. The external volume is 0.109m³ and it holds about 60L of water total. Water has 8 times the heat capacity of steel, so the 100kg body is equivalent to another 12.5L of water. 

{% include candid-image.html src="/assets/images/home-assistant/nano-store.jpg" alt="NanoStore prototype in situ" %}

The mixing valves are two ESBE VTA 370/570 series thermostatic mixing valves. They have a 20-55°C range, with an adjustment knob to select temperature from 1 to 6.

The NanoStore holds the same volume of water as a 60L MiniStore XS but has a higher overall heat capacity. It's a little less than a regular 80L MiniStore while being significantly smaller. The cuboid shape means there's more usable space. The NanoStore fits into the space below the lower shelf in the original picture. 

According to the Nordic Tec website, the BA-115-170 is a "large industrial plate heat exchanger" with "significant weight" that is "not a heat exchanger for single-family homes". Of course Heat Geek aren't using it in a typical way. It needs to be big enough to act as a heat store for the time it takes for the heat pump to react and build up to full power.

The one we've got is so much bigger because we have two showers and Heat Geek want to see whether both can be used simultaneously. Plus installing a range of sizes gives them more data to work out the optimal size for future installs.

The Heat exchanger plus [Open Energy Monitoring level 3](https://shop.openenergymonitor.com/level-3-heat-pump-monitoring-bundle-emonhp/) is £3000 worth of kit, at list prices, so we got a good deal for being guinea pigs.

# Non-stop DHW Cycles

The installation was completed late on Friday so my first proper day of testing was Saturday. It was the tail end of storm Amy, a much colder day than the previous week. It was never above 10°C, mostly around 8°C.

The heat pump was running but only for DHW (domestic hot water) cycles, every 60-90 minutes. No heating cycles. I messaged Damon, our installer, who replied almost instantly. He suggested bumping the heat curve right up to 2.2 to give 55°C flow temp, which would force a heating cycle.

After a long drawn out few minutes it finally kicked in. Took an hour to get the house up to temperature, after which I went back to the design heat curve of 0.7.  The house stayed at temperature but the overall behavior was the same. A DHW cycle every 60-90 minutes. No heating cycle. COP around 2.5. 

{% include candid-image.html src="/assets/images/home-assistant/dhw-thermal-siphoning.png" alt="Thermal Siphoning" %}

This is an annotated history graph from Home Assistant. The blue line shows the reported hot water temperature, the red line is the heat pump flow temperature. The blue shading shows when the heat pump is generating heat with the hot water circuit active. The red shading shows when it's generating heat with the heating circuit active. The rest of the time water is being pumped round the heating circuit but the heat pump isn't generating heat.

I tried increasing cylinder hysteresis from 2.5°C to 4°C, so that DHW cycles would be less frequent. Made barely any difference. After a DHW cycle, the flow temperature never drops far enough to trigger a heating cycle before the start of the next DHW cycle.

# Thermosiphoning

Where was the heat coming from? Given the rapid loss of heat from the heat exchanger,without the airing cupboard or outside of the insulation feeling over warm, it seemed most likely that it was escaping into the heating circuit. Almost at the same time, I got a message from Damon saying it was most likely to be [thermosiphoning](https://en.wikipedia.org/wiki/Thermosiphon). Fixing it would need no-return check valves to be installed.

I suspect this is a consequence of floor mounting the heat exchanger with all connections on top. It's easy for convection to move heat up the heat pump return connection and on to where it joins the return from the heating circuit. Similarly, heat can also convect up the cold water supply pipe. 

I turned off the hot water. We can heat on demand when we need it and use it immediately. The normal heating cycle kicked in after a couple of hours.  Reasonable COP around 5.

Damon messaged again the following day. The whole team were heading out for a remote week long job but he would send one of them back a day early so they can fit the valves on Friday. He also offered to cover my electricity costs until the problem is sorted. At the end of the week, he had to rearrange again to the following Monday. 

Installation took an afternoon to do. It was a belt and braces approach using four check valves. Two spring loaded ones on the inflows and two flutter valves on the outflows. Some of the pipework runs had to be altered to get long enough straight sections to fit the valves in.

{% include candid-image.html src="/assets/images/home-assistant/plumbing-schematic.svg" alt="Plumbing Schematic with check valves" %}

We fired everything up, turned on the hot water and heating, and crossed fingers.
  
{% include candid-image.html src="/assets/images/home-assistant/dhw-with-check-valves.png" alt="After check valves fitted" %}

Much better. Store loses a little less than 1°C per hour. 

# Blending Down

{% include candid-image.html src="/assets/images/home-assistant/esbe-vta372-mixing-valve.png" alt="ESBE VTA 370/570 series mixing valves" %}

Initially, the hot water blending valve was set on maximum. Hot water came out of the shower head scalding hot, then gradually reduced in temperature, leading to constantly having to bump the shower temperature up. 

I turned it down from 6 to 4.5. On testing, I thought I was getting 41°C at the tap, so maybe 45°C out of the valve. After several complaints from the rest of the household and checking temperatures at all taps and showers, I ended up setting the valve to 5.5. That gives a stable temperature at the shower with water hot enough for everybody, at every outlet. 

There does seem to be a psychological element at play. It's not enough that the water is hot enough. You need the maximum temperature to be a little bit too hot, so that you can turn it down and feel that you've got it just right. 

# Instant Hot Water

* Idea is that NanoStore holds enough heat to provide hot water until the heat pump kicks in and ramps up to full power "combi" mode
* Using shower at natural flow rate. We're at the top of a hill with low water pressure, so not excessive flow. About 8L a minute. 
* Getting 5 minutes of hot water before shower starts to go cold, ending up at around 30 degrees. Not freezing cold but not a pleasant experience. Kept going for another 10 minutes in the name of science. Didn't get any hotter. 

{% include candid-image.html src="/assets/images/home-assistant/shower-8l-55d.png" alt="Shower at 8 L/min with store target 55°C" %}

* Yellow line shows *perceived* hot water temperature. Didn't have a thermometer to hand. Three things jump out.
* Takes 3 minutes from starting shower to DHW demand being signalled. Water had been reheated to 55°C target shortly before test. Sensor is on outside of tank near the cold water inlet. Idea is that it should react quickly when water is drawn off. Down side is that it lags when heating water. Once temperature equalized across store, water was actually at 59°C. With 2.5°C hysteresis below target, temperature has to fall to 52.5°C before DHW triggered.
* During the first 5 minutes of the DHW cycle the store is *losing* heat. The return temperature is higher than the flow temperature. We're 8 minutes into the shower before there's a net heat gain.
* There's a one minute delay from DHW demand to the heat pump starting. It ramps up quickly to its minimum 600W power level. It takes a long 8 minutes for it to get to it's 3300W full power. Barely increasing while the store is actively losing heat then ramping up slightly faster. Once its going full throttle its putting out 9.5kW of heat, equivalent to the average electric shower.

# Hot Water Theory

* How much initial hot water should we expect?
* Store holds 60L of water at around 55°C. There's 30L on the DHW side and 30L on the heat pump side. Turn on the shower, and 30L of water at 55°C flows out, then gets blended down to about 45°C.
* Assume incoming cold water at 10°C. Blending at a 4:1 ratio of hot:cold averages out at 46°C. Giving 37.5L after blending.
* At 8L a minute that's about 4.5 minutes of hot water.
* Cold water enters the heat exchange as the hot water is drawn off. The other side of the heat exchanges is at 55°C, so will warm the incoming water. Let's assume the heat exchanger does its job and raises the water to at least 45°C. That needs an increase of 35°C. The hot side of the heat exchanger holds 30L of water and the equivalent of another 6L in the steel body. Heating 1L of water by 35°C will decrease the temperature of the heat exchange by about 1°C. 
* Around another minute of showering before the temperature is reduced too far for the heat exchanger to work effectively.
* Gives at most 5.5 minutes of hot water which is close to what I experienced.

# Best Case Scenario

* Adam from Heat Geek suggested using water saving shower heads for a 6L a minute flow rate and heating the store to 65°C.
* Blending at 2:1 averages out at 46.5°C, giving 45L after blending.
* At 6L a minute that's about 7.5 minutes of hot water.
* Would then have at most 3 minutes more with the heat exchanger temperature reducing from 65°C to 47°C.
* Will that be enough? Let's put it to the test.

{% include candid-image.html src="/assets/images/home-assistant/shower-6l-65d.png" alt="Shower at 6 L/min with store target 65°C" %}

# Diverting Valve

* Don't know what heat pump diverting valve was initially set to

{% include candid-image.html src="/assets/images/home-assistant/divert-valve-initial.png" alt="DHW cycle with initial setting for divert valve" %}

{% include candid-image.html src="/assets/images/home-assistant/divert-valve-min.png" alt="DHW cycle with min setting for divert valve" %}

* DHW: 0.669kWh consumed, 1.096 generated, COP 1.64. Post heat dump: 1.029 kWh

{% include candid-image.html src="/assets/images/home-assistant/divert-valve-max.png" alt="DHW cycle with max setting (3 visible) for divert valve" %}

* DHW: 0.589kWh consumed, 0.458 generated, COP 0.78. Post heat dump: 1.159 kWh

{% include candid-image.html src="/assets/images/home-assistant/divert-valve-5.png" alt="DHW cycle with max-1 setting (2 visible) for divert valve" %}

{% include candid-image.html src="/assets/images/home-assistant/divert-valve-5-long-shower.png" alt="DHW cycle with max-1 setting, long shower" %}

* Valve not stable! Same valve settings, 10 degree difference in when it starts charging NanoStore.
* Annotated with tank temperature in yellow. Very coarse grained, updates sent by Vaillant sensoCOMFORT at 5 minute intervals.
* Sensor near cold water inlet so can quickly respond to water draw. However, not representative of temperature at hot water outlet, at heat pump inlet or what the current "stored" temperature is. 
* Suspect some correlation between temperature at valve "cold inlet" (connected to NanoStore heat pump inlet) and temperature needed at "hot inlet" (connected to heat pump return flow) for valve to open. 

# Boost Shower Strategy

* Heating to 62 at end of cheap window at 5am still at 42 at 9pm for washing up if no one's had a shower
* Plenty left if there's been a shower cycle during the day

# Costs

* Want small hysteresis so that you get fast response to DHW demand. Top up with hysteresis at 2.5°C is really inefficient. Store takes around 2 hours to lose 2.5°C, so there will be many DHW cycles during the day. 
* The MiniStore tall is [specified](https://newarkcylinders.co.uk/wp-content/uploads/2025/11/Heat-Geek-Mini-Store-v1.4-Specification-Installation-Booklet-Nov-2025.pdf) to lose 1.27kWh over 24 hours. It takes 1.16Wh to raise 1L of water by 1°C. It stores 110L of water so loses 11.5Wh per litre per 24 hours, or 10°C. The NanoStore loses 10°C in 8 hours, or 30°C in 24 hours.
* MiniStore is supplied with 50mm insulation, prototype NanoStore has 20mm hand applied. Suggests that more/better insulation should help. 
* The MiniStore XS holds 60L so might be a fairer comparison for what the NanoStore could achieve. It loses 0.96kWh, or 16Wh per litre, equivalent to 13.5°C over 24 hours. Still well over twice as good as the NanoStore. 

{% include candid-image.html src="/assets/images/home-assistant/hot-water-top-up.png" alt="Hot Water Top Up" %}

* Each has 10 minutes of ramp up time for zero heat gain, 5 minutes gaining heat while flow temperature climbs to 70 degrees, then all the built up heat dumped. Adds 0.3kWh of heat to the store at a COP of 0.5, then dumps 1kWh. In the winter the heat is dumped into the heating circuit, which is useful but inefficient. In the summer, the hot water will sit in the external pipes between the heat pump and the NanoStore, with the heat gradually radiating away. 
* Boost shower: 10 minute ramp up (0.28 kWh, COP 0.7), 10 minute combi shower (0.56 kWh, COP 3), 7 minutes reheat (0.4 kWh, COP 1.3). Overall 1.25kWh, COP 2. Cost 40p at peak rate, 10p using stored off-peak from home battery.
* Gas combi for same heat would be 2.5kWh gas (assuming 100% efficiency). Looking at our old gas bills (30 minute smart metering) confirms that to be about right. Cost 15p. 
