---
title: The Seven Rules of Multi-Tenant Systems
tags: cloud-architecture
---

I spent [ten years of my career]({% link _topics/cloud-architecture.md %}) working on the architecture of [multi-tenant systems]({% link _posts/2022-11-07-evolution-multi-tenant-architecture.md %}). That's enough time to make and witness a lot of mistakes. I've learnt a lot. Now it's time to distill the benefits of that learning into what I like to call the Seven[^1] Rules of Multi-Tenant Systems. 

[^1]: It's actually sixteen rules divided into seven categories but that doesn't sound as snappy

## 1. API

You'll need an API. No, really. Despite what your Product Manager tells you about [Minimum Viable Product](https://en.wikipedia.org/wiki/Minimum_viable_product) and focusing on functionality first, you should start with the API. 

After all, you're going to have an API anyway. You will have a front end and a back end. Something needs to sit between them. The choices you make in the early stages of development have a habit of hanging around for ever. The worst thing you can do is make it up as you go along. A little bit of time spent thinking about your data model and how it should be exposed by an API will reap huge dividends later on. 

You may be told that you're just building a prototype and that it will be rebuilt properly later. Don't believe it. If you get a positive response to your MVP, you can be sure that whatever [big ball of mud](https://blog.codinghorror.com/the-big-ball-of-mud-and-other-architectural-disasters/) you threw together will end up as the long term foundation of your product.

{% capture note %}
* All access to data from the front end or other services SHOULD be via a formal API
{% endcapture %}
{% include candid-note.html content=note %}

## 2. Tenants

It seems kind of obvious. You're building a multi-tenant system, so it should have tenants as a first class concept. The same system will serve multiple customers, so it's going to be really important that you keep track of which data belongs to which customer. You don't want to lose it and you don't want to give one customer access to another customer's data. 

You'd be surprised. Sometimes, it's easy to forget who really owns the obscure bit of data tucked away in a quiet backwater of your system. This is especially common with a [microservice architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}). Maybe you're working on a foundational service like a blob store. As far as you're concerned, your customers are other higher level microservices. Why should you care about tenants?

Well, as it turns out, those other higher level microservices are using your service to store customer data. You might think that makes it their responsibility to keep track of which customer owns the data in your service. In practice, that's really difficult. Orchestrating operations reliably across multiple services is hard. It's surprisingly common to create orphaned data when things go wrong. Demonstrating compliance with data protection regulations is difficult if you have no idea who owns the data in your service.

