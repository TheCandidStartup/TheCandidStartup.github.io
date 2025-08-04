---
title: Tracer Bullet Snapshots
tags: infinisheet
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

It's finally time to create snapshots as my event sourced spreadsheet's event log grows. It seemed like I was never going to get here. There's a laundry list of pre-work that I needed to complete first.

* [Creating a blob store interface and reference implementation]({% link _posts/2025-07-07-infinisheet-blob-store.md %})
* [Creating a workers abstraction and interfaces]({% link _posts/2025-07-14-infinisheet-workers.md %})
* [Refactoring the spreadsheet internals so I could wire everything up cleanly]({% link _posts/2025-07-21-infinisheet-wiring-blob-store-workers.md %})
* [Creating a cell map data structure with code for serializing snapshots]({% link _posts/2025-08-04-infinisheet-cell-map.md %}).

Let's go.

# Workflow Errors

I started by trying to implement the snapshot creation workflow in my place holder `EventSourcedSpreadsheetWorkflow`. I quickly ran into problems with the current interfaces. I'd extracted the lowest common denominator abstraction for `InfiniSheetWorker.onReceiveMessage`. The web worker's `postMessage` API has no return value, so `onReceiveMessage` doesn't either. 

As soon as I started implementing the workflow, I was calling lower level functions that could fail. It felt wrong to just bail out on error. Some implementations, like DynamoDB to Lambda, can automatically retry failures. There's no way to take advantage of that if there's no return value.

```ts
export type MessageHandler<MessageT extends WorkerMessage> = 
  (message: MessageT) => ResultAsync<void,InfinisheetError>;

export interface InfiniSheetWorker<MessageT extends WorkerMessage> {
  onReceiveMessage: MessageHandler<MessageT> | undefined;
}
```

I added a return value. It's up to specific worker implementations to decide what to do with any error. My reference implementation just logs and throws an exception. It's not expected to fail. 

# Loading data into the Engine

The first step in the workflow is loading the data needed to create a snapshot. The `syncLogs` method in `EventSourcedSpreadsheetEngine` handles this. The workflow has to create a snapshot for a specific version. However, `syncLogs` syncs to the latest version. I refactored it to take an optional sequence id to sync to. 

The next problem is that `syncLogs` doesn't return a promise that the workflow can wait on. It was originally written for `EventSourcedSpreadsheetData` which doesn't have an async interface.

```ts
export abstract class EventSourcedSpreadsheetEngine {
  protected syncLogs(endSequenceId?: SequenceId): void;
  protected async syncLogsAsync(endSequenceId?: SequenceId): Promise<void>;
}
```

I split `syncLogs` into `syncLogs` and `syncLogsAsync`. `syncLogs` is a wrapper around `syncLogsAsync` that blows up if a rejected promise escapes from `syncLogsAsync`. Callers can choose whether they want the full async interface of `syncLogsAsync` or the fire and forget `syncLogs`.

Note that `syncLogsAsync` returns a `Promise` rather than a `ResultAsync`. This is internal code so doesn't need to follow [our convention]({% link _posts/2025-05-19-asynchronous-typescript.md %}) for public APIs. I'm finding that most of the code I write uses `async ... await`, which doesn't need the additional features provided by `ResultAsync`.

# Snapshot Workflow

`onReceiveMessage` is effectively a public API, so I do the additional work of wrapping the `Promise` returned by my `async` implementation in a `ResultAsync`.

```ts
private onReceiveMessage(message: PendingWorkflowMessage): ResultAsync<void,InfinisheetError> {
  if (message.workflow !== 'snapshot')
    throw Error(`Unknown workflow ${message.workflow}`);

  return new ResultAsync(this.onReceiveMessageAsync(message));
}
```

With all that out of the way, implementing the workflow is simple enough. We make sure the data we need is loaded, use `CellMap` to serialize a snapshot for us, write it to the blob store and finally write the blob id into the event log, clearing the `pending` workflow request.


