---
title: InfiniSheet Architecture
tags: cloud-architecture frontend
---

wise words

{% include candid-image.html src="/assets/images/infinisheet/module-architecture.svg" alt="InfiniSheet Module Architecture" %}

* *InfiniSheet needs dependencies on opfs-blob-store, indexed-db-event-log and event-sourced-spreadsheet-data. Or merge with infinisheet-demo and built in demo mode.*

* Grey = Interface
* Purple = Interface Implementation
* Yellow = React Package
* Blue = App
* Most arrows showing which implementation packages implement which interfaces are missing for simplicity. Should be obvious. Each implementation package name ends in the name of the interface it's implementing.
* Each app (whether frontend or backend) has an implementation of `spreadsheet-data`. 
* Sample app for `react-spreadsheet` uses a simple in memory implementation.
* Everything else uses the central package, `event-sourced-spreadsheet-data`. Link to blogs on event sourcing.
* That in turn relies on interfaces that provide access to a `blob-store` (to store snapshots), an `event-log` and `workers` used to orchestrate the process of generating and merging snapshots.
* Each app uses a different set of implementation packages for `blob-store`, `event-log` and `workers`.
* The frontend apps all use `react-spreadsheet` for their main UI.
* `infinisheet-demo` is a purely front end SPA web app relying on browser API based implementation packages.
* `infinisheet-desktop` is a standalone desktop app using an Electron wrapper. It uses OS level implementations for `blob-store` (file based) and `event-log` (SQLite based), and a `workers` implementation based on Electron's dedicated utility process APIs.
* `infinisheet` is the main InfiniSheet web client. It loads data from a backend server and maintains a memory constrained cache locally. 
* `nodejs-infinisheet-server` is a simple single process server implementation intended for local testing.
* `aws-infinisheet-server` is a production backend built on serverless AWS services.