What about third party services like [AWS S3](https://aws.amazon.com/pm/serv-s3/) or cloud databases? The key thing is that you can identify who owns the data. The third party service doesn't have to understand your tenant model, it just needs to provide a way for you to [tag the data stored](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-tagging.html) with a tenant id. 

Good job you have a formal API. You can ensure that every API call includes an explicit tenant id. 

{% capture note %}
* All customer data MUST be tagged with a tenant id in any service where it is stored or processed
{% endcapture %}
{% include candid-note.html content=note %}

## 3. Security

You're asking your customers to trust you with their data, often with the core processes needed to run their business. Trust is easy to lose. A major security breach can be catastrophic for your business. 

Security is non-negotiable. That doesn't mean empty sound bites and completing an hour of online training once a year. You need to instill secure development practices into your teams and your culture from the beginning. It's easy for vulnerabilities to creep in when teams are under constant pressure to deliver against arbitrary deadlines. Teams need to be empowered to maintain a minimum level of engineering rigor.

{% capture note %}
* All development teams MUST follow secure development best practices
{% endcapture %}
{% include candid-note.html content=note %}

The most important thing I've learnt about security, is that no matter how good your processes are, people still make mistakes. No matter how much you talk about security non-negotiables, people under pressure will cut corners. You need external validation of the security of your system and you need to keep doing it. 

Regular [penetration tests](https://en.wikipedia.org/wiki/Penetration_test) are invaluable for keeping everyone honest. Penetration testing doesn't need to be time consuming. Luckily, you have a well documented, formal API. Give that to your pen tester together with a couple of test tenants they can use for testing. Fix any vulnerabilities found and learn from them. Update your processes so that the same problem doesn't come up again. 

{% capture note %}
* All systems MUST be subjected to regular penetration testing
* All vulnerabilities MUST be fixed within a documented time window
{% endcapture %}
{% include candid-note.html content=note %}

## 4. Scalability

When is the right time to focus on scalability? After all, you don't want to waste your time with a lot of engineering effort if your application never achieves [Product-Market Fit](https://en.wikipedia.org/wiki/Product/market_fit). The minimum level of investment is to make sure your system is theoretically scalable. 

What do I mean by that? Ultimately, you need to be able to scale your application's backend services [horizontally](https://en.wikipedia.org/wiki/Scalability#Horizontal_or_scale_out). You may not need to do it soon, but if your application is a raging success, you will need to do it eventually. In order to scale horizontally, data needs to be [sharded](https://aws.amazon.com/what-is/database-sharding/) across multiple servers. 

Whether you eventually implement sharding at the application level, or rely on a cloud database with built-in support for sharding, you will need to decide what property of the data you're going to shard on. Every API call you make will need to specify a shard key so that the backend knows which shard to route the request to. A common choice for a multi-tenant system is to shard on the tenant id. 

{% capture note %}
* You SHOULD understand how your data model can be sharded
{% endcapture %}
{% include candid-note.html content=note %}

A system is theoretically scalable if you could implement sharding without having to change your API. That implies that you've thought about how to shard your data model and designed your API so that each call naturally includes a shard key. If you're following these rules, you already have an API with explicit tenant ids included in each call. If you have natural limits on the size of a tenant, that may be all you need.

{% capture note %}
* Every API call SHOULD include a value that could be used as a shard key
{% endcapture %}
{% include candid-note.html content=note %}

I've worked with a few services that weren't theoretically scalable. Retro-fitting scalability was a massive challenge that required a radical rethink, not just in the unscalable service itself, but in every other service that depends on it. 

## 5. Right to Delete

Never forget that you're dealing with somebody else's data. If they want to permanently delete something they've stored in your system, they should be able to do it.

{% capture note %}
* Customers MUST be able to permanently delete all their data on request
{% endcapture %}
{% include candid-note.html content=note %}

Too obvious?

The first cloud applications I worked on had no ability to delete a tenant. Product Management considered it unimportant. "Let's focus on getting customer data into the system". Customers who didn't renew would lose access to the system, but their data stayed in place. "It's a feature", said Product Management. "If the customer changes their mind, they'll be delighted that their old data is still there". 

There was a massive fire drill when [GDPR](https://en.wikipedia.org/wiki/General_Data_Protection_Regulation) and similar data regulations were introduced around the world. As always, retro-fitting a fundamental capability is far more work than including it in the first place. Fortunately, GDPR gives you 90 days to complete the deletion process. There were some uncomfortable moments where we had to manually delete data before the automated delete was implemented. 

{% capture note %}
* Permanent deletes MUST complete within 90 days
{% endcapture %}
{% include candid-note.html content=note %}

Problem solved? Not quite. Customers now had the option to delete all of their data. However, they couldn't permanently delete anything finer grained, like a project or an individual file. There was delete functionality in the product, but it was implemented as a [soft delete](https://en.wiktionary.org/wiki/soft_deletion). 

Soft deletes have a lot of benefits. Data can be recovered if the user made a mistake. Your product can act as a "system of record", which maintains a complete history of all changes. You don't have to unravel a complex web of data dependencies to maintain data consistency.

Which is all fine until a customer gets in touch because someone accidentally uploaded a "sensitive" document. Yes, we do understand the benefits of your "system of record", but we really need all trace of this file and its content removed. NOW. 

{% capture note %}
* Customers SHOULD be able to permanently delete individual items of data
{% endcapture %}
{% include candid-note.html content=note %}

## 6. Data Portability

I've talked before about the difference between [Tools and Solutions]({% link _posts/2023-01-03-tools-vs-solutions.md %}). The cloud applications I worked on are very much in the *Solutions* category. The intention was to provide everything that the customer would need to manage a construction project. From project inception to final close out, we would handle it all. 

Clearly, if you're the solution that the whole world revolves around, you're not that interested in providing the ability to transfer data out into other systems. If all data will be directly created in your system, you're not that interested in supporting bulk transfer-in either. 

Of course, in the real world, every customer had their own processes and ways of doing things. They had existing software that worked well for some of those processes, which they had no intention of giving up. To them, our solution was another *Tool* that needed to fit in with what they already had.

Sometimes, Product Managers worry that supporting [Data Portability](https://en.wikipedia.org/wiki/Data_portability) will make it too easy for customers to leave. They want the product to be *sticky*. To my mind, this is completely backward. Data Portability removes customer concerns about getting their data stuck in proprietary silos. It makes it more likely that they will adopt your product. Data Portability allows them to embed your product into their existing processes. That's what really makes a product sticky. It works too well to give up.

Over time we kept running into problems that would have been solved by Data Portability. At this point, building a general tool for Data Portability was too difficult. Instead, we ended up with a collection of partial, yet overlapping, solutions to specific problems. 

Data needs to be handed over to the building owner? Build a handover feature. Multiple stakeholders on large projects want to own their data? Give them their own tenants and build a workflow to exchange data between them. Large customers need to extract data from multiple projects to analyze trends? Build a special case data extraction feature. We need to [kill off one of the old products]({% link _posts/2022-11-21-organizational-anti-pattern-old-new-thing.md %})? Build a one off archiving system so customers don't lose their data.

Instead, consider data portability as a fundamental system capability. A comprehensive API is a good starting point. Make sure that you provide an efficient way of synchronizing data. When integrating with other systems, you need to be able to find out what changed since the last time you synchronized. Build a generalized import/export system on top of the API which lets you export to and import from a neutral open format. 

{% capture note %}
* Your API SHOULD support efficient synchronization of data
* Your system SHOULD support import/export with an open neutral format
{% endcapture %}
{% include candid-note.html content=note %}

Now you have the tools to solve your original problems and many more besides. Customer wants to transfer ownership of a project from one tenant to another? Export the data from one and import into another. Customer worried about the implications of [data sovereignty](https://en.wikipedia.org/wiki/Data_sovereignty) requirements? Remove the FUD. The customer can start using one of your existing environments and if needed transfer the data later on. Is your sharding by tenant getting unbalanced? Now you have a way of transferring a tenant from one shard to another. Need to comply with [GDPR data portability](https://gdpr-info.eu/art-20-gdpr/) requirements? Don't worry, you're already covered.

## 7. Cost

Do you understand how much it costs to run your system? Do you know how well your costs correlate with your business model? Do you know which tenants are making you money and which are losing it?

In the rush to iterate from an initial MVP and establish Product-Market fit, cost is usually ignored. You'll probably try and discard a whole range of different business models. At this point you're trying to find something that gets customers onboard. How this month's business model compares to your AWS costs is irrelevant. 

As you gain traction in the market and slowly make progress, it can be hard to start paying attention to cost again. You really should. It's surprisingly easy to end up in a position where the more usage your product gets, the more money you lose. 

Let's start with the simple stuff. Are you bringing in more revenue than you're paying out in costs? In a startup, everyone is aware of the current [burn rate](https://en.wikipedia.org/wiki/Burn_rate), there's good visibility of the pipeline of customer costs and an easy to understand monthly AWS bill. 

As ever, it's different in a large company. In my early days working on cloud applications, the engineering and product management teams had no clue what our costs were. The AWS bill for the entire company was handled by the mysteries of the finance department. Even if we had visibility of the number, there was no way to work out what the costs of our product were. It took many years before the company worked out how to use multiple AWS accounts and cost allocation tags to give each team insight into their costs.

Without insight into costs, engineering teams will choose the easiest implementation, product management will ask for the most complete feature set and UX will drive for the most delightful user experience. All without knowing whether the value the user is willing to pay for, will cover the costs.

{% capture note %}
* Engineering and Product teams SHOULD have visibility of their costs
{% endcapture %}
{% include candid-note.html content=note %}

Customers, understandably, like business models that make it easy to predict how much they'll pay. Easy to get started, only *$X per user per month*. Want predictable costs for your large project? We'll charge you *0.0X% of your project's value*. 

The problem, of course, is that your costs are only loosely correlated with your revenue. How much time will each user spend in the product? How much data will the project store? How often will the customer run the incredibly expensive machine learning model?

You will find that the revenue:cost ratio varies wildly between different tenants, and not all will be profitable. Ironically, your best customers, the ones that you write case studies about, that evangelize your product within the industry, are the ones that are losing you money. They're being subsidized by the customers that failed to adopt the product or are only just starting out. 

Using newcomers to subsidize existing customers is one of the characteristics of a [Ponzi scheme](https://en.wikipedia.org/wiki/Ponzi_scheme). As the market matures, and fewer customers are newcomers, you start losing money overall. Of course, you can dramatically raise your prices. However, customer expectations have been set, so expect push back, bad publicity and a bonus for your competitors. 

With a big enough mismatch between business model and costs, things can spiral out of control very quickly. We had one customer that needed to synchronize data with another system. We didn't have a great API and it certainly didn't include any way to efficiently synchronize data. So they wrote something that extracted all the data in their very large project. And then ran it continuously. The following month's AWS bill was an eye opener. Product Management had a difficult conversation with the customer and we had to introduce quotas and rate limits for API use.

{% capture note %}
* You SHOULD use fair usage limits to mitigate mismaches between business model and costs, and set appropriate expectations with customers
{% endcapture %}
{% include candid-note.html content=note %}

The biggest mismatch comes with free trials. We used to offer a free month's trial for one product with automated sign up. The product included a file store with the ability to create public, shareable links to content that you had uploaded. After a few months there was a sudden explosion in free trial sign ups, and a big spike in our AWS bills. No, this wasn't a triumph for the marketing department. Our free trial accounts were being used to host and share pirated material.

{% capture note %}
* You SHOULD enforce additional limits to prevent abuse of free trials
{% endcapture %}
{% include candid-note.html content=note %}

Total worldwide cloud storage is [growing exponentially](https://www.statista.com/statistics/871513/worldwide-data-created/). There's a simple reason for that. Unless they're sufficiently incentivized, nobody deletes anything. That's a ticking time bomb if you don't pay attention to it. 

{% include candid-image.html src="/assets/images/revenue-storage-cost-cloud.svg" alt="Fixed revenue vs ever increasing storage" %}

Here's a ludicrously simple cost model to illustrate the point. We have a typical customer providing steady revenue. They have a fixed size team working on projects that they manage using our product. When they started out, we were making a good profit. Now, without them changing anything about the way they work, we're making a loss. 

When they complete a project, they keep it as an archive, in case they ever need to refer back to it. Our storage costs start out very low but just keep growing. Our compute costs are almost flat, but are also growing due to the need to index and search across all the stored data.

You need to provide suitable incentives to keep storage costs under control. That could be as crude as enforcing a limit on the amount of storage available. It's a good job you have a general export function so customers can archive data themselves. Alternatively, you could understand and support the customer's full data lifecycle. If they consider projects archived when complete, support that in the product. Archived projects can be moved to lower cost, infrequent access storage. Maybe you remove them from the default list of projects and search results. Does your customer have a records retention policy? We'd be happy to notify you when it's time to delete old archived projects.

{% capture note %}
* You SHOULD have a plan to keep storage costs under control
{% endcapture %}
{% include candid-note.html content=note %}

## Footnotes