```ts
private async onReceiveMessageAsync(message: PendingWorkflowMessage): Promise<Result<void,InfinisheetError>> {
  const endSequenceId = message.sequenceId + 1n;
  await this.syncLogsAsync(endSequenceId);
  if (this.content.loadStatus.isErr())
    return err(this.content.loadStatus.error);
  if (!this.content.loadStatus.value)
    throw Error("Somehow syncLogs() is still in progress despite promise having resolved");

  const logSegment = this.content.logSegment;
  const snapshotIndex = Number(endSequenceId - logSegment.startSequenceId);
  const blob = logSegment.cellMap.saveSnapshot(snapshotIndex);
  const name = message.sequenceId.toString();

  const dir = await this.blobStore.getRootDir();
  if (dir.isErr())
    return err(dir.error);

  const blobResult = await dir.value.writeBlob(name, blob);
  if (blobResult.isErr())
    return err(blobResult.error);

  return this.eventLog.setMetadata(message.sequenceId, { pending: undefined, snapshot: name });
}
```

Expected errors are returned, exceptional errors (that should never happen) are thrown. The snapshot is written to a blob using the name of the corresponding sequence id. The idea is to make the workflow idempotent. If the workflow is retried, exactly the same output is produced.

# Multiple Spreadsheets

Which got me thinking. How would this work if our client allows the user to create multiple spreadsheets? For a start, we'd need a separate blob directory for each spreadsheet. We store the snapshot `BlobId` in the event log. How does the event log know which directory to look in to load the blob?

`EventLog` doesn't look anywhere. It doesn't care how `BlobId` is interpreted. The layer above decides how to tie `EventLog` and `BlobStore` together. The simplest way of managing multiple spreadsheets is to use upper layers of the blob store as a user visible file system: folders containing spreadsheets. No new abstraction needed. Makes it easy to implement a folder hierarchy. 

We can store per-spreadsheet metadata in a blob inside the per-spreadsheet directory. The metadata can include an `EventLog` id in whatever database is being used to store the event logs. Once the user has navigated to the spreadsheet they want to open, the client creates an `EventLog` instance and `BlobStore` using the metadata, then creates and wires up an `EventSourcedSpreadsheetData` instance. As far as `EventSourcedSpreadsheetData` is concerned, there's only a single spreadsheet.

# Triggering Snapshots

I'm starting with the simple strategy of creating a snapshot after some number of log entries have been written. I added an `options` argument to the `EventSourcedSpreadsheetData` constructor as I can feel more configuration coming on.

```ts
export interface EventSourcedSpreadsheetDataOptions {
  /** Minimum number of log entries before creation of next snapshot 
   * @defaultValue 100
  */
  snapshotInterval?: number | undefined;
}
```

I added a new `addEntry` helper method which checks whether a snapshot is required before forwarding the call on to the event log. 

```ts
private addEntry(entry: SpreadsheetLogEntry): ResultAsync<void,AddEntryError> {
  if (this.workerHost) {
    const index = this.content.logSegment.entries.length % this.snapshotInterval;
    if (this.snapshotInterval === index + 1)
      entry.pending = 'snapshot';
  }

  return this.eventLog.addEntry(entry, this.content.endSequenceId);
}
```

I hacked together a quick unit test, with a small `snapshotInterval`, that changes enough spreadsheet values to trigger a snapshot. 

Now I need some way of loading them.

# Loading Snapshots

I factored out the code in `syncLogsAsync` that updates in-memory content to create the `updateContent` helper function. It takes the current spreadsheet content and returns a new updated content object. To start with, I added code that handles the case where the returned entries start with a snapshot. This is what you'd expect to see when you first load data into the engine. 

Here's the overall structure.

