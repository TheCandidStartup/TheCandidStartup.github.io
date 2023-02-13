---
title: Brainstorming and Benchmarking
tags: spreadsheets cloud-architecture
---

Last time I took you on a tour of the [world's most boring spreadsheet]({% link _posts/2023-01-30-boring-spreadsheet.md %}). I used a basic, if large, spreadsheet to identify some benchmarks that I can use to assess the viability of the crazy implementation ideas we're going to brainstorm. The benchmarks are by no means exhaustive - think of them as the very low bar that any idea needs to get over to be worth considering further. 

The user needs to be able to import our existing spreadsheet, fully recalculate it, open it in a web client, insert a new row or edit an existing cell with interactive performance, fail cleanly if they use some crazy *O(n<sup>2</sup>)* formula they copied off the internet and finally export their spreadsheet back out again.

{% capture saas_url %}
{% link _posts/2022-11-28-modern-saas-architecture.md %}
{% endcapture %}

Remember, the intention is to build a [truly serverless]({% link _posts/2022-12-05-serverless-or-not.md %}) implementation that a customer can [deploy in their own AWS account]({{ saas_url | append: "#a-modest-proposal" }}). That will further limit our choices. In practice we're down to DynamoDB for our database, S3 for file/blob storage and Lambda for compute. We can add queues and orchestration with SNS, SQS, EventBridge and STEP as needed. We have more choices when it comes to a front end gateway but that will largely be a question of cost/convenience. No architecturally significant choice there.

Finally, we're [not just reimplementing a basic spreadsheet]({% link _posts/2023-01-09-spreadsheets-future-data-systems.md %}). We'll start there but we need to build a foundation that will scale beyond current data limits, support granular permissions and data integrity constraints. 

## Big Disk Drive in the Sky

Let's warm up with the simplest possible evolution of a desktop spreadsheet. Think Google Sheets and Office 365. Take your existing spreadsheet file and store it on a big disk drive in the sky (otherwise known as S3). You can use your existing desktop client or port it to a fat web client. Importing the spreadsheet is a matter of uploading it to S3, opening it in a client is a matter of downloading it. Once you have it open, everything is available in memory for interactive performance. To persist any change you make, upload a new version of the file to S3.

Let's see how that stacks up against our benchmarks. The spreadsheet is 20MB in the optimized binary format and takes 10 seconds to load into a desktop client from a fast, local SSD. How much extra time will uploading and downloading add?

| Connection Type | Download Speed | Download Time | Upload Speed | Upload Time |
|-|-|-|-|-|
| ADSL[^1] | 10Mbps | 16s | 1Mbps | 160s |
| FTTC[^2] | 38Mbps | 4s | 15Mbps | 10s |
| FTTP[^3] | 300Mbps | 0.5s| 50Mbps | 3s |
| Leased Line[^4] | 10Gbps | 0.01s | 10Gbps | 0.01s |

[^1]: [ADSL](https://en.wikipedia.org/wiki/ADSL) is now commonly known as standard broadband. It's the lowest cost option using standard telephone line copper cables. There is a significant difference in upload and download speeds (typically 10:1) as well as a significant reduction in speeds if you live further from the exchange. Speeds given here are average available in the UK.
[^2]: [FTTC](https://en.wikipedia.org/wiki/Fiber_to_the_x#Fiber_to_the_curb/cabinet/node) (fibre to the cabinet) is the most commonly available form of high speed broadband in the UK. Fibre optic cable is run to street side cabinets with the existinb copper cables used for the last mile connection. Speeds available depend on your distance from the cabinet. Speeds given here are [those available to 50% of the population in the UK](https://www.thinkbroadband.com/guides/fibre-fttc-ftth-broadband-guide#what-speed).
[^3]: [FTTP](https://en.wikipedia.org/wiki/Fiber_to_the_x#Fiber_to_the_premises) (fibre to the premises) is the highest speed home broadband available in the UK. Fibre optic cable is run direct to the premises, terminating close to the customer's router. Speeds here are those typically quoted by OpenReach which runs the largest network in the UK. Most customers have lower priced packages where speeds are capped anywhere down to 36Mbps.
[^4]: [Leased Lines](https://www.hso.co.uk/leased-lines/leased-line-speeds) are dedicated connections traditionally used by businesses worried about the reliability of consumer broadband. They feature guaranteed, symmetric rates for upload and download at speeds anywhere between 2Mbps and 10Gbps.

It's a significant amount of time until you get to the high end of connection types. And that's for a spreadsheet within the current limits. What happens when you scale to 10-100 times that size? It becomes impractical for all but the highest capacity leased line (typically used for connecting data centers!).

Can the client handle it? This approach depends on a full fat client that can handle everything locally. The 400MB of RAM required shouldn't be an issue, even in a web or mobile client. However, once again, it all falls apart if you scale things up 10-100 times.

What about costs? You are charged for API requests to S3 but those are insignificant compared to the data transfer costs at $0.0015 per download (upload is free). Each version of the spreadsheet stored costs $0.00045 per month.

Finally, what if you want to do some processing server side?

## Classic Web App

## Event Sourcing

## Footnotes
