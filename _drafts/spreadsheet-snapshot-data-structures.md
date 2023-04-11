---
title: Data Structures for Spreadsheet Snapshots
tags: spreadsheets cloud-architecture aws
---

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
So, I have a plan. After a round of [brainstorming and benchmarking]({{ bb_url }}), I've decided to use [Event Sourcing]({{ bb_url | append: "#event-sourcing" }}) to store the sequence of operations applied to a spreadsheet. Every so often I'll create snapshots of the current spreadsheet state. I can then load the spreadsheet at any point in time by loading a snapshot and applying changes from that point on in the event log. 

Now I need to figure out how I'm going to represent these snapshots. 

## Chunks

I've already established that I can't store a snapshot as a single file. If I want to handle spreadsheets with millions of rows and columns, I need to divide the snapshot into chunks that can be loaded independently. A key benchmark is how long it takes for a client to open a spreadsheet. I need to be able to display the initial view without having to load the entire spreadsheet. I would also like to be able to handle spreadsheets larger than will fit in client memory.

In principle, I could use a single file structured so that pages within the file can be loaded independently. However, that won't work efficiently for web clients. Part of the attraction of immutable snapshots is that they can be cached on the client and reused. Web browsers will only cache the results of complete queries. Browsers won't cache the results of the [ranged GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests) needed to load part of a file. 

How big should these chunks be? The plan is to use DynamoDB for the event log and S3 for the snapshots. S3 is significantly cheaper than DynamoDB in terms of raw storage ($0.023 per GB-month for S3, compared with $0.25 for DynamoDB). S3 has a higher per request cost but it's a flat rate, regardless of the size. DynamoDB has a lower base cost but it's charged for every 4KB accessed for reads.  With current prices, any chunk larger than 4KB will be cheaper managed by S3 rather than DynamoDB. 

