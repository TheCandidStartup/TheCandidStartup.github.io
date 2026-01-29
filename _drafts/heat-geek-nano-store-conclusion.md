---
title: Heat Geek NanoStore Conclusion
tags: gear
---

[Last time]({% link _drafts/heat-geek-nano-store-update.md %}), I left you with a cliffhanger. I had a long list of issues with our [prototype Heat Geek NanoStore]({% link _posts/2025-11-17-heat-geek-nano-store.md %}), together with a plan to fix them all. 

How did it all work out?

# The Plan

The heat exchanger will be re-oriented on its end. Both valves will be replaced. The long awaited dedicated diverter valve on the way in, and a new VTA320 series mixer valve on the way out. 

The heat exchanger will be boxed in with 50mm PIR insulation board to match the MiniStore's 50mm insulation.

Damon will also add a T-connector at the cold water inlet that can be used as a sensor pocket. The temperature sensor should respond much quicker when hot water is drawn off.

# The Reality

Damon spent 20th January trying to find a way to fit everything into our narrow airing cupboard. The big problem with standing the heat exchanger on its end is that you need more front-to-back space for the connecting pipework. In the end, the only way of doing it was with connections facing forward towards the door. Apparently, it's more conventional to have connections facing the back wall. There's only just enough room to take the pipework round and back while still being able to shut the door.

There wasn't enough room to include the T-connector sensor pocket. The tank temperature sensor is on the side of the heat exchanger near the cold water inlet.

{% include candid-image.html src="/assets/images/home-assistant/reoriented-heat-exchanger.jpg" alt="Reoriented Heat Exchanger" %}

Damon got everything plumbed in and running but ran out of time to box in the heat exchanger with insulation board.

# Tank Temperature

The lack of additional insulation gave me the chance to better understand how the temperature sensor behaves with a stratified heat store. The NanoStore now behaves much more like a normal hot water cylinder. 

The sensor is placed near the bottom to be responsive to hot water demand when setup for instant hot water. When doing a DHW run, flow temperature gets over 70°C before the sensor reaches the 55°C tank set point. When the DHW run ends, the measured temperature drops to around 48°C within 5-10 minutes, due to stratification. 

At this point, I measured the temperature of the heat exchanger using a probe thermometer. The top of the heat exchanger (near the hot water outlet) is at 66°C, half way down is 61°C and right next to the cold water inlet is 42°C. According to Adam from Heat Geek, this is normal for a hot water cylinder. 

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

Ten minutes into my shower, the water is getting really quite cold. The heat pump has reached the 50°C threshold and started adding heat. Another minute, and the water is back at temperature and stayed stable for the rest of the shower. 

{% include candid-image.html src="/assets/images/home-assistant/diverter-valve-instant-hot-water.png" alt="Diverter Valve instant hot water run" %}

The [Open Energy Monitoring]({% link _posts/2025-11-10-open-energy-monitoring.md %}) graph is much more dramatic than the shower felt. It took so long for the heat pump to ramp up that temperature in the store was well below the 50°C threshold. You get a huge dump of heat into the store, before the cold water pushed out and circulated round closes the diverter valve. After a couple of minutes the flow rate is at 50°C again and the cycle repeats.

The shower is taking energy out of the store at the same rate that, on average, the heat pump is adding it. The added heat lasts just long enough to keep the shower hot until the next heat dump. The temperature in the shower stays perfectly stable.

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

# Conclusion

