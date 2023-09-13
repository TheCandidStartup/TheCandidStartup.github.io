---
title: ACID! - Atomicity, Consistency, Isolation, Durability
tags: cloud-architecture databases
---

There are lots of things you need to worry about when building a cloud application. Often the hardest problems only appear as you scale up, when multiple clients interact with the same data at the same time. 

What does your application need to do to ensure consistency of its stored state? How do you resolve the inevitable conflicts when two users try to change the same data? 

From the 1970s to the 2000s, before the rise of NoSQL databases, the answer was clear cut. You built your app using a relational database whose mystical [ACID properties](https://en.wikipedia.org/wiki/ACID) would make everything OK. However, when you use a relational database, you're confronted with a bewildering array of [configuration options](https://www.postgresql.org/docs/current/mvcc.html). 

Where's the simple ACID tick box? And what does ACID mean anyway?

## ACID

ACID stands for Atomicity, Consistency, Isolation and Durability. It's one of those cases where the [creators](https://dl.acm.org/doi/10.1145/289.291) worked hard to come up with a list of terms that would make a cool acronym.

It's an odd collection of terms because consistency is an application level property, while the other three are *some* of the properties of a database that help to achieve application level consistency. 

Most definitions of ACID treat consistency as another property of the database. It's true that a database ensures that its own internal state stays consistent, and it's true that databases allow the application to define additional constraints and invariants that the database will enforce. However, it's rare that a database can ensure application consistency all by itself. 

## Consistency

Every application will have its own notion of what it means to be in a consistent state. There will be input validation checks to ensure that data being stored is valid. There will be rules and invariants that define what is valid. Application code will be written to ensure that any change maintains those invariants.

This is straightforward enough, as long as there's only one client working at a time. As soon as you have multiple, simultaneous clients, it becomes horribly complex. Luckily, your relational database is standing by, ready to help. 

## Atomic Writes

At some point your application will reach a level of complexity where you need to make multiple changes to move from one consistent state to another. You could write the obvious application code that makes the required changes one after the other. You end up with two big problems.

First, what happens if something goes wrong in the middle of a set of changes? Maybe your app server crashes. Now you stored state is, by definition, inconsistent. 

Second, what happens if multiple clients are making changes at the same time? The two clients interfere with each other. If one client reads while another is in the middle of making changes, it will see an inconsistent state, a *dirty read*. Writes from both clients can end up interleaved. One client may overwrite the change that the other is part may through making, a *dirty write*. It's very difficult to ensure that every possible ordering of updates will result in a consistent state.

{% include candid-image.html src="/assets/images/acid/scattered-writes.svg" alt="Interleaved Writes, Other reads see intermediate state" %}

Atomic writes solve both problems. The database lets the application define the set of changes as a combined transaction. The database ensures that all the changes are made together, or don't happen at all. Another client reading the database will either see all the changes or none of them. If two in-progress transactions conflict, one of them will succeed with all changes visible, while the other will fail with no changes made. 

{% include candid-image.html src="/assets/images/acid/atomic-writes.svg" alt="Atomic Writes, Other reads see final state after commit" %}

If the database crashes, it ensures that all changes made by committed transactions persist after the database recovers and that all changes made by in-progress transactions are rolled back. 

These *Atomicity* and *Durability* guarantees are the foundational support for application consistency provided by all relational databases. 

## Consistent Reads

At first glance, atomic writes appear to cover all the bases. However, it's still easy to get into a mess. Consider what happens when one transaction completes in the middle of whatever another transaction is doing. The second transaction may see inconsistent data. Anything read before the first transaction completes is from one valid state, everything else is from another. It's very difficult to ensure that any random combination of data read from two valid states is also a valid state.

This is where our next buzzword, *Isolation*, comes in. When [Snapshot Isolation](https://en.wikipedia.org/wiki/Snapshot_isolation) is enabled, the database ensures that each transaction reads from a consistent state. It's as if the database captured a snapshot at the time the transaction started and all reads from that transaction use that snapshot. An overlapping transaction that started later may end up working off a different, more recent snapshot.

{% include candid-image.html src="/assets/images/acid/snapshot-isolation.svg" alt="Snapshot Isolation, Reads see consistent state for duration of transaction" %}

All relational databases have some form of support for snapshot isolation. For many, it's the default isolation level, or the one that most applications use. Snapshot isolation can be implemented efficiently using the [Multi-Version Concurrency Control](https://en.wikipedia.org/wiki/Multiversion_concurrency_control) (MVCC) system that many databases already use to support atomic writes.

## Consistent Writes

Sadly, consistent reads aren't enough to ensure overall consistency. Consider two transactions that are incrementing a counter value. Each reads the current value, increments it and then writes it back. It doesn't matter what order the transactions are in, the end result is that the counter is increased by two. Unless the transactions overlap, in which case the second transaction won't see the change that the first transaction is in the middle of making, and will overwrite it.

This *lost update* problem isn't too hard for a database to handle, as both transactions are reading from and writing to a common location. The database can provide an atomic increment operation or use locks to manage access to the common location. 

You can get a similar *write skew* problem without writes to a common location. Let's say you have two different locations whose values need to satisfy an invariant. For example, they're pots of money in a bank account whose sum needs to be greater than zero. Two overlapping transactions each decrement money from a different pot. Both transactions see the same starting valid state and don't see the change the other transaction made. To identify this conflict, databases need to start locking or tracking reads.

Even worse are *phantom reads* where one transaction queries the database, finds nothing, and writes back on that basis. Meanwhile another transaction is writing data that the query would have found. Now the database has to lock or track use of indexes. 

In general, a *serialization failure* occurs when a transaction would behave differently if the entire thing executed, all at once, at the point where it commits. It's very difficult to ensure that the changes a transaction makes, based on an earlier snapshot of state, are always valid regardless of what other changes have committed since then. 

{% include candid-image.html src="/assets/images/acid/serialization-failure.svg" alt="Transaction may change behavior if it commits at same point but starts later" %}

[Serializable Isolation](https://en.wikipedia.org/wiki/Serializability) addresses this problem. The database will ensure that the end result is the same as if all transactions run independently, one after the other. Which is easy to say, but much harder to implement efficiently. There are three common implementations, all of which introduce significant performance penalties.
1. Actually run the transactions one at a time on a single thread. Only viable for in-memory databases with short transactions.
2. Use locks to pause other transactions that might conflict until the current transaction has completed. Implementations usually have to fallback on conservatively locking large parts of the database to handle potental *phantom reads*.
3. Extend the MVCC system by keeping track of which versions of data have been read (or potentially read) by one transaction and later written to by another. Then fail any transaction with conflicts at commit time. 

## End to End Consistency

Let's say you're willing to pay the price for serializable isolation, in exchange for guaranteed consistency. Does it actually work?

Serializable isolation depends on everything significant happening inside a transaction. That includes any reads that ultimately have an influence on later writes. 

Originally, the database interaction model was session based. Each client has a persistent session. Transactions can be long running, including time for user input. The typical interaction loop was start transaction, read data from the database, user decides what to, user makes changes, end transaction. Then repeat.

Nobody works that way anymore, especially in the cloud. The typical application architecture is a client connecting to a load balancer which distributes the request to a randomly selected app server which in turn connects to the database. The whole thing is designed to be stateless for increased performance and resilience. Clients will connect to multiple app servers, app servers will handle requests from multiple clients. There's no per client persistent connection anywhere. 

Long running transactions are a performance killer. You certainly don't want a transaction left open while a user decides what to do. You don't even want a transaction left open while there's a round trip from client to app server. Transactions these days are handled by the app server with a transaction scope limited to processing a single API call. 

Clients are becoming thicker with local state maintained for the life of the user's session, or even over multiple sessions with [progressive apps]({% link _posts/2023-09-04-event-sourced-database-grid-view.md %}). The standard interaction model is to first run a load of read only queries to populate the client UI. For example, it may use paged queries over a collection to fill out a [Grid view]({% link _posts/2023-06-12-database-grid-view.md %}). Other clients may modify the database between successive queries, so the client may start out with inconsistent or out of date data. 

The user then navigates through the data and then decides to make some changes. The client calls a REST API which in turn updates the database. Client state gets updated in some ad hoc way as the database is further modified by other clients. Even if you're incredibly aggressive about updating the client, you can still end up with the client calling the API to make changes based on old local state.

{% include candid-image.html src="/assets/images/acid/client-state.svg" alt="Clients can make changes based on old local state" %}

How do you deal with this? In the end it comes down to thoughtful API design. Let's take a simple example. There's a common user task which involves incrementing a value. Instead of having a simple CRUD API that let's you read and write values, provide a specialized API that performs the complete user increment task. Now the read-modify-write occurs naturally within a single transaction. The downside is that such APIs are not naturally idempotent, so you will need to include an extra mechanism like an [idempotency key](https://stripe.com/docs/api/idempotent_requests) to ensure that the client can safely retry failed requests.

More generally, you need to structure the API so that you don't rely on the client's view of the current state. Security 101 says never trust the client. The same is true when it comes to maintaining consistent state. Design the API so that each individual API call goes from one consistent state to another, depending only on server side information, which you make sure to query from the database in the same transaction.

You still have the problem that the user may be making choices based on out of date information. The application goes from one consistent state to another, but it's the wrong consistent state. The answer is to make updates conditional. The API call includes the user's context. If the current state is different, the API call should fail. For example, a simple Grid View based editing UI can make its updates conditional on the item being edited not having changed since it was retrieved. Again, careful API design is needed. 

## Reality Bites

What do people actually do? In my experience, it's rare for teams to bother with any of this. If they use transactions at all, it's with something short of full serializability that doesn't have scary performance warnings. It's easy to assume that it will all be fine and that those edge cases don't apply in our case. 

Sometimes it is fine. Particularly in the early days before your app takes off and you need to scale up. When that happens, whatever time you saved is traded in for reacting to intermittent, hard to reproduce bugs. Then you can play whack-a-mole mitigating specific problems as you identify them. 

If you're really unlucky, your database ends up in such a mess that you have to give up on any idea of maintaining consistent state. Your app becomes a tangle of patches and workarounds that allow some form of functionality to continue with bad data.

Unfortunately there is no silver bullet that lets you avoid having to think. You need to think about what consistent state you actually need, how that should be exposed through your API and what database features to use in maintaining consistency. 
