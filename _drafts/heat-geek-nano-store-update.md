---
title: Heat Geek NanoStore Update
tags: gear
---

It's been more than two months since my post about our [prototype Heat Geek NanoStore]({% link _posts/2025-11-17-heat-geek-nano-store.md %}). At the end of that post, we were waiting for a new diverting valve and extra insulation to be installed, while also looking ahead to colder weather. 

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

Except, it doesn't work. If you go below 6L/min, the water goes cold. 

## Blending Valve

It doesn't make any sense. The heat pump is still producing 9kW of heat. The same heat into a lower volume of water should mean hotter water. The only thing I could think of was the blending valve that keeps the delivered hot water temperature stable while the output from the heat exchanger drops from 60+°C to 50°C .

The blending valve has a 20-55°C range with an adjustment knob to select temperature from 1 to 6. After some experimenting, we ended up with a setting of 5.5 to ensure water hot enough to keep everyone happy. Which should be around 52°C.

“It goes cold at low flow rates” is a very subjective statement from someone shivering in the shower. I decided to do some science and measure temperature at the bathroom tap at different flow rates. To minimize the number of variables I used stored hot water. The heat pump isn't running. I checked the temperature at the start and end of my tests to make sure the store temperature hadn’t had time to drop during testing.

My first test was with water from the overnight DHW run a few hours previously. Tank temperature was at 51°C. Temperature at the tap was 40C at 6L/min, 33C at 4L/min and 29C at 2L/min. There's clearly something wrong here. Allowing for some temperature drop to get to the tap, I should be seeing at least 48°C. 

I did a second test with freshly heated water, the tank temperature reading 62°C. This time I thought to try it with the tap fully open. I got 48°C at 12L/min, 43°C at 5L/min and 33°C at 2L/min. 

