---
title: >
  React Spreadsheet: Edit Ready
tags: react-spreadsheet
thumbnail: /assets/images/boring-spreadsheet.png
---

It's been a couple of months since I last worked on features for my scalable React spreadsheet component. I got distracted by adding [Playwright]({% link _posts/2024-12-16-bootstrapping-playwright.md %}) and [Storybook]({% link _posts/2025-01-13-bootstrapping-storybook.md %}) to my arsenal of development tools. The next step is to add all my components to Storybook and publish it as part of my documentation set. 

Before I do that, I want to get my spreadsheet component into a good place. I want it to be *Edit Ready*. 

# Edit Ready

I'm building a scalable spreadsheet frontend component because ultimately I want to build a scalable spreadsheet backend. So far, I have a [data interface]({% link _posts/2024-09-30-react-spreadsheet-data-interface.md %}) and some [fake data]({% link _posts/2024-10-07-react-spreadsheet-data-model.md %}). I'll need a real implementation once I have a frontend that can edit data. 

I've been working towards this point for a while and I'm pretty close. Selection is supported with an input box positioned under the focus cell ready to receive changes. It's mostly a matter of tidying up at this point.

# Data Interface for Cell Size

* Get item offset mapping for row/column given snapshot

# Data Interface for Cell Edit

* Set value and format

# Content Alignment

* Numbers align right in each cell
* Text aligns left
* Logicals and errors align in the center

# Keyboard Behavior

Looking in detail at Google Sheets behavior

* Click on cell -> selected

  * Return moves down a cell unless row is selected in which case it moves right a cell
* Click on row header -> row selected
  * Can move cell within selection using tab, shift-tab, return, shift-return. Arrow keys move cell and select it, deselecting row

# Name Field

* Get rid of Scroll To prompt
* Ends up positioned to left of formula bar
* Row and Column names
  * A single column or row is not a valid name. Standard is to use a range containing single row or column.
  * I'm going to support both `A` and `A:A`
  * Name field shows row range selection for single row, e.g. 10:10 if you selected row 10
* Click on column header -> column selected
  * Same as for row with first cell in column selected, name shows column range, e.g. E:E

# Formula Bar

* Displays text in cell with focus
* Can edit the text
* Return to save changes back, Escape to go back to original content

# Cell Edit Mode

* Once cell has focus, any text you type overwrites existing cell content, caret appears and cell gets additional outer outline in light blue (outside boundaries of cell)
* Backspace to delete
* Text echoed in formula bar
* Text saved when you move to another cell
* Escape removes caret/light blue outline and goes back to basic selection
* Double click on cell -> edit mode
  * Cell outlined with both dark blue and light blue highlights immediately, caret appears
  * Left-right arrow keys move within text, all other keys work the same way as selected mode

* When typing text into Excel, the input is parsed to try and determine the format. The end result is that both value and format are set for the cell.
* If you type into a cell with a pure text format, the string is [left as is](https://support.microsoft.com/en-gb/office/stop-automatically-changing-numbers-to-dates-452bd2db-cc96-47d1-81e4-72cec11c4ed8).
* Not clear if there are special cases when typing into cells with other kinds of format already applied.
* From StackOverflow questions it looks like Excel will parse general date input and set value and format regardless of any existing format
