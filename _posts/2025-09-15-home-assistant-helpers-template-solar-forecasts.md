---
title: >
  Home Assistant: Helpers, Templates and Solar Forecasts
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

[Last time]({% link _posts/2025-09-01-home-assistant.md %}), I took you through setting up a Home Assistant Green, installing HACS, adding custom integrations and then creating an automation to disable discharge of my home battery while my EV is charging.

I had one loose end. I was using lots of hardcoded values in the automation. In particular, the target State of Charge (SOC) for the battery. This is a value that I often tweak manually, so having it reset whenever I charge the car is annoying. 

Let's see what we can do about it.

# Helpers

Helpers are entities that you create that aren't tied to any underlying device. Like any other entity, you can read and write their current state, put them on dashboards and use changes in their state to trigger automations. 

The documentation covers each individual entity that can be used as a helper but doesn't have an overview page for the overall concept. Confusingly, there *is* a [Tools and Helpers](https://www.home-assistant.io/docs/tools/) section but that talks about something else.

You can use helpers to provide high level controls and visible state for complex integrations and automations. A helper is the standard way of implementing a global variable shared by multiple automations. I'm going to use a helper to replace the hardcoded target SOC in my Octopus Smart Charging - Alpha ESS Battery automation. 

The best way to see a list of available helpers is to use the Home Assistant UI to try and create one in "Settings -> Devices and Services -> Helpers". I created a number helper for a target SOC between 20% and 100%. 

{% include candid-image.html src="/assets/images/home-assistant/battery-soc-helper.png" alt="Battery Target SOC helper" %}

Creating a helper automatically adds it to the overview dashboard.

# Templates

{% raw %}

You need to use Home Assistant's [templating](https://www.home-assistant.io/docs/configuration/templating/) feature to read the value of a helper and pass it to an automation action. Templating is a generic way of transforming data from one form into another. Home Assistant uses the [Jinja2](https://palletsprojects.com/p/jinja) templating engine with some extensions. 

Behind the scenes, all configuration, including automations, is stored in [YAML](https://www.home-assistant.io/docs/configuration/yaml/) files. The files are run through the template engine before use. The template engine looks for template expressions (`{{ ... }}`) and template commands (`{% ... %}`) embedded in the file, evaluates them and replaces them with any output.

For this simple case we need a template expression that reads the state of our helper entity and outputs the result. The magic string is `{{ states('input_number.alpha_ess_target_soc') }}`. The [states](https://www.home-assistant.io/docs/configuration/templating/#states) function is a Home Assistant extension that reads the state of an entity identified by its id.

I can now update my "Force charge battery" automation and replace the hardcoded SOC value with the value stored in the helper. Unfortunately, you can't paste template expressions straight into Home Assistant's visual editor.

{% endraw %}

{% include candid-image.html src="/assets/images/home-assistant/charge_cutoff_paste_template.png" alt="Pasting a template directly into the visual editor results in an error" %}

The editor uses controls specialized for the type of value used by each entity. In this case, it's an integer percentage between 0 and 100. You'll get an error if you try pasting in a template expression.

You need to flip the editor into YAML mode to insert the template. You can enable YAML mode just for the section that you need to edit.

{% include candid-image.html src="/assets/images/home-assistant/charge_cutoff_yaml_template.png" alt="Pasting a template into the YAML representation" %}

There's one gotcha. In YAML, curly braces are used to define mappings. You have to put the template expression in double quotes to treat it as a string. So, when replacing the number in `chargestopsoc: 100` with the template expression, remember to wrap it with double quotes.

If you don't like working with YAML, you can now switch back to visual editor mode. The visual editor parses the YAML and this time gives you a string editing control.

{% include candid-image.html src="/assets/images/home-assistant/charge_cutoff_visual_template.png" alt="Switching back to visual editor mode" %}

# Custom Dashboard

I created a custom dashboard to make managing the battery easier. Or at least I tried to. Clicking the "Settings -> Dashboards -> Add Dashboard" button added a new dashboard to the list in settings, but didn't add it to the main navigation toolbar. Clicking the button to open the dashboard took me to the "Overview" dashboard instead.

After some frantic clicking around, I tried manually entering the URL for the new dashboard in the browser. That worked, and made the dashboard appear on the navigation toolbar too. I suspect there might have been a caching issue and refreshing the browser would have worked too. 

After all that drama, it was straightforward to add my helper and a few other useful battery related values

{% include candid-image.html src="/assets/images/home-assistant/alpha-ess-custom-dashboard.png" alt="Alpha ESS Custom Dashboard" %}

# Solar Forecast

Before Home Assistant, I would occasionally change the target SOC to optimize performance of the battery. If the battery was frequently reaching 100% charge during the day due to solar generation, I would lower the target for overnight charging. If the battery frequently ran out of juice in the evenings, I would increase the target. 

When I setup the built-in energy dashboard, I noticed that Home Assistant had added a [solar generation forecast service](https://www.home-assistant.io/integrations/forecast_solar/). This uses information about your solar setup together with historical data and the weather forecast to predict the next days solar generation. 

Rather than fiddling with the target SOC by hand, I can improve and automate the process. 

The solar forecast gives me a prediction in KWh. I need to convert that into a target SOC percentage. My battery has a 10KWh capacity. On most days the house load (excluding EV charging) is in the 5KWh - 7KWh range. If there's no solar generation at all, charging the battery to 90% should leave me with at least 20% left at the end of the day. All I have to do is knock the forecast generation off that target.

{% raw %}

The template expression is only a little more complex.

```jinja
{{ max(min(int((9 - float(states('sensor.energy_production_tomorrow'))) * 10), 90), 20) }}
```

One gotcha is that you need to explicitly convert entity states to `float` or `int` types if you want to use math expressions. To be safe, I also clamp the calculated target value to be between 20% and 90%. 

{% endraw %}

# Automation Exclusion

All that's left is to create an automation that sets the target SOC each day. Once again, I have the problem that the Alpha ESS "Set Battery Charge" action updates multiple values at once. I have to provide start and end charging times as well as the target SOC.

What happens if the forecast update automation runs at the same time as my Smart Charging automation? What times should I set? Even if I check whether the car is charging, is it possible that the end of charge actions run before my action, leaving the wrong charging times set? What guarantees does Home Assistant provide if automations overlap?

For now, I've taken the easy way out. I run the forecast update automation at 2pm, when smart charging is highly unlikely to be taking place.

