---
title: Home Assistant
tags: gear
---

[Home Assistant](https://www.home-assistant.io/) has been on my radar for a while. I've always liked the idea of having a small local server running 24x7 that I could use to "automate stuff". Two things put me off doing anything about it. There was low level anxiety over picking the right hardware to run it on, but more importantly there was the lack of anything that *really* needed automating.

That changed this week. We got a new EV charger, the [Hypervolt Home 3 Pro](https://www.hypervolt.co.uk/product/hv3proaauw100t2). I wasn't expecting to replace our existing 5 year old [EO Mini Pro 2](https://www.eocharging.com/support/home-charging/eo-mini-pro-2). Then the manufacturer EOLed it. 

Normally, my response would be who cares. Keep using it until it breaks, then replace it. However, like most big ticket tech items these days, much of the EO Mini's functionality relies on a cloud backend. EO are turning the servers off and effectively bricking the device. 

# Intelligent Octopus Go

Our energy provider, [Octopus](https://octopus.energy/), has a [dedicated tariff](https://octopus.energy/smart/intelligent-octopus-go/) for EV owners that provides extremely low rates when charging in exchange for letting Octopus control when the charging happens. It's compatible with our new Hypervolt charger.

The tariff includes fixed off-peak rates between 23.30 and 5.30 but may schedule charging outside that period. If it does, you get charged the off-peak rates for those times too.

# Alpha ESS Home Battery

We also have a home storage battery, the [Alpha ESS Smile-5]({% link _posts/2023-08-28-alpha-ess-smile5-home-battery.md %}). We charge the battery overnight at off-peak rates and then use the stored energy during the day. I can configure the battery to charge during the dedicated off-peak period, but what happens if EV charging is scheduled outside that time?

Simple, the battery discharges flat out to try and meet the required load and quickly empties itself. 

Adjusting the battery configuration manually to match the Octopus charging schedule is tedious. Also futile, because the Octopus schedule frequently changes based on current and expected demand for energy. 

I want to make full use of my new toy, so I *really* need a way to automate the battery configuration.

# Existing Integrations

A few quick internet searches found people with similar problems that had solved them with Home Assistant together with existing open source integrations.
* [homeassistant-alphaESS](https://github.com/CharlesGillanders/homeassistant-alphaESS) and [AlphaESS Home Assistant via Modbus](https://projects.hillviewlodge.ie/alphaess/)
* [HomeAssistant-OctopusEnergy](https://github.com/BottlecapDave/HomeAssistant-OctopusEnergy)
* [home-assistant-hypervolt-charger](https://github.com/gndean/home-assistant-hypervolt-charger)

There were also a couple of recommendations for hardware to run it on. 

# Home Assistant Green

[Home Assistant Green](https://www.home-assistant.io/green/) is a dedicated package that comes with Home Assistant preinstalled. It's roughly equivalent to a Raspberry Pi supplied with an enclosure and a power supply. The device uses passive cooling and needs little power, around 1.5W at idle.

Before jumping in I wanted to make sure that I really could control my battery via API. 

# Alpha ESS Open API

In theory, you can integrate with Alpha ESS systems locally via a [modbus](https://en.wikipedia.org/wiki/Modbus) API, or via the cloud hosted [Alpha ESS Open API](https://open.alphaess.com/). There are Home Assistant integrations available for both. 

I'd prefer to use the modbus API and remove the dependency on someone else's cloud hosted backend. Unfortunately, Alpha ESS only expose the modbus API via a hardwired ethernet connection. My battery connects via  wifi as it's an inconveniently long way from my router. 

I'll try the Open API route first. You have to register at [https://open.alphaess.com/]( https://open.alphaess.com/) to get access to the API. You need to provide your serial number and the check code from the sticker on the side of the inverter. Be careful with these values. Anyone that knows them can get control over your system. 

# Postman

The maintainer of the Home Assistant integration has a [Postman collection](https://github.com/CharlesGillanders/alphaess-openAPI/blob/main/AlphaESS%20Open%20API.postman_collection.json) for the API. I used it to verify that I did indeed have API access.

You need to create a free Postman account so that you can fork the collection and edit the config. Click on the root node in the left hand tree and fill in the required collection level variables: AppId, AppSecret, serial number, etc. You can find all these in the Alpha ESS Open API portal. Use the "current value" fields to restrict how far the values are shared. 

Remember to press save before you try using a request. It look like you've changed variable values, the changes persist when you navigate to another page in the Postman web UI and come back, but won't be used until you explicitly save them.

Ignore the auth panel in Postman. Authentication is handled by a pre-request script that signs each request using the AppId and AppSecret. If you have any issues, click on the console button in the bottom right footer to see the actual requests being made by Postman.

After some fiddling around I got the API to work. If you already have Home Assistant, I suggest skipping this part. Getting the integration working in Home Assistant is much easier.

# Unboxing

I got my Home Assistant Green from [Pimoroni](https://shop.pimoroni.com/products/home-assistant-green?variant=54863020130683) for £85. They were much more expensive on Amazon when I looked, so shop around. 

I enjoyed the lovely recyclable cardboard packaging. Unfortunately, I was in too much of a hurry to get it plugged in to take a photo first.

{% include candid-image.html src="/assets/images/home-assistant/home-assistant-green-packaging.jpg" alt="Home Assistant Green Packaging" %}

You get the device, a cute little power supply (with adaptors for every country you can think of included), and a short ethernet cable. Plug the ethernet cable into your router (there's no wifi), plug in the power and then wait while the LEDs dance furiously.

Once it's calmed down to a gentle throb it's ready for you to connect. Here's mine in situ beneath [my desk]({% link _posts/2023-05-22-desk-setup.md %}), in front of the router.

{% include candid-image.html src="/assets/images/home-assistant/home-assistant-green-router.jpg" alt="Home Assistant Green in situ, in front of router" %}

# .Local

* Was wondering how this would work. Will have got an IP address from router via DHCP. How do I find out what it is?
* You use the URL `http://homeassistant.local:8123`
* The [.local domain](https://en.wikipedia.org/wiki/.local) is a special-use domain name that is explicitly not a top-level DNS domain.
* Most operating systems use it as a trigger for running a mDNS protocol that searches the local network for devices that respond to the name and port
* On my Mac this works flawlessly using Safari. When I tried with Chrome I was prompted to allow Chrome to search the local network which then failed after I gave permission.
* Alternatively install the HomeAssistant app for iOS or Android and let the app handle it

# HACS

* All the integrations I want to use are open source custom integrations
* The recommended way to manage these (if you don't want to fiddle around downloading and configuring files yourself) is to use [HACS](https://hacs.xyz/), the Home Assistant Community Store
* For something intended to make installing integrations easier, installing HACS is surprisingly painful
* The recommended way is to use the "Get HACS" addon for Home Assistant
* However, as HACS is considered to be "advanced" it doesn't appear in the list of available addons in the Home Assistant UI
* You need to [click on a link](https://hacs.xyz/docs/use/download/download/#to-download-hacs) which redirects to Home Assistant (remember to use Safari on a Mac) and provides it with the location of the "Get HACS" GitHub repo. 
* If everything has gone well you'll see a UI page for the addon with an install button

{% include candid-image.html src="/assets/images/home-assistant/get-hacs.png" alt="Get HACS" %}

* Once installed you'll get a start button and some instructions
* Press start and switch to the `Log` tab

{% include candid-image.html src="/assets/images/home-assistant/get-hacs-log.png" alt="Get HACS log" %}

* At this point all that you've achieved is to download HACS
* You can uninstall the addon, that's all it does
* Restart home assistant
* Now you can [configure HACS](https://hacs.xyz/docs/use/configuration/basic/)
* Got to "Settings -> Devices & services". This time HACS will show up in the list and you can add it as an integration.
* Agree to the four scary checkboxes and press submit
* At it's heart, HACS is simply a downloader for files stored in GitHub repos
* Integration authors register their repos with HACS which makes them discoverable in the HACS UI.
* To download the files you need a GitHub account and you need to enable access for your Home Assistant device with GitHub
* You follow the Oauth dance described in the documentation
* Finally you're done, you can now install the integrations you're actually interested in.
* HACS should appear in Home Assistant's main navigation pane

{% include candid-image.html src="/assets/images/home-assistant/hacs-ui.png" alt="HACS UI" %}

* You can browser through the customizations on offer and download the ones you want. You can also provide the GitHub URL for the repo if not listed.
* All three of mine were in the store.
* Once downloaded you have to restart Home Assistant again
* The integrations you've added should now appear when you search for them in "Settings -> Devices & Services"
* Run through their configuration wizards and you should be good to go

# Overview

* Default overview dashboard that is populated by integrations as you add them

{% include candid-image.html src="/assets/images/home-assistant/default-overview.png" alt="Default Overview dashboard" %}

* As you might expect, unorganized and overwhelming
* Was surprised that it's often not clear which integration a card belongs too
* You're generally relying on hints from the card content to work out what it relates to
* You can click on any [entity](https://www.home-assistant.io/docs/configuration/entities_domains/) to get more information

{% include candid-image.html src="/assets/images/home-assistant/intelligent-dispatching.png" alt="Intelligent Dispatching Entity" %}

* You can see the current state, when it last changed, a visual history of changes and a detailed log of changes
* Click on the hamburger icon and choose "Device Info" to see what device this entity is associated with. From there you can find the integration which owns the device. In my case it's a "Charger" device created by the "Octopus Energy" integration.
* Click on the gear icon to see more properties, including the entity's id, in this case it's `binary_sensor.octopus_energy_xxxxx_intelligent_dispatching`
* The first part of the id defines the [domain](https://www.home-assistant.io/docs/configuration/entities_domains/#domains) of the entity. In most cases you can think of this as a type. My Intelligent Dispatching entity is a [binary sensor](https://www.home-assistant.io/integrations/binary_sensor) which reports the state of something as on or off. In this case, it's reporting whether Octopus Energy, my electricity provider, has asked my EV charger to turn on.

# Location Tracking

* Interestingly, I'm also an entity on the dashboard.
* If I click for more info, Home Assistant shows me my location and tells me that I'm home
* When I configured my Home Assistant Green, I was asked to provide my address, which is how Home Assistant knows where home is
* When I installed the Home Assistant app on my phone, it requested access to location tracking, which is how Home Assistant knows where I am
* This can all be turned off if you don't want it
* In principle you can use location as part of your automations. For example, to turn lights on when you get home. 

# Energy

* Built in dashboard for tracking energy use
* You configure which entities it should use to determine consumption and costs
* The Octopus Energy integration I'm using has [detailed documentation](https://github.com/BottlecapDave/HomeAssistant-OctopusEnergy/blob/develop/_docs/setup/energy_dashboard.md) for how to set up Electricity and Gas consumption.
* Did my best to pick appropriate stats for Solar Production, Battery Charge, Battery Discharge, charger usage
* One wrinkle is that it only works with entities that [track a total amount](https://developers.home-assistant.io/docs/core/entity/sensor/#entities-representing-a-total-amount) (increasing over time, but may reset to 0 periodically). You can't use live values.
* Takes a while to populate with data, particularly Electricity/Gas as Octopus only makes data available for the previous day

# Custom Dashboards

* Could lose myself here. Moving on for now.

# Automations

* The reason I came in.
* Want to make sure that my battery doesn't discharge if Octopus schedules a charging session outside normal off-peak hours
* [Automations](https://www.home-assistant.io/docs/automation/basics/) consist of a trigger, optional conditions and actions
* [Triggers](https://www.home-assistant.io/docs/automation/trigger/) describe [events](https://www.home-assistant.io/docs/configuration/events/) that should trigger the automation.
* My trigger is the charger turning on.
* Events can be caused by entity state changing or by built-in events provided by Home Assistant and integrations
* [Conditions](https://www.home-assistant.io/docs/automation/condition/) are additional criteria that need to be satisfied for the automation to run.
* Common conditions could be based on time of day, position of the sun, states of other entities
* My conditions are that current time is outside of off-peak hours, Octopus control is enabled or the charger is in boost mode (full power)
* [Actions](https://www.home-assistant.io/docs/automation/action/) do something. Each entity have a set (possibly empty) of actions that it supports. There are also a variety of built-in Home Assistant actions, such as sending a notification to the HA app.
* My Alpha ESS battery integration supports two actions that change the charging and discharging settings respectively
* I want to override the standard settings when the charger turns on and reset them when the charger turns off
* My battery is configured to charge during Octopus off-peak hours between 23:30 and 5:30
* During this period the battery won't discharge
* Charging sessions outside off-peak are charged at off-peak rates. I may as well charge the battery (if needed) while also preventing discharge.
* The simplest way of forcing the battery into charge mode outside off-peak hours is to swap the start and end time. Then swap them back when the charger turns off.
* Unfortunately you have to change multiple settings in one go (which mirrors how the Alpha API works)

{% include candid-image.html src="/assets/images/home-assistant/battery-discharge-action.png" alt="Alpha ESS Battery Discharge Action" %}

* Easy, I thought, I can read existing values for things I don't want to change and pass those in
* Unfortunately, there are no entities that correspond 1:1 with each setting. The data is available, but the integration combines and formats them into composite values. 

{% include candid-image.html src="/assets/images/home-assistant/alpha-ess-diagnostic.png" alt="Alpha ESS Diagnostic Sensors" %}

* In theory I can use Home Assistant [templating](https://www.home-assistant.io/docs/configuration/templating/) to retrieve those values and extract the pieces I need. In practice that's too much effort for my first attempt at automation. 
* For now I'm going to hard code the values to those I currently use. I'll figure out a better approach later.

{% include candid-image.html src="/assets/images/home-assistant/charger-automation.png" alt="Octopus Peak Hours Charging Automation" %}

* The automation triggers when the charger turns on if smart charging is enabled and we're outside off-peak hours. If the conditions are met, five actions are executed one after the other. First, the charging settings are changed to enable battery charging and a notification is sent to my phone.
* The magic is in the [wait for triggers](https://www.home-assistant.io/docs/scripts/#wait-for-a-trigger) action. We wait until the charger turns off or we reach the start of the off-peak period, whichever happens first. Then we reset the charging period to the normal off-peak hours and send another notification that it's all over.