The [standard advice](https://www.nngroup.com/articles/response-times-3-important-limits/) for response times suggests that one second is the limit to avoid interrupting user flow. If we assume a minimum of ADSL broadband at 10Mbps, that suggests a limit of around 1MB given S3's documented [100-200ms request to first byte latency](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html). That also ensures download time is not dominated by per request overhead.

We can squeeze more out of our storage and network bandwidth by compressing the data. The standard [zlib/gzip](https://www.zlib.net/zlib.html) compression supported everywhere operates on 64KB block sizes. We should get good compression for chunks anywhere above that size. More modern algorithms, like [Brotli](https://github.com/google/brotli), can use larger block sizes for an extra [15-20%](https://en.wikipedia.org/wiki/Brotli) compression. 

How much spreadsheet would fit in a chunk? Our test spreadsheet used about 37 bytes per cell. At that size you could get 28,340 cells in a 1 MB chunk, uncompressed. Easily big enough to fill an initial view when opening the spreadsheet. 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/chunks.svg" alt="Chunks containing cells some of which link out to overflow objects" %}

What happens for cells with large values, like files or images? There will need to be an upper limit on the size of value that we can store directly. Anything bigger is stored as a separate S3 object. The limit should be large enough that we can embed preview text or images in the main chunk that can be displayed in the main grid view. That way the complete large value will only need to be downloaded on demand if the user looks at the cell in detail. If we go with a limit of 4KB, that gives enough room for a 32x32 thumbnail image or lots of text, while minimizing the number of tiny S3 objects we need to deal with.

## Segments

A segment is an immutable set of chunks that represent a sequence of operations in the event log. A snapshot could consist of a single segment that represents the effects of all operations, or could be be made of multiple segments. 

In the diagrams below, the event log is shown in yellow with each batch of transactions numbered in order. Segments are shown in purple, with each segment labeled with the batch number that caused it to be created.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/single-segment.svg" alt="Creating a complete new segment after each batch of operations" %}

The simplest approach is to use a single segment. Every *k* operations we create a new segment by reading in the old one chunk by chunk, applying all the accumulated operations and writing out a new set of chunks that represent the *n* total operations to date. There's a single segment, so loading an initial view is *O(1)*, which is good. However, keeping the snapshots up to date is *O(n<sup>2</sup>)*, which is bad.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/distinct-segments.svg" alt="Each segment only contains one batch of operations" %}

The other extreme is to only include the latest *k* operations in each new segment. Keeping the snapshots up to date is now *O(n)*, which is good. However, loading the initial view needs a chunk from each segment and is *O(n/k)*, which is bad.

If you've been keeping up to date with the blog, then you may think that this sounds similar to the C++ vector class discussed in my [amortized cost]({% link _drafts/amortized-cost-cloud.md %}) post. And you'd be right. There's a middle ground that balances lookup and update costs. The trick is to maintain a set of segments at different sizes, where each size is a constant factor larger than the previous. There are lots of variations depending on how you want to trade off space used vs cost. The simplest is where you have at most one segment at each size and where each size is double the previous.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/lsm-segments.svg" alt="LSM-tree style doubling segment sizes" %}

Every *k* operations you write out a new segment of size *k*. If there's an existing segment of the same size, you merge the two together into a segment of size *2k*. Repeat until you have at most one segment of each size. Keeping the snapshots up to date is *O(nlogn)*, which is good enough. Loading an initial view is *O(log(n/k))*, which is also good enough. This is the same cost model you see for most global sorted order data structures and databases.

Of course, there's [nothing new under the sun](https://www.dictionary.com/browse/nothing-new-under-the-sun). This is the same principle used by [log structured merge (LSM) trees](http://www.benstopford.com/2015/02/14/log-structured-merge-trees/), first made popular by [Google Big Table](http://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf), and since used by many more [NoSQL](https://en.wikipedia.org/wiki/NoSQL) databases.

## Tiles

So far I've been deliberately vague about how the cells in a spreadsheet are allocated to chunks. A spreadsheet is a 2D grid, so each chunk will correspond to a tile on the grid. 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/full-width-tiles.svg" alt="Full width tiles with variable number of rows" %}

The simplest approach would be to add rows to a full width tile, up to some limit. This is equivalent to a row in an LSM database, with row index as the key. Unfortunately, that won't work for spreadsheets with millions of columns. A single row would be too large to fit in a chunk. Even at more reasonable sizes, only a small number of rows would fit. You would need to load many chunks for the initial view with most of the data loaded being out of sight.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/square-tiles.svg" alt="Fixed size square tiles" %}

Another simple approach is to use fixed size squares. A 128 x 128 tile would need 600KB at 37 bytes per cell. In most cases the cells needed for an initial view would fit within a single tile. Fixed size tiles make it easy to identify the tile to load for any cell. No need for an explicit index if you have an appropriate tile naming convention. The problem with fixed size tiles is that chunk size would be highly variable. If all the cells were the maximum 4KB size, a 128 x 128 tile would need 64MB. At the other extreme, if the spreadsheet was sparsely occupied, each tile could contain just a single populated cell using a handful of bytes.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/quad-tree-tiles.svg" alt="Quadtree based tiles" %}

[Quadtrees](https://en.wikipedia.org/wiki/Quadtree) are a well known data structure that is more adaptive than a fixed tiling while still retaining some of the simplicity. The problem with quadtrees is that they're not simple enough to justify their lack of flexibility. You now need some kind of index to identify the correct tile for a cell. The cost for an index is pretty much the same whether you're using a quadtree or a more flexible data structure.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/fixed-width-stripe-tiles.svg" alt="Fixed width stripes" %}

What if we used fixed widths but allowed the height of each tile to vary? You end up with tiles arranged in vertical stripes, where each stripe is equivalent to an LSM based table. A 128 cell wide stripe could use anywhere from 512KB per row to a handful of bytes, and cover anything from one to millions of rows, making it easy to hit a target chunk size between 512KB and 1MB. 

This is getting closer and would work even for very sparse spreadsheets, as long as you had plenty of rows. A sparse million column spreadsheet with a single row would still have poor utilization, but how likely is that? 

More likely than you might think. We will create a segment every *k* operations. If the user is editing a million row by million column spreadsheet the pattern formed by the last *k* edited cells could end up looking pretty sparse. I would feel more comfortable with an approach that ensures that number of chunks is always proportional to number of populated cells in the segment. 

## Index
