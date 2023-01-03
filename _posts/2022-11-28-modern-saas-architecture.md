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
* File Storage - S3, EBS, EFS?
* CDN - CloudFront, Third party?

Each microservice has its own AWS account (the AWS equivalent of a tenant) and a VPC if deploying any servers. Teams can configure per account limits to match the needs of their services. It's important that each service has its own account in order to prevent noisy neighbor issues between services. 

# The Big Picture

Put it all together and what do you get?

{% include candid-image.html src="/assets/images/sass-architecture.svg" alt="SaaS Architecture" %}

A large organization can have 100s of microservices in total. A single product can easily end up with dependencies on 50 or more microservices. 

There are three broad classes of service. First and most important are those that manage customer data (shown in red). Most of these take the form of feature services which provide the backend for a particular product feature. Typically there is a corresponding front end UI for each feature managed using a [micro-frontends architecture](https://martinfowler.com/articles/micro-frontends.html). Typically external requests come via an [API gateway](https://www.techtarget.com/whatis/definition/API-gateway-application-programming-interface-gateway) which handles authorization and rate limiting. Similarly the micro-frontends are accessed via a [CDN](https://en.wikipedia.org/wiki/Content_delivery_network).

Once you've distributed customer data across multiple feature services you need some way to aggregate it all together again for analytics, reporting and ML training. You asynchronously replicate all the data into a data lake and make it available to downstream analysis services.

Some features need specialized blob storage for data like files and images. Cloud providers have optimized routes for upload and download using their CDN to avoid having to stream the data through the app servers.

The next class of services is the platform services (shown in blue). These provide common functionality shared between the feature services. They include admin related services that manage user identity, customer accounts, fulfill the creation of tenants, manage licensing and track usage. The admin services need to interface with your organization's back office systems (shown in purple) which involves the painful job of interacting with the IT and finance departments.

Not shown on the diagram is the inevitable spiders web of dependencies between the services, some intentional, some "emergent" and surprising.

When you add up all the infrastructure required across all the microservices, you end up with a massive deployment footprint with all the management complexity that implies. You also end up with a large fixed cost per environment. That reinforces the need for a multi-tenant application - you need to share the cost between your customers.

The system evolves over time. You start out with a few services and add more as you roll out new features. While service deployments are automated, the initial infrastructure setup is typically done manually, as is the authorization configuration for calls between dependant services. After all, its something you only need to do once, right?

# Data Sovereignty 

In the early days of web applications, the biggest problem for vendors was persuading customers to trust them with their data. Customers didn't know much about the cloud so the only question was whether they trusted the vendor.

These days customers are more sophisticated. Larger customers run their own internal applications on cloud provider infrastructure. Governments have got involved and started regulating on data access and residency. Increasingly customers want a say in where their data is stored and how it is managed. Customers may have a preferred cloud provider they want you to use. They may want direct access to the data from their own applications. They have strong requirements about which country their data is stored in.

The solution is simple in principle. Spin up additional environments in different regions and with different cloud providers. Easier said than done. Remember the mind boggling complexity of your deployment infrastructure, the manual setup process? Think about the cross-team coordination required, the need to monitor multiple production environments, above all the additional fixed costs for every environment you spin up. 

You need a huge investment in standardization and automation to do it right. You need enough customers per environment to cover the costs. Not surprisingly, many vendors find ways to cut corners, doing just enough to assuage customer's buying objections. You may promise customers that their ["data at rest" is stored locally](https://knowledge.autodesk.com/support/docs/learn-explore/caas/CloudHelp/cloudhelp/ENU/Docs-About-ACC/files/Europe-Data-Center-FAQ-html.html) (while leaving you free to send it elsewhere for processing), or that their [files are stored in a specified country](https://support.procore.com/faq/where-and-how-does-procore-store-customer-information) (allowing you to run a single production environment with multiple S3 buckets).

# A Modest Proposal

At one point in my career a large customer asked if we could deploy our SaaS product into their AWS account. How we laughed at their naivety. Since then I've been thinking, was that really such an unreasonable request?

I want to build an open source SaaS product of some sort. Open source and hosted SaaS applications have always seemed an unnatural combination to me. Is it really open source when there's no realistic way for a customer to change anything? And do I really want to operate a SaaS product myself? Be on call 24x7?

Wouldn't it make more sense to build an open source SaaS product that a customer can deploy themselves into their own AWS account? Doesn't it seem odd that cloud providers have implemented incredibly good multi-tenant infrastructure with hardware enforced isolation and then SaaS vendors come along and build their own half-assed multi-tenancy on top? If each customer has their own AWS account I don't need to implement my own multi-tenancy. If each customer has their own dedicated environment they can't interfere with each other and the system only needs to scale to the needs of that customer.

What about the cost? What about all those fixed infrastructure costs? As it happens, you only have fixed infrastructure costs if you have servers. If you use an entirely serverless platform there are no fixed costs, you pay only for what you use.

But how is a customer going to cope with the complexity of deploying and monitoring a microservice architecture themselves? That's simple, don't use a microservice architecture. Remember when I said that microservice architecture is a solution to an organizational problem? I don't have organizational problems anymore. As it's just me there's no point implementing multiple microservices. There are other ways of managing complexity. For a start, using an entirely serverless approach removes a huge amount of complexity all by itself.

One of the interesting challenges of this project will be figuring out how to make deployment as simple as possible. What's the minimum number of steps needed from a customer pulling out their credit card to setup an AWS account, to having the product up and running?

So, what will this product actually be? I promise I'll finally get round to telling you about that [next time]({% link _posts/2023-01-03-tools-vs-solutions.md %}).