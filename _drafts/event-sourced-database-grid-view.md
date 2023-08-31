---
title: Event Sourced Database Grid View
tags: databases frontend
---

When we [started on this journey]({% link _posts/2023-06-12-database-grid-view.md %}), I told you that there was an easy way and a hard way to implement a database backed grid view. I then spend the next six posts in [this series]({% link _topics/databases.md %}) taking you through different variations of the hard way.

The problem  with the easy way is that it relies on the collection of data you need to display in the grid view being small enough that you can load it all into the client and do all the sorting and filtering you want client side. For example, GitHub projects implements a grid view of issues the easy way by limiting the number of issues to at most 1200 and limiting each issue to 50 fields where each field stores at most 1KB of data. 

{% include candid-image.html src="/assets/images/github-nodejs-feature-requests.png" alt="GitHub Project of NodeJS Feature Requests" %}

The GitHub client loads all the issues in the project up front. That's 1200 of them for a maxed out project. A typical project with 10 fields averaging 100 bytes a field needs to download 1.2MB of data, which will take about a second over a basic 10Mbps ADSL broadband connection. A worst case project with 50 fields each using 1024 bytes of data needs to download 60MB of data, which would take 60 seconds to open. 

That seems like a reasonable upper limit on project size. UX designers talk about the [three response time limits](https://www.nngroup.com/articles/response-times-3-important-limits/) of 0.1 seconds, 1 second and 10 seconds. A second to open or refresh a collection of issues is the limit for a user's flow of thought to stay uninterrupted. Taking 60 seconds in the worst case is beyond the 10 second limit for keeping a user's attention but is just about tolerable as a worst case scenario. 

The easy way is not only simpler to implement but also gives the end user a vastly improved experience. Once the data is loaded, everything you do with it is well under the 0.1 second response time limit. Sorting and filtering feels effortless. Is there a way to make the easy way work with larger sets of data?

Before I answer that question, I need to take you on a little detour through the history of web client implementation.

## Web 1.0

{% assign posts_page = site.pages | where: "ref", "blog" | first %}
The [early days of the web](https://en.wikipedia.org/wiki/Web_2.0#Web_1.0) were characterized by content served up as static HTML pages. A paged database grid view was literally served up as separate html pages, with one page for the first fifty issues, a second page for issues 51 to 100 and so on. The UI for interacting with paged data took the form of explicit buttons to move between pages, just like [posts]({{ posts_page.url | absolute_url }}) in my blog. 

Every interaction with the "web app" would result in a new page fetch, which in turn would fetch up to date data from the database. If a user had been starting at a page for some time, they could update it manually by using the refresh button in the browser.

As every interaction involves a round trip to the server, the app never achieves the 0.1 second response time required for the experience to feel fluid. 

## Single Page Apps

The dark days of web 1.0 were followed by the rise of [single page apps](https://en.wikipedia.org/wiki/Single-page_application). Instead of every interaction resulting in a new page load, the app uses JavaScript to fetch new data from the server and dynamically rewrite the current web page. The main HTML, JavaScript and CSS is fetched as a single page load at startup. 

Data is fetched from the server using explicit API calls, most commonly using the [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) pattern. The UI is more dynamic and cohesive. It feels more like a dedicated app than a set of web pages. Paged database grid views replace explicit pages with [virtual scrolling](https://blog.logrocket.com/virtual-scrolling-core-principles-and-basic-implementation-in-react/). The user thinks they're navigating seamlessly through a never ending list of issues, but in reality the app is loading the data that is about to scroll into view a page at a time behind the scenes. 

Interactions with the app become more fluid. As long as the data is there, the elusive 0.1 second response time is achievable. However, if the user is doing something that consumes data faster than it can be fetched, the extra latency can be jarring.

In our case, the user is spending some quality time reviewing issues in their project. All the issues have been retrieved and the experience is fast and fluid. However, as time passes, the data they're looking at becomes out of date, as other users work on issues. We no longer have the happy side effect of Web 1.0 where every interaction needs a page fetch which in turn refreshes the data. 

Solving this problem is often an afterthought in the rush to put a functional app together and ship it. The single page apps I worked with adopted a variety of ad hoc approaches. You might poll the server every 30 seconds to see if anything has changed. If you were worried about the lack of responsiveness or the extra load that puts on the server you might look at [server-sent events](https://en.wikipedia.org/wiki/Server-sent_events) or [web sockets](https://en.wikipedia.org/wiki/WebSocket) so that the server can notify the client.

Even if you can work out that newer data is available, you still have the problem of updating the content in the app. The way you've stored the data in your database and exposed it via a REST API is designed for loading pages of data at a time. There's no easy way to work out what has changed and retrieve just the data you need. Reloading everything will be disruptive to the user. You end up with kludgy solutions like putting up a banner to tell the user that there is new data, which reloads when clicked on. 

Then, underlying everything, is the app's dependence on an available, fast and stable network connection.

## Progressive Web Apps

The driving idea behind [Progressive Web Apps](https://en.wikipedia.org/wiki/Progressive_web_app) is to approach native app levels of functionality and performance. In particular, a progressive web app can continue to run if the network connection is lost or intermittent. Progressive Web Apps depend on modern browser features such as [service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) and [client-side storage](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Client-side_storage). 

Service workers sit between the app and the network with the ability to intercept, augment or replace all network requests. A Progressive Web App will typically download and cache all the app's HTML, JavaScript, CSS and other resources on first use. On subsequent uses it will respond immediately with the cached resources, even if there is no network connection. The app can also use service workers to implement background data synchronization and pre-fetching of data that the user is likely to need.

Modern client-side storage APIs allow apps to store large amounts of complex data locally. This includes [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology), a rich client side database, and [Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) which gives your app full access to its own dedicated file system. OPFS has only been available across all major browsers since March 2023. Prior to that, apps would use IndexedDB or the [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) to store file content locally.

Which all sounds great. Our app can pull down all of the data needed by the grid view and store it locally. After first use, everything is fluid and responsive. Data can be updated asynchronously in the background. But that stills leaves us with the problem of how to determine what has changed and retrieve just the data we need.

## Event Sourcing

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
Enter [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html). I've [discussed]({{ bb_url | append: "#event-sourcing" }}) Event Sourcing in [some]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) [detail]({% link _posts/2023-08-07-spreadsheet-event-log.md %}) in my [series on implementing a cloud spreadsheet]({% link _topics/spreadsheets.md %}). The basic idea is simple. We store an ordered sequence of events which define all the changes made to the collection of issues. To load the data into the client, retrieve all the events and replay them locally. 

Working out what has changed and retrieving the data needed is now trivial. The client knows the most recent event it consumed. It just needs to query the server for any events that have occurred since then. 

The client can use IndexedDB to store the event log locally. When the app loads, load and replay the local events. Then check for any recent events from the server.

If required, it's reasonably straightforward to add support for offline editing. Simply add events to the local IndexedDB event log. When network access is restored, forward the events to the server. Obviously you'll need to implement some form of conflict resolution if changes have happened on the server while you were offline. Events are perfect for capturing user intent, which makes it easier to implement automated or semi-automated conflict resolution.

Eventually the event log will become too long to be manageable. Event Sourcing addresses that by creating snapshots at regular intervals. A snapshot captures the state of the issues collection at the corresponding point in the event log. Now to load data into the client, load the latest snapshot and then replay any events since the snapshot was taken. 

## Instant Resume

Let's wind back to where we started. We want to use the easy approach to implementing a database backed grid view where everything happens client side. To make that work we have a 1200 issue limit on the size of a collection. 

A Progressive Web App using Event Sourcing lets us store data locally and efficiently keep it in sync with changes on the server. However, we still need to wait to download all the data. What have we gained?

The point is that you only have to wait once, when you first open the collection. After that, everything is available locally with changes synced in the background. You can even sync snapshots in the background. Just keep loading from the previous snapshot until the latest has downloaded.

What would happen if we increased the limit to 12000 issues? Our typical project would take 10 seconds to open the first time you used it. The worst case project would take 10 minutes. That's go and have a cup of coffee long. However, you only have to do it *once*. If you start working with a project right from the beginning, you never have to wait. 

## Client-side Storage

Is there a technical limit on how large a project can be if users are prepared to wait on first use? After all, people are prepared to wait for hours to install gigabytes of content for a game. 

All browsers have a limit on the amount of client-side storage space that an app can use, shared by all client-side storage APIs. The [limit varies between browsers](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) but all support at least 1GB of data. Apps can request more space which may require confirmation from the end user.

| Browser | Default | On Request |
|---------|---------|------------|
| Chrome/Edge | 60GB | 60GB |
| Firefox | 10GB | 50GB |
| Safari | 1GB | 200MB per request |

Most browsers base the limit on the size of the disk drive that contains the user's profile data. In the figures above I've assumed that the drive will be at least 100GB.

The worst case project for 1200 issues is 60MB of data. We can manage 20 times that across all browsers, or 200 times if we can ignore safari.

## Compression

## Memory Consumption

## Scalability

## Conclusion
