---
title: InfiniSheet Event Log
tags: infinisheet
thumbnail: /assets/images/infinisheet/log-entry.png
---

So far my implementation has concentrated entirely on the frontend. Time to start looking at the backend, starting with the persistence model. 

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

Clients need to query the log. Initially, they will read entries from the most recent entry with a snapshot to the head of the log. They can then load the snapshot and replay the subsequent log entries. After that, they stay in sync with the current state of the spreadsheet by querying from the most recent entry they have to the head of the log.

Once snapshots have been created and all active clients have synced to a more recent log entry, the section of the log before the snapshot is no longer needed.  The log can be truncated immediately before a snapshot, with history available in the blob store if required.

# Log Entry

# Errors

# Event Log Interface

# Workflows

# Reference Implementation

# Next Time

In my rush to define an elegant interface and validate it with a reference implementation, I've overlooked something vital. Real production implementations will need to persist log entries to a file, or database or over the network. All of which are asynchronous operations. 

My interface needs to be asynchronous too. 
