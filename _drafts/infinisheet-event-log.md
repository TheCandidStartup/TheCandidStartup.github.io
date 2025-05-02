---
title: InfiniSheet Event Log
tags: infinisheet
thumbnail: /assets/images/infinisheet/log-entry.png
---

[So far]({% link _posts/2025-04-28-react-spreadsheet-error-handling.md %}), my scalable [spreadsheet implementation]({% link _topics/infinisheet.md %}) has concentrated entirely on the frontend. Time to start looking at the backend, starting with the persistence model. 

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
I've been thinking about this for a long time. I did my initial round of [brainstorming]({{ bb_url }}) and planning two years ago. I'm going to use [Event Sourcing]({{ bb_url | append: "#event-sourcing" }}) to store the sequence of operations applied to a spreadsheet. Every so often I'll create a [snapshot]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) of the current state. I can then load the spreadsheet at any point in time by loading a snapshot and applying changes from that point on in the event log.

I figured out how to make snapshots work with [insertion and deletion of rows]({% link _posts/2023-06-05-spreadsheet-insert-delete.md %}), and how to [transform and merge snapshots]({% link _posts/2023-07-03-spreadsheet-merge-import.md %}) efficiently.

I'm finally ready to start implementing.

# InfiniSheet Architecture

{% include candid-image.html src="/assets/images/infinisheet/infinisheet-types-architecture.svg" alt="InfiniSheet Architecture" %}

This project involves the same core code running in [many different contexts]({% link _posts/2024-07-29-infinisheet-architecture.md %}). To support that I define interfaces that are used to abstract away differences in implementation in each context.

Persistent data storage is built on a `blob-store` and an `event-log`. The `blob-store` lets you store and retrieve arbitrary blobs of data. The `event-log` is an ordered log of events.

The `workers` interface provides an abstraction for running background jobs in parallel.

The highest level interface is `spreadsheet-data`. You've already [seen how]({% link _posts/2024-10-07-react-spreadsheet-data-model.md %}) my React based scalable frontend interacts with data through the `SpreadsheetData` interface.

I'm currently using a [simple reference implementation]({% link _posts/2025-03-10-react-spreadsheet-editable-data.md %}) of `SpreadsheetData` for testing and demos of the frontend. Now I'm going to build a production implementation of `SpreadsheetData` in the `event-sourced-spreadsheet-data` module. 

# Event Log

Before I can do that, I need to define the `BlobStore` and `EventLog` interfaces, together with reference implementations. I'm going to start with `EventLog`.