```ts
async function updateContent(curr: EventSourcedSnapshotContent, 
  value: QueryValue<SpreadsheetLogEntry>, blobStore: BlobStore<unknown>):
   Promise<Result<EventSourcedSnapshotContent,StorageError>> {

  let segment = curr.logSegment;
  let rowCount = curr.rowCount;
  let colCount = curr.colCount;

  const snapshot = value.entries[0]!.snapshot;
  if (snapshot) {
    // New code for loading from snapshot
    ...
  } else {
    // Original code that appends new log entries
    ...
  }

  return ok({
    endSequenceId: value.endSequenceId,
    logSegment: segment,
    loadStatus: ok(value.isComplete),
    rowCount, colCount
  });
}
```

This is the new code that loads the snapshot.

```ts
  segment = { startSequenceId: value.startSequenceId, entries: value.entries.slice(1), 
    cellMap: new SpreadsheetCellMap, snapshot };
  const dir = await blobStore.getRootDir();
  if (dir.isErr())
    return err(dir.error);
  const blob = await dir.value.readBlob(snapshot);
  if (blob.isErr()) {
    const type = blob.error.type;
    if (type === 'BlobWrongKindError' || type === 'InvalidBlobNameError')
      throw Error("Blob store all messed up", { cause: blob.error })
    return err(blob.error);
  }
  segment.cellMap.loadSnapshot(blob.value);
  segment.cellMap.addEntries(segment.entries, 0);
  ({ rowMax: rowCount, columnMax: colCount } = 
    segment.cellMap.calcExtents(segment.entries.length));
```

We start by creating a new log segment. It gets initialized with the log entries *after* the snapshot entry and an empty cell map. We then load the snapshot into the cell map, returning or throwing errors as appropriate. Finally, we add in the new log entries. Any references to old content objects remain valid as they continue to reference the old log segment. 

I'd forgotten that the content object also contains row and column counts. I added a `calcExtents` method to `CellMap` and used that to determine the counts. The alternative would be to serialize them into the snapshot. Let's wait and see if there's any reason to change.

I finished up by adding unit tests to verify that initializing a new `EventSourcedSpreadsheetData` from an event log with a snapshot ends up with the same state as the original.

# Snapshot Completion

We don't yet handle the case where a snapshot completes when a client is already up and running. The snapshot could have completed because this client triggered it, or another client did. How can clients find out that a snapshot workflow has completed? They'll pick up the new snapshot when they start up, but a long running client could end up with a huge log segment unless there's some kind of explicit notification.

I considered adding a `workflowCompletion` event to the `EventLog` interface. Workflows running on the same instance as the host could have the worker post a message back to the host. Distributed implementations would need something like a web socket connection so that the server can notify clients.

That adds a lot of complexity and opens up a reliability problem. What if the snapshot completes, the event log is updated but the worker fails before the notification is sent? What if the notification gets lost? You need a fallback mechanism which polls for updates to the event log. If explicit notification is too unreliable or difficult to implement, you might use polling as the primary mechanism.

What does the engine do when it gets a completion event? The obvious thing would be to start a new log segment immediately, copy over events that happened since the snapshot and create a new content object. However, the content hasn't actually changed. All that's changed is details of our internal book keeping. UI clients will pointlessly re-render. Asynchronous operations like `syncLogs` and `addEntry` will abandon their results because it looks like some other operation has changed internal state behind their back.

Then I realized. It doesn't matter that there's been a new snapshot until there are more entries to add to the event log. I could have a pending flag and delay creating the pending new segment until the next time `syncLogs` or `addEntry` is called. That avoids both problems. Content is being updated anyway. The only change is to also create a new log segment.

Then I had another insight. The client doesn't need to know there's a new snapshot until there are more entries to add. There are only more entries to add as a result of calling `query` or `addEntry` on the event log. If we extend those methods so they can also return the most recent snapshot, then we don't need a separate polling call, and we don't need a separate workflow completion event.

