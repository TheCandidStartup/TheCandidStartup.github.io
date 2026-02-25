---
title: Decoupling the Event Log and Snapshot Tiles
tags: event-sourced-spreadsheet-data
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

[Last time]({% link _drafts/infinisheet-snapshot-multi-part-partial-load.md %}), we got a load-on-demand chunked snapshot format working. It didn't feel great, with too much coupling between in-memory representations for the event log and snapshot. We're going to sort that out now before moving on to a multi-tile snapshot format. 

# A Cunning Plan

{% capture s_url %}{% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}{% endcapture %}
I was thinking about the next stage on this scalability journey when I realized where I'd gone wrong. Eventually, we'll need a snapshot format that uses multiple [snapshot segments]({{ s_url | append: "#segments" }}). You make snapshot writes scalable by storing snapshots as multiple segments that are layered on top of each other. Each snapshot write creates a new segment and reuses existing segments from earlier snapshots.

The in-memory representation is a tile map for each segment. When reading the value of a cell you query each tile map in turn, similar to [layered spreadsheet data]({% link _posts/2025-03-17-react-spreadsheet-layered-data.md %}). We can use the same approach to decouple event log and snapshot. All we have to do is put all changes since the last snapshot into a dedicated "edit" layer on top. Now there's no coupling between event log updates and snapshot management. There's no need to load snapshot tiles in `setCellValueAndFormat` or `syncLogsAsync`. 

# Edit Layer

My initial thought was to use a tile map for the edit layer. However, there's no need to use a multi-tile representation. The content of the edit layer is bounded by the maximum size of a log segment. Once we have a chunk's worth of data we write a snapshot and start a new segment. Which in turn means that the in-memory representation of an event log segment will comfortably fit in a single tile. We can use a single cell map for all the edits.

Using a cell map for the edit layer and a tile map for each snapshot segment allows us to specialize the data structures if needed. The edit layer needs to track the history of changes made. Snapshot layers are logically immutable (although individual tiles are loaded on demand).
