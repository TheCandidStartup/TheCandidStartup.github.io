---
title: >
  Home Assistant Heat Pump: myVAILLANT, Emoncms and Met Office
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

Now that we have a heat pump [up and running]({% link _posts/2025-10-27-vaillant_arotherm_heat_pump.md %}), the obvious next job is to get it hooked up to Home Assistant. Our heat pump is a Vaillant AroTHERM plus. A quick search of the Home Assistant Community Store turns up the [myVAILLANT](https://github.com/signalkraft/mypyllant-component) integration which uses the same API as Vaillant's myVAILLANT app. 

We also have [Open Energy Monitoring](https://openenergymonitor.org/) hooked up which sends data to their [Emoncms.org](https://emoncms.org/) backend. There's a built in Home Assistant [integration](https://www.home-assistant.io/integrations/emoncms/) for that.

# myVAILLANT Integration

{% include candid-image.html src="/assets/images/home-assistant/myvaillant-integration.png" alt="myVAILLANT Integration" %}

When I first added the myVAILLANT integration it hadn't been updated in 5 months. There was some nervous chatter wondering if it had been abandoned. Someone was promoting their own [fork](https://github.com/rmalbrecht/VaillantCloud) but that hadn't been updated for 3 months either. There were another 30 older forks too.

I decided to go with the original and see how I got on. To configure the integration you need the email and password you use with the myVAILLANT app. You then have a long list of options for what types of data you want to retrieve and how often to retrieve it.

It seems that Vaillant enforces an aggressive quota on calls to their API. There are lots of warnings about "quota exceeded" errors if you ask for too much data too frequently. I started with the defaults, which update most sensors every 5 minutes. This is OK for long term trends but not much use if you're trying to understand what's going on during a single heating cycle. 

You get access to indoor and outdoor temperature, flow rate, flow temperature, water temperature, system pressure and all the settings you can tweak in the app. There's also data about energy use but, like the app, it's infrequently updated and coarse grained. 

A few days ago, most of the sensors became "unavailable" and the Home Assistant logs started filling up with "quota exceeded" errors. Vaillant had tightened up their quotas again, with some APIs limited to one call an hour. After changing the update rate to once an hour, the integration limped back into life. 

At this point the repo burst back into life and there were a succession of new releases trying to fix the problem. Vaillant appeared to have set their quotas to match query patterns from their app. The APIs with ultra low quotas were for data that changed infrequently, like the current time zone. Clearly the app was caching more aggressively than the integration. After a short game of whack-a-mole all the effected APIs were cached in the integration too. There were also additional options to further restrict the data returned.

At this point I knew that I only needed the standard set of data. Once I turned off all the optional data, the handy "Vaillant API request count" sensor showed me that the integration was averaging 2-3 calls per update. I was able to increase the update rate to once a minute without exceeding the quota. 

# Emoncms Integration

* Open Energy Monitoring hardware setup and configured as part of the heat pump installation
* Figuring out what I can do with it now
* Emoncms.org uses pay-as-you-go pricing. You need an API key to access the data.
* When you buy Open Energy Monitoring hardware you get API credits that should be good for several years
* Asked Damon and he put me in touch with his contact at Open Energy Monitoring and they sorted me out with a read key
* API read key
* Choose feeds
* Once per minute updates
* Docs suggest that Emoncms runs locally on the data logger and then synchronizes with Emoncms.org. Can I retrieve the data locally?

# Home Battery

# Met Office Weather

* Register at [Met Office DataHub](https://datahub.metoffice.gov.uk)
* Choose Global Spot subscription and free plan
* Copy the ludicrously long API key
* Add the Met Office integration (Home Assistant standard integration rather than HACS)
* Paste the API key into the options

# Predicting Energy Use

* Predicting energy use
  * Heat loss formula is Heat Loss = House specific constant x dT
  * Design says 6.11 kW heat loss at 18 degrees inside, -3 outside
  * dT = 21, therefore heat loss is 291 W per degree
  * Passive gain equivalent to three degrees an hour from occupant heat, solar gain, other electricial devices. Equivalent to target temperate - OT threshold (cut off below which heat pump won't bother turning on)
  * Get hourly weather forecast and determine dT for each hour
  * Sum up 291 * dT for each hour to get Wh of heat needed
  * Electricity needed to generate that heat is heat needed / COP. 
  * Design gives minimum efficiency guarantee of 3.8 at max 45 degrees flow rate (dT up to 21 degrees)
  * Measured efficiency of 5 running at minimum output at 10 degrees outside.
  * Actual COP [depends on](https://energy-stats.uk/how-to-measure-vaillant-arotherm-cop/) your installation, outside temperature and flow temperature
  * Given fixed target temperature, fixed installation, flow temp is a function of outside temperature (via heat curve)
  * Pragmatic approach is to measure COP at different outside temperatures and use a lookup table for expected COP given expected temperature

* Jinja
  * Can't modify variables defined at outer scope (e.g. increment sum inside a loop)
  * Have to create a namespace object to hold the variable which can be modified from any scope

# Statistics

* Stats
  * Split electric/heat energy from open energy monitoring into heating and hot water using utility meter (daily)
  * Heat energy generated has 1kWh granularity which isn't great when metering
  * Apparently this is common for heat meters
  * Power is reported to nearest Watt so switched to an integral over power for my dashboards
  * Energy stats for myVaillant are too coarse grained and infrequently updated
  * Calculate COP for each per day just before daily reset, also time when nothing running.
  * More complicated to get fine grained COP and also less meaningful as dependent on where cycle boundaries lie
  * Hack to make stats somewhat useful. Mark entity as `unavailable` for period during day before COP calculated.
  * Avoids having previous days value used for average/max/min
  * Average of daily COP across year is NOT SCOP. For that need to calculate total energy output/used. Which would need a custom dashboard card with `energy-date-selection` integration. Or read off the graphs and use a calculator if you really want to know ...

# Dashboards

## Heat Pump Overview

## Heat Pump Detail

* Can't beat the Emoncms web view for detailed look at the data - pulled into dashboard using a web card
* Some limited URL parameters for view (power vs histogram), time to display, explicit start and end timestamps

## Weather

* [Platinum weather card](https://github.com/Makin-Things/platinum-weather-card)
  * Looks good on paper but only a subset of attributes provided by Met Office were picked up
  * Couldn't get daily forecast slots to work at all
  * No significant updates for last 3 years. Looks like it predates changes in 2023.9 for how detailed forecast data is accessed
  * There's a [fork](https://github.com/tommyjlong/platinum-weather-card) which hacks in support but now I've found hourly weather card I'm not bothered anymore ...
* [Hourly weather card](https://github.com/decompil3d/lovelace-hourly-weather)
  * Brilliant!
  * Great overview of day ahead
  * Pulls in wind and precipitation too
  * Sprinkle of templating support so you can do things like show tomorrows weather from a fixed start point tomorrow
