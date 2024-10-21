---
title: >
  React Glitchy Virtual Scroll: Deep Dive
tags: react-virtual-scroll
---

wise words

* Arranged virtual scroll implementation so React and browser have no chance to muck things up
* Scroll event -> render -> browser paint - all without returning to the event loop
* Yet things are mucked up
* Grid goes blank - shows content from a previous render with the scroll offset from a current render
* First thought was legacy mode rendering in React - work around to problem with new rendering in React 18
* Maybe something has broken on the legacy path?
* Switch to React 18 rendering - which does break as before, browser paint happens before React render
* Added flushSync to force all rendering to happen in response to (now single) scroll event
* Which puts me back to behavior with legacy rendering

* Playing around with Chrome performance profile
* Rough correlation between "Partially Presented Frame" and glitchy render
* Not 1:1 but don't see any glitches in runs without a partially presented frame and the more PPF the more glitches

{% include candid-image.html src="/assets/images/react-virtual-scroll/chrome-partially-presented-frame.png" alt="Rendering a single frame" %}

* According to [Chrome Developer Documentation](https://developer.chrome.com/docs/devtools/performance/reference)
> **Partially presented frame (yellow with a sparse wide dash-line pattern).** Chrome did its best to render at least some visual updates in time. For example, in case the work of the main thread of the renderer process (canvas animation) is late but the compositor thread (scrolling) is in time.

* That sounds ominous. Is this a Chrome specific issue? I checked in Firefox and Safari. Firefox is absolutely fine - no glitches at all. Safari is the same as Chrome.
* Browser specific at least.
* There's more detail in the Chromium design document for [GPU Accelerated Compositing](https://www.chromium.org/developers/design-documents/gpu-accelerated-compositing-in-chrome/)

> In order to produce interesting new frames, the compositor thread needs to know how it should modify its state (e.g. updating layer transforms in response to an event like a scroll). Hence, some input events (like scrolls) are forwarded from the Browser process to the compositor first and from there to the Renderer main thread. With input and output under its control, the threaded compositor can guarantee visual responsiveness to user input.

> Running the compositor in its own thread allows the compositor’s copy of the layer tree to update the layer transform hierarchy without involving the main thread, but the main thread eventually needs e.g. the scroll offset information as well (so JavaScript can know where the viewport scrolled to, for example).

> Scroll events can’t be prevented and are asynchronously delivered to JavaScript; hence the compositor thread can begin scrolling immediately regardless of whether or not the main thread processes the scroll event immediately.