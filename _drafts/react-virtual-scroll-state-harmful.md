---
title: >
  React Virtual Scroll : React State Considered Harmful
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

  return {...scrollState, renderSize, onScroll, scrollTo} as const;
}
```

Can you see the problem yet?

# Event Ordering

My first thought was that there could be a problem with event ordering. Consider the case where the user holds down the arrow key in my spreadsheet. They're generating a stream of key down events. Each event moves the focus cell, which in turn scrolls the grid, which results in a scroll event being raised. If another key down is handled before the scroll event is delivered, then the early out check in `onScroll` will fail. The grid has already been scrolled further over. We'll end up handling the event and scrolling the grid back to the previous point.

That's not what is happening. In all the scenarios I checked, the scroll event is delivered before any other event. Even if it was delayed it wouldn't explain what I'm seeing. In some scenarios the scroll position jumps forward rather than back. In addition, any discrepancy would be transient. Eventually the scroll event from the final key down will get delivered and the scroll bar position moved back where it should be.

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

* Can use a layout effect instead of a regular effect
* Forces React to render any state changes immediately, possibly triggering further effects and renders until done
* Not recommended for performance reasons
* Feels like something of a band aid

# State Considered Harmful

* The root cause is my use of state to track last position of scroll bar
* Use state for data that render depends on and that needs to persistent across multiple renders
* `VirtualScroll` rendering clearly depends on the logical offset into the grid defined by scroll state. With the previous implementation it depended on the physical scroll offset and corresponding render page. Clearly needs to be state.
* Decoupling helps make the situation clearer.
* Scroll state is doing two different jobs. There's the rendering dependent state that needs snapshot, and the record of the last scroll bar position which would work much better if it was always up to date.

# Lessons Learned

* Think much more deeply about when something should be stored as state rather than a ref
* React 18 more likely to catch you out if you get it wrong
* Rule of thumb for state is now data that render depends on + needs to persistent across multiple renders + valid to read from last rendered snapshot
* If necessary have two copies of data, one as state for render and snapshot, one as ref for current value
