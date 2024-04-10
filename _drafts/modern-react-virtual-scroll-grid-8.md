---
title: >
    Modern React Virtual Scroll Grid 8 : Unlimited Power!
tags: frontend
---

{% capture rvs4_url %}{% link _posts/2023-11-27-react-virtual-scroll-grid-4.md %}{% endcapture %}
I started on this journey when I [couldn't find]({% link _posts/2023-12-04-react-virtual-scroll-grid-5.md %}) an existing grid control that supports millions of rows *and* columns. Now I'm finally ready to integrate [SlickGrid's paged scrolling system]({{ rvs4_url | append: "#slickgrid" }}). That supports a virtually unlimited number of rows.

I've structured my code base so that virtual scrolling in a single dimension is implemented in the `useVirtualScroll` custom hook. `VirtualList` uses one instance of `useVirtualScroll` for vertical scrolling. `VirtualGrid` uses two instances for vertical and horizontal scrolling. In theory, I can enhance `useVirtualScroll` to use paged scrolling and end up with a grid that supports virtually unlimited numbers of rows and columns. 

# Paged Scrolling

Most controls have a limit on the number of rows and columns they support because browsers have a limit on the size of an HTML element. Depending on the browser used, the limit can vary between 6 million and 33 million pixels. With an item height of 30 pixels, that gives a limit that can be as low as two hundred thousand rows. Grid items tend to be wider than they are tall, so the column limit will be less.

SlickGrid gets round the limit using a really clever idea. Virtual scrolling implementations work by only rendering items in the visible viewport. Viewports can be at most a few thousand pixels high, nowhere near the element size limit. Instead of making a container element big enough for all the items in the grid, SlickGrid dynamically adjusts where the rendered items are placed, allowing it to use a smaller container.

{% include candid-image.html src="/assets/images/frontend/slick-grid-virtual-pages.svg" alt="SlickGrid Virtual Pages" %}

SlickGrid divides "grid space" into fixed size pages, each much larger than the viewport. Each page has an offset that positions it in container space. The pages overlap and are evenly spaced in the container. To render the visible items, determine which page contains `scrollTop` and render the items with that page's offset. 

# On Scroll

If the pages overlap, there can be multiple pages that contain `scrollTop`. How do you decide what to render? 

SlickGrid keeps track of the current page in its state. You render using the current page's offset. The current page is updated in the scroll event handler. For small scroll offsets, less than the size of the viewport, it scrolls within the current page, letting the user move from row to row. For large scroll offsets, larger than the size of the viewport, it jumps from page to page, like flicking through a rolodex. 

If you continue scrolling from row to row, with small offsets, you will eventually reach the boundary with the next page. At this point SlickGrid has to switch to a new page. As the pages overlap, that involves a jump backwards in container space. That in turn means that the scroll event handler needs to move `scrollTop` backwards to match. 

# Scroll To

Our grid has `scrollTo` and `scrollToItem` methods that update the scroll position and let the scroll event handler deal with it from there. 

That won't work with paged scrolling. Unless the item is at the top of a page, the event handler will pick the wrong page. We need a way to set both the current page and scroll position relative to that page. 

# Virtual Scroll Custom Hook Interface

Here's what the current interface to `useVirtualScroll` looks like.

```
export type ScrollDirection = "forward" | "backward";
export interface ScrollState { 
  scrollOffset: number, 
  renderOffset: number,
  page: number, 
  scrollDirection: ScrollDirection, 
};

export function useVirtualScroll() {
  ...
  function onScroll(clientExtent: number, scrollExtent: number, scrollOffset: number) {}

  return [scrollState, onScroll] as const;
}
```

Clearly we're going to need some changes. The state needs additional properties to track the current page. Page offsets depend on the size of the grid so we need to pass that in somehow. As well as `OnScroll` we'll need to return a function to help handle `ScrollTo`. 

There's a more significant change. Somehow, `OnScroll` needs the ability to change the scroll position. Currently, `useVirtualScroll` provides just the virtual scrolling logic. It leaves direct interaction with HTML elements to the owning component. Either we need some way of asking the component to change the scroll position or make `useVirtualScroll` directly dependent on the HTML container element. 

Finally, this is all getting complex enough that it would be best to declare the interface explicitly rather than letting TypeScript infer it from the implementation. Here's what I came up with.

```
export type ScrollDirection = "forward" | "backward";
export interface ScrollState { 
  scrollOffset: number, 
  renderOffset: number,
  page: number, 
  scrollDirection: ScrollDirection, 
};

export interface VirtualScroll extends ScrollState {
  renderSize: number;

  // Returns updated scrollOffset to apply to scroll bar if changed 
  onScroll(clientExtent: number, scrollExtent: number, scrollOffset: number): number;

  // Scroll to offset in logical space returning offset to update scroll bar position to
  doScrollTo(offset: number, clientExtent: number): number;
};

export function useVirtualScroll(totalSize: number): VirtualScroll;
```

I've added the current page and the corresponding rendering offset to the state. The size of the grid is now passed to `useVirtualScroll` as the `totalSize` prop. The hook returns everything the owning component needs in a single `VirtualScroll` object. This includes all the state properties together with `renderSize`, the size needed for the container element. This isn't included in the state as it's a pure derivative of `totalSize`. 

The `onScroll` function now returns an updated scroll offset. I decided to keep `useVirtualScroll` as logic only. If the return value is different from the `scrollOffset` value passed in, the component needs to update the scroll bar position. 

There's also `doScrollTo` which implements the logic needed for `scrollTo`. `scrollToItem` can be implemented using `scrollTo` so I don't have to worry about that. `doScrollTo` returns the offset the component should use to update the scroll bar position.

# Virtual List Integration

Here's how `useVirtualScroll` is currently integrated into `VirtualList`.

```
  const [{ scrollOffset }, onScrollExtent] = useVirtualScroll();

  React.useImperativeHandle(ref, () => {
    return {
      scrollTo(offset: number): void {
        outerRef.current?.scrollTo(0, offset);
      },
    }
  }, [ itemOffsetMapping ]);

  function onScroll(event: ScrollEvent) {
    const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
    onScrollExtent(clientHeight, scrollHeight, scrollTop);
  }

  const [startIndex, startOffset, sizes] = 
    getRangeToRender(itemCount, itemOffsetMapping, height, scrollOffset);
```

and here's the updated integration

```
  const { scrollOffset, renderOffset, renderSize, onScroll: onScrollExtent, doScrollTo } = 
    useVirtualScroll(totalSize);

  React.useImperativeHandle(ref, () => {
    return {
      scrollTo(offset: number): void {
        outerRef.current?.scrollTo(0, doScrollTo(offset, outerRef.current?.clientHeight));
      },
    }
  }, [ itemOffsetMapping ]);

  function onScroll(event: ScrollEvent) {
    const { clientHeight, scrollHeight, scrollTop, scrollLeft } = event.currentTarget;
    const newScrollTop = onScrollExtent(clientHeight, scrollHeight, scrollTop);
    if (newScrollTop != scrollTop && outerRef.current)
      outerRef.current.scrollTo(scrollLeft, newScrollTop);
  }

  const [startIndex, startOffset, sizes] = 
    getRangeToRender(itemCount, itemOffsetMapping, height, scrollOffset+renderOffset);
```

Not too different. Mostly minor changes to the existing lines of code. The only significant change is to `onScroll` where I needed two additional lines of code to update the scroll position if required. 

`VirtualGrid` was just as easy to update. 

# Implementation

The paged scrolling implementation in SlickGrid is contained within a [6000 line source file](https://github.com/6pac/SlickGrid/blob/master/src/slick.grid.ts). Luckily, the paged scrolling part is only around 50 lines of code at four locations. The easiest way to find it is to search for "cj" within the source file. Unfortunately, there are few meaningful comments and variable names that only one to two characters long. 

I extracted the relevant code, made the variable names more meaningful and integrated it into [`useVirtualScroll.ts`](https://github.com/TheCandidStartup/react-virtual-scroll-grid/blob/398183774c1cf6bbdfdd2d6f896c7d1239718579/src/useVirtualScroll.ts). Let's look at the `useVirtualScroll`, `doScrollTo` and `onScroll` functions separately.

## useVirtualScroll

```
const MAX_SUPPORTED_CSS_SIZE = 6000000;
const MIN_NUMBER_PAGES = 100;

export function useVirtualScroll(totalSize: number): VirtualScroll {
  let renderSize=0, pageSize=0, numPages=0, scaleFactor=0;
  if (totalSize < MAX_SUPPORTED_CSS_SIZE) {
    // No paging needed
    renderSize = pageSize = totalSize;
    numPages = 1;
    scaleFactor = 0;
  } else {
    // Break into pages
    renderSize = MAX_SUPPORTED_CSS_SIZE;
    pageSize = renderSize / MIN_NUMBER_PAGES;
    numPages = Math.floor(totalSize / pageSize);
    scaleFactor = (totalSize - renderSize) / (numPages - 1);
  }

  const [scrollState, setScrollState] = useState(initValue);
  return {...scrollState, renderSize, onScroll, doScrollTo} as const;
}
```

There's not much left in `useVirtualScroll` once you split out the `doScrollTo` and `onScroll` definitions. We setup some derivative props based on the `totalSize` input prop, declare state and return what's relevant to our caller. 

The critical decision is whether paging is needed at all. If the total size of the container is small enough there's no paging needed. We define the derivative props to use a single page spanning the container. Everything will behave as before.

If the container is too large, we setup for paging. SlickGrid has some complicated code that tries to dynamically determine the size at which a container would break. Unless the browser is Firefox, where the dynamic code doesn't work, in which a hardcoded limit of six million pixels is used.

I prefer the simplicity of using the same limit for all browsers. I don't want to chase after obscure bugs caused by subtle differences in behavior. A six million pixel container should be plenty. Each page is sixty thousand pixels so there are at least 100 pages. Even on the highest resolution monitor it will take a lot of scrolling before you get to a page boundary. 

## doScrollTo

```
  function doScrollTo(offset: number, clientExtent: number) {
    const safeOffset = Math.min(totalSize - clientExtent, Math.max(offset, 0));
    const scrollDirection = (scrollState.scrollOffset + scrollState.renderOffset) <= safeOffset ? 'forward' : 'backward';
    const page = Math.min(numPages - 1, Math.floor(safeOffset / pageSize));
    const renderOffset = Math.round(page * scaleFactor);
    const scrollOffset = safeOffset - renderOffset;

    setScrollState({ scrollOffset, renderOffset, page, scrollDirection });
    return scrollOffset;
  }
```

## onScroll

```
  function onScroll(clientExtent: number, scrollExtent: number, scrollOffset: number) {
    if (scrollState.scrollOffset == scrollOffset) {
      // No need to change state if scroll position unchanged
      return scrollOffset;
    }

    // Prevent Safari's elastic scrolling from causing visual shaking when scrolling past bounds.
    let newOffset = Math.max(0, Math.min(scrollOffset, scrollExtent - clientExtent));
    const newScrollDirection = scrollState.scrollOffset <= newOffset ? 'forward' : 'backward';

    // Switch pages if needed
    let newPage, newRenderOffset;
    let retScrollOffset = scrollOffset;
    const scrollDist = Math.abs(newOffset - scrollState.scrollOffset);
    if (scrollDist < clientExtent) {
      // Scrolling part of visible window, don't want to skip items, so can't scale up movement
      // If we cross page boundary we need to reset scroll bar position back to where it should be at start of page
      newPage = Math.min(numPages - 1, Math.floor((scrollOffset + scrollState.renderOffset) / pageSize));
      newRenderOffset = Math.round(newPage * scaleFactor);
      if (newPage != scrollState.page) {
        // Be very intentional about when we ask caller to reset scroll bar
        // Don't want to trigger event loops
        newOffset = scrollOffset + scrollState.renderOffset - newRenderOffset;
        retScrollOffset = newOffset;
      }
    } else {
      // Large scale scrolling, choosing page from a rolodex
      if (renderSize === clientExtent) {
        newPage = 0;
      } else {
        newPage = Math.min(numPages - 1, Math.floor(newOffset * ((totalSize - clientExtent) / (renderSize - clientExtent)) * (1 / pageSize)));
      }
      newRenderOffset = Math.round(newPage * scaleFactor);
    }

    setScrollState({ scrollOffset: newOffset, renderOffset: newRenderOffset, page: newPage, scrollDirection: newScrollDirection });
    return retScrollOffset;
  }
```

# Small Scale Testing

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-8a/index.html" width="100%" height="fit-content" %}

* `ScrollTo` item near end of penultimate page
  * Items 87-89? on small scale 100 item test
  * Page is positioned very near to the bottom of the container, then physically can't scroll down far enough to get item at top
* Manual scroll does let you scroll 89 to top of window but response to cursor drag feels strange, like multiple page crossings
  * Looking at rendered elements in debugger tools, the last few items are positioned off the end of the inner container which in turn changes the extent you can scroll to
* `ScrollTo` middle item, physical scroll position a little before the center of the scroll bar
  * Set `scrollTop` to center of scroll bar, item displayed is a few after the middle item
  * Page layout has tops of pages evenly spread from 0 to containerSize-pageSize, so position of center biased towards top


# Ultimate Power!

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-8b/index.html" width="100%" height="fit-content" %}

* At very large number of rows (trillions) once you do small scale scroll from first to second page can no longer scroll back
  * Scale factor so large that first two pages are positioned on top of each other right against top of container
  * Can't physically scroll up as you're at top
* If you `ScrollTo` item vs manipulate `scrollTop` to get the same item in view, end up with scroll bar in slightly different positions
  * The SlickGrid code uses slightly different expressions for calculating current page in each case
  * Has to make sure that dragging scrollbar to end of range of motion (containerSize-clientSize) will result in last page being selected
