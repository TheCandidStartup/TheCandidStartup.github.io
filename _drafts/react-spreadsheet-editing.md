---
title: >
  React Spreadsheet: Editing
tags: react-spreadsheet
thumbnail: /assets/images/react-spreadsheet/name-formula-layout.png
---

wise words

# TODO

* Row and Column names
  * A single column or row is not a valid name. Standard is to use a range containing single row or column.
  * I'm going to support both `A` and `A:A`
  * Name field shows row range selection for single row, e.g. 10:10 if you selected row 10
* Click on column header -> column selected
  * Same as for row with first cell in column selected, name shows column range, e.g. E:E

* Formula round trip
* Google Sheets displayed normalized value - formatted but with a hardcoded format rather than cell format
  * Date: YYYY-MM-DD
  * Time: hh:mm:ss
  * Date Time: YYYY-MM-DD hh:mm:ss
  * Currency: As number with two decimal digits, no currency symbol
  * Percentage: Full fidelity number as percentage with % symbol
  * boolean: TRUE or FALSE
  * Other number: Full fidelity number (as many decimals as needed, scientific notation if too large or small)
  * If you type into a cell with a pure text format, the string is [left as is](https://support.microsoft.com/en-gb/office/stop-automatically-changing-numbers-to-dates-452bd2db-cc96-47d1-81e4-72cec11c4ed8).
* Ensures value can be round tripped without loss
* On update, format stays unchanged if parsed value is of same general class

* OnScroll, OnEditValue, etc. handlers
* Shouldn't allow spreadsheet to grow beyond max sizes - bug when max size == data size
