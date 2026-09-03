---
title: >
  Heat Geek NanoStore: Summer Time
tags: gear home-assistant
---

wise words

# Temperature Sensor

* [Last time]({% link _posts/2026-04-07-heat-geek-nano-store-dhw-update.md %}) left you with a cliff hanger. Had found that the tank temperature sensor was providing erratic values.
* Was replaced May 15th. I also got them to move the sensor up near the middle of the tank. Previous position at the bottom near cold water inlet was meant to respond quickly when hot water drawn off to start the heat pump. Never responded quickly enough for the heat pump to ramp up in time before the stored hot water ran out. At the same time, had the downside in winter that it would report values lower than 10°C triggering the heat pump to run a frost protection cycle, while the top of the store still had plenty of hot water!
* We boost the hot water before a shower, so makes more sense to put the sensor where it will more accurately report remaining hot water temperature.

{% include candid-image.html src="/assets/images/home-assistant/dhw-temp-sep-3.png" alt="DHW run flow and tank temperatures, September 2nd" %}

* Sensible looking tank temperature curve (in orange, Vaillant cloud only updates values every 5 minutes). Once DHW run ends (flow temperature shown in blue), temperature equalizes and then stays stable, declining gently.
* Still use Home Assistant to stop DHW run when flow temperature hits 65°C. Prevents temperature ramping up too high if the sensor goes on the blink again in future.

# DHW

* What's the effect of summer temperatures on DHW runs?
* May 16 after temperature sensor sorted
* Added 1.772kWh heat, using 1.019kWh electric for COP of 1.74
* Heating on, hot water in pipes at end of run dumped into heating circuit
* Big spike at end means detail during DWH run is squashed down on graph
* Cold night, 5C outside during 40 minute DHW run

{% include candid-image.html src="/assets/images/home-assistant/dhw-may-16.png" alt="DHW run May 16" %}

* September 2, 14C outside during 40 minute DHW run
* Added 2.285kWh of heat, using 0.982kWh electric for COP of 2.33
* Significant improvement in efficiency when warmer outside
* Heating is off, so no pump running when DHW ends. Hot water sits in the pipes and heat slowly dissipates via convection/conduction along pipes
* Towel rail in top floor bathroom gets noticeably warmer, none of the other radiators do

{% include candid-image.html src="/assets/images/home-assistant/dhw-sep-2.png" alt="DHW run September 2" %}

# Shower

* As a reminder, here's what happens when showering in winter.

{% include candid-image.html src="/assets/images/home-assistant/back-to-back-boost-shower.png" alt="Back to back Boost Showers" %}

* This is two back to back showers. It takes about 10 minutes after pressing boost for flow temperature to hit 55°C. If you run the shower at its full 8L/min flow rate, you take heat out of the store faster than the heat pump can replenish. The flow rate drops rapidly. After 8 minutes of showering you'll notice the water temperature at the shower head start to drop. 
* When the first shower ends it takes five minutes to get back up to temperature for the next shower.

* July 21, 20C outside, 25 minute shower
* What a contrast. The flow temperature keeps going up. The heat pump is providing more heat than needed. You can shower indefinitely with full flow.

{% include candid-image.html src="/assets/images/home-assistant/shower-july-21.png" alt="Shower July 21" %}

# Home Assistant

* Remove heating prediction entirely from energy consumption estimate if heating is turned off
* Home battery management to discharge during the night while above target

{% include candid-image.html src="/assets/images/home-assistant/target-soc-from-forecasts.png" alt="Automation setting target battery SOC from forecasts" %}

# Cost (£)

* Data from Octopus (dashboard + bills)

| Month | Old Gas | New Gas | Old Elec | New Elec | Old Total | New Total | Reduction |
|-|-|-|-|-|-|-|-|
| November | 85.12 | 11.26 | 40.47 | 92.22 | 125.59 | 103.34 | 18% |
| December | 101.96 | 11.42 | 43.00 | 111.43 | 144.96 | 122.85 | 15% |
| January | 134.25 | 11.88 | 44.08 | 138.02 | 178.33 | 149.90 | 16% |
| February | 108.09 | 10.31 | 37.32 | 101.27 | 145.41 | 111.58 | 23% |
| March | 79.18 | 11.32 | 36.67 | 62.03 | 115.85 | 73.35 | 37% |
| April | 55.65 | 9.18 | 24.17 | 39.95 | 79.82 | 49.13 | 38% | 
| May | 30.35 | 9.90 | 28.17 | 46.83 | 58.52 | 56.73 | 3% |
| *June* | 22.40 | 9.57 | 27.40 | 29.94 | 49.80 | 39.51 | 21% |
| *July* | 18.09 | 9.70 | 31.13 | 35.76 | 49.22 | 45.46 | 8% |
| *August* | 19.86 | 10.03 | 37.50 | 36.55 | 57.36 | 46.58 | 19% | 

