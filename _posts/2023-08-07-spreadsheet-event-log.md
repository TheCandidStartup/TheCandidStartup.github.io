---
title: Implementing a Spreadsheet Event Log on DynamoDB
tags: spreadsheets databases
---

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
In the distant past, before I got sucked into a seemingly never ending [series on databases]({% link _topics/databases.md %}), I [said]({% link _posts/2023-07-03-spreadsheet-merge-import.md %}) that I was going to start formalizing the format for my cloud based, serverless, event sourced spreadsheet. I realize now that I've said very little on how I'm going to implement the central component of my spreadsheet, the [event log]({{ bb_url | append: "#event-sourcing" }}). 

I did say that the event log will be managed in a database and that DynamoDB is the only [truly serverless]({% link _posts/2022-12-05-serverless-or-not.md %}) database AWS has. It shouldn't come as too much of a surprise that I'm going to use DynamoDB for the event log. Fortunately, I just happened to finish an [in depth piece on DynamoDB]({% link _posts/2023-07-31-dynamodb-database-grid-view.md %}) last week, so it's fresh in the memory. 

## Event Log

| Event Id | Event |
|-|-|
| 1 | Import from Excel Spreadsheet stored in S3 |
| 2 | Insert new row (A=Nails,B=0.01,C=80,E=15%,H=0.08) after 1000001 |
| 3 | Set C2=100 |

The basic concept is simple. An ordered list of entries that define all changes made to the spreadsheet. The event log is the source of truth for what happens in the spreadsheet. Each entry is immutable. Maintaining a strict order of entries is critical to the integrity of the event log. 

Conflict resolution when multiple clients edit the spreadsheet at the same time will be driven by the event log. At its simplest, the order in which two clients changes appear in the event log defines what happened. We can build a variety of schemes on top of that to manage unexpected changes.

## Cloud Economics

