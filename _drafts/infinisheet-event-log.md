---
title: InfiniSheet Event Log
tags: infinisheet
---

So far my implementation has concentrated entirely on the frontend. Time to start looking at the backend, starting with the persistence model. 

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
I've been thinking about this for a long time. I did my initial round of [brainstorming]({{ bb_url }}) and planning two years ago. I'm going to use [Event Sourcing]({{ bb_url | append: "#event-sourcing" }}) to store the sequence of operations applied to a spreadsheet. Every so often I'll create a [snapshot]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) of the current state. I can then load the spreadsheet at any point in time by loading a snapshot and applying changes from that point on in the event log.

I figured out how to make [snapshots work with insertion and deletion of rows]({% link _posts/2023-06-05-spreadsheet-insert-delete.md %}), and how to [transform and merge snapshots]({% link _posts/2023-07-03-spreadsheet-merge-import.md %}) efficiently.

I'm finally ready to start implementing.

# InfiniSheet Architecture

{% include candid-image.html src="/assets/images/infinisheet/infinisheet-types-architecture.svg" alt="InfiniSheet Architecture" %}

This project involves the same core code running in [many different contexts]({% link _posts/2024-07-29-infinisheet-architecture.md %}). To support that I define interfaces that are used to abstract away differences in implementation in each context.

Persistent data storage is built on a `blob-store` and an `event-log`. The `blob-store` lets you store and retrieve arbitrary blobs of data. The `event-log` is an ordered log of events.

The `workers` interface provides an abstraction for running background jobs in parallel.

The highest level interface is `spreadsheet-data`. You've already [seen how]({% link _posts/2024-10-07-react-spreadsheet-data-model.md %}) my React based scalable frontend interacts with data through the TypeScript `SpreadsheetData` interface.

I'm currently using a [simple reference implementation]({% link _posts/2025-03-10-react-spreadsheet-editable-data.md %}) of `SpreadsheetData` for testing and demos of the frontend. Now I'm going to build a production implementation of `SpreadsheetData` in the `event-sourced-spreadsheet-data` module. 

# Event Log

Before I can do that I need to define the `BlobStore` and `EventLog` interfaces, together with reference implementations. I'm going to start with `EventLog`.

I've already [sketched out]({% link _posts/2023-08-07-spreadsheet-event-log.md %}) how you could implement an event log using DynamoDB. 