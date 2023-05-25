---
title: Brainstorming and Benchmarking
tags: spreadsheets cloud-architecture aws
---

Last time I took you on a tour of the [world's most boring spreadsheet]({% link _posts/2023-01-30-boring-spreadsheet.md %}). I used a basic, if large, spreadsheet to identify some benchmarks that I can use to assess the viability of the crazy implementation ideas we're going to brainstorm. The benchmarks are by no means exhaustive - think of them as the very low bar that any idea needs to get over to be worth considering further.

At this stage we're just brainstorming. We're not building implementations and literally running benchmarks against them. Not yet. We're doing some thought experiments and back of the envelope calculations. Let's discard the ideas that would violate the laws of physics early on.

The user needs to be able to import our existing spreadsheet, fully recalculate it, open it in a web client, insert a new row or edit an existing cell with interactive performance, fail cleanly if they use some crazy *O(n<sup>2</sup>)* formula they copied off the internet and finally export their spreadsheet back out again.

{% capture saas_url %}
{% link _posts/2022-11-28-modern-saas-architecture.md %}
{% endcapture %}

Remember, the intention is to build a [truly serverless]({% link _posts/2022-12-05-serverless-or-not.md %}) implementation that a customer can [deploy in their own AWS account]({{ saas_url | append: "#a-modest-proposal" }}). That will further limit our choices. In practice we're down to DynamoDB for our database, S3 for file/blob storage and Lambda for compute. We can add queues and orchestration with SNS, SQS, EventBridge and STEP as needed. We have more choices when it comes to a front end gateway but that will largely be a question of cost/convenience. No architecturally significant choice there.

Finally, we're [not just reimplementing a basic spreadsheet]({% link _posts/2023-01-09-spreadsheets-future-data-systems.md %}). We'll start there but we need to build a foundation that will scale beyond current data limits, support granular permissions and data integrity constraints.

## Big Disk Drive in the Sky

Let's warm up with the simplest possible evolution of a desktop spreadsheet. Think Google Sheets and Office 365. Take your existing spreadsheet file and store it on a big disk drive in the sky (otherwise known as S3). You can use your existing desktop client or port it to a fat web client. Importing the spreadsheet is a matter of uploading it to S3, opening it in a client is a matter of downloading it. Once you have it open, everything is available in memory for interactive performance. To persist any change you make, upload a new version of the file to S3.

Let's see how that stacks up against our benchmarks. The spreadsheet is 20MB in the optimized binary format and takes 10 seconds to load into a desktop client from a fast, local SSD. How much extra time will uploading and downloading add?

| Connection Type | Download Speed | Download Time | Upload Speed | Upload Time |
|-|-|-|-|-|
| 3G[^5] | 6Mbps | 27s | 3Mbps | 53s |
| ADSL[^1] | 10Mbps | 16s | 1Mbps | 160s |
| 4G[^5] | 20Mbps | 8s | 5Mbps | 32s |
| FTTC[^2] | 38Mbps | 4s | 15Mbps | 10s |
| 5G[^5] | 100Mbps | 1.6s | 10Mbps | 16s |
| FTTP[^3] | 300Mbps | 0.5s| 50Mbps | 3s |
| Leased Line[^4] | 10Gbps | 0.01s | 10Gbps | 0.01s |

[^1]: [ADSL](https://en.wikipedia.org/wiki/ADSL) is now commonly known as standard broadband. It's the lowest cost option using standard telephone line copper cables. There is a significant difference in upload and download speeds (typically 10:1) as well as a significant reduction in speeds if you live further from the exchange. Speeds given here are average available in the UK.
[^2]: [FTTC](https://en.wikipedia.org/wiki/Fiber_to_the_x#Fiber_to_the_curb/cabinet/node) (fibre to the cabinet) is the most commonly available form of high speed broadband in the UK. Fibre optic cable is run to street side cabinets with the existing copper cables used for the last mile connection. Speeds available depend on your distance from the cabinet. Speeds given here are [those available to 50% of the population in the UK](https://www.thinkbroadband.com/guides/fibre-fttc-ftth-broadband-guide#what-speed).
[^3]: [FTTP](https://en.wikipedia.org/wiki/Fiber_to_the_x#Fiber_to_the_premises) (fibre to the premises) is the highest speed home broadband available in the UK. Fibre optic cable is run direct to the premises, terminating close to the customer's router. Speeds here are those typically quoted by OpenReach which runs the largest network in the UK. Most customers have lower priced packages where speeds are capped anywhere down to 36Mbps.
[^4]: [Leased Lines](https://www.hso.co.uk/leased-lines/leased-line-speeds) are dedicated connections traditionally used by businesses worried about the reliability of consumer broadband. They feature guaranteed, symmetric rates for upload and download at speeds anywhere between 2Mbps and 10Gbps.
[^5]: 3G HSPA+, 4G LTE and 5G "typical real world" [mobile network speeds in the UK](https://www.4g.co.uk/how-fast-is-4g/).

It's a significant amount of time until you get to the high end of connection types. And that's for a spreadsheet within the current limits. What happens when you scale to 10-100 times that size? It becomes impractical for all but the highest capacity leased line (typically used for connecting data centers!).

Can the client handle it? This approach depends on a full fat client that can handle everything locally. The 400MB of RAM required shouldn't be an issue, even in a web or mobile client. However, once again, it all falls apart if you scale things up 10-100 times.

What about costs? You are charged for API requests to S3 but those are insignificant compared to the data transfer costs at $0.0015 per download (upload is free). Each version of the spreadsheet stored costs $0.00045 per month.

Finally, what if you want to do some processing server side? If we want to add data integrity constraints and granular permissions, we need to evaluate and validate any change server side. Security 101 - never trust the client. What would it take to recalculate the spreadsheet using Lambda?

For simplicity I'm going to assume we're using a 1769MB Lambda - [the minimum size that gives you a dedicated vCPU](https://www.sentiatechblog.com/aws-re-invent-2020-day-3-optimizing-lambda-cost-with-multi-threading). For CPU intensive code that is usually the price-performance sweet spot (assuming you don't need more memory than that). I'm also going to assume that a Lambda vCPU is equivalent to a hardware thread on my desktop machine (half a core). Spreadsheet loading is single threaded in the version of Excel I used so would also be about 10 seconds to load in Lambda. Recalculation is multi-threaded. It took my desktop machine 0.5s using 12 threads. There's probably some overhead and contention so let's say 5s for a single thread. Finally, saving the spreadsheet took 3s and is single threaded.

We also need to add some time to download the spreadsheet from S3 and upload the recalculated version. AWS don't document what network bandwidth is available to Lambda. The [most rigorous benchmarking](https://github.com/sjakthol/aws-network-benchmark) I found suggests a maximum 600Mbps sustained. That was measured using the [iperf3](https://iperf.fr/) performance measurement tool using low level networking code written in C, connecting to a dedicated EC2 hosted server. More [anecdotal](https://bryson3gps.wordpress.com/2021/04/01/a-quick-look-at-s3-read-speeds-and-python-lambda-functions/) [benchmarks](https://levelup.gitconnected.com/the-effect-of-memory-configuration-on-aws-lambdas-network-throughput-410bde99127) using Python to read from S3 get around 100Mbps.

I'm going to go with the nice round 100Mbps number for now. Which would make 1.6s to read from S3, 10s to load (decompress and parse) into memory, 5s to recalculate, 3s to save (serialize and compress) and 1.6s to write back to S3. Which makes a total of 21.2 seconds and a cost for the Lambda of $0.0005 (S3 costs are negligible in comparison).

That's just about tolerable for a one off import and recalculate scenario. However, 75% of the time and cost apply to *any* change, no matter how trivial. If you then try to scale up 10-100 times you exceed the Lambda max duration of 15 minutes and the max memory of 10GB. Concurrent editing, as in Google Sheets and Office 365, needs a separate system that periodically saves new versions of the file. 

OK, what else could we try?

## Classic Web App

Let's go to the other extreme and look at the classic web app architecture. Thin client, REST API, server side compute, database.

How are we going to model a spreadsheet using a database? The smallest independently updatable element in a spreadsheet is a cell. Using a separate item for each cell would naturally support concurrent updates from multiple clients, last writer wins. Of course, that would result in 10 million items for our example boring spreadsheet. DynamoDB's `BatchWriteItem` allows us to write up to 25 items in a single call. If we use a separate partition key for each row and a sort key for the columns, we can use a single `Query` to retrieve all the cells in a row (at least for our 10 column spreadsheet).

We could look at more complex schemes that pack multiple cells into a single DynamoDB item. However, that would mean all updates need to use a read-modify-write approach using `UpdateItem`, which can't be batched. The [cost for writes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ProvisionedThroughput.html#ItemSizeCalculations.Writes) is based on the total size of the item, in 1KB units, not the size of the update. You end up with this unfortunate tension between wanting to pack as much into an item as possible for more efficient bulk writes, but also wanting to keep items just below 1KB to minimize costs for individual writes.

How much data will we need to store in DynamoDB? The compressed binary format spreadsheet is 20MB. The same data will be stored in DynamoDB uncompressed. Excel files are actually ZIP archives containing either XML or a custom binary format. The extracted content of the ZIP archive is 585MB for the normal Excel file and 350MB for the binary version. The binary version is a good proxy for the amount of data that would be stored in DynamoDB. For 10 million cells that works out at 37 bytes per cell.

As the DynamoDB pricing model rounds everything up to the nearest 1KB, it doesn't cost us anything extra to pack 10 cells into each item. That includes plenty of room for the [minimum 100 byte overhead](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/CapacityUnitCalculations.html) that DynamoDB adds. We can use one item per spreadsheet row with about 500 bytes per row.

Enough preamble, time for some benchmarking. How will importing a spreadsheet work? The typical approach with a thin client is to upload the spreadsheet file to S3 and then trigger a server side import process. Upload, parse and validate is the same as the [previous approach](#big-disk-drive-in-the-sky). We then need to write a million rows to DynamoDB. As these are initial writes we can use `BatchWriteItem` and write 25 rows at a time. That's 40000 requests. Lambda has an effective limit of around 1000 concurrent requests. There is a [hard limit](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html) of 1024 file descriptors, each network socket has a file descriptor and some file descriptors will be needed for other purposes. DynamoDB claims single digit millisecond response times. If we say 10ms round trip for each request, with 1000 concurrent requests, we could in theory complete 40000 requests in 0.4 seconds. 

In practice we will be limited by the available network bandwidth. The XML representation of the spreadsheet is a good proxy for REST API request size, coming in at 61 bytes per cell. With 10 cells per row, 25 rows per request and some extra for http headers that comes to about 16KB per request. Using the same 100Mbps figure for bandwidth that we used before, it works out to 800 requests per second. Which is 50 seconds for 40000 requests. 

What will that cost? Each item written is charged separately, regardless of batching. Writing a million rows each below 1KB in size comes to $1.25 (the lambda cost is insignificant in comparison). Storage costs for 350MB of data come to $0.085 a month. For context, storage costs are 100 times more expensive than the previous approach and processing costs are 1000 times more.

There is some good news. Opening a spreadsheet in a web client is really cheap. Load just what is needed for the current view. We can retrieve 100 rows in a single call to DynamoDB using `BatchReadItem` returning 64KB of data.

After that things go down hill quickly. Neither of the interactive editing scenarios are anywhere near interactive. Inserting a row requires reading a million rows to update the summary row. Again, network bandwidth is the bottleneck, needing tens of seconds to read all the required data. Cost is an issue again: $0.25 every time you insert a row. 

What if we try to incrementally update the summary row? If we design the API well, we'll know that this change is just insertion of a new row. Most of the formulas in the summary row can be incrementally updated based on the existing summary value and the newly inserted value. The only tricky one is average where we need to keep track of sum and count separately and then calculate `average = sum/count`. 

It becomes more tricky when you start to think about multiple clients and concurrent updates. DynamoDB transactions are limited to 100 items - we can have updates that recalculate millions of cells. That means we need to live with eventual consistency. We'll make a change and then kick off an asynchronous process that recalculates any dependent cells. Formulas are strictly functional so it doesn't matter if we overlap recalculation from different changes. Eventually we'll get the correct result, but only if we *fully evaluate* each formula. Incremental update tricks only work if the spreadsheet is in a consistent state.

Even if we find a way round that, we hit a dead end with the update of a cell in the first row. That triggers recalculation of a million cells which results in a million writes.

This approach is clearly a non-starter. It's way too expensive and doesn't handle our benchmarks, even for our starting point of a million row spreadsheet, let alone scaling 10-100 times. 

## Event Sourcing

Well, this is all very depressing. If we use a fat client with the spreadsheet file in S3, we get reasonable costs and interactive performance but we can't persist fine grained updates to the server and have no way to add server side validation and integrity checks. If we store the spreadsheet in a database, we can do simple fine grained updates and server side validation but at excessive cost and with no way to handle complex interactive updates.

What if instead of storing the current state of the spreadsheet as our source of truth, we store the sequence of operations that were applied to the spreadsheet? This is the idea behind [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html). To load the spreadsheet we replay the sequence of operations. Here's what would be stored in the database after running our benchmarks.

|-|-|
| Event Id | Event |
|-|-|
| 1 | Import from Excel Spreadsheet stored in S3 |
|-|-|
| 2 | Insert new row (A=Nails,B=0.01,C=80,E=15%,H=0.08) after 1000001 |
|-|-|
| 3 | Set C2=100 |
|-|-|

Which seems absurdly simple. We're back to our fat client with reasonable costs and interactive in-memory performance. We still need a reasonable network connection to download the imported spreadsheet but now that spreadsheet is immutable. We can cache it locally and never need to download it again. 

We're persisting fine grained updates to the server. We don't have to make complex decisions about whether we store data at cell or row or some other granularity. We're storing data at the perfect granularity for writes - one write per user update. We can do server side validation of those updates. If someone else edits the spreadsheet we only need to download their changes. 

How is this going to work once we've accumulated lots of changes? For example, if we started with an empty spreadsheet and eventually got to a million rows? Well, every so often we need to create and store a snapshot of the state of the spreadsheet at that event. We can then load the spreadsheet by loading the most recent snapshot and then replaying changes from that point. 

Hold on. Isn't this just the [big disk drive in the sky](#big-disk-drive-in-the-sky) with a record of events bolted on the side? We discounted that idea because it won't scale. 

No. There are some significant differences here. For a start, we don't have to create a new version of the spreadsheet for every change. Depending on how we tune the system we could get away with a snapshot every 100 or even 1000 changes. 

Nothing is blocked while a snapshot is being created. You can carry on making changes and adding events to the log. We have as much time as we need to structure the snapshot in a more optimal way. For example, we could break it into multiple chunks to support incremental/partial loading. We could have multiple lambdas each recalculating their own chunk in parallel (lots of interesting work needed to figure out dependencies between chunks). 

With the original approach we have to write the entire spreadsheet on each save to ensure consistency of each version. With this approach the event log is the source of truth. Once records are written they are immutable. That opens up all kinds of options for creating snapshots that reuse the unmodified parts of earlier snapshots. As each snapshot is consistent we can use incremental recalculation of formulas. We can store intermediate results from partial evaluation of formulas in the snapshot to support incremental recalculation of formulas like `average`.

I think we have a winner. Or at least something that clears the initial bar. We need to go to the next level of detail to see if it continues to stand up. Next time, we'll dive deeper into the different options for how we [structure snapshots]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}). 

## Footnotes
