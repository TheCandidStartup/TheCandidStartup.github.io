---
title: InfiniSheet Tracer Bullet Snapshots
tags: infinisheet
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

wise words

# EventLog BlobId

* Expects to identify snapshot and history blob using a `BlobId` which is a `string`
* Gives flexibility to the next level up for how they want to use this
* If I do File System style, what would my `BlobId` be?
* If I'm only thinking about a single spreadsheet then for snapshots it would be name of blob in `snapshots` dir, for history it would be name of blob in `history` dir. Simple enough.
* What about multiple spreadsheets? How does `EventLog` know which `snapshots` dir to look in? 
* `EventLog` doesn't look anywhere. It doesn't care how `BlobId` is interpreted. Layer above decides how to tie `EventLog` and `BlobStore` together
* Simplest way of managing multiple spreadsheets is to use upper layers of blob store as a user visible file system: folders containing spreadsheets. No new abstraction needed. Easy to implement folder hierarchy. 
* Store per-spreadsheet metadata in a blob insider per-spreadsheet directory. Metadata can include `EventLog` id in whatever database is being used.
* Don't need to identify which spreadsheet in `BlobId` because we start from spreadsheet to get `EventLog`. Layer above will already know which `BlobDir` to use with `BlobId` in event log. 

# Event Sourced Spreadsheet Data integration

* Two instances of ESSD, one host side, one worker side
* First cut constructs with choice of WorkerHost, Worker or undefined (no local workflows)
* Is this best approach
* Alternative is to have `EventSourcedSpreadsheetBase` with basically all current code
  * Then `EventSourcedSpreadsheetData` extends with constructor that takes `WorkerHost | undefined`
  * Plus new `EventSourcedSpreadsheetWorkflow` extends with constructor that takes `Worker`
* Static vs dynamic behavior differences
* Splitting into three classes makes it easier to split code into separate files to make it more maintainable
