---
title: >
    React Virtual Scroll Grid 5 : What Next?
tags: frontend
---

{% capture rvs4_url %}{% link _drafts/react-virtual-scroll-grid-4.md %}{% endcapture %}
It [turns out]({{ rvs4_url }}) that implementing a grid control capable of scrolling over millions of rows and columns is much harder than I thought. The grid is virtualized, so the browser only has to deal with the cells visible in the viewport. Right now, there's no data. The content of each cell is generated on the fly. So why is this so difficult?

## Two Problems

I've looked at lots of grid controls and keep running into the same two problems. First, there's the limitations of the native browser scrollbar. All the major browsers have [limits]({{ rvs4_url | append: "#maximum-element-size" }}) on the amount of virtual content you can scroll over. Currently that's about 33 million pixels in Chrome and Safari, less in Firefox. That's around a million rows or columns, less if your cells are bigger than 30 pixels high or wide. Most grid controls break if you go over that limit.

I only found one control, [SlickGrid]({{ rvs4_url | append: "#slickgrid" }}), with an acceptable workaround. Why don't I use that? Let me introduce you to the second problem. If you have a grid with millions of rows and columns, you need some way of dynamically binding to the data *and* metadata for each row, column and cell. The grid should only load what it needs to display the visible elements. 

I like to categorize grid controls in levels. Many grids have no dynamic binding at all. You provide arrays of data and metadata to define cell content, row heights, column heights, formatting, etc. This is level zero. No use to me at all.

At level one you have controls with dynamic binding to row data. The number of columns and column metadata is statically bound. You can have millions of rows but not millions of columns. SlickGrid is a level one control. 

Level two controls add dynamic binding for column metadata. You can have a million columns without needing to keep a million column definitions in memory. Controls at level two look like they should be able to handle millions of rows and columns but end up being limited by poor implementation choices. The react-virtualized Grid and react-window VariableSizeGrid are level two controls. They end up making *O(n)* queries for cell metadata if you scroll to the bottom right corner. 

Level three controls actually work with millions of rows and columns. No matter which part of the grid is visible in the viewport, the amount of work performed by the grid is always *O(v)* where *v* is the number of visible cells. The react-window FixedSizeGrid would be a level three control if it wasn't limited by the maximum size of the native browser scrollbar. 

## What I Really Want

I want a level three control with working scrollbars, per cell styling, variable size rows and variable size columns. Is that too much to ask? I've looked at a few more controls since last time, and it's a losing game. Most are level zero or level one. 

I've got bored of looking. Time to build my own. 

## High Range Scrollbars

## Data Binding Interface

## The Plan
