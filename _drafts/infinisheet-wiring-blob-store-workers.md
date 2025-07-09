---
title: Wiring up the Blob Store and Workers
tags: infinisheet
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

Now that I have interfaces and reference implementations for a [Blob Store]({% link _posts/2025-07-07-infinisheet-blob-store.md %}) and [Workers]({% link _drafts/infinisheet-workers.md %}), we can try to wire them up to our [tracer bullet prototype]({% link _posts/2025-06-02-event-sourced-spreadsheet-data.md %}). 

{% include candid-image.html src="/assets/images/infinisheet/event-sourced-spreadsheet-data-tracer-bullet.svg" alt="Event Sourced Spreadsheet Data Tracer Bullet Development" %}

The aim here is to see whether the pieces fit together properly. Do the interfaces need to be tweaked? Does the existing structure extend gracefully? If it's not right, we should fix it now, while change is still cheap.

{% include candid-image.html src="/assets/images/infinisheet/workers.svg" alt="InfiniSheet Workers" %}

We have a wiring diagram from last time. Let's see how it goes.

# EventLog and WorkerHost

How `EventLog` interacts with `WorkerHost` to trigger workflows is implementation specific. There's no point trying to shoehorn some kind of one size fits all interface into `EventLog`. Wiring everything together is the client's responsibility, so we don't lose anything by excluding it from the `EventLog` interface.

We've [already decided]({% link _drafts/infinisheet-workers.md %}) that our `SimpleEventLog` reference implementation will use a `PostMessageWorkerHost` to explicitly send messages to a `Worker`. Here's what that looks like.

```ts
export class SimpleEventLog<T extends LogEntry> implements EventLog<T> {
  constructor(workerHost?: PostMessageWorkerHost<PendingWorkflowMessage>)

  private sendPendingWorkflowMessage(workflow: WorkflowId, sequenceId: SequenceId) {
    if (this.workerHost) {
      const message: PendingWorkflowMessage = 
        { type: 'PendingWorkflowMessage', sequenceId, workflow }
      this.workerHost.postMessage(message);
    }
  }

  workerHost?: PostMessageWorkerHost<PendingWorkflowMessage> | undefined;
}
```

`SimpleEventLog` works with any `PostMessageWorkerHost` implementation that supports `PendingWorkflowMessage`. Usually this will be an instance of `SimpleWorkerHost`.

# Event Sourced Spreadsheet Data

Our wiring diagram shows two instances of `EventSourcedSpreadsheetData`, one host side, one worker side. We need to be able to instantiate `EventSourcedSpreadsheetData` with either a `WorkerHost`, an `InfiniSheetWorker` or `undefined` (if there are no local workflows).

```ts
export class EventSourcedSpreadsheetData implements SpreadsheetData<EventSourcedSnapshot> {
  constructor (eventLog: EventLog<SpreadsheetLogEntry>, blobStore: BlobStore<unknown>, 
    workerOrHost?: WorkerHost<PendingWorkflowMessage> | InfiniSheetWorker<PendingWorkflowMessage>)
}
```

Which it turn means we need some way to distinguish between `WorkerHost` and `InfiniSheetWorker` at runtime. The cleanest way is to add a [type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) method to `WorkerHost` and `InfiniSheetWorker`.

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

This already feels wrong. Why did I decide to use an instance of `EventSourcedSpreadsheetData` in both host and worker? Well, because it was the easiest approach. All the code for loading the state of a spreadsheet from an `EventLog` lives there. 

That's an implementation reason. Does it make conceptual sense? Why does the worker need an implementation of the `SpreadsheetData` interface? 

It doesn't. It works at a lower level. I'm mixing multiple concerns in the same class.

I already have the problem that `EventSourcedSpreadsheetData` is getting too big to manage. I can't keep throwing everything into the same module. 

If I had separate `EventSourcedSpreadsheetData` and `EventSourcedSpreadsheetWorkflow` classes, I could get rid of the ugly runtime checks. `EventSourcedSpreadsheetData` requires a `WorkerHost`, `EventSourcedSpreadsheetWorkflow` requires a `Worker`. I just need to factor out the common code.

# Refactoring EventSourcedSpreadsheetData

I split the existing code into three separate components. All the common low level code lives in `EventSourcedSpreadsheetEngine`, which `EventSourcedSpreadsheetData` and `EventSourcedSpreadsheetWorkflow` inherit from. 

I chose this structure to make the refactoring as simple as possible. It's mostly a case of deciding which declarations and methods go in which source file. It's easy to move things around if I get the initial split wrong. Once things settle down, it might make more sense for `EventSourcedSpreadsheetEngine` to be a member of `EventSourcedSpreadsheetData` and `EventSourcedSpreadsheetWorkflow` rather than a base class.

The only awkward bit of the refactoring is that `syncLogs` belongs in `EventSourcedSpreadsheetEngine` but calls `notifyListeners` which depends on the  implementation in `EventSourcedSpreadsheetData`. The easy way out was to declare `notifyListeners` as an abstract method in `EventSourcedSpreadsheetEngine`.

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

