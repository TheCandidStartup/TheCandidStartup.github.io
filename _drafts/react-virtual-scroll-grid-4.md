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

Which got me thinking. Are there any other limits on grid size that I've missed? The number of elements that React and the DOM have to deal with is fixed, depending only on the size of the visible window. Is there anything that depends on the overall size of the grid?

There's one thing. To ensure that the scroll bars are sized and respond correctly, the visible DOM elements are positioned in a container div that's the size of the entire grid. In theory, that shouldn't be a problem. There's no need for the browser to paint the entire empty div, just the area around the visible elements. As long as the browser can calculate the size and position of the scroll bar, then use that to position the visible elements, everything should be fine. 

How big will the numbers get? The [data structures I designed for the spreadsheet]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) can support up to 6000 million rows and 12 million columns. My sample grid has rows 30 pixels high and 200 pixels wide, so the div will be up to 180 billion pixels high and 2.4 billion pixels wide. 

That shouldn't be a problem if all the calculations are done in 64 bits, whether using doubles or integers. However, if there's any part of the calculation done in 32 bits, there won't be enough precision. A 32 bit integer can represent at most 4 billion values. 

## Turn It Up To Eleven

Let's try it out. I'll keep increasing the size of the grid and see how big we can go before it breaks. 

I started with a thousand rows and columns and kept multiplying the size by 10. I kept track of overall memory for the browser tab and the JavaScript heap to see if memory usage scaled with grid size at all. Overall memory stayed steady at around 20MB. JavaScript heap usage varied as I interacted with the grid, but always settled back to 7.7MB once garbage collection kicked in. 

I was surprised how much garbage was produced when scrolling across the grid, heap usage peaked at 16MB at one point. The control uses a React key based on the cell row and column position. When scrolling quickly, React deletes all the current cell DOM elements and generates new ones on every render. 

The control broke much sooner than I expected, at a million rows and columns. The behavior in Chrome and Safari is identical. The grid looks correct but when you scroll right over to the bottom right corner the furthest item is at 999999, 167771. All the rows are there, but only 167 thousand columns. If you dive into the developer tools you can see that the container div style has, as expected,  a height of 30 million pixels and a width of 200 million pixels. However, when you look at the computed layout diagram, the actual size is 30 million high but only 33 million wide. 

{% include candid-image.html src="/assets/images/frontend/chrome-element-size-limit.png" alt="Computed Chrome layout for million row/column grid" %}

Firefox is even more broken. The scroll bars are nearly full size so you can only scroll a little way at a time. As you scroll across, they shrink in size as if there was some kind of infinite scrolling implementation. It's impossible to get anywhere near the far side of the grid. Looking at the developer tools, the computed width is either 8947820 or 17895700, depending where you look in the UI. 

I went back and checked Firefox at 100K rows and columns. That's broken too, but not as horribly. The grid behaves normally, but when you scroll across, the furthest item you can see is 99999, 89477. That's consistent with a div container width of 17895700 pixels.

## Maximum Element Size

I had a look at the HTML spec to see if there are any documented limits. Width and height must be [valid non-negative integers](https://html.spec.whatwg.org/#valid-non-negative-integer), where a valid non-negative integer is a sequence of ascii numeric digits. Not very useful. 

The CSS spec says that [lengths](https://drafts.csswg.org/css2/#length-units) may have implementation-specific limits. It also says that where the specified length is not supported, user agents must approximate it as closely as possible. Which explains the Chrome and Safari behavior. They have an implementation-specific limit on the size of an element and use the maximum supported size if it's exceeded.

This [answer](https://stackoverflow.com/a/10884837) on Stack Overflow confirms that browsers have implementation-specific limits. The followups over the years also show that those limits have changed repeatedly over time. 

Digging further threw up a couple of grid controls that have workarounds for browser element size limits.

## SlickGrid

The stack overflow answer referenced [code](https://github.com/6pac/SlickGrid/blob/a37d263ff315e9b2d2bb1a79efd9612095f46b5b/src/slick.grid.ts#L1240) in [SlickGrid](https://github.com/6pac/SlickGrid) which tries to find the maximum supported element height at runtime. SlickGrid is an interesting project. It's been around for over a decade with an active community around it. The focus is on speed, scale and flexibility. The current version is written in typescript and is almost entirely vanilla JS (only one external dependency). 

There are extensive [examples](https://github.com/6pac/SlickGrid/wiki/Examples), including [setting up the grid as a spreadsheet](https://6pac.github.io/SlickGrid/examples/example-spreadsheet.html) and working with [large data sets](https://6pac.github.io/SlickGrid/examples/example-optimizing-dataview.html).

The large data set example has 500,000 rows each 25 pixels high. That's 12.5 million pixels, close to the Firefox limit. SlickGrid has a hard coded maximum height for Firefox of 6 million. I opened the sample in Firefox and fired up the developer tools. 

{% include candid-image.html src="/assets/images/frontend/slick-grid-firefox-dev-tools.png" alt="SlickGrid with Firefox Dev Tools showing height of container" %}

The container div height has been clamped at 4 million pixels. The code compensates for the smaller container size by mapping backward and forward between the container's coordinate space and the larger grid coordinate space as needed.

## React-Virtualized


