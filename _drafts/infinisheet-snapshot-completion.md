---
title: Snapshot Completion
tags: event-sourced-spreadsheet-data
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

We don't yet handle the case where a snapshot completes when a client is already up and running. The snapshot could have completed because this client triggered it, or another client did. How can clients find out that a snapshot workflow has completed? They'll pick up the new snapshot when they start up, but a long running client could end up with a huge log segment unless there's some kind of explicit notification.

# Insight

I considered adding a `workflowCompletion` event to the `EventLog` interface. Workflows running on the same instance as the host could have the worker post a message back to the host. Distributed implementations would need something like a web socket connection so that the server can notify clients.

That adds a lot of complexity and opens up a reliability problem. What if the snapshot completes, the event log is updated but the worker fails before the notification is sent? What if the notification gets lost? You need a fallback mechanism which polls for updates to the event log. If explicit notification is too unreliable or difficult to implement, you might use polling as the primary mechanism.

What does the engine do when it gets a completion event? The obvious thing would be to start a new log segment immediately, copy over events that happened since the snapshot and create a new content object. However, the content hasn't actually changed. All that's changed is details of our internal book keeping. UI clients will pointlessly re-render. Asynchronous operations like `syncLogs` and `addEntry` will abandon their results because it looks like some other operation has changed internal state behind their back.

Then I realized. It doesn't matter that there's been a new snapshot until there are more entries to add to the event log. I could have a pending flag and delay creating the pending new segment until the next time `syncLogs` or `addEntry` is called. That avoids both problems. Content is being updated anyway. The only change is to also create a new log segment.

Then I had another insight. The client doesn't need to know there's a new snapshot until there are more entries to add. There are only more entries to add as a result of calling `query` or `addEntry` on the event log. If we extend those methods so they can also return the most recent snapshot, then we don't need a separate polling call, and we don't need a separate workflow completion event.

# Tracer Bullet Rework

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

I added an optional `snapshotId` argument to `query` and `addEntry`. The idea is that clients can specify the snapshot that they depend on. The response includes `lastSnapshot` if there's a more recent snapshot that the client should switch to.

# Off by One

* Change event log so that snapshot is all entries preceding this one (same as history, exclusive range)
  * Entry with snapshot attached becomes useful again. It's the first change since snapshot taken
  * Should remove all the annoying +- 1n in the code
  * Log segment first entry is then the one with the snapshot
  * Downside: Can't have a snapshot of current state (unless you add special snapshot log entry)
  * Would it be better to always use a special snapshot entry and get rid of the per-entry metadata?

# Add Entry

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
      const logIndex = Number(curr.endSequenceId-logSegment.startSequenceId)
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

# Sync Logs


* Could be anywhere in the sync process
  * Initial load, `query('snapshot','end')`, already covered
  * Subsequent load, `query(curr, 'end')`. 
    * Snapshot id may be in log entry we already have. Same forking process as addEntry.
    * Snapshot id may be in entry returned by query. Create new segment from that entry, like initial load.
    * Snapshot id may be in entry beyond what was returned by query. Can continue sync so that we get everything and eventually pick up the snapshot, or ignore the entries in between and continue with `query('snapshot','end')`.
