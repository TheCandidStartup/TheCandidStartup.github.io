---
title: Spreadsheet Row/Column Insert/Delete
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

Of course event sourcing by itself isn't enough. You need some kind of snapshot system so that you can load the state of the spreadsheet without having to replay the entire event log. 

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/single-segment.svg" alt="Single Segment Snapshot" %}

The simplest form of snapshot is one that contains the entire spreadsheet in a single segment. Again, this works very naturally with insert and delete. You load the snapshot into client memory and then apply any operations in the event log from after the snapshot was created. Inserts and deletes update the in-memory representation. To create a new snapshot, write out the in-memory representation. 

## Multi-Segment Snapshot

As we saw [last time](% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}), maintaining single segment snapshots is an *O(n<sup>2</sup>)* process. To achieve reasonable efficiency you need a more complex system where each snapshot consists of multiple segments covering different parts of the event log, and where segments are shared between different snapshots.

{% include candid-image.html src="/assets/images/spreadsheet-snapshots-2023/lsm-segments.svg" alt="Multi-Segment Snapshots" %}

Let's say we're loading snapshot 3. It consists of two segments. One created by and shared with snapshot 2 and one covering a later part of the event log created by snapshot 3. 

Now things start to get interesting. What happens if there were inserts and/or deletes in the part of the event log captured by segment 3? Segment 2 and segment 3 no longer line up. 

## Chunks

## Segment Index

## Merging
