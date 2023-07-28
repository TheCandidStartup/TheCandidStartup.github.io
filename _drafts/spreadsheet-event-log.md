---
title: Implementing a Spreadsheet Event Log on DynamoDB
tags: spreadsheets databases
---

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
In the distant past, before I got sucked into a seemingly never ending [series on databases]({% link _topics/databases.md %}), I [said]({% link _posts/2023-07-03-spreadsheet-merge-import.md %}) that I was going to start formalizing the format for my cloud based, serverless, event sourced spreadsheet. I realize now that I've said very little on how I'm going to implement the central component of my spreadsheet, the [event log]({{ bb_url | append: "#event-sourcing" }}). 

I did say that the event log will be managed in a database and that DynamoDB is the only [truly serverless]({% link _posts/2022-12-05-serverless-or-not.md %}) database AWS has. It shouldn't come as too much of a surprise that I'm going to use DynamoDB for the event log. Fortunately, I just happened to finish an [in depth piece on DynamoDB]({% link _drafts/dynamodb-database-grid-view.md %}) last week, so it's fresh in the memory. 

## Event Log

| Event Id | Event |
|-|-|
| 1 | Import from Excel Spreadsheet stored in S3 |
| 2 | Insert new row (A=Nails,B=0.01,C=80,E=15%,H=0.08) after 1000001 |
| 3 | Set C2=100 |

The basic concept is simple. An ordered list of entries that define all changes made to the spreadsheet. The event log is the source of truth for what happens in the spreadsheet. Each entry is immutable. Maintaining a strict order of entries is critical to the integrity of the event log. 

Conflict resolution when multiple clients edit the spreadsheet at the same time will be driven by the event log. At the simplest, the order in which two client's changes appear in the event log defines what happens. We can build a variety of schemes on top of that to manage unexpected changes.

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

* IMAGE HERE

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
| Segment Id (PK) | Binary | UUID + Num | Identifies which segment this entry is part of |
| Num (SK) | Number | Incrementing integer | Defines the order of entries in the segment |
| Created | Number | [Unix Epoch Time](https://en.wikipedia.org/wiki/Unix_time) in seconds | Date time when entry was created |
| External | String | S3 Object Id | If defined, body of entry is stored in S3 object with this id |
| Type | String | Enum | Type of log entry |
| Version | Number | Incrementing integer | Version number of body format for this type |
| Body | List, Map or Binary | Type/Version specific encoding | Body of entry

There will be lots and lots of entries. We want each entry to be as small as possible. It will be well worth the pain required to use the most [compact possible encoding](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/CapacityUnitCalculations.html) for each attribute. I've given each attribute a descriptive name in the table but will use only the first letter of each name in DynamoDB. 

### Segment

| Attribute | DynamoDB Type | Format | Description |
|-|-|-|-|
| Spreadsheet Id (PK) | Binary | UUID | Identifies which spreadsheet this segment is part of |
| Num (SK) | Number | Incrementing integer | Defines the order of segments in the log |
| Created | Number | [Unix Epoch Time](https://en.wikipedia.org/wiki/Unix_time) in seconds | Date time when segment was created |
| Last Snapshot | Number | Entry Num | If defined, the entry with the most recent completed snapshot |
| Archive | String | S3 Object Id | If defined, segment has been archived in S3 object with this id |

## Operations

### Create Log

* Generate a UUID
* Create segment (id,0) with Created set to current date time
* Create entry (id+0, 0) with Created set to same timestamp as segment, Type="Snapshot", Body=null
* Use a transaction

### Add Entry

1. Use a `Query` with limit 1 to read the segment with the highest num.
2. Use a `Query` with limit 1 to read the entry for that segment with the highest num. Call that id *current*. If the entry type is "End Segment", go back to step 1.
3. Use `PutItem` to add a new entry with num *current+1* with a `attribute_not_exists(sk)` condition.
4. If the write fails, go back to step 1 and try again. Limited number of attempts, exponential backoff, jitter.

### Create New Segment

1. Use a `Query` with limit 1 to read the segment with the highest num. Call that id *CurrentSegment*. Confirm that this Segment has a LastSnapshot attribute. If not, return failure, we can't create a new segment yet. 
2. Use a `Query` with limit 1 to read the entry for that segment with the highest num. Call that id *CurrentEntry*.
3. Use a transaction to perform
  * `PutItem` to add a new entry to *CurrentSegment* with Num=*CurrentEntry*+1,Type="End Segment",condition=`attribute_not_exists(sk)`
  * `PutItem` to add a new segment with Num=*CurrentSegment*+1,condition=`attribute_not_exists(sk)`
  * `PutItem` to add a new entry to *CurrentSegment*+1 with Num=0,Type="Snapshot",condition=`attribute_not_exists(sk)`
4. If transaction failed go back to step 1 and try again. Limited number of attempts, exponential backoff, jitter. Otherwise, start a background process to create a Snapshot (use Streams+Lambda to spot newly inserted snapshot entry for resilience).

### Load Spreadsheet

1. Use a `Query` with limit 1 to read the segment with the highest num.
2. If segment has a LastSnapshot used paged queries to read from that entry to the end of the segment, applying entries in order.
3. Otherwise use `GetItem` to read the previous segment. If this segment doesn't have a LastSnapshot fail with a corrupt spreadsheet error.
4. Used paged queries to read from LastSnapshot entry of previous segment to end of segment. Then continue to read from entry 1 to end of current segment. 

### Update Loaded Spreadsheet

1. Use a `Query` with limit 2 to read the two most recent segments.
2. If the last segment we read is earlier than both Load Spreadsheet from scratch.
3. Check LastSnapshot on both segments to find most recent snapshot (latest segment may not have a completed snapshot yet).
4. If snapshot is more recent than last entry read, either Load Spreadsheet from scratch, or do some kind of fancy incremental snapshot load (wind current state back to snapshot we loaded from and then apply segments from most recent snapshot to fast forward if possible), or decide that it will be quicker to ignore snapshots and replay all entries from last entry read. 
5. Read entries from one after last entry we read to end of log.

## Coming Up

