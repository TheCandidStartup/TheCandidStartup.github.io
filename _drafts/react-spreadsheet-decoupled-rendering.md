---
title: >
  React Spreadsheet: Decoupled Rendering
tags: react-spreadsheet
---

wise words

* Major restructure of `react-virtual-scroll`
* What did I need to change to get spreadsheet running again?
* Nothing - spreadsheet sample app works fine. Cells flashing on and off while scrolling fixed.

# Unit Tests

* Only change I needed was to the unit test. Use of `AutoSizer` makes `VirtualGrid` dependent on layout which jsdom doesn't do.
* Needed to add some mocking

```ts
  stubProperty(HTMLElement.prototype, "clientWidth", 585);
  stubProperty(HTMLElement.prototype, "clientHeight", 225);
```

# React 18 Rendering

* Removed legacy rendering and switched to the new React 18 rendering API. 
* Just like `react-virtual-scroll` samples, rendering of cells while scrolling continues to work well. 

# Glitchy Focus Sink

* Still suffering from some glitchy rendering
* Set focus on a cell near the end, scroll to the start, then scroll slowly down towards the end
* See focus sink flashing on and off
* Focus sink is added as a customization on the `VirtualGrid` outer render
* Problem is that it was built for traditional virtual scrolling
* Positioned within the scrollable area and responding to browser scrolling
* Need to move it to where the grid content is
* Don't want to use `VirtualGrid` inner render as throwing in another child will disturb the grid layout
* Ideal place is the `DisplayGrid` outer render

# Decoupling

* This is an advanced customization scenario
* Intent is that I should decouple `VirtualGrid` into it's constituent `VirtualScroll` + `AutoSizer` + `DisplayGrid` if I want more control
* Let's see how well that works out.

```tsx
<VirtualScroll
  className={theme?.VirtualSpreadsheet_Grid}
  outerRender={outerGridRender}
  ref={scrollRef}
  onScroll={onScroll}
  height={props.height}
  width={props.width}
  scrollHeight={rowOffset}
  scrollWidth={columnOffset}
  maxCssSize={props.maxCssSize}
  minNumPages={props.minNumPages}>
  {(_) => (
    <AutoSizer style={{ height: '100%', width: '100%' }}>
    {({height,width}) => (
      <DisplayGrid
        rowOffset={gridRowOffset}
        columnOffset={gridColumnOffset}
        height={height}
        width={width}
        itemData={cellRender}
        rowCount={rowCount}
        rowOffsetMapping={rowMapping}
        columnCount={columnCount}
        columnOffsetMapping={columnMapping}>
        {Cell}
      </DisplayGrid>
    )}
    </AutoSizer>
  )}
</VirtualScroll>
```

* Expanding the JSX is simple enough. Mostly a case of figuring out whether a prop needs to be set on `VirtualScroll` or `DisplayGrid`
* Have my own state for grid scroll position (`gridRowOffset` and `gridColumnOffset`) so can use that directly rather relying on the props passed by `VirtualScroll` child render prop.
* Already feels cleaner having header and grid offsets both set directly from my own state.

# Virtual Grid Proxy

* Biggest problem is that I have to take a ref to `VirtualScroll` rather than `VirtualGrid`. Previously that gave me access to a `VirtualGridProxy` with useful methods like `scrollToItem`. Now I have a `VirtualScrollProxy` which doesn't know anything about grid items. 
* Fortunately, I anticipated this problem. There's no `scrollToItem` but there is a `scrollToArea` which does most of the work. You just need to use row and column mappings to determine the area for the item you want to scroll to.
* To make it even easier I moved that logic into a standalone function, `virtualGridScrollToItem`. There's `virtualListScrollToItem` for lists too.

End result is that I just needed to replace

```ts
scrollRef.current?.scrollToItem(row, col, 'visible');
```

with

```ts
virtualGridScrollToItem(scrollRef, rowMapping, columnMapping, row, col, 'visible');
```

# Display Grid Focus Sink

* Now ready to move focus sink `outerRender` from `VirtualScroll` to `DisplayGrid`
* Greatly simplified rendering code. More code removed than added.
* No need to worry about paged virtual scrolling when positioning focus sink. Only need state for logical grid offset.
* Can clamp out of view focus sink to edge of viewport rather than trying to "optimize" for browser scrolling sink into view.

```ts
const focusHeight = rowMapping.itemSize(row);
let focusTop = rowMapping.itemOffset(row) - gridRowOffset;
if (focusTop < -focusHeight)
  focusTop = -focusHeight;
else if (focusTop > height)
  focusTop = height;

const focusWidth = columnMapping.itemSize(col);
let focusLeft = columnMapping.itemOffset(col) - gridColumnOffset;
if (focusLeft < -focusWidth)
  focusLeft = -focusWidth;
else if (focusLeft > width)
  focusLeft = width;
```

# Inconsistent Rendering

* Finally all the glitches when scrolling are gone
* Noticed new inconsistencies
* We call `scrollToItem` when moving focus from cell to cell using the arrow keys
* When we reach the edge of the viewport and press the arrow key again, the newly focused cell will scroll into view
* Browser will ensure that newly focused element is visible. However, in our case the element with focus hasn't changed, the focus sink always has focus. We just move it to the logically focused cell. 
* [Doing it ourselves]({% link _posts/2024-10-28-react-spreadsheet-event-handling.md %}) also ensures that the cell is nicely aligned to the edge of the viewport and avoids issues when crossing virtual scrolling page boundaries.

