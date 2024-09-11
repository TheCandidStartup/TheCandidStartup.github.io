---
title: React Spreadsheet Infinite Scrolling
tags: react-spreadsheet
---

wise words

* Looking more like a spreadsheet but feeling kind of constrained with a starting size of 100 rows and 26 columns
* Could just turn it up to a trillion rows and columns but not very user friendly to navigate around if you're only using a fraction of that space
* Also not user friendly if, like Google Sheets, you have to explicitly click a button to add a row or column to the initial set
* UI makes them seem precious, giving them out begrudgingly

# Infinite Scrolling

* I want to have my cake and eat it too. I want comfortable navigation around a manageably small starting point but with no restrictions on where you go after that.
* Should be able to jump to any row, column or cell and have the grid automatically enlarge as needed
* When you scroll to the end row or column, grid should enlarge so that you can scroll past the end and keep going. Infinite Scrolling.
* If you scroll out to the far limits of the galaxy, leaving no trace, then eventually return home, the grid should snap back to a more manageable size

# Props

* Made `minRowCount` and `minColumnCount` optional with defaults of 100 rows and 26 columns
* Added `maxRowCount` and `maxColumnCount` option with defaults of a trillion rows and columns
* Demo at the end has max size set to 1000 rows and columns to make it easier to see what happens when you reach the limits of explorable space

```ts
export interface VirtualSpreadsheetProps {
  /** Minimum number of rows in the spreadsheet 
   * @defaultValue 100
  */
  minRowCount?: number,

  /** Maximum number of rows in the spreadsheet 
   * @defaultValue 1000000000000
  */
  maxRowCount?: number,

  /** Minimum number of columns in the grid 
   * @defaultValue 26
  */
  minColumnCount?: number,

  /** Maximum umber of columns in the grid 
   * @defaultValue 1000000000000
  */
  maxColumnCount?: number
}
```

# High Water Mark

* Need to keep track of size that we've expanded the grid to
* As user navigates around we can maintain a high water mark of largest row and column
* Determine grid size base on min, max and hwm

```tsx
  const [hwmRowIndex, setHwmRowIndex] = React.useState(0);
  const [hwmColumnIndex, setHwmColumnIndex] = React.useState(0);

  const rowCount = Math.max(minRowCount, hwmRowIndex+1);
  const rowOffset = rowMapping.itemOffset(rowCount);
  const columnCount = Math.max(minColumnCount, hwmColumnIndex+1);
  const columnOffset = columnMapping.itemOffset(columnCount);

  return (      
    <VirtualGrid
      rowCount={rowCount}
      columnCount={columnCount}>
      {Cell}
    </VirtualGrid>
  )
```

# Implementing Infinite Scrolling

* Need to detect when user has scrolled to the end, then make the grid bigger
* `VirtualGrid` has an `OnScroll` callback which gives me offset corresponding to start of scroll bar
* Need to know offset corresponding to end of scroll bar and to know whether that corresponds to the end of the grid
* The width of the scroll bar is equivalent to the width of the visible content
* I know width of component but that doesn't help. Need to consider impact of padding, whether there's a vertical scroll bar reducing space for visible content, etc.
* Need access to the `clientWidth` and `clientHeight` properties of the `VirtualGrid`'s top level element. That's currently considered an internal implementation detail.
* Can either extend the `OnScroll` interface (which would be breaking change) or expose `clientWidth` and `clientHeight` properties on `VirtualGridProxy`. Went with the latter as less intrusive and more generally useful.
* The mysterious unused `rowOffset` and `columnOffset` variables from the previous section are the offsets to the end of the grid
* For now we'll collapse the high water mark back to zero whenever the user scrolls back to the beginning and extend it by one whenever they scroll to the end.

