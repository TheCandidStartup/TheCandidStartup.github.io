---
title: Multi-Segment Snapshots
tags: event-sourced-spreadsheet-data
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

{% capture s_url %}{% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}{% endcapture %}
My initial plan was to move on to a multi-tile snapshot format. Instead, I'm going to look at multiple [snapshot segments]({{ s_url | append: "#segments" }}) first. This is a key part of the scalability story that I was going to look at last. You make snapshot writes scalable by storing snapshots as multiple segments that are layered on top of each other. Each snapshot write creates a new segment and reuses existing segments from earlier snapshots.

The in-memory representation is a tile map for each segment. When reading the value of a cell you query each tile map in turn, similar to [layered spreadsheet data]({% link _posts/2025-03-17-react-spreadsheet-layered-data.md %}). 

Once you have a layered representation, it becomes natural to put all changes since the last snapshot into a "edit" layer on top. Now there's no coupling between event log updates and snapshot management. There's no need to load snapshot tiles in `setCellValueAndFormat` or `syncLogsAsync`. 
