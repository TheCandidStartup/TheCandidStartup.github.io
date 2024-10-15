---
title: >
  React Virtual Scroll 0.6.0 : Scroll To Item Options
tags: react-virtual-scroll
---

wise words

* Requirement from `react-spreadsheet`
* Want grid to scroll whenever you change focus cell to ensure it's visible
* Should apply the minimal scroll needed to bring cell entirely into view
* If you're using arrow keys to move focus cell to right, should scroll only when you move it out of the viewport and then only to scroll by the single column needed to bring back into view.

# API Change

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

# Implementation

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

# Unit Tests

* Use `lastCalledWith` rather than `toBeCalledWith` when writing unit tests with a series of calls to mocks. `toBeCalledWith` succeeds when any of the calls has the expected value.

```
      proxy = ref.current || throwErr("null ref");
      {act(() => { proxy.scrollToItem(42); })}
      expect(mock).lastCalledWith(0, 42*30);
```

* Remember that `ref.current` can change every time you render which is triggered by `act` at each step of test. Need to grab proxy at each step or end up calling `scrollToItem` on a proxy with an out of date closure.