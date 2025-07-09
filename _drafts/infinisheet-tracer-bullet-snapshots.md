---
title: InfiniSheet Tracer Bullet Snapshots
tags: infinisheet
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

wise words

# EventLog and WorkerHost

* How `EventLog` interacts with `WorkerHost` to trigger workflows is implementation specific. No point trying to shoehorn some kind of one size fits all interface into `EventLog`. Wiring everything together is the client's responsibility so not losing anything by excluding from `EventLog` scope.
* Here's what it looks like for `SimpleEventLog`.

```ts
export class SimpleEventLog<T extends LogEntry> implements EventLog<T> {
  constructor(workerHost?: PostMessageWorkerHost<PendingWorkflowMessage>)

  workerHost?: PostMessageWorkerHost<PendingWorkflowMessage> | undefined;
}
```

* It can work with any `PostMessageWorkerHost` that supports `PendingWorkflowMessage`. Usually this will be an instance of `SimpleWorkerHost`.

# EventLog BlobId

* Expects to identify snapshot and history blob using a `BlobId` which is a `string`
* Gives flexibility to the next level up for how they want to use this
* If I do File System style, what would my `BlobId` be?
* If I'm only thinking about a single spreadsheet then for snapshots it would be name of blob in `snapshots` dir, for history it would be name of blob in `history` dir. Simple enough.
* What about multiple spreadsheets? How does `EventLog` know which `snapshots` dir to look in? 
* `EventLog` doesn't look anywhere. It doesn't care how `BlobId` is interpreted. Layer above decides how to tie `EventLog` and `BlobStore` together
* Simplest way of managing multiple spreadsheets is to use upper layers of blob store as a user visible file system: folders containing spreadsheets. No new abstraction needed. Easy to implement folder hierarchy. 
* Store per-spreadsheet metadata in a blob insider per-spreadsheet directory. Metadata can include `EventLog` id in whatever database is being used.
* Don't need to identify which spreadsheet in `BlobId` because we start from spreadsheet to get `EventLog`. Layer above will already know which `BlobDir` to use with `BlobId` in event log. 

# Event Sourced Spreadsheet Data integration

* Two instances of ESSD, one host side, one worker side
* First cut constructs with choice of WorkerHost, Worker or undefined (no local workflows)

```ts
export class EventSourcedSpreadsheetData implements SpreadsheetData<EventSourcedSnapshot> {
  constructor (eventLog: EventLog<SpreadsheetLogEntry>, blobStore: BlobStore<unknown>, 
    workerOrHost?: WorkerHost<PendingWorkflowMessage> | InfinisheetWorker<PendingWorkflowMessage>)
}
```

* Then need some way to distinguish between the two cases. The cleanest way is to add a [type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) method to `WorkerHost` and `InfinisheetWorker`.

```ts
  isWorker(): this is InfiniSheetWorker<MessageT>
```

Then you can write code like this in `EventSourcedSpreadsheetData`

```ts
export class EventSourcedSpreadsheetData implements SpreadsheetData<EventSourcedSnapshot> {
  constructor (eventLog: EventLog<SpreadsheetLogEntry>, blobStore: BlobStore<unknown>, 
    workerOrHost?: WorkerHost<PendingWorkflowMessage> | InfiniSheetWorker<PendingWorkflowMessage>) {

  if (workerOrHost?.isWorker()) {
    workerOrHost.onReceiveMessage = (message: PendingWorkflowMessage) => { this.onReceiveMessage(message); }
  }
}
```

* Is this best approach?
* Why do I have instance of `EventSourcedSpreadsheetData` in both host and worker? Because it contains all the code for loading the state of a spreadsheet from an `EventLog` and `BlobStore`. That's an implementation reason. Does it make conceptual sense. Why does the worker need an implementation of the `SpreadsheetData` interface? It doesn't, its working at a lower level.
* Already have the problem that `EventSourcedSpreadsheetData` is getting too big. Can't keep throwing everything in there.
* Alternative is to split the code three ways. Have an `EventSourcedSpreadsheetEngine` with all the low level code for manipulating the spreadsheet representation. Then on top of that build `EventSourcedSpreadsheetData` and `EventSourcedSpreadsheetWorkflow`. 
* Now I can get rid of those ugly runtime `isWorker` checks. 
* Alternative is to have `EventSourcedSpreadsheetBase` with basically all current code
  * Then `EventSourcedSpreadsheetData` extends with constructor that takes `WorkerHost | undefined`
  * Plus new `EventSourcedSpreadsheetWorkflow` extends with constructor that takes `Worker`
* Static vs dynamic behavior differences
* Splitting into three classes makes it easier to split code into separate files to make it more maintainable

# Refactoring EventSourcedSpreadsheetData

* Refactored so that `EventSourcedSpreadsheetData` and `EventSourcedSpreadsheetWorkflow` inherit from `EventSourcedSpreadsheetEngine`. Longer term it might make more sense for engine to be a member. For now, wanted to minimize the number of changes needed. Largely a case of deciding which declarations and methods go in which source file.
* Only awkward bit is that `syncLogs` belongs in `EventSourcedSpreadsheetEngine` but calls `notifyListeners` which depends on implementation in `EventSourcedSpreadsheetData`. Simplest thing was to declare it as an abstract method in `EventSourcedSpreadsheetEngine`.

