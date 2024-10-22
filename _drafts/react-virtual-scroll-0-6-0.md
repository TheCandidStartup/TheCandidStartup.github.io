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
* Occasionally see glitches when scrolling around spreadsheet (particularly when using mouse wheel), some or all of grid content dropping out

## Principles

* Minimize changes to DOM for small changes to component (in particular small changes in offset)
* Use inline styles for anything dependent on props or crucial for correct functionality. Primarily layout and size of items in the list.
* Minimize number of different styles and how often they need to be changed.

## API

* Added new `DisplayList` component

```ts
export interface DisplayListProps {
  children: DisplayListItem,
  className?: string,
  innerClassName?: string,
  height: number,
  width: number,
  itemCount: number,

  offset: number,

  itemData?: unknown,
  itemOffsetMapping: ItemOffsetMapping,
  itemKey?: (index: number, data: unknown) => React.Key,
  layout?: ScrollLayout,
  outerRender?: DisplayContainerRender;
  innerRender?: DisplayContainerRender;
}

export function DisplayList(props: DisplayListProps);
```

* Equivalent API to `VirtualList` except that scroll related APIs are gone and replaced by the `offset` prop

## Implementation

* The complexity of paged virtual scrolling in `VirtualList` led to an approach where each item used absolute positioning with explicit `top`, `left`, `width` and `height` properties. Every item has a unique style. Item styles also need updating for all items whenever the render page changes.
* Leads to complex rendering code with heavyweight JSX output.
* Removing scrolling gives us the opportunity to use a much lighter weight implementation
* Have the familiar outer and inner container internal structure
* The inner container is sized to match the visible items from the list
* The inner container is positioned within the outer container based on the difference between the offset prop and the start offset for the visible items. Typically that results in the inner container being shifted to the left by the fractional part of an item. 

* IMAGE

* Items within the inner container use the CSS grid layout style. This allows us to avoid almost all per item styling. All that's left is setting `boxSizing` to `border-box`. Important to ensure that items always have the expected size and don't overflow the grid if they have borders or padding.
* Style is the same for all items so considered leaving it up to the style sheet to set. In the end followed principles of inlining functionality critical stuff. 
* Small optimization - create style once and use same instance on all items. 

{% raw %}

```tsx
const boxStyle: React.CSSProperties = { boxSizing: 'border-box' };

export function DisplayList(props: DisplayListProps) {
  const { width, height, itemCount, itemOffsetMapping, className, innerClassName, 
    offset: renderOffset, children, itemData, itemKey = defaultItemKey, layout = 'vertical', 
    outerRender = defaultContainerRender, innerRender = defaultContainerRender } = props;

  const isVertical = layout === 'vertical';

  const [startIndex, startOffset, sizes] = getRangeToRender(itemCount, itemOffsetMapping, 
    isVertical ? height : width, renderOffset);
  const renderSize = sizes.reduce((accum,current) => accum + current, 0);
  const template = getGridTemplate(sizes);
  const offset = startOffset - renderOffset;

  const ChildVar = children;

  return (
   <Container className={className} render={outerRender}
        style={{ position: "relative", height, width, overflow: "hidden", willChange: "transform" }}>
       <Container className={innerClassName} render={innerRender}
        style={{ position: 'absolute',
          display: 'grid',
          gridTemplateColumns: isVertical ? undefined : template,
          gridTemplateRows: isVertical ? template : undefined,
          top: isVertical ? offset : 0, 
          left: isVertical ? 0 : offset, 
          height: isVertical ? renderSize : "100%", 
          width: isVertical ? "100%" : renderSize }}>
        {sizes.map((_size, arrayIndex) => (
          <ChildVar data={itemData} key={itemKey(startIndex + arrayIndex, itemData)} 
            index={startIndex + arrayIndex} style={boxStyle}/>
        ))}
      </Container>
    </Container>
  );
}
```

{% endraw %}

* Implementation is much simpler than `VirtualList`.
* No need for far too clever JSX
* No refs, state or hooks
* Only tricky bit is the `getGridTemplate` helper function which converts an array of item sizes into the format expected by CSS grid template properties. 

## Unit Tests

* Added `VirtualCommon.test.ts` so that I could directly test `getGridTemplate`

```ts
  expect(getGridTemplate([ 10, 20, 30, 30, 40 ])).toBe("10px 20px repeat(2,30px) 40px")
```

* Tests simpler because I didn't have to mock up scrolling and layout
* Tests more complex because offset not constrained in same way as a scroll offset
* Perfectly legal to have a negative offset or an offset that goes off the end of the list
* Whatever items are visible (if any) need to be correctly positioned and the rest left blank
* Added unit tests for all the edge cases and updated `getRangeToRender` to handle them

# Results

* Updated `VirtualSpreadsheet` to use `ScrollToItem` and `visible` whenever focus cell changes
* Replaced `VirtualList` with `DisplayList` removing `VirtualList` related hacks

{% include candid-image.html src="/assets/images/react-virtual-scroll/spreadsheet-sample-perf-displaylist.png" alt="Rendering a single frame" %}

* Everything happens in scope of incoming scroll event. One render for grid and headers. Browser can't insert paint in the middle. 

# Try It!

* Select something then use the arrow keys to zoom around the spreadsheet

{% include candid-iframe.html src="/assets/dist/react-virtual-scroll-0-6-0/index.html" width="100%" height="fit-content" %}

# Glitch

* There's only one problem. The glitches are still there.
* How is that possible? We receive the scroll event, render everything and update the DOM before the browser paints.
* We'll do a deep dive next time.
