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

# The Elusive Diverter Valve

* Turns out there was a miscommunication and valve hadn't arrived, would be another month
* Then another two weeks, and then another two
* In the end it finally arrived 19th January

# Insulation

* Losing 1.5°C an hour from heat store, much worse than expected loss from a MiniStore
* Added extra insulation by packing sleeping bags and former contents of the airing cupboard around and on top of the heat exchanger
* Loss down to 1°C an hour. Still much worse than a MiniStore but does suggest more insulation needed

# Orientation

* Adam from Heat Geek had some results from another NanoStore test. The current orientation of the heat exchanger (on its back, with connections on top) might be causing some issues. He suggested lying it on its side (with connections on side) to see how that improved things. 
* Went digging on the Nordic Tec website and found an [article](https://nordictec-store.com/blog/post/how-to-connect-a-plate-heat-exchanger) explaining how their heat exchangers should be installed. Nordictec say that vertical orientation (stood on its end) is the only correct way to do it. They explicitly say don’t put it on its side.
* I also found a NordicTec blog on [common connection mistakes](https://nordictec-store.com/blog/post/plate-heat-exchanger-common-connection-mistakes-and-how-to-avoid-them). The stand out quote is “Never mount it horizontally, sideways, or—worst of all—"on its back" (connections facing up), which causes immediate clogging.”
* Plate internals. Need route for air bubbles to escape. 
* The thing they’re worried about is air bubbles getting trapped. “Mounting the heat exchanger in a different position, e.g., horizontally, does not guarantee proper venting of the device and will cause blockages or poor heat transfer if air bubbles do not escape from the device. Generally, a horizontally connected plate exchanger will not operate correctly (in a standard heating or domestic hot water system). Clogging of the exchanger can lead to irreversible damage, such as leakage.”
* Adam was keen to follow the scientific method and try all the different orientations. Useful for Heat Geek to have more options for how they're fitted. 
* I couldn't understand why you would ever want to fit it the wrong way when the manufacturer was very clear about how it should be used.

# Current Status

1. Works. I’d expect 5 mins of stored hot water from a 60L heat store and that’s what I get.
2. Works. Once the heat pump is in combi mode the plate sustains 10kW of heat transfer.
3. Doesn’t. During a DHW run the plate can’t accept heat fast enough. Flow rate up at 79 degrees and the hot water only at 62. Let heat pump run any longer and it shuts down.
4. Doesn’t. DHW takes too long to respond when you start shower. Up to 2-3 minutes.
5. Doesn’t. Run out of hot water before heat pump gets to combi mode after 10 minutes. Store loses heat to start + heat pump doesn’t ramp fast enough.
6. Doesn’t. Can take much longer than 10 minutes if you’re unlucky. E.g. If heating cycle finishes just before you start shower, if heat pump decides to defrost.
7. In cold weather 10kW isn’t enough to sustain 6L/min at a decent temperature. Just like an electric shower, you need to turn the flow down. However, if flow is less than 6L/min the water goes cold. I think this is a problem with the mixing valve. It looks like we have a VTA370/570 which is specified as needing minimum of 9L/min. ESBE do other valves which look more suitable. The VTA320 is used for anti-scald in DHW systems and has a minimum flow rate of 4L/min.

# Cold Weather Mixer Valve

* This is from the technical data section on the [product page](https://esbe.eu/group/products/thermostatic-mixing-valves/vta370-vta570). “Temperature stability valid at unchanged hot/return water pressure, minimum flow rate 9 l/min”.
* Adam couldn't understand how inaccuracy on the mixing valve would make the water go cold.
* “It goes cold at low flow rates” is a very subjective statement from someone shivering in the shower. I decided to do some science and measure temperature at the bathroom tap at different flow rates. To minimize the number of variables I used stored hot water, heat pump not running. I checked temp at start and end of tests to make sure stored temp hadn’t had time to drop during testing.
* First test was with water from overnight DHW run a few hours previously. Tank temp at 51C. Temp at tap was 40C at 6L, 33C at 4L and 29C at 2L.
* Second test was freshly heated water, tank temp reported as 62C. Temp at tap was 48C at 12L (fully open), 43C at 5L and 33C at 2L.
* Valve is set at 5.5 out of 6. It’s increasingly inaccurate at low flow rates. Always towards colder temps. It also seems more inaccurate at lower temps from the plate. It’s as if it always mixes some cold water in.
* It’s frustrating because the heat pump has same output power as an electric shower. I can run the shower at 4L which would give me continuous hot water if the valve wasn’t mixing cold water in.
* The poor accuracy at shower flow rates is a real problem. We’re effectively compensating by setting the valve at the top end of the range. That gives you water hot enough for showering at 6-8L but means you get scalded if you turn a tap on full. It’s still not enough to keep the water hot below 6L.

# The Plan

* Agreed with Damon to have one last throw of the dice. Had taken long enough. Can't keep doing one little change at a time.
* Heat Exchanger will be re-oriented on its end. New diverter valve. New VTA320 series mixer valve. Added insulation by boxing in heat exchanger with 50mm of PIR Insulation board to match MiniStore's 50mm insulation. 
* Adding a T connector at the cold water inlet that can be used as a sensor pocket for tank temperature. Should respond much quicker when hot water drawn off.

# The Reality

* Damon spent 20th January trying to find a way that everything would fit in our narrow airing cupboard. In the end only way of doing it was with connections facing forward towards the door. Apparently, more conventional to have connections facing the back wall. Only just enough room to take the pipework round and back while still being able to shut the door.
* Not enough room to include the T connector sensor pocket. Tank temperature sensor on side of tank near the cold water inlet.

{% include candid-image.html src="/assets/images/home-assistant/reoriented-heat-exchanger.jpg" alt="Reoriented Heat Exchanger" %}

* Got everything plumbed in and running but ran out of date to box in the heat exchanger with insulation.

# Diverter Valve

* We saw the impact of the new diverter valve from the first time we fired up a DHW run
* Due to a comedy of errors kept inadvertently canceling the run so I don't have a complete one to show

{% include candid-image.html src="/assets/images/home-assistant/diverter-valve-from-cold.png" alt="Diverter Valve DHW run starting from cold" %}

* Damon tried to set valve to open at 42°C. Hard to be precise when setting, actually opens at 39°C. 
* No heat lost at all as flow temperature ramps. Valve is fully shut below temperature. 
* Huge dump of heat with deltaT up to 13°C. Valve is fully open above temperature.
* As cold water pushed out of heat exchanger flows back round through heat pump, flow temperature falls back to 38°C, and valve briefly closes
* Again, no loss of heat

{% include candid-image.html src="/assets/images/home-assistant/diverter-valve-overnight-dhw.png" alt="Diverter Valve overnight DHW run" %}

* Didn't get a complete run until the scheduled overnight one
* Starting water temperature is higher so less of a shock effect when valve first opens. Spikes of heat as pulses of cooler water circulate round to heat pump and back, then settles into steady ramp.
* Cut the rest off as it's not very interesting. Steady ramp of flow temperature with a consistent deltaT of 3°C
* Again, no heat lost from the store during the cycle
* I was hoping that the new valve together with the reorientation of the heat exchanger would charge the heat store significantly faster. However, once you get to the point of steady ramping, both behave similarly.

# Tank Temperature

* Tank temperature sensor behaves differently now that the heat exchanger is the right way up, much more like a normal hot water cylinder
* Placed near the bottom to be responsive to water demand when setup for instant hot water
* When doing a DHW run, flow temperature gets over 70°C before bottom of heat exchanger gets to the 55°C set point.
* When DHW run ends, measured tank temperature drops to around 48°C within 5-10 minutes. Presumably due to stratification, with hotter water at the top.
* Measured temperature of plate using a probe thermometer. When tank temperature is reporting 48°C, the top of the heat exchanger (near hot water outlet) is at 66°C, half way down is 61°C and right next to the cold water inlet is 42°C.
* Could
  1. Drop set point to 45°C to allow for stratification. When 45°C reached at bottom of the tank, top should be 56°C. Think of value as the minimum temperature of hot water in the "tank". Increase hysteresis for recharging to 10°C, allowing for 7°C drop at end of DHW run plus 3°C heat loss over time before triggering top up. Instant hot water only works if temperature at sensor drops more than 10°C almost straight away on DHW demand.
  2. Move sensor up. Lowest place that keeps stable temperature as stratification happens. Think of value as average temperature. Set hysteresis to 3°C. Instant hot water only works if temperature as this point drops quickly enough when there's DHW demand. 
  3. Use separate sensors for stored tank temperature and spotting DHW demand. For example, Adam used a flow sensor on another NanoStore trial. When there's no demand the Vaillant controls see the stored water temperature (high on the heat exchanger), when hot water is drawn off, the flow sensor switches the temperature input to a fixed value just below `setpoint - hysteresis` to force DHW run.
* Adam recommended option 1, normal behavior for a hot water cylinder
* In test with flow sensor Adam found that ramping time for heat pump is related to store temperature. At low store temperature, heat pump is running at low power, presumably on the basis that it doesn't need much power to heat water at low temperature. As temperature goes up, heat pump power does too. If you connect Vaillant controls to a temperature sensor at 45°C when DHW demand starts, it ramps up within a minute. 
* Looked for evidence of similar effects with my setup. Found a case where water had been boosted before a shower with tank temperature already at 45°C.  Took 7 minutes from start of DHW cycle until full power, tank staying at 45°C or above as no water drawn off. Not anywhere near Adam's reported performance.
* Conversely, in cases where water is being heated from cold, it takes 12 minutes to get to full power. 

# Mixer Heaven

* New mixer is VTA320 series with a nominal 35°C-60°C range accurate to ±2°C down to 4L/min flow rate
* No temperatures or numbers marked on valve. Just turn it until you get what you want.
* Tested temperature at bathroom tap with valve fully closed and fully open. Got range of 34°C-61°C.
* At top end suggests temperature is stable even with less than 10°C difference between hot input and desired output.
* Adjusted valve until we were getting 45°C at the tap.
* Early signs are good. Lucy had a shower and reported stable temperatures throughout, even when she turned flow rate down. Never went cold. 
* Another family member had an hour long shower. Water started to go cold at full 8L/min flow rate. Was able to turn flow rate down to keep water hot for full length of shower.
* After Lucy's shower I stopped boost with flow rate at 55°C, so should have been a few degrees less than that at top of heat exchanger. Three hours later, did the washing up and water at kitchen tap was still at desired temperature.

# Instant Hot Water

* DHW run 20 minutes before shower to 45°C, 10C hysteresis, top of tank measured at 55°C
* Diverter valve set to 50°C. We want 45°C at the tap, so seems reasonable margin.
* Start of shower tank temp at 40°C (via myVaillant only updated at 5 minute intervals), next sample has temperature at 23°C.
* Set shower to 6L/min flow rate
* 3 minutes from start of shower until DHW kicked in. The improvements to the heat store mean you need to draw more water off before the temperature drops significantly. 
* After 8.5 minutes shower started to go colder
* Reduced flow rate to 3-4L/min. Mixer valve happy. No sudden drop in temperature.
* After 10 minutes heat pump reached 50°C threshold and started adding heat, water from shower really getting quite cold now
* After 11 minutes shower was back at temperature and stayed stable for next 10 minutes of showering (will go indefinitely at 4L/min)

{% include candid-image.html src="/assets/images/home-assistant/diverter-valve-instant-hot-water.png" alt="Diverter Valve instant hot water run" %}

* Open Energy Monitoring graph much more dramatic than shower felt
* Took so long for heat pump to ramp up that temperature in store was well below 50°C threshold. Get a huge dump of heat into the store, before the cold water pushed out and circulated round closes diverter valve again. After a couple of minutes flow rate is at 50°C again and the cycle repeats.
* Shower is taking energy out of the store at the same rate that, on average, the heat pump is adding it. The added heat lasts just long enough to keep the shower hot until the next heat dump. 

# Insulation

* Boxed in the heat exchanger with PIR board. Had enough room to add 50mm to the front and 25mm on the other sides. That gets close to MiniStore levels of insulation taking into account the existing 20mm foam cell insulation. 
* Measured heat loss after insulating of 4°C over 7 hours. That's 0.57°C an hour, which is almost exactly what you'd expect from a 60L MiniStore XL.
* The end result for us is that an overnight DHW run provides enough hot water for hand washing and washing up throughout the day. 