```ts
export abstract class EventSourcedSpreadsheetEngine {
  constructor (eventLog: EventLog<SpreadsheetLogEntry>, blobStore: BlobStore<unknown>) {
    this.isInSyncLogs = false;
    this.eventLog = eventLog;
    this.blobStore = blobStore;
    this.content = {
      endSequenceId: 0n,
      logSegment: { startSequenceId: 0n, entries: [] },
      loadStatus: ok(false),
      rowCount: 0,
      colCount: 0
    }
  }

  protected syncLogs(): void { ... }

  protected abstract notifyListeners(): void

  protected eventLog: EventLog<SpreadsheetLogEntry>;
  protected blobStore: BlobStore<unknown>;
  protected content: EventSourcedSnapshotContent;
  private isInSyncLogs: boolean;
}
```

Then `EventSourcedSpreadsheetData` can concentrate on implementing the `SpreadsheetData` interface using the in-memory representation of the spreadsheet provided by `EventSourcedSpreadsheetEngine`.

```ts
export class EventSourcedSpreadsheetData  extends EventSourcedSpreadsheetEngine implements SpreadsheetData<EventSourcedSnapshot> {
  constructor (eventLog: EventLog<SpreadsheetLogEntry>, blobStore: BlobStore<unknown>, workerHost?: WorkerHost<PendingWorkflowMessage>) {
    super(eventLog, blobStore);

    this.intervalId = undefined;
    this.workerHost = workerHost;
    this.listeners = [];

    this.syncLogs();
  }

  ...

  protected notifyListeners() {
    for (const listener of this.listeners)
      listener();
  }

  protected workerHost?: WorkerHost<PendingWorkflowMessage> | undefined;
  private intervalId: ReturnType<typeof setInterval> | undefined;
  private listeners: (() => void)[];
}
```

That leaves `EventSourcedSpreadsheetWorkflow` as pretty much a blank sheet waiting to be filled in.

```ts
export class EventSourcedSpreadsheetWorkflow  extends EventSourcedSpreadsheetEngine {
  constructor (eventLog: EventLog<SpreadsheetLogEntry>, blobStore: BlobStore<unknown>, worker: InfiniSheetWorker<PendingWorkflowMessage>) {
    super(eventLog, blobStore);

    this.worker = worker;

    worker.onReceiveMessage = (message: PendingWorkflowMessage) => { this.onReceiveMessage(message); }
  }

  protected notifyListeners(): void {}

  private onReceiveMessage(_message: PendingWorkflowMessage): void {
  }

  protected worker: InfiniSheetWorker<PendingWorkflowMessage>;
}
```

Clean separation between host and worker. No longer need the type predicate. Ironically, the presence of the type predicate is the only thing stopping TypeScript from throwing it's toys out of the pram. 
* Error due to generic parameter not being used
* Error when passing `SimpleWorkerHost` to `EventSourcedSpreadsheetData` constructor which expects a `WorkerHost`. They have "no properties in common".
* Tried various ways to keep TypeScript happy. Most minimal was 

```ts
export interface WorkerHost<MessageT extends WorkerMessage> { 
  /** @internal */
  __messageType: MessageT | null;
}
```

* Required property to be declared and initialized in `SimpleWorkerHost` implementation. In the end went back to using a type predicate as the least ugly workaround. Can always junk `WorkerHost` completely if it turns out there's nothing that `EventSourcedSpreadsheetData` needs from it.

```ts
export interface WorkerHost<MessageT extends WorkerMessage> { 
  isHost(): this is WorkerHost<MessageT>
}
```

# Unit Test

```ts
function creator() {
  const eventLog = new SimpleEventLog<SpreadsheetLogEntry>;
  const worker = new SimpleWorker<PendingWorkflowMessage>;
  const host = new SimpleWorkerHost(worker);
  const blobStore = new SimpleBlobStore;
  eventLog.workerHost = host;
  
  // Constructor subscribes to worker's onReceiveMessage which keeps it alive
  new EventSourcedSpreadsheetWorkflow(eventLog, blobStore, worker);

  return new EventSourcedSpreadsheetData(eventLog, blobStore, host);
}
```

# Event Source Sync Story

```ts
// Backend
const blobStore = new SimpleBlobStore;
const worker = new SimpleWorker<PendingWorkflowMessage>;
const workerHost = new SimpleWorkerHost(worker);
const eventLog = new SimpleEventLog<SpreadsheetLogEntry>(workerHost);
new EventSourcedSpreadsheetWorkflow(eventLog, blobStore, worker);

// Client A
const delayEventLogA = new DelayEventLog(eventLog);
const eventSourcedDataA = new EventSourcedSpreadsheetData(delayEventLogA, blobStore);

// Client B
const delayEventLogB = new DelayEventLog(eventLog);
const eventSourcedDataB = new EventSourcedSpreadsheetData(delayEventLogB, blobStore);
```

# Next Time

* Wired up all the components but nothing actually happening yet
* Need to trigger snapshot workflow
* Need to implement workflow to create snapshot
* Need to update spreadsheet loading code to read snapshot as well as event log
* Before all that, need a real in-memory representation of spreadsheet data to load into.
