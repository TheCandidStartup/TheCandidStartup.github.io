---
title: Brainstorming and Benchmarking
tags: spreadsheets cloud-architecture
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
[^2]: [FTTC](https://en.wikipedia.org/wiki/Fiber_to_the_x#Fiber_to_the_curb/cabinet/node) (fibre to the cabinet) is the most commonly available form of high speed broadband in the UK. Fibre optic cable is run to street side cabinets with the existinb copper cables used for the last mile connection. Speeds available depend on your distance from the cabinet. Speeds given here are [those available to 50% of the population in the UK](https://www.thinkbroadband.com/guides/fibre-fttc-ftth-broadband-guide#what-speed).
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

That's just about tolerable for a one off import and recalculate scenario. However, 75% of the time and cost apply to *any* change, no matter how trivial. If you then try to scale up 10-100 times you exceed the Lambda max duration of 15 minutes and the max memory of 10GB.

We can rule this idea out.

## Classic Web App

Let's go to the other extreme and look at the classic web app architecture. Thin client, REST API, server side compute, database.

How are we going to model a spreadsheet using a database? The smallest independently updatable element in a spreadsheet is a cell. Using a separate item for each cell would naturally support concurrent updates from multiple clients, last writer wins. Of course, that would result in 10 million items for our example boring spreadsheet. DynamoDB's `BatchWriteItem` allows us to write up to 25 items in a single call. If we use a separate partition key for each row and a sort key for the columns, we can use a single `Query` to retrieve all the cells in a row (at least for our 10 column spreadsheet).

We could look at more complex schemes that pack multiple cells into a single DynamoDB item. However, that would mean all updates need to use a read-modify-write approach using `UpdateItem` which can't be batched. The [cost for writes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ProvisionedThroughput.html#ItemSizeCalculations.Writes) is based on the total size of the item, in 1KB units, not the size of the update. So, you end up with this unfortunate tension between wanting to pack as much into an item as possible for more efficient bulk writes but also wanting to keep items just below 1KB to minimize costs for individual writes.

How much data will we need to store in DynamoDB? The compressed binary format spreadsheet is 20MB. The same data will be stored in DynamoDB uncompressed. Excel files are actually ZIP archives containing either XML or a custom binary format. The extracted content of the ZIP archive is 585MB for the normal Excel file and 350MB for the binary version. The binary version is a good proxy for the amount of data that would be stored in DynamoDB. For 10 million cells that works out at 37 bytes per cell.

As the DynamoDB pricing model rounds everything up to the nearest 1KB, it doesn't cost us anything extra to pack 10 cells into each item. That includes plenty of room for the [minimum 100 byte overhead](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/CapacityUnitCalculations.html) that DynamoDB adds. So, we end up using one item per spreadsheet row with about 500 bytes per row.

## Event Sourcing

## Footnotes
