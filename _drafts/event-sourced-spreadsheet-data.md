---
title: Event Sourced Spreadsheet Data
tags: infinisheet
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

I've been working on my [scalable spreadsheet]({% link _topics/spreadsheets.md %}) project from opposite ends. So far, most of my focus has been on the front end. I've created a virtualized [React spreadsheet]({% link _topics/react-spreadsheet.md %}) component that can scale to trillions of rows and columns. The component accesses spreadsheet data via a [SpreadsheetData]({% link _posts/2024-09-30-react-spreadsheet-data-interface.md %}) interface based on React's [external store](https://react.dev/reference/react/useSyncExternalStore) interface.

I've just started work on the back end. I've defined an [EventLog]({% link _posts/2025-05-26-asynchronous-event-log.md %}) interface that I *think* provides a good abstraction layer for a variety of implementations.

Now I need to fill in the details between the two. The big idea is to use [event sourcing]({% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}) with [regular snapshots]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) to provide an optimal balance between efficient coarse grained storage and fine grained updates.

# Tracer Bullet

The full concept needs additional back end abstractions. A blob store for the snapshots, with some kind of background workers to create them. However, we can do some [tracer bullet development](https://builtin.com/software-engineering-perspectives/what-are-tracer-bullets) using just the event log. Consider the first few edits to a spreadsheet, before the first snapshot is created. The only storage involved at this stage is the log. 

We're going to create an implementation of the `SpreadsheetData` interface built on just the `EventLog` and see what happens. Are there any obvious holes in the `EventLog` interface? Is there an [impedance mismatch](https://startup-house.com/glossary/what-is-impedance-mismatch) between the two interfaces that makes implementation awkward? Can we see a path forward to add snapshots?

{% include candid-image.html src="/assets/images/infinisheet/event-sourced-spreadsheet-data-tracer-bullet.svg" alt="Event Sourced Spreadsheet Data Tracer Bullet Development" %}

# External Store

The React external store interface allows React components to read data from a store outside of React that changes over time. React components subscribe to the store to receive notifications when data changes. They read data from the store via an immutable snapshot that ensures that React renders a consistent view of the data. 

There are no promises or obviously asynchronous methods. However, this is still an asynchronous interface. The data in the store changes asynchronously and the consumer receives a callback when it changes. 

The React external store interface says nothing about how the data is modified. For `SpreadsheetData`, I added a simple `setCellValueAndFormat` method that modifies the data and triggers a callback. 

In contrast, the `EventLog` interface is explicitly asynchronous. Every method returns a `ResultAsync`, which is a wrapper around a `Promise<Result>`.

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

With an event log, reads are no longer `O(1)`. In general, you have to load the most recent snapshot and replay subsequent events. You'll need some kind of cache to mitigate the costs. 

We're not going to look at any of that right now. For now, we just look back through the event log to find the most recent entry for the cell we want to read.

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

getCellValue(snapshot: EventSourcedSnapshot, row: number, column: number): CellValue {
  const entry = this.#getCellValueAndFormatEntry(snapshot, row, column);
  return entry?.value;
}

getCellFormat(snapshot: EventSourcedSnapshot, row: number, column: number): string | undefined {
  const entry = this.#getCellValueAndFormatEntry(snapshot, row, column);
  return entry?.format;
}
```

# Modifying Data

This is where we hit our first real impedance mismatch. The `setCellValueAndFormat` method is synchronous, returning a `Result<void,SpreadsheetDataError>`. There's no way to return errors from asynchronous calls to the event log. For now, let's plough on and see if there's anything else we can learn.

```ts
setCellValueAndFormat(row: number, column: number, value: CellValue, 
                      format: string | undefined): Result<void,SpreadsheetDataError> {
  const curr = this.#content;

  const result = this.#eventLog.addEntry(
    { type: 'SetCellValueAndFormat', row, column, value, format}, curr.endSequenceId);

  result.andTee(() => {
    if (this.#content == curr) {
      // Nothing else has updated local copy (no async load has snuck in),
      // so safe to do it myself avoiding round trip with event log
      curr.logSegment.entries.push(
        { type: 'SetCellValueAndFormat', row, column, value, format});

      // Snapshot semantics preserved by treating EventSourcedSnapshot as an immutable
      // data structure which is replaced with a modified copy on every update.
      this.#content = {
        endSequenceId: curr.endSequenceId + 1n,
        logSegment: curr.logSegment,
        isComplete: true,
        rowCount: Math.max(curr.rowCount, row+1),
        colCount: Math.max(curr.colCount, column+1)
      }

      this.#notifyListeners();
    }
  }).orElse((err) => { throw Error(err.message); });

  return ok();
}
```

We add an entry to the event log based on the arguments to `setCellValueAndFormat`. We use `ResultAsync` chaining methods to update our in-memory log segment and snapshot if the operation succeeds, or panic and throw if it fails. 

Subscribers are notified asynchronously, unlike the synchronous notification in the current reference implementation. 

# Incremental Sync

So far, we've loaded data from the event log once when an `EventSourcedSpreadsheetData` is created. We need to sync periodically to pick up any changes made by other clients. Long term, I'll probably add some kind of subscribe abstraction to `EventLog` too. For now, I used `setInterval` to trigger sync every 10 seconds.

Being a good citizen, I needed some way to start and stop the interval timer so that it was only running while needed. The simplest approach was to piggy back on the `SpreadsheetData` subscribe method. 

```ts
subscribe(onDataChange: () => void): () => void {
  if (!this.#intervalId)
    this.#intervalId = setInterval(() => { this.#syncLogs() }, EVENT_LOG_CHECK_DELAY);
  this.#listeners = [...this.#listeners, onDataChange];
  return () => {
    this.#listeners = this.#listeners.filter(l => l !== onDataChange);
    if (this.#listeners.length == 0 && this.#intervalId !== undefined) {
      clearInterval(this.#intervalId);
      this.#intervalId = undefined;
    }
  }
}
```

We start the interval timer running when the first listener is added, and stop it when the last listener is removed.

# Unit Tests

I have existing unit tests for my reference implementation of `SpreadsheetData`. I immediately ran into problems with the now asynchronous implementation of `setCellValueAndFormat`. I could make the unit tests asynchronous, but without returning a promise, there's no easy way to wait for the operation to complete. 

```ts
function tasksProcessed(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve);
  })
}

