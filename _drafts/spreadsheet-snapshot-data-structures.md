---
title: Data Structures for Spreadsheet Snapshots
tags: spreadsheets cloud-architecture aws
---

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
So, I have a plan. After a round of [brainstorming and benchmarking]({{ bb_url }}), I've decided to use [Event Sourcing]({{ bb_url | append: "#event-sourcing" }}) to store the sequence of operations applied to a spreadsheet. Every so often I'll create snapshots of the current spreadsheet state. I can then load the spreadsheet at any point in time by loading a snapshot and applying changes from that point on in the event log. 

Now I need to figure out how I'm going to represent these snapshots. 

## Chunks

I've already established that I can't store a snapshot as a single file. If I want to handle spreadsheets with millions of rows and columns, I need to divide the snapshot into chunks that can be loaded independently. A key benchmark is how long it takes for a client to open a spreadsheet. I need to be able to display the initial view without having to load the entire spreadsheet. I would like to be able to handle spreadsheets larger than will fit in client memory.

In principle, I could use a single file structured so that pages within the file can be loaded independently. However, that won't work efficiently for web clients. Part of the attraction of immutable snapshots is that they can be cached on the client and reused. Web browsers will only cache the results of complete queries. Browsers won't cache the results of the [ranged GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests) needed to load part of a file. 

How big should these chunks be? The plan is to use DynamoDB for the event log and S3 for the snapshots. S3 is significantly cheaper than DynamoDB in terms of raw storage ($0.023 per GB-month for S3, compared with $0.25 for DynamoDB). S3 has a higher per request cost but it's a flat rate, regardless of the size. DynamoDB has a lower base cost but it's charged for every 4KB accessed for reads.  With current prices, any chunk larger than 4KB will be cheaper managed by S3 rather than DynamoDB. 

The [standard advice](https://www.nngroup.com/articles/response-times-3-important-limits/) for response times suggests that one second is the limit to avoid interrupting user flow. If we assume a minimum of ADSL broadband at 10Mbps, that suggests a limit of around 1MB given S3's documented [100-200ms request to first byte latency](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html). That also ensures download time is not dominated by per request overhead.

We can squeeze more out of our storage and network bandwidth by compressing the data. The standard [zlib/gzip](https://www.zlib.net/zlib.html) compression supported everywhere operates on 64KB block sizes. We should get good compression for chunks anywhere above that size. More modern algorithms, like [Brotli](https://github.com/google/brotli), can use larger block sizes for an extra [15-20%](https://en.wikipedia.org/wiki/Brotli) compression. 

## Segments

## Tiles

## Trees
