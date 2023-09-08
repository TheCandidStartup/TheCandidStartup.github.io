---
title: ACID! - Atomicity, Consistency, Isolation, Durability
tags: cloud-architecture databases
---

There are lots of things you need to worry about when building a cloud application. Often the hardest problems only appear as you scale up, when multiple clients interact with the same data at the same time. 

What does your application need to do to ensure consistency of it's stored state? How do you resolve the inevitable conflicts when two users try to change the same data? 

From the 1970s to the 2000s, before the rise of NoSQL databases, the answer was clear cut. You built your app using a relational database whose mystical [ACID properties](https://en.wikipedia.org/wiki/ACID) would make everything OK. However, when you use a relational database, you're confronted with a bewildering array of [configuration options](https://www.postgresql.org/docs/current/mvcc.html). Where's the simple ACID tick box?

## ACID

ACID stands for Atomicity, Consistency, Isolation and Durability. It's one of those cases where the [creators](https://dl.acm.org/doi/10.1145/289.291) worked hard to come up with a list of terms that would make a cool acronym.

It's an odd collection of terms because consistency is an application level property, while the other three are *some* of the properties of a database that help to achieve application level consistency. 

Most definitions of ACID treat consistency as another property of the database. It's true that a database ensures that its own internal state stays consistent, and it's true that databases allow the application to define additional constraints and invariants that the database will enforce. However, it's rare that a database can ensure application consistency all by its self. 

## Consistency

Every application will have its own notion of what it means to be in a consistent state. There will be input validation checks to ensure that data being stored is valid. There will be rules and invariants that define what is valid. Application code will be written to ensure that any change maintains those invariants.

This is straightforward enough, as long as there's only one client working at a time. As soon as you have multiple, simultaneous clients, it becomes horribly complex. Luckily, your relational database is standing by, ready to help. 

## Atomic Writes

At some point your application will reach a level of complexity where you need to make multiple changes at once. You could write the obvious application code that makes the required changes one after the other. You end up with two big problems.

First, what happens if something goes wrong in the middle of a sequence of changes? Maybe your app server crashes. Now you stored state is, by definition, inconsistent. 

Second, what happens if multiple clients are making changes at the same time? The two clients interfere with each other. If one client reads while another is in the middle of making changes, it will see an inconsistent state. Writes from both clients can end up interleaved. It's very difficult to ensure that every possible ordering of updates will result in a consistent state.

{% include candid-image.html src="/assets/images/acid/scattered-writes.svg" alt="Interleaved Writes, Other reads see intermediate state" %}

Atomic writes solve both problems. The database lets the application define the set of changes as a single transaction. The database ensures that all the changes are made together, or don't happen at all. Another client reading the database will either see all the changes or none of them. If two in-progress transactions conflict, one of them will succeed with all changes visible, while the other will fail with no changes made. 

{% include candid-image.html src="/assets/images/acid/atomic-writes.svg" alt="Atomic Writes, Other reads see final state after commit" %}

If the database crashes it ensures that all changes made by committed transactions persist after the database recovers and that all changes made by in-progress transactions are rolled back. 

These *Atomicity* and *Durability* guarantees are the foundational support for consistency provided by all relational databases. 

## Consistent Reads

At first glance, atomic writes appear to cover all the bases. However, it's still easy to get into a mess. Consider what happens when one transaction completes in the middle of whatever another transaction is doing. The second transaction may see inconsistent data. Anything read before the first transaction completes is from one valid state, everything else is from another. It's very difficult to ensure that any random combination of data read from two valid states is also a valid state.

This is where our next buzzword, *Isolation*, comes in. When [Snapshot Isolation](https://en.wikipedia.org/wiki/Snapshot_isolation) is enabled, the database ensures that each transaction reads from one consistent state. It's as if the database captured a snapshot at the time the transaction started and all reads from that transaction use that snapshot. An overlapping transaction that started later may end up working off a different, more recent snapshot.

{% include candid-image.html src="/assets/images/acid/snapshot-isolation.svg" alt="Snapshot Isolation, Reads see consistent state for duration of transaction" %}

All relational databases have some form of support for snapshot isolation. For many, it's the default isolation level, or the one that most applications use. Snapshot isolation can be implemented efficiently using the [Multi-Version Concurrency Control](https://en.wikipedia.org/wiki/Multiversion_concurrency_control) (MVCC) system that many databases already use to support atomic writes.

## Consistent Writes

Sadly, consistent reads aren't enough to ensure overall consistency. Consider two transactions that are incrementing a counter value. Each reads the current value, increments it and then writes it back. It doesn't matter what order the transactions are in, you get the same result of 2. Unless the transactions overlap, in which case the second transaction won't see the change that the first transaction is in the middle of making, and will overwrite it.

This *lost update* problem isn't too hard for a database to handle, as both transactions are writing to a common value. However, you can get a similar *write skew* problem if two transactions read from the same value and write to different values. Even worse are *phantom reads* where one transaction queries the database and finds nothing, while the other transaction is writing data that the query would have found. 

In general, you have a problem if a long running transaction would behave differently if the entire thing executed all at once at the point where it commits. It's very difficult to ensure that the changes a transaction makes, based on an earlier snapshot of state, are always valid regardless of whatever other changes have happened since then. 

Serializable Isolation addresses this problem. The database will ensure that the end result is as if each transaction had run by itself, one after the other. Which is easy to say, but much harder to implement efficiently. There are three common implementations, all of which introduce significant performance penalties.
1. Actually run the transactions one at a time on a single thread. Only viable for in-memory databases with short transactions.
2. Use locks to pause other transactions that might conflict until the current transaction has completed. Implementations usually have to fallback on conservatively locking large parts of the database to handle potental *phantom reads*.
3. Extend the MVCC system by keeping track of which versions of data have been read (or potentially read) by one transaction and later written to by another. Then fail any transaction with conflicts at commit time. 

## End to End Consistency
