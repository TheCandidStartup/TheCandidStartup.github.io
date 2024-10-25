---
title: >
  React Virtual Scroll 0.7.0 : Consciously Uncoupling
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

# Virtual Scroll

* Uncouple the virtual paged scrolling functionality from VirtualList and VirtualGrid into a separate component
* Has an `OnScroll` callback and a `contentRender` render prop for rendering content on top of the viewport
* Props for `scrollableWidth` and `scrollableHeight`
* Set both for two-dimensional scrolling experience, set one for horizontal or vertical scrolling experience
* One component does both and can dynamically switch as size of scrollable area changes relative to size of viewport

* OG VirtualScroll sample with display of state

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
* Potential infinite loop if we pass computed size to child which renders itself bigger and increases size of parent
* Simple layout effect to compute size
* Render with new size (due to changes in parent) -> layout effect -> Render child with new size without triggering knock on change to parent

# Virtual List

* VirtualList = VirtualScroll + AutoSizer + DisplayList

# Display Grid

# Virtual Grid

* VirtualGrid = VirtualScroll + AutoSizer + DisplayGrid
