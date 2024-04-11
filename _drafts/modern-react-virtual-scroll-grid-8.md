---
title: >
    Modern React Virtual Scroll Grid 8 : Unlimited Power!
tags: frontend
---

{% capture rvs4_url %}{% link _posts/2023-11-27-react-virtual-scroll-grid-4.md %}{% endcapture %}
I started on this journey when I [couldn't find]({% link _posts/2023-12-04-react-virtual-scroll-grid-5.md %}) an existing grid control that supports millions of rows *and* columns. Now I'm finally ready to integrate [SlickGrid's paged scrolling system]({{ rvs4_url | append: "#slickgrid" }}). SlickGrid supports a virtually unlimited number of rows.

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

Our grid has `scrollTo` and `scrollToItem` methods that update `scrollTop` and let the scroll event handler deal with it from there. 

That won't work with paged scrolling. Unless the item is at the top of a page, the event handler will pick the wrong page. We need a way to set both the current page and scroll position relative to that page. 

# Virtual Scroll Custom Hook Interface

Here's what the current interface to `useVirtualScroll` looks like.

```
export type ScrollDirection = "forward" | "backward";
export interface ScrollState { 
  scrollOffset: number, 
  scrollDirection: ScrollDirection, 
};

export function useVirtualScroll() {
  ...
  function onScroll(clientExtent: number, scrollExtent: number, scrollOffset: number) {}

  return [scrollState, onScroll] as const;
}
```

Clearly we're going to need some changes. The state needs additional properties to track the current page. Page offsets depend on the size of the grid so we need to pass that in somehow. As well as `OnScroll`, we'll need to return a function to help handle `ScrollTo`. 

There's also a more significant change. Somehow, `OnScroll` needs the ability to change the scroll position. Currently, `useVirtualScroll` provides just the virtual scrolling logic. It leaves direct interaction with HTML elements to the owning component. Either we need some way of asking the component to change the scroll position or we need to make `useVirtualScroll` directly dependent on the HTML container element. 

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
  onScroll(clientExtent: number, scrollExtent: number, scrollOffset: number): number;
  doScrollTo(offset: number, clientExtent: number): number;
};

export function useVirtualScroll(totalSize: number): VirtualScroll;
```

I've added the current page and the corresponding rendering offset to the state. The size of the grid is now passed to `useVirtualScroll` as the `totalSize` prop. The hook returns everything the owning component needs in a single `VirtualScroll` object. This includes all the state properties together with `renderSize`, the size needed for the container element. This isn't included in the state as it's a pure derivative of `totalSize`. 

The `onScroll` function now returns an updated scroll offset. I decided to keep `useVirtualScroll` as logic only. If the return value is different from the `scrollOffset` value passed in, the component needs to update the scroll bar position. 

There's also `doScrollTo` which implements the logic needed for `scrollTo`. The inputs are an offset in "grid space" and the viewport height. `scrollToItem` can be implemented using `scrollTo` so I don't have to worry about that. `doScrollTo` returns the scroll offset that the component should use to update the scroll bar position.

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

The paged scrolling implementation in SlickGrid is contained within a [6000 line source file](https://github.com/6pac/SlickGrid/blob/master/src/slick.grid.ts). Luckily, the paged scrolling part is only around 50 lines of code, spread over four locations. The easiest way to find it is to search for "cj" within the source file. Unfortunately, there are few meaningful comments while variable names are only one to two characters long. 

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

The critical decision is whether paging is needed at all. If the total size of the grid is small enough there's no paging needed. We define the derivative props to use a single page spanning the container. Everything will behave as before.

If the size is too large, we setup for paging. SlickGrid has some complicated code that tries to dynamically determine the size at which a container would break. Unless the browser is Firefox, where the dynamic code doesn't work, in which a hardcoded limit of six million pixels is used.

I prefer the simplicity of using the same limit for all browsers. I don't want to chase after obscure bugs caused by subtle differences in behavior. A six million pixel container should be plenty. Each page is sixty thousand pixels so there are at least 100 pages. Even on the highest resolution monitor it will take a lot of scrolling before you get to a page boundary. 

The `scaleFactor` variable (called `cj` in the SlickGrid code) is used to calculate the rendering offset for each page.

## doScrollTo

The implementation of `doScrollTo` is simple enough.

```
  function doScrollTo(offset: number, clientExtent: number) {
    const safeOffset = Math.min(totalSize - clientExtent, Math.max(offset, 0));
    const scrollDirection = (scrollState.scrollOffset + scrollState.renderOffset)
                            <= safeOffset ? 'forward' : 'backward';
    const page = Math.min(numPages - 1, Math.floor(safeOffset / pageSize));
    const renderOffset = Math.round(page * scaleFactor);
    const scrollOffset = safeOffset - renderOffset;

    setScrollState({ scrollOffset, renderOffset, page, scrollDirection });
    return scrollOffset;
  }
```

The `ScrollTo` methods can be called directly by the client so the first step is to ensure the desired offset is in the valid range. Ultimately the offset will be used to set `scrollTop` for the scroll bar. The thumb of the scroll bar takes up some space, with a size that represents the viewport height, hence the upper valid limit of `totalSize - clientExtent`. 

Next, divide by `pageSize` to determine which page to use. Finally, the real magic. Multiply the page index by `scaleFactor` to get the rendering offset to use. There's lots of ways you could try to position the pages in container space. This is the simplest approach. A linear scale factor which ensures that the first page is at the top of the container, the last page ends at the bottom of the container and all the other pages are spaced evenly in between. 

Finally, we update the state and return the scroll offset that the calling component should set `scrollTop` to. That will position the scroll bar to match the state and send a scroll event. In this case, our `onScroll` handler will ignore the event as the scroll bar position and state are already in sync.

## onScroll

Now we get to the complicated bit. We start with an early out if nothing has changed. As in `doScrollTo` we ensure the offset is valid (some browsers like to play games with animated scroll effects) and calculate the scroll direction. Note that `scrollOffset` is in container space rather than grid space. 

```
  function onScroll(clientExtent: number, scrollExtent: number, scrollOffset: number) {
    if (scrollState.scrollOffset == scrollOffset) {
      return scrollOffset;
    }

    let newOffset = Math.max(0, Math.min(scrollOffset, scrollExtent - clientExtent));
    const newScrollDirection = scrollState.scrollOffset <= newOffset 
      ? 'forward' : 'backward';

    let newPage, newRenderOffset;
    let retScrollOffset = scrollOffset;
    const scrollDist = Math.abs(newOffset - scrollState.scrollOffset);
    if (scrollDist < clientExtent) {
      newPage = Math.min(numPages - 1,
        Math.floor((scrollOffset + scrollState.renderOffset) / pageSize));
      newRenderOffset = Math.round(newPage * scaleFactor);
      if (newPage != scrollState.page) {
        newOffset = scrollOffset + scrollState.renderOffset - newRenderOffset;
        retScrollOffset = newOffset;
      }
    } else {
      if (renderSize === clientExtent) {
        newPage = 0;
      } else {
        newPage = Math.min(numPages - 1, Math.floor(newOffset * 
          ((totalSize - clientExtent) / (renderSize - clientExtent)) * (1 / pageSize)));
      }
      newRenderOffset = Math.round(newPage * scaleFactor);
    }

    setScrollState({ scrollOffset: newOffset, renderOffset: newRenderOffset, 
      page: newPage, scrollDirection: newScrollDirection });
    return retScrollOffset;
  }
```

Next, we choose between two separate implementations depending on whether we're scrolling less than the viewport height or more. For small scale scrolling we convert the offset to grid space using the current page's `renderOffset` and then see whether we've crossed the boundary to a new page. If so, we convert back to container space using the new page's `renderOffset`, and make sure we return the updated offset to our caller so they can change the scroll bar position to match. 

The code is careful to ensure that the `scrollOffset` returned is different from the one passed in only when small scale scrolling to a new page. 

The other side of the branch implements the metaphorical page rolodex. It divides the valid range of the scroll bar into pages in container space and then sees which page the current `scrollOffset` selects.

I spent a long time staring at this code, trying to work out whether it made sense. I even traced the code all the way back to the [commit](https://github.com/mleibman/SlickGrid/commit/33781134ba140827957aa5975279f2570cd74a69) which added paged scrolling to SlickGrid. The only additional color provide by the commit comment is "MASSIVE PITA!!!!!!!!". 

In the end I realized that it's using a scale factor that maps the largest valid `scrollTop` in container space to the equivalent offset in grid space. The point is to ensure that if you drag the scroll bar all the way to the end of its range, you end up choosing the last page and rendering the last items in the grid. If you're not careful, with very large grids, you might otherwise end up selecting a page a few before the end. 

# Functional Testing

The code is integrated. I vaguely understand what it's trying to do. Now to find out if it works. I could have created a test app with a million rows and had a play. However, at that kind of scale it's hard to understand what's going on. Each page contains twenty thousand items. I'd be scrolling a long time before I reached a page boundary. It's not practical to scroll through the entire list in detail.

Instead I kept my existing 100 item test app and hacked my `useVirtualScroll` implementation to enable paging for containers larger than 1500, half the size of my grid, with a total of 10 pages. Each page is a little bigger than the height of the viewport. I can scroll through the entire list in detail, crossing page boundaries frequently. The fewer pages I have, the more noticeable the jump in scroll bar position during small scale scrolling.

Give it a try. I wonder if you'll notice the same things I did. 

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-8a/index.html" width="100%" height="fit-content" %}

It seems functional, if a little janky. I can drag the scroll bar from top to bottom and see the entire list. If you do it slowly enough you can see the scroll bar jumping around as you cross page boundaries. If you drag it quickly, activating the large scale scroll behavior, it behaves more naturally. However, it feels somewhat sticky as you get close to the bottom. You think you've got to the bottom and then find you need to keep pulling the scroll bar down.

If you focus on the content and use the arrow keys you can step roughly an item at a time through the whole list. You can use "Scroll To Item" to jump to any item in the list. However, something weird happens for items 87, 88 and 89. Item 86 appears at the top of the viewport instead. Even weirder, if you focus on the item and then use the arrow keys to scroll manually, you can get those items to the top. 

It took me a while to work out what the problem was. Have another look at the diagram showing how pages are laid out in container space.

{% include candid-image.html src="/assets/images/frontend/slick-grid-virtual-pages.svg" alt="SlickGrid Virtual Pages" %}

Items 87, 88 and 89 are the last items on the penultimate page (the red one in the diagram). Pages are spaced evenly from top to bottom of the container. The penultimate page ends up being placed 5 items up from the bottom of the container. As far as the browser is concerned, I'm trying to scroll beyond the valid range for the scroll bar and it clamps the scroll offset at item 86. 

The rendering logic is to position items using the offset defined by the first rendered item's page. However, when a page boundary is in view, you end up using that offset for the top items on the next page. Ordinarily, that wouldn't be a problem. In this case, with the page being positioned so close to the bottom of the container, it means that the last items rendered are positioned beyond the end of the container. 

The browser handles this by extending the size of the region being scrolled over. That's why scrolling manually works. The valid scroll range is now bigger so you can scroll down, which extends the range again. That's why scrolling feels sticky close to the bottom. 

I also noticed a more minor problem. If you scroll to item 50 at the center of the list, the scroll bar isn't quite in the middle of its range. Using the browser debugging tools you can see that `scrollTop` is at 676 rather than 750. If you scroll to item 49, the scroll bar is too far the other way at 814. 

Once again the diagram explains what's going on. Item 49 and 50 are on different pages in the middle of the list. Imagine that item 49 is the last item on the green page and item 50 is the top item on the red page. The overlapping layout means that item 50 is before the center of the container and item 49 after it. 

The effect is amplified by using only 10 pages. For a real large scale grid with at least a 100 pages, the error is at most 1%. Should be barely noticeable. 

# Ultimate Power!

Talking of real large scale grids, it's time to go the other way. I've found bugs I might not have noticed by looking at a small scale example. Now let's see what we find by going super large. I reverted my hacked-in changes to `useVirtualScroll` and changed the sample app to include more rows. Lots more rows. I started at a million and kept making it bigger.

Try it out, if you feel you can handle the ultimate power of a trillion rows. That's 1,000,000,000,000.

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-8b/index.html" width="100%" height="fit-content" %}

It actually works. You can scroll from item 1 all the way to item 999,999,999,999. 

The same problems I saw with the small scale example are also here, now that I know where to look. Each page contains 20,000 items. That puts the end of the penultimate page at item 999,999,979,999. Scroll to it and you'll see that it appears at the bottom of the viewport instead of the top.

There are so many pages that there's very little space from one to the next. Actually, there's 50 million pages, which means that there's 8 pages for every pixel in the container. The penultimate page is on top of the final page, right up against the bottom of the container. 

Which leads to a new problem at the top end of the container. Scroll to item 20,000. Focus on the items and use the arrow keys to scroll up and down across the boundary between the first and second page. 

You get stuck. You can't scroll back up past item 19999. The second page is positioned on top of the first, right at the top of the container. The browser thinks you're trying to scroll up from the top of the container so prevents you from moving at all. 

There is some good news. Scroll to the middle of the list, items 500,000,000,000 and 499,999,999,999. You'll see that the scroll bar is very close to the center of it's range, with only a small jump as you move between the two items. Setting the scroll bar to the exact center of its range brings up item 500,020,000,966. An error of about 0.4%.

# Conclusion

The SlickGrid code is *really close* to working well. When used with large scale grids, I suspect most people don't notice the problems. At least not enough to fix it in SlickGrid. The algorithm hasn't changed since it was introduced in 2010. 

Is it good enough for me? Now I know, I don't think I can let it rest. I do have a plan for how to improve matters. I'll tell you about it, next time. 