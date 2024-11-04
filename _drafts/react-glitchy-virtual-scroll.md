---
title: >
  React Glitchy Virtual Scroll: Deep Dive
tags: react-virtual-scroll
---

How can this be happening? I'm doing [everything in my power]({% link _posts/2024-11-04-react-virtual-scroll-options-display-list.md %}) to ensure that the visible content in my virtualized components is rendered *before* the browser paints. I'm using the [legacy React render method]({% link _posts/2023-11-20-react-virtual-scroll-grid-3.md %}) which ensures that the DOM is updated immediately when an event is handled. I've [restructured my spreadsheet component]({% link _posts/2024-11-04-react-virtual-scroll-options-display-list.md %}) to ensure that everything is rendered before React returns to the event loop.

Despite all this, I still see flashes of blank content as I scroll, particularly when using the mouse wheel.

# Smoking Gun

My first port of call was the Chrome performance tool. The tool can be configured to capture screen shots while profiling. I think I found a smoking gun.

I hacked my spreadsheet sample to include row numbers in both the header and the grid. The screenshots are tiny so I increased the font size massively. You can just about see what's happening when I scale the screenshot up.

{% include candid-image.html src="/assets/images/react-virtual-scroll/spreadsheet-perf-scroll-capture.png" alt="Bad frame captured while scrolling" %}

The row numbers are repeated in column C. You can see that the row header and the grid aren't aligned. The header is showing rows 2-11 and the grid is showing rows 5-12 with a blank row at the end. Based on logs of the rows being rendered each frame, it looks like the browser is occasionally painting content rendered from the previous frame with the scroll offset from the current frame. Scroll far enough and the grid goes blank when the previous rendered content is scrolled out of view. 

# Reduced Scope

I had another look at the profile when rendering a single frame. 

{% include candid-image.html src="/assets/images/react-virtual-scroll/spreadsheet-sample-perf-displaylist.png" alt="Rendering a single frame" %}

Everything happens in response to a single scroll event but I have two handlers for that event. The main one which implements virtual scrolling and a second one in a `useIsScrolling` hook which determines whether a scroll is in progress. I'm not using that feature in my spreadsheet, so I reduced the potential scope of the problem and removed the hook.

Makes no difference.

# Forced DOM Update

My next thought was that maybe the React legacy mode rendering was broken. I've applied a few minor updates to React. It's easy for bugs to creep into a rarely used legacy code path. 

I switched to React 18 rendering. Which, as before, is even more broken. React 18 encourages the browser to paint before rendering for "continuous" events like scrolling. I then wrapped my handling of the scroll event with [`flushSync`](), which forces the DOM to update before returning. Which puts me back to the same behavior I see with legacy rendering. 

# Partially Presented Frame

I went back to playing around with the Chrome performance profiler. Trying different things out while recording a profile. The profiler has a track that shows how long each frame took to render. Usually each frame is shaded green but occasionally there's a yellow one.

{% include candid-image.html src="/assets/images/react-virtual-scroll/chrome-partially-presented-frame.png" alt="Rendering a single frame" %}

The tool tip tells me that this is a "Partially Presented Frame". There seems to be a rough correlation between PPFs and glitchy renders. It's not 1:1, but I don't see any glitches at all in runs without a PPF and the more PPFs there are, the more glitches.

