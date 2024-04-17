---
title: >
    Modern React Virtual Scroll Grid 9 : Fixing SlickGrid
tags: frontend
---

[Last time]({% link _drafts/modern-react-virtual-scroll-grid-8.md %}) we integrated SlickGrid's paged scrolling system and found that it came *really close* to working well. Close isn't good enough. Fortunately, I have to plan to fix it. 

# The Problem

{% include candid-image.html src="/assets/images/frontend/slick-grid-virtual-pages.svg" alt="SlickGrid Virtual Pages" %}

SlickGrid works by dividing the full sized grid into multiple pages and arranging them so they fit into the smaller container space. The pages have to overlap to fit. The magic is in how movements of the scroll bar are interpreted either as small scale movements within a page or large scale movements that select the page to use. 

The problem we found, particularly with very large grids with many pages, is that the second (green) and penultimate (red) page are too close to the ends of the container. Close enough that the browser thinks that you're about to scroll or render off the ends. That leads to janky behavior for the end user. They're think they're looking at items a long way from the end of the list but find that they can't scroll up, or can't scroll certain items to the top of the viewport or find that the scroll bar seems to "stick" as they scroll to the bottom of the list. 

# The Solution

{% include candid-image.html src="/assets/images/frontend/slick-grid-fixed-virtual-pages.svg" alt="SlickGrid Virtual Pages" %}

The solution is pretty simple. The first and last page need to be aligned with the ends of the container so that you get the correct browser behavior near the start and end of the list. We have flexibility in how we arrange the rest of the pages. They need to be in order and spaced evenly across most of the range of the scroll bar. Rather than overlapping with the first and last page, we can arrange the interior pages *between* the first and last page. 

This ensures that the interior pages are well away from the ends of the container. Each page is much bigger than the possible size of the viewport.

Scrolling near the start and end of the scroll bar's range feels entirely normal as there's a 1:1 mapping between grid space and container space for the start and end pages. That does mean that the remaining pages are crammed into less of the scroll bar's range. However, page size is chosen so that 100 pages fit into the container. That means the remaining pages are still spread across 98% of the scroll bar's range. 

# The Implementation

# The Demo

## Functional Testing

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-9a/index.html" width="100%" height="fit-content" %}

## Trillion Row List

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-9b/index.html" width="100%" height="fit-content" %}

## Trillion<sup>2</sup> Grid

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-9c/index.html" width="100%" height="fit-content" %}

# Unit Tests

* `/* istanbul ignore else */`
* Keeping `useVirtualScroll` logic only paid off - much easier to test
* Very painful putting enough scaffolding in place to test VirtualGrid and VirtualList move of scroll bar with small scale scrolling
