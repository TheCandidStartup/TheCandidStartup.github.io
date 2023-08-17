---
title: Eventual Consistency for an Event Sourced Spreadsheet
tags: spreadsheets aws
---

{% capture el_url %}{% link _posts/2023-08-07-spreadsheet-event-log.md %}{% endcapture %}
[Last time]({% link _posts/2023-08-11-ensuring-eventual-consistency.md %}) we looked at general approaches to ensuring eventual consistency in the cloud. Now it's time to apply what we've learnt to the case of my [Event Sourced Cloud Spreadsheet]({% link _topics/spreadsheets.md %}). Previously, I went into some detail on how to [implement an Event Log using DynamoDB]({{ el_url }}). Long story short, there are some operations that involve multiple writes and some that need to trigger side effects. 

Now it's time to work out how to do it reliably.

## Event Sourcing

The first step in [my recipe](({% link _posts/2023-08-11-ensuring-eventual-consistency.md %})) for ensuring eventual consistency is to identify the single write that can act as a linchpin for the overall operation. That write needs to capture the complete intent of the operation so that in the event of a disaster you can use what was written to complete any missed side effects. 

Conveniently, event sourcing is a perfect fit. The whole idea is that your source of truth is a single write that captures the complete intent of the operation. That's our linchpin write sorted. 

Well, nearly. We do have the additional complexity that for large events the bulk of the payload is stored in S3 with just metadata in DynamoDB. However, we already have a playbook for this. We need a discardable write of the payload to S3 (creating it with a tag that will auto-delete after a few days), then the linchpin write that adds the event to the log in DynamoDB (including the S3 object id where the payload is stored), then finally a side effect that removes the auto-delete tag from the S3 object.

From the client's point of view the sequence of operations is :
1. Call API to create a large event, response includes an S3 signed url to upload to
2. Upload payload to signed url
3. Call API to complete creation of event

## Snapshots

Every so often the spreadsheet backend will need to [create a snapshot]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}). The backend in this case is just the Lambda function invoked when a log entry is added by the client. I'm not sure exactly what the logic will be for deciding when a snapshot is needed. That will need some experimentation. It could be as simple as saying you need a snapshot after every 100 log entries. Whatever it is, some logic will need to run after each log entry is added to make the decision and kick off the process. 

Ironically, this part of the operation doesn't need to be reliable. I can take the simple approach and run the logic in the API handling Lambda immediately after it writes the log entry to DynamoDB. If it decides a snapshot is needed, it adds a special case "Snapshot" entry to the log. A snapshot could be added to an existing log segment or require the creation of a [new log segment]({{ el_url | append: "#create-new-segment" }}). 

What happens if the Lambda dies between writing the log entry and adding the Snapshot entry? Well, we won't create a snapshot this time. However, the next time a log entry is added, the same logic will run again, we'll still be in need of a snapshot and we'll try again. It won't matter if occasionally there are 101 or 102 events between snapshots. If it did matter, I could also fallback on the crutch of DynamoDB transactions and write both entries using a single transaction.

What does matter is that once a Snapshot entry has been written, the [complex machinery]({% link _posts/2023-07-03-spreadsheet-merge-import.md %}) of snapshot creation leaps into action and keeps going until the snapshot is complete. 

## DynamoDB Streams

The simplest way of reliably triggering logic in response to a write is to use the database's change data capture mechanism. For DynamoDB, that's [DynamoDB streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html). 

