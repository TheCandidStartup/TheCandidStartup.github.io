---
title: >
  React Spreadsheet: Event Handling
tags: react-spreadsheet
thumbnail: /assets/images/boring-spreadsheet.png
---

[Last time]({% link _posts/2024-10-14-react-spreadsheet-selection-focus.md %}) we got basic selection with a focus cell working. The only way of selecting something is by typing a cell reference into an input box.

It's time to add mouse and keyboard support.

# Mouse

It's simple enough to add a click handler to each cell for basic selection.

```tsx
<div 
  className={classNames}
  onClick={(_event) => {
    updateSelection(rowIndex,columnIndex);
  }}
  style={style}>
  { value }
</div>
```

However, I'm left with a few nagging questions. What do we do when we want to add support for range selects? I'm also a bit nervous of creating a new function instance with a different closure for each cell. Are there potential performance issues?

Let's park that thought for a moment.

# Keyboard

It's also simple to add a keyboard handler to the focus cell

```tsx
<div
  ref={focusCellRef}
  className={join(classNames, theme?.VirtualSpreadsheet_Cell__Focus)}
  tabIndex={0}
  onKeyDown={(event) => {
    switch (event.key) {
      case "ArrowDown": focusTo(rowIndex+1,columnIndex); event.preventDefault(); break;
      case "ArrowUp": focusTo(rowIndex-1,columnIndex); event.preventDefault(); break;
      case "ArrowLeft": focusTo(rowIndex,columnIndex-1); event.preventDefault(); break;
      case "ArrowRight": focusTo(rowIndex,columnIndex+1); event.preventDefault(); break;
    }
  }}
  style={style}>
  { value }
</div>
```

Let's start with the arrow keys and do the rest once we've figured out what we're doing. I need to prevent default handling of the event otherwise the grid will scroll the focus cell out of view. We don't need the default scrolling as the `focus` method will (by default) ensure that the focused element is visible, scrolling it into view if needed. 

At first glance it appears to work nicely. However, you quickly notice that you can lose input focus quite easily. Sometimes, if you use the arrow keys to move the focus cell quickly it goes off screen for a second before the browser catches up. Or just use the scroll bar to move if off screen. Either way, when you bring it back the input focus has gone. 

Which makes perfect sense. The grid is virtualized. Anything off screen isn't rendered and is removed from the DOM. When that happens, the HTML spec says that input focus should be given to the root element. Which is completely useless. What happens to keyboard events after that is browser dependent. Chrome and Firefox do some kind of magic which ends up going back to the default behavior of scrolling the grid. Safari ignores the events. 

# Grid Handler

Instead of having handlers on multiple cells, which are added and removed as the focus changes and the grid is scrolled, we can have a single generic event handler for the entire grid. Luckily, I was able to persuade the maintainer of `react-virtual-scroll` to [support render props]({% link _posts/2024-10-21-react-virtual-scroll-0-5-0.md %}). That made it easy to move the key handler onto the grid's outer container. 

```tsx
const outerGridRender: VirtualOuterRender = ({...rest}, ref) => {
  return <div ref={ref}
    onKeyDown={(event) => {
      if (focusCell) {
        const row = focusCell[0];
        const col = focusCell[1];
        switch (event.key) {
          case "ArrowDown": focusTo(row+1,col); event.preventDefault(); break;
          case "ArrowUp": focusTo(row-1,col); event.preventDefault(); break;
          case "ArrowLeft": focusTo(row,col-1); event.preventDefault(); break;
          case "ArrowRight": focusTo(row,col+1); event.preventDefault(); break;
        }
      } 
    }}
  {...rest}/>
}
```

That consolidates all the keyboard handling into one function instance, which is nice. However, it makes no difference at all functionally. Once focus moves to the root, the handler stops seeing events. 

# Focus Sink

This is a common problem for virtualized grids. There's no safe way of recovering focus once it's been lost. How do you know that you're the one that previously had focus? The general advice is to move focus somewhere else before deleting the element with the focus. Which gets complicated fast. 

