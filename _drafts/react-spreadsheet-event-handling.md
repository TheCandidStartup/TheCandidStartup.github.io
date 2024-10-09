---
title: React Spreadsheet Event Handling
tags: react-spreadsheet
thumbnail: /assets/images/boring-spreadsheet.png
---

wise words

* Can select and set focus by typing cell reference into input box
* Need to add mouse and keyboard support

# Mouse

* Simple to add click handler to cells for basic selection

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

* What do we do when we want to add support for range selects?
* Also a bit nervous of creating a new function instance with different closure for each cell. Potential performance issue?
* Park that thought for a moment

# Keyboard

* Also simple to add keyboard handler to the focus cell

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

* Need to prevent default event handling which would otherwise scroll the grid
* By default, grid will automatically be scrolled as you move focus towards edge
* At first glance appears to work nicely
* Quickly notice that you can lose input focus quite easily
  * If you navigate fast (change direction frequently, hold key down to get auto repeat)
  * Scrolling a focused cell off screen and then back on loses focus too
* Makes perfect sense. Virtualized implementation, so anything off screen isn't rendered and doesn't exist in the DOM.
* HTML spec says that focus should be given to the root element. Which is completely useless. What happens to keyboard events after that is browser dependent. Chrome and Firefox do some kind of magic which ends up going back to scrolling the grid. Safari ignores the events. 
* If focus cell ends up off screen, want to be able to use keyboard to bring it back on screen

# Grid Handler

* Instead of having handlers on multiple cells which are added/removed as focus changes and grid is scrolled, have single generic handler for the entire grid
* Put on grid's "outer" div
* `VirtualGrid` [originally]({% link _posts/2024-07-01-react-virtual-scroll-0-4-0.md %}) let you provide your own outer component but without a handy generic data prop to pass in a render prop. Luckily, I was able to go back in time and [change it to take a render prop directly]({% link _drafts/react-virtual-scroll-0-5-0.md %}) instead.

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

* I've consolidated all the keyboard handling into one function instance, which is nice. However, it makes no difference at all functionally. Once focus moves to the root, the handler stops seeing events. 

# Focus Sink

* Common problem for virtualized grids in general. There's no safe way of recovering focus once it's been lost. How do you know that you're the one that previously had focus? The general advice is to move focus somewhere else before deleting the element with the focus. That gets complicated fast. 
* The other approach is to put the focus somewhere that never gets deleted. 
* SlickGrid adds a "focus sink" element. This is a special zero size child at the top of the grid that's always there (whether off screen or not)
* Instead of giving focus to a transient cell,  SlickGrid always gives focus to the focus sink
* Handles key input as if the focused cell has the actual focus
* ??? Why are there two focus sinks? One used if active cell has changed when "tabbing" backwards, the other when going forwards. 
* I also want
  * Focus mode where navigation keys move from cell to cell, flipping into edit mode as soon as you start typing content
  * Edit mode where you have an actual editable input field, with starting value being first thing you typed before mode flipped
* Input field needs to have focus and fill cell

# Crazy Idea

* Have an input control that acts as a focus sink, always present in grid
* When in focus mode
  * If focus cell is present in grid position input under cell so it can't be seen but can receive input
  * Use onChangedEvent to flip mode
  * In edit mode input is positioned on top of cell so it is seen
  * If focus cell is not present in grid, position input somewhere arbitrary where it won't be seen but can receive input

# Syncing State

* To position focus sink correctly need to know the grid's scroll state
* Need to share state between `VirtualSpreadsheet` and `VirtualGrid`
* Usual advice is to [lift shared state up](https://react.dev/learn/sharing-state-between-components) so that there's a single source of truth in the highest level component. However, `VirtualGrid` won't work as a standalone component without it's own scroll state. In the end I decided to sync rather than share state.
* I already do this in a hacky way by scrolling the header components to match the grid in it's `onScroll` handler. Now I'm formalizing it by updating state in `VirtualSpreadsheet`.

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

* Can now update generic handler with an explicit focus sink

```tsx
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

* We only add the focus sink if there's a focused cell
* Position focus sink underneath focused cell using `zIndex` property
* Idea is that when user starts typing content we can go into "edit mode" by setting `zIndex` to 1 so that input appears on top of cell.
* Working out the position of the focus sink is more complex than you might think

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

* Need to account for paged virtual scrolling implementation in grid
* Simple enough when focus cell is visible in viewport. Use row and column mapping to get size and offset to focus cell then use `renderOffset` from scroll state to transform into current page's coordinate space.
* Don't know exact size of page but do know it's much bigger than any viewport size.
* If focused cell is more than an incremental scroll outside the viewport, clamp position to make sure we don't run off the VirtualGrid page.
* Careful - focus cell might be bigger than the viewport!
* Need to disable auto-scroll when we give focus to focus sink. If focus cell is a long way outside viewport (potentially even on a different page), the browser's default scroll won't work. 
* Want to do own scrolling anyway. Browser doesn't know about cells so doesn't scroll a cell at a time. 

{% include candid-image.html src="/assets/images/react-spreadsheet/focus-sink.png" alt="Focus Sink positioned behind Focus Cell" %}

* Surprised when I realized that cells are transparent by default, but quite like the effect of seeing the input cell and text caret underneath
* Easy enough to change in the style sheet if you prefer the sink completely hidden.