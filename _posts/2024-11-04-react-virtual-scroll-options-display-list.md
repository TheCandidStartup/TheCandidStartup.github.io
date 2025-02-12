---
title: >
  React Virtual Scroll : Scroll Options and Display List
tags: react-virtual-scroll
---

It's time for more enhancements to `react-virtual-scroll` driven by [requirements]({% link _posts/2024-10-28-react-spreadsheet-event-handling.md %}) from  [`react-spreadsheet`]({% link _topics/react-spreadsheet.md %}). If that seems a bit dull, don't worry, things get wild by the time we reach the end. 

# Scroll Options

Whenever you change the focused cell, the grid should scroll as needed to ensure that it's visible. We want to apply the minimal scroll needed to bring the cell entirely into view. If you're using arrow keys to move the focus cell to the right, the grid should scroll only when you move it out of the viewport and then only to scroll by the single column needed to bring it back into view.

## API Change

I added an optional `ScrollToOption` parameter. Two values are supported. The default, `topleft`, works the same way as before, scrolling the cell to the top left corner of the viewport. The new option, `visible`, performs the minimal scroll needed to make the cell visible. If the cell is already fully visible, it doesn't scroll at all. 

```ts
export type ScrollToOption = 'topleft' | 'visible';

export interface VirtualListProxy {
  scrollToItem(index: number, option?: ScrollToOption): void;
}

export interface VirtualGridProxy {
  scrollToItem(rowIndex?: number, columnIndex?: number, option?: ScrollToOption): void;
}
```

## Implementation

There's a common implementation in `VirtualCommon.ts` shared by `VirtualGrid` and `VirtualList`. The `getOffsetToScroll` utility function works out the scroll needed in a single dimension. 

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

It's straightforward apart from dealing with the case where the item is bigger than the viewport. I decided that it was most important that the start of the item is visible. 

Here's how `getOffsetToScroll` is used in `VirtualGrid`

```ts
function scrollToItem(rowIndex?: number, columnIndex?: number, option?: ScrollToOption): void {
  ...
  const rowOffset = getOffsetToScroll(rowIndex, rowOffsetMapping, outer.clientHeight, scrollRowOffset + renderRowOffset, option);
  const colOffset = getOffsetToScroll(columnIndex, columnOffsetMapping, outer.clientWidth, scrollColumnOffset + renderColumnOffset, option);
  this.scrollTo(rowOffset, colOffset);
}
```

And here's `VirtualList`

```ts
function scrollToItem(index: number, option?: ScrollToOption): void {
  ...
  const extent = isVertical ? outer.clientHeight : outer.clientWidth;
  const offset = getOffsetToScroll(index, itemOffsetMapping, extent, scrollOffset + renderOffset, option);
  if (offset != undefined)
    this.scrollTo(offset);
}
```

## Unit Tests

I ran into a couple of gotchas while updating the unit tests. Described here as a reminder not to make the same stupid mistakes again. 

First, I originally used the `toBeCalledWith` assertion to check that the grid's `scrollTo` mock was called with the correct values when I used `scrollToItem`. This assertion succeeds if any previous call to the mocked function has the specified values. I should have used `lastCalledWith` to check only the most recent call.

```
      proxy = ref.current || throwErr("null ref");
      {act(() => { proxy.scrollToItem(42); })}
      expect(mock).lastCalledWith(0, 42*30);
```

Second, remember that `ref.current` can change every time you render, which happens every time you use `act` at each step of a test. You have to grab the current value of the proxy at each step or you end up calling `scrollToItem` on a proxy with an out of date closure. Which is hilarious to debug.

# Display List

I should have stopped there. But then I thought I'd try one more thing while I'm working in here.

I've [previously]({% link _posts/2024-10-14-react-spreadsheet-selection-focus.md %}) [mentioned]({% link _posts/2024-10-28-react-spreadsheet-event-handling.md %}) problems caused by [my hack]({% link _posts/2024-07-01-react-virtual-scroll-0-4-0.md %}) of using `VirtualList` for spreadsheet row and column headers. There's lots of extra complexity including paged scrolling, event listeners for active scroll detection, having to send scroll events to synchronize grid and headers, valid offsets being limited by the range of the scroll bar. None of which is needed because I hide the scroll bar.

You can see the complexity introduced by the current approach in the Chrome profiler. 

{% include candid-image.html src="/assets/images/react-virtual-scroll/spreadsheet-sample-perf-render.png" alt="Rendering a single frame" %}

The event loop has to deal with three scroll events per frame. In this instance, the browser waits for all three events to be processed before painting. However, if the browser decided to paint between events you'd see occasional stale data as you scrolled. That wouldn't normally be a problem but these controls are virtualized. There's blank space around the visible data in the viewport. Scroll that and paint it without re-rendering and you'll see empty space until the next frame.

Which actually happens. Try the demo from [last time]({% link _posts/2024-10-28-react-spreadsheet-event-handling.md %}). It's easiest to see when using the mouse wheel vigorously. If you get it just right you can also make the grid go blank for a few seconds when using the scroll bar.

