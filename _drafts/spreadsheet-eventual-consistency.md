---
title: Ensuring Eventual Consistency for an Event Sourced Spreadsheet
tags: spreadsheets aws
---

[Last time]({% link _posts/2023-08-11-ensuring-eventual-consistency.md %}) we looked at general approaches to ensuring eventual consistency in the cloud. Now it's time to apply what we've learnt to the case of my [Event Sourced Cloud Spreadsheet]({% link _topics/spreadsheets.md %}). Previously, I went into some detail on how to [implement an Event Log using DynamoDB]({% link _posts/2023-08-07-spreadsheet-event-log.md %}). Some operations trigger a background process that creates a snapshot of the spreadsheet state. 

Now it's time to work out how to do that reliably.

## Event Sourcing

* Large entry stored in S3
  * Discardable write to S3, create log entry, side effect to remove auto-delete tag
* Snapshot when an entry with type Snapshot is created
  * Kickoff background process
  * When complete process writes S3 object id into Snapshot entry and updates LastSnapshot for segment
  * Snapshot process should wait if earlier snapshot is still running (new snapshot will typically depend on previous snapshot)

## DynamoDB Streams

* Filter on type and other properties so Lambda only run for cases where side effect needed
* Shard per partition
  * Records processed in batch in strictly serialized order per shard (unless you opt into parallel processing)
  * Lambda that processes batch needs to keep up with rate of writes. Stream data only available for 24 hours
  * Will usually have multiple partition keys per shard
  * Can't do anything long lasting or potentially blocking directly, like a big snapshot.
  * In most cases items with same partition key will be in same shard, so strictly ordered
  * Exception is when there are too many items to fit into shard. We avoid that by dividing into segments.
  * Know that stream processing within a segment is stricly serialized
  * No guarantee of ordering between events in different segments of same log
* S3 discardable write
  * Simple API call so can process immediately
* Snapshot creation
  * Can't do inline
  * Use a DynamoDB pending snapshots table to keep track of log id, segment num plus entry num
    * Combine segment num and entry num into a lexicographically ordered composite sort key so we have clear ordering of snapshots per log
    * Remove entry when corresponding snapshot is complete
  * Write entry to pending snapshots table and add message to SQS queue identifying the log with pending snapshot
  * Snapshot creation Lambda subscribes to queue
    * Need to enforce serialization of snapshots for same event log ourselves
    * When Lambda invoked find first pending snapshot for specified log and use conditional write to mark it as in progress
    * If no entry retry with a consistent read. If still no entry return message processed to SQS (previous execution must have crashed between removing entry from table and returning message processed)
    * If first entry already in progress and not older than max Lambda runtime, return message to queue and exit. Most likely next snapshot has been requested before previous has finished.
    * Execute the snapshot creation, using pending snapshot item to track intermediate state that you can restart from
    * If in danger of exceeding max runtime, transfer execution to a new Lambda (direct invoke, or via returning message to SQS?)
    * Remove entry from table
    * Return message processed to SQS

## Idempotency

*  Both side effects are naturally idempotent
 * One is a simple set tag to turn off auto delete
 * Event log is idempotent so doesn't matter how many times you create snapshot, will get the same result
* For things like snapshot want to avoid possibility of creating twice and orphaning a copy in S3
* Can be helpful to use hash guid based identifiers so the snapshot for a specific entry on a specific log always has same id

## Manual Fallback

* What happens if DynamoDB streams records expire before they're processed. Either due to bug in implementation or major AWS outage?
* Have tool that can reprocess event logs starting from specified date
* Works like stream processor. Reading entries, invoking Lambda with batch, using temp DynamoDB item to track progress


