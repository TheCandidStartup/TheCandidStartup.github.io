---
title: Event Sourced Database Grid View
tags: databases
---

When we [started on this journey]({% link _posts/2023-06-12-database-grid-view.md %}), I told you that there was an easy way and a hard way to implement a database backed grid view. I then spend the next six posts in [this series]({% link _topics/databases.md %}) taking you through different variations of the hard way.

The problem  with the easy way is that it relies on the collection of data you need to display in the grid view being small enough that you can load it all into the client and do all the sorting and filtering you want client side. For example, GitHub projects implements a grid view of issues the easy way by limiting the number of issues to at most 1200 and limiting each issue to 50 fields where each field stores at most 1KB of data. 

{% include candid-image.html src="/assets/images/github-nodejs-feature-requests.png" alt="GitHub Project of NodeJS Feature Requests" %}

The GitHub client loads all the issues in the project up front. A typical project with 10 fields averaging 100 bytes a field needs to download 1.2MB of data which will take about a second over a basic 10Mbps ADSL broadband connection. A worst case project with 50 fields each using 1024 bytes of data needs to download 60MB of data which would take 60 seconds to open. 

That seems like a reasonable upper limit on project size. UX designers talk about the [three response time limits](https://www.nngroup.com/articles/response-times-3-important-limits/) of 0.1 seconds, 1 second and 10 seconds. A second to open or refresh a collection of issues is the limit for a user's flow of thought to stay interrupted. Taking 60 seconds in the worst case is beyond the 10 second limit for keeping a user's attention but is just about tolerable as a worst case scenario. 

The easy way is not only simpler to implement but also gives the end user a vastly improved experience. Once the data is loaded, everything you do with it is well under the 0.1 second response time limit. Sorting and filtering feels effortless. Is there a way to make the easy way work with larger sets of data?

Before I answer that question, I need to take you on a little detour through the history of web client implementation.

## Web 1.0

## Single Page Apps

## Progressive Web Apps

## Event Sourcing

## Instant Resume

## Local Storage

* Local storage: indexed DB and cache/OPFS for files
* Limits for browsers
* 1GB for Safari + user prompt for each additional 200MB, 10GB for Firefox, 60GB for Chrome (assuming 100GB system disk)
* All browsers can handle 20X worst case, ignore Safari and 200X

## Compression

## Scalability

## Conclusion