The other approach is to put the focus somewhere that never gets deleted. [SlickGrid](https://github.com/6pac/SlickGrid) uses a "focus sink" element. This is a special zero size child at the top of the grid that's always there. Instead of giving focus to a transient cell, SlickGrid always gives focus to the focus sink. The focus sink handles key input as if the focused cell had the actual focus.

I will also need to support a spreadsheet like editing experience. Once a focus cell is selected, navigation keys move the focus from cell to cell. However, once the user starts typing content, the cell flips into edit mode. The static cell is replaced by a text input box containing whatever the user typed to trigger the change into edit mode. 

Obviously, the input box needs to fill the cell and have the input focus.

# Input Box Focus Sink

Which gave me an idea. Why not have an input box that acts as a focus sink? If the focus cell is visible in the grid, we can position the focus sink underneath, so it can't be seen but can receive input. We can use the input box's `onChangedEvent` to flip into edit mode. All we have to do is position the input box on top of the focus cell. It already contains whatever the user typed without us having to do anything else.

If the focus cell isn't visible in the grid, we put the input box somewhere arbitrary where it won't be seen but can receive input. 

# Syncing State

To position the focus sink correctly we need to know the grid's scroll state. Which means sharing state between `VirtualSpreadsheet` and `VirtualGrid`. The usual advice is to [lift shared state up](https://react.dev/learn/sharing-state-between-components) so there's a single source of truth in the highest level component. However, `VirtualGrid` won't work as a standalone component without it's own scroll state. 

In the end I decided to sync rather than share state. I already do this in a hacky way by scrolling the header components to match the grid in the `onScroll` handler. Now I'm formalizing it by syncing the scroll state into `VirtualSpreadsheet`.

```ts
  const [gridScrollState, setGridScrollState] = 
    React.useState<[ScrollState,ScrollState]>([defaultScrollState, defaultScrollState]);

  ...

  function onScroll(rowOffsetValue: number, columnOffsetValue: number, 
                    rowState: ScrollState, columnState: ScrollState) {
    ...
    setGridScrollState([rowState, columnState]);
  }
```

# Positioning the Focus Sink

We can now implement an explicit focus sink in our generic event handler.

{% raw %}

```tsx
const focusSinkRef = React.useRef<HTMLInputElement>(null);

const outerGridRender: VirtualOuterRender = ({children, ...rest}, ref) => {
  let focusSink;
  if (focusCell) {
    const row = focusCell[0];
    const col = focusCell[1];

    ...

    focusSink = <input
      ref={focusSinkRef}
      className={join(theme?.VirtualSpreadsheet_Cell,theme?.VirtualSpreadsheet_Cell__Focus)}
      type={"text"}
      onKeyDown={(event) => {
        switch (event.key) {
          case "ArrowDown": focusTo(row+1,col); event.preventDefault(); break;
          case "ArrowUp": focusTo(row-1,col); event.preventDefault(); break;
          case "ArrowLeft": focusTo(row,col-1); event.preventDefault(); break;
          case "ArrowRight": focusTo(row,col+1); event.preventDefault(); break;
        }
      }}
      style={{ zIndex: -1, position: "absolute", top: focusTop, height: focusHeight, left: focusLeft, width: focusWidth }}
    />
  }

  return <div ref={ref} {...rest}>
    {children}
    {focusSink}
  </div>
}
```

{% endraw %}

We only render the focus sink if there's a focused cell. The `zIndex` property lets us position the focus sink underneath the focused cell. The idea is that when the user starts typing content we can go into "edit mode" by setting `zIndex` to 1, which puts the focus sink on top of the cell.

Working out the position of the focus sink is more complex than you might think.

```ts
const originTop = gridScrollState[0].scrollOffset;
const focusHeight = rowMapping.itemSize(row);
const maxHeight = Math.max(height, focusHeight*3);
let focusTop = rowMapping.itemOffset(row) - gridScrollState[0].renderOffset;
if (focusTop < originTop - maxHeight)
  focusTop = originTop - maxHeight;
else if (focusTop > originTop + height + maxHeight)
  focusTop = originTop + height + maxHeight;

const originLeft = gridScrollState[1].scrollOffset;
const focusWidth = columnMapping.itemSize(col);
const maxWidth = Math.max(width, focusWidth*3);
let focusLeft = columnMapping.itemOffset(col) - gridScrollState[1].renderOffset;
if (focusLeft < originLeft - maxWidth)
  focusLeft = originLeft - maxWidth;
else if (focusLeft > originLeft + width + maxWidth)
  focusLeft = originLeft + width + maxWidth;
```

We need to account for `VirtualGrid`'s paged virtual scrolling implementation. That's simple enough when the focus cell is visible in the viewport. Use the row and column mapping to get the size and offset for the focus cell. Then use `renderOffset` from the grid's scroll state to transform into the current page's coordinate space.

Most of the code is there to deal with the case when the focus cell is outside the viewport. The focus sink can go anywhere out of sight, as long as it fits within the current virtual scrolling page. I decided to keep it under the focus cell if possible. That way it will naturally scroll into view if the browser repaints before React has a chance to render. 

`VirtualSpreadsheet` doesn't have access to the exact size of the page but we do know it's much bigger than any viewport size. If the focused cell is more than an incremental scroll outside the viewport, we clamp the position to make sure we don't run off the page. The current heuristic for the clamp distance is the extent of the viewport or three times the extent of the focus cell, whichever is larger. 

I had to disable auto-scroll when giving focus to the focus sink. If the focus cell is a long way outside the viewport (potentially on a different page), the browser's default scroll won't work. Which is fine. We need to implement our own auto-scroll anyway that aligns the edge of the viewport with cell boundaries.  

{% include candid-image.html src="/assets/images/react-spreadsheet/focus-sink.png" alt="Focus Sink positioned behind Focus Cell" %}

I was surprised when I realized that cells are transparent by default, but quite like the effect of seeing the input cell and text caret underneath, suggesting that it's OK to start typing. If you prefer the sink completely hidden until you're in edit mode, then it's easy enough to give the cells an explicit background color in the style sheet, like Google Sheets does. 

# Mouse

We now have all the pieces we need to replace the per-cell mouse click handler with a generic grid wide handler. That sets us up for adding range selection later. The code is more verbose as we have to deal with coordinate system transforms ourselves. 

```tsx
onClick={(event) => {
  const gridRect = event.currentTarget.getBoundingClientRect();
  const rowGridOffset = event.clientY - gridRect.top;
  const colGridOffset = event.clientX - gridRect.left;

  const rowOffset = rowGridOffset + gridScrollState[0].renderOffset + gridScrollState[0].scrollOffset;
  const colOffset = colGridOffset + gridScrollState[1].renderOffset + gridScrollState[1].scrollOffset;

  const [rowIndex] = rowMapping.offsetToItem(rowOffset);
  const [colIndex] = columnMapping.offsetToItem(colOffset);
  updateSelection(rowIndex,colIndex);
}} 
```

The [mouse event](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) provides coordinates in a variety of different coordinate systems, none of which are what we want. The first step is to use the mouse position in client coordinates and the client coordinate bounding box of the grid to get coordinates relative to the top left corner of the grid. Then use the grid scroll state to convert into logical grid coordinates before finally using the mapping objects to find the corresponding row and column indexes.

I finished off by using the same approach to add click handlers to the row and column headers. Now you can select a cell or an entire row or column with a single click. I also show the name of the row, column or cell clicked in the "scroll to" box.

# Try It!

Click to select and then use the arrow keys to move the focus cell around. Notice that you can move or scroll the focus cell out of view and then back again without losing focus. 

{% include candid-iframe.html src="/assets/dist/react-spreadsheet-event-handling/index.html" width="100%" height="fit-content" %}

# Next Time

We still need to add automatic scrolling of the grid when you move the focus cell so that it's out of view. The grid should scroll the minimum amount needed to bring the cell back into view. That's generally useful functionality that belongs in `VirtualGrid`. I can feel a `react-virtual-scroll 0.6.0` release coming on. 