The [Chrome Developer Documentation](https://developer.chrome.com/docs/devtools/performance/reference) only has a brief mention of PPFs.
> **Partially presented frame (yellow with a sparse wide dash-line pattern).** Chrome did its best to render at least some visual updates in time. For example, in case the work of the main thread of the renderer process (canvas animation) is late but the compositor thread (scrolling) is in time.

That sounds ominous. Is this a Chrome specific issue? I checked in Firefox and Safari. Firefox is absolutely fine - no glitches at all. Safari is the same as Chrome. At least I know the problem is browser specific.

# GPU Accelerated Compositing

There's more detail in the Chromium design document for [GPU Accelerated Compositing](https://www.chromium.org/developers/design-documents/gpu-accelerated-compositing-in-chrome/),

> In order to produce interesting new frames, the compositor thread needs to know how it should modify its state (e.g. updating layer transforms in response to an event like a scroll). Hence, some input events (like scrolls) are forwarded from the Browser process to the compositor first and from there to the Renderer main thread. With input and output under its control, the threaded compositor can guarantee visual responsiveness to user input.

> Running the compositor in its own thread allows the compositor’s copy of the layer tree to update the layer transform hierarchy without involving the main thread, but the main thread eventually needs e.g. the scroll offset information as well (so JavaScript can know where the viewport scrolled to, for example).

> Scroll events can’t be prevented and are asynchronously delivered to JavaScript; hence the compositor thread can begin scrolling immediately regardless of whether or not the main thread processes the scroll event immediately.

# Layers

The DOM is divided into layers which can be painted independently and then composited together. Chrome has a tool that lets you see how many layers it's using. 

{% include candid-image.html src="/assets/images/react-virtual-scroll/glitchy-scroll-layers.png" alt="Spreadsheet Component Layers" %}

It's a little sparse but you can see that the scrollable area of the grid is an independent layer.

# Putting it all together

Now it makes sense. Scroll events are handled as a special case. They get delivered to the compositor thread first. The compositor moves the layer that's being scrolled and gets ready to compose the final frame. It forwards the event to the main thread and waits.

Over on the main thread, the event is dispatched to JavaScript by the event loop. React does its thing, the visible content is rendered and the DOM updated. The browser repaints the scrollable area and tells the compositor that the corresponding layer needs updating. 

The compositor decides that a frame is due. It combines all the layers and makes the result visible. If the main thread's update completes before this happens you get a normal frame and all is well. If the main thread didn't report back in time, the compositor uses what it has and you get a partially presented frame with up to date scrolling of stale content.

# Maximum Frame Time

Which suggests the problem is that frames take too long to render. How long is too long? The [standard guidance](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Long_animation_frame_timing) is that apps should respond to page interactions (clicks or key presses) within 200ms, take at most 50ms when animating and ideally complete within 16ms.

How long do my updates take? The profile above is from a dev build and shows a scroll event that takes exactly 16ms to process from event delivery to browser paint. Production builds take at most 5ms per frame. 

To make sure that rendering time isn't the problem I turned my monitor refresh rate down to 30 Hz, giving 33ms a frame. Here's a complete profile of a production build for one flick of the mouse wheel. 

{% include candid-image.html src="/assets/images/react-virtual-scroll/mouse-wheel-profile-frames.png" alt="Mouse Wheel Flick Profile Frames" %}

There are six scroll events with three good frames produced, then two bad ones before everything catches up for the final frame. Apart from the 5ms spent rendering, nothing happens during the remaining 28ms. 

# Good Frame

* Overview with a lane for the main thread (orange is JavaScript execution, purple is rendering, green is painting), below that the raster thread that actually paints each layer with the GPU compositor activity at the bottom.

{% include candid-image.html src="/assets/images/react-virtual-scroll/perf-scroll-good-frame.png" alt="Overview profile of a good frame" %}

* Frame starts, scroll event is delivered. There's a flurry of activity, the DOM is updated and the changes committed. The raster thread paints then the GPU compositor wakes up and completes the frame. Everything done in 5ms.

# Bad Frame

* Had to zoom out 2X to fit everything in.

{% include candid-image.html src="/assets/images/react-virtual-scroll/perf-scroll-bad-frame.png" alt="Overview profile of a bad frame" %}

* Frame starts but it takes 13ms before the scroll event is dispatched. Rendering and rasterization only takes 4ms this time. However, i't's too late. The GPU compositor woke up briefly just as the event was being delivered, saw that nothing new had been rendered and used the stale content from the previous frame. 
* Why is the scroll event delayed? No idea. The event loop is doing nothing. In a way it doesn't matter. Whatever is causing this is outside of my control. I just need to deal with the consequences. 

One flick of the mouse wheel results in 6 frames
* 1012 -> 1013 for 4.96 Normal Good
* 1046 -> 1046 for 3.56 Normal Good
* 1079 -> 1079 for 3.95 Normal Good
* 1113 -> 1126 for 3.55 Partial Bad, GPU 1126
* 1145 -> 1160 for 2.85 Normal Bad, GPU 1160
* 1179 -> 1193 for 4.74 Normal Good
* 1212