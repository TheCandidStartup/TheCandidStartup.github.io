---
title: React Spreadsheet Infinite Scrolling
tags: react-spreadsheet
thumbnail: /assets/images/react-spreadsheet/phone-grid-scroll.png
---

[Last time]({% link _posts/2024-09-16-react-spreadsheet-column-name.md %}), I left you feeling rather constrained by my starting spreadsheet size of 100 rows and 26 columns. This is the same starting size as Google Sheets. Like Google Sheets, I could have explicit buttons that add additional rows and columns. However, I don't like that behavior. The UI acts as if rows and columns were precious, giving them out begrudgingly.

My spreadsheet will be super scalable. To reflect that, it should feel effortless to navigate anywhere you want and put data there. I could turn up the starting size to a trillion rows and columns. However, that's not very user friendly to navigate around if you're only using a fraction of that space.

# Infinite Scrolling

I want to have my cake and eat it too. I want comfortable navigation around a manageably small starting point but with no restrictions on where you go after that. You should be able to jump to any row, column or cell and have the grid automatically enlarge as needed. When you scroll to the end row or column, the grid should enlarge so that you can scroll past and keep going. 

This interaction pattern is known as [Infinite Scrolling](https://blog.logrocket.com/infinite-scrolling-react/). It's more commonly used to support doom scrolling through social media. Here, I'm using it to support navigation through empty space, making it easy to add content anywhere in the spreadsheet. 

You shouldn't be punished for exploring. If you scroll out to the far limits of the galaxy, leaving no trace, then eventually return home, the grid should snap back to a more manageable size.

# Props

My first change is to the spreadsheet component's props. I made the existing `minRowCount` and `minColumnCount` optional, with defaults of 100 rows and 26 columns. I added `maxRowCount` and `maxColumnCount` with defaults of a trillion rows and columns. 

Infinite scrolling should manage the size of the grid between the min and max limits. 

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

We need to keep track of the size that we've expanded the grid to. As the user navigates around we can maintain a high water mark of highest row and column index visited. When rendering, we determine the grid size based on min size and high water mark. 

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

The basic idea is simple enough. Work out when the user has scrolled to the end, then make the grid bigger. `VirtualGrid` has an `OnScroll` callback which provides an offset corresponding to the start of the scroll bar. We need to know the offset corresponding to the end of the scroll bar and then see whether it's at the end of the grid.

The width of the horizontal scroll bar is equivalent to the width of the grid's visible content. I know the overall width of the component but that doesn't help. You need to consider the impact of padding, whether there's a vertical scroll bar reducing space for visible content, etc.

To do this right, we need access to the `clientWidth` and `clientHeight` properties of the `VirtualGrid`'s top level element. That's currently considered an internal implementation detail.

We could extend the `OnScroll` interface to pass additional parameters (which would be a breaking change) or expose `clientWidth` and `clientHeight` properties on `VirtualGridProxy`. I went with the latter as it's a less intrusive change and more generally useful.

The mysterious unused `rowOffset` and `columnOffset` variables from the previous section are the offsets to the end of the grid that we need to compare to. The code is a little fiddlier than I would like. We also need to make sure we don't enlarge the grid past the max size and deal with the possibility that `gridRef.current` might be undefined. 

For now we'll collapse the high water mark back to zero whenever the user scrolls back to the beginning and extend it by one whenever they scroll to the end.

```ts
  function onScroll(rowOffsetValue: number, columnOffsetValue: number) {
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

The existing logic is in the `onKeyUp` event handler for the `name` input element. It's a one liner that uses `rowColRefToCoords` to parse the input and then calls `scrollToItem` on the grid. The first step is to move the logic into a dedicated function. We're about to add a lot more code. 

My initial attempt inserted code to manipulate the high water mark before calling `scrollToItem` as before. 

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

When I tested it in the sample app, I found that the grid expanded as expected but only scrolled as far as the previous grid size. I had to press enter again to make it scroll to the requested location. 

Which is obvious when you think about how React works. I change the high water mark state but it doesn't take effect until React schedules a render. When I scroll, the grid hasn't expanded yet, so gets clamped to the existing limits. 

We need to scroll the control after it's been rendered. In modern React, that means using an [effect](https://react.dev/reference/react/useEffect). An effect is code that React runs after the component has been rendered. 

I could use the normal [`useEffect`](https://react.dev/reference/react/useEffect) but that means the component will end up rendering twice. The user will see a visual "flash" if the browser paints both renders. React provides [`useLayoutEffect`](https://react.dev/reference/react/useLayoutEffect) for this kind of use case. It works like `useEffect` except that React ensures that the effect code, together with any state changes and renders triggered by it, complete before the browser paints. 

We just need to work out how to keep track of the required scroll until the effect is triggered. We need to stash that information somewhere in the event handler and then retrieve it during the effect. In modern React the only choice is [state](https://react.dev/reference/react/useState) or a [ref](https://react.dev/reference/react/useRef).

I want to minimize the amount of "side channel" data outside the normal React data flow. I spent a long time thinking through different options. Eventually we'll need state that tracks the current selected cell, row or column. Jumping to an entity will select it, so we can add `selection` state now and store where we're jumping to there.

The only side channel I need is a boolean ref to track whether there's a pending "scroll to selection".

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

All that remains is the layout effect. 

```ts
  React.useLayoutEffect(() => {
    if (pendingScrollToSelectionRef.current) {
      pendingScrollToSelectionRef.current = false;

      gridRef.current?.scrollToItem(selection[0], selection[1]);
    }
  }, [selection])
```

Ideally, the effect would only run if `pendingScrollToSelectionRef` is `true`. We can't express that condition as a dependency and the React [rule of hooks](https://react.dev/warnings/invalid-hook-call-warning) prevents us from wrapping `useLayoutEffect` in a condition. Instead we let the effect run and check the condition in the effect.

The effect is dependent on `selection`, so only runs if the selection has been changed. We set `pendingScrollToSelectionRef` after setting the selection, so this cuts down on the number of unnecessary effect invocations. 

 As `selection` is an array, the comparison is by reference. When we set the selection, we pass in a new array. This means that the effect runs even if the same cell is selected again. Which is actually the behavior we want. Imagine jumping to a cell outside the current bounds of the grid, then scrolling all the way back to the start, snapping the grid back to its initial size. If you jump to the same cell again, you need the effect to run again even though the *value* of the selection hasn't changed. 

 I suspect this is another example of too clever code and that it would be safer to remove the dependencies entirely.

# Try It!

For this demo I set the max size to 1000 rows and columns to make it easier to see what happens when you reach the limits of explorable space.

{% include candid-iframe.html src="/assets/dist/react-spreadsheet-infinite-scrolling/index.html" width="100%" height="fit-content" %}

# Next Time

How does the infinite scrolling feel to you? To me it seems a little trigger happy. If a try to scroll exactly to the end of the current content, I end up a couple of rows or columns past the desired point. 

This impression is accentuated because I don't have any real content in the grid, just each cell's reference as a place holder. It might feel more reasonable if scrolling to the end results in a couple of rows or columns of empty space past the end of the content.

[Next time]({% link _posts/2024-09-30-react-spreadsheet-data-interface.md %}), I'll make a start on the spreadsheet data interface, get some real (fake) content in place and see how the infinite scrolling feels with that.