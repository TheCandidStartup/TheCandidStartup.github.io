---
title: React Spreadsheet Editing
tags: react-spreadsheet
thumbnail: /assets/images/boring-spreadsheet.png
---

wise words

* When typing text into Excel, the input is parsed to try and determine the format. The end result is that both value and format are set for the cell.
* If you type into a cell with a pure text format, the string is [left as is](https://support.microsoft.com/en-gb/office/stop-automatically-changing-numbers-to-dates-452bd2db-cc96-47d1-81e4-72cec11c4ed8).
* Not clear if there are special cases when typing into cells with other kinds of format already applied.
* From StackOverflow questions it looks like Excel will parse general date input and set value and format regardless of any existing format.

# Grid Lines

* Make it easier to see what's going on when I add focus and selection
* Google Sheets uses a canvas and just draws them on
* I'm using HTML and React so need to do it with CSS
* Can't just add a border around each cell
* End up with double width borders because both cells drawn their own version of the shared edge
* Default styling draws borders outside the cell content width and height, overlapping each other and containers
* Use `box-sizing: border-box` so that everything is within cell boundaries
* Still have double width interior boundaries
* Have each cell draw just its left and bottom border

```css
.VirtualSpreadsheet_Column {
  box-sizing: border-box;
  border-right: 1px solid lightgrey;
}

.VirtualSpreadsheet_Row {
  box-sizing: border-box;
  border-bottom: 1px solid lightgrey;
}

.VirtualSpreadsheet_Cell {
  box-sizing: border-box;
  border-right: 1px solid lightgrey;
  border-bottom: 1px solid lightgrey;
}
```

# Header and Grid Alignment Bug

* Has been niggling away at me for a while - when you scroll to end of grid row/column header and grid content don't quite line up
* Much clearer to see now that I have grid lines

{% include candid-image.html src="/assets/images/react-spreadsheet/skew-grid-headers.png" alt="Misaligned header and grid" %}

* I've implemented the headers as a quick hack using `VirtualList` with the scroll bar hidden
* I set header scroll offset to match the scroll offset in the grid
* When you scroll to the end the offset I'm trying to set on the header is out of range and gets clamped
* I need something else that can be scrolled into view where the scroll bars are in the grid
* Eventually I'll implement custom header controls, for now I've fixed it by adding an extra dummy blank item to each header

{% include candid-image.html src="/assets/images/react-spreadsheet/grid-headers-padding.png" alt="Fixed misalignment by adding padding items" %}

# Selection

Looking in detail at Google Sheets behavior

* Click on cell -> selected
  * Cell outlined in dark blue (within boundaries of cell)
  * Type to enter text
  * As soon as you start typing, caret appears and cell gets additional outer outline in light blue (outside boundaries of cell)
  * Text echoed in formula bar
  * If cell has existing content, new text overwrites
  * Backspace to delete
  * Arrow keys change selected cell (as to tab and shift-tab)
  * Page up/down/left/right move selected cell by page size
  * Return moves down a cell unless row is selected in which case it moves right a cell
  * Light blue highlight on corresponding row and column header
  * Name field shows selection
  * Text saved when you move to another cell
  * Escape removes caret/light blue outline and goes back to basic selection
  * If you scroll selected cell completely out of view and then use arrow keys, scroll position jumps so that selected cell is brought back into view
* Double click on cell -> edit mode
  * Cell outlined with both dark blue and light blue highlights immediately, caret appears
  * Left-right arrow keys move within text, all other keys work the same way as selected mode
* Click on row header -> row selected
  * Row header background in dark blue, text in white
  * All cells in row with light blue background, text in black
  * All column headers with light blue background
  * Thin dark blue outline around entire row
  * First cell in row selected (thick dark blue outline)
  * Can move cell within selection using tab, shift-tab, return, shift-return. Arrow keys move cell and select it, deselecting row
  * Name field shows row range selection for single row, e.g. 10:10 if you selected row 10
* Click on column header -> column selected
  * Same as for row with first cell in column selected, name shows column range, e.g. E:E

HTML elements
* All done using canvas except when in edit mode
* Dark blue border drawn over grey cell boundaries and one pixel in - hard to do with HTML borders
  * For one pixel border need to draw just bottom and right of each cell. But then blue outline box has to extend over cell boundary to left and top
  * Or have border all the way round but then it's too thick. Or have border all the way round but set left/top to background color?
* Edit mode adds an input box on top of canvas
* Oversized div with 2 pixel border and 2 width, 1 height padding - light blue outline
* Contains input with no padding or border, fits within cell. Implemented as a div with `cursor: text`, `contenteditable: true`, `tabindex: 0` properties

* Numbers align right in each cell
* Text aligns left
* Logicals and errors align in the center

# Selection Takeaways

* Selection can cover range of rows, columns or cells
* A single column or row is not a valid name. Standard is to use a range containing single row or column.
* I'm going to support both `A` and `A:A`
* Cell with focus needs to be separate from selection. If more than one cell is selected, one cell in the selection will have focus. Focused cell can be moved around within the selection.
* Separate edit mode

# Focused Cell

* Going to start by implementing focused cell, click to focus, keyboard navigation controls
* Will add area selections and edit mode later
* Add `focusCell` state and update when selection changes
* Need to actually give focus to cell as an effect after the cell has rendered

```ts
const focusCellRef = React.useRef<HTMLDivElement>(null);
const [focusCell, setFocusCell] = React.useState<RowColCoords>([undefined,undefined]);

React.useEffect(() => {
  focusCellRef.current?.focus()
}, [focusCell])

...

setSelection([row,col]);
setFocusCell([row,col]);
```

* Change my `Cell` component to render an alternate version if the cell is focused. 


```tsx
const Cell = ({ rowIndex, columnIndex, style }: { rowIndex: number, columnIndex: number, style: React.CSSProperties }) => {
  const value = (rowIndex < dataRowCount && columnIndex < dataColumnCount) ? formatContent(data, snapshot, rowIndex, columnIndex) : "";
  if (rowIndex == focusCell[0] && columnIndex == focusCell[1]) {
    return <div
      ref={focusCellRef}
      className={join(theme?.VirtualSpreadsheet_Cell, theme?.VirtualSpreadsheet_Cell__Focus)}
      tabIndex={0}
      style={style}>
      { value }
    </div>
  } else {
    return <div className={theme?.VirtualSpreadsheet_Cell} style={style}>
      { value }
    </div>
  }
};
```

* Set `tabindex` property so you can give focus to the cell
* Bind it to `focusCellRef`
* Add a modifier class name so that we can modify the style of focussed cells

```css
.VirtualSpreadsheet_Cell__Focus {
  border: 2px solid darkblue;
}

.VirtualSpreadsheet_Cell__Focus:focus {
  outline: none;
}
```

* As well as defining my own style I also disable whatever focus highlight the browser might apply so that the two don't clash
* I need my own marker for the focused cell because it needs to continue being marked even if the user uses the formula bar (giving focus to it) to edit the content
* To help with debugging in my sample app I change the background color of whatever element has browser focus

```css
:focus {
  background-color: lightgreen;
}
```

# The Problem

* Was working with my boring data set when I tried it out

{% include candid-image.html src="/assets/images/react-spreadsheet/boring-data-focus.png" alt="Boring Data with Focused Cell" %}

* Worked perfectly
* Eventually noticed that cell would lose browser focus every so often without me doing anything
* Took an embarrassingly long time to work out that focus was lost every minute when a new line was added to the spreadsheet
* Didn't notice because new lines are added out of sight at the other end of the spreadsheet
* Why is focus being lost?
* Change in data store will trigger a render but nothing has changed in the visible part of the spreadsheet
* Drilled in using browser developer tools and React profiler
* All cells (in both the grid and the header) are being recreated from scratch every render ...

# Reconciliation

* Compare previous and newly rendered JSX to work out what changes need to be applied to the DOM
* When comparing interior elements in the graph, try to match up children in old and new graphs
* Recursively compare matched children. Any unmatched child in old graph needs to be removed. Any unmatched child in new graph is newly added.
* Profiler shows that cells are not being matched at all. All existing cells are removed and new ones added.
* React uses keys defined on each child to match them up. Keys look fine to me.
* Common question on [StackOverflow](https://stackoverflow.com/questions/22573494/react-js-input-losing-focus-when-rerendering)
* Part of the reconciliation story that I'd glossed over is children can only match if they're implemented using the same component
* At first glance the JSX tells the story. All the cells in the grid use a `Cell` component. Of course they're the same.
* They're not. In modern React a component is a function. The `Cell` component depends on context from `VirtualSpreadsheet` so I implemented it as a nested function. Which means that it's a different function instance each time `VirtualSpreadsheet` renders. Cue another learning moment.

{% capture note-content %}
Don't define nested React components. For class components, don't define components inside the render function. For functional components, don't define components in the function body.
{% endcapture %}
{% include candid-note.html content=note-content %}

# The Fix

* I defined nested components so that I could capture context from `VirtualSpreadsheet`. 
* If I move the `Cell` component to the top level I'll have to pass that context through as a prop.
* Has to pass all the way through `VirtualGrid` to each `Cell` component that it creates.
* Luckily, I have an `itemData` prop on `VirtualList` and `VirtualGrid` for just this purpose.
* Working with explicit context gets very verbose. I have to explicitly create an object with props for everything that's needed, including other nested functions that will be called. 
* The alternative is to replace the nested component with a nested function which can be passed through as item data and invoked in a stub `Cell` component.

```ts
type CellRender = (rowIndex: number, columnIndex: number, style: React.CSSProperties) => JSX.Element;
function Cell({ rowIndex, columnIndex, data, style }: { rowIndex: number, columnIndex: number, data: unknown, style: React.CSSProperties }) {
  const cellRender = data as CellRender;
  return cellRender(rowIndex, columnIndex, style);
}
```

* The code in the nested function is exactly the same as in the original nested component

```ts
const cellRender: CellRender = (rowIndex, columnIndex, style) => {
  const value = (rowIndex < dataRowCount && columnIndex < dataColumnCount) ? formatContent(data, snapshot, rowIndex, columnIndex) : "";
  if (rowIndex == focusCell[0] && columnIndex == focusCell[1]) {
    return <div
      ref={focusCellRef}
      className={join(theme?.VirtualSpreadsheet_Cell, theme?.VirtualSpreadsheet_Cell__Focus)}
      tabIndex={0}
      style={style}>
      { value }
    </div>
  } else {
    return <div className={theme?.VirtualSpreadsheet_Cell} style={style}>
      { value }
    </div>
  }
};
```

# The Next Problem

* Scrolling a focused cell off screen and then back on loses focus too
* Makes perfect sense. Virtualized implementation, so anything off screen isn't rendered and doesn't exist in the DOM.
* Browser dependent what happens. Spec says that focus should be given to the root element. Which is completely useless. Chrome and Firefox move focus to the parent element of the one being removed. Safari does the spec compliant thing.
* Try earlier demo of scrolling around grid with keys. On safari it stops working once item you originally clicked on has scrolled out of view. 
* Currently only set focus if focused cell has changed (due to some user action)
* Don't want to change focus if user has been typing in formula bar or elsewhere in the app
* Common problem for virtualized grids in general
* SlickGrid adds a "focus sink element". This is a special zero size child at the top of the grid that's always there (whether off screen or not)
* Instead of giving focus to transient cell, it always gives focus to focus sink
* Handles key input as if the focused cell has the actual focus
* ??? Why are there two focus sinks? One used if active cell has changed when "tabbing" backwards, the other when going forwards. 