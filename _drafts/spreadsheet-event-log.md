---
title: Implementing my Spreadsheet Event Log on DynamoDB
tags: spreadsheets databases
---

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
In the distant past, before I got sucked into a seemingly never ending [series on databases]({% link _topics/databases.md %}), I [said]({% link _posts/2023-07-03-spreadsheet-merge-import.md %}) that I was going to start formalizing the format for my cloud based, serverless, event sourced spreadsheet. I realize now that I've said very little on how I'm going to implement the central component of my spreadsheet, the [event log]({{ bb_url | append: "#event-sourcing" }}). 

I did say that the event log will be managed in a database and that DynamoDB is the only [truly serverless]({% link _posts/2022-12-05-serverless-or-not.md %}) database AWS has. It shouldn't come as too much of a surprise that I'm going to use DynamoDB for the event log. Fortunately, I just happened to finish an [in depth piece on DynamoDB]({% link _drafts/dynamodb-database-grid-view.md %}) last week, so it's fresh in the memory. 

## Schema

## Access Patterns
