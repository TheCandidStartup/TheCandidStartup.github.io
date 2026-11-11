---
title: >
  Vaillant Heat Pump: Shoulder Season
tags: gear home-assistant
---

We're often told that heat pumps run best low and slow. The advice is to leave the heating on all the time and let the heat pump use weather compensation to add just the right amount of heat. It's clearly going to be more efficient to have the heat pump running at minimum power 24/7, than at twice the power for half the time. 

What happens when you need *less* heat than the minimum power provides? The heat pump cycles on and off. At the most marginal times of year, it can be on for 20 minutes at a time or less.

Welcome to shoulder season.

# Shoulder Season

The heating has been switched off all summer. The heat pump has been relegated to domestic hot water (DHW) runs. At the end of each run the water in the circuit is at 50-60°C. The heat just sits there, slowly radiating away from the insulated pipes on the outside of the house. Most days we're more concerned with keeping cool rather than worrying about wasted heat.

As the nights start drawing in, we could make use of that heat to give the house a little boost. I added a simple Home Assistant automation to turn the heating on during each DHW run and then turn it off at the end of the heating cycle.

That got me thinking. What else could I do to put off the moment when I had to turn the heating on fully?

Shoulder season has a wide diurnal range. Temperatures drop overnight and the house needs additional heating in the morning. However, the house soon warms up with the heating hardly needed during the middle of the day. On sunny days there's masses of solar gain and the heating may not be needed at all. 

Can we extend the idea of a post-DHW heating cycle to run the heat pump at minimum power until the house is up to temperature, then stop? When (or if) the temperature falls below a threshold, run another heating cycle.

This is similar to Vaillant's [expanded mode](https://energy-stats.uk/sensocomfort-room-temp-mod-inactive-active-or-expanded/#Room_Temp_Mod_Expanded) but with the heat pump forced to run as efficiently as possible. Expanded mode is a blunt instrument with the heat pump forced to stop outside a very narrow range of temperatures, which can lead to short cycles.

# Anatomy of a Heating Cycle

To understand why short cycles are so bad, we need to understand what happens during a heating cycle. 

Vaillant heat pumps control their heat output by modulating the performance of the compressor which drives the movement of heat. The compressor can modulate smoothly between 25% and 100% of its full power.

Each heating cycle starts with the heat pump ramping up quickly to around 40% compressor modulation. This draws around 800W of electrical power on my 7kW Vaillant Arotherm Plus. After a couple of minutes the heat pump controller will adjust the modulation to try and hit a target flow temperature. The target temperature is determined by Vaillant's weather compensation logic and depends on the user's heat curve setting, the current outdoor temperature and the desired indoor temperature.

If the current flow temperature is below target, the compressor will modulate up. If it's above target, the compressor will modulate down. If it's a long way from target, the change will be more aggressive. During shoulder season, the compressor will eventually end up at 25% modulation, with the flow temperature continuing to rise above the target temperature.

The higher the flow temperature, the more power consumed by the heat pump and the lower the efficiency. We want to maximize the time that the heat pump spends operating at low flow temperatures.

{% include candid-image.html src="/assets/images/home-assistant/heat-cycle-may-day-12c.png" alt="Heat Cycle 12°C outside" %}

In mild weather, the initial two minute burst immediately gets the flow temperature above target. The compressor modulates down to the minimum level but it's too late, the flow temperature keeps climbing. There's an initial burst of heat, followed by a very pronounced dip in performance after the first 10 minutes. The heat pump reaches a steady state, with consistent heat output, after 20 minutes. 

When short cycling, the heat pump doesn't make it through the dip, resulting in a low coefficient of performance (COP) for the cycle as a whole. In contrast, if allowed to run for another 20 minutes at steady state, my heat pump achieves a COP well over 5. 

{% include candid-image.html src="/assets/images/home-assistant/heat-cycle-may-night-6c.png" alt="Heat Cycle 6°C outside" %}

During colder weather, the flow temperature is still below target after the initial burst. The compressor ramps up aggressively until the target is hit and then modulates down. Of course, the flow temperature continues to sail up beyond the target because the compressor can't modulate down enough. The dip is still there but much less pronounced.

# Energy Integral

