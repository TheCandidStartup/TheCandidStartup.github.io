---
title: Infinisheet Tracer Bullet Snapshots
tags: infinisheet
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

Is it really, finally, time to create snapshots as my event sourced spreadsheet's event log grows? It seemed like I was never going to get here as I worked through [creating a blob store interface and reference implementation]({% link _posts/2025-07-07-infinisheet-blob-store.md %}), [creating a workers abstraction and interfaces]({% link _posts/2025-07-14-infinisheet-workers.md %}), [refactoring the spreadsheet internals so I could wire everything up cleanly]({% link _drafts/infinisheet-wiring-blob-store-workers.md %}) and [creating a cell map data structure with code for serializing snapshots]({% link _drafts/infinisheet-cell-map.md %}).

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

The first step in the workflow is loading the data needed to create a snapshot. The `syncLogs` method in `EventSourcedSpreadsheetEngine` handles this. The workflow has to create a snapshot for a specific version. However, `syncLogs` syncs to the latest version. I had to refactor to take an optional sequence id to sync to. 

The next problem is that `syncLogs` doesn't return a promise that the workflow can wait on. It was originally written for `EventSourcedSpreadsheetData` that doesn't have an async interface.

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

    // TODO: Check whether previous snapshot has completed. If not need to wait before
    // doing another. May need to retry previous snapshot.
  }

  return this.eventLog.addEntry(entry, this.content.endSequenceId);
}
```

I hacked together a quick unit test, with a small `snapshotInterval`, that changes enough spreadsheet values to trigger a snapshot. 

Now I need some way of loading them.

# Loading Snapshots

I factored out the code in `syncLogsAsync` that processes the value returned from querying the event log to create the `updateContent` helper function. It takes the current spreadsheet content and returns a new updated content object. To start, I added new code that handles the case where the returned entries start with a snapshot. This is what you'd expect during the initial load into the engine. 

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

I finished up by adding unit tests to verify that initializing a new `EventSourcedSpreadsheetData` from an event log with structure ends up with the same state as the original.

# Snapshot Completion

* How to know when a snapshot workflow has completed?
* Will pick up new snapshot implicitly when client starts up
* Long running client could end up with a huge log segment unless there's some kind of explicit notification
* Considered adding a `workflowCompletion` event to `EventLog`
* For workflows running on the same instance could have worker post a message back to the host
* For distributed implementation would need something like a web socket connection so server could notify client
* Opens up reliability problem. What if snapshot completes and event log updated but worker fails before notification sent or notification gets lost?
* Need a fallback mechanism which polls for update to event log. If web socket not possible, becomes primary mechanism.
* What does engine do when it gets completion event? It could start a new log segment immediately, copy over events that happened since snapshot and create a new content snapshot. However, content hasn't actually changed. Just internal stuff. Client pointlessly re-renders. Not end of the world but annoying.
* Insight: Doesn't matter that there's a new snapshot until there are more entries to add to the event log. 
* Have a pending flag and create the pending new segment whenever you're about to add entries to the event log. 
* Insight: Client doesn't need to know there's a new snapshot until there are more entries to add. There are only more entries to add as a result of calling `query` or `addEntry` on the event log.
* If we extend those methods so they can also return the most recent snapshot, then we don't need a separate polling call, and we don't need a separate workflow completion event.
* Add optional argument of sequence id of snapshot that the client is currently using. If there's a most recent snapshot, it gets added to response.
* Works nicely with multiple clients too




