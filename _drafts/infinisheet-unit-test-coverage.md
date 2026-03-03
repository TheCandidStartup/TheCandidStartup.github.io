---
title: Improving Unit Test Coverage 
tags: event-sourced-spreadsheet-data
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

wise words

* Let unit tests slide when I started tracer bullet dev
* Reached a point where I think architecture is in a good place
* Good time to validate that I've understood and exercised all the edge cases

# Async Interference

* Testing ways that chains of operations can overlap
* At the mercy of the scheduler when it comes to order of unconstrained operations
* Did some TDD when implementing interference tolerant code. Kept tweaking unit test until I found a code sequence that failed then wrote the code to tolerate it. 
* Good to be more systematic

# Vitest Coverage Weirdness

* To speed things up and look at big picture I'm running a vitest coverage report at the repo level
* All unit tests in all packages are run and combined into one coverage report
* Something has changed since I got all my dependencies up to date
* Files that I haven't touched, that had 100% coverage across the board, are reporting low function coverage, despite having 100% coverage of all the lines in the functions that are supposedly not being called. The corresponding unit test for that file explicitly calls every function. 
* If I run coverage at the package level, it reports 100% function coverage.
* For now, ignoring function coverage at the repo level if statements, branches and lines are all at 100%

# Infinisheet Types

* New types and utilities for `SpreadsheetViewport` and `CellRangeCoords`
* Trivial unit tests
* Still worth writing as I caught a logic error in `viewportToCellRange`
* Defined as an *inclusive* range to match Excel conventions
* Converting an offset to item where offset is right on the boundary of two cells is treated as start of second cell
* Need to detect and treat as end of first cell
