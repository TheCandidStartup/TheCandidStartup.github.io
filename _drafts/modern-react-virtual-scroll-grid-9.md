---
title: >
    Modern React Virtual Scroll Grid 9 : Fixing SlickGrid
tags: frontend
---

[Last time]({% link _drafts/modern-react-virtual-scroll-grid-8.md %}) we integrated SlickGrid's paged scrolling system and found that it came *really close* to working well. 

Close isn't good enough. Fortunately, I have to plan to fix it. 

# The Problem

{% include candid-image.html src="/assets/images/frontend/slick-grid-virtual-pages.svg" alt="SlickGrid Virtual Pages" %}

SlickGrid works by dividing the full sized grid into multiple pages and arranging them so they fit into the smaller container space. The pages have to overlap to fit. The magic is in how movements of the scroll bar are interpreted either as small scale movements within a page or large scale movements that select the page to use. 

The problem we found, particularly with very large grids with many pages, is that the second (green) and penultimate (red) page are too close to the ends of the container. Close enough that the browser thinks that you're about to scroll or render off the ends. That leads to janky behavior for the end user. They're think they're looking at items a long way from the end of the list but find that they can't scroll up, or can't scroll certain items to the top of the viewport or find that the scroll bar seems to "stick" as they scroll to the bottom of the list. 

# The Solution

{% include candid-image.html src="/assets/images/frontend/slick-grid-fixed-virtual-pages.svg" alt="Fixing SlickGrid's Virtual Pages" %}

The solution is pretty simple. The first and last page need to be aligned with the ends of the container so that you get the correct browser behavior near the start and end of the list. We have flexibility in how we arrange the rest of the pages. They need to be in order and spaced evenly across most of the range of the scroll bar. Rather than overlapping with the first and last page, we can arrange the interior pages *between* the first and last page. 

This ensures that the interior pages are well away from the ends of the container. Each page is much bigger than the possible size of the viewport.

Scrolling near the start and end of the scroll bar's range feels entirely normal as there's a 1:1 mapping between grid space and container space for the start and end pages. That does mean that the remaining pages are crammed into less of the scroll bar's range. However, page size is chosen so that 100 pages fit into the container. That means the remaining pages are still spread across 98% of the scroll bar's range. 

# The Implementation

All of the paged scrolling code is isolated in the `useVirtualScroll` custom hook. I was able to make the changes I needed without any change to the hook's interface. 

## Page to Render Offset

The first change was to the code that calculates the per page render offset, which positions the page within the container. The original implementation was simple: a one liner to define a scale factor and another one liner (used repeatedly) to calculate the offset.

```
  const scaleFactor = (totalSize - renderSize) / (numPages - 1);

  const renderOffset = Math.round(page * scaleFactor);
```

The new implementation has separate logic for the first page, last page and interior pages. I put it in a nested function for ease of reuse.

```
  function pageToRenderOffset(page: number): number {
    if (page <= 0)
      return 0;

    if (page >= numPages-1)
      return totalSize - renderSize;

    return Math.round((page-1) * (totalSize - renderSize) / (numPages - 3));
  }

  const renderOffset = pageToRenderOffset(page);
```

The logic for the interior pages is worth a second look. It needs to generate render offsets that position the interior pages so that page 1 has no offset (it starts at the same position in grid space and container space), and page `numPages-2` has an offset that moves it from `totalSize-pageSize` in grid space to `renderSize-pageSize` in container space. The other pages are spaced evenly between these two extremes.

If you shift the interior pages up (subtract 1), so that the range `1 -> numPages-2` becomes `0 -> numPages-3`, it reduces down to the simple scale factor you see in the code. 

## Large Scale Scrolling

The only other change required was to the code that handles large scale scrolling. It uses the scroll bar position to determine which page to select. It took me a while to work out what the original implementation was doing.

```
  if (newOffset < pageSize) {
    newPage = 0;
  } else {
    newPage = Math.min(numPages - 1, Math.floor(newOffset * 
      ((totalSize - clientExtent) / (renderSize - clientExtent)) * (1 / pageSize)));
  }
```

It has to take into account the size of the scroll bar thumb (`clientExtent`) to determine the valid range of the scroll bar. It can then map an offset within that range to an equivalent offset in container space, and from there determine the corresponding page.

The new implementation again has separate logic for the first page, last page and interior pages.

