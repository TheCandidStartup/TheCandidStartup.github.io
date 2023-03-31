---
title: Amortized Cost and the Cloud
tags: cloud-architecture
---

I first came across the concept of [amortized cost](https://en.wikipedia.org/wiki/Amortized_analysis) when I learnt about the [vector](https://cplusplus.com/reference/vector/vector/) class in [C++](https://en.wikipedia.org/wiki/C%2B%2B). At that point I was largely a self-taught programmer without much in the way of theoretical foundation. I was used to using [linked lists](https://en.wikipedia.org/wiki/Linked_list) and understood that the cost of adding a new element was constant, regardless of the size of the list. Vectors seemed like witchcraft to me. 

A vector is basically an array that dynamically changes size as you add elements to it. How can that possibly be efficient? To increase the size of an array, you have to allocate a new block of memory and copy all the elements from the old block. If you do that every time you add an element, the cost will be ridiculous. 

The trick, of course, is that you don't resize the array every time you add an element. Instead you over allocate the size of the array and whenever you do fill it, you allocate a new array double the size. 

{% include candid-image.html src="/assets/images/amortized-cost-vector.svg" alt="Amortized Cost for Linked List vs Vector" %}

Linked lists have a fixed cost for every element added. The cost is relatively high as you need to allocate a new block of memory for each element. The cost to add *n* elements is *O(n)*.

When using a vector, most of the time the cost of adding a new element is very low. No need to allocate more memory - just copy the value into the array and increment the size. For those sizes where the array is full, the cost is much higher, and doubles every time you do it. However, the number of elements added between each reallocation is also doubling. If you average the costs out, the average cost per element is always lower than the linked list, regardless of size. The **amortized cost** to add *n* elements is *O(n)*.

Amortized cost algorithms usually require more memory than fixed cost algorithms. In the case of the vector, up to twice as much memory as the linked list[^1]. You can trade off compute cost against memory use. A vector has *O(n)* amortized cost as long as the array size increases by a constant factor. If you increase the size 1.5 times rather than doubling it, you use less memory at the cost of reallocating more often. Conversely, you can reduce the number of times you reallocate by more than doubling each time. 

[^1]: Linked lists have a fixed amount of memory overhead per element (next/prev pointers, memory allocation costs). For small elements, the overall memory used by a vector can be less than a linked list. As element size grows larger, the linked list fixed overhead becomes insignificant, and worst case memory use for the vector (immediately after a reallocation) approaches twice as much. 

## Garbage Collection

[Garbage Collection](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)) is an amortized cost algorithm for memory management. Rather than making explicit calls to the memory management system to return memory that is no longer needed, a garbage collection system automatically identifies memory that is no longer referenced.

Explicit memory management has a small fixed cost for each allocation and deallocation of a block of memory. Garbage collection has a small fixed cost for allocation (usually smaller than for explicit memory management) together with no direct cost for deallocation when memory is no longer needed. In exchange there is a periodic, asynchronous, very large cost to collect unreferenced memory so that it can be reused. 

The benefits of garbage collection are programmer convenience, greater safety (no reuse after free errors or forgetting to free memory), and enabling use of dynamic languages. Most people believe that garbage collection is inherently higher cost than manual memory management. However, the same trade offs are available as we saw with the vector. 

