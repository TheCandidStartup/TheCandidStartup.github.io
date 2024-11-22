---
title: >
  React Spreadsheet: Decoupled Rendering
tags: react-spreadsheet
---

I [rebuilt]({% link _posts/2024-11-18-react-virtual-scroll-0-6-x.md %}) my `react-virtual-scroll` package from the ground up. I [couldn't make traditional virtual scrolling work properly]({% link _posts/2024-11-11-react-glitchy-virtual-scroll.md %}) with the new React 18 rendering API or Chrome's GPU accelerated compositor. So I switched to an approach that decoupled rendering of a window onto a virtualized grid from scrolling it. 

Given the major restructure of `react-virtual-scroll`, what did it take to get the React spreadsheet front end that I built on top of it working again?

Nothing. My spreadsheet sample app works fine. The glitchy rendering with cells flashing on and off while scrolling is fixed. I just have a few loose threads to tidy up. Unfortunately, when you pull on loose threads things can unravel ... 

# Unit Tests

The only change I *had* to make was to the unit test. Use of `AutoSizer` makes `VirtualGrid` dependent on layout which `jsdom` doesn't support. I needed to add a little bit of mocking to get the tests running again. 

```ts
  stubProperty(HTMLElement.prototype, "clientWidth", 585);
  stubProperty(HTMLElement.prototype, "clientHeight", 225);
```

# React 18 Rendering

Just like the `react-virtual-scroll` samples, I switched from the legacy React rendering API to the new React 18 API. I took the sample app for a spin, and rendering of cells while scrolling continued to work well. 

# Glitchy Focus Sink

There was still some glitchy rendering. Scroll to the bottom of the spreadsheet, select a cell, then scroll back to the start. Now scroll slowly down. You can see the [focus sink]({% link _posts/2024-10-28-react-spreadsheet-event-handling.md %}) flashing on and off despite being nowhere near the focused cell.

The focus sink was added as a customization on the `VirtualGrid` outer render. The problem is that it was built for traditional virtual scrolling. The sink input element is positioned within the scrollable area and responds to browser scrolling.

I need to move it to where the grid content is. I don't want to use the `VirtualGrid` inner render. That gets forwarded to the internal `DisplayGrid` inner render. Throwing another child in could disturb the grid layout and positioning the sink would be dependent on `DisplayGrid` internal implementation details. 

The ideal place is the `DisplayGrid` outer render. However, I don't have access to that.

# Decoupling

`VirtualGrid` is a convenient pre-composed set consisting of `VirtualScroll` + `AutoSizer` + `DisplayGrid`. The intent is that consumers use the underlying components directly for advanced customization scenarios. 

Let's see how well that works out.

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

Expanding the JSX is simple enough. It's mostly a case of figuring out whether a prop needs to be set on `VirtualScroll` or `DisplayGrid`. 

I have my own state for grid scroll position (`gridRowOffset` and `gridColumnOffset`), so can use that directly rather than relying on the props passed by the `VirtualScroll` child render prop.

It already feels cleaner having header and grid offsets both set directly from my own state.

# Virtual Grid Proxy

The biggest problem is that I have to take a ref to `VirtualScroll` rather than `VirtualGrid`. Previously that gave me access to a `VirtualGridProxy` with useful methods like `scrollToItem`. Now I have a `VirtualScrollProxy` which doesn't know anything about grid items.

Fortunately, I anticipated this problem. There's no `scrollToItem` but there is a `scrollToArea` which does most of the work. You just need to use row and column mappings to determine the area for the item you want to scroll to. To make it even easier I moved that logic into a standalone function, `virtualGridScrollToItem`. There's `virtualListScrollToItem` for lists too.

The end result is that I just needed to replace

```ts
scrollRef.current?.scrollToItem(row, col, 'visible');
```

with

```ts
virtualGridScrollToItem(scrollRef, rowMapping, columnMapping, row, col, 'visible');
```

# Display Grid Focus Sink

Now I was ready to move the focus sink `outerRender` from `VirtualScroll` to `DisplayGrid`. Doing so greatly simplified the rendering code. I was able to remove more code than I added. 

I didn't need to worry about paged virtual scrolling when positioning the sink. Everything can be done in terms of the logical grid offset. I can clamp the out of view focus sink to the edge of the viewport rather than trying to "optimize" for the browser scrolling the sink into view.

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

Finally all the glitches when scrolling are gone. However, I noticed some new inconsistencies.

We call `scrollToItem` when moving focus from cell to cell using the arrow keys. When we reach the edge of the viewport and press the arrow key again, the newly focused cell will scroll into view. 

It was all working great. It was the bit of functionality that worked perfectly without any glitches. Not any more. When you hold the arrow key down so that the grid scrolls up, the focus cell is always just out of view, then sorts itself out when you let go.

{% include candid-image.html src="/assets/images/react-spreadsheet/focus-scroll-outside-view.png" alt="Focus cell just out of view" %}

What exactly happens on arrow key down? We change the focus to the cell below the current cell, updating our focus related state. Then call `scrollToItem` to ensure the cell is in view. The `scrollToItem` method updates the scroll position with the required offset which dispatches a scroll event. The spreadsheet scroll event handler uses the current scroll position to update the grid offset which makes the focus cell visible.

Oh dear. When exactly is the scroll event received? The Chrome profiler confirmed my suspicions. React updates the DOM and the browser repaints after I change the focused cell but before the scroll event is handled.

We're back to inconsistent renders. The update of the grid offset falls a frame behind when focus skips from cell to cell.

# Consistent Events

The root cause of the problem is that I'm updating state in response to multiple events that have different priority levels in React 18.

I have three choices. I can restructure my code so that all state is updated by the key down event, restructure it so that the key down triggers a scroll event and all state is updated based on that, or go back to using the legacy React rendering API.

We're not going back. Doing everything in response to a generated scroll event is also unattractive. There's a lot of context that has to be stashed and retrieved on scroll. It also seems wrong to shift work from a higher priority event to a lower priority one.

Then I realized. Grid rendering is decoupled from scrolling. There's nothing stopping me from updating the grid offset directly. I still need to update the position of the scroll bars to match but I can now just ignore the resulting scroll event. 

# Ensure Visible

Which means all my carefully considered work to expose `virtualGridScrollToItem` was wasted. That method works out the area covered by the item and then calls `VirtualScrollProxy.scrollToArea` which works out the offset needed in each dimension, then updates the scroll position. I want the same calculations with the offsets returned at the end.

I couldn't figure out an elegant way of supporting the existing functionality while adding the option to return the offsets I needed. In the end I exported a couple of existing internal utility functions, `getRangeToScroll` and `getOffsetToScrollRange`, that do most of the work. I used those to implement an `ensureVisible` function for the spreadsheet.

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

I replaced my call to `virtualGridScrollToItem` with `ensureVisible`. I also updated my `onScroll` handler to ignore the change if the grid position already matches the scroll position. 

So far it seems to be working well, although I am a little concerned that scroll events could be delayed so that I've processed another key down event before the scroll event is received. I haven't seen anything like that happening yet. I have a few ideas for how to handle it if I ever see something like that.

# Visible Focus

While I was testing I noticed some new problems. There are circumstances where the browser tries to ensure that an element with focus is visible. For example, using the tab key to move focus around the page, or starting to type text into an input field. If the focused element has been scrolled out of view, the browser will scroll it back into view. 

What happens if you've decoupled rendering from scrolling? In our case the focus sink is in a sticky positioned div that can't be scrolled.

{% include candid-image.html src="/assets/images/react-spreadsheet/sticky-focus-force-visible.png" alt="Browser forcing sticky positioned focus sink to be visible" %}

The browser finds a way to do it anyway. Nothing has been scrolled, no scroll event was raised. The browser has just moved the sticky div over, breaking my lovingly crafted layout. It does sort itself out once you manually scroll over to where the focus cell should be.

Luckily, the fix was simple. Do it myself before the browser has a chance to mess things up. Which also means I have control over the exact positioning.

```tsx
<input
  onFocus={() => { ensureVisible(row,col) }}
  onBeforeInput={() => { ensureVisible(row,col) }}
  {...otherFocusSinkProps}
/>
```

I'm on the look out for other cases where the browser tries to make the focused element visible. Let me know if you're aware of any.

# High Water Mark

The spreadsheet will [auto-extend]({% link _posts/2024-09-16-react-spreadsheet-infinite-scrolling.md %}) when you reach the limits of the existing grid. It doesn't work consistently when using the arrow keys to move the focus cell off the end. 

It turns out this only worked previously as a side effect of the scroll event. It was simple to fix by extending explicitly whenever we move the focus cell to the last row or column.

As soon as I did that, I realized that my `focusTo` function was now very similar to the `onNameKeyUp` function used to implement the "Scroll To" functionality. I was able to consolidate the functionality and simplify `onNameKeyUp`.

```ts
function onNameKeyUp(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.key !== "Enter")
    return;

  const [row, col] = rowColRefToCoords(name);
  focusTo(row,col);
}
```

# Synchronizing Scroll Bar Position

I had one more epiphany. There were a variety of places that I was calling `scrollTo` or `scrollToItem` to ensure that the scroll bar position would match the grid offset state. What I was actually doing is using an ad hoc approach to synchronize scroll bar positions in the DOM with my state.

In canonical React, you use an effect when you want to synchronize something external or in the DOM with changes in state. Instead of calling `scrollTo` directly when changing grid offset state, I can leave it to an effect at render time.

```ts
React.useEffect(() => {
  scrollRef.current?.scrollTo(gridRowOffset, gridColumnOffset);
}, [gridRowOffset, gridColumnOffset])
```

When I originally added [auto-extension]({% link _posts/2024-09-16-react-spreadsheet-infinite-scrolling.md %}) of the grid, I ran into a problem. If you use the "Scroll To" input box to jump outside the existing bounds of the grid, we need to extend the size of the grid and then scroll to make it visible. 

That resulted in complex code that defers the scroll until after the enlarged grid has been rendered. Now I can throw all that away, along with every other place I explicitly call `scrollTo`.

I did check and no scroll event is raised if the scroll position is already correct. I also have an early out check in my `onScroll` handler to break any loops.

The only downside is that I need to mock `scrollTo` in my unit test as it's now called on mount.

# Try It!

{% include candid-iframe.html src="/assets/dist/react-spreadsheet-decoupled/index.html" width="100%" height="fit-content" %}

All that's left is to embed a copy of the current build and reflect on a job well done. All outstanding issues fixed by simplifying and consolidating the code. Try it for yourself.

I did. As always, I did a final round of checks to make sure everything was ready to publish. I checked all the problems I'd fixed, all good. For some reason, I ended up mouse clicking below the thumb on the vertical scroll bar and holding it down so that I was scrolling through the grid a page at a time. 

When I reached somewhere around row 6000, the grid jumped back to row 4400 and went round again. And again, and again. 

I typed 5000 into the "Scroll To" box so that I could reproduce the problem more quickly. The grid jumped to 8211. If I "Scroll To" 6000, it jumps to 4381.

My first thought was that it must be delayed scroll events combining with the effect to move the scroll position back. However, that wouldn't explain the cases where the scroll position jumps forward. I went back to the virtual scroll samples from [last week]({% link _posts/2024-11-18-react-virtual-scroll-0-6-x.md %}). Try the trillion row `VirtualList` sample. Go to item 3999 and click once below the thumb of the vertical scroll bar to scroll down a page. It jumps to item 1022000.

# Next Time

Somehow over the last two weeks I've managed to break the core paged virtual scrolling functionality without me or my unit tests noticing. Next time we'll see if I manage to figure out what the heck is going on. 

