---
title: Modern SaaS Architecture
---

Last time we looked at the [evolution of multi-tenant architectures]({% link _posts/2022-11-07-evolution-multi-tenant-architecture.md %}). So, what does the architecture of a modern multi-tenant SaaS product look like? Well, for a start, its a [microservice architecture](https://martinfowler.com/microservices/) deployed on one of the big three cloud providers (most commonly AWS).

# A Microservice

Let's take a closer look at an individual microservice.

{% include candid-image.html src="/assets/images/micro-service-architecture.svg" alt="Microservice Architecture" %}

In general, they all follow the same pattern. Incoming requests are handled by a load balancer managed by the cloud provider. The load balancer distributes the requests over a fleet of app servers. Depending on the type of request the app server may read and return data from a cache or database, update the database or add a job to a queue for later processing. A fleet of workers reads jobs from the queue and executes them. Jobs are typically complex multi-step operations that may involve interacting with the database, updating the cache, making requests to upstream services and raising events. Workers may also need to react to events raised by other services.

Any microservice that manages customer data needs to implement multi-tenancy. Every row in the database and cache has a tenant identifier. Every incoming request, job in the queue and event raised needs to include a tenant id. App server and worker logic must be carefully written to ensure that requests only have access to data for the corresponding tenant. Systems need to be managed and scaled to ensure that activity from one tenant can't impact the availability of another tenant. 

You need to manage different classes of activity separately to ensure predictable and reliable operation. The most important thing is to separate interactive traffic (handled by the app servers) from batch operations (handled by the workers). Most microservices use [REST APIs](https://aws.amazon.com/what-is/restful-api/) with a synchronous request-response interaction which needs [low overall and tail latency](https://brooker.co.za/blog/2021/04/19/latency.html). You need great care to ensure that each individual request uses a bounded amount of both memory and CPU, and that you can scale up the number of app servers before they become overwhelmed under heavy load.

Microservice architectures are a [solution to an organizational problem](https://martinfowler.com/bliki/MicroservicePremium.html). How do you enable multiple teams to collaborate on a SaaS product without them getting in each other's way? How can you provide incremental value without the bottleneck of coordinating a big release with multiple teams? With microservices each team owns their own service(s) and is responsible for architecture, deployment, monitoring and scaling. Each team can make the best choice for their own service. 

The downside of Microservices is that each team makes their own choices. Humans being what they are, teams will tend to make different choices from each other. Different language stacks (Java, .Net, Python, Ruby, NodeJS, GoLang, Scala, Rust, C++, ...) with different choices for libraries and frameworks. Different choices for databases, caches, queues and compute platforms. Different choices for deployment and monitoring. Different choices for API standards, consistency models and error handling. 

# Cloud Platform

How do microservices make use of the cloud provider's platform? Teams make choices as to which platform to use for each box in the diagram. I'm going to use AWS for my examples as that's the provider I'm most familiar with. Other providers have their own equivalents.

* Load Balancer - Classic, Network or Application?
* App Server - EC2 instance, Container (ECS, EKS, or Fargate), or Lambda?
* Database - Relational (Postgres, MySQL, SQL Server or Oracle, RDS or Aurora), Key-Value (DynamoDB), DocumentDB, Column Oriented (Redshift), Graph (Neptune) or Time Series (TimeStream)?
* Cache - MemoryDB for Redis, Elasticache Redis, Elasticache Memcache, or DAX (DynamoDB only)?
* Queue - SQS, Kinesis, Amazon MQ?
* Workers - EC2 instance, Container, Lambda, AWS Step Functions, SWF, AWS Batch?
* Event Bus - SNS, EventBridge, Amazon MQ?
* Blob Storage - S3
* CDN - CloudFront

Each microservice has its own AWS account (the AWS equivalent of a tenant) and a VPC if deploying any servers. Teams can configure per account limits to match the needs of their services. Its important that each service have its own account in order to prevent noisy neighbor issues between services. 

# The Big Picture

Put it all together and what do you get?

{% include candid-image.html src="/assets/images/sass-architecture.svg" alt="SaaS Architecture" %}

A large organization can have 100s of microservices in total. A single product can easily end up with dependencies on 50 or more microservices. 

There are three broad classes of service. First and most importantly are those that manage customer data (shown in red). Most of these take the form of feature services which provide the backend for a particular product feature. Typically there is a corresponding front end UI for each feature managed using a [micro-frontends architecture](https://martinfowler.com/articles/micro-frontends.html).

Once you've distributed customer data across multiple feature services you need some way to aggregate it all together again for analytics, reporting and ML training. You asynchronously replicate all the data into a data lake and make it available to downstream analysis services.

Some features need specialized blob storage for data like files and images. Cloud providers have optimized routes for upload and download using their CDN to avoid having to stream the data through the app servers.

The next class of services is the platform services (shown in blue). These provide common functionality shared between the feature services. They include admin related services that manage customer accounts, fulfill the creation of tenants, manage licensing and track usage. The admin services need to interface with your organization's back office systems (shown in purple) which involves the painful job of interacting with the IT and finance departments.

# Data Sovereignty 

# A Modest Proposal

SaaS company implements multi-tenant architecture using PaaS from one of the big cloud providers. PaaS platform uses sophisticated virtualization techniques to support multiple SaaS companies. We have multi-tenant at application level on multi-tenant at the PaaS level.

Time for pendulum to swing again? Customers go direct to cloud provider and create an environment to run serverless open source software. Pay only for what you use. 