# Energy Consumption (kWh)

* Data from Octopus (dashboard + bills)

| Month | Old Gas | New Gas | Old Elec | New Elec | Old Total | New Total | Reduction |
|-|-|-|-|-|-|-|-|
| November | 1227 | 21 | 273 | 672 | 1500 | 693 | 54% | 
| December | 1493 | 18 | 291 | 809 | 1784 | 827 | 54% | 
| January | 1981 | 24 | 311 | 1011 | 2292 | 1035 | 55% | 
| February | 1581 | 14 | 240 | 651 | 1821 | 665 | 63% | 
| March | 1109 | 14 | 210 | 455 | 1319 | 469 | 64% | 
| April | 664 | 8 | 78 | 370 | 742 | 378 | 49% |
| May | 296 | 16 | 131 | 354 | 427 | 370 | 13% |
| *June* | 186 | 15 | 125 | 125 | 311 | 140 | 55% |
| *July* | 145 | 10 | 176 | 207 | 321 | 217 | 32% |
| *August* | 173 | 14 | 263 | 216 | 436 | 230 | 47% | 


# Energy Breakdown

* Electrical data from Home Assistant
* Doesn't exactly match Octopus figures due to different ways of measuring and accounting periods not perfectly aligned
* Gas from table above using `Old Gas - New Gas` as best guess estimate for gas used for heating (everything apart from cooking)

| Month | Old Heat Gas | Grid Import | Solar Generated | Heat Pump | EV Charging | Other | Unit Price | Heat Ratio |
|-|-|-|-|-|-|-|-|
| November | 1206 | 677 | 55 | 338 | 119 | 267 | ≈10 | 3.57
| December | 1475 | 782 | 30 | 445 | 116 | 242 | ≈12 | 3.31
| January | 1957 | 1030 | 39 | 591 | 216 | 253 | 11.4 | 3.31
| February | 1567 | 663 | 38 | 428 | 42 | 225 | 12.3 | 3.66
| March | 1095 | 482 | 140 | 323 | 62 | 223 | 7.9 | 3.39
| April | 656 | 385 | 206 | 217 | 178 | 169 | 5.2 | 3.02
| May | 280 | 358 | 198 | 144 | 269 | 119 | 5.0 | 1.94
| *June* | 171 | 126 | 192 | 59 | 68 | 176 | 3.6 | 2.89
| *July* | 135 | 195 | 226 | 47 | 182 | 164 | 3.9 | 2.87
| *August* | 159 | 219 | 188 | 52 | 166 | 183 | 4.3 | 3.06

* Have switched heating from gas to heat pump, heat ratio is `Old Heat Gas / Heat Pump`
* Massive reduction in energy used
* As expected greater heat pump efficiency for heating vs DHW results in a higher ratio during the winter months
* Why is ratio so low for May? My best guess is difference in weather. May 2025 was a record warmth month for the UK with high pressure dominating, so significantly less heating demand than May 2026. Gas use more than halved compared with April, nowhere near that drop in heat pump usage.
* Compare heat ratio with unit cost ratio to see if you're saving money with a heat pump. If you're on standard price cap in the UK, unit cost ratio is around 3.5. I only beat that for a couple of winter months.
* Fortunately, I'm on a smart electricity tariff paying 7p a kWh off-peak, 28p a kWh at peak times. Gas is 7p a kWh at all times.
* Even more fortunately, I have a battery and solar panels. I can switch some of my peak time consumption to off peak prices using the battery. Any solar I consume is free.
* I've calculated an average unit electricity price for each month using Home Assistant data that tracks my peak and off-peak grid import separately. I only have this data for January onwards, so figures for November and December are estimated.
* In the winter months my battery runs out before the end of the day requiring some consumption of peak rate electricity. Average unit price is still well below break-even level compared with gas.
* In the summer months I use effectively zero peak rate electricity which combined with high solar generation results in an average unit price significantly less than gas. More than offsetting the lower heat pump efficiency.