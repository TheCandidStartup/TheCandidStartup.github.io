---
title: Vitest with User Events
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
* Coded something up based on a [Stack Overflow answer](https://stackoverflow.com/questions/52665318/how-to-fireevent-scroll-on-a-element-inside-container-with-react-testing-library) and gave it a try

```
  const outerDiv = document.querySelector("div") || throwErr("Can't find div");
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

* Stuck a breakpoint on the control's OnScroll handler and confirmed nothing coming through
* Suspected a problem with React/jsdom interaction
* Let's step into `fireEvent` in a debugger and see where it goes wrong

## Not My Code

* Visual Studio Code won't let me step into the `fireEvent` function
* I've run into this before with full fat Visual Studio. To avoid the poor innocent developer being confused by other people's code, there's a feature that automatically steps over it. 
* Now I have to figure out how to turn it off. I vaguely remember a boolean setting called "just my code" or similar but can't find anything like it in Visual Studio Code
* Some googling finds the [Visual Studio Code equivalent](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_skipping-uninteresting-code). A `skipFiles` property in `launch.json` where you can provide glob patterns for source files to skip.
* My problem now is that I don't have a `launch.json` file. Launching is handled for me by the vitest plugin.
* Eventually I track down the answer in the [Vitest vscode github repo](https://github.com/search?q=repo%3Avitest-dev%2Fvscode%20debugexclude&type=code). The plugin has a [`debugExclude` setting](https://github.com/vitest-dev/vscode/blob/dd3e081a4c35ef183bd80a59ac54bf79a67eb3e3/README.md) which is copied to `skipFiles` in the launch settings. It's a per user setting in the Visual Studio Code `settings.json` which defaults to ignoring anything in node internals and modules.
* I removed the node_modules exclusion and finally I can step into `fireEvent`.

## fireEvent

* It took me a while to figure out what `fireEvent` was actually doing
* At first glance you would think it's creating an event with a "payload" containing `{ target: { scrollTop: 100 }}`
* Aren't I missing loads of important properties?
* There's actually very little payload in an event - just a handful of properties. The target property in the event is just a reference to the HTML element that the event is dispatched on.
* There is no "payload". When `fireEvent` is passed a `target` property, it simply copies the contents into the HTML element the event is being dispatched to and then calls the DOM dispatchEvent method.
* The DOM in turn sets the event's `target` property to the element being dispatched on
* Similarly it sets the event's `currentTarget` property to the element that it delivers the event too

## Tunnelling Through

* Spent all day debugging through the many layers in between
* fireEvent calls the DOM dispatchEvent method implemented by jsdom. Eventually the event crosses the border into React land
* React then tries to find the React "fiber" that corresponds to the target HTML Element the event has been delivered to
* First smoking gun: It can't find one and bails out
* The div element I'm delivering the event to is tagged as a `reactContainer` rather than a `reactFiber`
* Container seems to be how React identifies the "root" node in the tree of elements it's rendered. For some reason it won't even try to deliver events that directly target it.

## Progress of a Sort

* Aha, in my test app I have an app level div wrapped around the control. Maybe you need a static div to act as the root.
* I'll add one to the test case and replace the selector with "div div" to grab it's child which should be my outer div.
* Great. Now the div is tagged as reactFiber but the event still doesn't get delivered. We get further into the React code but now React can't find an event handler to deliver it to. 

## Capturing and Bubbling

* Need a better understanding of [how events are delivered](https://javascript.info/bubbling-and-capturing)
* First phase is capturing. The DOM starts at the root of the document and goes down the chain of ancestors to the target element checking to see if any element is listening for that event in capture mode.
* This is rarely used. You need to pass an additional argument to whatever API you're using.
* Second phase is bubbling. The DOM starts at the target element and goes up the chain of ancestors checking to see if any element is listening for the event in bubbling mode.
* Event handlers can optionally prevent any further propagation which is what you'd normally do on the rare occasions you use capture mode. It's there so you can "capture" the event and prevent it being delivered to a child.
* The jsdom implementation makes more sense now. React gets invoked twice. Once in capture node and once in bubbling mode.
* There's an added complication. The scroll event is a special case. It [doesn't bubble](https://www.aleksandrhovhannisyan.com/blog/interactive-guide-to-javascript-events/#not-all-events-bubble). It only gets delivered to the target element in bubbling mode. 

## React Events

* Now need to understand what happens on the React side
* First thing is that React only [attaches event handlers to the root node](https://legacy.reactjs.org/blog/2020/08/10/react-v17-rc.html#changes-to-event-delegation) of it's DOM tree.
* It then uses its own implementation of capturing and bubbling to search it's "fiber" tree for React event handlers.
* How does a scroll event ever get delivered? It doesn't bubble so the DOM won't deliver it to the React root node.
* Another special case. If you have a scroll event handler, React adds an event listener directly to the corresponding HTML element rather than relying on delegation. 
* Which still doesn't explain why my unit test isn't working. 

## Face Palm Time

* More futile debugging until eventually.
* Dive deeper into the debug inspector and open up the reactFiber structure. 

{% include candid-image.html src="/assets/images/coverage/vscode-fiber-inspector.png" alt="React Fiber in Visual Studio Code Debugger" %}

* There's a handy `_debugSource` property referencing a line number in my source code
* Which is the line with the "app div" I wrapped around the control
* There's a `child` property with another fiber. It's another div referencing the line in `VirtualList.tsx` where I declare the outer div.
* Face palm moment. React wraps its own root div around whatever I provide. I need to go one level deeper.
* When I did I saw that the correct outer div element also has a handy `reactEvents` property if it has an event handler

* What I really need is a more reliable way to grab the div which works regardless of what React chooses to wrap around my elements. For now I'm going to start with one of the list items that my test successfully queries and work upwards from there.

```
  const header = screen.getByText('Header');
  const innerDiv = header.parentElement || throwErr("No inner div");
  const outerDiv = innerDiv.parentElement || throwErr("No outer div");
```

# Layout

* Event is being delivered but scrolling still doesn't work. Scroll handling depends on clientHeight and scrollHeight properties on target element. Both are zero. Remember, jsdom doesn't implement layout. The only layout related properties with meaningful values are those that my code explicitly sets.
* I need to mock up enough layout to set the properties that the control depends on. 