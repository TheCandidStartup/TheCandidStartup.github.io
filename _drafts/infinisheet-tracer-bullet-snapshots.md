---
title: Infinisheet Tracer Bullet Snapshots
tags: infinisheet
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

wise words

# Refactoring

* Extracted some common types to avoid duplicating when defining `SpreadsheetCellMap`

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

# SpreadsheetCellMap Interface

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

# Serializing Cell Maps as Snapshots

* This is a tracer bullet, so do something simple, like JSON
* Good to have a format that is easily inspectable
* `Map` can't be directly serialized using `JSON.stringify`. Have to turn it into an `Object` or `Array`.
* Use replacer function to replace what would normally be serialized with whatever you want. The replacer function is called on each object, array and value as `JSON.stringify` recurses over the structure. 
* Also need to filter entries to only include those that are meant to be in snapshot
* [Simplest](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#using_reviver_when_paired_with_the_replacer_of_json.stringify) way of serializing a `Map` is using an array of arrays
* You replace the `Map` with an array of `[key,value]` pairs

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

* More complex than you might think. The replacer function gets called on each element of the array you returned in the top level replacement, then on each element of the `[key,value]` pairs, then on each property in the `CellMapEntry` value. We leave the arrays and `key` unchanged, then filter the map entries.
* You have no context of where you are in the traversal so you have to check every possibility each time the replacer is called.
* It's horrible, error prone code. Which doesn't work. If you filter out all the entries in a cell you get stuff like `[["A1",null],["B2",null]]`
* I could ignore those when I read back in, but I'm left thinking there must be a simpler more maintainable way of doing this.
* This approach isn't even that efficient. Start by copying all the map entries into an array of arrays structure.
* Much more understandable and maintainable to copy and filter entries myself and then stringify the result.

```ts
  const output: { [index: string]: CellData } = {};
  for (const [key,value] of this.map.entries()) {
    const entry = this.bestEntry(value,snapshotIndex);
    if (entry) {
      const { logIndex: _logIndex, ...rest } = entry;
      output[key] = rest;
    }
  }
  const json = JSON.stringify(output);
```

* As I'm iterating over all the entries anyway, it's easy to convert to a more natural object based representation rather than array of arrays. It's easy to make the filtering work the way I want. The code is easy to understand.

# Event Log BlobId

* Expects to identify snapshot and history blob using a `BlobId` which is a `string`
* Gives flexibility to the next level up for how they want to use this
* If I do File System style, what would my `BlobId` be?
* If I'm only thinking about a single spreadsheet then for snapshots it would be name of blob in `snapshots` dir, for history it would be name of blob in `history` dir. Simple enough.
* What about multiple spreadsheets? How does `EventLog` know which `snapshots` dir to look in? 
* `EventLog` doesn't look anywhere. It doesn't care how `BlobId` is interpreted. Layer above decides how to tie `EventLog` and `BlobStore` together
* Simplest way of managing multiple spreadsheets is to use upper layers of blob store as a user visible file system: folders containing spreadsheets. No new abstraction needed. Easy to implement folder hierarchy. 
* Store per-spreadsheet metadata in a blob insider per-spreadsheet directory. Metadata can include `EventLog` id in whatever database is being used.
* Don't need to identify which spreadsheet in `BlobId` because we start from spreadsheet to get `EventLog`. Layer above will already know which `BlobDir` to use with `BlobId` in event log. 

