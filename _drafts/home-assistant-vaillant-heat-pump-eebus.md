---
title: >
  Home Assistant: EEBUS integration with Vaillant Heat Pump
tags: home-assistant heat-pump
---

wise words

* EEBUS is an standard that allows heat pumps and other devices to exchange energy data and coordinate with home energy management systems
* Vaillant heat pumps with the Vaillant internet gateway support the EEBUS protocol
* There are multiple integrations for Home Assistant which allow it to operate as an EEBUS home energy management system
* Best of all everything happens on your local network, no cloud servers required. No additional hardware needed.
* Decided to use the [eebus-ha-bridge](https://github.com/volschin/eebus-ha-bridge) integration
* Specifically designed to work with heat pumps, and Vaillant in particular
* Exposes sensibly named and typed entities in Home Assistant
* Multiple contributors and a decent history of releases

# Installation

* Documentation is in German but browser translated the page well enough for me
* Simplest if you have a dedicated Home Assistant device, running on Home Assistant OS, like my Home Assistant Green. Check the documentation for other scenarios.
* Project consists of both a Home Assistant Marketplace (formerly HACS) integration and an Addon
* You have to install the same GitHub repo *twice*, once as an integration and once as an addon. 
* The instructions assume you wilL install integration, install and start addon, then finally configure the integration
* When I tried it, Marketplace immediately launches the integration configuration wizard after installation. It won't work until you have the addon running. Open another instance of the Home Assistant client, install and run the addon, then come back to complete the wizard.
* First screen asked for host and port to use when connecting to the Addon. Use "localhost" and the default port number.
* Next screen asks for the "SKI" identifier for the device you're connecting to
* The instructions assume that the EEBus device you're integrating with is available and running when you start the Addon. You're asked to look in the Addon logs to find the SKI identifier for the device.
* Vaillant EEBus support is off by default. Use the myVaillant app to enable it before installing anything in home assistant
* Start app -> Hamburger Menu -> Network Settings -> EEBUS
* I didn't do this so didn't know what to enter. Fortunately, you can also get the SKI from the Vaillant app in EEBUS -> Gateway Info.
* While you're in the EEBUS section of the app, you should see Home Assistant appear in the list of available devices. Select it and hit the Trust button. This gives Home Assistant permission to talk to the gateway.
* Copy the SKI identifier into the Home Assistant config wizard and submit
* It should find the device, confirm that it's a Vaillant Arotherm and create a corresponding Home Assistant device and entities
* Disk space up 400MB after install, most of which is the docker container for the Addon
* Negligible CPU and memory usage while running

# Features

* Was hoping to use EEBus as a local replacement for the myVaillant API
* Have sensors that update more frequently than myVaillant's ridiculous five minute interval
* End up with something more robust that doesn't depend on Internet connectivity and Vaillant's cloud servers
* You get climate and water heater entities that cover the core functionality in the Vaillant app
* Hot Water Boost
* Indoor and Outdoor temperature sensors
* Power consumption
* Generic status and diagnostic sensors
* Doesn't cover complete set of myVaillant Features
  * No schedules
  * No HVAC
  * No absence mode
  * No heat curve or minimum flow temperature
* EEBus protocol includes flow and return temperatures but Vaillant doesn't support that feature
* Energy Management Features
  * Power limiting
  * Power flexibility

# Latency

* Architecture is push based, no polling
* State changes (Idle, Heat, DHW) seem to be pushed immediately
* Continuous values like power and temperature are pushed once a minute
* Power rounded to nearest watt, temperature rounded to nearest 0.5C, rather than the 0.1C in myVaillant
* Not as good as I was hoping. Spoiled by OEM and it's 10 second latency, temperatures to 0.01C.
* Can't replace all of what I use myVaillant for