I've already [sketched out]({% link _posts/2023-08-07-spreadsheet-event-log.md %}) how you could implement an event log using DynamoDB. Now I'm going to define a more abstract interface that could be implemented using [DynamoDB](https://aws.amazon.com/dynamodb/), [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [SQLite](https://sqlite.org/) or an in-memory reference implementation.

{% include candid-image.html src="/assets/images/infinisheet/event-log.svg" alt="Event Log" %}

Conceptually, it's pretty simple. An event log consists of an ordered set of entries, identified by incremental sequence ids. Each entry represents some type of operation applied to the spreadsheet data. The entry has a `type` field which defines the type of operation and a corresponding type specific payload. Once a log entry has been added, type and payload are immutable.

There are three optional metadata fields. The `snapshot` field contains the id of a blob of data in the `blob-store`.  The blob is the root of a snapshot of the complete log up to and including this entry. The `history` field is also a blob id. This blob is the first in a chain of blobs containing the history of the log up to the previous entry. 

A snapshot is a cache of the state of the spreadsheet at the corresponding log entry. It allows clients to load a visible subset of the spreadsheet quickly and efficiently. In contrast, history is just a set of previous log entries serialized into a cheap blob rather than an expensive database.

The `pending` field is used to orchestrate background workflows. Writing the name of the desired workflow into `pending` triggers the corresponding workflow and clears the field when complete. The `Snapshot` workflow reads the previous snapshot, applies all the log entries since then and writes a new snapshot. 
Similarly, the `History` workflow serializes entries since the last history into a blob and records the id in the `history` field.

Clients need to query the log. Initially, they will read from the most recent entry with a snapshot to the head of the log. They can then load the snapshot and replay the subsequent log entries. After that, they stay in sync with the current state of the spreadsheet by querying from the most recent entry they have to the head of the log.

Once snapshots have been created and all active clients have synced to a more recent log entry, the section of the log before the snapshot is no longer needed.  The log can be truncated immediately before a snapshot, with history available in the blob store if required.

# Log Entry

Each log entry's metadata is defined by the `LogMetadata` type. 

```ts
export type BlobId = string;
export type WorkflowId = string;

export interface LogMetadata {
  snapshot?: BlobId | undefined;
  history?: BlobId | undefined;
  pending?: WorkflowId | undefined;
}
```

A `LogEntry` extends the metadata by adding a `type` field used as a discriminated union tag that distinguishes the different types of entry.

```ts
export interface LogEntry extends LogMetadata {
  type: string;
};
```

The event log doesn't care how many different types there are or what their payloads are. It serializes whatever it's been given. Any additional [enumerable own](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties) properties are considered to be payload.

# Errors

I've cleaned up and extended the error framework I created [last time]({% link _posts/2025-04-28-react-spreadsheet-error-handling.md %}).

```ts
export interface InfinisheetError {
    /** Discriminated union tag */
    type: string,

    /** End user message describing the problem */
    message: string,
}

export interface InfinisheetRangeError extends InfinisheetError {
  type: 'InfinisheetRangeError',
};
```

There's now a common base type and a new `InfinisheetRangeError` for out of range data access. The slightly clumsy naming is because there's already a built in JavaScript `RangeError` which is [thrown by the runtime](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RangeError) from some API calls. My error types are for use with [Rust style `Result` types]({% link _posts/2025-04-22-infinisheet-error-handling.md %}) and don't need the additional baggage of call stacks and the like. 

# Event Log Interface

Log entries are identified by sequence id. I'm using `bigint` as my sequence id type. [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) is a new JavaScript primitive for arbitrary precision integers, added in ES2020. 

This is almost certainly overkill. You would need to deal with millions of transactions a second to get anywhere close to exhausting the 56 bit integers supported by `number`. However, why take the risk when support for bigger integers is right there? DynamoDB's [number type](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html#HowItWorks.DataTypes) supports up to 38 significant digits (equivalent to 128 bit integers), so there are scenarios where the extra precision would be useful. 

```ts
export type SequenceId = bigint;

export interface EventLog<T extends LogEntry> {
  addEntry(entry: T, sequenceId: SequenceId): Result<void,AddEntryError>;
  setMetadata(sequenceId: SequenceId, metaData: LogMetadata): Result<void,MetadataError>;
  query(start: SequenceId | 'snapshot' | 'start', end: SequenceId | 'end'): Result<QueryValue<T>,QueryError>;
  truncate(start: SequenceId): Result<void,TruncateError>
}
```

The interface is generic on the types of `LogEntry` that will be stored. It has four methods to implement.

## Add Entry

The `addEntry` method adds a new log entry to the head of the log. You must specify the sequence id corresponding to the next free entry. This restriction provides a simple form of [conflict resolution]({% link _posts/2023-10-02-consistency-conflict-resolution-event-source.md %}). If someone else has added entries to the log since you last read it, the call to `addEntry` will fail with a `ConflictError`.

```ts
export interface ConflictError extends InfinisheetError {
  type: 'ConflictError',

  nextSequenceId: SequenceId;
};

export type AddEntryError = ConflictError | StorageError;
```

The error object includes the current next free sequence id so you can sync back up and try again.

## Set Metadata

The `setMetadata` method lets you change the values of some or all of the metadata properties. Changes are atomic. Either all the specified properties are changed or none of them are. 

Remember that `type` and payload are immutable.

```ts
export type MetadataError = InfinisheetRangeError | StorageError;
```

## Query Value

The `query` method lets you retrieve a subset of the entries in the log. You specify the desired range of entries and `query` responds with a `QueryValue`.

```ts
export type QueryError = InfinisheetRangeError | StorageError;


export interface QueryValue<T extends LogEntry> {
  /**  Sequence id corresponding to the first entry in `entries` */
  startSequenceId: SequenceId;

  /** Sequence id after the final entry in `entries` */
  endSequenceId: SequenceId;

  /** True if all the available entries have been returned */
  isComplete: boolean;

  /** The entries returned by the query */
  entries: T[];
}
```

Implementations are free to limit the number of entries that can be returned. `QueryValue` specifies the range of entries actually returned. If the response is not complete, you should query again starting from `endSequenceId`.

Clients will query for `('snapshot', 'end')` to get the entries needed to load a spreadsheet from scratch. They will then repeatedly query for `(endSequenceId, 'end')` to incrementally apply changes from other clients.

Clients can page through the entire log using their own page size by starting with `('start', PAGE_SIZE)` and then `(endSequenceId, endSequenceId+PAGE_SIZE)` until `isComplete`.

## Truncate

The `truncate` method removes entries from the beginning of the log, usually sometime after `snapshot` and `history` have been created for the specified entry. After truncation, the specified entry becomes the first in the log but retains it's existing sequence id. 

```ts
/** Errors that can be returned by {@link EventLog} `truncate` method */
export type TruncateError = InfinisheetRangeError | StorageError;
```

# Workflows

Workflows are triggered by writing a workflow name into the `pending` field. Anything beyond that vague high level description is implementation specific. An implementation based on DynamoDB might use DynamoDB streams to trigger a lambda which then invokes the workflow. A browser based implementation might write to IndexedDB and post a message to a web worker. 

All the messy details of deploying the different parts of the system and hooking them together is deferred to a higher level.

# Reference Implementation

As usual, I used a simple reference implementation to validate and flesh out the interface. It took several rounds of iterate and repeat before I ended up with the current interface and implementation. 

```ts
export class SimpleEventLog<T extends LogEntry> implements EventLog<T> {
  constructor() {
    this.#startSequenceId = 0n;
    this.#endSequenceId = 0n;
    this.#entries = [];
  }

  ...

  #startSequenceId: SequenceId;
  #endSequenceId: SequenceId;
  #entries: T[];
}
```

The event log is stored in an array in memory. I also keep track of the start and end sequence ids corresponding to the first entry in the array and one past the last entry.

## Add Entry

Implementation of `addEntry` is trivial. Nothing more to say. 

```ts
addEntry(entry: T, sequenceId: SequenceId): Result<void,AddEntryError> {
  if (sequenceId !== this.#endSequenceId)
    return err(conflictError("sequenceId is not next sequence id", this.#endSequenceId));

  this.#entries.push(entry);
  this.#endSequenceId ++;
  return ok();
}
```

## Set Metadata

Weirdly, this turned out to be the trickiest method to implement. The caller passes in an object containing metadata properties that it wants to apply. The complication is that we only want to assign to the metadata properties that exist in the object passed as an argument. If you write the obvious three assignment statements you end up implicitly setting other metadata properties to `undefined`. 

My first try was to iterate over the properties (keys) that exist at runtime.

```ts
setMetadata(sequenceId: SequenceId, metadata: LogMetadata): Result<void,MetadataError> {
  if (sequenceId < this.#startSequenceId || sequenceId >= this.#endSequenceId)
    return err(eventLogRangeError(`Log entry with sequenceId ${sequenceId} does not exist`));

  const index = Number(sequenceId - this.#startSequenceId);
  const entry = this.#entries[index]!;
  let key: keyof LogMetadata;
  for (key in metadata)
    entry[key] = metadata[key];

  return ok();
}
```

There's an interesting quirk of TypeScript here. You can't specify a type for `key` within the `for .. in` statement. If you don't specify a type at all it's inferred as `string` and you get a TypeScript error when you try to access `metadata[key]`. If you explicitly type the key as `keyof LogMetadata` it works. 

TypeScript makes it look like this is safe, but it isn't. What if you pass an object that is compatible with `LogMetadata` but has additional properties?

```ts
log.setMetadata(0n, { snapshot: undefined, index: 42 });
```

This attempt to modify payload properties fails with the TypeScript error `Object literal may only specify known properties, and 'index' does not exist in type 'LogMetadata'`. However, that reference to "Object literal" seems overly precise.

```ts
class ExtraPropsMetaData implements LogMetadata {
  constructor() { this.index = 42; }
  index: number;
  snapshot?: string | undefined;
}

log.setMetadata(0n, new ExtraPropsMetaData);
```

Sure enough, TypeScript is happy with this and the index field does get assigned. The implementation needs to be more paranoid. You can restrict the copied properties to just those defined directly on the object with `Object.assign(entry,metadata)`. Much simpler. Still wrong.

Ideally I'd be able to convert `keyof LogMetadata` into a list of properties names that I can use at runtime. However, runtime metadata conflicts with TypeScript's design goals. In the end I wrote it out by hand. Clunky but obviously correct.

```ts
if ("snapshot" in metadata)
  entry.snapshot = metadata.snapshot;
if ("history" in metadata)
  entry.history = metadata.history;
if ("pending" in metadata)
  entry.pending = metadata.pending;
```

## Query

Query is the longest method. There's a few different ways to specify the range you want to query and support for paging. 

The first step is to convert `'snapshot'`, `'start'` and `'end'` into the corresponding sequence ids and validate that the query is in range.

I wanted to test how the interface behaves when the implementation exercises its right to return partial data. I've implemented a hardcoded maximum page size of 10.

```ts
const QUERY_PAGE_SIZE = 10;

query(start: SequenceId | 'snapshot' | 'start', 
      end: SequenceId | 'end'): Result<QueryValue<T>,QueryError> {
  if (start === 'start')
    start = this.#startSequenceId;
  else if (start === 'snapshot')
    start = this.#startSequenceId + BigInt(this.findSnapshotIndex());
  else if (start < this.#startSequenceId || start > this.#endSequenceId)
    return err(infinisheetRangeError("start index out of range"));

  if (end === 'end')
    end = this.#endSequenceId;

  const num = end - start;
  const isComplete = num <= BigInt(QUERY_PAGE_SIZE);
  let numToReturn = isComplete ? Number(num) : QUERY_PAGE_SIZE;
  const firstIndex = Number(start - this.#startSequenceId);
  if (firstIndex + numToReturn > this.#entries.length)
    numToReturn = this.#entries.length - firstIndex;

  const value: QueryValue<T> = {
    startSequenceId: start,
    endSequenceId: start + BigInt(numToReturn),
    isComplete,
    entries: this.#entries.slice(firstIndex, firstIndex + numToReturn)
  }

  return ok(value);
}

private findSnapshotIndex(): number {
  for (let i = this.#entries.length - 1; i > 0; i--) {
    const entry = this.#entries[i]!;
    if (entry.snapshot)
      return i;
  }

  return 0;
}
```

## Truncate

I've removed the boring error checking and edge cases, leaving the core truncation logic.

```ts
truncate(start: SequenceId): Result<void,TruncateError> {
  ...

  const numToRemove = start - this.#startSequenceId;
  this.#startSequenceId = start;
  this.#entries.splice(0, Number(numToRemove));
  return ok();
}
```

We remove the required number of entries from the array and adjust `startSequenceId` to match. The end result is that the sequence id for each remaining entry stays the same after truncation.

# Unit Tests

Unit testing is an important part of the iteration loop. It lets you validate the interface from the caller's point of view and validate the reference implementation. After a few rounds of testing and iterating, I ended up with a design I'm happy with and 100% test coverage of my reference implementation.

# Next Time

In my rush to define an elegant interface and validate it with a reference implementation, I've overlooked something vital. Real production implementations will need to persist log entries to a file, or database or over the network. All of which are asynchronous operations. 

My interface needs to be asynchronous too. As does the workflow orchestration that I've yet to implement. We'll get into all that next time.
