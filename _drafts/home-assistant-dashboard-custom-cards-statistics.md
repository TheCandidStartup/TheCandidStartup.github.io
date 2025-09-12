---
title: >
  Home Assistant: Dashboards, Statistics and Custom Cards
tags: gear
thumbnail: /assets/images/home-assistant/logo.png
---

wise words

* Custom dashboards for battery and charger
* Exploring statistics - like energy dashboard but better
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

# Metered Consumption vs Measured

* Switched to real time consumption based on integral over hypervolt grid CT clamp
* How accurate is that, how does it compare with what meter measures?
* Measurements reported once a day with state that contains *previous* days consumption with attribute that contains meter reading for each half-hourly period
* Want to display as bar graph for previous day
* Standard dashboard cards don't cut it
  * Can't retrieve points to graph from attribute
  * Most of HA assumes that time associated with historical data is the time that the entity changed
  * Both history and statistics graph show a rolling window (of selectable size) ending at current time

# Custom Cards

* Rich eco-system of custom dashboard cards available via HACS
* For graphing, there are three main contenders
* Immediately feel off the reservation as all three require YAML based configuration, no visual editor support

## Mini Graph Card

* Much more customizable version of standard History Card
* Still tied to rolling window of data

## Apexcharts Card

* Wrapper around ApexCharts JS library
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
* Missing last entry from yesterday and adding in last from previous day
* Noticed it because I charged the car yesterday which kicked in at 23.30
