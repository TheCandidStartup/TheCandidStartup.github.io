---
title: Paged Infinite Virtual Scrolling
tags: frontend
---

I'm [working on a cloud spreadsheet]({% link _topics/spreadsheets.md %}) system. It will support spreadsheets with millions of rows and columns. Potentially far more data than will fit into client memory, particularly a web client. Which means I need a front end implementation that can handle that.

Given that I have zero practical web front end development experience, where do I start? Which buzzwords do I need to include in my searches to bring up the right information? I know I'll have [some sort of grid control]({% link _posts/2023-06-12-database-grid-view.md %}) that provides a window on a small portion of the data. It's a spreadsheet so users will expect to use scroll bars as the main way of moving the window around. 

A few quick searches later and I have a shortlist of buzzwords: *paged*, *infinite* and *virtual*. But what do they mean? 

## Paged vs Infinite vs Virtual

{% assign posts_page = site.pages | where: "ref", "blog" | first %}
The best explanation I found, was in a [post by David Greene on Medium](https://medium.com/@david.greene_40229/the-fastest-javascript-data-grid-a-performance-analysis-d7a34389593e). The main focus of the post is a benchmarking comparison of different JavaScript grid controls. I think David was a marketing manager at Sencha, the creator of the ExtJS Grid, so take the benchmark results with a pinch of salt. However, the post starts off with a very clear and helpful definition of terms. It's well worth your time to read the original, but here's an executive summary:

* Paging: Users jump backwards and forwards through the data set, a page at a time. Just like the [Posts]({{ posts_page.url | absolute_url }}) section of this blog. 
* Infinite Scrolling: A subset of data is loaded into the grid control. Users can scroll through it. If they reach the end, more data is loaded and the scroll bar grows. The control doesn't show the total amount of data available. 
* Virtual Scrolling: The scroll bar reflects the total amount of data available. The end user can scroll seamlessly through the entire set. As they do, data is loaded (and if necessary unloaded) behind the scenes.

{% include candid-image.html src="/assets/images/databases/paged-infinite-virtual-scrolling.gif" alt="Paging, Infinite Scrolling and Virtual Scrolling" attrib="" attrib="[David Greene on Medium](https://medium.com/@david.greene_40229/the-fastest-javascript-data-grid-a-performance-analysis-d7a34389593e)" %}

## DOM Based Virtual Scrolling

## Canvas Based Virtual Scrolling
