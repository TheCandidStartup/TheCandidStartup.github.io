---
title: Modern React Virtual Scroll Grid
tags: frontend
---

Time to go again. I've learnt a lot about how best to [implement virtual scrolling in React]({% link _posts/2023-12-04-react-virtual-scroll-grid-5.md %}). I've got my head round [modern React with Hooks](/_posts/2024-01-15-modern-react-with-hooks.md). Now I'm going to implement my own super scalable virtual scrolling grid control using modern React with Typescript.

The high level plan is to port features from the React class component based [react-window](https://github.com/bvaughn/react-window), change the interface to make it scalable, add [SlickGrid](https://github.com/6pac/SlickGrid)'s scalable paged scrolling implementation, and demonstrate that modern React principles lead to a cleaner implementation. 

Let's start with figuring out what, if anything, would be better implemented using modern React.

# React-Window Code Base

React-Window includes virtual scrolling list and grid components in fixed and variable size flavors. The bulk of the implementation is in [`createListComponent.js`](https://github.com/bvaughn/react-window/blob/master/src/createListComponent.js) and [`createGridComponent.js`](https://github.com/bvaughn/react-window/blob/master/src/createGridComponent.js). These include the common code for both types of grid and list components. Each component gets a dedicated source file which imports the common code and adds implementation specific to that type. These are [`FixedSizeList.js`](https://github.com/bvaughn/react-window/blob/master/src/FixedSizeList.js), [`VariableSizeList.js`](https://github.com/bvaughn/react-window/blob/master/src/VariableSizeList.js), [`FixedSizeGrid.js`](https://github.com/bvaughn/react-window/blob/master/src/FixedSizeGrid.js) and [`VariableSizeGrid.js`](https://github.com/bvaughn/react-window/blob/master/src/VariableSizeGrid.js). Finally, there are a number of small shared helper functions and some [unit tests](https://github.com/bvaughn/react-window/tree/master/src/__tests__).

It seems like a reasonable structure, with effort made to extract and share common code. And yet, looking around the code base, what strikes me is the amount of duplicate code. The list components support vertical **or** horizontal virtual scrolling, depending on configuration. All the code is in `createListComponent.js` with two separate, very similar, implementations for vertical and horizontal scrolling. The grid components need to support vertical **and** horizontal scrolling. All the code for this is in `createGridComponent.js` with another two separate, very similar, implementations for vertical and horizontal scrolling. That's four copies of essentially the same functionality.

If we move up a level to the four component specific source files we see similar duplication. The code to map between item index and offset for fixed size items appears four times for horizontal/vertical scrolling in list and grid components. The same happens for the variable item size components. 

There's additional, smaller scale duplication, across the constructor, render method, lifecycle methods and event handlers. All of which seems to confirm the modern React claim that class components make it hard to share implementation. 

# Virtual Scroller Custom Hook

The modern React solution for these problems is to extract common code into custom hooks which can be reused across multiple components. It seems like I have the perfect test case. Let's try and extract all the code needed for virtual scrolling in a single dimension as a virtual scroller custom hook. List components use a single instance of the hook, configured for horizontal or vertical scrolling as appropriate. Grid components use two instances of the hook, one for vertical and one for horizontal scrolling. 

# Control Flow

* Creation - default state, can include desired initial scroll position
* ComponentDidMount - scrolls DOM element to desired initial position, if any specified
* OnScroll - update scroll position in state
    * Uses updater flavour of setState to compare current and previous offset, determine scroll direction
    * isScrolling bool for whether scrolling is currently active (passed to child components as a prop)
    * Uses post-update callback to request a 150ms timeout
    * Clears isScrolling flag when timeout triggers. Used to "debounce" clear of flag. 
* Render - Render items in window based on scroll position
    * Two divs - fixed size outer, inner child set to full extent of virtual children
    * Refs that capture outer and inner HTML element
    * Outer ref accessible by parent component via ref callback
* ScrollTo - method that parent component can access via ref and call to scroll to desired offset or item
    * Updates state with *desired* position and flag to say update needed
* ComponentDidUpdate - lifecycle method called post-render, if updated needed flag set, sets scroll position of DOM element as requested. Means items are rendered in a non-visible position and then scrolled into view post-render. May cause problems for paged scrolling. 