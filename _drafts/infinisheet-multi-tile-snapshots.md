---
title: Multi-Tile Snapshots
tags: event-sourced-spreadsheet-data
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

wise words
* Next step on tracer bullet journey
* Have a structure in place for multi-chunk snapshots with separate blobs representing individual tiles of content in spreadsheet space
* Currently each snapshot is a single tile holding all the data
* Next step is to use multiple tiles

# Grid Tile Format

* Continuing one step at a time
* Rather than the complex adaptive tiles I brainstormed, going to start with a fixed size grid of files
* Structure defined in snapshot index blob

```ts
export type GridTileFormat = {
  type: "grid";
  tileWidth: number;
  tileHeight: number;
};
```

# Grid Tile Map
 
* I already have `GridTileMap` as an abstraction for an in-memory representation of the working set of tiles.
* Now, instead of a single cell map for a single tile, I have a map of `SpreadsheetCellMap`, one for each tile.

```ts
export class SpreadsheetGridTileMap implements SpreadsheetTileMap {
  readonly tileWidth: number;
  readonly tileHeight: number;
  private map: Map<RowColRef, SpreadsheetCellMap>
};
```

* The map represents a grid of tiles indexed by row and column
* The `findEntry` method is the best illustration of how the structure works

```ts
  findEntry(row: number, column: number): CellMapEntry|undefined {
    const [tileRow, rowInTile] = divmod(row, this.tileHeight);
    const [tileCol, colInTile] = divmod(column, this.tileWidth);
    const key = rowColCoordsToRef(tileRow, tileCol);
    
    const cellMap = this.map.get(key);
    return cellMap?.findEntry(rowInTile, colInTile, 0);
  }
}
```

## Saving Snapshot

* Saving a multi-tile snapshot was a little more complex than I expected
* The `saveSnapshot` interface hasn't changed. You load from an existing snapshot (if any), apply any changes to it and then save a new snapshot.
* The only difference is that the snapshots are divided into tiles that need to be iterated over
* The first question is whether we need to support different files sizes in the source and destination snapshots. We definitely want this eventually but to start off with we'll assume the size is fixed for the lifetime of the spreadsheet.
* Then we need to decide how much of the spreadsheet coordinate space to create tiles for, whether we leave out tiles with no content, whether we shrink tiles to fit content and so on.
* Again, we start simple and create fixed sized tiles that cover the entire space from `(0,0)` to maximum `(rowCount, colCount)`, regardless of whether cells are occupied or not.  

```ts
async saveSnapshot(srcSnapshot: SpreadsheetSnapshot|undefined, 
  changes: SpreadsheetCellMap, 
  rowCount: number, colCount: number,
  destSnapshot: SpreadsheetSnapshot, 
  snapshotIndex: number): Promise<Result<void,StorageError>> 
{
  destSnapshot.tileFormat = { type: "grid", 
    tileHeight: this.tileHeight, tileWidth: this.tileWidth }

  for (let row = 0; row < rowCount; row += this.tileHeight) {
    for (let col = 0; col < colCount; col += this.tileWidth) {
      const cellMap = new SpreadsheetCellMap;
      if (srcSnapshot) {
        const blob = await srcSnapshot.loadTile(row, col, this.tileHeight, this.tileWidth);
        if (blob.isErr())
          return err(blob.error);
        cellMap.loadSnapshot(blob.value);
      }

      cellMap.loadAsSnapshot(changes, snapshotIndex, 
        { rowMin: row, rowMax: row+this.tileHeight, 
          columnMin: col, columnMax: col+this.tileWidth });

      const blob = cellMap.saveSnapshot(snapshotIndex);
      const blobResult = await destSnapshot.saveTile(row, col, 
        this.tileHeight, this.tileWidth, blob);
      if (blobResult.isErr())
        return err(blobResult.error);
    }
  }

  return ok();
}
```

* We iterate over the grid of tiles, loading each tile from the source snapshot, adding changes for that tile and writing it to the destination snapshot.
* I updated `SpreadsheetCellMap.loadAsSnapshot` to take an optional cell extents filter.

## Loading Tiles

* There are no surprises in the `loadTiles` implementation
* First work out the usable range of cells we need to load by intersecting requested range with spreadsheet extents

```ts
async loadTiles(snapshot: SpreadsheetSnapshot, 
  range?: CellRangeCoords): Promise<Result<void,StorageError>>
{
  const { rowCount, colCount } = snapshot;

  const usableRange = intersectCellRanges(range, 
    cellRangeCoords(0, 0, rowCount-1, colCount-1));
  if (usableRange === null)
    return ok();

  const tileRowStart = Math.floor(usableRange[0] / this.tileHeight);
  const tileColStart = Math.floor(usableRange[1] / this.tileWidth);
  const tileRowEnd = Math.floor(usableRange[2] / this.tileHeight);
  const tileColEnd = Math.floor(usableRange[3] / this.tileWidth);

  for (let row = tileRowStart; row <= tileRowEnd; row ++) {
    for (let col = tileColStart; col <= tileColEnd; col ++) {
      const key = rowColCoordsToRef(row, col);
      let cellMap = this.map.get(key);
      if (!cellMap) {
        const rowStart = tileRowStart * this.tileHeight;
        const colStart = tileColStart * this.tileWidth;
        const blob = await snapshot.loadTile(rowStart, colStart, 
          this.tileHeight, this.tileWidth);
        if (blob.isErr())
          return err(blob.error);

        cellMap = new SpreadsheetCellMap;
        cellMap.loadSnapshot(blob.value);
        this.map.set(key, cellMap);
      }
    }
  }

  return ok();
}
```

