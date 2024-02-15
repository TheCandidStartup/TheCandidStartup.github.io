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
* Which turns out to be the [reason](https://github.com/bvaughn/react-virtualized/pull/742) for using requestAnimationFrame! Browsers seem to be quite eager to throttle rate of setTimeout with the result that it can take a second or two for end scrolling to be detected. 

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
* Dan Abramahov blog: https://overreacted.io/making-setinterval-declarative-with-react-hooks/ and equivalent for [useTimeout](https://www.joshwcomeau.com/snippets/react-hooks/use-timeout/)
* [Many](https://github.com/donavon/use-event-listener) [implementations](https://github.com/realwugang/use-event-listener) [of](https://github.com/uidotdev/usehooks/blob/experimental/index.js#L329) useEventListener that uses same pattern for generic event listener
* Ideally I'd be able to use useEventListener if scrollend is supported, otherwise fall back to setTimeout based implementation
* Rule of hooks makes that difficult. Have to declare all hooks I might need in same order every render. In principle choice will be the same every render as support for scrollend won't change during a session, but code looks wrong and will trigger linter. 
* Standard pattern following rule of hooks is useEventListener and useTimeOut implementations that can be setup conditionally to do nothing. Have to declare both and both have effects that run but only one does anything. 

# Hooks and Reuse

* Hooks are small enough that it feels like adding too many bitty dependencies when you could just copy the snippet of code needed
* Pulling in a library of hooks means settling for less than ideal implementation of some hooks
* I'm naturally paranoid about taking dependencies. I still remember the [left-pad debacle](https://www.theregister.com/2016/03/23/npm_left_pad_chaos/). Only want to do it for things that add enough value. 
* Reusing hard won learning from react-window means writing my own useAnimationTimeout
* Alternatively could write useIsScrolling without any intermediate hooks. Have one useEffect that either manages event listener or timeout as appropriate.
* Going to try doing it the "right" way first - one of the advantages claimed for hooks is the way that they can be composed and used as building blocks so let's try it out.

# useEventListener

* Started with the easiest one. I found an [existing implementation](https://github.com/realwugang/use-event-listener) of useEventListener written in TypeScript so I copied that as a starting point.
* Then started throwing most of it away ...
* Lots of boilerplate that supports browsers (e.g. old versions of Internet Explorer) that don't have addEventListener. In fact, addEventListener has been [widely supported](https://caniuse.com/?search=addEventListener) since 2011.
* Tries to support listening to events on window, document, HTML element, or React Ref to HTML element or React Class component
* Has the most bizarre way of working out whether something is an HTML element. 

```
function isHtmlControl (obj: any): boolean {
  const div = document.createElement("div")
  try {
    div.appendChild(obj.cloneNode(true))
    return +obj.nodeType === 1
  } catch (e) {
    return false
  }
}
```

* Adds a load of junk to the DOM without any attempt at cleanup.
* There's a case to be made for using duck typing for the most general solution rather than the simple `obj instanceOf Element` but this is ridiculous.
* Shows the importance of validating dependencies
* In the end I kept the TypeScript type assertions and replaced almost everything else with [another implementation](https://github.com/donavon/use-event-listener)

# useAnimationTimeout

* I started implementing useAnimationTimeout by starting with [useTimeout]((https://www.joshwcomeau.com/snippets/react-hooks/use-timeout/) and replacing use of `setTimeout` with `requestAnimationFrame` as in [react-window](https://github.com/bvaughn/react-window/blob/master/src/timer.js).
* Bit fiddly but just about had it done before realizing it wasn't what I needed
* useTimeout and the original article that described how to implement useInterval are focused on NOT resetting the timeout on each render. They only reset if the delay changes. They go out of their way to let you change the callback without a reset.
* For debouncing end of scroll detection we *want* a timer that resets every time we render while the control is still scrolling.
* At first I thought I'd need to build something higher level and special purpose, like `useDebounceTimeout`. The more I thought about it, the more I realized that the top level useIsScrolling hook would need precise control over when the timer resets. So, I went back to my generic timer and added an additional `key` argument that resets the timer when changed.

