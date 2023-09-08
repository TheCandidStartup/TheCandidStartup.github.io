---
title: Consistency and Conflict Resolution for Event Sourced Systems
tags: cloud-architecture spreadsheets
---

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
I'm a [big]({% link _posts/2023-09-04-event-sourced-database-grid-view.md %}) [fan]({{ bb_url | append: "#event-sourcing" }}) of [Event Sourced](https://martinfowler.com/eaaDev/EventSourcing.html) systems. However, so far, I've waved my hands and told you that everything is wonderful. 

A traditional web app built around a relational database can rely on a raft of features that address these problems, battle tested over forty years of development. Even then, it's hard enough to get it right. 

Is it really feasible to roll your own event sourced system while ensuring consistency and handling conflict resolution?

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