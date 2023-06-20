---
title: Merging and Importing Spreadsheet Snapshots
tags: spreadsheets 
---

[Last time]({% link _posts/2023-06-05-spreadsheet-insert-delete.md %}), we looked at the added complexity that comes when you start inserting and deleting rows and columns from your spreadsheet. Spreadsheet snapshots are made up of multiple segments. Once you start inserting and deleting things, those segments are in different coordinate spaces. You need to transform the earlier segments into the coordinate space of the most recent as you load them. 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/lsm-segments.svg" alt="Multi-Segment Snapshots" %}

As you create more snapshots you need to periodically merge segments together for efficient management. Should be easy, right? Load the earlier segment and overlay the more recent one on top. Then write out the in-memory representation as a new segment. 

The problem is that as spreadsheets grow in size, snapshots can become arbitrarily large. Using power of two sized snapshots, the largest snapshot will be half the size of the entire spreadsheet. Too big to fit in memory with the size of spreadsheet that I want to support. We need to come up with an [external memory algorithm](https://en.wikipedia.org/wiki/External_memory_algorithm) for merging. 

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

## Choosing stripe boundaries for a merge

We can use pretty much the same algorithm when choosing stripe boundaries for a merge. Use the same approach as the merge algorithm to incrementally load the data we need. Start with a 128 column wide view rectangle, load the tiles covered in both segments into memory and iterate down the candidate stripe until either we have enough data buffered or have hit the end of the spreadsheet. 

## Putting it all together

We don't have to work out all the stripe boundaries before we start merging. Once we've decided on a stripe boundary, we can run the merge algorithm for that stripe, then decide what width the next stripe needs to be. This approach minimizes the size of the in-memory working set.

The output stripe boundaries may not align with the input stripe boundaries (as shown in the diagrams above), which may not align with each other (due to the impact of inserts and deletes). The same input tile may need to be accessed by multiple stripes. We'll need a caching system that will try and hold on to tiles that will be needed again. However, we may still end up having to eject tiles from memory and then load them again later.

We prefer fixed width stripes where possible. There are also benefits with fixed height tiles. We're trying to write out chunks that are between 0.5 MB and our ideal chunk size of 1 MB. We can use a similar algorithm to the one used to pick stripe width. If there's a power of two number of rows that has a size in our desired range use that. Use the same number of rows for the next tile if possible, if not try the next power of 2, otherwise binary chop to a size that works.

## Chunk Format

* May pack multiple parts into a chunk (reuse picture)
* Use ZIP format (or something functionally equivalent), get compression thrown in
* Single part chunk has same name as the part contained.
* Composite chunks are numbered 0,1,2,3,.. (with some appropriate fixed prefix)
* The entry point for a segment is a small JSON manifest which is always stored in composite chunk 0. 

## Writing the index

We also need to make sure we can write the index incrementally rather than buffering it all in memory and writing it out at the end. [Depending on index size]({{ ds_url | append: "#packaging" }}) we may be able to embed it in the same chunk as the first tile, store the whole thing in a dedicated chunk, or break it into multiple chunks. We need to make that choice on the fly, as we write out the segment. 

We need to keep the first tile in memory, rather than writing it out immediately, until we know whether we want to embed the index or any other metadata in the same chunk. We accumulate the column and row index structures in memory as we process and write out tiles for each stripe. If the accumulated row index data becomes larger than 1.5 chunks worth, we can start outputting dedicated row index parts.
* If the accumulated row index data is all from the same stripe, we will need multiple single part chunks for that stripe. Write out a chunks worth. 
* If the accumulated data up to the end of the first stripe is bigger than half a chunk, write it out as single part chunks (using one or two chunks as needed).
* If the accumulated data contains multiple complete stripes bigger than half a chunk, write them out as a composite chunk, one part per stripe.
* Otherwise we must have one or more complete stripes totalling less than half a chunk followed by more than a chunks worth of partial data all from the same stripe. Write out the complete stripes and enough partial data to make up a chunks worth as a composite chunk.
* Rinse and repeat.


## Part Format

* Index parts use a naming convention that identifies the spreadsheet rectangle the part covers. Content is written out using relative addressing.
* Then use an index at the next level up that specifies the layout of the parts. Can use same representation as index of tiles, except triples rather than doubles per entry. The extra value specifies the number of the chunk that contains the part (0 means its in a single part chunk).
* Don't need any kind of map for single part chunks as can use naming convention to work out which chunk to load. 
* Could use numbered chunk even for single part chunks. However, storing 0 and relying on naming convention should compress better? Worth complexity?
* ??? Need something to connect row indexes to column index. Once I've worked out which stripe I want, how do I find where root of row index is?

## Merging Transforms

* Need an external algorithm for this too
* Transform is made up of sorted lists of ranges
* Simple merge algorithm
* Need to transform from input to output coordinate space ...

## Importing Data
