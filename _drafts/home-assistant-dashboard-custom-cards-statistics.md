---
title: >
  Home Assistant: Dashboards, Statistics and Custom Cards
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

I [now have]({% link _posts/2025-09-22-home-assistant-integral-utility-meter.md %}) useful data being collected and displayed on the Home Assistant built-in energy dashboard. Of course, it's not being presented exactly as I would like and doesn't include all the data sources I'd like. Time to dive into the wonderful world of custom dashboards.

I already created a [simple custom dashboard]({% link _posts/2025-09-15-home-assistant-helpers-template-solar-forecasts.md %}) for my home battery, where I threw a few cards together for relevant entities.

{% include candid-image.html src="/assets/images/home-assistant/alpha-ess-custom-dashboard.png" alt="Alpha ESS Custom Dashboard" %}

I have something more interesting in mind for my next step.

# Metered Consumption vs Measured

The Home Assistant energy dashboard is configured to measure grid electricity consumption in close to real time. It uses an integral helper over samples from my Hypervolt charger's grid CT clamp. I want to see how accurate that is by comparing with the measurements from my electricity meter. 

Octopus, my energy provider, makes the *previous* day's electricity consumption available via API. The Octopus Home Assistant integration makes the results of this API available as a "Previous Accumulative Consumption Electricity" entity. The state value is the total consumption for the previous day, with the detailed half-hourly meter readings provided as attributes. 

{% include candid-image.html src="/assets/images/home-assistant/prev-accum-consumption.png" alt="Octopus Previous Accumulative Consumption entity" %}

