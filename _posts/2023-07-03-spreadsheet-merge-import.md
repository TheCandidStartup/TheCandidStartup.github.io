---
title: Merging and Importing Spreadsheet Snapshots
tags: spreadsheets 
---

[Last time]({% link _posts/2023-06-05-spreadsheet-insert-delete.md %}), we looked at the added complexity that comes when you start inserting and deleting rows and columns from your spreadsheet. Spreadsheet snapshots are made up of multiple segments. Once you start inserting and deleting things, those segments are in different coordinate spaces. You need to transform the earlier segments into the coordinate space of the most recent as you load them. 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/lsm-segments.svg" alt="Multi-Segment Snapshots" %}

As you create more snapshots you need to periodically merge segments together for efficient management. Should be easy, right? Load the earlier segment and overlay the more recent one on top. Then write out the in-memory representation as a new segment. 

The problem is that as spreadsheets grow in size, snapshots can become arbitrarily large. Using power of two sized snapshots, the largest snapshot will be half the size of the entire spreadsheet. Too big to fit in memory with the size of spreadsheet that I want to support. We need to come up with an [external memory algorithm](https://en.wikipedia.org/wiki/External_memory_algorithm) for merging. 

{% capture note-content %}
The rest of this post is going to build on ideas discussed in [Data Structures for Spreadsheet Snapshots]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) and [Making Spreadsheet Snapshots work with Insert and Delete]({% link _posts/2023-06-05-spreadsheet-insert-delete.md %}). You might want to refresh your memory before diving in.
{% endcapture %}
{% include candid-note.html content=note-content %}

## Merge Algorithm

In principle, this should still be easy. We've gone to a lot of effort to break segments up into tiles that can be independently loaded. That lets us load just the tiles that are needed to display the current view in a client. Divide the spreadsheet into rectangles that will fit in memory and iterate over them. For each rectangle load the tiles required and combine in memory, then write out as a new set of tiles.

There are a couple of important details left to sort out. Our segments are structured based on first dividing the spreadsheet into vertical stripes and then dividing each stripe horizontally into tiles. How do we decide where the stripe boundaries should be for the new segment if we can't look at all the data together? What size view rectangle should we use and how should we iterate over the spreadsheet?

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/loading-tiles-for-merging.svg" alt="Loading tiles for merging" %}

The second question is easy once we know where the output stripe boundaries will be. We iterate across the spreadsheet in stripes. For each stripe, iterate down the spreadsheet using a view rectangle the same width as the stripe and one row high. Load the tiles from each input segment that intersect the view rectangle. The tiles loaded will cover the view rectangle and some number of rows below. Figure out the maximum size rectangle that is covered by the tiles loaded. Combine the data within that rectangle into the in-memory spreadsheet representation. 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/output-tile-merging.svg" alt="Loading tiles for merging" %}

Repeat starting with a new view rectangle on the row below the in-memory rectangle, extending the size of the in-memory data. Keep going until you have enough data to fill 1.5 output tiles. Write an output tile. Keep going until the end of the stripe.

Buffering up to 1.5 output tiles of data ensures that all tiles, including the last, are at least half the size of an ideal tile. When you reach the end of a stripe, there will be somewhere between 0.5 and 1.5 tiles of buffered data. If more than one tiles worth, write out as two equal size tiles, otherwise as a single tile.

OK, we've done the easy part. Now, how do we decide what the output stripe boundaries should be?

## Creating a segment in the first place

Once again, let's start with the easy case and use what we learn from that to tackle the hard case. How do we decide what the boundaries should be when we write out a section of transaction log as an initial minimum size segment? We have all the data in memory, we can do whatever analysis we want. 

{% capture ds_url %}{% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}{% endcapture %}
The [segment format we came up with]({{ ds_url | append: "#stripes" }}) is optimized for fixed width stripes. We want to minimize the number of tiles needed to cover a typical client view. Our analysis suggested that 128 columns wide was a likely sweet spot. The format allows stripe width to vary, to handle the case where data is sparse. The only case where this can happen is when we have a single tile spanning all the rows in the spreadsheet that is still less than half the ideal tile size. 

Here's the algorithm I came up with. Start with a stripe width of 128. Scan through the in-memory data from column 1 to 128, row 1 onwards, adding up the serialized sizes of each cell. If we get to a total more than half the ideal tile size, then we know this stripe width works. Repeat for the next stripe to the right. 

