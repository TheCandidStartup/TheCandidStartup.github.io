---
title: Consistency and Conflict Resolution for Event Sourced Systems
tags: cloud-architecture spreadsheets
---

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
I'm a [big]({% link _posts/2023-09-04-event-sourced-database-grid-view.md %}) [fan]({{ bb_url | append: "#event-sourcing" }}) of [Event Sourced](https://martinfowler.com/eaaDev/EventSourcing.html) systems. However, so far, I've waved my hands and told you that everything is wonderful. There are lots of things you need to worry about when building a cloud application. Often the hardest problems only appear as you scale up, when multiple clients interact with the same data at the same time. 

What does your application need to do to ensure consistency of it's stored state? How do you resolve the inevitable conflicts when two users try to change the same data? A traditional web app built around a relational database can rely on a raft of features that address these problems, battle tested over forty years of development. Even then, it's hard enough to get it right. 

Is it really feasible to roll your own event sourced system while ensuring consistency and handling conflict resolution?

## Consistency

Before diving into the weeds, I should define what I mean by consistency. Every application will have its own notion of what it means to be in a consistent state. There will be input validation checks to ensure that data being stored is valid. There will be rules and invariants that define what is valid. Application code will be written to ensure that any change maintains those invariants.

This is straightforward enough, as long as there's only one client working at a time. As soon as you have multiple, simultaneous clients, it becomes horribly complex. Luckily, your relational database is standing by, ready to help. 

### Atomic Writes

At some point your application will reach a level of complexity where you need to make multiple changes at once. You could write the obvious application code that makes the required changes one after the other. You end up with two big problems.

First, what happens if something goes wrong in the middle of a sequence of changes. Maybe your app server crashes. Now you stored state is, by definition, inconsistent. 

Second, what happens if multiple clients are making changes at the same time? The two clients interfere with each other. If one client reads while another is in the middle of making changes, it will see an inconsistent state. Writes from both clients can end up interleaved. It's virtually impossible to ensure that every possible ordering of updates will result in a consistent state.

Atomic writes solve both problems. The database les the application define the set of changes as a single transaction. The database ensures that all the changes are made at once, or don't happen at all. Another client reading the database will either see all the changes or none of them. If two in-progress transactions conflict, one of them will succeed with all changes visible, while the other will fail with no changes made. 

This is the basic level of support for consistency provided by all relational databases. 

### Consistent Reads

At first glance, atomic writes appear to cover all the bases. However, its still easy to get into a mess. Consider what happens when you have two transactions where one is long running and the other completes in the middle of whatever the first one is doing. The long running transaction may see inconsistent data. Anything read before the second transaction completes is from one valid state, everything else is from another. It's virtually impossible to ensure that any random combination of data read from two valid states is also a valid state.

The next level of database support, commonly known as Snapshot Isolation, addresses this problem. When snapshot isolation is enabled, the database ensures that each transaction reads from one consistent state. It's as if the database captured a snapshot at the time the transaction started and all reads from that transaction use that snapshot. An overlapping transaction that started later may end up working off a different, more recent snapshot. 

All relational databases have some form of support for snapshot isolation. For many, it's the default isolation level, or the one that most applications use. Snapshot isolation can be implemented efficiently using the [Multi-Version Concurrency Control](https://en.wikipedia.org/wiki/Multiversion_concurrency_control) (MVCC) system that many databases already use to support atomic writes.

### Consistent Writes

Sadly, consistent reads aren't enough to ensure consistency. Consider two transactions that are incrementing a counter value. Each reads the current value, increments it and then writes it back. It doesn't matter what order the transactions are in, you get the same result of 2. Unless the transactions overlap, in which case the second transaction won't see the change that the first transaction is in the middle of making and will overwrite it.

This *lost update* problem isn't too hard for a database to handle, as both transactions are writing to a common value. However, you can get a similar *write skew* problem if two transactions read from the same value and write to different values. Even worse are *phantom reads* where one transaction queries the database and finds nothing, while the other transaction is writing data that the query would have found. 

In general, you have a problem if a long running transaction would behave differently if the entire thing executed all at once at the point where it commits. It's very difficult to ensure that the changes a transaction makes, based on an earlier snapshot of state, are always valid regardless of whatever other changes have happened since then. 

Serializable Isolation addresses this problem. The database will ensure that the end result is as if each transaction had run by itself, one after the other. Which is easy to say, but much harder to implement efficiently. There are three common implementations, all of which introduce significant performance penalties.
1. Actually run the transactions one at a time on a single thread. Only viable for in-memory databases with short transactions.
2. Use locks to pause other transactions that might conflict until the current transaction has completed. Implementations usually have to fallback on conservatively locking large parts of the database to handle potental *phantom reads*.
3. Extend the MVCC system by keeping track of which versions of data have been read (or potentially read) by one transaction and later written to by another. Then fail any transaction with conflicts at commit time. 

###End to End Consistency

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