{% include candid-iframe.html src="/assets/dist/react-spreadsheet-event-handling/index.html" width="100%" height="fit-content" %}

It would all be much cleaner if I had a simple [controlled component](https://legacy.reactjs.org/docs/forms.html#controlled-components) list. I can pass in the render offset as a prop. No need to send extra events. 

## API

I added a new `DisplayList` component.

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

The API is equivalent to `VirtualList` except that scroll related APIs are gone and replaced by the `offset` prop.

## Implementation

The complexity of paged virtual scrolling in `VirtualList` led to an approach where each item used absolute positioning with explicit `top`, `left`, `width` and `height` properties. Every item has a unique style. Item styles also need updating for all items whenever the render page changes.

That leads to complex rendering code with heavyweight JSX output. Removing scrolling gives us the opportunity to use a much lighter weight implementation. There are three principles that we're trying to follow.

1. Minimize changes to the DOM caused by small changes to the component. In our case, there will be lots of small changes to `offset`.
2. Only use inline styles for anything dependent on props or crucial for correct functionality. Primarily layout and size of items in the list.
3. Minimize the number of different styles and how often they need to be changed.

The component keeps the familiar outer viewport container and inner content container structure. The inner container is sized to match the visible items from the list. The inner container is positioned within the outer container based on the difference between the offset prop and the start offset for the visible items. Typically that results in the inner container being shifted up by the fractional part of an item. 

{% include candid-image.html src="/assets/images/react-virtual-scroll/display-list-structure.svg" alt="Display List Structure" %}

Items within the inner container use the CSS grid layout style. This allows us to avoid almost all per item styling. All that's left is setting `boxSizing` to `border-box`. It's important to ensure that items always have the expected size and don't overflow the grid if they have borders or padding. 

The style is the same for all items. I considered leaving it up to the style sheet to set. In the end I stuck with the principles of inlining functionality critical stuff. At least I only need to create the style once and can use the same instance on all items.

{% raw %}

```tsx
const boxStyle: React.CSSProperties = { boxSizing: 'border-box' };

export function DisplayList(props: DisplayListProps) {
  const { width, height, itemCount, itemOffsetMapping, className, innerClassName, 
    offset, children, itemData, itemKey = defaultItemKey, layout = 'vertical', 
    outerRender = defaultContainerRender, innerRender = defaultContainerRender } = props;

  const isVertical = layout === 'vertical';

  const [startIndex, startOffset, sizes] = getRangeToRender(itemCount, itemOffsetMapping, 
    isVertical ? height : width, renderOffset);
  const renderSize = sizes.reduce((accum,current) => accum + current, 0);
  const template = getGridTemplate(sizes);
  const renderOffset = startOffset - offset;

  const ChildVar = children;

  return (
   <Container className={className} render={outerRender}
        style={{ position: "relative", height, width, overflow: "hidden", willChange: "transform" }}>
       <Container className={innerClassName} render={innerRender}
        style={{ position: 'absolute',
          display: 'grid',
          gridTemplateColumns: isVertical ? undefined : template,
          gridTemplateRows: isVertical ? template : undefined,
          top: isVertical ? renderOffset : 0, 
          left: isVertical ? 0 : renderOffset, 
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

This is much simpler than `VirtualList`. The [far too clever]({% link _posts/2024-02-19-modern-react-virtual-scroll-grid-4.md %}) JSX has gone. There's no refs, state, hooks or handles. 

The only tricky bit is the `getGridTemplate` helper function which converts an array of item sizes into the format expected by CSS grid template properties. 

## Unit Tests

I added `VirtualCommon.test.ts` so that I could directly test `getGridTemplate`.

```ts
  expect(getGridTemplate([ 10, 20, 30, 30, 40 ])).toBe("10px 20px repeat(2,30px) 40px")
```

The `DisplayList` tests are simpler than `VirtualList` because I didn't have to mock up scrolling and layout. However, there are more edge cases to check as the offset prop is not constrained in the same way as a scroll offset. It's perfectly legal to have a negative offset or an offset that goes off the end of the list. Whatever items are visible (if any) need to be correctly positioned and the rest left blank.

# Results

I updated `VirtualSpreadsheet` to use `ScrollToItem` and `visible` whenever the focus cell changes. I replaced `VirtualList` with `DisplayList`, removing all the `VirtualList` related hacks. You can see the difference in the performance profile. 

{% include candid-image.html src="/assets/images/react-virtual-scroll/spreadsheet-sample-perf-displaylist.png" alt="Rendering a single frame" %}

Everything happens in the scope of a single incoming scroll event. One render for grid and headers. No way for the browser to insert a paint in the middle. 

# Try It!

Select something then use the arrow keys to zoom around the spreadsheet

{% include candid-iframe.html src="/assets/dist/react-virtual-scroll-0-6-0/index.html" width="100%" height="fit-content" %}

There's only one problem. The scroll related rendering glitches are still there. 

How is that possible? We receive the scroll event, render everything and update the DOM before the browser paints.

# Next Time

We'll do a deep dive [next time]({% link _posts/2024-11-11-react-glitchy-virtual-scroll.md %}).
