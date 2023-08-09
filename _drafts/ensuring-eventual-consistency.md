---
title: Ensuring Eventual Consistency
tags: cloud-architecture
---

Remember how we used to build web apps? A database, some app servers and a load balancer. What we'd disparagingly call a [Monolith](https://en.wikipedia.org/wiki/Monolithic_application) today. 

{% include candid-image.html src="/assets/images/monolith-architecture.png" alt="Monolith Architecture" %}

Maintaining consistent state is really easy. All your data is in one place. Design a [good schema with appropriate constraints]({% link _posts/2023-03-27-navisworks-graphics-pipeline.md %}). Wrap updates in a transaction. The data is always consistent, operations either happen completely or not at all. Expose access via a simple REST API. A request comes in, you hit the database, return a response when the database is done. 

Unfortunately, things rarely stay so simple. What starts out as a simple monolith soon becomes a complex monolith with lots of additional state bolted onto the side. What was a complex monolith gets split up into multiple microservices, with application state distributed between them. What was a simple microservice becomes a complex micro-service with lots of additional state bolted onto the side. 

{% include candid-image.html src="/assets/images/complex-monolith-architecture.png" alt="Complex Monolith or Microservice Architecture" %}

Maybe you've added a cache, or are storing blobs of data in S3. Perhaps you need to interact with a third party service or a downstream microservice. You may need a subsystem to manage long running background jobs. Now when a request comes in, you may have to update the database, write part of the incoming data to S3, start a background job, notify a downstream service and update the cache. 

The database is still the main source of truth but you have all these side effects that need to happen as well. How do you make sure all the things that need to happen *actually* happen? How do you ensure that all that distributed state is eventually consistent?

## Keep It Simple Stupid

The approach that everyone starts with is to add the logic needed to the request handler in your app server. Don't think about it too much, add the code where it's convenient. Mix database updates and side effects. Wrap the whole thing in a transaction so the database update is atomic and consistent. Simple, quick to write, easy to understand and maintain. Works most of the time.

1. Start database transaction
2. Update metadata in database
3. Write data blob to S3
4. Call downstream service that needs to know about update
5. Write response from downstream service to our database
6. Create a background job to process data
7. Update cache
8. End Transaction

Error handling tends to be piecemeal and ad hoc. What happens if the downstream service returns an error (even after a few retries)? Abort the transaction? What about that blob of data we wrote into S3? I guess we should try and delete it. What if that fails?

{% capture note %}
> Everything fails

<sup>Werner Vogels, CTO, AWS</sup>
{% endcapture %}
{% include candid-note.html content=note %}

One of the first web apps I worked with was built this way. It was a complex monolith with a ton of features, including a file store. There was this weird bug where the app showed that a file existed but when the user tried to download the content, the data wasn't there. Everyone was pulling their hair out, trying to work out how blobs of data could just vanish.

The sequence of events was pretty simple. A user would attempt to delete a file. Everything worked until the final step of committing the database transaction. There was some conflict and the transaction failed. The database rolled back the deletion of the file metadata. Unfortunately, there was nothing to rollback the side effect that deleted the separately stored file content. 

## Side Effects Come Last

Once you've played whack-a-mole a few times, you'll try to add some more structure. Another app that I worked with had a custom app framework that everyone used. You could write your business logic in a familiar ad hoc style, mixing database updates and side effects. The framework didn't perform the side effects immediately, instead it queued them up. If the database transaction completed successfully, it would trigger all the side effects. If the transaction failed, the side effects were discarded.

What if the downstream service we need to call as a side effect is down? The framework included a background job system. Any side effect that was potentially long running or might need to cope with an external outage could be specified to run as a background job. 

Problem solved, right? Not quite. There's a small window of vulnerability between completing the database transaction and triggering the side effects. What happens if the app server dies in between? What happens if the background job system is unavailable?

Sounds pretty unlikely. If we have good logging and monitoring we can spot the rare cases when something goes wrong and fix things up manually. Which is workable, pragmatic even. Until you start to scale the system up.

{% capture note %}
> Everything fails, all the time

<sup>Werner Vogels, CTO, AWS</sup>
{% endcapture %}
{% include candid-note.html content=note %}

When you scale up, rare failures become common. What was exceptional, is now normal. Part of the day to day. Any lurking edge cases that you’ve ignored or deal with manually will become intolerable until you fix them properly.

Another app I worked with reduced the window of vulnerability to the bare minimum. They used a separate, highly resilient workflow system to run all the side effect logic. They used a highly available, resilient queue to connect the app servers and the workflow system. Once the database transaction successfully completed all the app server had to do was add a message to the queue. Worked great during development, internal and beta testing.

The app was popular. We onboarded hundreds of customers, some with hundreds of users. Customer complaints increased. Varied reports but all with a similar root cause. The database had been updated but the side effect workflow hadn't run. 

What went wrong? Everything. Turns out that app servers will occasionally crash at the most inconvenient moment. The highly available queue was also highly complex. There were bugs in the language library used by the app server to add messages to the queue, other bugs in the different language library used by the workflow system to read messages from the queue. Fundamental misunderstandings of the contract between queue and client that in theory assured high availability and resilience. Outages in the queueing service itself. 

Even worse, there was no easy way to detect which workflows hadn't run. There was no difference in the database between a transaction whose side effects completed and one that didn't. In many cases you couldn't work out what side effects needed to be run from what changed in the database. You would have to scan through every record in the database performing a cross-service join to check that everything was consistent. Or, just wait for your customers to report problems and fix them reactively. 

## Eventual Consistency

There was another problem even when the system worked as designed. The side effects would run and eventually things would be consistent. Unfortunately, the UX designers on the product didn't understand the implications of eventual consistency. They were used to desktop applications and simple monoliths where changes effectively happen instantly and consistently. 

There was no provision in the UX for inconsistent state. You couldn't see whether workflows were still running or what the state of progress was. When workflows were partially complete, the app would often behave ... poorly. 

{% capture note %}
> You allow things to be inconsistent and then you find ways to compensate for mistakes, versus trying to prevent mistakes altogether.

<sup>Eric Brewer, VP Infrastructure, Google (Author of CAP theorem)</sup>
{% endcapture %}
{% include candid-note.html content=note %}

There is no strict consistency in the real world. You often see the motivating example of a bank transfer as the reason why strict consistency is needed. That's not how it works in the real world. The financial system is not based on consistency, it’s based on auditing and compensation. The money gets added to one account before it gets removed from another. If the check bounces, they take the money back.

## The Single Write Principle