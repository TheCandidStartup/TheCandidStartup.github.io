---
title: Paged Infinite Virtual Scrolling
tags: frontend spreadsheets
---

I'm [working on a cloud spreadsheet]({% link _topics/spreadsheets.md %}) system. It will support spreadsheets with millions of rows and columns. Potentially far more data than will fit into client memory, particularly a web client. Which means I need a front end implementation that can handle that.

Given that I have zero practical web front end development experience, where do I start? Which buzzwords do I need to include in my searches to bring up the right information? I know I'll have [some sort of grid control]({% link _posts/2023-06-12-database-grid-view.md %}) that provides a window on a small portion of the data. It's a spreadsheet so users will expect to use scroll bars as the main way of moving the window around. 

A few quick searches later and I have a shortlist of buzzwords: *paged*, *infinite* and *virtual*. But what do they mean? 

## Paged vs Infinite vs Virtual

{% assign posts_page = site.pages | where: "ref", "blog" | first %}
The best explanation I found, was in a [post by David Greene on Medium](https://medium.com/@david.greene_40229/the-fastest-javascript-data-grid-a-performance-analysis-d7a34389593e). The main focus of the post is a benchmarking comparison of different JavaScript grid controls. I think David was a marketing manager at Sencha, the creator of the ExtJS Grid, so take the benchmark results with a pinch of salt. However, the post starts off with a very clear and helpful definition of terms. It's well worth your time to read the original, but here's an executive summary:

* Paging: Users jump backwards and forwards through the data set, a page at a time. Just like the [Posts]({{ posts_page.url | absolute_url }}) section of this blog. 
* Infinite Scrolling: A subset of data is loaded into the grid control. Users can scroll through it. If they reach the end, more data is loaded and the scroll bar grows. The scroll bar  doesn't show the total amount of data available. 
* Virtual Scrolling: The scroll bar reflects the total amount of data available. Users can scroll seamlessly through the entire set. As they do, data is loaded (and if necessary unloaded) behind the scenes.

{% include candid-image.html src="/assets/images/frontend/paged-infinite-virtual-scrolling.gif" alt="Paging, Infinite Scrolling and Virtual Scrolling" attrib="" attrib="[David Greene on Medium](https://medium.com/@david.greene_40229/the-fastest-javascript-data-grid-a-performance-analysis-d7a34389593e)" %}

Got it. Clearly, I need to implement virtual scrolling. Now, how do I do that?

## Panning for Gold

I tried a few different variations of "implement virtual scrolling" search terms. All that I got back were adverts and marketing for commercial grid controls. Out of desperation I even fired a few up and poked around in Chrome developer tools. All that told me was that the control's DOM contained elements that were visible in the grid. Them, buried under many layers of abstraction, scroll events would result in updates to the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction) to add and remove elements.

I want to understand the detail of how it works. What are the limits? Where are the edge cases that will catch you out? How can you work with the browser platform rather than fighting against it?

Eventually I stumbled across one [Stack Overflow question](https://stackoverflow.com/questions/18461567/maintain-scrolltop-while-inserting-new-sections-above-the-current-viewed-element) asking about one of those edge cases. Any virtual scrolling implementation that works with the DOM consists of a fixed height parent container with a larger child that it scrolls over. As the user begins to scroll down, the implementation has to add new content to the end of the child before it scrolls into view. This just works. The existing content remains in the same place within the parent container, with the additional content ready to move into view. However, when the user scrolls up, new content has to be added to the beginning of the child. This has the effect of pushing the existing content down. The scroll bar position needs to be adjusted so that the existing content stays in the same place.

What's the best way of doing that? How do you stop the browser repainting before you've finished all the adjustments? There was a suggestion that the browser might "glitch" with the content pushed down and then jumping back into place. 

As is often the case with a really technical question on stack overflow, there were no replies apart from a later follow up by the original author reporting the solution they'd used. 

## When do DOM changes become visible?

That's interesting, I thought. How *do* DOM updates interact with rendering? Is it a browser specific implementation detail, or something you can rely on?

The [basic principle](https://www.macarthur.me/posts/when-dom-updates-appear-to-be-asynchronous) is that everything is driven from [JavaScript's event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop). The event loop triggers some of your JavaScript which updates the DOM. The DOM is marked as dirty. Your code eventually completes, or performs an async operation, which returns control back to the event loop. The event loop will eventually schedule a render. Browsers try to batch up changes and limit how often renders occur. Typically no more than 60 frames a second. 

If you want to ensure that a set of changes are all made together, you need to make them all synchronously. It will often still work if you have a few asynchronous calls, but there's always the chance you'll be unlucky, hence the reported "glitching". 

## Chrome RenderingNG Architecture

Does a modern browser really work this way? In this age of multi-core CPUs, it seems crazy to run everything on a single thread managed by an event loop. An architecture that relies on everyone being a good citizen and *NOT* running long sections of synchronous code. 

The Chrome team have a great [series of blog posts](https://developer.chrome.com/articles/renderingng-architecture/) that describe how rendering is actually implemented in Chrome. There are multiple threads and multiple processes. Large parts of the rendering pipeline don't use the main thread. Some common interactions, such as scrolling a web page where the DOM hasn't changed, don't touch the main thread at all.

{% include candid-image.html src="/assets/images/frontend/chrome-dom-change-render-flow.png" alt="Chrome control flow from DOM Change to Pixels on Screen" attrib="" attrib="[Overview of the RenderingNG architecture, Chrome for Developers](https://developer.chrome.com/articles/renderingng-architecture/)" %}

Despite all that the core semantics remain intact. Most of the work happens in other threads and processes. However, the DOM Change and the document lifecycle that ends with the render being triggered are still managed by the main thread event loop.

## React Virtual DOM

I was still curious. Modern UI frameworks, like React, have layers of abstraction. They're packed with callbacks, events and other asynchronous control flow. React has a [Virtual DOM](https://blog.logrocket.com/virtual-dom-react/) model, where you make changes to a lightweight representation of the page, and React works out how to apply those changes to the actual DOM. 

{% include candid-image.html src="/assets/images/frontend/react-actual-dom-update-repaint.png" alt="React compares initial and updated virtual DOM to work out how to update the actual DOM" attrib="" attrib="[What is the virtual DOM in React?, LogRocket](https://blog.logrocket.com/virtual-dom-react/)" %}

React uses a [three phase process](https://blog.isquaredsoftware.com/2020/05/blogged-answers-a-mostly-complete-guide-to-react-rendering-behavior/) to implement this. First, a React application triggers a *Render*. Despite the name, no actual rendering occurs. Instead, the tree of React components returns the current state of the virtual DOM that represents what the application would like to be rendered. Second, React runs a *Reconciliation* algorithm which compares the current and previously rendered virtual DOM, and generates a list of updates that need to be applied to the actual DOM. Finally, React *Commits* those changes to the actual DOM. 

All the heavy lifting is done in the render and reconciliation phases. React can return control to the event loop during these phases and resume later. However, the commit phase is always executed synchronously, so the browser will never display a partially updated DOM.

## Virtual Scrolling Implementation in React

* React virtual scrolling implementation blog


## How does Google Sheets work?