For most garbage collection algorithms, the costs are proportional to the amount of memory in use, not the amount of garbage. The more memory you have available, the longer you can leave it before triggering garbage collection and the less it costs for each memory block reclaimed. In fact, if you have enough memory available, you can [reduce the costs to an arbitrarily low level](https://www.cs.princeton.edu/~appel/papers/45.pdf), less than a single machine instruction per block. 

In the real world, garbage collectors are tuned to minimize the amount of memory needed and to spread the cost with more frequent, lower impact garbage collection phases.

## Tail Latency

You may be wondering what relevance all this has for [cloud architecture]({% link _topics/cloud-architecture.md %}). Amortized cost algorithms work because they amortize the uneven costs of individual operations across an overall computation. If you're adding 1000 items to a vector, it doesn't matter that adding the 513th item costs much more than adding the 514th, as long as the overall cost is acceptable. Similarly, it doesn't matter if your computation is occasionally paused while garbage collection happens, as long as the overall cost of computation plus garbage collection is acceptable. 

In the cloud, the primary unit of computation is a [request to a microservice]({% link _posts/2022-11-28-modern-saas-architecture.md %}). The main metric we use to understand the performance and health of a service is request latency. How long does it take to get a response to our request (if we get one at all)? 

Typically, the amount of work done by a request is too small to amortize costs across. An in-memory database using a vector like container will add an element per request. An app server using a garbage collected language stack will process many requests between each garbage collection cycle. The end result is that a small number of requests will have a much higher latency than the others. They're the requests that triggered a reallocation in the database. They're the requests waiting for the garbage collector to complete before they can be processed by the app server.

{% include candid-image.html src="/assets/images/request-latency-distribution.svg" alt="Request latency distribution" %}

The distribution of response times for a typical service will look something like this. It starts off looking like a [normal distribution](https://en.wikipedia.org/wiki/Normal_distribution) but is skewed to the right with a [long tail](https://en.wikipedia.org/wiki/Long_tail). The [measured distribution](https://newrelic.com/blog/best-practices/expected-distributions-website-response-times) for a real service will be noisier and may have multiple peaks if there are multiple types of request with different behaviors.

When monitoring a service, teams will typically use [percentile](https://en.wikipedia.org/wiki/Percentile) metrics to help them understand what is happening in the tail. For example, a P99 metric is the response time which 99% of requests fall below. Only 1 in a 100 requests have a higher response time. Why do teams care about the odd high latency request?

It turns out that there are lots of reasons why tail latency is important. First, tail latency is a [canary in the coal mine](https://en.wiktionary.org/wiki/canary_in_a_coal_mine). An increase in tail latency can be an early warning sign that the system is approaching capacity. A small increase in load may tip the system over the edge.

Second, systems involve more than a single request to a single microservice. Clients may make multiple requests in parallel to one or more services. The time to complete the overall operation is that of the slowest request. If you make 100 requests in parallel, the [majority of operations will be limited by the P99 response time](http://highscalability.com/blog/2012/3/12/google-taming-the-long-latency-tail-when-more-machines-equal.html). This isn't just a theoretical problem. If you look at [load times for typical web pages](https://bravenewgeek.com/everything-you-know-about-latency-is-wrong/), they are almost all constrained by the P99 response time. The [more you scale systems up](https://cacm.acm.org/magazines/2013/2/160173-the-tail-at-scale/abstract) and rely on more parallelism, the worse this effect gets. You then need to care about P99.9 or even beyond.

In a [microservice architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}), it's common for one microservice to call another, leading to chains of calls in series. The overall response time is the sum of all the calls. Again, tail latency has a [disproportionate impact](https://brooker.co.za/blog/2021/04/19/latency.html) on the behavior of the entire system. In addition, the longer an intermediate service is waiting for a response, the more resources are tied up. If 1% of requests are severely delayed, it can [double the resources needed](https://robertovitillo.com/why-you-should-measure-tail-latencies/) to manage those requests.

Finally, there's the impact on the human using the client. Humans are [very sensitive to long latency](https://www.section.io/blog/preventing-long-tail-latency/) (anything over 100ms). The ninety-nine times when everything works as expected aren't memorable, the one time when there's a pause stands out. 

Amortized cost algorithms increase tail latency. Mitigating this effect requires more complex implementations that increase overall latency, or accepting lower utilization of CPU and memory, or both. Increasingly, those operating at high scale are looking at [replacing amortized cost algorithms with fixed cost alternatives](https://aws.amazon.com/blogs/opensource/sustainability-with-rust/).

## Pain Points

Let's have a closer look at a typical microservice. Where does tail latency really matter?

{% include candid-image.html src="/assets/images/micro-service-architecture.svg" alt="Microservice Architecture" %}

Tail latency matters most for anything on the synchronous client request handling path. Requests are routed to an app sever via a load balancer, the app server might look something up in a cache, query a database, perhaps add a job to a queue to be processed later. Your cloud provider will have obvious off the shelf choices for load balancers, queues and caches. Your biggest impact will be the choices you make around app servers and databases.

The most important thing is to do as little as possible in the app servers. Offload as much work as possible to jobs that can run asynchronously. Ideally all interactions with other services would happen here. [Domain Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html) and the idea of [Bounded Contexts](https://martinfowler.com/bliki/BoundedContext.html) provide useful tools that help structure microservices to work in this way. Removing interactions with other services from the synchronous path reduces the magnifying effect of tail latency. 

Once all the complex business logic is moved into workers, it becomes less daunting to rewrite the app server using a higher performance language stack. These days all the cool kids seem to be [switching to Rust](https://aws.amazon.com/blogs/opensource/sustainability-with-rust/).

That leaves the database. You will almost certainly use something managed by your cloud provider, but there are so many to choose from. [AWS offers 17 different managed databases](https://aws.amazon.com/products/databases/) (including 2 distinct flavors of Aurora, 5 of RDS and 2 of ElastiCache).

Databases are complex, highly optimized systems that almost inevitably involve amortized cost algorithms. These can include reclaiming free space, restructuring stored data for more efficient querying, rebuilding indexes, creating snapshots, running backups and many more. Much of this work is setup to happen asynchronously in separate threads or processes. However, for most of those AWS database choices, those processes run on the same instances that handle the core synchronous request path. 

Most databases are designed to be infrastructure agnostic. They run on a dedicated instance, or cluster of dedicated instances. You can run them on-premises, in the cloud or on your development laptop. That flexibility drives designs that use homogenous instances that do everything. Even [Aurora](https://aws.amazon.com/rds/aurora/), with its born in the cloud storage layer, runs all the Postgres and MySQL business logic on a per tenant set of dedicated instances. 

It takes careful configuration, monitoring and tuning to minimize contention between amortized cost background processes and request handling. Does every service team have access to a database expert with the time to do that? I've heard tales of woe from far too many teams that have been forced to learn more than they ever thought they'd need about the [Postgres VACCUM](https://www.postgresql.org/docs/current/sql-vacuum.html) process. Unfortunately, usually in the aftermath of an incident. 

## Serverless

The only general purpose AWS database that avoids these problems is, coincidentally, the only [truly serverless]({% link _posts/2022-12-05-serverless-or-not.md %}) general purpose AWS database. [DynamoDB](https://aws.amazon.com/dynamodb/) was built from the ground up to run in a cloud environment. DynamoDB is a massive multi-tenant system. Massive multi-tenant systems [smooth out the overall load](https://brooker.co.za/blog/2023/03/23/economics.html) as there is little correlation between tenants. There are no per customer dedicated instances. 

DynamoDB is itself implemented as a set of microservices with specialized instances used for different internal operations. It's far easier to isolate background processes from the synchronous client request path. A huge amount of work has gone into ensuring that DynamoDB delivers [consistent performance with consistent low latency](https://www.alexdebrie.com/posts/dynamodb-paper/).

You don't have to operate at Amazon's scale to get the same benefits yourself. One of the less frequently mentioned advantages of using serverless compute like [Lambda](), is the increased level of isolation. Each Lambda invocation runs in a dedicated micro-VM. That avoids noisy neighbor issues where there is contention for resources between different requests processed simultaneously on the same instance. It's easy to break your service into separate Lambda functions which are deployed and scaled independently. You can choose the most appropriate language stack on a per function rather than per instance basis. 

As it happens, I'm working on a [serverless project]({% link _posts/2023-01-09-spreadsheets-future-data-systems.md %}) which will rely heavily on [amortized cost algorithms for data management]({% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}). I'll let you know how well it works out in practice.

## Footnotes

