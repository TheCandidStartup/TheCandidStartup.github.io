---
title: >
  Home Assistant: Dashboards, Statistics and Custom Cards
tags: home-assistant
thumbnail: /assets/images/home-assistant/logo.png
---

I [now have]({% link _posts/2025-09-22-home-assistant-integral-utility-meter.md %}) useful data being collected and displayed on the Home Assistant built-in energy dashboard. Of course, it's not being presented *exactly* as I would like and doesn't include *all* the data sources I'd like. Time to dive into the wonderful world of custom dashboards.

I already created a [simple custom dashboard]({% link _posts/2025-09-15-home-assistant-helpers-template-solar-forecasts.md %}) for my home battery, where I threw a few cards together for relevant entities.

{% include candid-image.html src="/assets/images/home-assistant/alpha-ess-custom-dashboard.png" alt="Alpha ESS Custom Dashboard" %}

I have something more interesting in mind for my next step.

# Metered Consumption vs Measured

My energy dashboard is configured to measure grid electricity consumption in close to real time. It uses an integral helper over samples from my Hypervolt charger's grid CT clamp. I want to see how accurate that is by comparing with the measurements from my electricity meter. 

Octopus, my energy provider, makes the *previous* day's electricity consumption available via API. The Octopus Home Assistant integration makes the results of this API available as a "Previous Accumulative Consumption Electricity" entity. The state value is the total consumption for the previous day, with the detailed half-hourly meter readings provided as attributes. 

{% include candid-image.html src="/assets/images/home-assistant/prev-accum-consumption.png" alt="Octopus Previous Accumulative Consumption entity" %}

