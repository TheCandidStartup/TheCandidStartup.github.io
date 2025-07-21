---
title: InfiniSheet Workers
tags: infinisheet
thumbnail: /assets/images/infinisheet/workers-thumbnail.png
---

I'm building an [event sourced spreadsheet]({% link _topics/spreadsheets.md %}) on a [foundation]({% link _posts/2024-07-29-infinisheet-architecture.md %}) of an event log, a blob store and background workers. I've defined `EventLog` and `BlobStore` interfaces with reference implementations. Now it's the turn of background workers.

# The Big Picture

{% include candid-image.html src="/assets/images/infinisheet/infinisheet-types-architecture.svg" alt="InfiniSheet Architecture" %}

The core logic for the spreadsheet lives in the `event-sourced-spreadsheet-data` module. This is common code that will be used by frontend web and desktop clients, together with backend NodeJS and AWS servers. Low level platform dependencies are abstracted away behind `EventLog`, `BlobStore` and `Workers` interfaces. Each client is responsible for choosing the specific implementations used, together with any other infrastructure and platform dependencies.

{% include candid-image.html src="/assets/images/infinisheet/event-sourced-spreadsheet-data-tracer-bullet.svg" alt="Event Sourced Spreadsheet Data Tracer Bullet Development" %}

I used [tracer bullet development]({% link _posts/2025-06-02-event-sourced-spreadsheet-data.md %}) to build an end to end prototype of a web client. I implemented just enough of `event-sourced-spreadsheet-data` to connect my `VirtualSpreadsheet` React component to spreadsheet data stored in an `EventLog` reference implementation. 

I have a `BlobStore` [reference implementation]({% link _posts/2025-07-07-infinisheet-blob-store.md %}) ready to go. I just need to come up with an abstraction for background workers so that I can trigger a background job that reads an `EventLog` and creates a snapshot by writing blobs into a `BlobStore`.

# Use Case

Everything is orchestrated by the event log. A snapshot workflow is triggered by writing an event log entry with `'Snapshot'` in the `pending` field. The workflow creates the snapshot and then uses an atomic write to the log to clear the `pending` field and to store a reference to the root snapshot blob in the `snapshot` field.

{% include candid-image.html src="/assets/images/infinisheet/event-log.svg" alt="Event Log" %}

Naturally this whole process needs to be reliable. Once the triggering write is successfully committed, the workflow *WILL* eventually complete. Errors should be retried and recovered from, failed workflows restarted, etc.

Let's look at how this might work for a few clients and see if we can find a common abstraction.

# Web Client

The web client will use [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) for background jobs. Web workers run in parallel with the main event loop, using a separate context. They're typically implemented using a separate thread or process. 

You create a dedicated worker by passing a URL for the script you want to run. The main app and worker can communicate with each other using `postMessage`.The worker has access to the same local data storage and network resources as the main app. 

Our web client needs to start the worker with code that imports the `event-sourced-spreadsheet-data` module. The worker creates an `EventSourcedSpreadsheetData` instance that uses the same local data storage for `EventLog` and `BlobStore` as the main app.

The client sets an `EventLog` callback that posts a message to the worker specifying a workflow name and event log sequence id. The worker receives the message and invokes the appropriate workflow using its `EventSourcedSpreadsheetData` instance to manipulate the `EventLog` and `BlobStore`. 

It's possible to use multiple workers if needed. We'll start with a single dedicated worker. The assumption is that the worker is only needed to prevent blocking of the main event loop. Snapshot creation should complete long before another snapshot is needed.

Error handling is fairly simple. The app should restart the web worker if it dies or becomes unresponsive. When the app first launches, and after any worker restart, go through the event log looking for pending workflows and resend them. Workflow implementations need to be idempotent.

# Desktop Client / NodeJS Server

