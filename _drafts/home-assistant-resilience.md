---
title: >
  Home Assistant: Resilience
tags: gear
thumbnail: /assets/images/home-assistant/logo.png
---

wise words
* Easy to throw a set of automations together
* How resilient are they when things go wrong?

# Hypervolt Integration Gets Stuck

* Most sensor updates are pushed from the charger via a websocket
* Sometimes the updates [stop coming](https://github.com/gndean/home-assistant-hypervolt-charger/issues/88)
* Need to restart the integration or force a refresh using the Hypervolt app
* So far has happened once to me
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

# Automating Hypervolt restart

* Possible to [write an automation](https://github.com/gndean/home-assistant-hypervolt-charger/issues/92#issuecomment-2954067886) that detects when Hypervolt sensor is stuck and restart the integration.
