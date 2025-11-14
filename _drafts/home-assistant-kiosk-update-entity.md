---
title: >
  Home Assistant: Kiosk Mode and High Frequency Updates
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

wise words

* Boost shower strategy
* Hit boost in Vaillant app and wait 10 minutes
* *Mostly* works
* If starting temperature too low, will take longer than 10
* If heating active when you boost, will take less
* Five minute window to get in the shower before heat pump turns off
* Current status updated every 5 minutes in Vaillant app
* Result: Occasional cold showers

# Shower Dashboard

* Can I build a better experience using Home Assistant?
* Add a "Shower" dashboard

{% include candid-image.html src="/assets/images/home-assistant/shower-dashboard.png" alt="Shower Dashboard" %}

* The boost button turns on the hot water boost
* Once active shows an additional card with time since DHW cycle started 
* Two gauges used to show when shower is ready. Both have to go green.
* Top gauge is heat pump power consumption. Needs to be above 3kW for "combi" mode.
* Bottom gauge is return temperature to heat pump. Needs to be above 55°C to ensure decent temperature in the tank and at least 45°C on the other side of the heat exchanger when relying on "combi" mode.
* Experience shows that when the temperature goes above 65°C (the red zone), the tank temperature will soon reach target and the heat pump will shut down 
* Can't use tank temperature directly as that comes via myVaillant with 5 minute granularity.

# Home Assistant UX

* Will other members of the household use it?
* Initial experience is too techy, too many sensitive things they could change by accident

{% include candid-image.html src="/assets/images/home-assistant/techy-ux.png" alt="Techy Initial UX" %}

# Guest User

* Add another non-admin user to reduce surface area
* Will be using shared family tablets as well as their phones
* Want to make it as simple as possible so using a common "guest" user
* So far not much you can configure per user beyond removing admin privileges
* That does at least remove access to settings and all the developer tools

{% include candid-image.html src="/assets/images/home-assistant/non-admin-ux.png" alt="UX for non-admin users" %}

# Default Dashboard

* You can make a custom dashboard the default on a per device basis in the dashboard settings menu
* Not needed in my case because the Home Assistant Companion app remembers the last used page and restores it on startup
* Can install app on each device, log in with guest user and select the shower view on my custom dashboard

# Kiosk Mode

* Still the chance they could fat finger an item in the sidebar menu and get lost
* No need for them to stray outside of the custom dashboard
* Kiosk Mode is a third party integration for Home Assistant available via HACS
* It's intended to configure the app when running on a dedicated device, like a wall mounted tablet.
* The integration lets you choose which parts of the normal frontend UX to hide. The most common choices are to hide the side bar and top header. Beyond that are a wealth of options to control access in fine grained detail.
* I'm going to start by disabling the side bar.
* Kiosk mode is only active for specified dashboards. You need to edit the configuration YAML for each dashboard and add the appropriate kiosk mode options.
* My initial impression from scanning the documentation and reading forum posts was that kiosk mode would only be applied to non-admin users.
* I was wrong. As I found out after saving my config changes, leaving edit mode and seeing the side bar disappear. 
* Fortunately, there's an escape hatch. When using a web browser, add `?disable_km` to the end of the URL to disable kiosk mode for that page.
* Kiosk mode options can be global, specific only to non-admin users, or to specific named users.
* Both JavaScript and Jinja templates are supported for arbitrary conditional logic. A common pattern is to use an input helper to control whether kiosk mode is enabled with a dashboard button that turns it on and off. 
* Once I got my head round it, the options I needed were simple enough

```yaml
kiosk_mode:
  non_admin_settings:
    hide_sidebar: true
```

# Emoncms Integration

* There's no point doing all this work unless my shower dashboard works better than the Vaillant app. To do that I need an alternative source of status information that's updated more frequently than every five minutes. Fortunately, my heat pump installation includes Open Energy Monitoring with data pulled into Home Assistant via the Emoncms integration. Data is pulled directly from my local Open Energy Monitoring data logger, rather than bouncing off a remote server on the internet. The integration updates the data every minute. 
* This just about works. There's a five minute window before the heat pump will shut down, so plenty of time to notice that the gauges have jumped into the green.
* Doesn't feel great, especially if you're watching the gauges. Seems like an eternity.
* Especially when I know that the data logger is updating every 10 seconds.
* Home Assistant integrations that poll a remote data source follow a common pattern. You create a `Coordinator` object and pass it to the Home Assistant core. The coordinator has an `update_interval` property that defines how often data should be updated. The Home Assistant core calls the coordinator back when it's time to update the data. 

```python
  def __init__(
      self,
      hass: HomeAssistant,
      config_entry: EmonCMSConfigEntry,
      emoncms_client: EmoncmsClient,
  ) -> None:
      """Initialize the emoncms data coordinator."""
      super().__init__(
          hass,
          LOGGER,
          config_entry=config_entry,
          name="emoncms_coordinator",
          update_interval=timedelta(seconds=60),
      )
      self.emoncms_client = emoncms_client

  async def _async_update_data(self) -> list[dict[str, Any]]:
      """Fetch data from API endpoint."""
      data = await self.emoncms_client.async_request("/feed/list.json")
      if not data[CONF_SUCCESS]:
          raise UpdateFailed
      return data[CONF_MESSAGE]
```

* Most integrations have some sort of configuration option to control the update internval used. However, as you can see, Emoncms has a hardcoded update interval.

# Fork It

* Home Assistant is open source, so my first thought was to see if I could hack the integration and change the interval.
* Obviously I'd have to setup a development environment. Fork the source code. Rename things so that my hacked integration didn't interfere with the real one.
* Seems like a lot of work.
* Then I realized that the integration updates the data whenever it's told to do it. All I need is some way to call `_async_update_data`. No need to change the integration source code.

# Update Entity

* Turns out that an action that does exactly that is built into Home Assistant. 
* The `update_entity` action forces a list of entities to refresh their data, ultimately calling the `_async_update_data` method on each entity's coordinator and updating the stored state
* I can create an automation that updates the entities corresponding to my local Emoncms feeds every 10 seconds

```
triggers:
  - trigger: time_pattern
    seconds: /10
actions:
  - action: homeassistant.update_entity
    data:
      entity_id:
        - sensor.emonhp_dhw
        - sensor.emonhp_elec
        - sensor.emonhp_flowt
        - sensor.emonhp_returnt
        - sensor.emonhp_flowrate
        - sensor.emonhp_heat
```

* I was worried that would mean redundantly calling the same feed list API for each entity. Fortunately, Home Assistant has debouncing logic which batches up calls to the same coordinator update method so that it only runs once.
