---
title: Heat Geek NanoStore Update
tags: gear
---

It's been more than two months since my post about our [prototype Heat Geek NanoStore]({% link _posts/2025-11-17-heat-geek-nano-store.md %}). We were waiting for a new diverting valve and extra insulation to be installed, while also looking ahead to colder weather. 

The diverting valve had to be shipped from Sweden. It had arrived and would be installed once Damon got back from a remote job. So, what took so long?

Apparently, there was a miscommunication and the valve hadn't arrived. It would actually be another month. A month came and went, now it would arrive in two weeks. Christmas arrived and with it another two week delay.

The valve finally turned up on 19th January. In between, the cold weather arrived. 

# Cold Weather

I wrote a separate post about [Heat Pump Cold Weather Performance]({% link _posts/2025-12-8-vaillant-heat-pump-cold-weather.md %}). I didn't say anything about the NanoStore. Adam from Heat Geek asked me to hold off until all the remedial work was done. The cold weather exposed a couple more problems with the existing setup.

## Double DHW Cycles

{% include candid-image.html src="/assets/images/home-assistant/double-dhw.png" alt="Double DHW cycles overnight" %}

Here's an interesting graph. This is an overnight DHW run on November 15th, just as the weather turned colder. I have a 60 minute window for water heating using noise reduction mode to force low and slow behavior. The tank temperature sensor gets hot enough to turn off at 62°C but manages to drop 2.5°C within a few minutes, triggering another DHW run. 

I think this is the stored heat equalizing once the DHW cycle ends. You can also see a dip in temperature that then recovers on milder nights. The dip is now big enough to exceed the 2.5°C hysteresis threshold. I increased hysteresis to 4°C and reduced the DHW window to 40 minutes.

Even on the coldest night, a hot water run takes just over 30 minutes. The shorter window means less cooling time before the water is used. It doesn't matter if the cycle is clipped slightly.

## Short Showers

{% include candid-image.html src="/assets/images/home-assistant/cold-weather-showers.png" alt="Cold Weather Showers" %}

This is Nov 19th. It's 0°C outside, cold water coming into the house is 7°C at the kitchen tap. The graph shows back to back showers using our [Home Assistant shower dashboard]({% link _posts/2025-11-24-home-assistant-kiosk-update-entity.md %}) to ensure that the heat pump is at full power and flow temperature is at 60°C before each shower starts. 

You can see that the flow temperature falls rapidly. The heat pump running at full power extends showering time by 2-3 minutes but the water still goes cold if you want a longer shower. 

No problem, there's a simple solution. At full power the heat pump is producing more than 9kW of heat, the same as an electric shower. In cold weather, an electric shower keeps the water hot by reducing the flow rate. We should be able to shower indefinitely if we reduce the flow rate to 4L/min. 

It doesn't work. If you go below 6L/min the water goes cold. 

## Blending Valve

It doesn't make any sense. The heat pump is still producing 9kW of heat. The same heat into a lower volume of water should mean hotter water. The only thing I could think of was the blending valve that keeps the delivered hot water temperature stable while the output from the heat exchanger drops from 60+°C to 50°C .

The blending valve has a 20-55°C range with an adjustment knob to select temperature from 1 to 6. After some experimenting, we ended up with a setting of 5.5 to ensure water hot enough to keep everyone happy. Which should be around 52°C.

“It goes cold at low flow rates” is a very subjective statement from someone shivering in the shower. I decided to do some science and measure temperature at the bathroom tap at different flow rates. To minimize the number of variables I used stored hot water. The heat pump isn't running. I checked the temperature at the start and end of my tests to make sure the store temperature hadn’t had time to drop during testing.

My first test was with water from the overnight DHW run a few hours previously. Tank temperature was at 51°C. Temperature at the tap was 40C at 6L/min, 33C at 4L/min and 29C at 2L/min. There's clearly something wrong here. Allowing for a couple of degrees drop to get to the tap, I should be seeing temperatures of at least 48°C. 

I did a second test with freshly heated water, the tank temperature reading 62°C. This time I thought to try it with the tap fully open. I got 48°C at 12L/min, 43°C at 5L and 33°C at 2L. 

