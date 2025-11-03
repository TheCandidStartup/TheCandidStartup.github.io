---
title: Open Energy Monitoring
tags: gear
---

wise words

* Covered briefly when talking about Heat Pump installation and initial Home Assistant setup.
* Worth a deeper dive
* Like Home Assistant, runs on a small Raspberry Pi level computer. Install the software on your own hardware or buy a kit from Open Energy Monitoring shop.

{% include candid-image.html src="/assets/images/home-assistant/emonTx5.jpg" alt="emonHP data logger" %}

* Installed with my Heat Pump so that Heat Geek can monitor performance. Catching up with what I can do with it.

{% include candid-image.html src="/assets/images/home-assistant/electric-schematic.svg" alt="Electrical Schematic" %}

* Heat meter and emonHP have separate power supplies. According to the electrician, these have to be behind a 5A fuse. Used an extension lead with a 5A fuse in the plug. Not enough sockets so also needed to add an extension block.

{% include candid-image.html src="/assets/images/home-assistant/temporary-electrics.jpg" alt="Temporary Electrics" %}

* One of the sockets is being used by a WiFi extender with an ethernet cable connected to the emonHP (out of shot at the top).
* Which is weird because I can see a WiFi antenna sticking out of the top of the emonHP.
* The [installation instructions](https://files.openenergymonitor.org/emonhp.pdf) say that it supports both Ethernet and WiFi
* Press the button on the front to cycle through different screens on the small LCD display
* Each screen displays information or allows you to perform an action like shutdown, toggle Wireless AP, toggle SSH access
* Ethernet screen shows that Ethernet is connected and provides the IP address
* WiFi access point and WiFi Network are both disabled
* The wireless AP is used for setup if you don't have a wired ethernet connection
* Pointed a browser at the ethernet IP address which brought up a web interface
* First time you connect you'll start with a network configuration page
* I continued to "Emoncms login" and used the username and password in the manual

* The emonHP is actually running a local copy of Emoncms, the same system that I use to explore the data logged to Emoncms.org
* This is the full interface rather than the read only web view

{% include candid-image.html src="/assets/images/home-assistant/emoncms-inputs.png" alt="Emoncms Inputs Tab" %}

* You can see the raw inputs coming from the heat meter, electricity meter and DHW sensor (apparently connected to gpio pin 15)
* Emonhub lets you edit local configuration including the integration with the heat and electricity meters, as well as syncing of data to Emoncms.org.
* There's a Sync tab which appears to be a separate system for more fine grained sync of data to remote systems. Not used.
* There's lots more admin stuff including Network
* Let's try turning the Wifi on. Pick my home network, provide the password, success. Confirmed on the LCD screen that wifi now enabled and has its own IP address. Connection to that one works as well.
* Unplugged the ethernet cable. LCD screen confirms disconnected.
* Web admin via WiFi working. Confirmed that data still reaching Emoncms.org.

{% include candid-image.html src="/assets/images/home-assistant/emoncms-network.png" alt="Emoncms Network Tab" %}

* Shutdown emonHP, removed the WiFi extender, moved the Vaillant myConnect plug up to the socket, removed the extension brick and plugged emonHP back in. Booted up in about 5 seconds.
* Confirmed all still working.
* Much tidier. And now I have an ethernet cable, wifi extender and extension block to add to my stash of things that will come in handy one day.

# Local Logging

* Currently input data is batched up on the emonHP and then synced every 30 seconds to Emoncms.org. No local data storage.
* Can [log locally](https://docs.openenergymonitor.org/emoncms/intro-rpi.html#logging-data-locally) as well as sending to Emoncms.org
* Can pull direct into Home Assistant without relying on round trip via the internet
* Bit worried about how much space is available for data storage. Manual says that standard setup has 10 GB of data storage which is enough for 138 years with 6 feeds at 10s resolution.

{% include candid-image.html src="/assets/images/home-assistant/emonhp-system-info.png" alt="Emoncms System Info" %}

* Mine appears to be the standard setup with 10GB free on the `/var/opt/emoncms` data partition
* You create feeds from inputs using the spanner icons on the inputs page

{% include candid-image.html src="/assets/images/home-assistant/emoncms-inputs-feeds.png" alt="Emoncms Inputs after feeds configured" %}

* Badge added to each input when you create a feed
* Rather than exposing the heatmeter_Energy input with its 1kWh granularity, I used the "Power to kWh" input processor to calculate energy over time from the power input. This is equivalent to an integral in Home Assistant but should be more accurate as the inputs in Emoncms are updated every 10 seconds rather than once a minute.

* Go to Apps, create a new instance of My Heatpump app, configure the available feeds and get locally running version of Emoncms.org web view
* Can also build your own graphs, visualizations and dashboards
