---
title: >
    React Virtual Scroll Grid 3 : Binary Chop
tags: frontend
---

{% capture rvs2_url %}{% link _drafts/react-virtual-scroll-grid-2.md %}{% endcapture %}
We're on a journey, trying to find out why our [simple React virtual scrolling list](https://github.com/TheCandidStartup/react-virtual-scroll-grid) flickers and goes blank while you're dragging the scroll handle. 
[Last time]({{ rvs2_url }}), we ended when we found [react-window](https://github.com/bvaughn/react-window), a mature library of virtual scrolling components that didn't have any rendering problems when scrolling. 

## React-window

React-window is an open source library for "efficiently rendering large lists and tabular data ". It includes controls for virtual scrolling lists and grids. It's a mature project, first created 6 years ago, with more recent development activity restricted to minor bug fixes and support for newer versions of React. It currently supports React 15 - 18. There's an impressive list of features including support for both fixed and variable sized items, vertical and horizontally scrolling lists, left-to-right and right-to-left text and alternative styling while scrolling. 

There's an associated [web site](https://react-window.now.sh/) with lots of example code and live samples. All the samples have links out to [CodeSandbox](https://codesandbox.io/s/github/bvaughn/react-window/tree/master/website/sandboxes/fixed-size-list-vertical) where you can play with the code next to a live running sample. 

Looking at the code base, there's lots of focus on optimization and the sort of edge case handling that you would expect to see in a well maintained library. However, once you get past that, and all the features, it works just like my simple virtual scrolling example. There's a React [OnScroll handler](https://github.com/bvaughn/react-window/blob/6ff5694ac810617515acf74401ba68fe2951133b/src/createListComponent.js#L590) which sets state based on the scroll position which triggers a [render](https://github.com/bvaughn/react-window/blob/6ff5694ac810617515acf74401ba68fe2951133b/src/createListComponent.js#L310) that results in React creating the visible DOM elements.

## Differences

So, what could account for the difference in behavior? Here's a few things that leapt out at me.
* **React Version**: I'm using React 18. It's not clear what version of React the sample web site is using.
* **Tooling**: I'm using Vite with TypeScript. React-window uses Babel and Flow type annotations.
* **App Scaffold**: My app is rooted using the new React 18 syntax of `ReactDOM.createRoot()` while react-window is using the legacy `ReactDOM.render()`.
* **Pure Components**: React-window controls are subclasses of `PureComponent`, my simple example is a subclass of `Component`.
* **State**: React-window uses simple state entirely related to the scrolling position, my example has a kitchen sink state including a load of derived data.
* **Buffer Rows**: My simple example creates five buffer rows above and below the visible items. React-window controls create a single buffer item, positioned depending on which direction the control is scrolling. 
* **Positioning**: My simple example uses relative positioning of the row items, sandwiching them between two padding containers. React-window has just the row items as children, using absolute positioning. 
* **Optimization**: React-window uses [memoization](https://github.com/alexreardon/memoize-one) and [caches](https://github.com/bvaughn/react-window/blob/6ff5694ac810617515acf74401ba68fe2951133b/src/createListComponent.js#L468) as optimizations. My simple example doesn't. 


## Binary Chop

As well as being a [useful search algorithm](https://en.wikipedia.org/wiki/Binary_search_algorithm), binary chop can be an effective debugging tool. The classic example is when you discover a new bug in your software but have no idea how or when it was introduced. Given the current version and an older version without the bug, you can use binary chop on the version history to work out which change caused the problem. Git even includes a [feature](https://git-scm.com/docs/git-bisect) that automates the process. 

A variation is where you have two unrelated code bases, one with the problem and one without. The common case is a bug in a large and complex code base. You try to craft a self contained sample to make it easier to investigate. Of course your sample doesn't exhibit the bug. You can use binary chop to narrow the gap, either by adding more complexity to the sample, or by removing big chunks of code from the large code base. The trick is to start with the changes that have the biggest impact, narrowing the gap the most. 

We have the same problem here, albeit role reversed, as the small sample has the problem and the larger code base does not. 

## Pure Components and State

Of course, I ignored my advice and started with a smaller scale change. When [using the react developer tools]({{ rvs2_url | append: "#react-developer-tools" }}), I'd noticed that render was being triggered even when the visible items were the same as the previous frame. For example, when starting to scroll, you would often start by moving a fraction of an item. I thought that, maybe, the additional renders were throwing things off. Plus the inefficiency was bugging me. 

By default, React will trigger a render any time you call `setState()`, even if the state hasn't changed. If you subclass your React component from PureComponent instead of Component, it will only render if the values have changed. React-window already does this, it was a simple change to make my sample do the same.

Unfortunately, that had no effect. React uses the JavaScript [strict equality (===)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality) operator to compare the properties in the state. The sample I'd copied did all the work of deciding what to render in the scroll handler, including retrieving the list of row data that needed to be rendered. That meant creating and storing a complex data structure (array of objects) in the state. Strict equality is a shallow comparison operation, so will return false when comparing two copies of the same complex data structure.

I refactored the code so that, like react-window, it just stored the scroll position in the state, and moved retrieval of the list of row data to the `render()` function. 

Success, in that I removed two unnecessary renders, failure in that the control still went blank when scrolling. 

## React Version, Tooling and App Scaffold

I moved on to what I should have done in the first place. Often, hard to find problems are caused by differences in the environment. Those "works on my machine" kind of problems. I could chop out all of those differences by installing react-window and adding an instance of their `FixedSizeList` component to my sample app. 

I added `react-window` to the list of dependencies in my `package.json` file and installed. 

```
% npm install

added 4 packages, and audited 158 packages in 2s

found 0 vulnerabilities
```

Adding react-window also pulled in babel runtime, regenerator-runtime and memoize-one modules. 

Next, I added an import statement for `FixedSizeList` to `App.tsx` and got the familiar warning about missing types in Visual Studio Code. However, this time it had a helpful suggestion.

```
Could not find a declaration file for module 'react-window'. '/node_modules/react-window/dist/index.cjs.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/react-window` if it exists or add a new declaration (.d.ts) file containing `declare module 'react-window';`ts(7016)
```

I ran the npm command and, yes, there is a TypeScript declaration module for react-window. I used the react-window sample code to add an instance of `FixedSizeList` to my app. A couple of type annotations later and it was up and running.

My app now contained two list controls. And both of them went blank when scrolling. 

Now we're getting somewhere. The problem is caused by React Version, Tooling or App Scaffold. 

## React Version

The React developer tools have a handy feature that tells you whether the current page uses React and if so which version it is. I went back to the react-window sample website and fired up the developer tools. 

They were using React 16. 

## React 18

Looks like a problem with React 18. Surely someone else has noticed it? React 18 was released over 18 months ago. I looked through the release notes to see if there was a known issue that had already been fixed. No joy.

I opened up the React [issues tracker](https://github.com/facebook/react/issues) on GitHub. Over a thousand open issues. This might take a while. 

I was lucky. The 20th issue I looked at, on the first page of results, was [Bug: performance deteriorates when using ReactDOM.createRoot instead of ReactDom.render for virtual-table](https://github.com/facebook/react/issues/27524).  It described the same problem I was seeing. Surprisingly, it was only opened three weeks previously. 

## React Scheduler

React 18 has a [cooperative multitasking model](https://github.com/reactwg/react-18/discussions/27) where rendering work is divided into multiple units. Updates can be interrupted between units, currently if more than 5ms have elapsed,  and control returned to the event loop. The intention is to prevent low priority updates from blocking the event loop. 

The [scheduler has five priority levels](https://jser.dev/react/2022/03/16/how-react-scheduler-works/). At the highest, immediate priority level, work is performed synchronously. At every other priority level, tasks are added to a priority queue with a priority level specific timeout for how long the task can wait. Finally, if this is the first task added to the queue, a callback is scheduled to process the queue. 

The end result is that anything lower than immediate priority level can be interrupted by a browser paint operation. So, the critical question is, what priority does a scroll event have? 

The answer is in the [response](https://github.com/facebook/react/issues/27524#issuecomment-1769792689) to the bug report. Only "discrete" input events, like a button click, are given the immediate priority level. Continuous input, like scrolling, where you receive a stream of events until the user is done, get the lower "user blocking" priority level. 

I'm hoping this is an unintended consequence that can be fixed in future. It doesn't make sense that updates in response to scroll events, or `requestAnimationFrame`, will always render a frame late. A better implementation for the "user blocking" priority level would be to start processing updates synchronously and then schedule any remaining work if more than 5ms have elapsed. This way, if updates are fast enough, you see the correct content, while ensuring that the app stays responsive if updates are too slow. 

## Workarounds

What can I do now? There seem to be three options. First, I could go back to a previous major version of React. Previous versions still get security updates but no other support. 

I would prefer to stay on React 18 if I can. The new "Concurrent Rendering" scheduler is meant to be opt-in. It seems that I inadvertently opted in by using an app scaffold with the new `ReactDOM.createRoot()`. If you switch back to `ReactDOM.render()`, you activate a legacy scheduling mode which works just like React 17. 

If you want to make use of the React 18 features that depend on the new scheduler, you can force synchronous rendering for selected updates by wrapping them with `flushSync`.

```
flushSync(() => {
    this.setState({
      topPaddingHeight,
      bottomPaddingHeight,
      index
    })
})
```

The downside is that `flushSync` is more aggressive than needed. It forces an immediate render of that specific change, preventing React from batching together other changes triggered by the same event. It also means you need to update every continuous event handler and `requestAnimationFrame` callback yourself. Including in third party modules like react-window. 

## Try It!

For now, I'm using the `ReactDOM.render()` workaround. It's the simplest, least intrusive fix. I won't need any of the fancy React 18 features for my spreadsheet app.

[Try it out]({% link assets/dist/react-scroll-list-2/index.html %}) and revel in the smooth, responsive scrolling, with immediate feedback. My simple example, complete with style sheet hacks marking the first and last "visible" rows in green, is on the left. React-window's FixedSizeList, set up to use the same size and number of rows, is on the right.

{% include candid-iframe.html src="/assets/dist/react-scroll-list-2/index.html" width="100%" height="fit-content" %}
