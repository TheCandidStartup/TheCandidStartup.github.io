---
title: AWS re:Invent 2022
---

I've only attended re:Invent in person once. I quickly realized that apart from the mountain of swag you get to bring home, there's very little advantage to being there in person. It's in Vegas. There are more than fifty thousand attendees. Do I need to say more? 

All the sessions are recorded with high quality audio/video and available via both the [AWS web site](https://reinvent.awsevents.com/) and [YouTube](https://www.youtube.com/user/amazonwebservices). Since then, I've cleared space in my diary in the week following re:Invent and settled down to watch the most interesting sessions at 1.5X speed. To save you the trouble of doing the same, here's my take on the most interesting sessions.

If you're looking for a comprehensive list of all the new announcements, then head over to the [AWS News Blog](https://aws.amazon.com/blogs/aws/top-announcements-of-aws-reinvent-2022/). 

# Keynotes

## Peter DeSantis - SVP AWS

[YouTube](https://www.youtube.com/watch?v=R11YgBEZzqE)

Focus on infrastructure. Skip unless you're interested in low level details of EC2 instances, networking, Nitro hardware, Lambda infrastructure.
* New instance types
* AWS internally using a new network protocol (SRD) as replacement for TCP. Optimized for AWS network topology, particularly ability to support multiple paths within same network connection. Big improvements for tail latency.
* EBS now using SRD, big improvement in write latency.
* Standard ENA network adaptor (interface exposed by all EC2 instances) can now transparently use SRD regardless of API you use to talk to adapter. Simple configuration change to enable  "ENA Express".
* AWS Lambda infrastructure internal performance optimization
    * Reducing cold start latency
    * History from original EC2 instance per customer architecture to Firecracker micro-VM
    * Announcing Lambda SnapStart - taking Firecracker snapshot at end of initialization so cold start can restore from snap shot rather than running initialization again.
    * Effectively removes cold start penalty
    * Some care needed for things that need to be different per instance - such as random number seeds.
    * Using layered snapshot system so that common parts of runtime (e.g. OS, language runtime) can be stored once.
    * Profile how blocks of snapshot are accessed when snapshot boots and use that to do predictive loading for future boots
    * For now JVM only

## Adam Selipsky - CEO AWS

[YouTube](https://www.youtube.com/watch?v=Xus8C2s5K9A)

The high level AWS pitch you've heard many times before with a few fun facts and new announcements. I wouldn't bother with this one.

Fun facts
* 80-90% of startups run on AWS
* Scale of data managed by AWS
    * Expedia runs 600 billion AI predictions a year
    * Samsung handles 80 thousand user requests per second
    * Pinterest stores 1 Exabyte of data
    * Fortnite backend has a fleet of tens of thousands of game servers handling 13 million active players
    * Nielson process hundreds of billions of ad events per day
    * Dana-Farber spun up an HPC cluster with 5.6 million Xeon cores

New Announcements
* OpenSearch Serverless in preview
* Aurora Zero ETL integration with Redshift
* Redshift integration for Apache Spark
* Amazon DataZone - automated data catalog management
* ML powered forecasting in QuickSight Q
* Container runtime threat detection for GuardDuty
* Amazon Security Lake - ingest data from 50 partners in OCSF format
* Inf2 instances for EC2 - dedicated instances for ML inferences
* Hpc6id instances for data and memory intensive workloads
* AWS SimSpace Weaver - orchestration for spatial simulations distributed across instances
* AWS Connect contact center as a service adding ML based capacity forecasting and agent performance management metrics
* AWS Supply Chain - vertical application for supply chain management
* AWS Clean Rooms - collaboration on data between low trust partners
* Amazon Omics - vertical application for analyzing genomic and similar data sets

## Werner Vogels - CTO AWS

"*The World is Asynchronous*"

[YouTube](https://www.youtube.com/watch?v=RfvL_423a-I)

Entertaining, thought provoking, well worth watching. 

* Lovely "The Matrix" parody intro showing us the horrors of a truly synchronous world
* The real world is asynchronous - non-blocking parallelism 
* Synchronous is a simplification to make programming easier but is an illusion, at lowest hardware level it's all asynchronous
* Synchrony leads to tightly coupled systems, Asynchrony leads to loosely coupled systems
* Loosely coupled systems are easy to evolve, more fault tolerant, less dependencies
* S3 went from 15 -> 235 microservices
* Newly published - AWS [Distributed Computing Manifesto](https://www.allthingsdistributed.com/2022/11/amazon-1998-distributed-computing-manifesto.html) from 1998, [allthingsdistributed.com](https://www.allthingsdistributed.com/)
* Workflows let us build applications from loosely coupled components
* Customers do the unexpected - using STEP for map-reduce pattern
* Announcing STEP distributed map - up to 10000 parallel invocations
* Event driven architecture leads to loosely coupled systems. Three main patterns
    * Point to point
    * Publish / Subscribe
    * Event streaming
* Pushing EventBridge as central event bus that handles all of these patterns
* "All complex systems that work evolved from a simple system that worked" - Gall's law
* Announce AWS Application Composer - visual canvas to make it easy to compose serverless architecture, maintain model of architecture, output CloudFormation
* Events are composable - analogy with Unix
* Can we compose AWS services?
* Announcing AWS EventBridge pipes - build advanced integrations in minutes, built in filtering and manipulation of events
* Event driven systems enable global scale
* DynamoDB handles 10 trillion requests per day
* Global tables implementation - local reads, local writes active-active architecture
    * Entirely asynchronous approach
    * Uses DynamoDB streams to feed replication service
    * Replication service is multiple replicators each using an SQS queue plus workers
    * Common pattern - change data capture + Asynchronous coupling + self healing replicators
* Amazon builders library - 2 new articles released
    * [My CI/CD pipeline is my release captain](https://aws.amazon.com/builders-library/cicd-pipeline/)
    * [Using dependency isolation to contain concurrency overload](https://aws.amazon.com/builders-library/dependency-isolation/)
* Announcing Amazon CodeCatalyst
    * removing undifferentiated heavy lifting needed to get app off the ground
    * based on project blueprints
    * set up CI/CD pipelines
    * easy to switch between environments
    * team collaboration features
    * integrations with github, jira, visual studio, slack, ...
* 3D will be as big as video
    * Photogrammetry to create 3D product models
    * ML advances allow you to create model from as few as 12 photos
    * Investing in O3DE open source 3D engine
    * Scanning of environments to put objects in - plug for Matterport
    * 3D city simulation
* Customer demo - Unreal Engine
    * Matrix Awakens demo - 16 sq km, 4k vehicles, 35K meta-humans, billions of polygons
    * Twinmotion - simulation playback in browser powered by AWS GPU instances
    * RealityScan scanning app for phones using AWS backend
* AWS Ambit Scenario Designer
    * Open source tools to generate 3d content at scale
    * Generate 3D city from open streetmap data
* AWS SimSpace Weaver
    * Spatial subdivision of simulated world into a grid
    * Grid tiles distributed over a set of instances
    * Handles objects that cross boundaries between tiles - handing off responsibility to another instance
* Quantum Simulation
    * Some processes (e.g. simulate penicillin molecule) that would need 2^N bits of memory in classical computer to simulate need N qubits in a quantum computer
    * "Curiosity with Werner Vogels" - video on current state of quantum computers and future possibilities

# Breakout Sessions

So many breakout sessions. No one could possibly look at them all. This is a random sampling of those with a title interesting enough to get me to press play.

## Building next-gen applications with event-driven architectures

[YouTube](https://youtu.be/SbL3a9YOW7s)

Entertaining presenter. Worth a watch.
* Interesting ideas on the many different forms of coupling
* Compare and contrast synchronous request-response with asynchronous patterns looking at pros/cons and forms of coupling
* EventBridge for Orchestration
* Sparse events vs full-state descriptions pros/cons
* STEP functions for Choreography
* Event de-duplication using idempotency

## Reliable scalability: How Amazon.com scales in the cloud

[YouTube](https://youtu.be/QeW9wCB36ck)

* History of amazon.com architecture
* 1995: Single C executable monolith app server, single database
* 1998: Split data into multiple databases
* 2000: Service oriented architecture
* 2022: Prime day - running on AWS. 100m DynamoDB requests/second, 70 million SQS requests/second, 11 trillion EBS requests during the day, total of 288 billion Aurora transactions
* Current architecture: thousands of microservices with crazy complex dependency graph
* Examples of architecture related to well architected pillars
* Example 1: IMDB from monolith to serverless microservices
    * GraphQL queries from the front end
    * Resolvers distribute request across the relevant microservices
    * Implementation is CloudFront with WAF -> load balancer -> Lambda gateway -> Lambda microservices
    * Gateway pulls schema from S3 bucket, polls for updates
    * Architecture matches organizational structure
    * 800K rpm to Lambda
    * Autoscaling provisioned currency
    * WAF instantly resolved issues with malicious bots
* Example 2: Global Ops Robotics cell based architecture
    * Warehouse management system - microservice architecture
    * Services use cell based architecture with data partitioned by fulfillment center
    * Redundant fulfillment centers in each geographic region, so if cell serving one fulfillment center goes down, there are others to fulfill order
    * Important to make sure that each service maps fulfillment centers to cells in a consistent way so that failures remain constrained to small number of centers.
    * Used central FC assignment built on dynamoDB
* Example 3: Amazon relay app moves to multi-region architecture
    * Manages movement of trucks between warehouses
    * App used by truckers
    * Relay mobile gateway = multiple AWS API gateways with DNS routing to gateway
    * Multiple backend modules each using Lambda + DynamoDB
    * Nothing shared between gateway and backend modules - independent deploys
    * Multi-region trigger was SNS region wide outage
    * Used dynamodb global tables and deployed backend modules + api gateway in each region. Setup route 53 with latency based routing policy. Active/active architecture
    * Test resilience - shift 100% of traffic to one region. Less than 10 minutes to failover, small increase in latency.
* Example 4: Amazon classification platform uses shuffle sharding
    * Part of AWS product catalog - classifying products
    * Used by 50 programs across Amazon, 10K machine learning models, 100K rules, 100 model updates per day, millions of product updates per hour
    * Model updates grouped into batches of 200 items, multiple ML models run against each item, pool of ECS workers each applying ~30 models
    * Models are pulled on demand from S3 and cached locally, results written to dynamoDB - millions per second
    * Using shuffle sharding to assign models to workers, minimize impact of a poison model
    * Each shard of workers has its own SQS queue. Lambda based router assigns work to shards also making use of back pressure signals from queue to balance work
* Example 5: Amazon Search chaos engineering
    * 84K requests/second during prime day
    * 40 backend services using S3, API gateway, ECS, DynamoDB, SNS, Kinesis
    * Dedicated resilience team
    * Chaos experiments have to stay within SLO error budget - stop if burn rate too high
    * Using fault injection simulator with purpose built chaos orchestrator to make it simple to use across their 40 services

## SaaS microservices deep dive: Simplifying multi-tenant development

[YouTube](https://youtu.be/NpThwz0z_D0)

Engaging presenter. Interesting to see current best practices for implementing multi-tenant applications.

* Base architecture - CloudFront -> API Gateway -> independent microservices
* Tenant Concerns: Tiering, logging, metrics, billing, identity, isolation
    * Front end: authentication, routing, feature flags
    * API Gateway: authorization, throttling, caching
    * Business logic: authorization, metrics, logging, metering
    * Database: access, partitioning, isolation, backup/restore
    * Infrastructure: Provisioning, isolation, maintenance, tenant lifecycle
* Need tenant id throughout system. Determining tenant context needs to be part of login flow. Include as claim in JWT token.
* Reusable helpers for getting tenant context, error reporting, metering, tiering, ...
* Partitioning != isolation
    * Partitioning = tagging record by tenant id or having separate dynamo table for each tier
    * isolation = setting up request specific iam credentials based on tenant context
    * could have tenant specific iam roles and then use cognito identity pool role mapping. Easy to understand but doesn't scale to lots of tenants
    * Other option is to use multiple iam policies - e.g. combine identity and session policy to allow only intersection. Identity is static, session is defined at runtime. Session policy could use dynamodb request condition to restrict query to specific tenant.
* Infrastructure and DevOps
    * Impact of adding a new tenant on DevOps
    * May need infrastructure changes
    * Support for moving tiers, enable/disable, trial->paid
    * Removing tenant if customer leaves
    * Use Lambda layers to have one copy of shared code for multiple lambda functions
    * Use sidecar containers to share background processes with multiple containers
    * Use Lambda extensions for Envoy like interceptor patterns

## How to understand and improve resiliency for serverless systems

[YouTube](https://youtu.be/ivz_IO8rLjo)

Mostly a plug for resilience hub.

* resiliency = ability to withstand partial and intermittent failures
* If serverless is highly available automatically what is left to do?
* Four capabilities: anticipate, monitoring, responding, learning
* RTO and RPO
* AWS Resilience Hub - give it your architecture (e.g. via CloudFormation) and it will tell you if you will meet your RTO/RPO goals. 
* Anticipate example: provisioned currency for lambda
* Resilience hub: separate analysis for impact of regional, AZ, infrastructure and application failures
* monitoring example: CloudWatch metrics. Important to define your own business/customer metrics as well as the built ins. 
* resilience hub will give recommendations for the cloudwatch metrics you should have in place
* Responding example: Automated responses to events using EventBridge
* Resilience hub provides recommendations to help build runbooks
* Learning example: chaos engineering
* Resilience hub recommendations for fault injection simulator tests with test templates that can be imported into FIS or run directly from resilience hub

## Operating highly available Multi-AZ applications

[YouTube](https://youtu.be/mwUV5skJJ0s)

* Start with identifying and mitigating single sources of failure
    * Single server
    * Single deployment
    * Single config change
    * Local network failure
    * Infrastructure failure
    * Power Failure
    * Flood
    * Storage Limits
    * Heap mem exceeded
    * TLS cert expiry
* Architecture evolves from single server -> multiple servers -> multiple cells -> multiple AZs
* At most advanced level start looking for possible correlated failures and setup cells differently (e.g. have TLS cert for each cell expire on a different date, or different heap memory limits)
* Others remain: DB schema, storage, dependencies
* Example replicated system: Route 53 with 4 name servers per domain
* Hard failures are easy to detect and resolve (e.g. load balancer health checks)
* Grey failures are difficult
    * Bug causing repeated crash/restart
    * Bad config change
    * Reduced capacity
    * Intermittent dependency failure
    * Packet loss/latency
* Grey failures are subjective - how much extra latency is OK
* General approach - try and turn grey failures into hard failures
    * Strategy 1: Deep health checks - properly exercise app logic in health check. Cheap to do but risk of overreaction and unlikely to catch all grey failures. Builders library has article on implementing health checks.
    * Strategy 2: ELB minimum healthy targets. New ELB feature. Can take entire AZ out of service when AZ unlikely to be handle its share of hosts.
    * Strategy 3: Detect and shift away from zone. Turns wide array of grey failures into single hard failure - AZ is out of service.
* Rest of talk about how to do strategy 3
* First need AZs to be independent. By default ELB instance in one AZ will distribute load across instances in all AZs. Reasonable out of box default that you need to turn off if implementing this strategy.
    * Means load balancing between AZs is done by AZ. Works best for bigger applications (lots of instances per AZ), equal capacity in each AZ. Needs enough capacity that system will cope with loss of entire AZ.
    * Need to setup monitoring so all your metrics are available on a per AZ basis. Can then compare across AZs, see which is unhealthy.
    *  Use canaries - e.g. CloudWatch synthetics. ELB provides per AZ domain names that allows you to point canaries at specific AZs. One canary per AZ and one per region overall.
* New feature - Route 53 Application Recovery Controller Zonal shift
    * Simple API call to shift load away from one zone temporarily. Includes expiry time.
    * Included in ALB/NLB (if cross-zone turned off). No additional cost.
    * Can also do from console
    * Need to be sure other AZs are healthy and have spare capacity
    * Works by removing AZ from DNS
    * Gives time to diagnose and fix problem
    * Can extend shift or cancel
