---
title: >
  Home Assistant: Resilience
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

wise words
* Easy to throw a set of automations together
* How resilient are they when things go wrong?

# Hypervolt Integration Gets Stuck

* Most sensor updates are pushed from the charger via a websocket
* Sometimes the updates [stop coming](https://github.com/gndean/home-assistant-hypervolt-charger/issues/88)
* Need to restart the integration or force a refresh using the Hypervolt app
* As always, once it happened to me I became incentivised to try and so something about it
* How can we mitigate the problem

# Redundant Grid I/O Sensor

* Have two CT clamps monitoring Grid I/O accessible via separate integrations
* Alpha ESS updated every minute by polling API
* Hypervolt every 3 seconds via websocket
* Can use a template to combine into a composite sensor
* Idea is that we report the value from the most recently changed input
* If Hypervolt gets stuck we'll still get updates every minute from the Alpha ESS sensor
* Needed to use YAML rather than visual editor so that I could define triggers and attributes
* Rather than using a state based template and having to compare `last_updated` properties to decide which source to use, use explicit triggers on the source entities and just return value of whichever triggered the update.
* Added a source attribute so you can see whether value came from `hypervolt` or `alpha`

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

* Really painful development experience
* Using Studio Code Server addon to get syntax checking for conformance with Home Assistant schema
* Mostly works great and let me fix errors immediately. Problem is that there are false positives. Maybe schema is out of date?

{% include candid-image.html src="/assets/images/home-assistant/template-sensor-editor-false-errors.png" alt="False Postive Errors in Studio Code Server editor" %}

* Took me ages to work out that my YAML was actually fine
* Obviously no live preview of the output value as you get with the visual editor
* To make changes take effect you have to save the file and then go to "Developer Tools -> YAML" and click on "Template Entries" to reload the config
* Then see if you can find the sensor that the template should have created
* If not, and you're lucky, you might get a notification from Home Assistant with an error message extracted from the logs
* Once the sensor was actually created I needed to work out why it wasn't working properly. It always returned the value from the Alpha ESS sensor. 
* The problem was that I'd used double quotes around `hypervolt` in the `if` condition. The [Jinja documentation](https://jinja.palletsprojects.com/en/latest/templates/#literals) says that string literals can use double or single quotes. However, for whatever reason, in this circumstance, it didn't work until I changed to single quotes.

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
* Since then has happened twice more
* Second time I tried disabling and reenabling the integration. Waited 10 minutes. Made no difference. Tried the app, this time the trouble shooter reported no connectivity to the device. In the end resorted to rebooting it by turning it off and on at the circuit breaker. Was OK again after that.
* Third time happened within 24 hours. However, by the time I saw the alert it had started working again. Was stuck for about 25 minutes in total. 

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
