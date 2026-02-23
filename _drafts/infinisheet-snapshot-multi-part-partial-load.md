---
title: Partially Loading Multi-Blob Snapshots
tags: event-sourced-spreadsheet-data
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

wise words

# Viewport

* Added `setViewport` to EventSourcedSpreadsheetData
* Hint to implementation that only data in the viewport is currently of interest
* Initial viewport passed to constructor via options object

* `SpreadsheetViewport` interface to define area of interest (e.g. what's visible)
* Defaults to entire spreadsheet (undefined viewport)
* `VirtualSpreadsheet` sets viewport to visible area
* Added viewport to `EventSourcedSpreadsheetData` content
* Storybook creates EventSourcedSpreadsheetData with initial empty viewport - nothing loaded until we know what's visible
* Not used by loading process yet, no unit tests, WIP

# Refactor Spreadsheet Content

* Preparing for implementation of `setViewport` where cell map will be re-loaded from snapshot independent of log.
* No change in functionality at this point
* Moved `setViewport` to Engine as Workflow will eventually need to use it
* Now make a copy of the viewport to ensure that content remains immutable if caller changes properties of viewport passed in later

# Multi-Blob Snapshot Format

* First step towards a multi-blob snapshot format. Snapshot is now a dir containing an "index" metadata blob and a tiles subdir containing tiles of content.
* Tiles are named based on their origin (`rowMin,colMin`) and size (`rowCount,ColCount`).
* For now metadata consists of `rowCount` and `colCount`, all content is saved as a single tile.
* Added SpreadsheetSnapshot class to manage in-memory representation of snapshot. Has methods to `saveTile`, `saveIndex`, `loadIndex`, `loadTile` plus an `openSnapshot` creator function.
* LogSegment now has `snapshotId` and `snapshot` members.
* Engine opens snapshot on demand when data is first loaded from it.
* Content `rowCount` and `colCount` now loaded from snapshot rather than calculated from cell map. Ready for when we partially load from snapshot tiles. Workflow uses openSnapshot, saveTile, saveIndex to create snapshot.

# Six Months Later ...

* Switched to trusted publishing
* Updated all dependencies
* Changed package manager

* Had to publish packages twice, despite being part way through rewrite
* All the unit tests and playwright tests passed
* Just one weird thing ...

# The bug that wasn't

{% include candid-image.html src="/assets/images/infinisheet/event-source-sync-loading.png" alt="Event Source Sync Story Permanently Loading" %}

* When you switch to story loading tooltip comes up and doesn't go away
* Start entering data and it sorts itself out
* Fixing bug good way to get reacquainted with code base
* And it did help, it just wasn't a bug. Turns out its down to incomplete implementation
* Loading status now tracks both event log and cell map state. Previously both load together. Moving to state where only pat of cell map in viewport will be loaded, will need to reload if viewport changes.
* `EventSourcedSpreadsheet` sets viewport to visible area once it knows what it is. `setViewport` method clears cell map loaded flag which is where I stopped six months ago.

# Tile Map

