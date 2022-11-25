---
title: Serverless or Not?
---

I want to build a Serverless SaaS product that can be deployed into a customer's own AWS account. But what exactly does it mean to be Serverless? AWS (other cloud providers are available) has [over 200 different services](https://aws.amazon.com/what-is-aws/). How many of those are serverless?

Like most things, there's a spectrum. There are varying opinions about where the dividing line is. It's definitely not serverless if you have to install and patch operating systems on individual servers. What about a managed service like [Amazon MQ](https://aws.amazon.com/amazon-mq/)? The servers are managed for you. There's nothing to install or configure. However, you do have to decide [how many servers you want and which instance types to use](https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/amazon-mq-creating-configuring-broker.html). 

At the other end of the scale you have services like [S3](https://aws.amazon.com/s3/). There's no decisions to make about numbers or types of instance. The API and console expose nothing related to servers at all. However, we all know there's a massive fleet of servers somewhere behind the scenes.

For me the best lens to look at this with is cost. Cost is the reason we have multi-tenant architectures in the first place. To make self deployable SaaS work you need true pay as you go costs with no fixed costs when the infrastructure is sitting there doing nothing. The cost model exposes how good the cloud provider's multi-tenancy system is. If there are dedicated per customer servers somewhere behind the scenes, that will be reflected in the cost.

{% include candid-image.html src="/assets/images/serverless-cost-model.svg" alt="Serverless Cost Model" %}

A truly serverless service will have zero cost when under zero load. If there are dedicated servers you need a minimum number running at all times waiting for incoming requests. If you care about availability and fault tolerance, the minimum will be more than one. 

A truly serverless service will have costs that scale linearly with increasing load. If there are dedicated servers there will be step changes in cost as the number of instances is scaled up to meet demand.

Reduced complexity is a side benefit driven by the serverless cost model. If costs scale linearly, the implementation is likely to be highly elastic with less messy edge cases to deal with. If there are no dedicated servers, then there are no servers for you to manage and no need to be concerned with instance types and numbers of servers. You have a simpler, higher level abstraction to deal with.

Let's play a game of *Serverless or Not*.

# Red Flags

Sometimes the cost model for a service can be a little opaque. It may look like there are zero fixed costs but when you look at practical implementations you find that you can't do without what you thought were "optional" extra cost items. A good example (and my first red flag) is [VPC](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html). VPCs are free to create. However, almost all practical implementations will need a NAT gateway and involve data transfers outside a single AZ. Both are extra cost items.

Needing a VPC is a red flag that a service is *not* serverless. If you have to care about IP address ranges you're working at too low a level, stuck in the realm of physical servers.

The most obvious red flag is any service where you have to choose an instance type. That immediately rules out Amazon MQ. Easily confirmed by a quick look at the [pricing page](https://aws.amazon.com/amazon-mq/pricing/). Most of these managed services have transparent pricing, you directly pay for the underlying instances.

# Compute

| Service | VPC? | Instance? | Min Monthly Cost | Cost Model               | Serverless? |
|---------|------|-----------|------------------|--------------------------|-------------|
| EC2     | Y    | Y         | $9[^1]           | Per instance per hour    | N           | 

# Footnotes

All costs correct at time of writing based on AWS US East 1 region.

[^1]: 3 x t4g.nano at $0.0042 per hour (cheapest instance available assuming you can live with just 0.5 GB of memory)