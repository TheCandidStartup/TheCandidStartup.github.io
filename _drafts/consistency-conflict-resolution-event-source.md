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
An event log naturally provides [*Serializable Isolation*](https://en.wikipedia.org/wiki/Serializability). The entries in the event log are strictly ordered and that serialized order defines the state of the system. Serializable isolation is the highest level of support for consistency provided by a relational database. As we saw [previously]({{ acid_url }}), this comes at a [high cost]({{ acid_url | append: "#consistent-writes" }}) for a general relational database, with the consequence that teams often try to [settle for a lower level of consistency]({{ acid_url | append: "#reality-bites" }}). 

Does that mean that an event sourced system will inherently perform poorly? There are some significant differences compared to a general relational database. A relational database has to do a lot of work in each transaction. It has to track multiple writes so that they can be rolled back in the event of failure, update any indexes impacted by the changes and commit all those changes irrevocably in one operation. 

The simplest implementation of *Serializable Isolation* is to run one transaction at a time. That's simply not feasible with a relational database if you want to achieve any reasonable sort of throughput. Instead, a relational database supports multiple transactions operating in parallel and relies on identifying possible conflicts between transactions so that they can be delayed or aborted. 

In an event sourced system, each entry in the event log is the equivalent of a transaction. Instead of serializing all the operations involved in a transaction, we only need to [serialize the write to the event log]({% link _posts/2023-08-07-spreadsheet-event-log.md %}). A relational database has to check for possible conflicts across the entire database. We're only concerned with changes to a single event log. My cloud based spreadsheet has an event log per spreadsheet. There's no possibility of conflicts between spreadsheets and no need to serialize writes across different event logs.

What about the explicit snapshots of state that we need to create at regular intervals? All that work happens asynchronously, outside the scope of the transaction. We can continue committing new transactions, adding new entries to the event log, in parallel with snapshot creation. A snapshot captures the state of the system at a specific event in the event log. Event log entries are immutable, so snapshot creation is unaffected by adding later events to the log. The magic of [amortized costs]({% link _posts/2023-04-17-amortized-cost-cloud.md %}) ensures that keeping the set of snapshots up to date is still an [*O(nlogn)* process]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}). 

## Application Consistency

*Serializable Isolation* doesn't mean we have application level consistency. There will be input validation checks and invariants that need to be maintained. Input validation checks are easy. Each event captures high level user intent. Our app server can check that each event is syntactically valid and internally consistent before writing it to the event log. 

Invariants are more difficult. It's easy to check an invariant that depends on data included in the event. However, what do you do for invariants that need to be maintained between changed data in the event and existing data elsewhere in the system?

The simplest approach is to change the format of events so that more data needs to be included. A simple [grid view based issues system]({% link _posts/2023-06-12-database-grid-view.md %}) might have invariants within the scope of a single issue. Rather than having an event that describes the change to a single property, have an "update issue" event that has to include all properties. Now any invariants can be checked using just the data included in the event.

Obviously this doesn't work if you can have invariants across issues (for example, parent-child relationships). It also comes with two major downsides. First, you're making each event bigger by including data that hasn't changed. That makes the event log bigger, which means it will take longer to load data into the client. Second, you've increased the chance of *lost updates*. If two clients change different, otherwise independent properties, whichever event comes second will overwrite the property changed by the first event.

You can address this by making the events more granular. Have a separate update event for each set of properties connected by invariants. In our example of the issues system, there is a small core set of fixed properties with a potentially much larger set of optional custom properties. The custom properties are all independent values. Any business logic based invariants only apply to the core properties. We can redefine the "update issue" event to include either all the fixed properties or none of them, plus any custom properties that have changed. 

Eventually you will reach the point where checking an invariant requires querying some aspect of the stored state. The app server will need to query the most recent snapshot, read any events that committed since the snapshot was created, check that invariants will be maintained and then perform a conditional write of the new event. If any other app server instance has managed to add an event after the ones this app server read, the write needs to fail. 

This is nowhere near as complex as a relational database transaction, but it's also a lot more complex than a simple write. 

## Last Write Wins

What happens if we throw multiple simultaneous clients at a system like this? The default behavior is *last write wins*. Clients submit their changes to the app servers. The source of truth is the order in which the app servers happen to write to the event log. If one client overwrites another client's changes, then so be it. 

The next time each client retrieves the most recent events from the server, it needs to fix up local state where it has diverged, and potentially inform the end user what happened. The system is always in a consistent state but the end user, without knowledge of changes from other clients, may have chosen the wrong consistent state.

## End to End Consistency

What if we want to make sure that the user can always make decisions with full knowledge of the latest state of the system? The overall approach is the [same]({{ acid_url | append: "#end-to-end-consistency" }}) as with a traditional relational database backed web app. You make the update conditional on the current state being the same as the client expects. With a traditional app that can be tricky, needing carefully considered API design and special case code for each API. 

With event sourcing a basic implementation is very simple. The client includes the id of the event its local state is synced to with each API call. The app server returns an error if the most recent event in the log is more recent. On error, the client syncs up to the most recent state, lets the end user resolved any conflict between the current state and the change they were trying to make, and tries again. 

This approach gives you *Serializable Isolation* all the way back to the client, by only allowing one client to make changes at a time. If clients make changes driven by human interaction (typically seconds between each change), there's unlikely to be a problem. If clients are automated, making many changes a second, there will be contention, lots of retries, little forward progress. There's no mechanism that ensures fairness. The client with the highest rate of changes and the lowest latency to the server will dominate. 

Which is all very wasteful if, as in our issues example, most clients are editing independent items where changes don't interfere with each other. 

## Pending Events

* Two big problems - complexity/latency of adding event to log if we have to check invariants involving current state, unacceptable choice between cleaning up mess of last write wins or poor performance/experience of end to end serializable isolation. 
* Can use the idea of pending events to address both.
* Go back to simple case of only checking internal consistency of event and then immediately adding to log.
* Twist is that event is in a pending state until overall consistency checked - both invariants and possible conflicts with earlier pending events
* Client can choose how to deal with pending events. Simple client would sync up to last committed event and ignore any pending events. After it submits its own changes it needs to wait until event finally commits or is rejected.
* Similar client interaction model to end to end serializable isolation. However, no contention if editing separate issues. Fairness between clients if they are contending for access.
* Still have potential fairness problem between app server instances but that's much easier to solve as all server side, all under our control.
* Snapshot creation can't start until pending transaction resolved. 
* Snapshot creation is long term background process. Committing pending events is medium term background process.
* Thick client can do much better job. Sync pending events too but treat them as non-definitive.
* Thick client has current state to hand. Can process pending events itself and determine whether server would reject them. Preemptively avoids conflicts with pending events from other clients. 
* Must be prepared to fix up local state if it turns out client and server business logic are out of sync. 

* Conflict resolution
  * Server side process works through pending transactions in order. For each, looks at any entries added to the log between the last change the client saw and the submitted transaction and checks for conflicts. 
    * Lots of ways to define conflict - could specify how strict you want to be in transaction. Simplest is to check whether any cell the transaction depends on was modified by earlier change. 
    * Wider scope would check for any cell changing in a row that transaction depends on. 
    * Or could support arbitrary conditions ...
  * Transaction is marked as rejected or accepted. Rejected transactions are ignored by everyone (filter them out when querying)