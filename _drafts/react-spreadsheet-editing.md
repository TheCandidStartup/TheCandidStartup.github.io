---
title: React Spreadsheet Editing
tags: react-spreadsheet
thumbnail: /assets/images/boring-spreadsheet.png
---

wise words

* keyboard vs scroll priority when using arrow keys to navigate around spreadsheet
* browser bugs when making focus sink visible - focus in and text input. Maybe others!

* When typing text into Excel, the input is parsed to try and determine the format. The end result is that both value and format are set for the cell.
* If you type into a cell with a pure text format, the string is [left as is](https://support.microsoft.com/en-gb/office/stop-automatically-changing-numbers-to-dates-452bd2db-cc96-47d1-81e4-72cec11c4ed8).
* Not clear if there are special cases when typing into cells with other kinds of format already applied.
* From StackOverflow questions it looks like Excel will parse general date input and set value and format regardless of any existing format.

# Selection

Looking in detail at Google Sheets behavior

* Click on cell -> selected
  * Type to enter text
  * As soon as you start typing, caret appears and cell gets additional outer outline in light blue (outside boundaries of cell)
  * Text echoed in formula bar
  * If cell has existing content, new text overwrites
  * Backspace to delete
  * Return moves down a cell unless row is selected in which case it moves right a cell
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
  * A single column or row is not a valid name. Standard is to use a range containing single row or column.
  * I'm going to support both `A` and `A:A`
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

* How to adjust focus cell and selection as data store size changes
* Make sure grid is sized to include focus cell and selection (size may change when rendered, out of our control)