I want to display a bar graph for each half hour period of the previous day comparing the metered and measured values. The standard [dashboard cards](https://www.home-assistant.io/dashboards) can't do it.
* There's no card that supports retrieving points to graph from an attribute
* The standard cards assume that the time to use for historical data is the time that the entity changed

I need to retrieve the `Charges` attribute from the current "Previous Accumulative Consumption Electricity" entity, draw a series using the dates in the attribute, combined with a series based on the history of my "Grid Import" sensor. 

# Custom Cards

Fortunately, there's a rich ecosystem of custom dashboard cards that you can add to your Home Assistant using HACS. For graphing, there are three main contenders: Mini Graph, ApexCharts and Plotly.

All three immediately feel more "advanced" as there's no visual editor support, YAML is required. They're listed in order of flexibility, complexity and size.

## Mini Graph Card

[Mini Graph Card](https://github.com/kalkih/mini-graph-card) is a more customizable and flexible version of the standard [Sensor](https://www.home-assistant.io/dashboards/sensor/) and [History Graph](https://www.home-assistant.io/dashboards/history-graph/) cards for use with Sensors. It's the simplest and most popular of the three.

The look and feel is a good match for the standard cards. It supports line and bar graphs, multiple entities on the same card, and a host of options for controlling the layout and rendering. 

Unfortunately, there's no way to extract data points for an entity from attributes. However, I can use it to display a half-hourly bar chart for 24 hours of grid import.

{% include candid-image.html src="/assets/images/home-assistant/mini-graph-card.png" alt="Mini Graph Card displaying Grid Import bar chart" %}

The card shows an unlabelled bar graph until you hover over a bar (pictured). It then shows the value and time range for the bar, and also shows the minimum and maximum values for all the bars. 

There's no way to control when the graph starts and ends. You get a rolling window ending with the current time, which in turn defines the start and end times for each bar.

On the positive side, the card is easy to configure and works well for showing the current state and immediate history for a sensor.

```yaml
type: custom:mini-graph-card
icon: mdi:lightning-bolt
entities:
  - entity: sensor.grid_import_daily
    name: Grid Import
    show_state: true
show:
  graph: bar
points_per_hour: 2
hours_to_show: 24
aggregate_func: diff
```

## ApexCharts Card

Next up is [ApexCharts Card](https://github.com/RomRider/apexcharts-card), which is a wrapper around [ApexCharts.js](https://apexcharts.com/). 
* Default look and feel fits in well with standard cards
* Lots of configuration options, including extensive control over start and end of period
* Easy to setup to show day, or week or month's data beginning at the start of the current period

```yaml
graph_span: 24h
span:
  start: day
  offset: "-24h"
```

* Can retrieve set of values for period using normal Home Assistant pipeline querying history or statistics, or by custom data generator
* Data generator is JavaScript function that can make arbitrary queries using HA API

```yaml
series:
  - entity: >-
      sensor.octopus_energy_electricity_XXXXX_previous_accumulative_consumption
    name: Metered
    data_generator: |
      return entity.attributes.charges.map(({start, end, consumption}) => {
        return [new Date(start), consumption];
      });
  - entity: sensor.grid_import_daily
    name: Measured
    group_by:
      duration: 30min
      func: diff
```

* Used data generator to retrieve attributes from electricity meter entity and graphed against measured values from utility meter pulling data from Hypervolt CT clamp
* Raw entity is no good for statistics. Octopus integration writes values directly to long term statistics with correct dates (combining pairs of half-hourly meter readings into hourly stats periods.
* Results in entity with `domain:id` format rather than `domain.id` of normal entity
* These entities have no current state. Most cards, apart from the built in energy dashboard, don't support them. Typically treated as an invalid entity as the standard way of validating an entity id is to try and query it's state.
* ApexCharts does exactly this, even when you set it up to read the entities statistics
* You can work around this using a data generator to [read the statistics database](https://community.home-assistant.io/t/display-apexchart-from-statistic-entity/860669/5) yourself. Feels ugly.

```js
  const stat_entity =
  'octopus_energy:electricity_XXXXX_previous_accumulative_consumption';

  var statistics = await hass.callWS({
      type: 'recorder/statistics_during_period',
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
      statistic_ids: [stat_entity],
      period: "hour",
  });

  var stats = statistics[stat_entity];

  var result = [];
  var len = stats.length;
  for (let i = 0; i < len; i++) {
    let stat = stats[i].change;
    result.push([(new Date(stats[i].end).getTime()),stat]);
    }
  return result;
```

## Plotly Graph Card

* Even more flexible and customizable
* Uses WebGL based plotting engine capable of pretty much anything, including pan, zoom and 3D
* Default look and feel is very different
* Looks like scientific charts I was generating back in the 80s
* Reads data from history, statistics or custom source
* Supports state-less entities when reading from statistics
* Rich transformation pipeline to further manipulate data
* Embed JavaScript anywhere for ultimate flexibility
* Range selector UI

* Home view for highest priority stuff - divided into Today, Yesterday and Tomorrow

# History vs Statistics

* History of previous entity values (both state and attributes), retained for 10 days by default
* Statistics recorded for measurements (sensors with `state_class` of `measurement`) and metered values (sensors with `state_class` of `total` or `total_increasing`)
* Measurement represents a measurement in current time, recorded immediately, not a historical record or future prediction
* Metered value is a total amount. `total` can go up and down (e.g. net consumption of electricity). `total_increasing` always increases (e.g. total import of electricity from grid).
* Both may reset to zero, typically aligned with billing cycle.
* Worked with metered values last time when improving the energy dashboard. The energy dashboard is driven from stored statistics
* Measurements store min/max/mean over period, metered values store state/sum at end of period
* Period is 5 minutes for short term statistics (retained for 10 days by default), one hour for long term statistics (retained indefinitely by default)
* sum is grand total over lifetime of statistics, able to cope with reset to zero (by ignoring value of zero when adding changed entity to running total)
* sum is typically used to determine change over a period of time (by subtracting sum at start of period from sum at end)

# Choosing a Time Period

* So far I've created graphs with hardcoded time periods. e.g. Metered vs Measured is always for "Yesterday".
* What if I want to change the day, or look at a week or month at a time?
* Can build graphs using Plotly with built in range selector, but what if I have a whole dashboard of graphs, like the Energy dashboard?
* Simplest approach is to use the energy dashboard date selector on your own dashboard

# Energy Dashboard

* Energy dashboard uses a set of special purpose cards
* Most functionality is hardcoded - data source has to be configured using the energy dashboard configurator
* Can't see the cards in the visual editor, but you can add them using YAML
* Cards use JavaScript API to find a date selector on the current dashboard view and read the date range
* Recently the Statistics and Statistics Graph cards have been given a YAML only option to set their range using the energy date selector
* There are also some custom cards that do the same thing
* Energy date selector has presets for "Today", "Yesterday", "This Week", etc.
* Removes the rolling window restriction limitation when using Statistics Graph
* Statistics Graph already supports state-less entities
* Can achieve equivalent to Apexcharts Metered vs Measured graph surprisingly easily
* Only hourly resolution but apart from that does everything required

# Metered Electricity Statistics

* Graph is nice but also useful to have total electricity consumed for specified period
* Added a statistics card
* With the wrong answer
* Pulling my hair out
* Statistics card allows you to specify an explicit time period
* Played around to try and see if I could work out start/end being supplied by energy date selector
* Equivalent to 23:00 - 22.59

```yaml
fixed_period:
  start: "2025-09-09T23:00:00.000Z"
  end: "2025-09-10T22:59:59.000Z"
```

```yaml
cards:
  - type: energy-date-selection
    grid_options:
      columns: full
  - type: statistic
    period: energy_date_selection
    stat_type: change
    entity: sensor.charge
  - chart_type: bar
    period: day
    type: statistics-graph
    entities:
      - sensor.charge
    stat_types:
      - change
    energy_date_selection: true
  - chart_type: bar
    period: hour
    type: statistics-graph
    entities:
      - sensor.charge
    stat_types:
      - change
    energy_date_selection: true
```

* Missing last entry from yesterday and adding in last from previous day
* Noticed it because I charged the car yesterday which kicked in at 23.30

{% include candid-image.html src="/assets/images/home-assistant/statistics-card-bug.png" alt="Statistics Card missing data from last hour" %}