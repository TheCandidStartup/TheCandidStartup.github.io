---
title: Consistency and Conflict Resolution for Event Sourced Systems
tags: cloud-architecture spreadsheets
---

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
I'm a [big]({% link _posts/2023-09-04-event-sourced-database-grid-view.md %}) [fan]({{ bb_url | append: "#event-sourcing" }}) of [Event Sourced](https://martinfowler.com/eaaDev/EventSourcing.html) systems. I have a whole [series of posts]({% link _topics/spreadsheets.md %}) on implementing a cloud spreadsheet using event sourcing. However, so far, I've mostly waved my hands and told you that everything is wonderful. 

A traditional web app built around a relational database can rely on a [raft of features]({% link _posts/2023-09-18-acid-atomicity-consistency-isolation-durability.md %}) that address issues of consistency and conflict resolution, battle tested over forty years of development. Even then, it's hard enough to get it right. 

Is it really feasible to roll your own event sourced system while figuring out how to resolve conflicts and ensure consistency?

## Serializable Isolation

A quick reminder. An event sourced system is based on an event log. An event log is an ordered list of entries that define all changes made to the data you're storing. To load the data into a client, simply replay all the events locally. To speed things up, create snapshots of the overall state at regular intervals. Then you can load data into a client by loading from a snapshot and replaying events from that point on. 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/lsm-segments.svg" alt="Event Log with Snapshots" %}

{% capture acid_url %}{% link _posts/2023-09-18-acid-atomicity-consistency-isolation-durability.md %}{% endcapture %}
An event log naturally provides [Serializable Isolation](https://en.wikipedia.org/wiki/Serializability). The entries in the event log are strictly ordered and that serialized order defines the state of the system. Serializable isolation is the highest level of support for consistency provided by a relational database. As we saw [previously]({{ acid_url }}), this comes at a [high cost]({{ acid_url | append: "#consistent-writes" }}) for a general relational database, with the consequence that teams often try to [settle for a lower level of consistency]({{ acid_url | append: "#reality-bites" }}). 

Does that mean that an event sourced system will inherently perform poorly? There are some significant differences compared to a general relational database. A relational database has to do a lot of work in each transaction. It has to track multiple writes so that they can be rolled back in the event of failure, update any indexes impacted by the changes and commit all those changes irrevocably in one operation. 

The simplest implementation of serializable isolation is to run one transaction at a time. That's simply not feasible with a relational database if you want to achieve any reasonable sort of throughput. Instead, a relational database supports multiple transactions operating in parallel and relies on identifying possible conflicts between transactions so that they can be delayed or aborted. 

In an event sourced system, each entry in the event log is the equivalent of a transaction. Instead of serializing all the operations involved in a transaction, we only need to [serialize the write to the event log]({% link _posts/2023-08-07-spreadsheet-event-log.md %}). A relational database has to check for possible conflicts with changes to anything else in the database. We're only concerned with changes to a single event log. My cloud based spreadsheet has an event log per spreadsheet. There's no possibility of conflicts between spreadsheets and no need to serialize writes to different event logs.

What about the explicit snapshots of state that we need to create at regular intervals? All that work happens asynchronously, outside the scope of the transaction. We can continue committing new transactions, adding new entries to the event log, in parallel with snapshot creation. A snapshot captures the state of the system after a specific event in the event log. As event log entries are immutable, snapshot creation is unaffected by adding later events to the log. The magic of [amortized costs]({% link _posts/2023-04-17-amortized-cost-cloud.md %}) ensures that keeping the set of snapshots up to date is still an [*O(nlogn)* process]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}). 

## Application Consistency

Serializable isolation doesn't mean we have application level consistency. There will be input validation checks and invariants that need to be maintained. Input validation checks are easy. Each event captures high level user intent. Our app server can check that each event is syntactically valid and internally consistent before writing it to the event log. 

Invariants are more difficult. It's easy to check an invariant that depends on data included in the event. However, what do you do for invariants that need to be maintained between changed data in the event and existing data elsewhere in the system?

## Last Write Wins

What happens if we throw multiple simultaneous clients at a system like this? The default behavior is *last write wins*. Clients submit their changes. The source of truth is the order in which those changes hit the event log. If one client, unaware of what the other client is doing, overwrites its changes, then so be it. 

The next time each client retrieves the most recent events from the server, it needs to fix up local state where it has diverged, and potentially inform the end user what's happened. 

## End to End Consistency

## Conflict Resolution

* Simplest approach is last writer wins. Clients submit their changes, source of truth is order changes hit transaction log, client sync most recent changes and fix up their local state if it has diverged
* Strictest approach extends add entry logic back to client. Client syncs to most recent changes, resolving any conflict locally. Submits their changes conditional on no changes to transaction log since their sync. If transaction fails, sync and repeat.
* Server side conflict resolution.
  * Submit changes including entry number (segment num + entry num?) of last change client has seen. Transaction written to log but marked pending. Clients ignore pending changes (or treat them as non-definitive). Snapshot creation can't start until pending transaction resolved. 
  * Server side process works through pending transactions in order. For each, looks at any entries added to the log between the last change the client saw and the submitted transaction and checks for conflicts. 
    * Lots of ways to define conflict - could specify how strict you want to be in transaction. Simplest is to check whether any cell the transaction depends on was modified by earlier change. 
    * Wider scope would check for any cell changing in a row that transaction depends on. 
    * Or could support arbitrary conditions ...
  * Transaction is marked as rejected or accepted. Rejected transactions are ignored by everyone (filter them out when querying)
  * 