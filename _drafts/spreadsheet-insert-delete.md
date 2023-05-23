---
title: Making Spreadsheet Snapshots work with Insert and Delete
tags: spreadsheets cloud-architecture
---

{% capture fd_url %}{% link _posts/2023-01-09-spreadsheets-future-data-systems.md %}{% endcapture %}
When you're [implementing a cloud spreadsheet]({{ fd_url }}), it's tempting to think of it as just another kind of database. Each row of the spreadsheet is equivalent to a row in a database. Each column in the spreadsheet is equivalent to a column in a database. Yes, spreadsheets don't have schemas. Yes, spreadsheets can have lots of columns. However, there are plenty of examples of NoSQL databases that are [schemaless](https://www.mongodb.com/unstructured-data/schemaless) and have [wide column stores](https://en.wikipedia.org/wiki/Wide-column_store).

The thing that breaks the easy analogy is when you start thinking about row keys, column identifiers, insertion and deletion. Here's [the world's most boring spreadsheet]({% link _posts/2023-01-30-boring-spreadsheet.md %}) again to help focus the mind.

{% include candid-image.html src="/assets/images/boring-spreadsheet.png" alt="The World's Most Boring Spreadsheet" %}

Row keys are consecutive integers. Column identifiers are alphabetical codes, effectively consecutive base 26 integers. What happens if you insert a new row at the beginning of the spreadsheet? All the other rows move down one place to make room. All the other rows now have a different row key. What happens if you insert a new column at the beginning of the row? All the other columns move right one place to make room. All the other columns now have a different column key. Delete is similar with the remaining rows and columns moving the other way.

Think about what would happen if you implemented your spreadsheet as a database. Insert and Delete could result in rewriting every row in the database. 

That's ridiculous, you might think. No one would use a database this way. Give the columns meaningful identifiers rather than letters. They're right there in the first row of the spreadsheet. Use a value from one of the other columns as a row key, or if they're not unique, add a GUID. Use a string if you need to support an explicit order, that way you can always come up with a new key between any pair of existing keys. 

You absolutely could do that. That's what the many [Spreadsheet-Database hybrid]({{ fd_url | append: "#spreadsheet-database-hybrids" }}) products do. But then what you've built isn't a spreadsheet anymore.

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
I'm building a cloud native, serverless, highly scalable spreadsheet using [Event Sourcing]({{ bb_url | append: "#event-sourcing" }}) to store the sequence of operations applied to a spreadsheet. Every so often I'll create [snapshots]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) of the current spreadsheet state. I can then load the spreadsheet at any point in time by loading a snapshot and applying changes from that point on in the event log. 

How does that work with Insert and Delete?

## Event Sourcing

Everything works very naturally with [basic event sourcing](({{ bb_url | append: "#event-sourcing" }})). The source of truth is an event log that says an insert or delete has happened. You apply the operation to the client's in-memory representation of the spreadsheet which can be done simply and efficiently. 

## Single Segment Snapshot

Of course, event sourcing by itself isn't enough. You need some kind of snapshot system so that you can load the state of the spreadsheet without having to replay the entire event log. 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/single-segment.svg" alt="Single Segment Snapshot" %}

The simplest form of snapshot is one that contains the entire spreadsheet in a single segment. Again, this works very naturally with insert and delete. You load the snapshot into client memory and then apply any operations in the event log from after the snapshot was created. Inserts and deletes update the in-memory representation. To create a new snapshot, write out the in-memory representation. 

## Multi-Segment Snapshot

{% capture ds_url %}{% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}{% endcapture %}
As we saw [last time]({{ ds_url | append: "#segments" }}), maintaining single segment snapshots is an *O(n<sup>2</sup>)* process. To achieve reasonable efficiency you need a more complex system where each snapshot consists of multiple segments covering different parts of the event log, and where segments are shared between different snapshots.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/lsm-segments.svg" alt="Multi-Segment Snapshots" %}

Let's say we're loading snapshot 3. It consists of two segments. One created by and shared with snapshot 2 and one covering a later part of the event log created by snapshot 3. 

Now things start to get interesting. What happens if there were inserts and/or deletes in the part of the event log captured by segment 3? 

Let's look at a concrete example. We have an initial event log starting to populate an empty spreadsheet.

| Event Id | Event |
|-|-|
| 1 | Set A1=Mon,C1=Wed |
| 2 | Set B2=Feb,D2=Apr |
| 3 | Set A3=2020,C3=2022 |

We then create an initial snapshot resulting in this segment.

