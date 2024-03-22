---
title: Vitest with User Events
tags: frontend
---

[Last time]({% link _posts/2024-03-18-vitest-code-coverage.md %}) we got Vitest's code coverage tools up and running. Now I'm going to use the code coverage results to drive improvements to my unit test suite. As we go through this process I'll need to lean on additional [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) features.

# Starting Point

How's our coverage looking at the moment?

{% include candid-image.html src="/assets/images/coverage/coverage-start.png" alt="Coverage Starting Point" %}

Ignore `App.tsx`, `VirtualScroller.jsx` and `main.tsx`. They're part of my sample app so not in scope for unit testing. At some point I'll have to put a monorepo structure in place so that I can separate the different logical modules properly.

The three source files with dedicated unit tests look pretty healthy: `useEventListener.ts`, `useVirtualScroll.ts` and `VirtualList.ts`. The current `VirtualList` unit test is for fixed size items. Hence `useFixedSizeItemOffsetMapping.ts` has 100% coverage across the board and `useVariableSizeItemOffsetMapping.ts` has 0%. 

The remaining two files, `useAnimationTimeout.ts` and `useIsScrolling.ts`, have partial coverage. Which is understandable because the features they implement aren't a focus for the existing tests. The tests don't scroll anything yet, so the `useIsScrolling` hook does nothing except initialize itself. The `useAnimationTimeout` hook is activated when `useIsScrolling` receives scroll events, so it's not doing anything either.

We should be able to get a big jump in coverage by updating the `VirtualList` tests to include scroll events and a variable sized item list.

# Events

