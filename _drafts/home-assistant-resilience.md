---
title: >
  Home Assistant: Resilience
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

Home Assistant makes it easy to throw some automations together. I've written a few. There's just a few niggling problems where things don't work quite right.

Home Assistant provides a high level abstraction over a fundamentally messy and unreliable reality. It's not surprising that the provided abstraction is often [leaky](https://en.wikipedia.org/wiki/Leaky_abstraction). Sometimes, you have to go the extra mile to plug the holes.

# Backups

The Home Assistant instance is a single point of failure. It would be remiss of me to talk about resilience without first pointing that out. 

Make sure you have backups enabled. It's really easy to setup on-device backups. Only a little more effort to get them uploaded to the cloud host of your choice.

{% include candid-image.html src="/assets/images/home-assistant/backups.png" alt="Backups" %}

I used Google Drive. There was a complex sequence of choreography required to authorize Home Assistant to upload files to my Google Drive. The documentation does a great job of walking you through it. 


# Hypervolt Integration Gets Stuck

The Hypervolt integration is unusual in that sensors are updated every seconds rather than minutes. No, we're not running a DDOS attack against Hypervolt's servers. Hypervolt has a web socket based API. Updates are pushed to Home Assistant rather than the integration having to poll a REST API.

Which is great, unless the updates [stop coming](https://github.com/gndean/home-assistant-hypervolt-charger/issues/88). Once it happened to me too, I became incentivised to try and do something about it.

# Redundant Grid I/O Sensor

I have two CT clamps monitoring grid power import and export. On came with my Alpha ESS home battery installation, the other with the Hypervolt EV charger. The clamps are accessible as sensors via two separate Home Assistant integrations.

The Alpha ESS values are updated every minute by polling a REST API, the Hypervolt values update every 3 seconds or so, via a web socket API. I use the Hypervolt values for my dashboards and automations because of the higher resolution. Which is no use if it intermittently stops working. Maybe I'd be better off using the low resolution reliable one instead.

Why not use both of them? All problems in Home Assistant can be solved by adding a template sensor. In this case I can create a template sensor that reports the value of the most recently updated CT clamp sensor. If Hypervolt gets stuck, we'll still get updates every minute from the Alpha ESS sensor.

I had to directly edit YAML files rather than use the Visual Editor so that I could define [triggers](https://www.home-assistant.io/integrations/template/#trigger-based-template-entities) and [attributes](https://www.home-assistant.io/integrations/template/#sensor-configuration-variables). 

Rather than using a state based template and having to compare `last_updated` properties to decide which source to use, I use explicit triggers on the source entities and just return the value of whichever entity triggered the update. I add a source attribute so you can see whether the value came from `hypervolt` or `alpha`.

{% raw %}

```yaml
template:
  - triggers:
      - trigger: state
        entity_id: sensor.hypervolt_grid_power
        id: hypervolt
      - trigger: state
        entity_id: sensor.instantaneous_grid_i_o_total
        id: alpha
    sensor:
      - name: Composite Grid I/O
        default_entity_id: sensor.composite_grid
        unique_id: e78b3259-5fec-4cfd-892e-b8512057ea1c
        unit_of_measurement: "W"
        state_class: "measurement"
        device_class: "power"
        state: >
          {% if trigger.id == 'hypervolt' %}
            {{ states('sensor.hypervolt_grid_power') }}
          {% else %}
            {{ states('sensor.instantaneous_grid_i_o_total') }}
          {% endif %}
        attributes:
          source: "{{ trigger.id }}"
```

{% endraw %}

It looks simple enough, but ended up being a really painful development experience. I used the Studio Code Server addon to get syntax checking for conformance with the Home Assistant schema. It mostly works great and let me fix errors immediately. The problem is that there are also false positives. Maybe the schema bundled with the addon is out of date?

{% include candid-image.html src="/assets/images/home-assistant/template-sensor-editor-false-errors.png" alt="False Postive Errors in Studio Code Server editor" %}

It took me ages to work out that my YAML was actually fine. Obviously, there's no live preview of the output value as you get with the Visual Editor. To make changes take effect you have to save the file and then go to "Developer Tools -> YAML" and click on "Template Entries" to reload the config. Then see if you can find the sensor that the template should have created.

If not, and you're really lucky, you might get a notification from Home Assistant with an error message extracted from the logs. More likely, you'll be stuck making random simplifying changes until you work out which bit is wrong.

Once the sensor was actually created, I needed to work out why it wasn't working properly. It always returned the value from the Alpha ESS sensor. 

The problem was that I'd used double quotes around `hypervolt` in the `if` condition. The [Jinja documentation](https://jinja.palletsprojects.com/en/latest/templates/#literals) says that string literals can use double or single quotes. However, for whatever reason, in this circumstance, it didn't work until I changed to single quotes.

My dashboards are driven from utility meters based on an integral sensor that in turn uses the Hypervolt sensor. All I needed to do was change the input for the integral sensor. All my existing statistics continued to be valid. One of the benefits of layers of indirection.

# Automating Hypervolt restart

* Possible to [write an automation](https://github.com/gndean/home-assistant-hypervolt-charger/issues/92#issuecomment-2954067886) that detects when Hypervolt sensor is stuck and restart the integration.
* The attribute on the Composite Grid I/O sensor gives us an easy way to determine if the Hypervolt integration is stuck.

```yaml
alias: Hypervolt Grid  Power Stuck
description: ""
triggers:
  - trigger: state
    entity_id:
      - sensor.composite_grid
    attribute: source
    to: alpha
    for:
      hours: 0
      minutes: 5
      seconds: 0
```

* If the source attribute changes to "alpha" and remains that way for 5 minutes, the Hypervolt must be stuck. 
* For now the automation just notifies me. I want to unstick it manually once before trying to automate the procedure.
* When it happened to me I tried a bunch of things. I reloaded the integration, I refreshed the Hypervolt app, I ran the network trouble shooter tool in the app (which said everything was fine), I turned on the kettle so there would be a spike of power imported from grid. A few minutes after doing all that in a frenzy of activity it started working again. 
* Since then has happened three times more
* Second time I tried disabling and reenabling the integration. Waited 10 minutes. Made no difference. Tried the app, this time the trouble shooter reported no connectivity to the device. In the end resorted to rebooting it by turning it off and on at the circuit breaker. Was OK again after that.
* The final two times it was stuck for 20 minutes or so then sorted itself out before I saw the alert. 
* Still in monitoring mode when latest version of integration was released which restarts web socket connection if nothing received for 5 minutes. I changed my alert automation to report after 10 minutes.

# Charging Spikes

The car charging dashboard I created last time shows a couple of half-hour charging periods that supplied very little power, a combined 0.03 kWh. What's going on there?

{% include candid-image.html src="/assets/images/home-assistant/charging-spikes.png" alt="Charging Spikes" %}

The only thing happening during that hour is the spike on the right of the history graph. The charger turned on for about 5 minutes, with a current of 5A (rather than the usual 30A) and according to the Hypervolt delivered about 70Wh of energy. The spike is right at the end of the 23.00 - 23.30 period, just spilling over into 23.30 - 24.00.

I've seen this a few times when smart charging. Sometimes the Octopus scheduler decides to fill up it's quota for a period with a few minutes of trickle charging. Not a problem. In fact, good for me, because I should be charged off-peak prices for that entire hour.

Less good are the spikes to the left. These are even more transient. Each lasting about a minute, mostly below 1A with a few seconds spiking to 7A. Negligible power consumed. These spikes aren't included in the Octopus completed dispatches, so are presumably charged at peak rates. I don't know whether these are Octopus testing whether the car is prepared to charge, or some glitch of the charger. 

Given that virtually no power is consumed, it wouldn't matter, except each spike triggers an automation that starts charging my home battery. That draws a sustained 20A. Even worse, the API that the Alpha-ESS battery integration uses is rate limited to once a minute. The integration waits where needed to ensure there is at least a minute between calls. Which means that even if the spike was only a few seconds long, the battery would charge for at least a minute. 

I crafted a more resilient automation trigger that ignores the transient spikes. There are two triggers. The main trigger uses the Hypervolt session energy sensor. I wait until at least 10Wh of power have been delivered. This takes a few seconds when the car is charging normally, while never reaching that threshold for the transient spikes. The second trigger is a fallback. If charging has been active for two minutes and is still going, we trigger the automation anyway.

```yaml
triggers:
  - trigger: state
    entity_id:
      - switch.hypervolt_charging
    to: "on"
    for:
      minutes: 2
  - trigger: numeric_state
    entity_id:
      - sensor.hypervolt_session_energy
    above: 10
conditions:
  - condition: state
    entity_id: switch.octopus_energy_XXXXX_intelligent_smart_charge
    state: "on"
  - condition: state
    entity_id: switch.hypervolt_charging
    state: "on"
```

The automation completes and resets the battery configuration back to normal off-peak charging when the `hypervolt_charging` sensor goes back to off. I added a trigger condition to make sure that the automation only runs if it's on (in case there's some glitch where session energy changes while charging is off).

# Next Time

* Resilient battery automation, but first Heat Pump setup?