* Then work out the tiles that cover that range and load them
* At some point I need to optimize this so that tile can load in parallel rather than serializing everything

## Load As Snapshot

* The final method was the most complex. This method is used after a new snapshot has been created. Rather than throwing away the current state in memory and reloading from the new snapshot, we can update our in-memory representation so that we get the same result as reloading.
* The basic idea is simple enough. We iterate through the loaded tiles in the source `SpreadsheetTileMap`, copying them into the current tile map. We then iterate through the changes since the previous snapshot, applying them to the appropriate tile.

```ts
loadAsSnapshot(src: SpreadsheetTileMap, changes: SpreadsheetCellMap, 
  snapshotIndex: number): void 
{
  const srcMap = src as SpreadsheetGridTileMap;
  for (const [key,value] of srcMap.map.entries()) {
    const cellMap = new SpreadsheetCellMap;
    cellMap.loadAsSnapshot(value, 0);
    this.map.set(key, cellMap);
  }

  for (const [row,col,value] of changes.entries(snapshotIndex)) {
    const [tileRow, rowInTile] = divmod(row, this.tileHeight);
    const [tileCol, colInTile] = divmod(col, this.tileWidth);
    const key = rowColCoordsToRef(tileRow, tileCol);
    let cellMap = this.map.get(key);
    if (!cellMap) {
      cellMap = new SpreadsheetCellMap;
      this.map.set(key,cellMap);
    }
    cellMap.loadEntryAsSnapshot(rowInTile,colInTile,value)
  }
}
```

* In order to support this I had to add two new methods to `SpreadsheetCellMap`. First, an iterator over all entries visible at the specified snapshot index, and second the ability to add individual entries as if they were part of the snapshot. 
* Once gain there's no attempt at optimization. If no changes apply to tile and src/dest have same layout can reuse existing tile rather than copying as tiles are immutable.

# Spreadsheet Cell Map Iterator

* Implementing the iterator was the most frustrating part of this work. I want to implement a wrapper around the internal map's iterator. The wrapped iterator will move the map iterator to the next entry and then extract the required value.
* I made the mistake of searching for `how to implement TypeScript iterator`.
* The TypeScript documentation for [Iterators and Generators](https://www.typescriptlang.org/docs/handbook/iterators-and-generators.html) is particularly annoying. It tells you that an iterable object needs to implement a `Symbol.iterator` property conforming to the `Iterable<T>` interface. It doesn't tell you what that special property should actually do.
* There are [blog](https://dev.to/gsarciotto/iterators-in-typescript-1d78) [posts](https://patrickdesjardins.com/blog/understand-typeScript-iterator-and-iterable) that show examples of iterables and iterators but nothing that explains what the contract between caller and iterable/iterator actually is. I get the impression that there's some [cargo culting](https://en.wikipedia.org/wiki/Cargo_cult_programming) going on. I got something working with copy/paste/hack but I wasn't happy.
* Eventually I ended up searching for `JavaScript iterator protocol` and found [exactly what I was looking for](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols). A reminder to myself to check the Mozilla docs first in future.
* No point in repeating or summarizing what it says here. Go read it and come back.
* My iteration needs to return both key and value. I also need to provide the log index corresponding to the data I want to iterate over. I can't start the iteration using the `Symbol.iterator` entry point as that doesn't take any arguments.
* I'm going to copy what `Map` does. It has an `entries()` method which returns an iterator over key and value. I just need to add a `snapshotIndex` argument and return an iterator over `[row: number, column: number, value: CellData]`.

```ts
entries(snapshotIndex: number)  {
  const mapIter = this.map.entries();
  const myIterator: IterableIterator<[row: number, column: number, value: CellData], undefined> = {
    [Symbol.iterator]: () => myIterator,
    next: () => {
      while (true) {
        const result = mapIter.next();
        if (result.done) {
          return { done: true };
        }

        const [key, value] = result.value;
        const [row,column] = rowColRefToCoords(key);
        const entry = bestEntry(value,snapshotIndex);
        if (entry) {
          const { logIndex: _logIndex, ...data } = entry;
          return { value: [row!,column!,data] };
        } 
      }
    }
  };
  return myIterator;
}
```

* An iterator is any object with a `next()` method that returns an object compatible with `IteratorResult`. In practice that means returning either `{  value: [row,column,data] }` or `{ done: true }`
* In practice that's not quite enough. All the JavaScript language features that support iteration expect an `Iterable` not an `Iterator`. Trying to use an `Iterator` with something that expects an `Iterable` is such a common requirement that there's a standard pattern for an `IterableIterator`. Just add a `Symbol.iterator` property that returns `this`.
* TypeScript provides the `IterableIterator` interface for declaring iterable iterators. It takes 3 parameters, 2 of them optional. The required parameter is the type of value we're iterating over. You might think that the defaults for the other two parameters would work for the most basic iterator definition. You'd be wrong.
* Iterators have two optional features that are rarely used. You can optionally pass an argument to `next` (none of the JavaScript language features do). The third parameter defines the type of the next argument.
* Iterators can optionally provide a return value at the end of the iteration (all the JavaScript language features ignore it). The second parameter defines the type of the return value. This is the `value` of the final `IteratorResult` where `done` is true.
* The default value for the `Treturn` parameter is `any`. If you try returning `{ done: true }` you get a very long TypeScript error which ends up telling you that an undefined `value` is not compatible with `any`. If, like most, you don't have a return value you need to pass `undefined` as the second parameter.

* The only tricky part in the main implementation is that some entries may be undefined at the specified snapshot index. We need to keep advancing the map iterator until we find a defined value or we're done.
