---
title: >
    Modern React Virtual Scroll Grid 5 : Is Scrolling
tags: frontend
---

# React-Window Implementation

* useIsScrolling so not re-rendering child items unnecessarily
* Timeout to detect end of scrolling

# setTimeout vs requestAnimationFrame

* Based on gist from 2010
* Assertion that emulating setTimeout using requestAnimationFrame is "better for performance"
* requestAnimationFrame was introduced as a better way of implementing animations that using setTimeout. 
  * With setTimeout you need to update fast enough that you don't miss a frame but not so fast that you're wasting cycles and hurting battery life
  * requestAnimtationFrame clearly better - you get called once before each frame is rendered, do exactly the right amount of work
* But not doing an animation! Actually want a timeout ...
* The other reason why requestAnimationFrame is seen as better for performance is that it doesn't fire on inactive tabs. No wasted cycles animating something that isn't visible.
* But we're not animating! Timeout only active while scrolling. You can't scroll on an inactive tab ...
* Note that since requestAnimationFrame was released, setTimeOut implementations have been updated to reduce the rate at which they fire on inactive tabs
* Seems like cargo cult to me. I'll use the real thing.

# Existing React Hooks

* All the ones I've found are for scrolling in the top level window ...
* Also use a timeout based approach

# Scrollend Event

* Only available since last half of 2023
* Blog post
* Suggestion to fallback to setTimeout based implementation
* Would be great if a useIsScrolling hook handled all of that

# Hooks and Events

* My current useVirtualScroll hook returns a function which the hosting component needs to call from the  onScroll event handler
* Just about manageable for a single event
* useIsScrolling would be a mess. Need to return an onScroll and onScrollEnd handler, with the component having to deal with checking for whether onScrollEnd is supported.
* Support for OnScrollEvent added to React main branch on October 11, 2023. Not in any stable release yet.
* To handle unsupported events, need to add an event listener directly to the DOM element
* Which means using a ref and binding it to the element, then useEffect to manage the DOM event listener
* Dan Abramahov blog: https://overreacted.io/making-setinterval-declarative-with-react-hooks/
* [Many](https://github.com/donavon/use-event-listener) [implementations](https://github.com/realwugang/use-event-listener) [of](https://github.com/uidotdev/usehooks/blob/experimental/index.js#L329) useEventListener that uses same pattern for generic event listener
* Ideally I'd be able to use useEventListener if scrollend is supported, otherwise fall back to setTimeout based implementation
* Rule of hooks makes that difficult. Have to declare all hooks I might need in same order every render. In principle choice will be the same every render as support for scrollend won't change during a session, but code looks wrong and will trigger linter. 
* Best you can do following rule of hooks is useEventListener and useTimeOut implementations that can bet setup conditionally to do nothing. Have to declare both and both have effects that run but only one does anything. 

# Hooks and Reuse

* Hooks are small enough that it feels like adding too many bitty dependencies when you could just copy the snippet of code needed
* Pulling in a library of hooks means settling for less than ideal implementation of some hooks