---
title: Eventual Consistency for an Event Sourced Spreadsheet
tags: spreadsheets aws
---

{% capture el_url %}{% link _posts/2023-08-07-spreadsheet-event-log.md %}{% endcapture %}
[Last time]({% link _posts/2023-08-11-ensuring-eventual-consistency.md %}) we looked at general approaches to ensuring eventual consistency in the cloud. Now it's time to apply what we've learnt to the case of my [Event Sourced Cloud Spreadsheet]({% link _topics/spreadsheets.md %}). Previously, I went into some detail on how to [implement an Event Log using DynamoDB]({{ el_url }}). Long story short, there are some operations that involve multiple writes and some that need to trigger side effects. 

Now it's time to work out how to do it reliably. Here's the architecture we'll put together over the course of this post.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/snapshot-creation-architecture.svg" alt="Snapshot Creation Architecture" %}

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

AWS documentation doesn't provide full details on how stream records are sharded beyond stating that Lambda [ensures in-order processing at the partition key level](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html#dynamodb-polling-and-batching). However, [responses to support requests](https://stackoverflow.com/questions/44266633/how-do-dynamodb-streams-distribute-records-to-shards) make it clear that shards correspond to DynamoDB storage partitions.

{% include candid-image.html src="/assets/images/dynamodb-store-nodes-stream-shards.svg" alt="DynamoDB Storage Partitions and Stream Shards" %}

In our case, what this means is that our Lambda function will see all the entries for a specific log segment in order. However, log entries from different segments may be seen in the wrong order or be processed in parallel by two different lambda invocations. Each snapshot has a dependency on the previous snapshot, so we'll need our own measures to ensure that snapshots are always created in the right order.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/log-segments-snapshots.svg" alt="Log Segments and Snapshots" %}

Stream records are retained for 24 hours. It's vital that our Lambda function keeps up with the rate of writes. It should perform a minimum of processing for each record. It certainly can't run anything as heavyweight as snapshot creation inline. We have no control over how partition keys are mapped to physical storage partitions. Log segments from multiple different spreadsheets will share the same storage partition. We can't have some long running operation on one spreadsheet block progress on another. 

On the plus side, we don't have to do anything for most writes. The DynamoDB Lambda integration supports filtering so we can set things up so that our Lambda function is only invoked for log entries where a side effect is needed: snapshots and large entries with a payload stored in S3.

## SQS

I'll need a background job system to process the snapshots. The simplest solution is an [SQS queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-basic-architecture.html) with another [Lambda function as the consumer](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html).

The Lambda function that processes the DynamoDB streams records simply has to add a message to the SQS queue whenever it sees a snapshot log entry has been created. This function might fail before anything happens, or after sending the SQS message but before returning success. In each case the Lambda infrastructure will retry (if necessary, until the 24 hour retention time has elapsed). This means that duplicate SQS messages might be sent. 

Sending a message to a [standard SQS queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html) is not idempotent. You will end up with duplicate messages in the queue. There's no point in trying to prevent this from happening as SQS has at least once delivery semantics. If SQS may itself occasionally deliver a message twice, you need to handle duplicated messages in the consumer. 

SQS message delivery is fault tolerant and highly scalable. The Lambda integration automatically scales up the number of concurrent lambda function invocations. Messages are retained for up to 14 days. Messages remain in the queue until the consumer has acknowledged successful processing by explicitly deleting the message. After a configurable [visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html), undeleted messages become eligible for redelivery. We'll use this to our advantage to ensure that snapshot creation eventually completes. The message triggering snapshot creation stays in the queue until it's done while we manipulate the visibility timeout to defer and resume execution as needed.

## Pending Snapshots Table

I'm going to use a "Pending Snapshots" DynamoDB table to help orchestrate the snapshot creation process. It will help with managing duplicate messages, ensuring snapshots are created in the right order and keeping track of intermediate state during the creation process.

