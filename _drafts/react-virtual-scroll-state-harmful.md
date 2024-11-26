---
title: >
  React Virtual Scroll : State Considered Harmful
tags: react-virtual-scroll
---

[Last time]({% link _posts/2024-11-25-react-spreadsheet-decoupled-rendering.md %}), I was tearing my hair out because I'd broken the core paged virtual scrolling functionality in the big [0.6.0 update]({% link _posts/2024-11-18-react-virtual-scroll-0-6-x.md %}).

I was expecting to add a few console logging statements, have a face palm moment as the obvious flaw in the control flow revealed itself, put in a quick fix and move on.

I ended up needing a lot more logging statements to find a deeply buried and subtle problem. 

# Bidirectional Synchronization

I need to synchronize bidirectionally between the scroll bar position in the DOM and state in React. When the user moves the scroll bar, I receive a scroll event and update React state. When the user gives focus to a cell in my spreadsheet, I update React state to make it visible and call `scrollTo` on the scroll bar to make it match. 

Calling `scrollTo` results in a scroll event. If you're not careful you can end up going round and round. My scroll event handler checks to see whether the React state already matches the scroll bar position and ignores the event if it does. 

# Internal Synchronization

There's also some synchronization deep within the `VirtualScroll` component. [Paged virtual scrolling]({% link _posts/2024-04-22-modern-react-virtual-scroll-grid-8.md %}) allows you to use the limited range of a scrollable HTML container element to scroll over a far larger virtualized grid. It does this by dividing grid space into pages which are overlapped in container space.

{% include candid-image.html src="/assets/images/frontend/slick-grid-virtual-pages.svg" alt="Paged Virtual Scrolling" %}

A consequence of this approach is that when you scroll from one page to another you need to move the scroll bar back slightly. Now you have a scroll event which causes an update to React state which in turn means adjusting the scroll bar position which raises another scroll event which we ignore.

# Virtual Scroll Hook

Internally `VirtualScroll` uses two instances of the `useVirtualScroll` hook to manage paged scrolling in each dimension. The hook keeps track of the paged scrolling state and provides an `onScroll` event handler and a `doScrollTo` function. The functions update the internal state as needed and return the expected DOM scroll bar position to `VirtualScroll`, which updates the scroll bar.

```ts
export function useVirtualScroll(totalSize: number, maxCssSize, minNumberPages) {
  // Determine number and size of pages
  ...

  const initValue: ScrollState = { 
    scrollOffset: 0, 
    renderOffset: 0,
    page: 0,
    scrollDirection: "forward",
  };
  const [scrollState, setScrollState] = useState(initValue);

  function onScroll(clientExtent: number, scrollExtent: number, scrollOffset: number): {
    if (scrollState.scrollOffset == scrollOffset) {
      // No need to change state if scroll position unchanged
      return [scrollOffset, scrollState];
    }

    // Compare scrollState.scrollOffset and scrollOffset to determine whether small or large
    // scale scrolling is needed. Return updated scroll bar position in retScrollOffset
    ...

    setScrollState(newScrollState);
    return [retScrollOffset, newScrollState];
  }

  function doScrollTo(offset: number, clientExtent: number) {
    // Determine page and offset within page for new scroll state
    // Return offset to apply to scroll bar
    ...

    setScrollState(newScrollState);
    return newScrollState.scrollOffset;
  }

  return {...scrollState, renderSize, onScroll, doScrollTo} as const;
}
```

Can you see the problem yet?

# Event Ordering

My first thought was that there could be a problem with event ordering. Consider the case where the user holds down the arrow key in my spreadsheet. They're generating a stream of key down events. Each event moves the focus cell, which in turn scrolls the grid, which results in a scroll event being raised. If another key down is handled before the scroll event is delivered, then the early out check in `onScroll` will fail. The grid has already been scrolled further over. We'll end up handling the event and scrolling the grid back to the previous point.

That's not what's happening. In all the scenarios I checked, the scroll event is delivered before any other event. Even if it was delayed it wouldn't explain what I'm seeing. In some scenarios the scroll position jumps forward rather than back. In addition, any discrepancy would be transient. Eventually the scroll event from the final key down will get delivered and the scroll bar position moved back where it should be.

# State and Rendering

It's easy to fall into the trap of thinking that state is just a fancy wrapper around a JavaScript variable. However, [state is a snapshot](https://react.dev/learn/state-as-a-snapshot). Whatever changes you make to state don't take effect until the next render. The idea is that your event handlers always deal with a consistent snapshot of state equivalent to the state of the DOM that the user sees.

{% include candid-image.html src="/assets/images/frontend/react-state-as-snapshot.svg" alt="React State as a Snapshot" %}

Think of the state of your UI as a sequence of frames in a film, with each render creating a new frame. Each frame is immutable once rendered. Changes triggered by events create a new state for the next frame and then render the UI to match. Or to be more concrete:
1. A scroll event is delivered
2. We compare the current scroll position to the position when last rendered
3. If different change our state
4. We possibly adjust the scroll bar position to match the updated state
5. Which adds another scroll event to the event queue
5. React triggers a render as the state has changed
6. And we go round again