If we hit the end of the spreadsheet, then we know the stripe width is too narrow. Double it and try again. The format supports stripes of any width. I'm going to try and stick to powers of two to maximize the chances of runs of the same width stripes.

At the other extreme, a stripe is too wide if we go over the target size with less than a rows worth of cells. In this case, halve the stripe width and try again. In the pathological case where width *x* is too narrow and *2x* is too wide, use the average of the two. If necessary, binary chop your way to a size that works. Stick with that size for the next stripe. However, if it stops working, round down or up to the nearest power of two, rather than halving or doubling. 

Finally, you may need to adjust the boundary between the last two stripes if the number of columns left over makes the final stripe too narrow.

## Choosing stripe boundaries for a merge

We can use pretty much the same algorithm when choosing stripe boundaries for a merge. Use the same approach as the merge algorithm to incrementally load the data we need. Start with a 128 column wide view rectangle, load the tiles covered in both segments into memory and iterate down the candidate stripe until either we have enough data buffered or have hit the end of the spreadsheet. 

## Putting it all together

We don't have to work out all the stripe boundaries before we start merging. Looking a couple of stripes ahead is enough. Once we've decided on a stripe boundary, we can run the merge algorithm for that stripe, then decide what width the next stripe needs to be. This approach minimizes the size of the in-memory working set.

The output stripe boundaries may not align with the input stripe boundaries (as shown in the diagrams above), which may not align with each other (due to the impact of inserts and deletes). The same input tile may need to be accessed by multiple output stripes. We'll need a caching system that will try and hold on to tiles that will be needed again. However, we may still end up having to eject tiles from memory and then load them again later.

We prefer fixed width stripes where possible. There are also benefits with fixed height tiles. We're trying to write out chunks that are between 0.5 MB and our ideal chunk size of 1 MB. We can use a similar algorithm to the one used to pick stripe width. If there's a power of two number of rows that has a size in our desired range use that. Use the same number of rows for the next tile if possible, if not try the next power of 2, otherwise binary chop to a size that works.

## Chunk Format

A small detour before we move on. Let's talk about the format we're going to use for [chunks]({{ ds_url | append: "#chunks" }}). 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/package-single-chunk.svg" alt="Segment packaged into a single chunk" %}

We've already identified a few cases where we need to pack multiple different parts of a segment into a chunk. We know we want to compress chunks. The simplest implementation is to use an existing archive format like [ZIP](https://en.wikipedia.org/wiki/ZIP_(file_format)), or [7z](https://en.wikipedia.org/wiki/7z). ZIP is the most [standard](https://www.iso.org/standard/60101.html) and widely supported format but doesn't support the latest compression codecs and isn't as optimized as newer formats. For simplicity, I'm going to start off with ZIP and maybe later consider other formats.

A segment always has a "root" chunk. The root chunk includes a small JSON manifest which defines spreadsheet metadata (width, height, ...), segment format version and structure, including the location of the index, transform and any dependent segment. These parts (and any other parts and tiles that they reference) may be embedded in the root chunk or stored externally in additional chunks.

Chunks within the overall structure that are statically known to always contain a single part have the same name as that part. Tiles are a good example. Tiles use a naming convention that allows the [segment index to implicitly reference them]({{ ds_url | append: "#index" }}). 

Additional chunks that might contain multiple parts are identified by number: 1,2,3,... Any part referencing another part stored in a separate multi-part chunk needs to specify chunk number and part name. Chunk number 0 is reserved and can be used as needed to specify "part is in same chunk", "no chunk" or "empty chunk" as appropriate. 

## Writing the index

We also need to make sure we can write the [index]({{ ds_url | append: "#index" }}) incrementally rather than buffering it all in memory and writing it out at the end. [Depending on index size]({{ ds_url | append: "#packaging" }}) we may be able to embed it in the same chunk as the first tile, store the whole thing in a dedicated chunk, or break it into multiple chunks. 

For now we're restricting ourselves to spreadsheets with at most 12 million columns which means even the largest possible column index will fit as one part in a chunk. Each stripe has its own row index which we'll store as a part in a chunk. We may be able to fit multiple row indexes in one chunk, use a dedicated chunk per index or need a two level index where the index part references index data stored in multiple additional chunks. Each row index part uses a naming convention that includes the start column for the stripe. 