| Attribute | DynamoDB Type | Format | Description |
|-|-|-|-|
| Log Id (PK) | Binary | UUID | Identifies log that contains this snapshot entry |
| Num (SK) | Number | Lexicographically ordered pair of numbers | Segment num and Entry num that identify snapshot entry |
| Created | Number | [Unix Epoch Time](https://en.wikipedia.org/wiki/Unix_time) in seconds | Date time when created |
| Modified | Number | [Unix Epoch Time](https://en.wikipedia.org/wiki/Unix_time) in seconds | Date time when last modified |
| Active | Boolean | Flag | True if a Lambda invocation is actively working on this snapshot |
| Increment | Number | Incrementing integer | Increments each time we update the item |
| State | String | JSON | Encoded intermediate checkpoint state |

Each pending snapshot is uniquely identified by the combination of log id, segment num and entry num. We use a sort key that combines segment and entry num so that we can retrieve pending snapshots for a log in the order in which they need to be processed.

## Snapshot Creation

The SQS job queue is processed by a dedicated snapshot creation Lambda function. The function is invoked with the log id, segment number and entry id of the snapshot entry the snapshot is being created for. It first queries the pending snapshots table to find the first in-progress snapshot for the log (if any). If there's an earlier pending snapshot, we need to wait until it's complete. We update the visibility timeout for this message so that SQS will wait for a while before redelivering it and then exit.

If there's already a pending snapshot entry for this snapshot, then this must be a duplicate message or a retry of a previous attempt at snapshot creation. If the Active flag is clear it most be a retry, otherwise we'll need to use a timeout to decide which case it is. If the time since the item's Modified timestamp is greater than the timeout, we assume the previous invocation has died and claim the pending snapshot for ourselves by using a conditional write to update the Increment and Modified attributes. We can then continue processing from the last checkpoint. If the conditional write fails, we've lost a race with with another invocation. This must be a duplicate message, so we delete it and exit. 

If the existing pending snapshot hasn't timed out yet, we change the visibility timeout for the message to the time remaining before timeout and exit. How long should the timeout be? That will need some experimentation.

If there was no existing pending snapshot for this snapshot, we next query the segment table to find the last snapshot for this log. If this (or a later snapshot) is already complete, the message must be a late arriving duplicate so delete it and exit. 

We can now formally start the process of snapshot creation by using a conditional write to create a new pending snapshot entry (conditional on entry not existing). Again, if the conditional write fails this must be a duplicate message, so we delete it and exit.

We can finally start the real work by reading all log entries since the last snapshot. There is one more early out condition. It's possible that we have started processing a snapshot before any work on the previous snapshot has started. If we find an earlier unprocessed snapshot in the log the simplest way to handle it is to clear the Active flag, change the visibility timeout for this message and exit. 

## Checkpoints

Finally, we can go ahead and follow the instructions in my [previous]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) [blog]({% link _posts/2023-06-05-spreadsheet-insert-delete.md %}) [posts]({% link _posts/2023-07-03-spreadsheet-merge-import.md %}) on snapshot creation. However, we need to be careful. Snapshots are arbitrarily large so we can't assume that creation can complete in one lambda execution (limited to 15 minutes at most). The process will need to write regular checkpoints to the State attribute in the pending snapshots table. A good cadence would be after writing out each snapshot chunk. The state should include enough information that another Lambda invocation can pick things up from there. 

Each chunk has a maximum size of a few MB and the snapshot creation process is designed to operate with a limited amount of memory. We should be able to make the time required between checkpoints relatively small and predictable. That in turn means we can use a lower timeout value. Instead of needing to allow the time required to create the complete snapshot before deciding that a previous invocation has died, we only need to allow the maximum time between checkpoints. 

The Lambda function should check whether it's getting close to the maximum execution time after each checkpoint. If necessary, it can transfer execution to a new function invocation by clearing the Active flag and [terminating the visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html#terminating-message-visibility-timeout) for the message (so that it will immediately be available for redelivery) and exiting. 

If the Lambda invocation crashes or despite our best efforts runs out of execution time, the message will be redelivered after the visibility timeout expires. All that we've lost is a little time and the work done since the last checkpoint. 

When the snapshot creation is complete, all that remains is to write the snapshot root id back to the snapshot log entry, update the last snapshot attribute on the owning segment and remove the entry from the pending snapshots table. Then we can finally delete the message from SQS and declare it a job well done. 

## Idempotence

We've tried to recognize cases where side effects are repeatedly invoked and avoid them. However, there will always be edge cases that allow side effects to be run twice, sometimes even at the same time. That's where we have to rely on the natural idempotence of the operations.

Setting a tag value on an object in S3 to disable auto-delete is trivially idempotent.

Snapshot creation is another matter. It *is* naturally idempotent. Event log entries are immutable so you should get the same result every time you create a snapshot at the same log entry. However, making sure the implementation is *actually* idempotent needs attention to detail.

Snapshot creation involves creation of lots of S3 objects. If we generate a new unique id for each object, for example by creating a random UUID, we could easily end up with orphaned objects in S3 after a repeat snapshot. Instead we need to use predictable ids based on the snapshot entry id. [Hash UUIDs](https://en.wikipedia.org/wiki/Universally_unique_identifier#Versions_3_and_5_(namespace_name-based)) are useful if you want a consistent id format rather than an accumulation of different parts. [Writes to S3 are atomic](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html#ConsistencyModel) so you never seen the results of a partial or failed write. In our case either the object doesn't exist or it exists with the correct content. 

What happens if duplicate snapshot invocations overlap? That won't cause a problem for the objects in S3. However, we will need to be careful with the intermediate checkpoint state we're writing to DynamoDB. Updates to an individual item are atomic so we don't have to worry about corrupt state. However, concurrent invocations could result in checkpoints jumping forwards and backwards. It should all work out in the end but it feels wasteful and chaotic. We can use a conditional write to ensure that checkpoints only move forward. If we find ourselves trying to write a checkpoint which has already moved on, we know there's another invocation active and can take the usual action to bail out.

You may be wondering why I'm using standard SQS queues rather than [FIFO queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html). FIFO queues guarantee that order is maintained and have built in message deduplication. Can't we avoid all this complexity? The guaranteed order is no use to us because we can't guarantee that we added messages to the queue in the right order to begin with. FIFO queues are more expensive, much less scalable and the deduplication operates within a limited time window. It's more robust to make sure the consumer is idempotent. 

## Manual Fallback

What happens if DynamoDB stream records or SQS messages expire before they're processed? What happens if there's a major AWS outage or a minor bug in our implementation? 

While this whole system should run like clockwork, it's always wise to have a plan B. Event sourcing helps us here too. The source of truth is the event log so in the worst case we can throw everything in S3 away and recreate all the snapshots. If stream records or SQS messages go missing, we can manually trigger snapshot creation starting from the last successful snapshot. The state stored in DynamoDB makes it easy to see where side effects haven't happened yet.

It would be useful to have a tool that can reprocess event logs starting from a specified date. Read through log entries from the starting point, adding messages to the SQS queue where needed.