Can you see the problem now? 

# React 18 Scroll Event Priority

It took me a while too. It all became clear once I added console logging to the `VirtualScroll` render function. The `useVirtualScroll` code assumes that React will always render between `onScroll` changing the state and the delivery of the next scroll event.

That used to be the case. It all changed when I switched to the new React 18 rendering API. As we've [previously seen]({% link _posts/2023-11-13-react-virtual-scroll-grid-2.md %}), scroll events are lower priority in React 18. React may defer processing of a scroll event to a callback which runs after the browser has painted.

{% include candid-image.html src="/assets/images/react-virtual-scroll/react-18-dependent-scroll-events.png" alt="Dependent Scroll Events Profile" %}

This is a performance profile captured when manually scrolling from one virtual page to another, triggering a second dependent scroll event. The `onScroll` function handling the first event updates state and calls `scrollTo`. Previous versions of React would render before returning to the event loop. 

As this is a scroll event, React 18 schedules a callback to render later. The browser delivers the pending scroll event before invoking the callback. The second time through, the `onScroll` handler reads stale state and interprets the scroll event relative to the wrong virtual page, leading to a jump backwards.

# Effects

My first thought was to use an effect to adjust the scroll bar position. That would ensure it happened after React rendered. However, I was nervous of introducing an even longer interval between cause and effect. 

I also had other broken scenarios to look at, including one where my spreadsheet already uses an effect to synchronize the scroll bar position. This scenario changes the `DisplayGrid` offset in response to a key event that makes a new focus cell visible. The spreadsheet component uses an effect that calls `scrollTo` on `VirtualScrollProxy` to position the scroll bar to match the grid offset.

{% include candid-image.html src="/assets/images/react-virtual-scroll/effect-update-state-and-scroll.png" alt="Dependent Scroll Events Profile" %}

The work is delegated to the virtual scroll hook's `doScrollTo` function. It determines the virtual page and offset we need to scroll to, updates the hook's scroll state and calls `scrollTo` on the HTML container element. 

As I'm using a regular effect, the render is deferred and the browser delivers the dependent scroll event first. Once again the `onScroll` handler reads stale state and interprets the scroll event relative to the wrong virtual page.

# Layout Effect