```ts
  function onScroll(rowOffsetValue: number, columnOffsetValue: number) {
    columnRef.current?.scrollTo(columnOffsetValue);
    rowRef.current?.scrollTo(rowOffsetValue);

    if (rowOffsetValue == 0)
      setHwmRowIndex(0);
    else if (gridRef.current && (rowOffsetValue + gridRef.current.clientHeight == rowOffset)) {
      if (hwmRowIndex < rowCount && rowCount < maxRowCount)
        setHwmRowIndex(rowCount);
    }

    if (columnOffsetValue == 0)
      setHwmColumnIndex(0);
    else if (gridRef.current && (columnOffsetValue + gridRef.current.clientWidth == columnOffset)) {
      if (hwmColumnIndex < columnCount && columnCount < maxColumnCount)
        setHwmColumnIndex(columnCount);
    }
  }
```

# Jump to Anywhere

* The existing logic is in the `onKeyUp` event handler for the `name` input. It was previously a one liner that used `rowColRefToCoords` to parse the input and then called `scrollToItem` on the grid.
* I moved the logic into a dedicated function as I was about to adds lots more code.
* My first attempt just inserted code to manipulate the high water mark before calling `scrollToItem`

```ts
function onNameKeyUp(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.key !== "Enter")
    return;

  let sizeChanged = false;
  let [row, col] = rowColRefToCoords(name);
  if (row !== undefined) {
    if (row >= maxRowCount)
      row = maxRowCount - 1;
    if (row > hwmRowIndex) {
      setHwmRowIndex(row);
      sizeChanged = true;
    } else if (row == 0)
      setHwmRowIndex(0);
  }
  if (col !== undefined) {
    if (col >= maxColumnCount)
      col = maxColumnCount - 1;
    if (col > hwmColumnIndex) {
      setHwmColumnIndex(col);
      sizeChanged = true;
    } else if (col == 0)
      setHwmColumnIndex(0);
  }
```

* When I tried it I found that the grid expanded as expected but the grid only scrolled as far as the previous grid size. I have to press enter again to make it scroll to the requested location. 
* Which is obvious when you think about how React works. I change the high water mark state but it doesn't take effect until React schedules a render. When I scroll the grid hasn't expanded yet so gets clamped to the existing limits. 
* I need to scroll the control after it's been rendered. In modern React, that means using an effect. An effect is code that React runs after the component has been rendered. 
* I could use the normal `useEffect` but that would mean that the component would end up rendering twice and the user might see a visual "flash" if the browser paints both renders.
* This is the problem that `useLayoutEffect` addresses. It works like `useEffect` except that React ensures that the effect code, and any state changes and renders it might trigger, completes before the browser paints. 
* I just needed to work out how to keep track of the required scroll until the effect was triggered.
* I need to stash that information somewhere and in modern React the only choice is state or a ref.
* Want to minimize the amount of "side channel" data outside the normal React data flow.
* Eventually will need state that tracks the current selected cell, row or column. Jumping to an entity will select it, so let's add `selection` state now and store where we're jumping to there.
* Then the only "side channel" I need is a boolean ref to track whether there's a pending "scroll to selection".

```ts
  const pendingScrollToSelectionRef = React.useRef<boolean>(false);
  const [selection, setSelection] = React.useState<RowColCoords>([undefined,undefined]);
```

Now I can complete the bottom half of the `onNameKeyUp` function. If the grid size needs to change we set `pendingScrollToSelectionRef`, otherwise we can scroll immediately. 

```ts
    setSelection([row,col]);
    if (sizeChanged)
    {
      // Need to defer scroll to selection until after larger grid has been rendered
      pendingScrollToSelectionRef.current = true;
    } else 
      gridRef.current?.scrollToItem(row, col);
  }
```

* All that remains is the layout effect. 
* As a small optimization, the effect is dependent on the `selection`, which means it only triggers if the selection changes.

```ts
  React.useLayoutEffect(() => {
    if (pendingScrollToSelectionRef.current) {
      pendingScrollToSelectionRef.current = false;

      gridRef.current?.scrollToItem(selection[0], selection[1]);
    }
  }, [selection])
```

# Try It!

# Next Time

* Infinite scrolling is maybe a little trigger happy
* Accentuated because I don't have any real content in the grid
* Next time I'll make a start on the spreadsheet data interface, get some real (fake) content in place and see how the infinite scrolling behaves with that