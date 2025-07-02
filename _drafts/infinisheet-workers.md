---
title: InfiniSheet Workers
tags: infinisheet
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

I'm building an [event sourced spreadsheet]({% link _topics/spreadsheets.md %}) on a [foundation]({% link _posts/2024-07-29-infinisheet-architecture.md %}) of an event log, a blob store and background workers. I've defined interfaces and reference implementations for `EventLog` and `BlobStore`. Now it's the turn of background workers.

# The Big Picture

{% include candid-image.html src="/assets/images/infinisheet/infinisheet-types-architecture.svg" alt="InfiniSheet Architecture" %}

The core logic for the spreadsheet lives in the `event-sourced-spreadsheet-data` module. This is common code that will be used by frontend web and desktop clients, together with backend NodeJS and AWS servers. Low level platform dependencies are abstracted away behind `EventLog`, `BlobStore` and `Workers` interfaces. The pieces required and any other infrastructure and platform dependencies are put together by each client.

{% include candid-image.html src="/assets/images/infinisheet/event-sourced-spreadsheet-data-tracer-bullet.svg" alt="Event Sourced Spreadsheet Data Tracer Bullet Development" %}

I used [tracer bullet development]({% link _posts/2025-06-02-event-sourced-spreadsheet-data.md %}) to build an end to end prototype of the web client. I implemented just enough of `event-sourced-spreadsheet-data` to connect my `VirtualSpreadsheet` React component to spreadsheet data stored in an `EventLog` reference implementation. I have a `BlobStore` [reference implementation]({% link _drafts/infinisheet-blob-store.md %}) ready to go. 

# Use Case

I just need to come up with an abstraction for background workers so that I can trigger a background job that reads an `EventLog` and creates a snapshot by writing blobs into a `BlobStore`.

{% include candid-image.html src="/assets/images/infinisheet/event-log.svg" alt="Event Log" %}

Everything is orchestrated by the event log. A snapshot workflow is triggered by writing an event log with `Snapshot` in the `pending` field. The workflow creates the snapshot and then uses an atomic write to the log to clear the `pending` field and to store a reference to the root snapshot blob in the `snapshot` field.

Naturally this whole process needs to be reliable. Once the triggering write is successfully committed, the workflow *WILL* eventually complete. Errors should be retried and recovered from, failed workflows restarted, etc.

Let's look at how this might work for a few clients and see if we can find a common abstraction.

# Reference Implementation

* Simplest thing that implements the interface. Performance not an issue.
* In this case it's simply scheduling a callback from the event loop. Yes, this can block the UI if snapshot creation takes a long time but that's fine for a reference implementation. 
* The `EventLog` needs to invoke a callback when an entry with an pending workflow is created.
* `EventSourcedSpreadsheetData` needs to expose an `invokeWorkflow` method. Either directly or by passing it to a `Workers` interface.
* The client puts the two together by setting an `EventLog` callback that uses a `Promise` or `setTimeout` to schedule a call to `invokeWorkflow` from the event loop.

# Web Client

* The web client should use [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) for background jobs.
* Create a dedicated worker and communicate with it via `postMessage`
* Worker has access to same local data storage and network resources as main app
* The client sets an `EventLog` callback that posts a message to the worker specifying workflow name and event log sequence id
* Client starts worker with code that imports `event-sourced-spreadsheet-data` module
* Client sends init message which includes constructor arguments for `EventLog` and `BlobStore`. Worker creates an `EventSourcedSpreadsheetData` instance.
* Worker calls `invokeWorkflow` in response to workflow messages
* Possible to use multiple workers if needed. Start with a single dedicated worker. Assumption that worker only needed to prevent blocking of main event loop. Snapshot creation should complete long before another snapshot is needed.
* Error handling
  * Restart web worker if it dies
  * On initial launch of app and after any restart, go through event log looking for pending workflows and resend them
  * Workflows MUST be idempotent

# Desktop Client / NodeJS Server

* Both cases feature a "client" running on a single dedicated instance with local storage and access to OS style processes and threads
* Similar approach to web client with different APIs for starting worker and communicating with it
* Same error handling model

# AWS Serverless

* AWS infrastructure does all the heavy lifting
* EventLog hosted on DynamoDB -> DynamoDB Streams -> Lambda worker
* Deploy DynamoDB configured so that write with a pending workflow is forwarded to a Lambda function using DynamoDB streams
* Node.js Lambda function that imports `event-sourced-spreadsheet-data`
* Init sets up connection to DynamoDB and S3
* Function invoked with spreadsheet id, workflow name and sequence id in log.
* May need cache of `EventSourcedSpreadsheetData` instances per spreadsheet id