I could force React to render immediately after the effect is processed by using a layout effect rather than a regular effect. [Layout effects](https://react.dev/reference/react/useLayoutEffect) render any state changes made by the effect, possibly triggering further effects and renders, until done. 

Layout effects can make your app feel less responsive as they block the browser from repainting and prevent React from batching work more widely. In this case, they work against React's attempts to prioritize events. 

It feels like a band aid. 

# State Considered Harmful

The root cause of my problems is the use of state to track the last position of the scroll bar. The snapshot semantics of state aren't useful here. I want to capture the scroll bar position on each scroll event so that I can compare it against the current position on the next scroll event. 

The React rule of thumb is that you use state for data that rendering depends on that is independent of the component's props. `VirtualScroll` rendering clearly depends on the position of the scroll bar.

Decoupling made the situation clearer for me. The current scroll state is doing two different jobs. It defines the offset within the scrollable area that needs to be passed to the `VirtualScroll` children when rendering, as well as the internal state needed to keep track of the scroll bar's last position. 

One needs the rendering state snapshot semantics, the other doesn't. 

# Decoupling Internal State from "State"

The solution is to split the existing state into a new `totalOffset` state value and an internal `RefObject<ScrollState>`. `VirtualScroll` rendering works entirely off the total offset, so this change simplifies the `VirtualScroll` code. The `ScrollState` object is now used purely for keeping track of the last scroll position and virtual page.

```ts
export function useVirtualScroll(totalSize: number, maxCssSize, minNumberPages) {
  // Determine number and size of pages
  ...

  const initValue: ScrollState = { 
    scrollOffset: 0, 
    renderOffset: 0,
    page: 0,
    scrollDirection: "forward",
  };
  const [totalOffset, setTotalOffset] = useState<number>(0);
  const scrollState = useRef(initValue);

  function onScroll(clientExtent: number, scrollExtent: number, scrollOffset: number): {
    const currState = scrollState.current;
    if (currState.scrollOffset == scrollOffset) {
      // No need to change state if scroll position unchanged
      return [scrollOffset, currState];
    }

    // Compare currState.scrollOffset and scrollOffset to determine whether small or large
    // scale scrolling is needed. Return updated scroll bar position in retScrollOffset
    ...

    scrollState.current = newScrollState;
    setTotalOffset(newScrollState.scrollOffset + newScrollState.renderOffset);
    return [retScrollOffset, newScrollState];
  }

  function doScrollTo(offset: number, clientExtent: number) {
    // Determine page and offset within page for new scroll state
    // Return offset to apply to scroll bar
    ...

    scrollState.current = newScrollState;
    setTotalOffset(newScrollState.scrollOffset + newScrollState.renderOffset);
    return newScrollState.scrollOffset;
  }

  function getCurrentOffset() {
    const currState = scrollState.current;
    return currState.scrollOffset + currState.renderOffset;
  }

  return {totalOffset, renderSize, onScroll, doScrollTo, 
    getCurrentOffset, scrollState} as const;
}
```

Note the duplication. The total offset state is a copy of the internal `scrollOffset + renderOffset`. The same information is needed for two different jobs with different semantics. 

I've added another helper function, `getCurrentOffset`, which returns the current live offset for imperative use cases. This is equivalent to using a ref to an HTML element to query `scrollTop`.

The previous version of `useVirtualScroll` returned all the `ScrollState` properties to `VirtualScroll` by inlining all the individual properties into the returned object. They're no longer needed and can now be considered internal only implementation details. To avoid future confusion I removed them. 

An hour later I had to add them back as the `useVirtualScroll` unit test depends on them. However, I now return the ref as a single property that makes it clear that these are for internal/advanced use.

# Who needs State?

The `totalOffset` state is needed to implement the `VirtualScroll` contract with its children. `VirtualScroll` provides `verticalOffset` and `horizontalOffset`, along with `isScrolling`, when it renders the children. 

The `isScrolling` property is optional. Toggling the value on start and end of scrolling triggers additional renders. In a feature inherited from `react-window`, it can be disabled using the `useIsScrolling` prop.

Which got me thinking. My `VirtualSpreadsheet` component doesn't use `isScrolling`. It doesn't use `verticalOffset` and `horizontalOffset` either. The grid row and column offset state is lifted up so that the same state can be passed as props to the main `DisplayGrid` and the row and column `DisplayList` headers. This state is updated using the `VirtualScroll` `onScroll` callback. 

I added a `useOffsets` prop so that `VirtualSpreadsheet` can disable updates to `totalOffset`. The effect that synchronizes the scroll bar position with the grid offset no longer updates any state, so no additional render is triggered. 

# Premature Optimization

* `VirtualScrollProxy` now provides access to live offset
* Added so that I could optimize effect in react spreadsheet's `VirtualSpreadsheet` so that it doesn't try to update scroll bar position if already correct
* Didn't make any noticeable difference to performance but it did break auto-extension of the spreadsheet when you scroll to the end and keep dragging on the scroll bar
* Spreadsheet auto-extends by one row when you hit the end but doesn't keep extending
* Problem is that increasing the size of the spreadsheet increases the size of the `VirtualScroll` scrollable area, which changes how the virtual pages are laid out.
* Once the `VirtualScroll` has been rendered with the new size, the internal state and scroll bar position are incorrect. The scroll bar should be moved back a little from the end due to the increase in size, with `renderOffset` slightly larger so that the overall `totalOffset` remains the same. 
* Sorts itself out on next scroll event or call to `scrollTo`.
* The "unnecessary" effect conveniently sorts it out
* Refs are normal mutable JavaScript objects so there's nothing stopping me from updating my internal `ScrollState` and adjusting the scroll bar position during `VirtualScroll` rendering. However, React assumes that component render functions are [pure](https://react.dev/learn/keeping-components-pure) and explicitly [warns you](https://react.dev/reference/react/useRef) against reading or writing refs in a render function.
* The right way to do this is with an effect. There isn't enough context in `useVirtualScroll` for a nice self contained implementation. 
* Would end up adding more code and complexity to `useVirtualScroll` and `VirtualScroll` so that I can add more code and complexity to `VirtualSpreadsheet` to achieve the same end result as leaving things as they are.
* I decided to leave things as they are.

# Lessons Learned

* Think much more deeply about when something should be stored as state rather than a ref
* React 18 more likely to catch you out if you get it wrong
* Rule of thumb for state is now data that render depends on + needs to persistent across multiple renders + valid to read from last rendered snapshot
* If necessary have two copies of data, one as state for render and snapshot, one as ref for current value

# Try It!

* Fixed `react-virtual-scroll` published as [version 0.6.2](https://www.npmjs.com/package/@candidstartup/react-virtual-scroll/v/0.6.2)
* Rebuilt spreadsheet sample and added the `useOffsets={false}` prop

{% include candid-iframe.html src="/assets/dist/react-spreadsheet-state-harmful/index.html" width="100%" height="fit-content" %}

* As far as I can tell all problems are now fixed

# Next Time

* Concerned that it took two weeks before I noticed this problem
* Find myself doing lots of manual testing with spreadsheet sample to be confident I haven't broken anything
* Clear sign that I don't have enough automated testing
* Existing unit tests using `jsdom` aren't cutting it. Having to mock event behavior when the root cause of recent problems has been real life event behavior in the browser.
* Time to add some more tooling
