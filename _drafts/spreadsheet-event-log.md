---
title: Implementing my Spreadsheet Event Log on DynamoDB
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

The basic concept is simple. An ordered list of entries that define all changes made to the spreadsheet. The event log is the source of truth for what happens in the spreadsheet. Each entry is immutable (at least the part that defines what changed is). Maintaining a strict order of entries is critical to the integrity of the event log. 

Conflict resolution when multiple clients edit the spreadsheet at the same time will be driven by the event log. At the simplest, the order in which two client's changes appear in the event log defines what happens. We can build a variety of schemes on top of that to manage unexpected changes.

## Cloud Economics

As we're building in the cloud, we need to maintain at least a basic awareness of the cost implications of our choices. The intention is that customers will self host the spreadsheet so we're expecting lots of accounts with low activity. We'll be using DynamoDB's [on demand mode](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html#HowItWorks.OnDemand) so that customers pay only for what they use. The basic [cost model](https://aws.amazon.com/dynamodb/pricing/on-demand/) for on demand DynamoDB is $1.25 per million write request units, $0.25 per million read request units, and $0.25 per GB-month for storage. 

The [DynamoDB documentation](https://docs.amazonaws.cn/en_us/amazondynamodb/latest/developerguide/Introduction.html) has detailed explanations of how many units different operations take. It can be confusing because sometimes the documentation talks about capacity units, and sometimes about request units. These are equivalent when figuring out how many units an operation consumes. The difference is in how you're charged. In on demand mode, you're charged for the units used by each *request* you make. In provisioned mode, you provision the *capacity* you need up front in terms of units per second. 

A [write unit](https://docs.amazonaws.cn/en_us/amazondynamodb/latest/developerguide/ProvisionedThroughput.html#ProvisionedThroughput.CapacityUnits.Write) represents one write to an item up to 1KB in size. You use an additional write unit for every KB written, with sizes rounded up to the nearest KB. Batch writes cost the same as performing all the writes individually. There are no extra units used for conditional writes (although write units are consumed even if the write fails). Writes in transactions use double the number of units.

A [read unit](https://docs.amazonaws.cn/en_us/amazondynamodb/latest/developerguide/ProvisionedThroughput.html#ProvisionedThroughput.CapacityUnits.Read) represents a strongly consistent read of up to 4KB of data. Unlike writes, when performing a `BatchGetItem` or `Query` the size of all the items accessed is added together and *then* rounded up to the nearest 4KB. Reads in transactions use double the number of units, eventually consistent reads use half.

Let's say we use one DynamoDB item per entry in the transaction log. Creating a million cell spreadsheet by setting one cell at a time will cost $1.25, assuming that each entry uses less than 1 KB. Ongoing storage is up to $0.25 per month. In contrast, reading the entire transaction log using eventually consistent reads will cost *at most* $0.03, assuming that we read multiple items at a time. If we can make the entries significantly smaller than 1KB, the cost will be even less. 

In practice, we should be able to get read and storage costs even lower. We're creating [snapshots]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) of the spreadsheet in S3. We only need to read event log entries from the point when the last snapshot was created. We could delete earlier entries whenever a snapshot is created. However, it can be useful to retain transaction log entries for longer as a history.

Whatever we choose to do with old transaction log entries, there are interesting cost implications. Deleting an individual item costs the same as writing it, plus whatever it costs to query for old items that need to be deleted. In contrast, deleting an entire table is free, as is making use of DynamoDB's [TTL feature](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/howitworks-ttl.html) to automatically delete items when they reach a specified age. 

## Schema

## Access Patterns

## DynamoDB Scaling and Performance

## Conflict Resolution