Every modification to the log table will [add a record](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html) to the corresponding DynamoDB stream. Streams are [organized into shards](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html#Streams.Processing) for horizontal scalability. The [DynamoDB Lambda integration](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html) will invoke a Lambda function whenever new records are added to a shard. By default, there is at most one lambda invocation running per shard. This ensures that stream records for each shard are processed in order. The Lambda integration [polls for new records](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html#dynamodb-polling-and-batching) at least four times a second and passes a batch of records to your Lambda function.

AWS documentation doesn't provide full details on how stream records are sharded beyond stating that Lambda [ensures in-order processing at the partition key level](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html#dynamodb-polling-and-batching). However, [responses to support requests](https://stackoverflow.com/questions/44266633/how-do-dynamodb-streams-distribute-records-to-shards) make it clear that shards correspond to DynamoDB storage nodes.

{% include candid-image.html src="/assets/images/dynamodb-store-nodes-stream-shards.svg" alt="DynamoDB Storage Nodes and Stream Shards" %}

In our case, what this all means is that our Lambda function will see all the entries for a specific log segment in order. However, log entries from different segments may be seen in the wrong order or be processed in parallel by two different lambda invocations. Each snapshot has a dependency on the previous snapshot, so we'll need our own measures to ensure that snapshots are created in the right order.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/log-segments-snapshots.svg" alt="Log Segments and Snapshots" %}

Stream records are retained for 24 hours. It's vital that our Lambda function keeps up with the rate of writes. It should perform a minimum of processing for each record. It certainly can't run anything as heavyweight as snapshot creation inline. We have no control over how partition keys are mapped to physical storage partitions. Log segments from multiple different spreadsheets will share the same storage node. We can't have some long running operation on one spreadsheet block progress on another. 

On the plus side, we don't have to do anything for most writes. The DynamoDB Lambda integration supports filtering so we can set things up so that our Lambda function is only invoked for log entries where a side effect is needed: snapshots and large entries with a payload stored in S3.

## Pending Snapshots Table

I'm going to use a "Pending Snapshots" DynamoDB table to help orchestrate the snapshot creation process. It will handle both ensuring that snapshots are created in the correct order and keeping track of intermediate state during the creation process.

| Attribute | DynamoDB Type | Format | Description |
|-|-|-|-|
| Log Id (PK) | Binary | UUID | Identifies log that contains this snapshot entry |
| Num (SK) | Number | Lexicographically ordered pair of numbers | Segment num and Entry num that identify snapshot entry |
| Created | Number | [Unix Epoch Time](https://en.wikipedia.org/wiki/Unix_time) in seconds | Date time when created |
| Locked | Boolean | Flag | True if snapshot creation is in progress | 
| Modified | Number | [Unix Epoch Time](https://en.wikipedia.org/wiki/Unix_time) in seconds | Date time when last modified (State updated) |
| State | String | JSON | Encoded intermediate checkpoint state |

Each pending snapshot is uniquely identified by the combination of log id, segment num and entry num. We use a sort key that combines segment and entry num so that we can retrieve pending snapshots for a log in the order in which they need to be processed.

## SQS

I'll need a background job system to process the snapshots. The simplest solution is an [SQS queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-basic-architecture.html) with another [Lambda function as the consumer](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html).

The Lambda function that processes the DynamoDB streams records performs two actions. First, it writes an item into the Pending Snapshots table, then it adds a message to the SQS queue containing the log id for the snapshot. This function might fail before anything happens, after writing to DynamoDB or after sending the SQS message but before returning success. In each case the Lambda infrastructure will retry (if necessary, until the 24 hour retention time has elapsed). This means that the write to DynamoDB and/or sending the SQS message may be duplicated.

Writing the pending snapshot item to DynamoDB is naturally idempotent. We can also use a conditional write to ensure that we don't overwrite any intermediate state. Sending a message to a [standard SQS queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html) is not idempotent. You will end up with duplicate messages in the queue. There's no point in trying to prevent this from happening as SQS has at least once delivery semantics. If SQS may itself occasionally deliver a message twice, you need to handle duplicated messages in the consumer. 

SQS message delivery is fault tolerant and highly scalable. The Lambda integration automatically scales up the number of concurrent lambda function invocations. Messages are retained for up to 14 days. Messages are retained in the queue until the consumer has acknowledged successful processing by explicitly deleting the message. After a configurable [visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html), undeleted messages become eligible for redelivery. 

## Snapshot Creation

The SQS job queue is processed by a dedicated snapshot creation Lambda function. The function is invoked with a log id. It queries the pending snapshots table and retrieves the first pending snapshot item for that log id. We don't depend on the order of messages in the queue for correctness. 

If there's no pending snapshots item, try again with a consistent read. It's possible that the message was delivered before the write to DynamoDB is fully consistent. If there's still no pending snapshots item, delete the message from SQS and return. This must be a duplicate message, or a retry of a previous attempt at snapshot creation that failed before it could delete the message.

If the Locked flag is set, another function is actively working on the snapshot, or has failed and left the flag set. We'll use a timeout to decide which case it is. If the time since the item's Modified timestamp is greater than the timeout we keep going, otherwise we change the visibility timeout for the message to the time remaining before timeout and exit. How long should the timeout be? That will also need some experimentation.

Next, we use a conditional write to set the Locked flag and Modified timestamp. If the conditional write fails, we've lost a race with another invocation. Again, change the visibility timeout for the message to the time remaining before timeout and exit.

We can finally start the real work by reading all log entries since the last snapshot. There is one more early out condition. It's theoretically possible that we start processing a snapshot on a new segment before the previous snapshot on the old segment has been written to the pending snapshots table. It's highly unlikely, but it is possible. If we do find an earlier unprocessed snapshot in the log the simplest way to handle it is to once again change the visibility timeout for the message and exit. 

Finally, we can go ahead and follow the instructions in my [previous]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) [blog]({% link _posts/2023-06-05-spreadsheet-insert-delete.md %}) [posts]({% link _posts/2023-07-03-spreadsheet-merge-import.md %}) on snapshot creation. However, we need to be careful. Snapshots are arbitrarily large so we can't assume that creation can complete in one lambda execution (limited to 15 minutes at most). The process will need to write regular checkpoints to the State attribute in the pending snapshots table. A good cadence would be after writing out each snapshot chunk. The state should include enough information that another Lambda invocation can pick things up from there. 

Each chunk has a maximum size of a few MB and the snapshot creation process is designed to operate with a limited amount of memory. We should be able to make the time required between checkpoints relatively small and predictable. That in turn means we can use a lower timeout value. Instead of needing to allow the time required to create the complete snapshot before deciding that a previous invocation has died, we only need to allow the maximum time between checkpoints. 

The Lambda function should check whether it's getting close to the maximum execution time after each checkpoint. If necessary, it can transfer execution to a new function invocation by [terminating the visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html#terminating-message-visibility-timeout) for the message (so that it will immediately be available for redelivery) and exiting. 

If the Lambda invocation crashes or despite our best efforts runs out of execution time, the message will be redelivered after the visibility timeout expires. All that we've lost is a little time and the work done since the last checkpoint. 

When the snapshot creation is complete all that remains is to write the snapshot root id back to the snapshot log entry, update the last snapshot attribute on the owning segment and remove the entry from the pending snapshots table. Then we can finally delete the message from SQS and declare it a job well done. 

## Idempotence

*  Both side effects are naturally idempotent
 * One is a simple set tag to turn off auto delete
 * Event log is idempotent so doesn't matter how many times you create snapshot, will get the same result
* For things like snapshot want to avoid possibility of creating twice and orphaning a copy in S3
* Can be helpful to use hash guid based identifiers so the snapshot for a specific entry on a specific log always has same id
  * FIFO queue ordering guarantees are no use to us because we can't send messages in order. Deduplication is limited - more robust to make receiver idempotent anyway.

## Manual Fallback

* What happens if DynamoDB streams records expire before they're processed. Either due to bug in implementation or major AWS outage?
* Have tool that can reprocess event logs starting from specified date
* Works like stream processor. Reading entries, invoking Lambda with batch, using temp DynamoDB item to track progress