* Was all working great. Doesn't work any more. When you hold arrow key down so that grid scrolls up, the focus cell is just out of view, then sorts itself out when you let go.

{% include candid-image.html src="/assets/images/react-spreadsheet/focus-scroll-outside-view.png" alt="Focus cell just out of view" %}

* What exactly happens on arrow key down? We change the focus to the cell below the current cell, updating our focus related state. Then call `scrollToItem` to ensure the cell is in view. The `scrollToItem` method updates the scroll position with the required offset which dispatches a scroll event. The spreadsheet scroll event handler uses the current scroll position to update the grid offset which makes the focus cell visible.
* Oh dear. When exactly is the scroll event received? The Chrome profiler confirmed my suspicions. React updates the DOM and the browser repaints after I change the focused cell but before the scroll event is handled.
* We're back to inconsistent renders. The update of the grid offset falls a frame behind when focus skips from cell to cell.

# Consistent Events

* The root cause of the problem is updating state in response to multiple events that have different priority levels in React 18. 
* I have three choices. I can restructure my code so that all state is updated by the key down event, restructure it so that the key down triggers a scroll event and all state is updated based on that or go back to using the legacy React rendering API.
* We're not going back.
* Doing everything in response to scroll is also unattractive. There's a lot of context that has to be stashed and retrieved on scroll. Seems wrong to shift work from a higher priority event to a lower priority one.
* Then I realized. Grid rendering is decoupled from scrolling. I can update the grid offset directly. I still need to update the position of the scroll bars but I can ignore the resulting scroll event. 

# Ensure Visible

* Which means all my carefully considered work to expose `virtualGridScrollToItem` was wasted. That method works out the area covered by the item and then calls `VirtualScrollProxy.scrollToArea` which works out the offset needed in each dimension, then updates the scroll position. I want the same calculations with the offsets returned at the end.
* In the end I exported a couple of existing internal utility functions, `getRangeToScroll` and `getOffsetToScrollRange` ,  that do most of the work.
* Used those to implement an `ensureVisible` function for the spreadsheet.

```ts
function ensureVisible(row: number, col: number) {
  const scroll = scrollRef.current;
  if (!scroll)
    return;

  const rowRange = getRangeToScroll(row, rowMapping);
  const colRange = getRangeToScroll(col, columnMapping);

  const newRowOffset = getOffsetToScrollRange(...rowRange, scroll.clientHeight, gridRowOffset, 'visible');
  const newColOffset = getOffsetToScrollRange(...colRange, scroll.clientWidth, gridColumnOffset, 'visible');
  if (newRowOffset !== undefined || newColOffset !== undefined) {
    setGridScrollState([(newRowOffset === undefined) ? gridRowOffset : newRowOffset, 
      (newColOffset === undefined) ? gridColumnOffset : newColOffset]);
    scroll.scrollTo(newRowOffset, newColOffset);
  }
}
```

* I replaced my call to `virtualGridScrollToItem` with `ensureVisible`. I also updated my `onScroll` handler to ignore the change if the grid position already matches the scroll position. 
* So far working well, though am a little concerned that scroll events could be delayed so that I've processed another key down event before the scroll event is received. Haven't seen anything like that happening yet. I have a few ideas for how to handle it if I ever see something like that.

# Visible Focus

* Noticed some new problems
* There are circumstances when the browser tried to ensure that an element with focus is visible
* Two that I noticed
  * Use tab to move focus around the page
  * Start typing into an input field
* Common case is when focused element has been scrolled out of view. Browser will scroll it into view.
* What happens in our case where focus sink is in a sticky positioned div that can't be scrolled

{% include candid-image.html src="/assets/images/react-spreadsheet/sticky-focus-force-visible.png" alt="Browser forcing sticky positioned focus sink to be visible" %}

* Browser finds a way to do it anyway. Nothing has been scrolled, no scroll event was raised. The browser has just moved the sticky div over, breaking my lovingly crafted layout. Rendering sorts itself out once you manually scroll over to where the focus cell should be.
* Luckily fix was simple. Do it myself before the browser has a chance to mess things up. Also means I have control over exact positioning.

```tsx
<input
  onFocus={() => { ensureVisible(row,col) }}
  onBeforeInput={() => { ensureVisible(row,col) }}
  {...otherFocusSinkProps}
/>
```

* On the look out to see if there are other cases where the browser tries to make the focused element visible

# High Water Mark

* Another side effect of scroll event
* Auto-extension of spreadsheet as you scroll off the end
* Doesn't work consistently anymore
* Simple fix. Extend explicitly whenever we move focus cell to last row or column.

# Synchronizing Scroll Bar Position

* Realized that I can make spreadsheet state the complete source of truth
* Canonical React approach when something in DOM or external needs to be aligned with state, use an effect
* Instead of calling `scrollTo` directly when changing grid offset state, can leave it to an effect at render time

```ts
React.useEffect(() => {
  scrollRef.current?.scrollTo(gridRowOffset, gridColumnOffset);
}, [gridRowOffset, gridColumnOffset])
```

* Have some existing complex code that defers a scroll until after render time when grid is being enlarged. Can throw that away.
* I did check and no scroll event is raised if scroll position is already correct. Even if it was, I have an early out check in my `onScroll`.
* Only downside is that I need to mock `scrollTo` in my unit test as its now called on mount