The valve is an ESBE 370/570 series thermostatic mixing valve. I went and found the [product page](https://esbe.eu/group/products/thermostatic-mixing-valves/vta370-vta570) on their website and went through the details with a fine tooth comb. 

> The series VTA370 and VTA570 are the number one choice for heating and cooling applications. The valves provide an overtemperature protection function, which is important in order to protect e.g. under floor heating pipes and also the floor itself from an uncontrolled rise of temperature.

> Temperature stability valid at unchanged hot/return water pressure, minimum flow rate 9 L/min. Minimum temperature difference between hot water inlet and mixed water outlet 10°C and recommended maximum temperature difference between cold water and mixed water outlet: 10°C.

## The Right Valve for the Job

Now it makes sense. When showering the maximum flow rate is 8L/min. The flow rate is always below the specified minimum for the valve. The temperature is increasingly inaccurate at low flow rates, always biased towards colder temperatures. 

The valve is intended to prevent excessive temperatures for under floor heating. It's built to always mix some cold water in and to fail safe towards colder temperatures. 

We're effectively compensating for the inaccuracy by setting the valve at the top end of the range. That gives you water hot enough for showering at 6-8L/min but means you get scalded if you turn a tap on full. It’s still not enough to keep the water hot below 6L/min.

ESBE do other valves which look more suitable. I like the look of the [VTA320](https://esbe.eu/group/products/thermostatic-mixing-valves/vta320-vta520).

> The series VTA320 for domestic hot water distribution, anti-scalded tempering in line applications and where further temperature control devices have been installed at the water taps.

> Valid at unchanged hot/cold water pressure, minimum flow rate 4 l/min. Minimum temperature difference between hot water inlet and mixed water outlet 10°C

It's intended for use with domestic hot water rather than underfloor heating, and it supports a minimum 4L/min flow rate. The language used also implies that it doesn't have the aggressive fail safe towards colder temperatures.

## Worst Case Scenario DHW Boost

{% include candid-image.html src="/assets/images/home-assistant/long-dhw-boost.png" alt="Long DHW Boost Time" %}

The first time I saw this I thought I was seeing a defrost with DHW active. Which would have been bad. Before the DHW cycle started, the heat pump had been running continuously at minimum power with a steady COP of 4.4. There were none of the tell-tale signs that a defrost is needed.

If you look really closely you can see that heat pump turned off just *before* the DHW demand came in. The drop in flow temperature is the normal end of heating cycle. Then once the DHW circuit is active, some hot water is returned from the NanoStore and gets pumped round the circuit resulting in the rising part of the V. 

It then takes the heat pump much longer than normal to do it's pre-flight checks and power up again to start heating the water. The end result was that it took 22 minutes to be ready for showering rather than the usual 10. If this happens with an instant how water setup you're going to be left very disappointed.

## Insulation

We're losing 1.5°C an hour from the NanoStore, much worse than the 0.5°C expected loss from a MiniStore. While waiting for Damon to install extra insulation we did some experiments of our own. 

We added extra insulation by packing sleeping bags and the former contents of the airing cupboard around and on top of the heat exchanger. Heat loss is down a bit but still over 1°C an hour. We didn't expect much but at least it shows that more insulation will be useful. 

# Current Status

That's how things stood at the beginning of January. Here's a summary of what works and what doesn't. 

1. *Works*. I’d expect 5 mins of stored hot water from a 60L heat store and that’s what I get.
2. *Works*. Once the heat pump is in combi mode the heat exchanger sustains 10kW of heat transfer.
3. *Doesn’t*. During an overnight DHW run the heat exchanger can’t accept heat fast enough. Flow temperatures ramp up to 79°C while the hot water is only at 62°C. Let the heat pump run any longer and it shuts down.
4. *Doesn’t*. DHW takes too long to respond when you start a shower. Up to 2-3 minutes.
5. *Doesn’t*. We run out of hot water before the heat pump gets to combi mode after 10 minutes. The NanoStore loses heat at the start of the DHW cycle and the heat pump doesn’t ramp fast enough.
6. *Doesn’t*. It can take much longer than 10 minutes if you’re unlucky. E.g. If the heating cycle finishes just before you start a shower, or if the heat pump decides to defrost.
7. *Doesn't*. In cold weather 10kW isn’t enough to sustain 6L/min at a decent temperature. Just like an electric shower, you need to turn the flow down. However, if flow is less than 6L/min the water goes cold. 
8. *Doesn't*. I'd expect a 60L NanoStore to retain heat about as well as a 60L MiniStore XL. It's about three times worse. 

# Orientation

Adam had some results from another NanoStore test. The current orientation of the heat exchanger (on its back, with connections on top) might be causing some issues. He suggested lying it on its side (with connections on the side) to see how that improved things.

A NanoStore is a Nordic Tec plate heat exchanger wrapped in some insulation. I went digging on the Nordic Tec website and found an [article](https://nordictec-store.com/blog/post/how-to-connect-a-plate-heat-exchanger) explaining how their heat exchangers should be installed. Nordic Tec say that vertical orientation (stood on its end) is the only correct way to do it. They explicitly say don’t put it on its side.

I also found a Nordic Tec blog on [common connection mistakes](https://nordictec-store.com/blog/post/plate-heat-exchanger-common-connection-mistakes-and-how-to-avoid-them).

> “Never mount it horizontally, sideways, or—worst of all—"on its back" (connections facing up), which causes immediate clogging.”

> “Mounting the heat exchanger in a different position, e.g., horizontally, does not guarantee proper venting of the device and will cause blockages or poor heat transfer if air bubbles do not escape from the device. Generally, a horizontally connected plate exchanger will not operate correctly (in a standard heating or domestic hot water system). Clogging of the exchanger can lead to irreversible damage, such as leakage.”

Adam was keen to follow the scientific method and try all the different orientations. It's useful for Heat Geek to have more options for how they're fitted. I couldn't understand why you would ever want to fit it the wrong way when the manufacturer is very clear about how it should be used.

# Plate Heat Exchangers

It's helpful to understand how [plate heat exchangers](https://en.wikipedia.org/wiki/Plate_heat_exchanger) are constructed. 

{% include candid-image.html src="/assets/images/home-assistant/plate-heat-exchanger.svg" attrib="Ub derivative work: Malyszkz, [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/), via Wikimedia Commons" alt="Plate Heat Exchangers Schematic" %}

Internally, there's a stack of metal plates with connections in each corner. On each plate, two of the connections are sealed off pass-throughs, while water can flow across the plate between the other two. The plates are stacked with alternating orientations. The result is two separate circuits through the heat exchanger. 

Water entering through the blue inlet flows through the pass-through connections on the red plates, across the blue plates and then back through the blue outlet. Similarly, water entering through the red inlet flows through the pass-through connections on the blue plates, across the red plates and then back through the red outlet.

The plates are corrugated to increase the surface area that heat can be exchanged across, and to promote turbulent flow which also improves heat transfer.

Just like a radiator, air can become trapped. Unlike a radiator, there's no valve you can use to release trapped air. The only way out is through one of the two open connections on each plate. Air will move upwards, so you need to orient the heat exchanger so that there's an open connection at the top of each plate.

This doesn't work at all if the heat exchanger is on its back. Air bubbles get stuck in the corrugations. It also makes for a poor heat store. Heat stores work best if they promote [stratification](https://www.stovesonline.co.uk/accumulator-tank-stratification.html). Hot water stays at the top of the tank where it's drawn off, while cold water enters the tank at the bottom and stays there. If the heat exchanger is on its back, the stored water can't move vertically.

The heat exchanger will stratify if placed on its end or on its side. However, air can only escape from all plates if the heat exchanger is oriented vertically, on its end. Nordic Tec heat exchangers are unusual in that the connections for each circuit are on the same side, unlike the diagram where they're in opposite corners. If you put the heat exchanger on its side, one of the circuits will have both its connections on the bottom. The only orientation that works is on its end.

# The Plan

I agreed with Damon to have one last throw of the dice. It's taken long enough already. We can't keep doing one little change at a time.

The heat exchanger will be re-oriented on its end. Both valves will be replaced. The long awaited dedicated diverter valve on the way in, and a new VTA320 series mixer valve on the way out. 

The heat exchanger will be boxed in with 50mm PIR insulation board to match the MiniStore's 50mm insulation.

Damon will also add a T-connector at the cold water inlet that can be used as a sensor pocket. The temperature sensor should respond much quicker when hot water is drawn off.

# The Reality

Damon spent 20th January trying to find a way to fit everything into our narrow airing cupboard. The big problem with standing the heat exchanger on its end is that you need more front to back space for the connecting pipework. In the end only way of doing it was with connections facing forward towards the door. Apparently, it's more conventional to have connections facing the back wall. There's only just enough room to take the pipework round and back while still being able to shut the door.

There wasn't enough room to include the T-connector sensor pocket. The tank temperature sensor is on the side of the heat exchanger near the cold water inlet.

{% include candid-image.html src="/assets/images/home-assistant/reoriented-heat-exchanger.jpg" alt="Reoriented Heat Exchanger" %}

Damon got everything plumbed in and running but ran out of time to box in the heat exchanger with insulation board.

# Tank Temperature

The lack of additional insulation gave me the chance to better understand how the temperature sensor behaves with a stratified heat store. The NanoStore now behaves much more like a normal hot water cylinder. 

The sensor is placed near the bottom to be responsive to hot water demand when setup for instant hot water. When doing a DHW run, flow temperature gets over 70°C before the sensor reaches the 55°C tank set point. When the DHW run ends, the measured temperature drops to around 48°C within 5-10 minutes, due to stratification. 

At this point, I measured the temperature of the heat exchanger using a probe thermometer. The top of the heat exchanger (near the hot water outlet) is at 66°C, half way down is 61°C and right next to the cold water inlet is 42°C. According to Adam, this is normal for a hot water cylinder. 

The overnight DHW run (using cheap rate electricity) has a set point of 62°C. After a few hours the reported temperature reaches 48°C. However, the measured temperatures are less stratified with 55°C at the top, 48°C half way down and 44°C at the bottom. 

I dropped the tank set point to 45°C to allow for stratification. When 45°C is reached at the bottom of the tank, the top should be around 55°C. You can think of the measured value as the minimum temperature of hot water in the "tank". 

I had to increase hysteresis for recharging to 10°C, allowing for the 7°C drop at the end of a DHW run plus 3°C heat loss over time, before triggering a top up. That does mean instant hot water will only work if temperature at the sensor drops more than 10°C on DHW demand.

# Insulation

Damon returned a couple of days later to finish the job. There was only room at the front for 50mm of PIR board. The top and sides have 25mm. That still gets close to MiniStore levels of insulation taking into account the existing 20mm foam cell insulation. If needed, we could also stuff the gaps with wool insulation.

{% include candid-image.html src="/assets/images/home-assistant/insulated-heat-exchanger.jpg" alt="Insulated Heat Exchanger" %}

I compared the times needed for heat to drop 4°C from the "nominal" temperature for different setups. This is the expected temperature measured after a DHW run, after allowing for settling.

| Orientation | Insulation | Nominal °C | Hours |
|-|-|-|-|
| Back | 20mm foam cell | 55 | 2.5 |
| Back | 20mm foam cell + laundry | 55 | 3 |
| Vertical | 20mm foam cell | 45 | 3.5 |
| Vertical | 20mm foam cell + 25mm PIR board | 45 | 7 |

The current heat loss is equivalent to 0.57°C an hour, which is almost exactly what you'd expect from a 60L MiniStore XL. The end result for us is that an overnight DHW run provides enough hot water for one quick shower and hand washing throughout the day, while still being hot enough for washing up in the evening.

# Diverter Valve

The new diverter valve works as advertised, with some interesting consequences. 

{% include candid-image.html src="/assets/images/home-assistant/diverter-valve-overnight-dhw.png" alt="Diverter Valve overnight DHW run" %}

This is an overnight DHW run with the valve set to open at 48°C. Unlike the previous valve, there's now no heat lost at all as the flow temperature ramps. The valve is fully shut below temperature. The valve opens at the required temperature. There's a huge dump of heat with a deltaT up to 13°C. The valve is fully open above temperature.

As the cold water pushed out of the bottom of the heat exchanger flows back round through the heat pump, the flow temperature falls back to 42°C, and the valve briefly closes again while the temperature ramps back up. There are spikes of heat as pulses of cooler water circulate round to the heat pump and back, before eventually settling into a steady ramp with a consistent deltaT of 3°C.

I was hoping that the new valve together with the reorientation of the heat exchanger would charge the heat store significantly faster. However, once you get to the point of steady ramping, there's not much difference.

# Mixer Heaven

The new VTA320 series mixer valve has a nominal 35°C-60°C range, accurate to ±2°C, down to 4L/min flow rate. There are no temperatures or numbers marked on the valve. Just turn it until you get what you want.

We tested the temperature at the bathroom tap with the valve fully closed and fully open. We got a range of 34°C-61°C. The top end result suggests that the temperature is stable even with less than 10°C difference between the hot input and desired output.

We adjusted the valve until we were getting 45°C at the tap.

The valve is a total game changer. Shower temperatures are rock solid stable. Doesn't matter what the flow rate is, even below 4L/min. Doesn't matter what the input temperature is, even down to 45°C. As far as I can tell, there's no cold water mixed in once the input temperature is below 45°C. 

You absolutely can shower indefinitely, even during cold weather, by lowering the flow rate appropriately. 

# Instant Hot Water

Now for the big test. Does this setup give you instant hot water? As much as you need?

There was a DHW run to 45°C, 20 minutes before my shower. The top of the tank was measured at 55°C. There's a 10°C hysteresis. The diverter valve is set at 50°C. We want 45°C at the tap, so that seems like a reasonable margin.

When I started the shower, the tank sensor reported 40°C. Unfortunately, the Vaillant controls only update the reported value at 5 minute intervals. The next sample reported a temperature of 23°C. Well beyond what's needed to overcome the hysteresis.

I set the shower to a 6L/min flow rate, standard for a water saving shower head. It took 3 minutes from the start of the shower for the DHW cycle to kick in. Similar to the response time for the previous setup. 

The shower temperature was stable for 8.5 minutes and started to gradually get cooler. I reduced the flow rate to 4L/min. 

Ten minutes into my shower, the water is getting really quite cold. The heat pump has reached the 50°C threshold and started adding heat. Another minute, and the shower is back at temperature and stayed stable for the rest of the shower. 

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

# Flow Sensor

  2. Move sensor up. Lowest place that keeps stable temperature as stratification happens. Think of value as average temperature. Set hysteresis to 3°C. Instant hot water only works if temperature as this point drops quickly enough when there's DHW demand. 
  3. Use separate sensors for stored tank temperature and spotting DHW demand. For example, Adam used a flow sensor on another NanoStore trial. When there's no demand the Vaillant controls see the stored water temperature (high on the heat exchanger), when hot water is drawn off, the flow sensor switches the temperature input to a fixed value just below `setpoint - hysteresis` to force DHW run.
* Adam recommended option 1, normal behavior for a hot water cylinder
* In test with flow sensor Adam found that ramping time for heat pump is related to store temperature. At low store temperature, heat pump is running at low power, presumably on the basis that it doesn't need much power to heat water at low temperature. As temperature goes up, heat pump power does too. If you connect Vaillant controls to a temperature sensor at 45°C when DHW demand starts, it ramps up within a minute. 
* Looked for evidence of similar effects with my setup. Found a case where water had been boosted before a shower with tank temperature already at 45°C.  Took 7 minutes from start of DHW cycle until full power, tank staying at 45°C or above as no water drawn off. Not anywhere near Adam's reported performance.
* Conversely, in cases where water is being heated from cold, it takes 12 minutes to get to full power. 

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