```
  if (newOffset < pageSize) {
    newPage = 0;
  } else if (newOffset >= renderSize - pageSize) {
    newPage = numPages - 1;
  } else {
    const scaleFactor = (totalSize - pageSize*2) / (renderSize - pageSize*2);
    newPage = Math.min(numPages - 3, 
      Math.floor((newOffset - pageSize) * scaleFactor / pageSize)) + 1;
  }
```

This separation has the side effect of removing any dependency on thumb size. The unavailable part of the scroll bar range covered by the thumb is always within the last page, so we don't have to account for it in the logic for the interior pages. We just need to map an offset within `pageSize -> renderSize-pageSize` to an offset within `pageSize -> totalSize-pageSize`. We again use the trick of shifting everything up by a page so that the expression reduces to a simple scale factor.

# The Demo

I started with the same two sample apps as last time.

## Functional Testing

First, the "functional" test with a hacked control. There's a list with 100 items mapped into a container half the size, divided into 10 pages.

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-9a/index.html" width="100%" height="fit-content" %}

Compared with last time, the stickiness when dragging the scroll right to the end has gone. ScrollToItem works perfectly for items 87, 88 and 89. However, if you click on an item and use the arrow keys to scroll through the list, the way the scroll bar jumps backwards seems more pronounced. 

That's to be expected as we're overlapping the interior pages more, which means further for the scroll bar to jump. The effect is exaggerated because we've only got 10 pages. It should be negligible when we do the real thing with 100 pages. 

## Trillion Row List

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-9b/index.html" width="100%" height="fit-content" %}

The problems are fixed for the trillion row sample too. That includes the problem with scrolling backwards using the arrow keys around multiples of 2000 items (across page boundaries). As expected, the jump in scroll bar is barely noticeable.

I noticed one other change in behavior. There's no scaling up of the scroll bar movement in the first and last page. That results in an "ease in, ease out" kind of feel when dragging the bar from top to bottom, which I quite like. 

## Trillion<sup>2</sup> Grid

That all worked so well that I put together a trillion row by trillion column grid sample. Enjoy!

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-9c/index.html" width="100%" height="fit-content" %}

# Unit Tests

As ever, once the fun stops, we need to make sure the new functionality is covered by our unit tests. 

Keeping `useVirtualScroll` as logic only really paid off. It was very easy to test the logic at the custom hook level, including all the combinations of first page, last page, interior pages; small scale scrolling, large scale scrolling; forwards and backwards.

I had one line of code to test at the component level. Making sure that a small scale scroll across the page boundary resulted in the scroll bar being moved backwards. Having to mock the browser's `scrollTo` method together with the resulting scroll events was really painful. This is a case where some form of browser based end to end testing would really have been beneficial. 

I did get back to 100% test coverage, but I had to cheat. My `scrollTo` implementation looks like this:

```
  scrollTo(offset: number): void {
    const outer = outerRef.current;
    if (outer)
      outer.scrollTo(0, doScrollTo(offset, outer.clientHeight));
  }
```

I'm accessing the outer div via a React ref. The ref is initially null and then gets initialized properly once the component has rendered. TypeScript quite rightly points out that `outerRef.current` has a type of `HTMLDivElement | null`. However, the `scrollTo` method is only accessible after the component has rendered, so the ref should never be null when `scrollTo` is called.

What should I do? I put in an explicit null check to keep Typescript happy and guard against any possible weird edge case. However, there's no way of writing a reasonable unit test that hits that case, so there goes my 100% coverage. 

Alternatively, I could write `outer = outerRef.current as HTMLDivElement` to tell Typescript that it can never be null. Then I can get rid of the null check. However, am I really sure there's no lurking edge case that I'm unaware of? I don't want to write riskier code just to get 100% coverage.

There is a third option. Istanbul lets you [add comments](https://github.com/istanbuljs/nyc#parsing-hints-ignoring-lines) to identify lines of code that it should ignore for coverage purposes. I can keep my belt and braces code without having to review the false positive every time I look at coverage. So, I added a `/* istanbul ignore else */` comment to ignore the else side of the if statement.

{% capture note %}
The Vite documentation has a [warning](https://vitest.dev/guide/coverage.html#ignoring-code) that comments in TypeScript are stripped away by esbuild before Istanbul gets a chance to see them. This is another instance of out of date documentation. Vite can now use SWC for development builds which doesn't have this problem. 
{% endcapture %}
{% include candid-note.html content=note %}