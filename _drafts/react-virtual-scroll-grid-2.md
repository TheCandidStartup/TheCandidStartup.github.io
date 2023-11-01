---
title: >
    React Virtual Scroll Grid 2 : Binary Chop
tags: frontend
---

[Last time]({% link _drafts/react-virtual-scroll-grid.md %}) I left you with a cliff hanger. Why is my simple virtualized scrolling list going blank if you scroll it too fast? I had some theories. Time to apply the scientific method and see which ones stand up.

{% include candid-image.html src="/assets/images/frontend/react-virtual-scroll-copy-paste.png" alt="React Virtual Scroll Copy and Pasted into Vite project" %}

## Search Query Engineering

While all the cool kids have moved on to ChatGPT prompt engineering, I start most of my research with Google search query engineering. Can I find the right form of words that will make Google give me something useful?

### Chrome Breakpoints

I started with the weird breakpoint behavior in Chrome. Have I really found evidence that there's an inherent race condition between the main and rendering threads when scrolling triggers a DOM update? 

I struck pay dirt with "`why chromes rendering result is different when using breakpoints`". I found an [answer](https://stackoverflow.com/a/73567420) on Stack Overflow. It says that the browser enters a special "[spin the event loop](https://html.spec.whatwg.org/multipage/webappapis.html#spin-the-event-loop)" mode when it hits a breakpoint. In this mode the event loop continues background processes such as CSS animations and repaints of DOM changes, which disabling execution of event handlers. 

Which explains the weird behavior I was seeing when debugging. No smoking gun there. 

### Chrome Rendering Tab

The next query I tried was "`chrome updated dom during scroll but didn't render`", which generated a lot of useful looking results. I learnt that Chrome developer tools [has a rendering tab](https://developer.chrome.com/docs/devtools/rendering/performance/) which includes a checkbox to identify "Scrolling Performance issues". Unfortunately, nothing in the rendering tab shed light on my scrolling problem. 

### Chrome Rendering and Compositing

A link from that article took me to a Chrome blog with useful background information on the [renderer process](https://developer.chrome.com/blog/inside-browser-part3/#what-is-compositing) and [how input is handled by the compositor process](https://developer.chrome.com/blog/inside-browser-part4/). That article makes it clear that there is no race condition. If the element being scrolled has an event listener, then fast scrolling is disabled and the rendering process waits for the event listener to run first. That is, unless you mark your event listener with the `passive: true` property. No, that's not it. The Scroll event listener in my app doesn't have that property set.

### The will-change CSS Attribute

The render process article introduced me to the `will-change` CSS attribute. It's used as a [hint to the browser](https://dev.opera.com/articles/css-will-change-property/) that you're going to change something. The browser can use the hint to decide how to divide the page into compositing layers. This can help avoid "flicker" and "jank". Maybe that's what I'm suffering from? I tried adding a few variations of will-change attributes to my app's style sheet but it didn't make any difference.

### Chrome Layers Tab

The Chrome rendering article mentions the Chrome developer tools [Layers tab](https://blog.logrocket.com/eliminate-content-repaints-with-the-new-layers-panel-in-chrome-e2c306d4d752/). This tool lets you see how the browser has divided your content into compositing layers. 

{% include candid-image.html src="/assets/images/frontend/chrome-react-grid-layers-tab.png" alt="Compositing Layers for the React Scroll List" %}

There are three layers. The large black rectangle (`#document`) represents the visible page. This is the default layer containing everything that isn't on another layer. The long green rectangle (`.viewport`) is the child container that the viewport is scrolling over. The layers tab shows it moving up and down as you scroll. The final rectangle (`#2991`) is the scroll bar that the browser creates. 

Now it gets interesting. When I scroll up and down quickly so that the scroll list goes blank, the viewport layer disappears (both visually and from the list on the left). Something is happening to make the browser think that a separate layer isn't needed.

I then noticed that the DOM structure didn't actually have a distinct child container. The viewport container has a direct list of children: the top padding containers and all the loaded rows. Maybe when React is rebuilding the DOM when you're scrolling fast, it ends up throwing all the existing elements away and making new ones. There's nothing stable for the browser to map to the layer.

I added another div between the viewport and the children. Hopefully React would reuse it rather than replacing it when rebuilding the DOM. It worked, to some extent. The viewport layer no longers disappears from the layers tab, but the scroll list still goes blank. 

{% include candid-image.html src="/assets/images/frontend/chrome-react-grid-layers-tab-paints.png" alt="Compositing Layers for the React Scroll List" %}