|   | A | B | C | D |
|---|---|---|---|---|
| 1 | Mon | | Wed | |
| 2 | | Feb | | Apr |
| 3 | 2020 | | 2022 | |

We continue with these events.

| Event Id | Event |
|-|-|
| 4 | Set B1=Tue,D1=Thu |
| 5 | Set A2=Jan,C2=Mar |
| 6 | Insert row 2 (A=Red,B=Orange,C=Yellow,D=Green) |
| 7 | Set B4=2021 |
| 8 | Delete column C |
| 9 | Set C4=2023 |

Now it's time to create another snapshot. We write out a new segment that covers just this section of the event log and reuse the segment from the previous snapshot.

|   | A | B | C |
|---|---|---|---|
| 1 | | Tue | Thu |
| 2 | Red | Orange | Green |
| 3 | Jan |  | |
| 4 | | 2021 | 2023 | 

In theory we should be able to combine the two segments to load the complete snapshot.

|   | A | B | C |
|---|---|---|---|
| 1 | Mon | Tue | Thu |
| 2 | Red | Orange | Green |
| 3 | Jan | Feb | Apr |
| 4 | 2020 | 2021 | 2023 | 

But the segments don't line up. If you overlay the second segment on top of the first you get

|   | A | B | C | D |
|---|---|---|---|---|
| 1 | Mon | Tue | Thu | |
| 2 | Red | Orange | Green | Apr |
| 3 | Jan | | 2022 | |
| 4 | | 2021 | 2023 | 

I like to think of this problem in computer graphics terms. The segments are in different coordinate spaces. In order to combine the second segment with the first, we need to record the transform that will get the first segment into the coordinate space of the second. In our case the "transform" is just a set of rows and columns that need to be inserted and deleted. For this specific example the transform is "insert row 2, delete column C".

When creating a snapshot we need to go back through the event log looking for all insert and delete events, combining them together to create a transform that we record with the segment we're writing out. Redundant changes (e.g. insert row 2, delete row 2) can be removed. Lists of rows/columns can be sorted into order and combined into ranges (e.g. insert row 5-7 instead of insert 5, insert 5, insert 6).

## Tiles

We want to scale to spreadsheets with millions of rows and columns which means we need to break each segment into [tiles]({{ ds_url | append: "#tiles" }}). Instead of loading complete segments, we'll load just the tiles needed to display the required view in the client. 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/quad-tree-tiles.svg" alt="View rectangle intersecting tiles within a segment" %}

The view is a rectangle within the coordinate space of the most recent segment. When loading tiles from an earlier segment, we need to reverse transform the view rectangle into that segment's coordinate space. We then use the transformed rectangle to decide which tiles to load. 

To reverse a transform, swap inserts and deletes. To apply the transform to a rectangle, think of what happens to the array of cells that the rectangle represents. Inserts in a row before the start of the rectangle move the rectangle down, deletes move it up. Inserts in rows in the middle of the rectangle make it bigger, deletes make it smaller.

Once we've identified and loaded the tiles, we forward transform each one in the same way we did for an entire segment. The contents of each tile is copied into our in-memory representation of the spreadsheet, starting from the earliest segment. Tiles from more recent segments overlay earlier tiles.

We can simplify the loading process and reduce the size of each tile by using relative addressing. Rather than storing an explicit row and column index for each cell in the tile, we store row and column relative to the top left corner of the tile. A tile can be loaded anywhere in the spreadsheet grid by adding the origin of it's top left corner to the stored row and column for each cell in the tile. 

## Segment Index

* Index already knows where the top left corner of each tile is, so lose nothing by using relative addressing within a tile
* For a two level row index we can use relative addressing within the lower level index chunks. If we limit each chunk to covering at most 4 million rows, we can halve the chunk size by using 32 bit indices. 
* Because we transform the view query rectangle into each segment's coordinate space, nothing needs to change in how we use the index to determine tiles to load.
* When writing a new segment we need to store the transform from any dependent segment somewhere. Segment index is an obvious place to put it. Straight forward extension to existing packaging ideas. Can include in same chunk as other parts of the index, or if index gets big enough, break out into a separate chunk.
* In principle, transform could get large. Imagine a 100 million row spreadsheet and we insert new rows between each existing row. Transform is made up of four sorted lists of ranges. Can use same principle as row and column indices to break into multiple chunks if needed.
* May want to use funky encoding. Start of range, cumulative width. Subtract previous range cumulative width to get actual width. Storing cumulative width means you can use binary chop to find last range before point of interest and immediately know total number to shift by without having to iterate over all the ranges.

## Merging