Now `EventSourcedSpreadsheetData` can concentrate on implementing the `SpreadsheetData` interface, using the in-memory representation of the spreadsheet provided by `EventSourcedSpreadsheetEngine`.

```ts
export class EventSourcedSpreadsheetData extends EventSourcedSpreadsheetEngine 
                                         implements SpreadsheetData<EventSourcedSnapshot> {
  constructor (eventLog: EventLog<SpreadsheetLogEntry>, blobStore: BlobStore<unknown>, 
               workerHost?: WorkerHost<PendingWorkflowMessage>) {
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

That leaves `EventSourcedSpreadsheetWorkflow` as pretty much a blank slate waiting to be filled in.

```ts
export class EventSourcedSpreadsheetWorkflow  extends EventSourcedSpreadsheetEngine {
  constructor (eventLog: EventLog<SpreadsheetLogEntry>, blobStore: BlobStore<unknown>, 
               worker: InfiniSheetWorker<PendingWorkflowMessage>) {
    super(eventLog, blobStore);

    this.worker = worker;

    worker.onReceiveMessage = 
      (message: PendingWorkflowMessage) => { this.onReceiveMessage(message); }
  }

  protected notifyListeners(): void {}

  private onReceiveMessage(_message: PendingWorkflowMessage): void {
  }

  protected worker: InfiniSheetWorker<PendingWorkflowMessage>;
}
```

There's a clean separation between host and worker. Which means there's no need for the type predicate in the worker interfaces.

# TypeScript Interlude

 Ironically, the presence of the type predicate was the only thing stopping TypeScript from throwing its toys out of the pram. Currently, there's nothing in the `WorkerHost` interface because I haven't figured out what will be needed yet. I know that I'll have some kind of worker host implementation without an explicit `postMessage`, but not how that will surface in the interface, if at all.

 Once I removed the type predicate, I was left with an interface with literally nothing in it.

```ts
export interface WorkerHost<MessageT extends WorkerMessage> { 
}
```

That makes TypeScript very unhappy. First, there's an error because we have an unused generic parameter. If you get round that, you get an error when passing `SimplWorkerHost` to the `EventSourcedSpreadsheetData` constructor which expects a `WorkerHost`. TypeScript complains that the two interfaces have "no properties in common". Which I guess is technically true because `WorkerHost` has no properties at all. 

I tried hacking something in to keep TypeScript happy and ended up with this monstrosity. 

```ts
export interface WorkerHost<MessageT extends WorkerMessage> { 
  /** @internal */
  __messageType: MessageT | null;
}
```

I also need to declare and initialize the junk property in `SimpleWorkerHost`. In the end, I went back to keeping a pointless type predicate as the least ugly workaround. I can remove it once I've found something useful to add. If it turns out there isn't anything, I can ditch `WorkerHost` completely.

```ts
export interface WorkerHost<MessageT extends WorkerMessage> { 
  isHost(): this is WorkerHost<MessageT>
}
```

# Unit Test

The `EventSourcedSpreadsheetData` unit test was the first opportunity to wire everything up. Each test starts with a one-liner that creates the instance to test. I extracted that into a separate creator function as there's significantly more work to do.

```ts
function creator() {
  const blobStore = new SimpleBlobStore;
  const worker = new SimpleWorker<PendingWorkflowMessage>;
  const host = new SimpleWorkerHost(worker);
  const eventLog = new SimpleEventLog<SpreadsheetLogEntry>(workerHost);

  new EventSourcedSpreadsheetWorkflow(eventLog, blobStore, worker);

  return new EventSourcedSpreadsheetData(eventLog, blobStore, host);
}
```

There's now six components to connect, rather than just two. Straightforward enough apart from the `EventSourcedSpreadsheetWorkflow` instance. It looks like it's unused. However, the constructor connects it to the worker's `onReceiveMessage`. The worker is referenced by the host which in turn is referenced by the returned `EventSourcedSpreadsheetData`.

I couldn't come up with a more obvious alternative without making the code more complex. Eventually, I expect it will be hidden behind some higher level utility function. 

# Event Source Sync Story

My other existing example is the Storybook "Event Source Sync" story. This simulates two separate spreadsheet clients connected to a common backend accessed over a network with significant latency. Gratifyingly, all the pieces fit together cleanly.

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

On the backend we have a blob store and event log connected to a simple worker host feeding a workflow instance. Each client is represented by an `EventSourcedSpreadsheetData` that accesses the backend event log and blob store with simulated network delay. I don't have a delay wrapper for blob stores yet but it will be easy enough to add once I have a real snapshot implementation.

# Next Time

I have all the components wired up but the new pieces aren't doing anything yet. `SimpleEventLog` needs to trigger snapshot workflows, and `EventSourcedSpreadsheetWorkflow` needs to process them. Once I have snapshots being created, `EventSourcedSpreadsheetEngine` will need to start reading them. 

However, before I can do any of that, I need a real in-memory representation of spreadsheet data to load into. I can then serialize it into a blob as a first stab at creating a snapshot. We'll tackle that next time.
