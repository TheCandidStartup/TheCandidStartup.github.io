---
title: >
  React Virtual Scroll 0.6.0 : Consciously Uncoupling
tags: react-virtual-scroll
---

wise words

* Traditional virtual scrolling implementations don't work
* Both React and Chrome Browser want to maintain responsiveness by occasionally painting before virtual scrolling components can render updated content in response to the scroll event
* What if we completely separated virtual scrolling from the display of "scrolled" content?
* Virtual scrolling component consists of fixed size outer viewport div and much larger scrollable inner div
* Don't render anything in the inner div. Then doesn't matter if it's not up to date
* Have a separate component that can display content starting from an arbitrary offset
* DisplayList!
* Position the display component in the viewport on top of the scrollable area
* Scrolling events update state which in turn renders the display component with a new offset
* Display can still get a frame behind scroll position but you don't notice because what's rendered is consistent

# Virtual Container

# Auto Sizer

* Components like DisplayList need to be given an explicit width and height so that they know what subset of the underlying list's content needs to be rendered to fill the viewport.
* DisplayList needs to be positioned to exactly fill the VirtualScroll viewport area. Size of viewport area depends on styling and whether scroll bars are visible. 
* Most general solution is to measure the actual size of the display area and pass that through to DisplayList
* Inspiration from [`react-virtualized-auto-sizer`](https://github.com/bvaughn/react-virtualized-auto-sizer). Companion project to `react-window`. Provides a higher order component which passes measured width and height to child.
* Implemented my own version in modern React
* Original has a complex implementation and boundary issues
* It subscribes to events on its parent and resizes its child to the area of its parent
* Sizing logic involves determining style applied to parent and how much padding there is outside content box
* Unexpected results unless parent has single child - docs suggest a workaround of wrapping in a div
* Gone for a much simpler implementation
* Nested div setup
* Outer div is sized by parent in the usual way - caller can apply whatever style they want to influence this
* Inner div has zero width and height and visible overflow. Need to prevent size of child having any influence on outer div size.
* Simple layout effect to determine initial size and to add a [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) to track future resizes
* Potential infinite loop if we pass computed size to child which renders itself bigger and increases size of parent
* Parent resizes -> observer updates width and height -> Render child with new size without triggering knock on resize to parent
* Separate `width` and `height` state as easily comparable by React to short circuit render if duplicate values set
* No need to check whether width and height have changed, which means no dependencies on state or props in resize handler
* Which means same function instance can be used
* Which means layout effect only needs to run once on mount
* No churn of observers
* [`jsdom-testing-mocks`](https://www.npmjs.com/package/jsdom-testing-mocks) package provides ResizeObserver mock as not supported by `jsdom`.

# Virtual Scroll

* Uncouple the virtual paged scrolling functionality from VirtualList and VirtualGrid into a separate component
* Has an `OnScroll` callback and a `contentRender` render prop for rendering content on top of the viewport
* Props for `scrollableWidth` and `scrollableHeight`
* Set both for two-dimensional scrolling experience, set one for horizontal or vertical scrolling experience
* One component does both and can dynamically switch as size of scrollable area changes relative to size of viewport

* OG VirtualScroll sample with display of state

# Virtual List

* VirtualList = VirtualScroll + AutoSizer + DisplayList
* Need AutoSizer because the DisplayList needs to perfectly fit the VirtualScroll client area
* If you oversize DisplayList it will impact size of scrollable area

# Display Grid

# Virtual Grid

* VirtualGrid = VirtualScroll + AutoSizer + DisplayGrid

# Upgrading

* Kept as much of the existing `VirtualList` and `VirtualGrid` interface as I could
* In general all the samples and `react-spreadsheet` just worked without any code changes despite massive internal changes
* Was most worried about `outerRender` and `innerRender` customization
* `outerRender` is used to customize how component interacts with it's parent
* `innerRender` is used to customize how component interacts with it's children
* In principle, structure in between can change
* All the `outerRender` stuff was fine
* One problem was the padding sample which recreates a `react-window` sample
* Adds padding to top and bottom of a `VirtualList`
* Uses `innerRender` to mess with layout of children
* Has strong dependency on how layout used to be done with absolute positioning
* Reimplementing equivalent hackery isn't possible with the new structure because you need access to internals
* There's a better way. If you have more complex needs use the basic components yourself

# Overscan

# Layout Shift

{% include candid-image.html src="/assets/images/react-virtual-scroll/spreadsheet-perf-decoupled-legacy.png" alt="Performance tool frame capture" %}

* Layout Shift = stuff on the page moving around
* https://web.dev/articles/debug-layout-shifts#devtools
* In our case that's expected as we're moving content in a DisplayGrid to simulate the effects of scrolling

# Cumulative Layout Shift

* Core web performance metric
* https://web.dev/articles/cls
* Calculates an abstract score based on the number and size of layout shifts during an interaction session
* Intent is to measure only unintended layout shifts - for example from async tasks like image or content load
* Layout shifts within 500ms of user interaction are ignored.

* Tool in Chrome. Here's metric when scrolling around the grid using the keyboard.
{% include candid-image.html src="/assets/images/react-virtual-scroll/web-metrics-good.png" alt="Web metrics during keyboard navigation" %}

* Here's the metric for the same grid when using mouse wheel and scroll bar
{% include candid-image.html src="/assets/images/react-virtual-scroll/web-metrics-bad.png" alt="Web metrics during scrolling" %}

* Scrolling doesn't count as intended!
* Consider this to be a false positive
* Only happens when user actively scrolling, so no impact on CLS score during page load (which is important for Google Search's [page experience](https://developers.google.com/search/docs/appearance/page-experience) based ranking)

# React 18 Rendering

{% include candid-image.html src="/assets/images/react-virtual-scroll/spreadsheet-perf-decoupled-modern.png" alt="Performance tool frame capture" %}

# Try It!

* Link to NPM release
* Spreadsheet sample

# Next Time