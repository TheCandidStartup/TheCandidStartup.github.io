---
title: Consistency for Event Sourced Systems
tags: cloud-architecture spreadsheets
---

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
I'm a [big]({% link _posts/2023-09-04-event-sourced-database-grid-view.md %}) [fan]({{ bb_url | append: "#event-sourcing" }}) of [Event Sourced](https://martinfowler.com/eaaDev/EventSourcing.html) systems. I have a whole [series of posts]({% link _topics/spreadsheets.md %}) on implementing a cloud spreadsheet using event sourcing. However, so far, I've mostly waved my hands and told you that everything is wonderful. 

A traditional web app built around a relational database can rely on a [raft of features]({% link _posts/2023-09-18-acid-atomicity-consistency-isolation-durability.md %}) that address issues of consistency and conflict resolution, battle tested over forty years of development. Even then, it's hard enough to get it right. 

Is it really feasible to roll your own event sourced system while figuring out how to resolve conflicts and ensure consistency?

## Serializable Isolation

A quick reminder. An event sourced system is based on an event log. An event log is an ordered list of entries that define all changes made to the data you're storing. To load the data into a client, simply replay all the events locally. To speed things up, create snapshots of the overall state at regular intervals. Then you can load data into a client by loading from a snapshot and replaying events from that point on. 

{% include candid-image.html src="/assets/images/event-source-consistency/client-load.svg" alt="Loading data into a client using a snapshot" %}

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

{% include candid-image.html src="/assets/images/event-source-consistency/last-write-wins.svg" alt="Fix up local state after conflicting writes" %}

The next time each client retrieves the most recent events from the server, it needs to fix up local state where it has diverged, and potentially inform the end user what happened. The system is always in a consistent state but the end user, without knowledge of changes from other clients, may have chosen the wrong consistent state.

## End to End Consistency

What if we want to make sure that the user can always make decisions with full knowledge of the latest state of the system? The overall approach is the [same]({{ acid_url | append: "#end-to-end-consistency" }}) as with a traditional relational database backed web app. You make the update conditional on the current state being the same as the client expects. With a traditional app that can be tricky, needing carefully considered API design and special case code for each API. 

With event sourcing a basic implementation is very simple. The client includes the id of the event its local state is synced to with each API call. The app server returns an error if the latest event in the log is different. On error, the client syncs up to the most recent state, lets the end user resolve any conflict between the current state and the change they were trying to make, and tries again. 

{% include candid-image.html src="/assets/images/event-source-consistency/end-to-end-consistency.svg" alt="Out of date write fails" %}

This approach gives you *Serializable Isolation* all the way back to the client, by only allowing one client to make changes at a time. If clients make changes driven by human interaction (typically seconds between each change), there's unlikely to be a problem. If clients are automated, making many changes a second, there will be contention, lots of retries, little forward progress. There's also no mechanism that ensures fairness. The client with the highest rate of changes and the lowest latency to the server will dominate. 

Which is all very wasteful if, as in our issues example, most clients are editing independent items where changes don't interfere with each other. 

## Two Phase Commit

We have two big problems. First, the complexity and latency of adding an event to the log increases massively if we have to check invariants that involve stored state. Secondly, we're faced with an unpalatable choice between the "anything goes and clean up the mess afterwards" of last write wins, versus the poor performance and unfairness of end to end serializable isolation. 

{% include candid-image.html src="/assets/images/event-source-consistency/pending-events.svg" alt="Pending Events" %}

What if we could solve both problems in one? The idea is to use two phases when committing events. For the first phase, we go back to the simple implementation of checking internal consistency of an event and then immediately adding it to the event log. These events are in a pending state. They've reserved their place in the queue but there's no guarantee they will successfully commit. The second phase happens asynchronously. Invariants involving stored state are checked. Conflicts with earlier events are detected. The event is then marked as either committed or rejected.

{% include candid-image.html src="/assets/images/event-source-consistency/second-phase.svg" alt="Second Phase, First event committed, Second rejected" %}

Clients can choose how to deal with pending events. A simple client would sync up to the last committed event and ignore pending events. After it submits its own changes it needs to wait until the event finally commits or is rejected. This is a similar client interaction model to that used for end to end serializable isolation. However, there's no contention if editing separate issues and clients can be treated fairly if they are contending for access to the same issue.

{% include candid-image.html src="/assets/images/event-source-consistency/second-phase-no-conflict.svg" alt="Second Phase, No conflicts" %}

We still have a potential fairness problem between app server instances but that's much easier to solve as everything happens server side, all under our control. We also need to wait for events to be committed before snapshot creation can start. Snapshot creation is a long term background process that runs infrequently. Committing pending events is a short term background process that needs to run frequently. As well as reducing latency, committing pending events as a background process improves efficiency as the same instance can process multiple events, reusing the state retrieved when processing the previous event. 

A thick client can provide a better user experience. It can sync the full set of events, including those that are still pending. It needs to treat the pending events as non-definitive. A thick client has the current state available locally. There's an interesting contrast between stateful clients that can work incrementally and the stateless server implementations that have to do everything from scratch. 

{% include candid-image.html src="/assets/images/event-source-consistency/preempt-conflict.svg" alt="Second Phase, No conflicts" %}

It's easy for a thick client to process pending events itself and determine whether the server would commit or reject them. It can then preemptively avoid conflicts with pending events from other clients. Any events it submits must be conditional on the pending events committing as expected. The client must still be prepared to reverse course and fix up local state if it turns out that client and server business logic are out of sync.

## Conflict Detection

As the server processes each pending event, it needs to look at any events added to the log between this event and the last event the submitting client saw. Could this change conflict with any of those earlier changes? This is separate from the question of whether application invariants are being maintained. It's a judgement call. If the end user was aware of those changes, would they change their mind about what they're doing? 

For our example issues system, we would always consider it a conflict if the earlier event changed a property that we're trying to update. We would usually consider it a conflict if the earlier event changed a property in the same issue that we're updating. We would rarely consider it a conflict if the earlier event was updating a different issue. 

## Conclusion

So, is it really feasible to roll your own event sourced system while figuring out how to resolve conflicts and ensure consistency? I think so. How much effort will be needed depends greatly on what kind of application you're building. A spreadsheet doesn't have complex invariants and last-write-wins semantics are expected. There's a limit to how fast end users can make changes. You don't need anything more than an [event log implementation that can serialize writes]({% link _posts/2023-08-07-spreadsheet-event-log.md %}). 

At the other extreme, a grid view issues tracker with complex business logic and a high update rate driven by automated integrations will need a more sophisticated implementation. In the long run it's still less work than [making a traditional relational database backed web app bullet proof]({% link _posts/2023-09-18-acid-atomicity-consistency-isolation-durability.md %}). And that's without considering all the other benefits of an event sourced implementation. 