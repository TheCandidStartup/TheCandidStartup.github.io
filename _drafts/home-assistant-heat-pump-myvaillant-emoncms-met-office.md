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

I was very pleased with myself until I noticed that the reported values change much less frequently than once a minute. This seems to be something in the myVAILLANT backend. I see the same behavior in the app. At least now the values reported by the app and Home Assistant change at the same time.

# Emoncms Integration

{% include candid-image.html src="/assets/images/home-assistant/emoncms-integration.png" alt="Emoncms Integration" %}

Open Energy Monitoring [hardware](https://shop.openenergymonitor.com/level-3-heat-pump-monitoring-bundle-emonhp/) was setup and configured as part of the heat pump installation. It's primarily there for additional monitoring by our installer, Heat Geek. That doesn't stop me figuring out what I can do with it too. 

The data gets sent to [Emoncms.org](https://emoncms.org/). Poking around their web site reveals that they have a pay-as-you-go pricing model. You need an API key to access the data. However, it looks like you pay for data written not read. When you buy the hardware you get API credits that should be good for several years. Best case scenario, it's all been paid for and I just need someone to give me access. 

I asked Damon, our local Heat Geek, and he put me in touch with his contact at Open Energy Monitoring. They sorted me out with an API read key. 

You're asked for a server URL and API read key when you configure an instance of Emoncms in Home Assistant. After that you're presented with a list of data feeds that you can subscribe to. Data feeds are equivalent to sensors in Home Assistant. That is, a measured or calculated value over a time. Unsurprisingly, the integration creates a sensor in Home Assistant for each feed you select. Strangely, the sensors are "loose", not associated with any device. This means they appear at the top level of the oveview dashboard, mixed in with your own helpers and templates.

{% include candid-image.html src="/assets/images/home-assistant/emoncms-feeds.png" alt="Emoncms Feeds" %}

There were 8 feeds that looked useful. You get flow rate, flow temperature and return temperature from the heat meter, together with calculated values for heat power and energy generated (in Watts and kWh).  The electricity meter gives you power and energy consumed (also in Watts and kWh). The final feed is the DHW sensor which is either 0 when the heating circuit is active or 1 when the DHW circuit is active. 

The integration is hardcoded to retrieve values once a minute.

# Home Battery

Now that I've got all that data, what am I going to do with it? My most pressing problem is our [home battery]({% link _posts/2023-08-28-alpha-ess-smile5-home-battery.md %}). We charge the 10kWh battery overnight when electricity is cheap. I have a Home Assistant [automation]({% link _posts/2025-09-15-home-assistant-helpers-template-solar-forecasts.md %}) that sets the target state of charge based on our typical electricity consumption (5-7kWh) and the next days solar generation forecast (0-10kWh).

Our typical electricity consumption is going to look very different now that we have a heat pump. It's also going to vary hugely depending on the season. 

We run the heat pump using weather compensation. The energy generated is based entirely on the difference between the outdoor temperature and the desired indoor temperature. If I have a good hourly weather forecast for the next day, I should be able to create a heating forecast that I can add into the battery state of charge automation. 

# Met Office Weather

Home Assistant comes bundled with weather forecast and solar generation forecasts based on data from the Norwegian Meterological Institute. I found the solar generation forecast to be inaccurate in the UK and moved on to one from [Open-Meteo](https://open-meteo.com/). This is meant to use data from a variety of national weather services, including the UK's Met Office. The solar forecast is a great improvement, however the weather forecast is often inaccurate and doesn't match the forecast on the Met Office's own web site. 

Time to go direct. Home Assistant includes a [Met Office integration](https://www.home-assistant.io/integrations/metoffice/) out of the box but it needs an API key. Fortunately, getting one is free and pretty painless. 

Register an account at [Met Office DataHub](https://datahub.metoffice.gov.uk). All you need is a valid email address. Choose the Global Spot subscription and pick the free plan. Copy the ludicrously long API key and paste it into the integration's options page. 

# Predicting Heating Demand

The heat pump needs to produce enough heat to counter-balance the heat loss from the building. [Heat loss calculations](https://www.h2xengineering.com/blogs/calculating-heat-loss-simple-understandable-guide/) are complex but the underlying formula is simple. It boils down to `Heat Loss = House specific constant * dT` where `dT` is the difference between outside temperature and desired indoor temperature. 

The heat pump system design produced by our installers says that we have 6.11kW heat loss at 18°C inside, -3°C outside. That's a `dT` of 21, with a heat loss of 291W per degree. I'm going to assume passive gain of 3°C from occupant heat, solar gain, electrical devices, etc. That matches the Vaillant heat pump `OT threshold` setting. This is the outside temperature above which the heat pump won't bother turning on. You typically set that at 3°C below your target indoor temperature. In our case that's 17°C, so `dt = 14 - outside temperature`.

The idea is simple. Get the hourly weather forecast for tomorrow and determine `dT` for each hour. Sum up `291 * dT` for each hour to get the watt hours of heat needed. The electrical power needed to generate that heat is `heat needed / COP`. Actual COP [depends on](https://energy-stats.uk/how-to-measure-vaillant-arotherm-cop/) your installation, outside temperature and flow temperature.

Our design includes a minimum efficiency guarantee COP of 3.8 at -3°C. At the current outdoor temperature of 10°C the measured COP is about 5. I'm going to start with a naive linear interpolation between 5 and 3.8 for temperatures below 10°C, then adjust as I get more real world data.

{% raw %}

```jinja
{% set forecasts = forecast['weather.met_office_crookes'].forecast | list %}
{% set start = today_at('07:00') + timedelta(days=1) %}
{% set end = today_at('21:00') + timedelta(days=1) %}
{% set ns = namespace(sum=0.0) %}
{% for slot in forecasts %}
  {% set dt = slot.datetime | as_datetime %}
  {% set t = slot.temperature | float %}
  {% if dt >= start and dt <= end and t < 14 %}
    {% set cop = 5.0 %}
    {% if t < 10 %}
      {% set cop = 5.0 - (10 - t) * 0.0923 %}
    {% endif %}
    {% set ns.sum = ns.sum + (14 - t) * 0.291 / cop %}
  {% endif %}
{% endfor %}
{{ ns.sum | round(3) }}
```

{% endraw %}

We currently run the heat pump between 7:00 and 21:00 in peak time, then again during off-peak hours between 23.30 and 5.30. I'm only interested in heat demand during peak time. I store the output in a helper entity so that I can show the heating forecast on a dashboard, generate statistics, etc. 

The Jinja templating language used by Home Assistant has some quirks. One of them is that you can't modify variables defined at an outer scope (such as incrementing a sum inside a loop), unless you define them within a [namespace](https://jinja.palletsprojects.com/en/stable/templates/#assignments).

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
