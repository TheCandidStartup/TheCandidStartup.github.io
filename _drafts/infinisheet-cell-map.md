---
title: Infinisheet Cell Map
tags: infinisheet
thumbnail: /assets/images/infinisheet/cell-map-thumbnail.png
---

I have all the bits of infrastructure needed to start saving [snapshots]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) of my event sourced spreadsheet. The source of truth for the spreadsheet content is in an [event log]({% link _posts/2025-05-05-infinisheet-event-log.md %}). I've defined a [Blob Store]({% link _posts/2025-07-07-infinisheet-blob-store.md %}) interface to serialize snapshots as blobs of data together with a [Workers]({% link _posts/2025-07-14-infinisheet-workers.md %}) interface to create snapshots as a background task. 

There's one crucial bit missing. I don't have a good in-memory representation of a spreadsheet that I can load and save as a snapshot. My [tracer bullet development]({% link _posts/2025-06-02-event-sourced-spreadsheet-data.md %}) prototype has an event log as the one and only representation.

# Requirements

Reading the value of a cell from an event log is an *O(n)* process. Relying solely on an event log only works if you don't have many entries in the log, which in turn means it only works for small spreadsheets. That's fine as a starting point when you're just trying to connect all the pieces and don't have any way of producing snapshots. Now that we're ready to move on, we need something better. 

I have three main requirements for the replacement data structure.
1. It should still support event log semantics. We need to be able to read the value of a cell corresponding to a specific point in the event log.
2. Reading the value of a cell should be *O(logn)* in the worst case. 
3. As spreadsheet sizes increase, we'll need to write snapshots as multiple blobs. Each blob represents a 2D tile of the overall spreadsheet. The data structure needs to support loading and saving subsets of the spreadsheet corresponding to individual tiles. 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/fixed-width-stripe-tiles.svg" alt="Fixed width stripe tiles" %}

# Spreadsheet Cell Map

The data structure I came up with is pretty simple. It's basically a `Map` from cell reference to list of values for that cell at different points in the event log. 

We don't keep the entire event log in memory. We work with a `LogSegment` that represents a snapshot together with any log entries added since the snapshot was created.

{% include candid-image.html src="/assets/images/infinisheet/cell-map.svg" alt="Cell Map Data Structure" %}

Event log entries are identified by sequence id, a unique integer value over the lifetime of the entire event log. We identify log entries within a log segment by index, starting at zero for the first entry after a snapshot. Each cell map entry stores the cell value and the corresponding `logIndex`. Values loaded from the snapshot have no `logIndex` property. 

Most cells are empty and most occupied cells contain a single value. Therefore, most queries are *O(1)*. What happens when there are multiple values for a cell? For example, if the user repeatedly changes the same cell over and over.

The entries for each cell are naturally ordered by log index, which has some nice properties. Most of the time we work with values corresponding to positions near the end of the event log. If we iterate over the entries in the cell from last to first, we're likely to find what we're looking for very quickly. If we don't, we can switch to a binary chop search strategy. Most queries are still *O(1)*, with a worst case of *O(logn)*. 

# Refactoring

Before starting on the implementation of `SpreadsheetCellMap`, I refactored some of my existing types to avoid duplication. 

```ts
export type CellFormat = string | undefined;

export interface CellData {
  value: CellValue;
  format?: CellFormat;
}

export interface SetCellValueAndFormatLogEntry extends LogEntry, CellData {
  type: 'SetCellValueAndFormat';
  row: number;
  column: number;
}
```

# Interface

The cell map interface is simple enough. The map contains `CellMapEntry` objects consisting of `CellData` with an optional `logIndex`. You can add entries, find entries, save and load snapshots.

```ts
export interface CellMapEntry extends CellData {
  logIndex?: number | undefined;
}

export class SpreadsheetCellMap {
  addEntries(entries: SetCellValueAndFormatLogEntry[], baseIndex: number): void;
  addEntry(row: number, column: number, logIndex: number, value: CellValue, 
    format?: CellFormat): void;

  findEntry(row: number, column: number, snapshotIndex: number): CellMapEntry | undefined;

  saveSnapshot(snapshotIndex: number): Uint8Array;
  loadSnapshot(snapshot: Uint8Array): void;
}
```

The `findEntry` method returns the entry that would be included in a snapshot taken at the specified log index. Similarly, `saveSnapshot` saves a snapshot including everything up to the specified index. Snapshots are serialized to/from a `Uint8array` which can in turn be persisted to a `BlobStore`.