I want to display a bar graph for each half hour period of the previous day, comparing the metered and measured values. The standard [dashboard cards](https://www.home-assistant.io/dashboards) can't do it. There's no card that supports retrieving points to graph from an attribute. The standard cards also assume that the time to use for historical data is the time that the entity changed.

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

Next up is [ApexCharts Card](https://github.com/RomRider/apexcharts-card), which is a wrapper around [ApexCharts.js](https://apexcharts.com/). ApexCharts uses modern HTML features including SVG and animations. The default look and feel fits in well with standard cards. 

There are lots of configuration options, including extensive control over start and end of period. It's easy to setup to show a day, or week or month's data beginning at the start of the current period. Here's how to set it up to show "yesterday".

```yaml
graph_span: 24h
span:
  start: day
  offset: "-24h"
```

You can retrieve series of values for the period using the normal Home Assistant pipeline, querying history or statistics, or by providing a custom data generator. A data generator is a JavaScript function that can make arbitrary queries using the Home Assistant API.

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

Here I've used a data generator to define a series using the `charges` attribute from the most recent state of the electricity meter entity. That's graphed against a series of half-hourly grid import values.

{% include candid-image.html src="/assets/images/home-assistant/apex-charts-metered-measured.png" alt="ApexCharts Metered vs Measured Graph" %}

It's pretty close, especially given how small the values are. The last couple of days have been really sunny, so I haven't needed to import any significant amount of electricity. Less than 0.1 kWh per half-hour.

## Plotly Graph Card

Finally, there's [Plotly Graph Card](https://github.com/dbuezas/lovelace-plotly-graph-card), a wrapper around [Plotly.js](https://plotly.com/javascript/) which is in turn built on the [D3](https://d3js.org/what-is-d3) visualization library. Plotly is even more flexible and customizable. It supports a huge range of chart types, including 3D charts rendered using WebGL. 

The default look and feel is very different from Home Assistant. Out of the box you get the sort of scientific charts that I was generating back in the 80s. Expect to spend a lot of time tweaking styling options.

{% include candid-image.html src="/assets/images/home-assistant/plotly-grid-import.png" alt="Plotly Graph Card displaying Grid Import Statistics" %}

It's also harder to use. The Plotly Graph Card documentation misses out some important options that you have to infer from Plotly.js documentation. For example, there's no mention of how to switch to a bar chart. I *think* it's all there but it's a battle digging it out. As ApexCharts does what I needed, I stopped here.

```yaml
type: custom:plotly-graph
layout:
  title:
    text: Grid Import
entities:
  - entity: sensor.grid_import_daily
    statistic: state
    period: hour
    filters:
      - delta
hours_to_show: current_day
time_offset: "-24h"
refresh_interval: 10
```

In principle, Plotly is capable of much more than ApexCharts. It has a rich transformation pipeline for manipulating data. You can also embed JavaScript anywhere for ultimate flexibility. It's the equivalent of a template for a dashboard card.

# History vs Statistics

After some effort I've managed to produce one of the graphs I want for "yesterday". What about other dates? What about trends over a week, or several months?

Home Assistant retains the full history of each entity's value (both state and attributes) for 10 days. You can increase the retention limit but it's not sustainable for the long term. There's just too much data.

For longer term statistics, Home Assistant provides a separate [statistics](https://data.home-assistant.io/docs/statistics/) [recorder](https://www.home-assistant.io/integrations/recorder/) for measurements and metered values. 

Measurements are [sensors](https://developers.home-assistant.io/docs/core/entity/sensor/) with a `state_class` of `measurement`. They represent measurements in present time, recorded as they happen. For example, temperature, humidity or power. Measurement statistics are the state's min, max and mean over a time period. 

Metered values are sensors with a `state_class` of `total` or `total_increasing`. They represent total amounts. For example, an energy meter. The `total` class can go up and down (e.g. net consumption of electricity), while `total_increasing` always increases (e.g. total import of electricity from the grid). Both classes are allowed to periodically reset to zero (e.g. for a billing cycle).

Metered statistics are stored as the current sum at the end of a time period. You can query the sum at the start and end of a range, or the change between start and end. The energy dashboard is based on metered statistics. 

The statistics period is 5 minutes for short term statistics, which like history are retained for 10 days by default. Long term statistics have a period of one hour and are retained indefinitely by default. Short term statistics are useful for queries ending with the current time or with a granularity of less than an hour. Queries automatically use short term, long term or both depending on the start and end point of the query range. 

# External Statistics

The Octopus "Previous Accumulative Consumption Electricity" entity has been given a state class of `total`. That seems wrong to me. It doesn't represent a total over time and it's not in present time. It certainly doesn't work properly if you try to use it with the energy dashboard.

To work around this problem, the Octopus integration also extracts each day's charges and writes the consumption values directly to long term statistics using the corresponding dates. Pairs of half-hourly meter readings are combined into hourly statistics periods.

By convention, external statistics entities have an entity id using a `domain:id` format rather than the `domain.id` of a normal entity. You can use external statistics entities with the energy dashboard, Statistics Graph card and Statistics card.

The weirdest thing about these entities is that they have no current state. Most other cards don't support them. They either report that they can't use the entity because it's "Stateless", or just assume that an entity id without state is invalid. 

Annoyingly, ApexCharts [does exactly this](https://github.com/RomRider/apexcharts-card/issues/707), even when you configure it to read data from long term statistics. You can work around this using a data generator to [read the statistics database](https://community.home-assistant.io/t/display-apexchart-from-statistic-entity/860669/5) yourself. Which feels ugly.

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

Interestingly, Plotly does support external statistics entities, but I'd rather avoid using it if I can. Let's park this one for now and look at another problem. 

# Choosing a Time Period

So far I've created graphs with hardcoded time periods. What if I want to change the day, or look at a week or month at a time?

Plotly has a built in range selector UI, but what if I have a whole dashboard of graphs, like the Energy dashboard? It turns out the simplest approach is to use the energy dashboard date selector on your own dashboard.

The energy dashboard is built using a [special purpose set of cards](https://www.home-assistant.io/dashboards/energy/). Most functionality is hardcoded. The data source has to be configured using the energy dashboard configurator. You can't see the cards in the visual editor, but you can add them using YAML.

The cards use a JavaScript API to find a date selector on the current dashboard view and read the specified date range. Recently the Statistics and Statistics Graph cards were given a YAML only option to set their range using the energy date selector. There are also a few custom cards that do the same thing, bad sadly not Mini Graph Card, ApexCharts or Plotly.

But maybe I don't need to. The energy date selector has presets for "Today", "Yesterday", "This Week", etc. You can step forwards and backwards a day, week, month or year at a time. Everything's aligned to whole days. The Statistics cards already support external entities.

{% include candid-image.html src="/assets/images/home-assistant/energy-selection-statistics-metered-measured.png" alt="Energy Date Period with Statistics Graph showing metered vs measured" %}

I was able to achieve the equivalent of the ApexCharts Metered vs Measured graph surprisingly easily. It's only hourly resolution but that's fine. I can keep the ApexCharts "Yesterday" graph for when I really need the full detail. For everything else, hourly resolution is fine.

```yaml
chart_type: bar
title: Metered vs Measured
type: statistics-graph
min_y_axis: 0
max_y_axis: 0.5
fit_y_data: true
entities:
  - entity: >-
      octopus_energy:electricity_XXXXX_previous_accumulative_consumption
    name: Metered
  - entity: sensor.grid_import_daily
    name: Measured
stat_types:
  - change
energy_date_selection: true
```

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