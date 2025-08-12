---
title: Snapshot Completion
tags: event-sourced-spreadsheet-data
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

We [don't yet]({% link _posts/2025-08-11-infinisheet-tracer-bullet-snapshots.md %}) handle the case where a snapshot completes when a client is already up and running. The snapshot could have completed because this client triggered it, or another client did. How can clients find out that a snapshot workflow has completed? They'll pick up the new snapshot when they start up, but a long running client could end up with a huge log segment unless there's some kind of explicit notification.

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

Before I make use of the new interface, I have a bit of refactoring to do. Have another look at my in-memory log segment representation. Each segment starts with a snapshot of everything up to and including the log entry that stores the snapshot. 

{% include candid-image.html src="/assets/images/infinisheet/cell-map.svg" alt="Cell Map Data Structure" %}

That has some unfortunate implications. Whenever we retrieve the latest log entries starting with the most recent snapshot, the content of the first entry is useless because it's already included in the snapshot. In fact, we throw it away and start the in-memory log segment with the next entry. That in turn requires lots of annoying plus and minus ones in the code, making it easy to introduce off by one errors.

{% include candid-image.html src="/assets/images/infinisheet/snapshot-off-by-one.svg" alt="Log segment when snapshot includes all prior entries" %}

I changed the event log so that snapshots include all entries *preceding* this one. It now works the same as history metadata and is consistent with our use of exclusive ranges when specifying snapshots. 

# Add Entry

Completed snapshots returned from `addEntry` is the easy case. The `addEntry` call can only succeed if we're writing to the head of the log, which means any new snapshot must have completed for a historic log entry we already have. We can create a new log segment by forking the current log segment starting from the snapshot entry.

{% include candid-image.html src="/assets/images/infinisheet/fork-log-segment.svg" alt="Fork existing log segment to create new one starting from snapshot" %}

I learnt the hard way that you need to be extra careful when factoring code into separate async functions. My first attempt put all the generic event log manipulation in my `EventSourcedSpreadsheetData.addEntry` helper method. Eventually, I'll have lots of `SpreadsheetData` operations which add entries to the log. Like a good functional async citizen, I added a `.map` clause to the end of the call to `EventLog.addEntry`, continuing to return a promise. 

The `SetCellValueAndFormat` API calls the `addEntry` helper and chains its own logic onto the response. All delightfully elegant.

The problem is that I'm replacing one set of immutable content with another, but splitting the work across two async tasks. Other async tasks may complete in between, with hilarious consequences. 

Luckily, this blew up immediately in my existing unit tests, providing a valuable learning moment. 

{% capture note-content %}
Make sure that any change from one valid state to another happens within the same async task.
{% endcapture %}
{% include candid-note.html content=note-content %}

I changed course, and extracted the common forking logic into a non-async `forkSegment` helper function instead.

```ts
export function forkSegment(segment: LogSegment, snapshot: SnapshotValue): LogSegment {
  const index = Number(snapshot.sequenceId - segment.startSequenceId);
  if (index < 0 || index >= segment.entries.length)
    throw Error("forkSegment: snapshotId not within segment");

  const newSegment: LogSegment = 
    { startSequenceId: snapshot.sequenceId, 
      entries: segment.entries.slice(index), 
      cellMap: new SpreadsheetCellMap, 
      snapshot: snapshot.blobId };

  newSegment.cellMap.loadAsSnapshot(segment.cellMap, index);
  newSegment.cellMap.addEntries(newSegment.entries, 0);

  return newSegment;
}
```

As well as creating a new log segment, we also need to create a new cell map. It should have the same content as loading from the snapshot and adding the entries in the segment. I implemented `SpreadsheetCellMap.loadAsSnapshot` which is the more efficient equivalent to `saveSnapshot` followed by `loadSnapshot`.

All I needed then was to add one line to the heart of the existing `SetCellValueAndFormat` function. 

```ts
  return this.addEntry(curr, entry).map((addEntryValue) => {
    if (this.content === curr) {
      const logSegment = addEntryValue.lastSnapshot 
        ? forkSegment(curr.logSegment, addEntryValue.lastSnapshot) : curr.logSegment;

      // Same as previous code
      ...
    }
  })
```

# Sync Logs

`syncLogs` is more complex. We could be anywhere in the sync process when the snapshot completes. We already handle the initial load case where we call `query('snapshot','end')` and get back a set of entries starting with a snapshot. 

The cases we need to look at are during subsequent loads, where we're calling `query(curr, 'end', currentSnapshotId)`. If the response includes a more recent `lastSnapshot`, there are three new cases to handle.
  1. Snapshot id may be in log entry we already have. We can use the same forking process as `addEntry`.
  2. Snapshot id may be in entry returned by query. We need to create a new segment from that entry, like initial load.
  3. Snapshot id may be in entry beyond what was returned by query. We can continue sync so that we get everything and eventually pick up the snapshot, or ignore the entries in between and continue with `query('snapshot','end')`. 

For now, I'm going to assume we'll be close to the head of the log and avoid having to download and parse snapshots. In future we'll probably need a mechanism to give up and reload from the latest snapshot if the client falls too far behind.

I had a few false starts but eventually found that I could slot the logic needed neatly into the `updateContent` method I introduced [last time]({% link _posts/2025-08-11-infinisheet-tracer-bullet-snapshots.md %}). It goes immediately before the existing code that appends entries retrieved from the event log to the in-memory representation. 

```ts
  if (value.lastSnapshot) {
    const { sequenceId } = value.lastSnapshot;
    if (sequenceId < curr.endSequenceId) {
      segment = forkSegment(segment, value.lastSnapshot);
    } else if (sequenceId < value.endSequenceId) {
      const indexInValue = Number(sequenceId - startSequenceId);
      const baseIndex = segment.entries.length;
      for (let i = 0; i < indexInValue; i ++) {
        const entry = entries[i]!;
        rowCount = Math.max(rowCount, entry.row+1);
        colCount = Math.max(colCount, entry.column+1);
        segment.cellMap.addEntry(entry.row, entry.column, 
          baseIndex+i, entry.value, entry.format);
      }
      entries = entries.slice(indexInValue);
      const cellMap = new SpreadsheetCellMap;
      cellMap.loadAsSnapshot(segment.cellMap, baseIndex+indexInValue);
      const emptyArray: SpreadsheetLogEntry[] = [];
      segment = { startSequenceId: startSequenceId + BigInt(indexInValue), 
        entries: emptyArray, cellMap, snapshot: value.lastSnapshot.blobId };
    }
  }

  // Original code that appends `entries` to `segment`
```

The logic covers all three cases identified above. The first clause handles case 1 by forking the existing log segment. The second clause handles case 2. We add entries up to the snapshot to the previous segment's cell map and use that to initialize the new segment. We slice the new entries so that they start with the snapshot and leave it to the existing append code to add them to the new segment. 

The third case is handled by doing nothing. There is a new snapshot but it's somewhere in a later page of results. We fall through and just append all the entries as normal. Eventually the snapshot page will be processed and handled by the second clause.

# Unit Tests

As always I added unit tests that cover all the different cases. Again, as always, I found and fixed lots of bugs in my initial implementation. 

# Next Time

The basic framework and data flow is in place. Now we need to make it properly scalable. We're off to a good start with the log segment representation. That gives us a bound on the number of log entries in memory. However, the cell map and snapshot blob are currently unbounded. 

We'll start by setting up the cell map so that it can contain just the subset of the spreadsheet we're actively working with. For example, the content of the current viewport in the UI. Obviously, as the viewport changes we'll end up reloading the cell map from the latest snapshot and log segment. To make that scalable we'll need to break the snapshot into multiple blobs so we can load just what's needed.