[Energy Integral](https://energy-stats.uk/vaillant-arotherm-firmware-351-06-07-problems-energy-integral/) is the mechanism Vaillant uses to control cycling of the heat pump when the minimum modulation produces too much heat. Energy integral is implemented as a counter. Every minute the average difference between the current flow temperature and the target flow temperature is added to the counter. 

If the current flow temperature is too high, the counter goes up. The heating cycle starts with the counter at -60 (can be configured in the settings). If the counter goes over zero, the heating cycle ends. If the current flow temperature is too low, the counter goes down. Once it reaches the starting value, another heating cycle can begin.

This system ensures that the average flow temperature matches the target, while smoothing out the effects of short term deviations in flow temperature.

# Hacking the Heat Pump

I'm particularly annoyed by the heat pump's behavior in colder weather. It wastes energy ramping the modulation up to exceed the target temperature as soon as possible. Then wastes more energy because the cycle is then shorter than it would otherwise need to be. 

Is there some way I can hack the heat pump to force it to run at minimum modulation? Unfortunately, there are no settings that let you directly control the compressor level. Everything goes through the weather compensation and energy integral logic.  

Then I read about [Havenwise](https://energy-stats.uk/havenwise-review-vaillant-heat-pump/).

# Havenwise

Havenwise is a cloud based system that takes over control of your heat pump. It uses the same myVaillant API as Home Assistant does. So, how does it work?

The flow of logic in the heat pump is as follows.
1. Use Heating Curve parameter together with outside temperature and desired temperature to calculate target flow temperature.
2. Clamp the target so that it doesn't exceed the range defined by the min and max flow temperature parameters.
3. Feed target and current flow temperatures into energy integral logic which decides how to modulate the compressor and when to end the heating cycle.

Havenwise sets the heating curve to its lowest possible value of 0.1. This produces a target flow temperature just above the desired temperature. Set a minimum temperature above that and you can directly control target temperature. 

Havenwise sidesteps Vaillant's weather compensation logic and uses its own to directly drive target flow temperature. However, it still relies on Vaillant's energy integral logic to achieve the target flow temperature and handle cycling. 

I want to go one step further. 

# One Step Beyond

The heat pump will cycle if you set target temperature below the minimum that the heat pump can produce. The heat pump will ramp up aggressively if you set the target temperature too far above the current flow temperature. The trick is to keep setting the target temperature to match the current flow temperature. This will avoid any aggressive changes in modulation and extend the cycle time indefinitely if you get it bang on.

The problem is that flow temperature is a moving target. The heat pump runs at minimum power (25% compressor modulation) and you get whatever flow temperature you get depending on local conditions. Even worse, it changes during a run depending on how effective your emitters are at using that heat.
In my case, at this time of year, flow temperature at minimum power goes up steadily throughout the cycle.

I have to rely on Open Energy Monitoring (OEM) to determine flow temperature and state of the system (DHW, Heating or Standby). Vaillant cloud is too infrequently updated, with too high latency before changes are visible. My Open Energy Monitoring install includes a direct sensor on the ESBE valve to determine when the DHW circuit is active.  For Heating vs Standby, I use the power consumption of the heat pump, treating anything over 400W as actively heating.

Managing the target temperature is a balancing act. I don't want to update too frequently and hit Vaillant API rate limits. I don't want to be too far above the current flow temperature and cause the heat pump to modulate up. I don't want to be too far below as that will eat up the energy integral. My starting energy integral is configured to -100 which gives me more wiggle room. 

After lots of trial and error I came up with an approach where I update the minimum flow temperature if the current flow temperature is over a degree different. I set minimum to 0.5°C above current and define a threshold where I will update minimum again another 0.5°C past that. The idea is that current flow temperature will be under target for the same amount of time that it's over target. 

The threshold is stored in a helper entity in Home Assistant with a trigger than runs an update automation whenever the current flow temperature goes above the threshold. This restricts updates to at most once per degree of increase.

# Refining the Strategy

It *almost* works. The compressor settles at 25% modulation and the cycle length is extended. However, energy integral is still being consumed. The temperature measured by OEM is less than the value reported in the Vaillant live monitor. 

There's lots of reasons why the values might not match. The sensors are in different places (in the airing cupboard vs in the heat pump). There's 10 seconds latency on the OEM data but close to zero for the value used by the heat pump. The sensors aren't explicitly calibrated to match each other.

The live monitor reports target flow temperature to the nearest 0.5°C. I don't know whether that's just for display or applied to the actual value used in the energy integral calculation. To save my sanity I made sure that the minimum I set is also rounded to 0.5°C. To account for the differences in temperatures measured by Vaillant and OEM, I biased the threshold so that the OEM value stays between 0.7°C below and 0.3°C above target.

I can now run for as long as I like at minimum power. However, I realized that the compressor doesn't reach minimum modulation until steady state running, 20 minutes into the cycle. Unsurprisingly, if you keep target close to actual, the Vaillant controller will keep modulation steady. It drifts gradually down as, on average, flow temperature is slightly over target.

I switched strategy for the first 30 minutes of a cycle. Whenever electrical power is above 600W, we set the target flow temperature just below the current flow temperature, forcing the compressor to modulate down. Energy integral is consumed, but slowly. The heat pump ramps down to minimum modulation straight after the initial burst. 

# The Dip

{% include candid-image.html src="/assets/images/home-assistant/managed-heat-cycle-nov-10.png" alt="The Dip" %}

I'm pretty close to creating my perfect heat cycle. However, it still has a dip in performance ten minutes after startup. I've become obsessed with figuring out why. It's not just my heat pump. You can see the same thing for lots of other Vaillants on [HeatPumpMonitor.org](https://heatpumpmonitor.org/).

There's also lots of Vaillants that don't have a dip. They have the same initial ramp up of power, but then fall gracefully back into a steady state. It's also weather dependent. The dip is most pronounced during mild conditions, as it gets colder (6°C in this example), it becomes more of a plateau.

After comparing a lot of different systems, I have some theories, but no solutions. I think it all comes down to system design. If you have low system volume, and a minimal set of emitters, you're likely to have a dip. Simple open loop systems with radiators, like mine, have dips. Large houses with underfloor heating don't. 

# The Theory

At the start of a cycle, flow temperature shoots up as the compressor is driven to an initial 40% modulation. My system quickly establishes a deltaT between flow and return of 3.5°C. It then takes two minutes before the return temperature goes up. 

The system flow rate is 20L/min, which means there's 40L of water in the pipes on the shortest path around the heating circuit. It's an open loop system with radiators. The radiators have a volume of 50L, for a total system volume of 90L. 

It's important to understand the limitations of the monitoring system. Flow temperature is measured as water leaves the heat pump and enters the heating circuit. Return temperature is measured as water leaves the heating circuit to return to the heat pump. The [assumption](https://docs.openenergymonitor.org/heatpumps/basics.html) is that heat emitted into the house is `(FlowT - ReturnT) * Flow Rate * Specific Heat Capacity`. In particular, that the deltaT between flow and return is due to heat transfer into the house from your emitters.

This is only true when you've reached a steady state after startup, or when looking at the heat cycle as a whole. The first five minutes of the cycle is a great example. It looks like there's a massive spike in heat with better performance than any other point in the cycle. When I first saw this, it made me wonder whether I should restrict the heat pump to running for five minutes at a time. 

In reality, there's virtually no heat emitted in the first few minutes. It takes two minutes for any of the hot water entering the heating circuit to make it to the end of the circuit. During that time you're just measuring the deltaT between the incoming hot water and the cold water that's been sitting in the pipes and radiators. It takes around five minutes before all of the cold water has been displaced and the heating circuit is up to temperature. 

After the first two minutes, flow temperature goes up rapidly. It's easy for the heat pump to raise the temperature of the returned water by 3°C, even as it's ramping down. However, once all the cold water has gone, flow temperature flattens out and deltaT narrows to a more normal 2°C. Vaillant heat pumps maintain a constant flow rate with a deltaT of 2°C at low flow temperatures and up to 5°C at high flow temperatures. 

At this point all the water in the heating circuit has passed through the heat pump once. The momentum from that initial round trip keeps going, with flow and return temperatures rising in tandem. Flow temperature is rising faster than the heat pump can sustain. After five minutes and another round trip, the momentum has dissipated. The heat pump finally has to pay back the initial rapid rise in flow temperature. We hit the dip. 

# The Physics

{% include candid-image.html src="/assets/images/home-assistant/heat-pump-refrigerant-cycle.png" alt="Heat Pump Refrigerant Cycle" attrib="IEA (2022), [The Future of Heat Pumps](https://www.iea.org/reports/the-future-of-heat-pumps), IEA, Paris , License: CC BY 4.0" %}

Heat pumps work by pumping refrigerant around an evaporate/condense cycle. The refrigerant liquid expands and evaporates, drawing heat from the air. The refrigerant gas passes through the heat pump's compressor causing it to condense and release the captured heat.

As flow temperatures go up and the heat pump needs to work harder, more refrigerant is drawn into the circuit from an internal reservoir. Some of the energy that would otherwise go into heating water is used to bring the additional refrigerant to the correct operating conditions. 

The heat pump has been riding the initial wave of hot water, not having to work too hard. When the momentum dissipates and it has to sustain the current flow temperature all by itself, it doubles down, pulling in more refrigerant which temporarily means less heat output. If the drop in flow temperature is significant, the heat pump's logic will respond by increasing compressor modulation, which makes the dip worse. 

If you have more system volume, everything happens more slowly, you don't get the same momentum effects. Flow temperature rises less rapidly, the heat pump gradually builds up its effort. 

If you have more emitters, less heat is returned to the heat pump on each cycle, and the heat pump can maintain a low flow temperature. 

If it's cold outside, and the heating has been off, the starting flow temperature is lower. The whole startup sequence happens at lower temperatures and the dip is reduced. Some of my overnight runs have barely any dip at all.

# Managing a Full Cycle

That was a large digression, but one with a simple conclusion. The heat pump needs 20 minutes to reach a steady state and start to pay back the startup costs. In my case, I want each cycle to last at least 40 minutes.

I start a heating cycle when the current temperature is below a threshold. I end the cycle once the heat pump has been active for at least 40 minutes and the current temperature is above a threshold. 

I can't just turn the heating off to end the cycle. If you do, the pump stops running and you waste the heat that's built up in the circuit. I need to keep the pump running until the residual heat has been emitted. 

I leave the target flow temperature at it's last value so that the energy integral keeps going up as flow temperature falls. I don't want the energy integral logic to start another heating cycle before I'm ready.

Once the flow temperature falls below 23°C, I turn the heating off. Once the current temperature falls below my threshold range, I turn the heating back on. Fortunately, Vaillant resets the energy integral counter back to its starting position as long as the heating has been off for a few minutes. The new cycle starts immediately.

# Special Cases

* On rare occasions a heating cycle may end prematurely. Perhaps I didn't manage the energy integral well enough, or maybe Vaillant's API had an outage and I failed to increase the minimum flow temperature when needed. 
* If the heat pump goes inactive and the current temperature is still below threshold, I drop minimum flow temperature to 20°C. This brings down the energy integral quite rapidly. Typically, the heat pump will start a new cycle after 20 minutes or so, at which point I start managing minimum flow temperature again. 

* In normal operation, with heating on all the time, energy integral update is suspended during a DHW run. Obviously, house is still losing heat during these periods, so infuriating that heating doesn't come on immediately when requested again.
* Heat pump is already running, house is below temperature, no inefficient compressor startup to go through if heating picks up when DHW turns off.
* I turn heating on whenever a DHW run starts. The energy integral resets and the heat pump naturally transitions into heating when the DHW run ends. 

* Startup behavior very different for DHW -> Heating vs Standby -> Heating
* For DHW case, flow temperature can be 60C+ which stays steady until cold water from the radiators reaches the sensor, at which point it plummets.
* Wait until temperature below 35C then until flow temperature starts to climb again.
* Tracking actual flow temperature for first few minutes after DHW run is too risky. What happens if I set min flow temp to 65C and then Vaillant cloud access goes down and I'm left with heating running full blast. Compromise is to use 35C as initial value for DHW case. Will take a significant chunk from energy integral before hitting steady state but as long as I can hold integral from then on should be OK.

# Conclusion

* Running in shoulder mode for the last few weeks
* Been working well. Consistently getting heat cycles with COP well over 5.
* Less cycles overall. No pointless heating cycles when there's high solar gain.
* Will be interesting to see what happens when it gets colder. Need to figure out when it makes sense to transition to full heating.