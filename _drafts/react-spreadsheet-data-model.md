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
* `numfmt` default options support extended range and the 1900 leap year bug. Which is weird because it's a combination that Excel doesn't support. If you want Excel compatibility you need restricted range and leap year bug. If you want compatibility with Google Sheets, VBA and everything else, use extended range and no leap year bug.
* `numfmt` default is an attempt at achieving maximum compatibility. It aligns with Excel for dates from 1900-01-01 onwards. It even preserves Excel's *interesting* behavior of formatting serial 0 as 1900-01-00. It aligns with the new ECMA date system for dates from 1899-12-29 and earlier. Which means it doesn't support 1899-12-30 and 1899-12-31 at all.
* Up to 1899-12-29 are ECMA style (not supported in Excel), 1899-12-30 to 1900-02-29 are Excel style (1 off compared with ECMA), 1900-03-01 and onwards are the same for both Excel and ECMA. 

# Serial Dates

* Not natural end result for monogamists with commitment issues
* Excel for Mac with 1904 date system (matching Mac system date), September 1985
* Excel 2 for Windows with 1900 date system with leap year bug, matching Lotus 1-2-3. October 1987.
* [BillG review](https://www.joelonsoftware.com/2006/06/16/my-first-billg-review/) for Excel/VBA integration, June 1992
  * VBA uses 1899-12-30 as base date so it can avoid reproducing leap year bug but still align with Excel for most dates
  * Excel 5.0 with VBA released in 1993
* [ECMA-376](https://ecma-international.org/publications-and-standards/standards/ecma-376/) 1st Edition, December 2005
  * 1900 date base system (required to treat 1900 as leap year). Range from 1900-01-01 (serial 1) to 9999-12-31 (serial 2958465)
  * 1904 data base system. Range from 1904-01-01 (serial 0) to 9999-12-31 (serial 2957003)
  * `date1904` flag in Workbook XML part if using 1904 base. 1900 is the default.
* ECMA-376 2nd Edition, December 2008
  * 1900 date base system (1900 is NOT a leap year). Range from -9999-01-01 (serial -4346018) to 9999-12-31 (serial 2958465). Base date (serial 0) is 1899-12-30. Same approach as VBA. Aligns with serial values of 1900 backwards compatibility system except for Jan/Feb 1900.
  * 1900 backward compatibility date base system (1900 is a leap year). Range from 1900-01-01 (serial 1) to 9999-12-31 (serial 2958465).
  * 1904 backward compatibility date base system. Range from 1904-01-01 (serial 0) to 9999-12-31 (serial 2957003)
  * `date1904` flag if 1904 based, `dataCompatibility` flag if 1900 backward compatibility. Non leap year 1900 is the default.
* ECMA-376 3rd Edition, June 2011
  * Same as second edition
* ECMA-376 4th Edition, December 2012
  * 1900 date base system (1900 is NOT a leap year). Range from 0001-01-01 (serial -693593) to 9999-12-31 (serial 2958465). Base date (serial 0) is 1899-12-30.
  * 1904 date base system. Range from 0001-01-01 (serial -695055) to 9999-12-31 (serial 2957003)
  * `date1904` flag in Workbook XML part if using 1904 base. 1900 is the default.
  * Despite the evolution of ECMA-376, Excel [still](https://learn.microsoft.com/en-us/office/troubleshoot/excel/wrongly-assumes-1900-is-leap-year) treats 1900 as a leap year. Microsoft says potential backwards compatibility issues mean its not worth fixing when date is only wrong for Jan/Feb 1900.
  * Excel [still doesn't](https://learn.microsoft.com/en-us/office/troubleshoot/excel/calculate-age-before-1-1-1900) support dates before 1900-01-01, suggesting that users use VBA functions if they need to work with earlier dates.
  * I'm with Google Sheets and ECMA-376 on this one. Going to use the extended range, leap year free, 1900 data base system. Serial values are aligned with Excel for every date apart from Jan/Feb 1900 which Excel clearly doesn't care about anyway.