This is where the tracer bullet and reference implementation approach really shines. I can change the `EventLog` interface easily. Updating a reference implementation is trivial. There's no database schemas to worry about. No deployed infrastructure. Minimal sunk cost.

```ts
export interface SnapshotValue {
  sequenceId: SequenceId;
  blobId: BlobId;
}

export interface QueryValue<T extends LogEntry> {
  ...
  lastSnapshot?: SnapshotValue | undefined;
}

export interface AddEntryValue {
  lastSnapshot?: SnapshotValue | undefined;
}

export interface EventLog<T extends LogEntry> {
  ...
  addEntry(entry: T, sequenceId: SequenceId, 
    snapshotId?: SequenceId): ResultAsync<AddEntryValue,AddEntryError>;

  query(start: SequenceId | 'snapshot' | 'start', end: SequenceId | 'end', 
    snapshotId?: SequenceId): ResultAsync<QueryValue<T>,QueryError>;
}
```

I added an optional `snapshotId` argument to `query` and `addEntry`. The idea is that clients can specify the snapshot that they depend on. The response includes a `SnapshotValue` if there's a more recent snapshot that the client should switch to.

# Creating New Log Segments

## Add Entry

* If call succeeds we must have written new head of log, which means any new snapshot must have completed in historic log entries we already have.
* Create new segment by forking off current log segment after snapshot
* Careful how you split things up. My first attempt put all the generic event log manipulation in my `EventSourcedSpreadsheetData.addEntry` helper method. Like a good functional async citizen, I added a `.map` clause to the end of the call to `EventLog.addEntry`. All the `SetCellValueAndFormat` specific logic then gets chained to the end of that in `SetCellValueAndFormat`.
* I've split the replacement of one set of immutable content with another across two async tasks. Luckily, in two of my unit tests a `syncLogs` call completed between the two, with hilarious consequences.
* Moral: Make sure that change from one valid state to another happens within the same async task. I extracted the common forking logic into a non-async `forkSegment` helper function instead.

```ts
  const entry: SetCellValueAndFormatLogEntry = 
    { type: 'SetCellValueAndFormat', row, column, value, format };
  return this.addEntry(curr, entry).map((addEntryValue) => {
    if (this.content === curr) {
      // Nothing else has updated local copy (no async load has snuck in), 
      // so safe to do it myself avoiding round trip with event log
      const logSegment = addEntryValue.lastSnapshot 
        ? forkSegment(curr.logSegment, addEntryValue.lastSnapshot) : curr.logSegment;
      logSegment.entries.push(entry);
      const logIndex = Number(curr.endSequenceId-curr.logSegment.startSequenceId)
      logSegment.cellMap.addEntry(row, column, logIndex, value, format);

      this.content = {
        endSequenceId: curr.endSequenceId + 1n,
        logSegment,
        loadStatus: ok(true),
        rowCount: Math.max(curr.rowCount, row+1),
        colCount: Math.max(curr.colCount, column+1)
      }

      this.notifyListeners();
    }
  })
```

## Sync Logs

* Change event log so that snapshot is all entries preceding this one (same as history, exclusive range)
  * Entry with snapshot attached becomes useful again. It's the first change since snapshot taken
  * Should remove all the annoying +- 1n in the code
  * Log segment first entry is then the one with the snapshot
  * Downside: Can't have a snapshot of current state (unless you add special snapshot log entry)
  * Would it be better to always use a special snapshot entry and get rid of the per-entry metadata?
* Could be anywhere in the sync process
  * Initial load, `query('snapshot','end')`, already covered
  * Subsequent load, `query(curr, 'end')`. 
    * Snapshot id may be in log entry we already have. Same forking process as addEntry.
    * Snapshot id may be in entry returned by query. Create new segment from that entry, like initial load.
    * Snapshot id may be in entry beyond what was returned by query. Can continue sync so that we get everything and eventually pick up the snapshot, or ignore the entries in between and continue with `query('snapshot','end')`.
