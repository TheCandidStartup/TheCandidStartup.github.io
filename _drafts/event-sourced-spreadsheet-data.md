---
title: Event Sourced Spreadsheet Data
tags: infinisheet
thumbnail: /assets/images/infinisheet/log-entry.png
---

I've been working on my [scalable spreadsheet]({% link _topics/spreadsheets.md %}) project from opposite ends. So far, most of my focus has been on the front end. I've created a virtualized [React spreadsheet]({% link _topics/react-spreadsheet.md %}) component that can scale to trillions of rows and columns. The component accesses spreadsheet data via a [SpreadsheetData]({% link _posts/2024-09-30-react-spreadsheet-data-interface.md %}) interface based on React's [external store](https://react.dev/reference/react/useSyncExternalStore) interface.

I've just started work on the back end. I've defined an [EventLog]({% link _posts/2025-05-26-asynchronous-event-log.md %}) interface that I *think* provides a good abstraction layer for a variety of implementations.

Now I need to fill in the details between the two. The big idea is to use [event sourcing]({% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}) with [regular snapshots]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) to provide an optimal balance between efficient coarse grained storage and fine grained updates.

# Tracer Bullet

The full concept needs additional back end abstractions. A blob store for the snapshots, with some kind of background workers to create them. However, we can do some [tracer bullet development](https://builtin.com/software-engineering-perspectives/what-are-tracer-bullets) using just the event log. Consider the first few edits to a spreadsheet, before the first snapshot is created. The only storage involved at this stage is the log. 

We're going to create an implementation of the `SpreadsheetData` interface built on just the `EventLog` and see what happens. Are there any obvious holes in the `EventLog` interface? Is there an [impedance mismatch](https://startup-house.com/glossary/what-is-impedance-mismatch) between the two interfaces that makes implementation awkward? Can we see a path forward to add snapshots?

# Event Sourced Spreadsheet Data

{% include candid-image.html src="/assets/images/infinisheet/module-architecture.svg" alt="InfiniSheet Architecture" %}

We start by ticking off another module from the [architectural master plan]({% link _posts/2024-07-29-infinisheet-architecture.md %}). I created an `event-sourced-spreadsheet-data` module and an `EventSourcedSpreadsheetData` class for the main implementation. However, before we can get started on that, we need to define what we're going to store in the event log.

# Spreadsheet Log Entry

So far, the only method in `SpreadsheetData` that can modify the spreadsheet is `setCellValueAndFormat`. We'll need a log entry that captures the changes made.

```ts
export interface SetCellValueAndFormatLogEntry extends LogEntry {
  type: 'SetCellValueAndFormat';
  row: number;
  column: number;
  value: CellValue;
  format?: string|undefined;
}

export type SpreadsheetLogEntry = SetCellValueAndFormatLogEntry;
```

I'll need to add different types of log entry over time, for example for insert/delete of rows and columns, so I've included a `SpreadsheetLogEntry` type alias which will eventually be a union of the different types. 

# External Store

The React external store interface allows React components to read data from a store outside of React that changes over time. React components subscribe to the store to receive notifications when data changes. They read data from the store via an immutable snapshot that ensures that React renders a consistent view of the data. 

There are no promises or obviously asynchronous methods. However, this is still an asynchronous interface. The data in the store changes asynchronously and the consumer receives a callback when it changes. 

The React external store interface says nothing about how the data is modified. For `SpreadsheetData`, I added a simple `setCellValueAndFormat` method that modifies the data and triggers a callback. 

# EventSourcedSpreadsheetData Class

```ts
export class EventSourcedSpreadsheetData implements SpreadsheetData<EventSourcedSnapshot> {
  constructor (eventLog: EventLog<SpreadsheetLogEntry>) {
    this.#eventLog = eventLog;
  }

  getSnapshot(): EventSourcedSnapshot {
    return asSnapshot(this.#content);
  }

  #eventLog: EventLog<SpreadsheetLogEntry>;
  #content: EventSourcedSnapshotContent;
};
```

I'm following the same pattern as my other implementations of `SpreadsheetData`. The public interface exposes an opaque `EventSourcedSnapshot` type that represents an external store snapshot. Internally, we cast that to `EventSourcedContent` that defines all the internal implementation details. 

The event log used for storage is passed to the constructor. This allows clients to use whatever event log implementation they like. For our tracer bullet, we'll be using `SimpleEventLog` which we implemented [last time]({% link _posts/2025-05-26-asynchronous-event-log.md %}).

Passing the event log to the constructor also allows us to model the scenario where two different clients are editing the same stored data.

# Snapshot Content

My aim is to have an implementation that is directionally correct while being simple enough to quickly validate the approach. The React external store semantics require an immutable snapshot which is comparable using shallow equality and only changes when the data in the external store changes. 

The simplest approach is to maintain a snapshot that represents the current state. Return it whenever `getSnapshot` is called. Whenever the state changes, replace the current snapshot with a new one. Any previous snapshots that the client has references to remain unchanged.

Doing this efficiently requires a snapshot representation that has `O(1)` complexity. 

```ts
interface EventSourcedSnapshotContent {
  endSequenceId: SequenceId;
  logSegment: LogSegment;
  isComplete: boolean;
  rowCount: number;
  colCount: number;
}
```

This is where using an event log comes in handy. The snapshot holds a reference to a `LogSegment`. This contains log entries loaded from the event log which grows over time as more data is loaded. Multiple snapshots reference the same log segment. 

The snapshot behaves like an immutable representation because it also contains an end sequence id. It represents the spreadsheet that results from playing back log entries from the beginning of the segment to the specified end id, regardless of how many further entries the segment might contain. 

Loading all the data might require multiple queries to the event log. The `isComplete` member tracks whether the load is still in progress. Finally, `rowCount` and `colCount` are there for convenience. We keep track of the spreadsheet size as log entries are loaded.

# Log Segment

In a full event sourced system the current state is represented by a snapshot together with any log entries added since the snapshot was created. `LogSegment` is the in-memory representation of this state.

```ts
interface LogSegment {
  startSequenceId: SequenceId;
  entries: SpreadsheetLogEntry[];
  snapshot?: BlobId | undefined;
}
```

We don't have any snapshots yet, so for this tracer bullet we're only using the array of log entries. 

# Syncing Content

The heart of the implementation is loading data from the event log to create a new snapshot. This was simplest to implement as an asynchronous function.  

```ts
async #syncLogsAsync(): Promise<void> {
  this.#isInSyncLogs = true;

  // Set up load of first batch of entries
  const segment = this.#content.logSegment;
  let isComplete = false;

  while (!isComplete) {
    const curr = this.#content;
    const start = (segment.entries.length == 0) ? 'snapshot' : curr.endSequenceId;
    const result = await this.#eventLog.query(start, 'end');

    if (!result.isOk()) {
      // Depending on error may need to retry (limited times, jitter and backoff),
      // reload from scratch or panic
      throw Error("Error querying log entries");
    }

    // Extend the current loaded segment.
    // Once snapshots supported need to look out for new snapshot and start new segment
    const value = result.value;
    if (segment.entries.length == 0)
      segment.startSequenceId = value.startSequenceId;
    else if (curr.endSequenceId != value.startSequenceId)
      throw Error(`Query start ${value.startSequenceId}, expected ${curr.endSequenceId}`);
    isComplete = value.isComplete;

    if (value.entries.length > 0) {
      segment.entries.push(...value.entries);

      // Create a new snapshot based on the new data
      let rowCount = curr.rowCount;
      let colCount = curr.colCount;
      for (const entry of value.entries) {
        rowCount = Math.max(rowCount, entry.row+1);
        colCount = Math.max(colCount, entry.column+1);
      }

      this.#content = {
        endSequenceId: value.endSequenceId,
        logSegment: segment,
        isComplete, rowCount, colCount
      }

      this.#notifyListeners();
    }
  }

  this.#isInSyncLogs = false;
}
```

The basic structure is simple. We query the event log, either from the most recent snapshot, or from where we last got to. We add the values returned to the current log segment, update derived data like `rowCount` and `colCount`, create a new snapshot, notify subscribers and repeat until done. 

As this is a tracer bullet, error handling is sketchy for now. If we encounter any errors, we panic and throw, with the expectation that we'll get a failing unit test or uncaught error reported in the browser console.

We will invoke the sync operation from multiple places so we use `isInSyncLogs` as a guard variable to ensure we only have one sync process active at a time. The rest of the implementation invokes sync via the `syncLogs` wrapper function.

```ts
#syncLogs(): void {
  if (this.#isInSyncLogs)
    return;

  this.#syncLogsAsync().catch((reason) => { 
    throw Error("Rejected promise from #syncLogsAsync", { cause: reason }) 
  });
}
```

The initial load is invoked at the end of the `EventSourcedSpreadsheetData` constructor.

# Reading Data

```ts
#getCellValueAndFormatEntry(snapshot: EventSourcedSnapshot, row: number,
                            column: number): SetCellValueAndFormatLogEntry | undefined {
  const content = asContent(snapshot);
  const endIndex = Number(content.endSequenceId-content.logSegment.startSequenceId);
  for (let i = endIndex-1; i >= 0; i --) {
    const entry = content.logSegment.entries[i]!;
    if (entry.row == row && entry.column == column)
      return entry;
  }
  return undefined;
}
```

# Modifying Data

# Notifying Subscribers

# Unit Tests

# Event Source Sync Story

# Next Steps
