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

