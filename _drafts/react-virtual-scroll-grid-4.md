---
title: >
    React Virtual Scroll Grid 4 : Big Grid
tags: frontend spreadsheets
---

After a long trip [down the rabbit hole]({% link _posts/2023-11-13-react-virtual-scroll-grid-2.md %}), I have [two working implementations]({% link _posts/2023-11-20-react-virtual-scroll-grid-3.md %}) of a React based virtual scrolling list. No flicker, no going blank while scrolling. 

The observant amongst you will have noticed that this series is called "React Virtual Scroll *Grid*". My implementation uses React, it certainly implements virtual scrolling, but there's no sign of a grid.  Time to fix that. 

Let's start with the easy way and see how far we get. [React-window](https://github.com/bvaughn/react-window) includes two virtual scrolling grid components. One for fixed size items, the other for variable size items. 

## React-Widow FixedSizeGrid

The fixed size grid is simplest, so let's start with that. The [sample code](https://react-window.vercel.app/#/examples/grid/fixed-size) is straight forward. Copy and paste into my [App.tsx](https://github.com/TheCandidStartup/react-virtual-scroll-grid/blob/c722aab688ada34e25770d3f5f75cc8da592ba42/src/App.tsx), add a couple of type annotations, tweak the styling a little and we're done.

```
import { FixedSizeGrid as Grid } from 'react-window';
 
const Cell = ({ columnIndex, rowIndex, style } : { columnIndex: number, rowIndex: number, style: any }) => (
  <div className="cell" style={style}>
    Item {rowIndex},{columnIndex}
  </div>
);

function App() {
  return (
    <div className="app-container">
      <Grid
        columnCount={10000}
        columnWidth={200}
        height={240}
        rowCount={10000}
        rowHeight={30}
        width={600}>
          {Cell}
      </Grid>
    </div>
  )
}
```

Which ends up looking like this. Give it a try!

{% include candid-iframe.html src="/assets/dist/react-scroll-grid-4a/index.html" width="100%" height="fit-content" %}

## React-Window VariableSizeGrid

The whole point of this exercise is to end up with a grid control suitable for a spreadsheet UI. Spreadsheets have resizable rows and columns, so we'll need support for variable sized items eventually. The variable sized grid has the same interface as the fixed size grid with a [few extra properties](https://react-window.vercel.app/#/api/VariableSizeGrid). 

```
columnWidth: (index: number) => number
    Returns the width of the specified column.

rowHeight: (index: number) => number
    Returns the height of the specified row.

estimatedColumnWidth: number = 50
    Average (or estimated) column width for unrendered columns. 

estimatedRowHeight: number = 50
    Average (or estimated) row height for unrendered rows. 
```

The two required properties are functions that return the width and height of a specified item. Which got me thinking. Does that mean those two functions need to be called on every cell in the grid before the control can render? How's that going to work if I have a spreadsheet with [millions of rows and columns](https://www.thecandidstartup.org/2023/01/30/boring-spreadsheet.html)?

Fortunately, that's not how the control works. The control only measures the size of items that have been scrolled past. For the initial view, it only measures the visible items. The overall size of the container is based on the measured size for items up to the furthest scroll position plus an estimated size for the remaining items (which is where the `estimatedColumnWidth` and `estimatedColumnHeight` properties come in).

Each time the control calculates the actual sizes up to the current scroll position, it saves the results away into a cache. When it has to calculate the size for a new scroll position it looks up the closest previous position and then works out the difference from there to the current position. 

This system works nicely if you're scrolling across the grid a page at a time. There's a small incremental amount of work to do. However, if you drag the horizontal scroll bar right over to the right, then the vertical one all the way down, the cache doesn't help. You're back to needing to know the size of every cell before you can render. One of the underlying principles of my spreadsheet project is that only the visible data needs to be loaded. This isn't going to work.

There are other problems. The cache is unbounded in size. The scroll bar feels "janky" when you first scroll across due to the adjustment from estimated to actual sizes. 

## Theoretical Limit

## Turn It Up To Eleven

## Maximum Element Size