As we're building in the cloud, we need to maintain at least a basic awareness of the cost implications of our choices. The intention is that customers will self host the spreadsheet, so we're expecting lots of AWS accounts, most of which have relatively low activity. We'll be using DynamoDB's [on demand mode](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html#HowItWorks.OnDemand) so that customers pay only for what they use. The basic [cost model](https://aws.amazon.com/dynamodb/pricing/on-demand/) for on demand DynamoDB is $1.25 per million write request units, $0.25 per million read request units, and $0.25 per GB-month for storage. 

The [DynamoDB documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/CapacityUnitCalculations.html) has detailed explanations of how many units different operations take. It can be confusing because sometimes the documentation talks about capacity units, and sometimes about request units. These are equivalent when figuring out how many units an operation consumes. The difference is in how you're charged. In on demand mode, you're charged for the units used by each *request* you make. In provisioned mode, you provision the *capacity* you need up front in terms of units per second. 

A [write unit](https://docs.amazonaws.cn/en_us/amazondynamodb/latest/developerguide/ProvisionedThroughput.html#ProvisionedThroughput.CapacityUnits.Write) represents one write to an item up to 1KB in size. You use an additional write unit for every KB written, with sizes rounded up to the nearest KB. Batch writes cost the same as performing all the writes individually. There are no extra units used for conditional writes (although write units are consumed even if the write fails). Writes in transactions use double the number of units.

A [read unit](https://docs.amazonaws.cn/en_us/amazondynamodb/latest/developerguide/ProvisionedThroughput.html#ProvisionedThroughput.CapacityUnits.Read) represents a strongly consistent read of up to 4KB of data. Unlike writes, when performing a `BatchGetItem` or `Query`, the size of all the items accessed is added together and *then* rounded up to the nearest 4KB. Reads in transactions use double the number of units, eventually consistent reads use half.

Let's say we use one DynamoDB item per entry in the transaction log. Creating a million cell spreadsheet by setting one cell at a time will cost $1.25, assuming that each entry uses less than 1 KB. Ongoing storage is up to $0.25 per month. In contrast, reading the entire transaction log using eventually consistent reads will cost *at most* $0.03, assuming that we read multiple items at a time. If we can make the entries significantly smaller than 1KB, the cost will be even less. 

In practice, we should be able to get read and storage costs even lower. We're creating [snapshots]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) of the spreadsheet in S3. We only need to read event log entries from the point when the last snapshot was created. We could delete earlier entries whenever a snapshot is created. However, it can be useful to retain transaction log entries for longer as a history.

Whatever we choose to do with old transaction log entries, there are interesting cost implications. Deleting an individual item costs the same as writing it, plus whatever it costs to query for old items that need to be deleted. In contrast, deleting an entire table is free, as is making use of DynamoDB's [TTL feature](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/howitworks-ttl.html) to automatically delete items when they reach a specified age. 

Each entry in the event log is our equivalent of a transaction. I want to be able to support large scale edits as transactions, which means I may run into the 400KB limit on DynamoDB item size. We can cope with that by storing large entries as objects in S3 and just writing the object id and basic metadata into a corresponding DynamoDB item. 

The basic [cost model](https://aws.amazon.com/s3/pricing/) for S3 is $5 per million write requests, $0.4 per million read requests, and $0.023 per GB-month for storage. S3 storage costs are ten times less than DynamoDB. Does it make sense to use S3 even for entries that would fit entirely in DynamoDB? 

For actively used parts of the transaction log, storage costs are irrelevant compared to read and write costs. Let's look at the costs for some different sizes, per million eventually consistent requests.

| Size | DynamoDB Write | DynamoDB Read | S3 Write | S3 Read |
|-|-|-|-|
| 1KB | $1.25 | $0.125 | $5 | $0.40 |
| 2KB | $2.50 | $0.125 | $5 | $0.40 |
| 4KB | $5 | $0.125 | $5 | $0.40 |
| 8KB | $10 | $0.25 | $5 | $0.40 |
| 12KB | $15 | $0.375 | $5 | $0.40 |
| 16KB | $20 | $0.50 | $5 | $0.40 |
| 32KB | $40 | $1.00 | $5 | $0.40 |
| 400KB | $500 | $12.50 | $5 | $0.40 |

S3's flat rates make it more expensive for smaller sizes and *much* cheaper for large sizes. The breakeven point is 4KB for writes and 16KB for reads. We expect each entry to be written once and read many times, so read costs are most important. If we do use S3 for a log entry, remember that we'll still have a 1KB item in DynamoDB that references it. Putting it all together, from a cost point of view, anything bigger than 16KB should be stored in S3. 

## Access Patterns

We've already established a few requirements. We want adding an entry to the log to be an atomic operation. We want to minimize our costs. That means one item per log entry. 

We want to be able to read multiple log entries in order with a single query, both for cost and performance reasons. That suggests using the partition key to identify the log and a sequence id sort key to define the order of entries. 

It's critical that we maintain a strict and consistent order of entries. The transaction log will be used to create snapshots and sync clients up to the current state of the spreadsheet. I don't want to have to deal with the complexity of an eventually consistent order. 

When an entry is written to the log, it MUST appear in the sequence *after* all previously written entries. Or, to put it another way, once any client has read a sequence of entries from the transaction log, it can't later see additional entries inserted in the sequence. The only change allowed is to see additional entries appear later in the sequence.

Read after write consistency is not required. We'll cope if newly added entries aren't immediately visible, as long as the transaction log we can see is a complete and consistent subset of the current state.

We can make use of DynamoDB [conditional writes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html#Expressions.ConditionExpressions.PreventingOverwrites) to ensure that we create a valid log. We'll use an incrementing integer sequence id as our sort key. A valid transaction log starts at sequence id 0. If the most recently added entry has id *N*, then the log MUST contain an entry with every sequence id between 0 and *N*. There are no gaps. 

To add an entry :
1. Use a `Query` with limit 1 to read the entry with the highest current sequence id. Call that id *current*.
2. Use `PutItem` to add a new entry with sequence id *current+1* with a `attribute_not_exists(sk)` condition.
3. If the write fails either another client has written a new entry between our Query and Put, or our eventually consistent query didn't see the most recently added entry. In either case, go back to step 1 and try again. 

This is a simple form of [optimistic concurrency control](https://en.wikipedia.org/wiki/Optimistic_concurrency_control). We read the current state and then perform a write conditional on the current state remaining the same. The lack of gaps in the sequence means that it's enough to check that the entry we're trying to write doesn't already exist, as long as the sequence id we're using is one greater than an entry we know exists. 

In the normal case, each add costs us one eventually consistent read and one write. If there's high contention we may need multiple tries. 

## DynamoDB Scaling and Performance

DynamoDB scales horizontally by sharding data across multiple storage partitions based on the partition key. How well will DynamoDB perform if all the entries for a transaction log have the same partition key? Each storage partition holds up to 10GB of data, which is about 10 million 1KB log entries. The entire lifetime transaction log of a small spreadsheet will fit within one storage partition.

Each storage partition has a hard limit on the amount of IO it can sustain. The [limit](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html) is 1000 write units and 3000 read units per second. That means we have a hard limit of at most 1000 transactions per second per spreadsheet. That should be plenty for a cloud spreadsheet, even a large one with hundreds of simultaneous users.

What about very large spreadsheets, where the transaction log is too big to fit into a single partition? DynamoDB will handle this case. If a partition needs to be split and all items have the same partition key, DynamoDB will split on the sort key. 

In our case, the resulting workload is guaranteed to be split unevenly. The partition with the most recently created entries will have virtually all of the traffic. In theory, DynamoDB [adaptive capacity](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html#bp-partition-key-partitions-adaptive) should handle this case, allocating more of the table level IO quota to the hot partition. However, the more storage nodes we create with the same partition key, the more overhead is involved in determining the correct partition to use. 

Maybe we can help DynamoDB out. We don't need the entire transaction log to have the same partition key. We could break the log into multiple segments, where each segment has a different partition key. We can easily ensure that each segment is less than the size of a partition. At a minimum, we need enough entries per segment that we can retrieve a full page of entries with a single query. If we align segment boundaries with the entries that we create snapshots for, then all requests (apart from historical ones) can be handled by the most recent segment.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/log-segments-snapshots.svg" alt="Log Segments and Snapshots" %}

Dividing the log into segments would also help with storage management. If the historical transaction log is of no interest, we can delete old segments as soon as we've finished creating the most recent. We could choose to keep the last 3 segments around, or perhaps the segments that cover the last 90 days of activity. If we want to maintain a full historical record while keeping control of costs, we could archive old segments into S3.

How big should a segment be? There's a wide range of sizes between the minimum of 1MB (the maximum size that a single query can return) and the maximum of 10GB (one storage node). We could create a new segment on every snapshot, or have multiple snapshots per segment. 

Small segments are more flexible but require more overhead to manage. What happens if our list of segments for a spreadsheet is itself too big to fit in a storage node? Large segments have less overhead but could be too coarse grained for efficient storage management. 

For now, I'm going to keep my options open. I'll start with a format that can support any size of segment between 1MB and 10GB, with one or more snapshots per segment. I can then tune the size based on what I find during implementation and testing.

## Schema

The schema uses two tables. The Entry table stores all the log entries and the Segment table manages the log segments. A full featured implementation will have other tables to manage spreadsheet metadata, user access, permissions, organizational structures, etc. I'll leave that to another blog post. 

### Entry

We've already discussed most of what goes into a log entry. The primary key is made up of a segment id partition key and sequence id sort key. Wall clock time is useful for history and maybe conflict resolution, so let's include a date time field. 

Entries may be stored entirely in DynamoDB or have the bulk of their data stored in S3. We can use an attribute to determine whether the entry has any external data and if so where it is.

We will clearly have different types of entry. Import is different from insert row which is different from set cell. We'll need a type attribute. Finally, the schema will certainly evolve over time so we should include a type specific version attribute.

| Attribute | DynamoDB Type | Format | Description |
|-|-|-|-|
| Segment Id (PK) | Binary | UUID + Num | Primary key of segment (PK+SK) this entry is part of |
| Num (SK) | Number | Incrementing integer | Defines the order of entries in the segment |
| Created | Number | [Unix Epoch Time](https://en.wikipedia.org/wiki/Unix_time) in seconds | Date time when entry was created |
| External | String | S3 Object Id | If defined, body of entry is stored in S3 object with this id |
| Type | String | Enum | Type of log entry |
| Version | Number | Incrementing integer | Version number of body format for this type |
| Body | Any | Type/Version specific encoding | Body of entry

There will be lots and lots of entries. We want each entry to be as small as possible. It will be well worth the pain required to use the most [compact possible encoding](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/CapacityUnitCalculations.html) for each attribute. I've given each attribute a descriptive name in the table but will use only the first letter of each name in DynamoDB. 

### Segment

The Segment table uses the same incrementing integer sort key as the Entry table to maintain a strict order for segments within a log.

We keep track of which entry in the segment has the most recent snapshot. That makes it easy for clients loading a spreadsheet to know where in the log they need to start reading from. This attribute is undefined for a newly created segment. 

Snapshots will take some time to create and we don't want to prevent spreadsheet updates during that time. Adding a Snapshot entry to the log, including the first entry of a newly created segment, will trigger a background process that creates the Snapshot. When the snapshot is complete, the S3 object id of the root chunk is written to the Snapshot entry and the Last Snapshot attribute of the corresponding segment is updated. 

| Attribute | DynamoDB Type | Format | Description |
|-|-|-|-|
| Spreadsheet Id (PK) | Binary | UUID | Identifies which spreadsheet this segment is part of |
| Num (SK) | Number | Incrementing integer | Defines the order of segments in the log |
| Created | Number | [Unix Epoch Time](https://en.wikipedia.org/wiki/Unix_time) in seconds | Date time when segment was created |
| Last Snapshot | Number | Entry Num | If defined, the entry with the most recent completed snapshot |
| Archive | String | S3 Object Id | If defined, segment has been archived in S3 object with this id |

## Operations

Keeping with the theme of trying to document things more formally, let's have a look at some of the critical operations performed on the transaction log.

### Create Log

Creating a spreadsheet will be an infrequent operation compared to everything else. I'm happy to use a transaction so I don't have to think about potential edge cases where logs are in a partially created state.

1. Generate a UUID
2. Use a transaction to perform
  * `PutItem` on Segment table to create segment with primary key (uuid,0) and Created set to current date time
  * `PutItem` on Entry table to create entry with primary key  (uuid+0, 0) with Created set to same timestamp as segment, Type="Snapshot", Body=null

### Add Entry

The core write operation. Needs the highest possible performance. Dividing the log into segments means that we need an additional eventually consistent read to determine the current segment. We can then proceed as before to get the most recent entry and then try to write a new entry.

When a new segment is started, we write a final "End Segment" entry to the old one. That let's us handle the case where the eventually consistent read of the Segment table doesn't return the latest segment. 

A new segment is rare compared with the rate at which we add entries. As an optional optimization, clients that know the most recent segment they interacted with can start from step 2. If they're wrong, we'll read an "End Segment" entry and go back to step 1.

1. `Query` Segment table with limit 1 to read the segment with the highest Num.
2. `Query` Entry table with limit 1 to read the entry for that segment with the highest Num. Call that id *current*. If the entry type is "End Segment", go back to step 1.
3. `PutItem` on Entry table to add a new entry with Num *current+1* with an `attribute_not_exists(sk)` condition.
4. If the write fails, go back to step 1 and try again. 

In the face of contention from other clients, multiple attempts may be needed. Like all such cases, we should set a limit on the maximum number of attempts and use techniques like [exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/).

### Create New Segment

This is another case where I'm happy to pay the additional cost for a transaction. We use the same optimistic concurrency approach as Add Entry to assign the next sequence id to the new segment. 

Each segment starts with a snapshot. Segments should be large enough that the snapshot completes before we start another segment. To enforce that constraint, we bail out of segment creation if the current segment doesn't have a snapshot yet.

1. `Query` Segment table with limit 1 to read the segment with the highest Num. Call that id *CurrentSegment*. Confirm that this Segment has a LastSnapshot attribute. If not, return failure, we can't create a new segment yet. 
2. `Query` Entry table with limit 1 to read the entry for *CurrentSegment* with the highest num. Call that id *CurrentEntry*.
3. Use a transaction to perform
  * `PutItem` on Entry table to add a new entry to *CurrentSegment* with Num=*CurrentEntry*+1,Type="End Segment",condition=`attribute_not_exists(sk)`
  * `PutItem` on Segment table to add a new segment with Num=*CurrentSegment*+1,condition=`attribute_not_exists(sk)`
  * `PutItem` on Entry table to add a new entry to *CurrentSegment*+1 with Num=0,Type="Snapshot",condition=`attribute_not_exists(sk)`
4. If transaction failed go back to step 1 and try again.
5. Start a background process to create a Snapshot. 

As before we'll need to limit the number of attempts we make. We'll also need a resilient process that ensures that if the transaction was completed, a Snapshot is eventually created. That will need a blog post of its own.

### Load Spreadsheet

This is the read operation that starts off each client session. The client needs to load the most recent snapshot and any entries in the log since then. It needs to handle the case where the initial snapshot for the current segment hasn't completed yet.

1. `Query` Segment table with limit 2 to read the two most recent segments.
2. If current segment has a "Last Snapshot", use repeated paged `Query` on Entry table to read from "Last Snapshot" entry to the end of the segment and return.
3. Otherwise if previous segment doesn't have a "Last Snapshot", fail with a corrupt spreadsheet error.
4. Use repeated paged `Query` on Entry table to read from "Last Snapshot" entry to the end of the previous segment. 
5. Use repeated paged `Query` on Entry table to read from entry 1 to end of current segment. 

The initial `Query` reads two segments even though in most cases only the most recent is needed. Segment items are so small that cost of reading two is the same as reading one. 

### Update Loaded Spreadsheet

This is the core read operation that we expect to happen multiple times a session to update the loaded spreadsheet with any changes from other clients. For simplicity, if the client falls too far behind, we reload the spreadsheet from scratch, otherwise we read and process all the log entries since last update.

 There's scope for all kinds of interesting strategies to optimize that in future. Can we make use of intermediate snapshots to speed things up without having to do a full reload?

1. `Query` Segment table with limit 2 to read the two most recent segments.
2. If the last segment client read is earlier than either, Load Spreadsheet from scratch.
3. If last entry client read is in current segment, use repeated paged `Query` on Entry table to read from entry after that to the end of the segment and return.
4. Use repeated paged `Query` on Entry table to read from entry after last read to the end of the previous segment. 
5. Use repeated paged `Query` on Entry table to read from entry 1 to end of current segment. 

## Coming Up

Lots of loose threads at the end of this one. Expect to see a more formal description of all the different types of event log entry, a discussion on different approaches for handling conflict resolution using an event log, a look at the options for triggering side effects like snapshot creation with some sort of guarantee that they will actually happen, strategies for minimizing load/update times by reusing the data the client already has in memory, and eventually, maybe, some experimental results to determine the optimal segment size. 