I was ready to be amazed at how easy it is to generate scroll events with the [user-event](https://testing-library.com/docs/user-event/intro/) companion library for Testing Library. The library simulates full interactions, firing the multiple events that correspond to an end user interaction. I thought I'd start with a page down scroll interaction.

It turns out that user-event doesn't support scroll events. It's pointer (mouse, touch) and keyboard events only. Unit test focused DOM implementations, like jsdom, support the logical DOM structure. They don't implement a real browser's layout system. If you want to test that, use a browser engine. 

If there's no layout then how can you know what needs scrolling?

We're using virtual scrolling with absolute positioning. We render items that we expect to be visible inside a window of known size given a scroll position. We should be able to send a scroll event, trigger a render and check that the expected subset of items is present in the DOM. 

React Testing Library has a lower level `fireEvent` interface built in. It's not clear from the documentation exactly what you need to include in the event. I coded something up based on a [Stack Overflow answer](https://stackoverflow.com/questions/52665318/how-to-fireevent-scroll-on-a-element-inside-container-with-react-testing-library) and gave it a try.

```
  const outerDiv = document.querySelector("div") || throwErr("Can't find div");
  {act(() => {
    fireEvent.scroll(outerDiv, { target: { scrollTop: 120 }});
  })}
```

My `VirtualList` control is built out of a fixed size outer div with a child inner div that holds all the list items. The outer div has the scroll event handler. 

React Test Library has lots of handy methods for retrieving elements from the DOM. Their [philosophy](https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change) is for tests to be user centered so those methods only let you query by things like role, label or text. None of which a div has. They support `queryByTestId` for cases like this but I don't have a clean way to pass a test id down to the div inside the control. 

I know the div I want is the top level div in the control, which is all that I'm passing to render. I can use `querySelector` on document to grab it.
Unfortunately, it didn't work. I fired off the event and it had no effect on the state of the control. 

# Debug Hell

My first action was to stick a breakpoint on the control's `OnScroll` handler and confirm that nothing was coming through. I suspected a problem with how React interacts with jsdom. So I stepped into `fireEvent` in the debugger to see what was going on. 

## Not My Code

Visual Studio Code won't let me step into the `fireEvent` function. It just steps over it. 

I've run into this before with the full fat version of Visual Studio. To avoid the poor innocent developer being confused by other people's code, there's a feature that automatically steps over it. Now I have to figure out how to turn it off. I vaguely remember a boolean setting called "just my code" or similar but can't find anything like it in Visual Studio Code.

Some googling finds the [Visual Studio Code equivalent](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_skipping-uninteresting-code). A `skipFiles` property in `launch.json` where you can provide glob patterns for source files to skip. My problem now is that I don't have a `launch.json` file. Launching is handled for me by the Vitest plugin.

Eventually I track down the answer in the [Vitest vscode github repo](https://github.com/search?q=repo%3Avitest-dev%2Fvscode%20debugexclude&type=code). The plugin has a [`debugExclude` setting](https://github.com/vitest-dev/vscode/blob/dd3e081a4c35ef183bd80a59ac54bf79a67eb3e3/README.md) which is copied to `skipFiles` in the launch settings. It's a per user setting in the Visual Studio Code `settings.json` which defaults to ignoring anything in node internals and modules.

I removed the node_modules exclusion and finally I can step into `fireEvent`.

## fireEvent

It took me a while to figure out what `fireEvent` was actually doing. At first glance you would think it's creating an event with a "payload" containing `{ target: { scrollTop: 120 }}`. Isn't that missing loads of important properties?

There's actually very little payload in an event, just a handful of properties. The `target` property in the event is just a reference to the HTML element that the event is dispatched on. There is no "payload". 

When `fireEvent` is passed a `target` property, it simply copies the contents into the HTML element the event is being dispatched to and then calls the DOM `dispatchEvent` method. The DOM in turn sets the event's `target` property to the element being dispatched on. Similarly, it sets the event's `currentTarget` property to the element that it delivers the event to.

## Tunnelling Through

My event makes it into jsdom. I spent the rest of the day debugging through the many layers between `dispatchEvent` and the `OnScroll` handler in React. If I dive deep enough I can see that the event crosses the border into React land. 

React first tries to find the internal React "fiber" that corresponds to the target HTML Element. Which is where I found my first smoking gun. It can't find one and bails out. 

React maintains the correspondence between its internal data structures and the elements in the DOM by adding properties to the elements. The div element I'm delivering the event to has a `reactContainer` property added to it rather than the `reactFiber` property React is looking for.

The container property seems to be how React identifies the "root" node in the tree of elements it's rendered. For some reason it won't even try to deliver events that directly target it.

## Progress of a Sort

I realized that in my test app I have an app level div wrapped around the control. Maybe you need a top level static div to act as the root? I added one to my unit test and replaced the selector with `"div div"`. That should grab the first child of the top level div, which should be my outer div.

When I run the test again, the div now has a `reactFiber` property but the event still doesn't get delivered. The event gets deeper into the React code but now React can't find an event handler to deliver it to. 

## Capturing and Bubbling

I need a better understanding of [how events are delivered](https://javascript.info/bubbling-and-capturing). It turns out that it involves a two phase process. 

The first phase is "capturing". The DOM starts at the root of the document and goes down the chain of ancestors to the target element, checking to see if any element is listening for that event in capture mode. This is rarely used. You need to pass an additional argument to whatever API you're using to enable capture mode.

The second phase is "bubbling". The DOM starts at the target element and goes up the chain of ancestors checking to see if any element is listening for the event in bubbling mode. This is the default behavior and is how my `OnScroll` handler is configured. 

Event handlers can optionally prevent any further propagation which is what you'd normally do on the rare occasions you use capture mode. It's there so you can "capture" the event and prevent it being delivered to a child.

The jsdom implementation makes more sense now. React gets invoked twice. Once in capture mode and once in bubbling mode. 

There's an added complication. The scroll event is a special case. It [doesn't bubble](https://www.aleksandrhovhannisyan.com/blog/interactive-guide-to-javascript-events/#not-all-events-bubble). It only gets delivered to the target element in bubbling mode. 

## React Events

Now I need to understand what happens on the React side. The first thing to understand is that React only [attaches event handlers to the root node](https://legacy.reactjs.org/blog/2020/08/10/react-v17-rc.html#changes-to-event-delegation) of its DOM tree. It then uses its own implementation of capturing and bubbling to search its "fiber" tree for React event handlers.

How does a scroll event ever get delivered? It doesn't bubble, so the DOM won't deliver it to the React root node.

This is another special case. If you have a scroll event handler, React adds an event listener directly to the corresponding HTML element rather than relying on delegation from the root node. 

All of which is fascinating but still doesn't explain why my unit test isn't working. 

## Facepalm Time

More futile debugging followed until I eventually dived deeper into the debug inspector and opened up the `reactFiber` object.

{% include candid-image.html src="/assets/images/coverage/vscode-fiber-inspector.png" alt="React Fiber in Visual Studio Code Debugger" %}

There's a handy `_debugSource` property referencing a line number in my source code. Which is the line with the "app div" I wrapped around the control.

There's a `child` property with another fiber. It's another div referencing the line in `VirtualList.tsx` where I declare the outer div.

At which point I did the classic [facepalm](https://en.wikipedia.org/wiki/Facepalm) gesture. React wraps its own root div around whatever I provide. I need to go one level deeper. When I did, I saw that the correct outer div element also has a handy `reactEvents` property that includes the event handler.

What I really need is a more reliable way to grab the div which works regardless of what React chooses to wrap around my elements. For now I'm going to start with one of the list items that my test successfully queries and work upwards from there.

```
  function throwErr(msg: string): never {
    throw msg;
  }

  const header = screen.getByText('Header');
  const innerDiv = header.parentElement || throwErr("No inner div");
  const outerDiv = innerDiv.parentElement || throwErr("No outer div");
```

On a side note, my definition of a `throwErr` function was the simplest way I could find to implement "[do or die](https://wiki.c2.com/?DoOrDie)" semantics in TypeScript. The "throw" keyword is a statement in JavaScript, not an expression, so needs to be wrapped in a function. I had to add the `never` type assertion before TypeScript would reliably infer that `outerDiv` has the type `HTMLELement` rather than `HTMLElement | null`. 

# Layout

Finally, I can see that the event is being delivered, but scrolling still doesn't work. My scroll logic depends on the `clientHeight` and `scrollHeight` properties on the target element. Both are zero. 

Remember, jsdom doesn't implement layout. The only layout related properties with meaningful values are those that my code explicitly sets. I need to mock up enough layout that I can set the properties that the control depends on.

Which is trickier than you might think. All the derived layout related properties are read-only, so direct assignment doesn't work. The jsdom README [suggests](https://github.com/jsdom/jsdom?tab=readme-ov-file#unimplemented-parts-of-the-web-platform) using `Object.defineProperty` if you need to override the stub implementation. I made myself a handy utility function to override a property.

```
function overrideProp(element: HTMLElement, prop: string, val: any) {
  if (!(prop in element))
    throw `Property ${prop} doesn't exist when trying to override`;

  Object.defineProperty(element, prop, {
    value: val,
    writable: false
  });
}
```

I don't need much layout. Just setting `scrollHeight` to the height of the inner div and `clientHeight` to the height of the outer div. The height property in the DOM is a string containing the height in pixels, hence the `parseInt`.

```
function updateLayout(innerDiv: HTMLElement, outerDiv: HTMLElement) {
  const scrollHeight = parseInt(innerDiv.style.height);
  overrideProp(outerDiv, "scrollHeight", scrollHeight);

  const clientHeight = parseInt(outerDiv.style.height);
  overrideProp(outerDiv, "clientHeight", clientHeight);
}
```

At last, scrolling works. I can write assertions that validate the expected items are in the DOM after scrolling down. The first few items in the list have been removed and newly visible items have been added.

```
  expect(screen.queryByText('header')).toBeNull()
  expect(screen.queryByText('Item 1')).toBeNull()
  expect(screen.queryByText('Item 2')).toBeNull()

  const item12= screen.getByText('Item 12');
  expect(item12).toBeInTheDocument()
  expect(item12).toHaveProperty("style.top", '360px')
  expect(item12).toHaveProperty("style.height", '30px')
```

# Scroll End

There's one last piece of the scrolling story to implement. I also need to send a `scrollend` event. jsdom supports the `scrollend` event but React Testing Library doesn't have a `fireevent.scrollend` convenience method. I need to use the lower level `fireevent` function instead and construct the event object myself.

```
  function fireEventScrollEnd(element: HTMLElement) {
    fireEvent(element, new UIEvent('scrollend', {
      bubbles: false,
      cancelable: false,
    }));
  }

  {act(() => {
    fireEvent.scroll(outerDiv, { target: { scrollTop: 120 }});
    fireEventScrollEnd(outerDiv);
  })}
```

Here I've chosen to simulate the case where React [batches the state changes](https://react.dev/learn/queueing-a-series-of-state-updates) caused by both events before rendering. It's just as easy to simulate the other case where it renders after each event. I can test both to make sure I'm not reliant on internal React behavior that may change.

# Ending Point

I added another test case that runs the same tests with variable size items with`useIsScrolling` enabled and renders after each event. That should cover all of the major features I have implemented. 

{% include candid-image.html src="/assets/images/coverage/coverage-end.png" alt="Coverage Ending Point" %}

That looks a lot healthier. I have high coverage of lines and statements but there's still work to do on branches. Many of those are edge cases, such as early outs for invalid arguments. They should be easy to address.

The last big thing I'm missing is coverage of my fallback timeout implementation if `scrollend` isn't implemented or goes missing.

{% include candid-image.html src="/assets/images/coverage/timeout-fallback.png" alt="No coverage of fallback timeout for scrollend" %}

Which raises the question, how do you handle time in unit tests? We'll look at that next time. 
