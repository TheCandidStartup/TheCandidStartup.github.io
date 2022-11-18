---
title: Modern SaaS Architecture
---

Last time we looked at the [evolution of multi-tenant architectures]({% link _posts/2022-11-07-evolution-multi-tenant-architecture.md %}). So, what does the architecture of a modern multi-tenant SaaS product look like? Well, for a start, its a micro-service architecture deployed on one of the big three cloud providers, usually AWS.

Let's take a closer look at an individual micro-service.

{% include candid-image.html src="/assets/images/micro-service-architecture.svg" alt="Micro-service Architecture" %}

In general, they all follow the same pattern. Incoming requests are handled by a load balancer managed by the cloud provider. The load balancer distributes the requests over a fleet of app servers. Depending on the type of request the app server may read and return data from a cache or database, update the database or add a job to a queue for later processing. A fleet of workers reads jobs from the queue and executes them. Jobs are typically complex multi-step operations that may involve interacting with the database, updating the cache, making requests to downstream services and raising events. Workers may also need to react to events raised by other services.

{% include candid-image.html src="/assets/images/sass-architecture.svg" alt="SaaS Architecture" %}

SaaS company implements multi-tenant architecture using PaaS from one of the big cloud providers. PaaS platform uses sophisticated virtualization techniques to support multiple SaaS companies. We have multi-tenant at application level on multi-tenant at the PaaS level.

Time for pendulum to swing again? Customers go direct to cloud provider and create an environment to run serverless open source software. Pay only for what you use. 

