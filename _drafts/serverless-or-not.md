---
title: Serverless or Not?
---

I [want to build a Serverless SaaS product]({% link _posts/2022-11-28-modern-saas-architecture.md %}) that can be deployed into a customer's own AWS account. But what exactly does it mean to be Serverless? AWS (other cloud providers are available) has [over 200 different services](https://aws.amazon.com/what-is-aws/). How many of those are serverless?

Like most things, there's a spectrum. There are varying opinions about where the dividing line is. It's definitely not serverless if you have to install and patch operating systems on individual servers. What about a managed service like [Amazon MQ](https://aws.amazon.com/amazon-mq/)? The servers are managed for you. There's nothing to install or configure. However, you do have to decide [how many servers you want and which instance types to use](https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/amazon-mq-creating-configuring-broker.html). 

At the other end of the scale you have services like [S3](https://aws.amazon.com/s3/). There are no decisions to make about numbers or types of instance. The API and console expose nothing related to servers at all. However, we all know there's a massive fleet of servers somewhere behind the scenes.

For me the best lens to look at this with is cost. Cost is the reason we have multi-tenant architectures in the first place. To make self deployable SaaS work you need true pay as you go costs with no fixed costs when the infrastructure is sitting there doing nothing. The cost model exposes how good the cloud provider's multi-tenancy system is. If there are dedicated per customer servers somewhere behind the scenes, that will be reflected in the cost.

{% include candid-image.html src="/assets/images/serverless-cost-model.svg" alt="Serverless Cost Model" %}

A truly serverless service will have zero cost when under zero load. If there are dedicated servers you need a minimum number running at all times waiting for incoming requests. If you care about availability and fault tolerance, the minimum will be more than one. 

A truly serverless service will have costs that scale linearly with increasing load. If there are dedicated servers there will be step changes in cost as the number of instances is scaled up to meet demand.

Reduced complexity is a side benefit driven by the serverless cost model. If costs scale linearly, the implementation is likely to be highly elastic with less messy edge cases to deal with. If there are no dedicated servers, then there are no servers for you to manage and no need to be concerned with instance types and numbers of servers. You have a simpler, higher level abstraction to deal with.

Let's play a game of *Serverless or Not*.

# Red Flags

Sometimes the cost model for a service can be a little opaque. It may look like there are zero fixed costs but when you look at practical implementations you find that you can't do without what you thought were "optional" extra cost items. A good example (and my first red flag) is [VPC](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html). VPCs are free to create. However, almost all practical implementations will need a NAT gateway or VPC endpoints. Both are extra cost items with a fixed cost component.

Needing a VPC is a red flag that a service is *not* serverless. If you have to care about IP address ranges you're working at too low a level, stuck in the realm of physical servers.

The most obvious red flag is any service where you have to choose an instance type. That immediately rules out Amazon MQ. Easily confirmed by a quick look at the [pricing page](https://aws.amazon.com/amazon-mq/pricing/). Most of these managed services have transparent pricing, you directly pay for the underlying instances.

# Compute

| Service | VPC | Min Monthly Cost | Mem    | vCPUs | Cost Model | Min Bill Period |   Server-less? |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| EC2     | Y   | $18[^1]     | 0.5-12288 GB  | 2-448 | Per instance per hour | 60s[^2]  |  **Not**  | 
| ECS     | Y   | $18[^1]     | 0.5-12288 GB  | 2-448 | Per instance per hour | 60s[^2]  |  **Not**  |
| EKS     | Y   | $90[^3]     | 0.5-12288 GB  | 2-448 | Per cluster and instance per hour | 60s[^2]  |  **Not**  |
| ECS Fargate | Y | $21[^4]     | 0.5-120 GB  | 0.25-16 | Per vCPU and GB per hour | 60s[^2]  |  **Not**  |
| EKS Fargate | Y | $93[^5]     | 0.5-120 GB  | 0.25-16 | Per cluster, vCPU and GB per hour | 60s[^2]  |  **Not**  |
| Lambda | N | $0     | 128-10240 MB  | 0.072-5.79[^6] | Per GB-second and per request[^7] | 1ms  |  &#10004;  |

AWS Batch is a job management service that runs jobs on your choice of EC2 instances, Fargate or Lambda. There is no additional cost over that of the underlying compute.

# Footnotes

All costs correct at time of writing based on AWS US East 1 region.

[^1]: Min config is 3 x t4g.nano (2 vCPU, 0.5GB) at $0.0042 each per hour (cheapest instance available) with 30GB EBS volumes (base size for AWS Linux) at $3 per month
[^2]: You are charged for the time it takes for the OS and language stack to boot up, scale up is far from instant
[^3]: Min config is 1 cluster at $0.1 per hour and 3 x t4g.nano with 30GB EBS volumes
[^4]: Min config is 3 x (0.25vCPU, 0.5GB, Linux/Arm) at $0.00329 each per hour
[^5]: Min config is 1 cluster at $0.1 per hour and 3 x (0.25vCPU, 0.5GB, Linux/Arm) at $0.00329 per hour
[^6]: Lambdas have [access to 2-6 vCPUs but are throttled based on memory size](https://www.sentiatechblog.com/aws-re-invent-2020-day-3-optimizing-lambda-cost-with-multi-threading)
[^7]: $0.0000133 per GB-second and $0.2 per million requests. For comparison, one hour of compute with 0.5GB memory is $0.024