it('should implement SetCellValueAndFormat', async () => {
  const data = new EventSourcedSpreadsheetData(new SimpleEventLog<SpreadsheetLogEntry>);
  expect(data.setCellValueAndFormat(0, 0, "In A1", undefined).isOk()).toEqual(true);
  await tasksProcessed();

  expect(data.setCellValueAndFormat(0, 1, 42, "YYYY-MM-DD").isOk()).toEqual(true);
  await tasksProcessed();

  const snapshot = data.getSnapshot();
  expect(data.getRowCount(snapshot)).toEqual(1);
})
```

The first thing I got working was a brute force approach. My `SimpleEventLog` reference implementation uses resolved promises, which means that all asynchronous operations complete as microtasks before returning to the main event loop. All I need to do is wait for a callback from the main event loop. Obviously, this won't work for an implementation that involves real asynchronous IO, but is enough to let me move forward with the tracer bullet.

I also experimented with waiting for subscribers to be notified of a change. This is better, but clumsy and too much of a blunt instrument.

```ts
function subscribeFired(data: SpreadsheetData<unknown>): Promise<void> {
  return new Promise((resolve) => {
    const unsubscribe = data.subscribe(() => {
      unsubscribe();
      resolve();
    })
  })
}

it('should support snapshot semantics', async () => {
  const data = new EventSourcedSpreadsheetData(new SimpleEventLog<SpreadsheetLogEntry>);
  const snapshot1 = data.getSnapshot();
  const snapshot2 = data.getSnapshot();
  expect(Object.is(snapshot1, snapshot2)).toEqual(true);
  expect(data.getRowCount(snapshot1)).toEqual(0);

  expect(data.setCellValueAndFormat(0, 0, "In A1", undefined).isOk()).toEqual(true);
  await subscribeFired(data);

  const snapshot3 = data.getSnapshot();
  expect(Object.is(snapshot2, snapshot3)).toEqual(false);
  expect(data.getRowCount(snapshot1)).toEqual(0);
  expect(data.getRowCount(snapshot3)).toEqual(1);
})
```

# Event Source Sync Story

Once the unit tests were working, all that was left was to try a complete end to end sample. I love how easy this is with [Storybook]({% link _posts/2025-01-13-bootstrapping-storybook.md %}). 

```ts
const eventLog = new SimpleEventLog<SpreadsheetLogEntry>;
const eventSourcedDataA = new EventSourcedSpreadsheetData(eventLog);
const eventSourcedDataB = new EventSourcedSpreadsheetData(eventLog);
```

I created a couple of `EventSourcedSpreadsheetData` instances that share the same event log.

```ts
export const EventSourceSync: Story = {
  args: {
    theme: theme,
    width: 700,
    height: 380,
  },
  argTypes:{
    data: {
      table: {
        disable: true
      },
    },
  },
  tags: ['!autodocs'],
  render: ( {width: width, height: height, data: _data, ...args} ) => (
    <div>
      <VirtualSpreadsheet width={width} height={height} data={eventSourcedDataA} {...args}/>
      <div style={{ marginTop: 10, marginBottom: 10 }}>
        Shared Event Log, Sync every 10 seconds
      </div>
      <VirtualSpreadsheet width={width} height={height} data={eventSourcedDataB} {...args}/>
    </div>
  ),
};
```

Then I added a story that renders two spreadsheets, one with each data source. As this is a special case story, I removed the ability to override the `data` prop and excluded it from the auto generated *Docs* page.

# Try It!

Visit the [Event Source Sync](https://www.thecandidstartup.org/infinisheet/storybook/?path=/story/react-spreadsheet-virtualspreadsheet--event-source-sync) story. Or play with the embedded version right here.

{% include candid-iframe.html src="https://thecandidstartup.org/infinisheet/storybook/iframe?id=react-spreadsheet-virtualspreadsheet--event-source-sync" width="100%" height="840" %}

Type some values into cells in the top spreadsheet. Use `Enter` to commit your changes and move to the next cell. Wait (for up to 10 seconds) until your changes appear in the bottom spreadsheet. Now, type into the bottom spreadsheet and see the values replicate into the top spreadsheet.

Do it again, but this time don't wait for the values to replicate. Switch to the other spreadsheet and start making changes. Notice that your changes don't take effect when you hit `Enter`. If you open up the console in browser develop tools you should see an error message, "`Uncaught (in promise) Error: sequenceId is not next sequence id`".

The call to `setCellValueAndFormat` is failing with a conflict error because the spreadsheet is out of sync with the event log. The error isn't handled so the spreadsheet behaves as normal, moving on to the next cell, but as the value hasn't changed the display reverts back to the original value. The unhandled error propagates up to the event loop where the browser logs it to the console.

Once the spreadsheet has caught up with the event log, everything starts working again. 

# Next Steps

We completed our tracer bullet and got an end to end example working, after a fashion. It's clear that we need to make some changes.

The read path should be straightforward. We can handle intermittent errors within `syncLogs`, retrying a limited number of times. Whatever state we end up with is always consistent, if out of date. There's no need to directly return errors from the read methods. Instead, we can provide an additional method that exposes the snapshot `isComplete` state, together with a user displayable error message that describes the current state of the connection to the back end.

If all retries fail, we give up until the next sync interval and then try again. If there's a persistent failure, it would be best to pause the periodic sync and leave it up to the user to manually retry. 

The write path needs a change of API. The `setCellValueAndFormat` method needs to be made explicitly asynchronous by returning a `ResultAsync` instead of a `Result`. That makes it clear to the caller that the operation is asynchronous, gives them an easy way to wait for the operation to complete and lets them respond accordingly if there's an error. 

That will lead to a whole set of knock on changes. We can tackle those next time.
