---
title: InfiniSheet Architecture
tags: cloud-architecture frontend infinisheet
---

I've been working on my [spreadsheet project]({% link _topics/spreadsheets.md %}) for many months now. I started with [very high level thinking]({% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}) and paper explorations of possible [data structures]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) and [algorithms]({% link _posts/2023-07-03-spreadsheet-merge-import.md %}). Then I went to the other end of the scale and built a [React virtual scrolling]({% link _topics/react-virtual-scroll.md %}) package that you could use to build the frontend for a large spreadsheet. 

Now it's time to apply some broad brush strokes to the space in between. Yes, I drew an architecture diagram.

{% include candid-image.html src="/assets/images/infinisheet/module-architecture.svg" alt="InfiniSheet Architecture" %}

Each box is roughly equivalent to a package in the InfiniSheet monorepo. As I work through implementation, I may decide to combine or split packages compared with what I've shown here.

The packages are color coded for your convenience. Grey packages represent interfaces, purple packages are implementations of interfaces and yellow packages are React UI. Apps are shown in blue. 

There are a couple of representative arrows that show which implementation packages implement which interfaces. Most are omitted for simplicity. It should be obvious. Each implementation package name ends in the name of the interface it's implementing.

# Stack

For now, I'm going to continue using a TypeScript stack. I've been impressed with how productive the experience is. At the same time, the guard rails provided by the type system keep me from making stupid mistakes. 

This is a full stack project. Using the same language for frontend and backend will let me share code across both contexts. For the backend I expect to use a NodeJS runtime. 

In future, if everything works out functionally, I could see myself rewriting performance critical, compute intensive parts of the backend in Rust. 

# Interfaces

This project involves the same core code running in many different contexts. To support that I define interfaces that are used to abstract away differences in implementation in each context.

Persistent data storage is built on a `blob-store` and an `event-log`. The `blob-store` lets you store and retrieve arbitrary blobs of data. The `event-log` is an ordered log of events.

The `workers` interface provides an abstraction for running background jobs in parallel.

The highest level interface is `spreadsheet-data`. This abstracts away the details of how the content of a spreadsheet is stored and updated. 

# Spreadsheet Data

There are two implementations of `spreadsheet-data`. As its name suggests, `simple-spreadsheet-data` is the simplest possible implementation. Think of it as a JavaScript map used to represent a sparse two dimensional array. The data is stored entirely in memory, using the most naive representation possible. Ideal for simple samples, unit tests and debugging. 

The core of InfiniSheet is the `event-sourced-spreadsheet-data` package. This provides persistent, large scale data storage using an event sourcing approach. It implements `spreadsheet-data` and in turn depends on the `blob-store`, `event-log` and `workers` interfaces. 

Each InfiniSheet app combines `event-sourced-spreadsheet-data` with appropriate implementations of `blob-store`, `event-log` and `workers`. This approach also makes it easy to unit test `event-sourced-spreadsheet-data` by using mock implementations of `blob-store`, `event-log` and `workers`.

# React Spreadsheet

The frontend apps all use `react-spreadsheet` for their main UI. This package contains a React component built on `react-virtual-scroll` that implements the classic Spreadsheet UI we all know and love. The component retrieves the data needed to render the spreadsheet on demand, using the `spreadsheet-data` interface.

A simple sample app, `spreadsheet-sample`, can be implemented by combining `react-spreadsheet` and `simple-spreadsheet-data`. 

# InfiniSheet

`Infinisheet` is the main InfiniSheet web client. It combines `event-sourced-spreadsheet-data` with implementation packages built on browser APIs. `Opfs-blob-store` is a `blob-store` implementation that uses [Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) APIs, `indexed-db-event-log` is an `event-log` implementation on [Indexed DB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), and `web-workers` implements the `workers` interface using [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).

The client can be run in a standalone demo mode using the browser API implementations. Data is persistent but locally stored. 

In production mode the source of truth is a remote server. The client downloads blobs and event log segments on demand. The local browser implementation is used to cache data locally. Edits can be made even when offline, stored locally, then synchronized with the server later. 

# InfiniSheet Desktop

`Infinisheet-desktop` is a standalone desktop app using an [Electron](https://www.electronjs.org/) wrapper. It uses OS level implementations for `blob-store` (file based) and `event-log` ([SQLite](https://www.npmjs.com/package/sqlite3) based), and a `workers` implementation based on Electron's dedicated [utility process](https://www.electronjs.org/docs/latest/api/utility-process) APIs.

# NodeJS InfiniSheet Server

`Nodejs-infinisheet-server` is a simple single process NodeJS server implementation intended for local testing. It uses the same `blob-store` and `event-log` implementations as `infinisheet-desktop`, together with a `workers` implementation based on [NodeJS worker threads](https://nodejs.org/api/worker_threads.html).

# AWS Infinisheet Server

`Aws-infinisheet-server` is a production backend built on [serverless AWS services]({% link _posts/2022-12-05-serverless-or-not.md %}). The `blob-store` uses [S3](https://aws.amazon.com/s3/), `event-log` is built on [DynamoDB](https://aws.amazon.com/dynamodb/) and `workers` orchestration is handled by [Lambda](https://docs.aws.amazon.com/lambda/).

# Next Steps

Sounds great, right? Of course, apart from `react-virtual-scroll`, none of this exists yet. It'll be interesting to come back in a couple of years time and see how far reality has diverged from the blueprint. 

Currently, the plan is as follows.
1. Define (and continuously evolve) the `spreadsheet-data` interface.
2. Implement `react-spreadsheet` and try it out with `spreadsheet-sample` and `simple-spreadsheet-data`.
3. Define (and continuously evolve) the `blob-store`, `event-log` and `workers` interfaces.
4. Implement `event-sourced-spreadsheet-data` and test it using mocked/simple `blob-store`, `event-log` and `workers` implementations.
5. Implement `infinisheet` in standalone demo mode by building `opfs-blob-store`, `indexed-db-event-log` and `web-workers`.
6. Implement `nodejs-infinisheet-server` by building `file-blob-store`, `sqlite-event-log` and `nodejs-workers`.
7. Implement the full `infinisheet` client running against a local instance of `nodejs-infinisheet-server`.
8. Hand over my credit card details to AWS and implement the `aws-infinisheet-server` production backend. See how much I can achieve within the confines of the [free tier](https://aws.amazon.com/free). 
9. Round out my offering with `infinisheet-desktop`. 

There's a rule of thumb that says you need three different implementations before you can figure out what the common abstract interface should be. I'm going to start with my best guess at each interface together with a single implementation. I fully expect the interfaces to evolve (aka be thrown away and rewritten) as I add new implementations.

Wish me luck.