The existing code uses [exclusive ranges](https://metala.org/posts/api-design-exclusive-vs-inclusive-ranges/) when working with log segments. For consistency, the `snapshotIndex` argument in `findEntry` and `saveSnapshot` works the same way. The snapshot includes all log entries in the segment up to and excluding `snapshotIndex`. 

# Implementation

The current implementation is simple. It's just a wrapper around a `Map`. I need to be able to cope with sparse data and a `Map` is perfect for that. For simplicity, and ease of debugging, I'm using spreadsheet cell references (e.g. "A1") as keys. The value is an array of `CellMapEntry`. 

```ts
export class SpreadsheetCellMap {
  private map: Map<RowColRef, CellMapEntry | CellMapEntry[]>
}
```

I couldn't resist a little bit of premature optimization. As most occupied cells will have a single value, you can use a `CellMapEntry` directly as the value. Arrays are only used if there are two or more entries.

The downside of using a `Map` is that we can't support spatial queries. You can't iterate over the cell map by row or by column. You can't efficiently query for ranges of cells. I could have gone down a fascinating rabbit hole of spatial data structures but that really would be premature optimization. We'll wait and see if we need it. My current theory is that using a separate cell map for each tile of data we're working with may be enough. 

# Add Entry

My premature optimization means I have three cases to consider when adding an entry.
1. No existing entry, add new entry directly.
2. Existing array, push new entry onto end of array.
3. Existing direct entry, replace with array containing existing and new entry

```ts
addEntry(row: number, column: number, logIndex: number, 
         value: CellValue, format?: CellFormat): void {
  const key = rowColCoordsToRef(row, column);
  const newEntry = { value, format, logIndex };

  const entry = this.map.get(key);
  if (!entry) {
    this.map.set(key, newEntry)
    return;
  }

  if (Array.isArray(entry)) {
    entry.push(newEntry);
  } else {
    this.map.set(key, [ entry, newEntry ]);
  }
}
```

# Find Entry

I created a separate utility method that determines the best entry for a cell. It keeps all the premature optimization complexity in one place.

```ts
function bestEntry(entry: CellMapEntry | CellMapEntry[], 
                   snapshotIndex: number): CellMapEntry | undefined {
  if (!Array.isArray(entry)) {
    return (entry.logIndex === undefined || entry.logIndex < snapshotIndex)
      ? entry : undefined;
  }

  // Future optimization: Check 3 entries then switch to binary chop
  for (let i = entry.length-1; i >= 0; i --) {
    const t = entry[i]!;
    if (t.logIndex === undefined || t.logIndex < snapshotIndex)
      return t;
  }

  return undefined;
}
```

With that in hand, `findEntry` is simple to implement.

```ts
findEntry(row: number, column: number, snapshotIndex: number): CellMapEntry|undefined {
  const key = rowColCoordsToRef(row, column);
  const entry = this.map.get(key);
  return entry ? bestEntry(entry, snapshotIndex) : undefined;
}
```

# Serializing Snapshots

A production implementation needs to think carefully about serialization formats. The format needs to support versioning, backwards compatibility, and the ability to evolve over time. The serialization process should try to minimize the size of data stored while balancing the amount of compute needed.

A tracer bullet doesn't need any of that. Implementations should be simple and easy to debug. The format we use should be easy to inspect. We're using a JavaScript stack, so JSON is the obvious choice. 

Unfortunately, using JSON isn't as straightforward as I'd like. For a start, a `Map` can't be directly serialized using `JSON.stringify`. JSON only supports primitive values, objects and arrays. We need to turn our map into an `Object` or `Array`. I also need to ensure that I serialize just the `CellData` corresponding to the `bestEntry` for each cell. 

The `stringify` function has an optional argument for a `replacer` function that can replace what would normally be serialized with whatever you want. The replacer function is called on each object, array and value as `stringify` recurses over the structure. 

The [simplest](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#using_reviver_when_paired_with_the_replacer_of_json.stringify) way of serializing a `Map` is using an array of arrays. It's a one-liner to replace the `Map` with an array of `[key,value]` pairs.

```ts
  const json = JSON.stringify(this.map, (key,value) => {
    return (value instanceof Map) ? Array.from(value.entries() : value;
  })
```

Unfortunately, this approach gets complex fast. The replacer function gets called on the map you pass in, then each element of the array you returned in the top level replacement, then on each element of the `[key,value]` pairs, then on each property in the `CellMapEntry` values. We want to leave the arrays and `key` unchanged, then filter the map entries.

```ts
  const json = JSON.stringify(this.map, (key,value) => {
    if (value instanceof Map)
      return Array.from(value.entries());
    if (Array.isArray(value) && value.length == 2 && typeof value[0] == 'string')
      return value;
    if (typeof value == 'string')
      return value;
    if (key === 'value' || key === 'format')
      return value;
    if (key == 'logIndex')
      return undefined;

    return bestEntry(value as CellMapEntry | CellMapEntry[], snapshotIndex);
  })
```

You have no context of where you are in the traversal each time `replacer` is called, so you have to check every possibility every time. It's horrible, error prone code. I got this far, then gave up when I realized that filtering out all entries in a cell produced output like `[["A1",null],["B2",null]]`.

I could ignore the `null` entries when I read back in, but I'm left thinking there must be a simpler, more maintainable way of doing this. This approach isn't even that efficient. It starts by copying all the map entries into an array of arrays structure, then iterates over it.

It turned out to be simpler and more maintainable to copy and filter the entries myself, then stringify the result.

```ts
  const output: { [index: string]: CellData } = {};
  for (const [key,value] of this.map.entries()) {
    const entry = bestEntry(value,snapshotIndex);
    if (entry) {
      const { logIndex: _logIndex, ...rest } = entry;
      output[key] = rest;
    }
  }
  const json = JSON.stringify(output);
```

As I'm iterating over all the entries anyway, it's easy to convert to a more natural object based representation rather than array of arrays. 

# Unit Tests

`SpreadsheetCellMap` is a clean unit of self contained code, so naturally demands a unit test. I was especially careful to test round tripping of snapshots, including every possible type of cell value. I used my usual coverage driven testing approach to make sure that we test all three code paths for cell map entries.

# Integration

I added `SpreadsheetCellMap` to my `LogSegment` representation in the `EventSourcedSpreadsheetEngine` module. 

```ts
export interface LogSegment {
  startSequenceId: SequenceId;
  entries: SpreadsheetLogEntry[];
  cellMap: SpreadsheetCellMap;
  snapshot?: BlobId | undefined;
}
```

Whenever an entry is added to the `entries` array, it also gets added to the cell map. In `EventSourcedSpreadsheetData` I switched all queries to use `cellMap` rather than `entries`. 

# Next Time

I think I'm finally, finally ready to hook everything up and start creating snapshots. We'll see how that works out next time.
