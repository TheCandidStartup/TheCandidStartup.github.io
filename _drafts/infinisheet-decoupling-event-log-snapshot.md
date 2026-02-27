---
title: Decoupling the Event Log and Snapshot Tiles
tags: event-sourced-spreadsheet-data
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

[Last time]({% link _drafts/infinisheet-snapshot-multi-part-partial-load.md %}), we got a load-on-demand chunked snapshot format working. It didn't feel great, with too much coupling between in-memory representations for the event log and snapshot. We're going to sort that out now before moving on to a multi-tile snapshot format. 

# A Cunning Plan

{% capture s_url %}{% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}{% endcapture %}
I was thinking about the next stage on this scalability journey when I realized where I'd gone wrong. Eventually, we'll need a snapshot format that uses multiple [snapshot segments]({{ s_url | append: "#segments" }}). You make snapshot writes scalable by storing snapshots as multiple segments that are layered on top of each other. Each snapshot write creates a new segment and reuses existing segments from earlier snapshots.

The in-memory representation is a tile map for each segment. When reading the value of a cell you query each tile map in turn, similar to [layered spreadsheet data]({% link _posts/2025-03-17-react-spreadsheet-layered-data.md %}). We can use the same approach to decouple event log and snapshot. All we have to do is put all changes since the last snapshot into a dedicated "edit" layer on top. Now there's minimal coupling between event log updates and snapshot management. There's no need to load snapshot tiles just because there are new cell values in the event log.

# Edit Layer

My initial thought was to use a tile map for the edit layer. However, there's no need to use a multi-tile representation. The content of the edit layer is bounded by the maximum size of a log segment. Once we have a chunk's worth of data we write a snapshot and start a new segment. Which in turn means that the in-memory representation of an event log segment will comfortably fit in a single tile. We can use a single cell map for all the edits.

Using a cell map for the edit layer and a tile map for each snapshot segment allows us to specialize the data structures. The edit layer needs to track the history of changes made in a single log segment. Snapshot layers are logically immutable (although individual tiles are loaded on demand).

# Tile Map Rework

I started by reworking the tile map interface to remove unneeded functionality. Here's the interface I started with.

```ts
export interface SpreadsheetTileMap {
  addEntries(log: SetCellValueAndFormatLogEntry[], baseIndex: number): void;
  addEntry(row: number, col: number, logIndex: number, v: CellValue, fmt?: CellFormat): void;
  findEntry(row: number, col: number, snapshotIndex: number): CellMapEntry|undefined;

  loadTiles(src: SpreadsheetSnapshot|undefined, log: SetCellValueAndFormatLogEntry[],
    forceExist: boolean, range?: CellRangeCoords): Promise<Result<void,StorageError>>;

  saveSnapshot(src: SpreadsheetSnapshot|undefined, log: SetCellValueAndFormatLogEntry[], 
    rowCount: number, colCount: number, destSnapshot: SpreadsheetSnapshot, 
    snapshotIndex: number): Promise<Result<void,StorageError>>;

  loadAsSnapshot(src: SpreadsheetTileMap, snapshotIndex: number): void;
}
```

This is how it ended up. 

```ts
export interface SpreadsheetTileMap {
  findEntry(row: number, column: number): CellMapEntry|undefined;

  loadTiles(snapshot: SpreadsheetSnapshot, 
    range?: CellRangeCoords): Promise<Result<void,StorageError>>;

  saveSnapshot(srcSnapshot: SpreadsheetSnapshot|undefined, changes: SpreadsheetCellMap, 
    rowCount: number, colCount: number, destSnapshot: SpreadsheetSnapshot, 
    snapshotIndex: number): Promise<Result<void,StorageError>>;

  loadAsSnapshot(src: SpreadsheetTileMap, changes: SpreadsheetCellMap, 
    snapshotIndex: number): void;
}
```

Tile maps are immutable so there's no need for `addEntries` and `addEntry`. The `loadTiles` method is far simpler. There's no longer any need to forcibly create empty tiles you can add entries to, or to merge in log entries as tiles are loaded. Merging has moved to snapshot creation where the edit layer changes encoded in a `SpreadsheetCellMap` need to be merged with the last snapshot `SpreadsheetTileMap` before output as a new snapshot. 

# Refactoring Content and Log Segment

The core data structures in the spreadsheet engine are `EventSourcedSnapshotContent` and `LogSegment`. We implement the semantics required by React's `useSyncExternalEventStore`. You access spreadsheet data via an immutable snapshot. The content class is the internal implementation of that snapshot. We ensure the snapshot is immutable by making the content object immutable. Whenever there's a change to spreadsheet state the current content is replaced with a new content object. 

To ensure that this is scalable, content is a small fixed size structure. Each content object corresponds to a position with the event log. The large data structures used for the in-memory representation of the event log are in the `LogSegment` object. All content objects that correspond to positions in the same log segment reference the same `LogSegment` object.

When I introduced the idea of viewports I moved the tile map from `LogSegment` to `EventSourcedSpreadsheetContent`. Given the complexity of a single data structure that combines load-on-demand snapshot tiles with changes from the event log, I couldn't figure out how to maintain immutability any other way. Splitting the combined data structure into an immutable snapshot tile map and a cell map that mirrors the event log made it all clear. The tile map is immutable so is trivially sharable between all content objects. The cell map can be queried for any log position just like the event log so it's also sharable.

I moved the maps back to `LogSegment`, which in turn simplified the engine code. 

```ts
export interface LogSegment {
  startSequenceId: SequenceId;
  entries: SpreadsheetLogEntry[];
  cellMap: SpreadsheetCellMap;

  snapshotId?: BlobId | undefined;
  snapshot?: SpreadsheetSnapshot | undefined;
  tileMap: SpreadsheetTileMap;
}
```

# Async Interference

* Still have `setViewport`, `syncLogs` and `setCellValueAndFormat` running chained async operations which may interleave
* Currently check to see if content object has changed since the start of the chain. If so something else has run and we bail out.
* Worked with `syncLogs` and `setCellValueAndFormat` because both were updating local event log and cell map to match central event log. Didn't matter which handled it as long as they didn't interfere.
* Doesn't with `setViewport` in the mix as it's doing something independent. Don't want snapshot tile loading to cancel either of the other ops. Or the other ops to cancel tile loading.
* Do more fine grained checks. Look at the content properties we actually care about.
* `curr.endSequenceId == this.content.endSequenceId` for change in logs