We need to make all these choices on the fly, as we write out the segment. We need to keep the first tile in memory, rather than writing it out immediately, until we know whether we want to embed it in the root chunk with the index and any other metadata.

 We accumulate the column and row index structures in memory as we process and write out tiles for each stripe. We can start writing out index data when we reach the end of a stripe or when we have accumulated more than 1.5 chunks worth of row index data.

If we've reached the end of a stripe we can use a single part for the entire row index. If we have more than half a chunks worth of data, write it out as a single part chunk using the next available chunk number. If it's smaller than that, buffer it in memory until we have enough parts accumulated to write out a multi-part chunk. As we go, keep track of which chunk each row index part gets stored in, using a list of pairs (start column of stripe, chunk number).

{% capture id_url %}{% link _posts/2023-06-05-spreadsheet-insert-delete.md %}{% endcapture %}
If the accumulated row index data is all from the same stripe, we need a two level row index. Write out a chunks worth of data as a single part chunk using a naming convention that specifies stripe and start row. The chunk content should use [relative addressing]({{ id_url | append: "#segment-index" }}) for better compression. Keep a list of start row values for each chunk in the stripe. When you reach the end of the stripe you'll have between 0.5 and 1.5 chunks worth of remaining row index data. If more than one chunks worth, write out as two equal size chunks, otherwise as a single chunk.

