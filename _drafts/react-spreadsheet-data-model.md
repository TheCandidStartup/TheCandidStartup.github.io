---
title: Spreadsheet Data Model
tags: react-spreadsheet
---

wise words

* Have starting point for data interface
* Need to understand Spreadsheet data model to flesh it out
* Aim for initial data model is to be Excel compatible with ability to extend to more data types

# Excel Data Model

* Cell Value can be one of [four types](https://www.indeed.com/career-advice/career-development/excel-data-types)
  * Number (64 bit floating point)
  * Text (Unicode String)
  * Logical Value (TRUE or FALSE)
  * Error Value (up to 12 different error types depending on Excel [version](https://support.microsoft.com/en-gb/office/error-type-function-10958677-7c8d-44f7-ae77-b9a9ee6eefaa) [and](https://excelatfinance.com/online2/xlf-excel-errors.php) [source](https://spreadsheeto.com/formula-errors/))
    1. `#NULL!`
    2. `#DIV/0!`
    3. `#VALUE!`
    4. `#REF!`
    5. `#NAME?`
    6. `#NUM!`
    7. `#N/A`
    8. `#GETTING_DATA`
    9. `#SPILL!`
    10. `#UNKNOWN!`
    11. `#FIELD!`
    12. `#CALC!`
* What about dates, time and currency?
* They're all stored as numbers but formatted differently for display
* Each cell has an associated number format which defines how number values are formatted for display
* Complex language with warts, particularly around dates
* Standardized as ECMA-376
* Two open source implementations on npm. Neither has any third party dependencies.
  * [SSF](https://www.npmjs.com/package/ssf) - "community version" part of SheetJS product. Last publish to npm was four years ago. Get latest from `cdn.sheetjs.com`. 
  * [numfmt](https://www.npmjs.com/package/numfmt) - standalone package. "True" open source. MIT license. Same features as SSF plus localization (only in SSF Pro) and parsing of input values to determine value and format.
* Will try numfmt first due to the additional features and less restrictive license.
* By default the format is `General`. If the value is a number, applies a bunch of hard coded formatting rules. Booleans are formatted as `TRUE` or `FALSE`. Strings are displayed as is. 
* Otherwise uses the rules encoded in the [format string](https://support.microsoft.com/en-us/office/review-guidelines-for-customizing-a-number-format-c0a1d1fa-d3f4-4018-96b7-9c9354dd99f5).
* Excel UI lets you pick from a list of built in formats or create a custom format. Internally everything uses the same format spec.
* When typing text into Excel, the input is parsed to try and determine the format. The end result is that both value and format are set for the cell.
* If you type into a cell with a pure text format, the string is [left as is](https://support.microsoft.com/en-gb/office/stop-automatically-changing-numbers-to-dates-452bd2db-cc96-47d1-81e4-72cec11c4ed8).
* Not clear if there are special cases when typing into cells with other kinds of format already applied.
* From StackOverflow questions it looks like Excel will parse general date input and set value and format regardless of any existing format.
