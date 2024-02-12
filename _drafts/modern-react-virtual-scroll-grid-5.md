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