To complete the two level row index, we need to output the top part of the index. This is just the list of start row values, which can be [delta encoded](https://en.wikipedia.org/wiki/Delta_encoding) for better compression. You can use binary chop over the list to find the correct index data chunk for any row. If more than half a chunks worth of data, write it out as a single part chunk, otherwise accumulate with other small parts destined for a multi-part chunk.

When you reach the end of the spreadsheet, you'll have the first tile and a complete column index in memory, a set of row index parts and spreadsheet tiles that you've already written out, a mapping which specifies which chunk each serialized row index part is stored in, and any row index parts that haven't been written out yet. 

If all the unserialized data fits into one chunk, write it all out as the root chunk. If not, write out the first tile and then the biggest remaining parts as separate chunks until you have a single chunks worth left. Write that out as a root chunk including a manifest that specifies which chunks contain the other top level parts. 

## Merging Transforms

A segment may also have a [transform]({{ id_url | append: "#encoding-the-transform" }}) which can become arbitrarily large. We need an external memory algorithm  that will merge transforms too.

A transform is defined using four sorted lists of ranges: columns to delete, rows to delete, columns to insert, rows to insert. The transform specifies the inserts and deletes needed to get a dependent segment into the same coordinate space as this segment. In principle, this is a straightforward merge of sorted lists. We can iterate through each transform, reading values in from each segment, comparing them and then writing them out in the correct order. 

If both transforms make changes to the same row or column, they can be combined. For example, insert 2 rows before row 2 and insert 3 rows before row 2 becomes insert 5 rows before row 2. Delete 5 columns starting from column 7 and insert 2 columns before column 7 becomes delete 3 columns starting from column 7. 

In practice, life becomes complicated because each transform and each part of each transform is in a different coordinate space. As we iterate through the lists from the second transform, we need to transform them into the coordinate space of the first. Row and column transforms are independent and work the same way. We can figure out how to do this for row transforms and then use exactly the same thing for the column transforms. 

Given two segments X and Y, where Y depends on X, the combined row transform is `DeleteX * InsertX * DeleteY * InsertY`. When we write out the merged segment Z, we need a new row transform of the form `DeleteZ * InsertZ`. Getting there is a six step process.
1. Calculate the [inverse transforms]({{ id_url | append: "#inverting-a-transform" }}) we're going to need: `DeleteX`<sup>-1</sup>,  `InsertX`<sup>-1</sup>, `DeleteY`<sup>-1</sup>. 
2. Use `DeleteY`<sup>-1</sup> and `InsertX`<sup>-1</sup> to transform `InsertY` into `InsertY`<sup>dy</sup> and then into `InsertY`<sup>ix</sup>. 
3. Use `InsertX`<sup>-1</sup> and `DeleteX`<sup>-1</sup> to transform `DeleteY` into `DeleteY`<sup>ix</sup> and then into `DeleteY`<sup>dx</sup>.
4. Merge `DeleteX` with `DeleteY`<sup>dx</sup> to create `DeleteZ`.
5. Merge `InsertX` with `InsertY`<sup>ix</sup> to create `InsertZ`<sup>ix</sup>.
6. Use `DeleteY`<sup>ix</sup> to transform `InsertZ`<sup>ix</sup> into `InsertZ`. 

`InsertZ`<sup>ix</sup> was created in the coordinate space after `DeleteX` and before `InsertX`. We need `InsertZ` in the coordinate space after `DeleteZ`. We know that `DeleteZ` = `DeleteX` * `DeleteY`<sup>ix</sup>, so all we need to do is transform `InsertZ`<sup>ix</sup> by `DeleteY`<sup>ix</sup>. A more long winded way of getting the same result is to transform by `DeleteX`<sup>-1</sup> and then by `DeleteZ`.

Applying a transform is an iterative process similar to a merge, where we read from both lists in sorted order, using values from one to transform values from the other before writing them out. That looks like a lot of temporary transforms to write out and read back in. However, with some care, the entire process can be pipelined so that the stream of values output by one operation are fed as input into the next. 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/merge-transform-pipeline.svg" alt="Merge Transforms Pipeline" %}

Start at the output nodes (shown in red) and read values from their inputs, recursing back through the graph until you reach the source nodes (shown in orange). For most nodes, their output is used as input by one other node. In these cases the value read can be discarded as soon as it is used. 

There are three cases where a source node's output is used as input by two other nodes. We handle these by creating duplicate read streams for each source transform which can be read independently. The caching system for downloaded chunks helps avoid having to load the same source chunk repeatedly.

There are two cases where an intermediate node's output is used as input by two other nodes. Here the output values need to be buffered until they have been read by both downstream nodes. 

The two outputs from `DeleteY`<sup>ix</sup> feed into separate sub-graphs that terminate with the two output nodes. Buffering can be minimized by alternating between the two output nodes when reading values from the pipeline. Read repeatedly from one node until a value is buffered at `DeleteY`<sup>ix</sup> and then swap to the other output. 

Finally, the simplest way to handle the twin outputs from `InsertX`<sup>-1</sup> is to duplicate the subgraph back to the source node. That gives us two `InsertX`<sup>-1</sup> nodes with single outputs. In exchange, the source node `InsertX` ends up with three outputs which is easy to handle by adding another duplicate read stream. 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/merge-transform-pipeline-duplicate-insertx.svg" alt="Duplicating a subgraph so that intermediate nodes have a single output" %}

## Writing Transforms

We need to be able to read each list of ranges independently, so it makes sense to serialize each transform as four separate parts. Each part is a sorted list of pairs (index, total num). We may be able to fit multiple parts in one chunk, use a dedicated chunk per part, or need a two level structure where the transform part references transform data stored in multiple additional chunks. Just like the row indexes, in fact.

We can use the same process to write them out. Accumulate output until we have 1.5 chunks worth. If we get to the end first, output what we've accumulated as a single part (write as a single chunk if large enough, otherwise accumulate with other small parts destined for a multi-part chunk).

If we've accumulated 1.5 chunks worth of data, we need a two level structure. Write out a chunks worth of data as a single part chunk using a naming convention that specifies transform part and start index. Again, use whatever compression tricks make sense (relative addressing, delta encoding, etc). Keep a list of start index values for each chunk written, together with total num from the last entry in the *previous* chunk, which together form the top part of the two level structure.

You can use binary chop over the start index values to find the correct transform entry for any row. You can use binary chop over start index offset by total num to find the correct entry to *inverse* transform any row. 

## Importing Data

The most common way of getting started with my cloud spreadsheet will be to import data from another source. You could iterate through every cell in the source, adding an entry to the transaction log. However, it will be much more efficient to directly create a snapshot and add a single entry to the transaction log that references the imported snapshot. This works both when creating a new spreadsheet from an import, or when importing and overlaying data onto an existing spreadsheet.

If the source is a limited size format like Excel or Google Sheets, simply load it, convert to our in-memory format and then write out a snapshot like we do when [creating an initial segment]({{ page.url | absolute_url | append: "#creating-a-segment-in-the-first-place" }}).

If the source is something too large to fit into memory, it will have an API to query it in parts. Use the same approach we used for merging segments. Load the data incrementally to determine output stripe boundaries, then iterate down each stripe converting and outputting. 

## Coming Up

Time to pause, take stock, and formalize what we've come up with so far into something that looks more like a file format spec.