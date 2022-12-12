---
title: Serverless or Not?
---

I [want to build a Serverless SaaS product]({% link _posts/2022-11-28-modern-saas-architecture.md %}) that can be deployed into a customer's own AWS account. But what exactly does it mean to be Serverless? AWS (other cloud providers are available) has [over 200 different services](https://aws.amazon.com/what-is-aws/). How many of those are serverless?

Like most things, there's a spectrum. There are varying opinions about where the dividing line is. It's definitely not serverless if you have to install and patch operating systems on individual servers. 

What about a managed service like [Amazon MQ](https://aws.amazon.com/amazon-mq/)? The servers are managed for you. There's nothing to install or configure. However, you do have to decide [how many servers you want and which instance types to use](https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/amazon-mq-creating-configuring-broker.html). 

At the other end of the scale you have services like [S3](https://aws.amazon.com/s3/). There are no decisions to make about numbers or types of instance. The API and console expose nothing related to servers at all. However, we all know there's a massive fleet of servers somewhere behind the scenes.

For me the best lens to look at this with is cost. Cost is the reason we have multi-tenant architectures in the first place. To make self deployable SaaS work you need true pay as you go costs with no fixed costs when the infrastructure is sitting there doing nothing. The cost model exposes how good the cloud provider's multi-tenancy system is. If there are dedicated per customer servers somewhere behind the scenes, that will be reflected in the cost.

{% include candid-image.html src="/assets/images/serverless-cost-model.svg" alt="Serverless Cost Model" %}

A truly serverless service will have zero cost when under zero load. If there are dedicated servers, you need a minimum number running at all times waiting for incoming requests. If you care about availability and fault tolerance, the minimum will be more than one. 

A truly serverless service will have costs that scale linearly with increasing load. If there are dedicated servers, there will be step changes in cost as the number of instances is scaled up to meet demand.

Reduced complexity is a side benefit driven by the serverless cost model. If costs scale linearly, the implementation is likely to be highly elastic with less messy edge cases to deal with. If there are no dedicated servers, then there are no servers for you to manage and no need to be concerned with instance types and numbers of servers. You have a simpler, higher level abstraction to deal with.

Let's play a game of *Serverless or Not*.

# Red Flags

Sometimes the cost model for a service can be a little opaque. It may look like there are zero fixed costs but when you look at practical implementations you find that you can't do without what you thought were "optional" extra cost items. A good example (and my first red flag) is [VPC](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html). VPCs are free to create. However, almost all practical implementations will need a NAT gateway or VPC endpoints. Both are extra cost items with a fixed cost component.

Needing a VPC is a red flag that a service is *not* serverless. If you have to care about IP address ranges, you're working at too low a level, stuck in the realm of physical servers.

The most obvious red flag is any service where you have to choose an instance type. That immediately rules out Amazon MQ. Easily confirmed by a quick look at the [pricing page](https://aws.amazon.com/amazon-mq/pricing/). Most of these managed services have transparent pricing. You directly pay for the underlying instances.

# Compute

| Service | VPC | Min Monthly Cost | Mem    | vCPUs | Cost Model | Min Bill Period |   Server-less? |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| EC2     | Y   | $18[^1]     | 0.5-1024 GB  | 0.1-128 | Per instance per hour | 60s[^2]  |  **Not**  | 
| ECS     | Y   | $18[^1]     | 0.5-1024 GB  | 0.1-128 | Per instance per hour | 60s[^2]  |  **Not**  |
| EKS     | Y   | $90[^3]     | 0.5-1024 GB  | 0.1-128 | Per cluster and instance per hour | 60s[^2]  |  **Not**  |
| ECS Fargate | Y | $21[^4]     | 0.5-120 GB  | 0.25-16 | Per vCPU and GB per hour | 60s[^2]  |  **Not**  |
| EKS Fargate | Y | $93[^5]     | 0.5-120 GB  | 0.25-16 | Per cluster, vCPU and GB per hour | 60s[^2]  |  **Not**  |
| App Runner | N | $15[^7]     | 2-4 GB  | 1-2 | Per vCPU hour for active instances, per GB per hour for active and provisioned instances| 60s[^8]  |  **Not**  |
| Lambda | N | $0     | 128-10240 MB  | 0.072-5.79[^6] | $0.0000133 per GB-second and $0.2 per million requests | 1ms  |  &#10004;  |
| Amplify Web App Server Side Rendering | N | $0     | Managed | Managed | $0.0000556 per GB-second and $0.3 per million requests | 1ms  |  &#10004;  |

[^1]: Min config is 3 x t4g.nano [burstable instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html) (2 vCPU at 5% utilization, 0.5GB) at $0.0042 each per hour (cheapest instance available) with 30GB EBS volumes (base size for AWS Linux) at $3 per month
[^2]: You are charged for the time it takes for the OS and language stack to boot up, scale up is far from instant
[^3]: Min config is 1 cluster at $0.1 per hour and 3 x t4g.nano with 30GB EBS volumes
[^4]: Min config is 3 x (0.25vCPU, 0.5GB, Linux/Arm) at $0.099 each per hour
[^5]: Min config is 1 cluster at $0.1 per hour and 3 x (0.25vCPU, 0.5GB, Linux/Arm) at $0.099 per hour
[^7]: Min config is 3 x (1vCPU,2GB) provisioned at $0.007 per GB-hour when idle
[^8]: Responds instantly to incoming requests from provisioned capacity, scales back down to zero active instances after 60s idle
[^6]: Lambdas have [access to 2-6 vCPUs but are throttled based on memory size](https://www.sentiatechblog.com/aws-re-invent-2020-day-3-optimizing-lambda-cost-with-multi-threading)

Fargate often appears in AWS presentations about serverless architecture. However, the cost model is not serverless. You need a minimum number of containers running at all times in case a request comes in. You can't spin up a container on demand the first time a request arrives.

App Runner is built on Fargate and manages scaling and deployments for you. It has an interesting cost model where it can scale CPU down to zero by CPU throttling the minimum set of provisioned containers. In this state you pay only for the memory used by the containers. CPU can be throttled back up in response to incoming requests.

It can be hard to compare Lambda and instance based pricing. The closest configurations are a c6gd.medium (1 vCPU, 2 GB) at $0.0384 per hour and a 1769 MB Lambda (1 vCPU, 1769 MB) at $0.0829 per hour. That's a little more than double the cost for Lambda. However, in practice, teams struggle to achieve anywhere close to 50% utilization when managing their own instances.

AWS Batch is a job management service that runs jobs on your choice of EC2 instances, Fargate or Lambda. There is no additional cost over that of the underlying compute.

# File Storage

| Service | Min Monthly Cost | AZs | Dura-bility | Max File Size | Max Capacity | Cost Model | Min Bill Period |   Server-less? |
|---------|-----|-------|------|-----|---------------|-------|-----------------------|-----|-----|
| EBS | $1.60[^f1a] | 1 | 5 9s | 64 TB | 64 TB | $0.08 per GB-month and $0.005 per IOPS *provisioned* | 60s | **Not** |
| EFS | $0.3[^f2a] | 3 | 11 9s | 48 TB | Unlimited | $0.30 per GB-month, $0.03 per GB reads and $0.06 per GB writes | 1 Hour | &#10004; |
| S3 | $0 | 3 | 11 9s | 5 TB | Unlimited | $0.023 per GB-month, $0.09 per GB transferred out to internet, $0.4 per million read requests, $5 per million write requests | 1 Hour | &#10004; |

[^f1a]: Minimum size is 20GB
[^f2a]: An empty file system occupies some space so will be charged for at least 1 GB

EBS is not serverless because the pricing model is based on provisioned capacity. Effectively you have to decide in advance how big you want your disk drive to be and how much IO you will be doing. The durability and availability model means you'll also need to implement some form of RAID on top of your bare EBS volumes if storing customer data.

EFS has a non-zero monthly cost but is low enough for me to count it as serverless.

# Database

| Service | VPC | Min Monthly Cost | Mem    | vCPUs | Cost Model | Min Bill Period |   Server-less? |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| RDS     | Y   | $27.64[^d1]     | 1-1024 GB  | 0.2-128 | Per instance per hour, GB *provisioned* per month | 10m  |  **Not**  | 
| Aurora  | Y   | $106.12[^d2]     | 4-1024 GB  | 0.4-128 | Per instance per hour, GB per month, per million IOPs | 10m  |  **Not**  |
| Aurora  Serverless | Y   | $87.40[^d3]     | 1-256 GB  | 0.125-32 | Per [ACU](https://docs.amazonaws.cn/en_us/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.how-it-works.html#aurora-serverless-v2.how-it-works.capacity) per hour, GB per month, per million IOPs | 10m  |  **Not**  |
| DocumentDB  | Y   | $109.95[^d4]     | 4-768 GB  | 0.4-96 | Per instance per hour, GB per month, per million IOPs | 10m  |  **Not**  |
| Neptune  | Y   | $134.92[^d5]     | 4-768 GB  | 0.4-96 | Per instance per hour, GB per month, per million IOPs | 10m  |  **Not**  |
| Neptune  Serverless | Y   | $579.88[^d6]     | 5-256 GB  | 0.625-32 | Per [NCU](https://docs.aws.amazon.com/neptune/latest/userguide/neptune-serverless-capacity-scaling.html) per hour, GB per month, per million IOPs | 10m  |  **Not**  |
| OpenSearch  Serverless | Y   | $691.44[^d7]     | 24-240 GB  | 6-60 | Per [OCU](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-scaling.html) per hour, GB per month | 10m  |  **Not**  |
| DynamoDB  | N   | $0     | NA  | NA | $1.25 per million write requests, $0.25 per million read [requests](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html), $0.25 per GB-month | 1 hour  |  &#10004; |
| TimeStream  | N   | $0     | NA  | NA | $0.50 per million write requests, $0.036 per GB-hour in memory, $0.03 per GB-month stored, $0.01 per GB scanned | 1 hour  |  &#10004; |

[^d1]: Min Multi-AZ config is  2 x db.t4g.micro [burstable instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html) (2 vCPU at 10% utilization, 1GB) at $0.016 each per hour with 20GB of storage at $0.23 per GB-month
[^d2]: Min Multi-AZ config is 2 x db.t4g.medium [burstable instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html) (2 vCPU at 20% utilization, 4GB) at $0.073 each per hour with 10GB of storage at $0.1 per GB-month
[^d3]: Min Multi-AZ config is 2 x 0.5 [ACU](https://docs.amazonaws.cn/en_us/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.how-it-works.html#aurora-serverless-v2.how-it-works.capacity)  (0.125 vCPU, 1 GB) at $0.12 per ACU hour with 10GB of storage at $0.1 per GB-month
[^d4]: Min Multi-AZ config is 2 x db.t4g.medium [burstable instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html) (2 vCPU at 20% utilization, 4GB) at $0.07566 each per hour with 10GB of storage at $0.1 per GB-month
[^d5]: Min Multi-AZ config is 2 x db.t4g.medium [burstable instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html) (2 vCPU at 20% utilization, 4GB) at $0.093 each per hour with 10GB of storage at $0.1 per GB-month
[^d6]: Min Multi-AZ config is 2 x 2.5 [NCU](https://docs.aws.amazon.com/neptune/latest/userguide/neptune-serverless-capacity-scaling.html)  (0.625 vCPU, 5 GB) at $0.1608 per NCU hour with 10GB of storage at $0.1 per GB-month
[^d7]: Min Multi-AZ config is 4 [OCU](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-scaling.html)  (6 vCPU, 24 GB) at $0.24 per OCU hour with 10GB of storage at $0.024 per GB-month

The big surprise here is that all the "Serverless" branded databases are not actually serverless. They would be better described as "Auto-vertical scaling of instance types" but I guess that's not catchy enough.

# Queues and Eventing

| Service | VPC | Min Monthly Cost | Cost Model | Min Bill Period |  Server-less? |
|---------|-----|------------------|-------------|-----|-----|
| Amazon MQ | Y | $40.94[^q1]     | Per instance per hour, GB per month, GB transferred between instances[^q2] | 60s  |  **Not**  | 
| Kinesis | N | $28.80[^q3]     | $0.04 per stream per hour, $0.08 per GB ingested, $0.04 per GB retrieved | 1 hour  |  **Not**  | 
| SQS | N | $0   | $0.40 per million 64KB requests | NA  |  &#10004; |
| SNS | N | $0   | $0.50 per million 64KB requests, $0.09 per GB transferred out to SQS or Lambda[^q6] | NA  |  &#10004; |
| EventBridge | N | $0   | $1 per million 64KB events published | NA  |  &#10004; |

[^q1]: Min Multi-AZ config is 2 x mq.t3.micro [burstable instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html) (2 vCPU at 10% utilization, 1GB) at $0.02704 each per hour with 20GB of storage at $0.1 per GB-month
[^q2]: $0.10 per GB for EBS storage, $0.30 for EFS. $0.01 per GB transferred between brokers in multi-az setup
[^q3]: One stream at $0.04 per hour
[^q6]: $ 0.09 per GB transferred equivalent to $5 per million 64KB events or $0.09 per million 1KB events

Functionally, Kinesis looks like it should be serverless. Again, the cost model reveals the existence of dedicated per stream infrastructure.

# Orchestration

| Service | VPC | Min Monthly Cost  | Cost Model |  Min Bill Period | Server-less? |
|---------|-----|------|------------|-------|------|-----|
| SWF | Y | $0 | $100 per million workflow executions, $25 per million tasks | NA  |  **Not**  | 
| STEP Functions | N | $0 | $25 per million [state transitions](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-transitions.html) | NA  |  &#10004; |
| STEP Functions Express | N | $0 | $0.00001667 per GB-second and $1 per million requests | 100ms  |  &#10004; |

In isolation, SWF looks serverless. However, SWF is useless without decision and task workers. SWF requires those decision and task workers to execute on instances which use long polling to communicate with SWF. That in turn makes any system that uses SWF not serverless.

Standard and Express STEP functions look very similar. Both implement orchestration logic based on the [STEP state machine definition](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html). The cost models reveal that the implementations are completely different. Standard STEP functions provide exactly once semantics and have a cost model that suggests they're implemented on top of SWF or something with an equivalent architecture. Express STEP functions have at most once or at least once semantics. Their cost model suggests they're implemented using an SQS queue of workflow instances with a lambda that reads an instance and then executes the entire workflow.

# Cache

| Service | VPC | Min Monthly Cost | Mem    | vCPUs | Cost Model | Min Bill Period |   Server-less? |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| MemoryDB for Redis  | Y  | $69.12[^c1]     | 1.37-419.09 GB  | 0.4-64 | Per instance per hour, $0.20 per GB written | 60s  |  **Not**  | 
| Elasticache  | Y  | $23.04[^c3]     | 0.5-635.61 GB  | 0.2-96 | Per instance per hour | 60s  |  **Not**  | 
| DAX (DynamoDB accelerator)  | Y  | $57.60[^c4]     | 2-768 GB  | 0.4-96 | Per instance per hour | 60s  |  **Not**  | 
| API Gateway Caching | N  | $14.40[^c5]     | 0.5-237 GB  | Unknown | Per hour | 60s  |  **Not**  | 

[^c1]: Min Multi-AZ config is  2 x db.t4g.small [burstable instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html) (2 vCPU at 20% utilization, 1.37GB) at $0.048 each per hour
[^c3]: Min Multi-AZ config is  2 x cache.t4g.micro [burstable instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html) (2 vCPU at 10% utilization, 0.5GB) at $0.016 each per hour
[^c4]: Min Multi-AZ config is  2 x dax.t3.small [burstable instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html) (2 vCPU at 20% utilization, 2GB) at $0.04 each per hour
[^c5]: Min config is 0.5GB cache capacity at $0.02 per hour

Surprisingly, there is no serverless application cache available from AWS. Even the DynamoDB specific DAX and API Gateway integrated caching are instance based. 

The only configuration for the API Gateway cache is capacity. However, the [documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-caching.html) makes it clear that there is a dedicated instance behind the scenes. It even suggests that you run a load test to ensure that the instance you implicitly selected (based on cache capacity) will cope with your traffic.

Quoted memory sizes for MemoryDB, Elasticache and API Gateway are memory available for caching. DAX quotes the overall memory on the instance, not all of which will be available for caching.

# Gateway

| Service | Min Monthly Cost | Cost Model | Min Bill Period |  Server-less? |
|---------|------------------|-------------|-----|-----|
| Load Balancer | $16.20 | $0.0225 per hour, $0.008 per [LCU](https://aws.amazon.com/elasticloadbalancing/pricing/) hour | 1 hour |  **Not**  |
| CloudFront | $0 | $1 per million https requests, $0.085 per GB transferred out to internet | NA |  &#10004; |
| Amplify Web App Hosting | $0 | $0.15 per GB served | NA |  &#10004; |
| API Gateway (http API)| $0 | $1 per million 512KB http API calls received, $0.09 per GB transferred out to internet | NA |  &#10004; |
| API Gateway (WebSocket API)| $0 | $1 per million 32KB messages sent or received by client, $0.25 per million connection minutes | NA |  &#10004; |
| AppSync (queries and mutations)| $0 | $4 per million requests received, $0.09 per GB transferred out to internet | NA |  &#10004; |
| AppSync (subscriptions)| $0 | $2 per million messages received by client, $0.08 per million connection minutes | NA |  &#10004; |
| Lambda Function URLs | $0 | No additional charge above the cost of invoking the lambda| NA |  &#10004; |
| IoT Core | $0 | $0.30 per million 5KB messages ingested, $1 per million 5KB messages received by client, $0.08 per million connection minutes | NA |  &#10004; |
| Cognito User Pools | $0 | $0.0055 per MAU (first 50k free indefinitely) | NA |  &#10004; |

I'm as surprised as you are that load balancers are not serverless. Functionally it looks serverless - no configuration of instance types, smooth and elastic scaling under load. However, the cost model makes it clear there must be some dedicated per customer infrastructure behind the scenes. 

Despite the name, IOT Core is a general purpose asynchronous messaging gateway. Messages from clients can be ingested at scale and routed to S3, SNS, SQS, Lambda, DynamoDB, STEP Functions and many more.

Whatever you use to implement your gateway, you'll need some form of user authentication. Cognito User Pools is the AWS solution and has an unusual high level cost model aligned with how SaaS vendors typically think about their cost and revenue.

# Footnotes

All costs correct at time of writing based on AWS US East region.