Both cases feature a "client" running on a single dedicated instance with local storage and access to OS style [processes](https://nodejs.org/api/child_process.html) and [threads](https://nodejs.org/api/worker_threads.html). The approach is the same as the web client. The only difference is in the APIs used to start the worker and communicate with it. 

The NodeJS server is intended for local testing of a complete end to end system, or for anyone that wants to run their own dedicated server instance. In both cases, failures are ultimately handled by restarting the client/instance.

# Thin Client

This is a client with no local storage, interacting with a server via a REST API. The API lets the client read the event log and blob store, as well as adding entries to the log. All workflows run on the server, so workers are not needed locally. 

The client's instance of `EventSourcedSpreadsheetData` can't request workflows, that's the server's responsibility. 

# AWS Serverless

The intention is to use an AWS serverless backend for production use. In this case, the AWS infrastructure does all the heavy lifting. The `EventLog` is implemented using DynamoDB. Changes to the log are sent to DynamoDB streams. Any change to the log entry's `pending` field invokes a Lambda hosted worker.

The backend deployment sets up the infrastructure so that writes with a pending workflow are forwarded to a Lambda function using DynamoDB streams. The NodeJS based Lambda function imports `event-sourced-spreadsheet-data`. 

The Lambda function init should set up the connection to DynamoDB and S3 (for the blob store). The function needs to be invoked with a spreadsheet id, workflow name and sequence id. There could be many different clients, each working on a different spreadsheet. We may need a cache of `EventSourcedSpreadsheetData` instances per spreadsheet id.

# Common Abstraction

Each client has three high level parts.
1. A host that manages worker(s) with a way of sending messages to the workers it manages. Sending messages may be explicit via a `postMessage` style API or implicit (e.g. DynamoDB streams). 
2. A worker running in a separate context with its own instance of `EventSourcedSpreadsheetData`. It processes messages from the host, to run workflows that interact with a shared `EventLog` and `BlobStore`.
3. Some infrastructure that connects host and workers. This might be inter-process communication on the same instance, or across the network in a cloud hosted distributed system. Setting this up is the client's responsibility. The `event-sourced-spreadsheet-data` module interacts with worker and host. It doesn't need to know anything about what happens in between.

{% include candid-image.html src="/assets/images/infinisheet/workers.svg" alt="InfiniSheet Workers" %}

# Workers Interface

Unlike the `EventLog` and `BlobStore` interfaces, workers are kind of vague and hand-wavy. I did wonder whether I needed a dedicated workers interface at all. You could provide an `invokeWorkflow` function in `event-sourced-spreadsheet-data` and say it's entirely the client's responsibility to call it when needed, in a separate context.

In the end I decided that it would be worthwhile to have something that represents a "worker host" and a "worker". The `EventSourcedSpreadsheetData` instance might need to know whether it's running in a host or worker context. The instance on the host side might need to understand the state of the system. For example, it might delay creation of a new snapshot if the worker is still busy with the previous one. The instance on the worker side might want to send back progress and error reports.

```ts
export interface WorkerMessage {
  /** Used as a discriminated union tag by implementations */
  type: string;
}

export interface WorkerHost<MessageT extends WorkerMessage>  {
}

export interface PostMessageWorkerHost<MessageT extends WorkerMessage> extends WorkerHost<MessageT> {
  postMessage(message: MessageT): void
}

export type MessageHandler<MessageT extends WorkerMessage> = (message: MessageT) => void;

export interface InfiniSheetWorker<MessageT extends WorkerMessage> {
  onReceiveMessage: MessageHandler<MessageT> | undefined;
}
```

It's a pretty sparse starting point. We have a discriminated union type for messages sent to the worker. There's a currently empty `WorkerHost` interface for hosts with implicit messages and `PostMessageWorkerHost` for hosts with an explicit `postMessage` method.

On the worker side, `InfinisheetWorker` has an `onReceiveMessage` property for the message handler function that will be invoked when a message is received.

The interfaces are generic on the type of messages supported. The message for a pending workflow might look something like this.

```ts
export interface PendingWorkflowMessage {
  type: "PendingWorkflowMessage";
  workflow: WorkflowId;
  sequenceId: SequenceId;
}
```

# Reference Implementation

Remember, a reference implementation is the simplest thing that implements the interface. Performance is not an issue. In this case all we're doing is scheduling a callback from the event loop. Yes, this can block the UI if snapshot creation takes a long time. Yes, there isn't any real isolation between host and worker. Both are fine for a reference implementation. 

```ts
export class SimpleWorkerHost<T extends WorkerMessage> implements PostMessageWorkerHost<T> {
  constructor(worker: SimpleWorker<T>) {
    this.worker = worker;
  }

  postMessage(message: T): void {
    const handler = this.worker.onReceiveMessage;
    if (handler) {
      setTimeout(() => { handler(message) }, 0);
    } else {
      throw new Error("Worker has no message handler");
    }
  }

  private worker: SimpleWorker<T>;
}

export class SimpleWorker<T extends WorkerMessage> implements InfiniSheetWorker<T> {
  onReceiveMessage: MessageHandler<T> | undefined;
}
```

The worker host is simple. The constructor takes a `SimpleWorker` instance. The `postMessage` method invokes the worker's handler, if defined, using `setTimeout` to schedule a callback. 

The worker implementation is even simpler. A class with an `onReceiveMessage` property.

# Next Time

That involved a lot of thinking for little concrete outcome. [Next time]({% link _posts/2025-07-21-infinisheet-wiring-blob-store-workers.md %}), we'll try wiring `SimpleBlobStore` and `SimpleWorker` into our tracer bullet `EventSourcedSpreadsheetData`. That should shake some more requirements loose. 

