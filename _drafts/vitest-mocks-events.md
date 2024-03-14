---
title: Vitest Timer Mocks and User Events
tags: frontend
---

Last time we got Vitest's code coverage tools up and running. Now I'm going to use the code coverage results to drive improvements to my unit test suite. As we go through this process I'll need to lean on additional [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) features.

# Starting Point

How's our coverage looking at the moment?

{% include candid-image.html src="/assets/images/coverage/coverage-start.png" alt="Coverage Starting Point" %}

Ignore `App.tsx`, `VirtualScroller.jsx` and `main.tsx`. They're part of my sample app so not in scope for unit testing. At some point I'll have to put a proper monorepo structure in place so that I can separate the different logical modules properly.

The three source files with dedicated unit tests look pretty healthy: `useEventListener.ts`, `useVirtualScroll.ts` and `VirtualList.ts`. The current `VirtualList` unit test is for fixed size items. Hence `useFixedSizeItemOffsetMapping.ts` has 100% coverage across the board and `useVariableSizeItemOffsetMapping.ts` has 0%. 

The remaining two files, `useAnimationTimeout.ts` and `useIsScrolling.ts`, have partial coverage. Which is understandable because the features they implement aren't are a focus for the existing tests. The tests don't scroll anything yet, so the `useIsScrolling` hook does nothing except initialize itself. The `useAnimationTimeout` hook is activated when `useIsScrolling` receives scroll events, so it's not doing anything either.

We should be able to get a big jump in coverage by updating the `VirtualList` tests to include scroll events and a variable sized item list.

# Events

* Ready to be amazed at how easy it is to generate scroll events with user-events
* user-events doesn't support scroll events
* jsdom (which user-events is designed to work with) doesn't perform any kind of layout, so what is there to scroll?
* We're using virtual scrolling with absolute positioning so we can check that the expected subset of items is present in the DOM and check the positioning properties in their styles.
* Need to use lower level `fireEvent` interface built into React Testing Library
* Not clear exactly what you need to include in the event
* Coded something up and gave it a try

```
 const outerDiv = document.querySelector("div");
 if (!outerDiv)
   throw "No outer div";

  {act(() => {
    fireEvent.scroll(outerDiv, { target: { scrollTop: 100 }});
  })}
```

* VirtualList control is built out of a fixed size outer div with a child inner div that holds all the list items.
* The outer div has the scroll event handler
* React Test Library has lots of handy methods for retrieving elements from the DOM
* Their [philosophy](https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change) is for tests to be user centered so those methods only let you query by things like role, label or text. None of which a div has.
* They support queryByTestId for cases like this but I don't have a clean way to pass a testid down to the div inside the control without doing real work
* I know the div I want is the top level div in the control which is all that I'm passing to render. I can use querySelector on document to grab it.
* Which is a long winded preamble to telling you that it didn't work.

# Debug Hell

* Stuck on breakpoint on the control's OnScroll handler and confirmed nothing coming through
* Suspected a problem with React/jsdom interaction
* Spent all day debugging through the many layers in between
* The event goes through jsdom and ends up in React land
* React then tries to find the React "fiber" that corresponds to the HTML Element the event has been delivered to
* First smoking gun: It can't find one and bails out
* The div element I'm delivering the event to is tagged as a reactContainer rather than a reactFiber
* Container seems to be how React identifies the "root" node in the tree of elements it's rendered. For some reason it won't deliver events to it.
* Aha, in my test app I have an app level div wrapped around the control. I'll add one to the test case and replace the selector with "div div" to grab it's child which should be my outer div.
* Great. Now the div is tagged as reactFiber but the event still doesn't get delivered. React can't find an event handler.
* Grabbing defeat from the jaws of victory.
* More futile debugging until eventually.
* Dive deeper into the debug inspector and open up the reactFiber structure. 

{% include candid-image.html src="/assets/images/coverage/vscode-fiber-inspector.png" alt="React Fiber in Visual Studio Code Debugger" %}

* There's a handy `_debugSource` property referencing a line number in my source code
* Which is the line with the "app div" I wrapped around the control
* There's a `child` property with another fiber. It's another div referencing the line in `VirtualList.tsx` where I declare the outer div.
* Face palm moment. React wraps its own root div around whatever I provide. I need to go one level deeper.
* What I really need is a more reliable way to grab the div which works regardless of what React chooses to wrap around my elements.

* Event is being delivered but scrolling still doesn't work. clientHeight and scrollHeight are both zero.
