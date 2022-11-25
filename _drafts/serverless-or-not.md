---
title: Serverless or Not?
---

I want to build a Serverless SaaS product that can be deployed into a customer's own AWS account. But what exactly does it mean to be Serverless? AWS (other cloud providers are available) has [over 200 different services](https://aws.amazon.com/what-is-aws/). How many of those are serverless?

Like most things, there's a spectrum. There are varying opinions about where the dividing line is. It's definitely not serverless if you have to install and patch operating systems on individual servers. What about a managed service like [Amazon MQ](https://aws.amazon.com/amazon-mq/)? The servers are managed for you. There's nothing to install or configure. However, you do have to decide [how many servers you want and which instance types to use](https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/amazon-mq-creating-configuring-broker.html). 

At the other end of the scale you have services like [S3](https://aws.amazon.com/s3/). There's no decisions to make about numbers or types of instance. The API and console expose nothing related to servers at all. However, we all know there's a massive fleet of servers somewhere behind the scenes.

For me the best lens to look at this with is cost. Cost is the reason we have multi-tenant architectures in the first place. To make self deployable SaaS work you need true pay as you go costs with no fixed costs when the infrastructure is sitting there doing nothing. The cost model exposes how good the cloud provider's multi-tenancy system is. If there are dedicated per customer servers somewhere behind the scenes, that will be reflected in the cost.