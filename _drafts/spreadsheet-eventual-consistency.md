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

Ironically, this part of the operation doesn't need to be reliable. I can take the simple approach and run the logic in the API handling Lambda immediately after it writes the log entry to DynamoDB. If it decides a snapshot is needed, it adds a special case "Snapshot" entry to the log. This may be done as part of creating a [new log segment]({{ el_url | append: "#create-new-segment" }}). 

What happens if the Lambda dies between writing the log entry and adding the Snapshot entry? Well, we won't create a snapshot this time. However, the next time a log entry is added the same logic will run again, we'll still be in need of a snapshot and we'll try again. It won't matter if occasionally there are 101 or 102 events between snapshots. If it did matter, I could also fallback on the crutch of DynamoDB transactions and write both entries using a single transaction.

What does matter is that once a Snapshot entry has been written, the [complex machinery]({% link _posts/2023-07-03-spreadsheet-merge-import.md %}) of snapshot creation leaps into action and keeps going until the snapshot is complete. 

## DynamoDB Streams

The simplest way of reliably triggering logic in response to a write is to use the database's change data capture mechanism. For DynamoDB, that's [DynamoDB streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html). 

Every modification to the log table will [add a record](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html) to the corresponding DynamoDB stream. Streams are [organized into shards](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html#Streams.Processing) for horizontal scalability. The [DynamoDB Lambda integration](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html) will invoke a Lambda function whenever new records are added to a shard. By default, there is at most one lambda invocation running per shard. This ensures that stream records for each shard are processed in order. The Lambda integration [polls for new records](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html#dynamodb-polling-and-batching) at least four times a second and passes a batch of records to your Lambda function.

AWS documentation doesn't provide full details on how stream records are sharded beyond stating that Lambda [ensures in-order processing at the partition key level](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html#dynamodb-polling-and-batching). However, [responses to support requests](https://stackoverflow.com/questions/44266633/how-do-dynamodb-streams-distribute-records-to-shards) make it clear that shards correspond to DynamoDB storage nodes.

* IMAGE HERE

In our case, what this all means is that our Lambda function will see all the entries for a specific log segment in order. However, log entries from different segments may be seen in the wrong order or be processed in parallel by two different lambda invocations. Each snapshot has a dependency on the previous snapshot, so we'll need our own measures to ensure that snapshots are created in the right order.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/log-segments-snapshots.svg" alt="Log Segments and Snapshots" %}

Stream records are retained for 24 hours. It's vital that our Lambda function keeps up with the rate of writes. It should perform a minimum of processing for each record. It certainly can't run anything as heavyweight as snapshot creation inline. We have no control over how partition keys are mapped to physical storage partitions. Log segments from multiple different spreadsheets will share the same storage node. We can't have some long running operation on one spreadsheet block progress on another. 

On the plus side, we don't have to do anything for most writes. The DynamoDB Lambda integration supports filtering so we can set things up so that our Lambda function is only invoked for log entries where a side effect is needed: snapshots and large entries with a payload stored in S3.

## Snapshot Creation

I'm going to use a "Pending Snapshots" DynamoDB table to help orchestrate the snapshot creation process. It will handle both ensuring that snapshots are created in the correct order and keeping track of intermediate state during the creation process.

| Attribute | DynamoDB Type | Format | Description |
|-|-|-|-|
| Log Id (PK) | Binary | UUID | Identifies log that contains this snapshot entry |
| Num (SK) | Number | Lexicographically ordered pair of numbers | Segment num and Entry num that identify snapshot entry |
| Created | Number | [Unix Epoch Time](https://en.wikipedia.org/wiki/Unix_time) in seconds | Date time when created |
| Modified | Number | [Unix Epoch Time](https://en.wikipedia.org/wiki/Unix_time) in seconds | Date time when last modified (State updated) |
| State | String | JSON | Encoded intermediate checkpoint state |

Each pending snapshot is uniquely identified by the combination of log id, segment num and entry num. We use a sort key that combines segment and entry num so that we can retrieve pending snapshots for a log in the order in which they need to be processed.

I'll need a background job system to process the snapshots. The simplest solution is an [SQS queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-basic-architecture.html) with another [Lambda function as the consumer](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html).

The Lambda function that processes the DynamoDB streams records performs two steps. First, it writes an item into the Pending Snapshots table, then it adds a message to the SQS queue containing the log id for the snapshot. 

* Snapshot creation
  * Use a DynamoDB pending snapshots table to keep track of log id, segment num plus entry num
    * Combine segment num and entry num into a lexicographically ordered composite sort key so we have clear ordering of snapshots per log
    * Remove entry when corresponding snapshot is complete
  * Write entry to pending snapshots table and add message to SQS queue identifying the log with pending snapshot
  * Snapshot creation Lambda subscribes to queue
    * Need to enforce serialization of snapshots for same event log ourselves
    * When Lambda invoked find first pending snapshot for specified log and use conditional write to mark it as in progress
    * If no entry retry with a consistent read. If still no entry delete message from SQS (previous execution must have crashed between removing entry from table and returning message processed, or this is a duplicate delivery from SQS itself)
    * If first entry already in progress and not older than max Lambda runtime, set visibility timeout for when you expect it to be done and exit. Most likely next snapshot has been requested before previous has finished.
      * Alternatively mark this snapshot as pending on previous and delete message. At end of each snapshot check if next marked as pending and send message to queue and remove mark. Downside - if there's a backlog will be at back of queue, whereas when visibility timeout expires is still at front of queue. 
    * Execute the snapshot creation, using pending snapshot item to track intermediate state that you can restart from
      * Most of snapshot creation is merging segments from earlier snapshots.
      * Segments are variable size, arbitrarily large so can't assume merge can complete in one lambda execution
      * Can checkpoint after each chunk output. Chunks have a size limit so reasonable to assume a chunk can be output within Lambda execution. 
    * If in danger of exceeding max runtime, transfer execution to a new Lambda via terminating visibility timeout for message
    * Will still eventually work if run out of time but have to wait for visibility timeout and will have wasted work since last checkpoint.
    * Remove entry from table
    * Return message processed to SQS

## Idempotency

*  Both side effects are naturally idempotent
 * One is a simple set tag to turn off auto delete
 * Event log is idempotent so doesn't matter how many times you create snapshot, will get the same result
* For things like snapshot want to avoid possibility of creating twice and orphaning a copy in S3
* Can be helpful to use hash guid based identifiers so the snapshot for a specific entry on a specific log always has same id
* Streams processing Lambda has two steps: write to pending snapshots + add message to queue. Need this to be idempotent too.
  * Write to pending events is easy - use log + segment num + entry num as primary id, repeat write is naturally idempotent.
  * SQS standard queues are at least once delivery. Receiving process has to be idempotent, so no point trying to avoid sending duplicates after retry.
  * FIFO queue ordering guarantees are no use to us because we can't send messages in order. Deduplication is limited - more robust to make receiver idempotent anyway.

## Manual Fallback

* What happens if DynamoDB streams records expire before they're processed. Either due to bug in implementation or major AWS outage?
* Have tool that can reprocess event logs starting from specified date
* Works like stream processor. Reading entries, invoking Lambda with batch, using temp DynamoDB item to track progress


