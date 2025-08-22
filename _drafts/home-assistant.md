---
title: Home Assistant
tags: gear
---

wise words

# Alpha ESS

* Integrate locally via modbus API or via cloud hosted Alpha ESS Open AI
* Modbus gives more control and doesn't need internet connection but does need hardwired ethernet or an ethernet to wifi repeater
* Try Open AI route first
* Register at [https://open.alphaess.com/]( https://open.alphaess.com/)
* Need you serial number and check code from the sticker on the side of the inverter
* Anyone with physical access to your inverter can register to control with API!

# Postman

* Alpha ESS Open API [Postman collection](https://github.com/CharlesGillanders/alphaess-openAPI/blob/main/AlphaESS%20Open%20API.postman_collection.json)
* Create free account
* Fork collection so you can edit config
* Fill in collection level variables (click on root node) - AppId, AppSecret, serial number, etc. Use current values to restrict how far they're shared.
* Ignore auth panel. Auth is handled by pre-request script that signs request using AppId and AppSecret
* Remember to press save before you try using a request. Look like you've changed value, persists when you navigate to another page in Postman web UI and come back, but won't be used.
* Click on console button in bottom right footer to see actual request made
* Hurray - API works!

# Home Assistant Green

* All-in-one package with Home Assistant preinstalled
* Lovely cardboard packaging
* Device, power supply and ethernet cable included
* Plug in to router (no wifi), plug in power, then wait while the LEDs dance furiously
* Once it's calmed down to a gentle throb it's ready for you to connect

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
