---
title: >
  React Virtual Scroll 0.6.0 : Scroll Options and Display List
tags: react-virtual-scroll
---

wise words

* Requirements from `react-spreadsheet`


# Scroll Options

* Want grid to scroll whenever you change focus cell to ensure it's visible
* Should apply the minimal scroll needed to bring cell entirely into view
* If you're using arrow keys to move focus cell to right, should scroll only when you move it out of the viewport and then only to scroll by the single column needed to bring back into view.

## API Change

```ts
/**
 * Option for {@link VirtualGridProxy.scrollToItem} and {@link VirtualListProxy.scrollToItem}
 * 
 * * `topleft` scrolls the item as far to the top and left as possible
 * * `visible` scrolls the item the minimum amount needed to ensure that it's visible
 * 
 *  @defaultValue `topleft`
 */
export type ScrollToOption = 'topleft' | 'visible';

export interface VirtualListProxy {
  scrollToItem(index: number, option?: ScrollToOption): void;
}

export interface VirtualGridProxy {
  scrollToItem(rowIndex?: number, columnIndex?: number, option?: ScrollToOption): void;
}
```

## Implementation

* Shared implementation in `VirtualCommon.ts` shared by `VirtualGrid` and `VirtualList`

```ts
export function getOffsetToScroll(index: number | undefined, itemOffsetMapping: ItemOffsetMapping, 
  clientExtent: number, scrollOffset: number, option?: ScrollToOption): number | undefined
{
  if (index === undefined)
    return undefined;

  const itemOffset = itemOffsetMapping.itemOffset(index);
  if (option != 'visible')
    return itemOffset;

  // Start of item offscreen before start of viewport?
  if (itemOffset < scrollOffset)
    return itemOffset;

  // Already completely visible?
  const itemSize = itemOffsetMapping.itemSize(index);
  const endOffset = itemOffset + itemSize;
  const endViewport = scrollOffset + clientExtent;
  if (endOffset <= endViewport)
    return undefined;

  // Item offscreen past end of viewport

  // Item bigger than viewport? Make sure start is in view
  if (itemSize > clientExtent)
    return itemOffset;

  // Scroll so end of item aligns with end of viewport
  return itemOffset - clientExtent + itemSize;
 }
```

Here's how it's used in `VirtualGrid`

```ts
scrollToItem(rowIndex?: number, columnIndex?: number, option?: ScrollToOption): void {
  ...
  const rowOffset = getOffsetToScroll(rowIndex, rowOffsetMapping, outer.clientHeight, scrollRowOffset + renderRowOffset, option);
  const colOffset = getOffsetToScroll(columnIndex, columnOffsetMapping, outer.clientWidth, scrollColumnOffset + renderColumnOffset, option);
  this.scrollTo(rowOffset, colOffset);
}
```

And here's `VirtualList`

```ts
scrollToItem(index: number, option?: ScrollToOption): void {
  ...
  const extent = isVertical ? outer.clientHeight : outer.clientWidth;
  const offset = getOffsetToScroll(index, itemOffsetMapping, extent, scrollOffset + renderOffset, option);
  if (offset != undefined)
    this.scrollTo(offset);
}
```

## Unit Tests

* Use `lastCalledWith` rather than `toBeCalledWith` when writing unit tests with a series of calls to mocks. `toBeCalledWith` succeeds when any of the calls has the expected value.

```
      proxy = ref.current || throwErr("null ref");
      {act(() => { proxy.scrollToItem(42); })}
      expect(mock).lastCalledWith(0, 42*30);
```

* Remember that `ref.current` can change every time you render which is triggered by `act` at each step of test. Need to grab proxy at each step or end up calling `scrollToItem` on a proxy with an out of date closure.

# Display List

* While I'm working in here ...
* Mentioned the hackiness of using `VirtualList` for spreadsheet row and column headers a couple of times
* Lots of complexity including paged scrolling, active scroll detection, having to send scroll events to synchronize grid and headers ...
* Allowed offsets limited by range of scroll bar. Needed to add dummy items.
* Then I go and hide the scroll bar
* Much cleaner to have a simple controlled component
  * Pass render offset as a prop, no need to send extra events
  * Rip out `useVirtualScroll`, `useIsScrolling` hooks
  * No need for `VirtualListProxy` as imperative scroll method replaced by `offset` prop

* Can see the complexity of the current approach 

{% include candid-image.html src="/assets/images/react-virtual-scroll/spreadsheet-sample-perf-render.png" alt="Rendering a single frame" %}

* The render is triggered by a scroll event which results in two additional scroll events that have to be processed before the frame is rendered
* If browser decides to paint between the events rather than waiting until the end we'll be in trouble
* Occasionally see glitches when scrolling around spreadsheet, some or all of grid content dropping out

## API

## Implementation

## Unit Tests

# Results

* Updated `VirtualSpreadsheet` to use `ScrollToItem` and `visible` whenever focus cell changes
* Replaced `VirtualList` with `DisplayList` removing `VirtualList` related hacks

{% include candid-image.html src="/assets/images/react-virtual-scroll/spreadsheet-sample-perf-displaylist.png" alt="Rendering a single frame" %}

* Everything happens in scope of incoming scroll event. One render for grid and headers. Browser can't insert paint in the middle. 

# Try It!

# Glitch

* There's only one problem. The glitches are still there.
* Chrome performance tool captures screen shots while profiling and I found a smoking gun
* I hacked the sample so that I include row numbers in both the header and the grid
* Screenshots are tiny so I increased the text size massively. You can just about see what's happening when I scale the screenshot up.

{% include candid-image.html src="/assets/images/react-virtual-scroll/spreadsheet-perf-scroll-capture.png" alt="Bad frame captured while scrolling" %}

* The row numbers are repeated in column C
* You can see that the row header and the grid aren't aligned
* The header is showing rows 2-11 and the grid is showing 5-12 with a blank row at the end
* Using logs of the rows being rendered for each frame it looks like it's displaying content rendered from the previous frame with the scroll offset from the current frame.
* How is that possible? We receive the scroll event, render everything and update the DOM before the browser paints.
* We'll do a deep dive next time.