The valve is an ESBE 370/570 series thermostatic mixing valve. I went and found the [product page](https://esbe.eu/group/products/thermostatic-mixing-valves/vta370-vta570) on their website and went through the details with a fine tooth comb. 

> The series VTA370 and VTA570 are the number one choice for heating and cooling applications. The valves provide an overtemperature protection function, which is important in order to protect e.g. under floor heating pipes and also the floor itself from an uncontrolled rise of temperature.

> Temperature stability valid at unchanged hot/return water pressure, minimum flow rate 9 L/min. Minimum temperature difference between hot water inlet and mixed water outlet 10°C and recommended maximum temperature difference between cold water and mixed water outlet: 10°C.

Now it makes sense. When showering the maximum flow rate is 8L/min. The flow rate is always below the specified minimum for the valve. The temperature is increasingly inaccurate at low flow rates, always biased towards colder temperatures. 

The valve is intended to prevent excessive temperatures for under floor heating. It's built to always mix some cold water in and to fail safe towards colder temperatures. 

We're effectively compensating for the inaccuracy by setting the valve at the top end of the range. That gives you water hot enough for showering at 6-8L/min but means you get scalded if you turn a tap on full. It’s still not enough to keep the water hot below 6L/min.

## Worst Case Scenario DHW Boost

{% include candid-image.html src="/assets/images/home-assistant/long-dhw-boost.png" alt="Long DHW Boost Time" %}

* The first time I saw this I thought I was seeing a defrost with DHW active. Which would have been bad.
* Before DHW cycle heat pump had been running continuously at minimum power with a steady COP of 4.4. None of the tell-tale signs that a defrost is needed.
* If you look really closely you can see that heat pump turned off just *before* the DHW demand came in. The drop in flow temperature is the normal end of heating cycle. Then once DHW circuit is active, some hot water is returned from the NanoStore and gets pumped round the circuit with the heat pump resulting in the rising part of the V.
* It then takes the heat pump much longer than normal to do it's pre-flight checks and power up again to start heating the water
* End result was that it took 22 minutes to be ready for showering rather than the usual 10
* If this happens with an instant how water setup you're going to be left very disappointed

## Insulation

* Losing 1.5°C an hour from heat store, much worse than expected loss from a MiniStore
* Added extra insulation by packing sleeping bags and former contents of the airing cupboard around and on top of the heat exchanger
* Loss down to a bit over 1°C an hour. Still much worse than a MiniStore but does suggest more insulation needed.

# Current Status

1. Works. I’d expect 5 mins of stored hot water from a 60L heat store and that’s what I get.
2. Works. Once the heat pump is in combi mode the plate sustains 10kW of heat transfer.
3. Doesn’t. During a DHW run the plate can’t accept heat fast enough. Flow rate up at 79 degrees and the hot water only at 62. Let heat pump run any longer and it shuts down.
4. Doesn’t. DHW takes too long to respond when you start shower. Up to 2-3 minutes.
5. Doesn’t. Run out of hot water before heat pump gets to combi mode after 10 minutes. Store loses heat to start + heat pump doesn’t ramp fast enough.
6. Doesn’t. Can take much longer than 10 minutes if you’re unlucky. E.g. If heating cycle finishes just before you start shower, if heat pump decides to defrost.
7. In cold weather 10kW isn’t enough to sustain 6L/min at a decent temperature. Just like an electric shower, you need to turn the flow down. However, if flow is less than 6L/min the water goes cold. I think this is a problem with the mixing valve. It looks like we have a VTA370/570 which is specified as needing minimum of 9L/min. ESBE do other valves which look more suitable. The VTA320 is used for anti-scald in DHW systems and has a minimum flow rate of 4L/min.

# Orientation

* Adam from Heat Geek had some results from another NanoStore test. The current orientation of the heat exchanger (on its back, with connections on top) might be causing some issues. He suggested lying it on its side (with connections on side) to see how that improved things. 
* Went digging on the Nordic Tec website and found an [article](https://nordictec-store.com/blog/post/how-to-connect-a-plate-heat-exchanger) explaining how their heat exchangers should be installed. Nordictec say that vertical orientation (stood on its end) is the only correct way to do it. They explicitly say don’t put it on its side.
* I also found a NordicTec blog on [common connection mistakes](https://nordictec-store.com/blog/post/plate-heat-exchanger-common-connection-mistakes-and-how-to-avoid-them). The stand out quote is “Never mount it horizontally, sideways, or—worst of all—"on its back" (connections facing up), which causes immediate clogging.”
* Plate internals. Need route for air bubbles to escape. 
* The thing they’re worried about is air bubbles getting trapped. “Mounting the heat exchanger in a different position, e.g., horizontally, does not guarantee proper venting of the device and will cause blockages or poor heat transfer if air bubbles do not escape from the device. Generally, a horizontally connected plate exchanger will not operate correctly (in a standard heating or domestic hot water system). Clogging of the exchanger can lead to irreversible damage, such as leakage.”
* Adam was keen to follow the scientific method and try all the different orientations. Useful for Heat Geek to have more options for how they're fitted. 
* I couldn't understand why you would ever want to fit it the wrong way when the manufacturer was very clear about how it should be used.

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

# Insulation

* Boxed in the heat exchanger with PIR board. Had enough room to add 50mm to the front and 25mm on the other sides. That gets close to MiniStore levels of insulation taking into account the existing 20mm foam cell insulation. 
* Time for heat to drop 4°C from "nominal" temperature
  * Initial setup 55°C-51°C: 2.5 hours
  * Initial setup + laundry "insulation" 55°C-51°C: 3 hours
  * After re-orienting, no extra insulation 45°C-41°C: 3.5 hours
  * After insulating: 7 hours. That's 0.57°C an hour, which is almost exactly what you'd expect from a 60L MiniStore XL.
* The end result for us is that an overnight DHW run provides enough hot water for hand washing and washing up throughout the day. 

{% include candid-image.html src="/assets/images/home-assistant/insulated-heat-exchanger.jpg" alt="Insulated Heat Exchanger" %}

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

Options
* Getting 8 minutes of hot water from stored heat. That's long enough for the average UK shower. Doesn't matter that heat pump takes an age to generate heat. You're finished before the hot water runs out and the water will be reheated ready for the next shower.
* Treat it like an electric shower. A 9kW electric shower will have a 4L/min flow rate in cold weather. If we do the same, we get 12 minutes of stored hot water. Plenty of time for heat pump to fire up. You can run indefinitely. 
* Push the boost button then go and get in the shower. You save the 3 minutes waiting for DHW demand to kick in. Assume it takes a couple of minutes to get in and now 8 minutes of hot water at a decent flow rate is plenty of time for the heat pump to ramp up. 

# Boost Shower

* Still think our boost shower strategy is optimal. No need to keep hot water close to nominal temperature. Heat once on cheap rate electric overnight. Only reheat when needed.
* Pain point previously was finding no hot water left for washing up at the end of the day. Not worth doing a full DHW run, so ended up boiling kettle.
* Now hot water lasts all day. The other day Lucy had a quick shower at lunch time using overnight hot water and didn't bother to boost it. The remaining water was still hot enough for washing up in the evening. 
* Had to adjust shower dashboard for the new reality. Now only need to heat tank to 45°C. Nudged diverter valve down to 48°C. Optimum time to get into shower is when return flow rate hits 50°C. Any cycling of the diverter valve will have stopped and heat will be consistently added to the store.
* Problem is that it's too efficient now. Hot water hits 45°C at the bottom of the tank around 53°C. That's too short a window between noticing shower is ready and getting in. Had a couple of occasions where family members got in just after the heat pump turned off. If you only need a short shower that doesn't matter, there will be enough stored. Horrible if you want a long shower.

* Don't want to heat water higher than needed to get larger window. Decided to extend window the other way, so you get in while heat pump is still ramping up and use a couple of minutes of stored water before heat starts being added.
* Set diverter valve at bottom of range, 42°C. Idea is to steal a little stored heat when valve opens in exchange for avoiding cycling and making the final jump up to combi flow temperatures more quickly. Also gets heat into the tank more quickly if we started from cold. 
* Window for getting into shower is 45-55°C. Again, waiting for end of any valve cycling if we started with cold water in the tank. 
* To make things more predictable I stopped using the tank temperature to end boost. Desired temperature is set at 60°C which we'll never reach. Instead use Home Assistant automation to cancel the boost once return flow temperature hits 55°C. 

# DHW Frost Protection

* After having a quick shower without turning the hot water on, noticed that a DHW run happened anyway.
* If you shower long enough, temperature sensor reading is close to temperature of the cold water entering the bottom of the heat exchanger.
* Can be as low as 7°C in cold weather, with sensor readings below 10°C. Once water stops flowing through the heat exchanger, temperatures equalize a bit, and sensor reading slowly rises to 20°C. 
* Apparently, Vaillant's frost protection feature also applies to hot water cylinders. If temperature falls significantly below 10°C, it will force a short (and inefficient DHW run). 
* Not documented, but according to [forum posts](https://community.openenergymonitor.org/t/vaillant-arotherm-owners-thread/21891/1058), confirmed verbally by Vaillant. No way to adjust thresholds used. 

# Cold Hard Cash

* Had been waiting for planned work to be completed and for everything to settle down before finally comparing bills before and after installing the heat pump and NanoStore.
* Beaten to it by Octopus, our energy provider. Direct Debit is currently £150 a month, same amount we paid before the heat pump. Octopus reached out to suggest that we should reduce the direct debit to £100 a month as otherwise we would build up a large credit balance.

| Month | Old Gas | New Gas | Old Elec | New Elec | Old Total | New Total |
|-|-|-|-|-|-|-|
| November | 85.12 | 11.26 | 40.47 | 92.22 | 125.59 | 103.34 |
| December | 101.96 | 11.42 | 43.00 | 111.43 | 144.96 | 122.85 |
| January | 134.25 | 10.06 | 44.08 | *125.87* | 178.33 | 135.93 |

* We still have a gas hob for cooking. Most of our gas bill is made up of standing charges. Waiting to see what happens with the promised new low standing charge tariffs before deciding whether to switch to an induction hob and disconnect the gas supply.
* Our monthly costs are lower but not as dramatic as the Octopus direct debit crystal ball suggests. On the other hand we've only just got the hot water sorted out which will lower our electricity consumption for future months.
