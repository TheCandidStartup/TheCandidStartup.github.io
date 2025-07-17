---
title: Infinisheet Tracer Bullet Snapshots
tags: infinisheet
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

wise words

# Snapshot Completion

* How to know when a snapshot workflow has completed?
* Will pick up new snapshot implicitly when client starts up
* Long running client could end up with a huge log segment unless there's some kind of explicit notification
* Considered adding a `workflowCompletion` event to `EventLog`
* For workflows running on the same instance could have worker post a message back to the host
* For distributed implementation would need something like a web socket connection so server could notify client
* Opens up reliability problem. What if snapshot completes and event log updated but worker fails before notification sent or notification gets lost?
* Need a fallback mechanism which polls for update to event log. If web socket not possible, becomes primary mechanism.
* What does engine do when it gets completion event? It could start a new log segment immediately, copy over events that happened since snapshot and create a new content snapshot. However, content hasn't actually changed. Just internal stuff. Client pointlessly re-renders. Not end of the world but annoying.
* Insight: Doesn't matter that there's a new snapshot until there are more entries to add to the event log. 
* Have a pending flag and create the pending new segment whenever you're about to add entries to the event log. 
* Insight: Client doesn't need to know there's a new snapshot until there are more entries to add. There are only more entries to add as a result of calling `query` or `addEntry` on the event log.
* If we extend those methods so they can also return the most recent snapshot, then we don't need a separate polling call, and we don't need a separate workflow completion event.
* Add optional argument of sequence id of snapshot that the client is currently using. If there's a most recent snapshot, it gets added to response.
* Works nicely with multiple clients too

# Event Log BlobId

* Expects to identify snapshot and history blob using a `BlobId` which is a `string`
* Gives flexibility to the next level up for how they want to use this
* If I do File System style, what would my `BlobId` be?
* If I'm only thinking about a single spreadsheet then for snapshots it would be name of blob in `snapshots` dir, for history it would be name of blob in `history` dir. Simple enough.
* What about multiple spreadsheets? How does `EventLog` know which `snapshots` dir to look in? 
* `EventLog` doesn't look anywhere. It doesn't care how `BlobId` is interpreted. Layer above decides how to tie `EventLog` and `BlobStore` together
* Simplest way of managing multiple spreadsheets is to use upper layers of blob store as a user visible file system: folders containing spreadsheets. No new abstraction needed. Easy to implement folder hierarchy. 
* Store per-spreadsheet metadata in a blob insider per-spreadsheet directory. Metadata can include `EventLog` id in whatever database is being used.
* Don't need to identify which spreadsheet in `BlobId` because we start from spreadsheet to get `EventLog`. Layer above will already know which `BlobDir` to use with `BlobId` in event log. 


