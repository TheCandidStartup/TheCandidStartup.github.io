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

So many breakout sessions. No one could possibly look at them all. This is a random sampling of those with a title interesting enough to get me to press play. To cut the list down further I'm mostly focusing on 300 and 400 level talks.

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

## Beyond five 9s: Lessons from our highest available data planes

[YouTube](https://youtu.be/es9527rA_8I)

Updated version of a talk that is given every year. Lots more details in the builders library. Recommended.

* Rethinking the nines model
    * Coarse, not great for systems design. Doesn't fit cell based systems.
    * Single summary statistic - doesn't give great insight
    * Instead think about what really matters - how long could an interruption last? RTO? How often could it happen? What is the Rate and Expected Duration? (RED)
    * Plot rate vs expected duration, minutes per year vs expected duration. Add additional lines for 100% impact, 50% impact, 5% impact, etc.
    * Nines model comes from mech and civil engineering - physical components have different failure characteristics with no recovery
    * Nines model would suggest better resiliency using multiple DNS providers but in reality you're now dependent on two providers being up.
* Compartmentalization and blast radius
    * Regional and AZ isolation (as in previous talk)
    * Multiple cells within each AZ
    * Then add shuffle sharding across cells
* Simplicity and survival of the fittest
    * What is simple? Not fewest moving parts (unicycle), fewest needed parts (bike)
    * Systems need to evolve over time, eliminate faults over time, best patterns reused
* Constant work and minimizing change
    * Load spikes have all kinds of nasty effects
    * Reducing dynamism in systems makes them simpler
    * Running system at maximum work regardless of load can make it more reliable
    * Classic example: instead of pushing changes to route 53 on every change, push on a fixed schedule
* Testing as time travel
    * "There is no compression algorithm for experience"
    * For testing no substitute for having lots of tests and running them often
    * Automated reasoning to prove correctness
    * Lots and lots of metrics
*  Operational safety
    * Most incidents triggered by changes
    * Safe deployment process is vital - staged deployments at server, AZ, region level. Automated rollback on failure.
    * Cattle vs pets - systems too big to manage by hand. 
    * Automation first. Any lesson learned is turned into a tool/automation
* Technical fearlessness
    * "culture eats strategy for breakfast"
    * Elite teams insist on high standards. No budget for quality, quality is embedded in their approach. 
    * No dumb questions, anyone can be elite with the right support, criticism welcomed
    * High standards -> maintainability/operability -> elite teams -> repeat
    * Low standards -> unmaintainable -> unhappy teams -> repeat

## Scaling on AWS for your first 10 million users

[YouTube](https://youtu.be/yrP3M4_13QM)

Updated version of talk given every year by developer advocates responsible for startups. Not very technical but helpful to see the overall story.
* Journey for startup has changed drastically
* Used to start with single EC2 instance, then split into layers, distribute across AZs
* Frontends now all rich clients based on frameworks like react and flutter. Use AWS amplify to take code in repo, transform as needed and deploy to hosted platform behind CloudFront.
    * continuous workflows, custom domain setup, feature branch deployments, atomic deployments, global availability
* On backend most people now start with managed compute and managed database
* APIs exposed via API gateway, ALB or AWS AppSync (GraphQL)
* AWS App Runner - build/deploy/run containerized web apps and API servers 
* Database - start with SQL databases (Aurora serverless v2) until you need NoSQL
* Gives you a single region, multi-AZ, scalable stack to start off with
* Need to make changes to scale >10K users
* Frontend: tuning, reducing backend calls, caching content more effectively
    * Need to measure before we can tune - CloudWatch/X-Ray
    * ML driven recommendations - DevOps Guru and CodeGuru
* Database: 
    * Add read replicas for read heavy traffic, add RDS proxy to manage connection from large number of instances. 
    * Add caching - ElastiCache
* Backend:
    * App Runner uses ECS Fargate. Limited to 200 concurrent requests per instance and 25 instances per service = 5000 concurrent requests
    * Can squeeze out more by tuning - looking at slow db queries, more caching.
* Overall gets you to 100K maybe 1M users
    * Need more scale than App Runner can provide
    * DB writes start to become a bottleneck
    * Next step is to break system into multiple micro-services
    * Before that can look at DB federation. Keep monolithic app server tier but break DB into multiple DBs by function/purpose
    * At some point will need to look at sharding SQL or shifting to NoSQL
    * In backend tier may need to directly manage ECS rather than using app runner, look at different forms of compute, move from sync to async, look at event driven architectures

## Architecting secure serverless applications

[YouTube](https://youtu.be/A8iHQjHv8nY)

QR codes with links to further reading embedded in each slide

* Shifting responsibility for security to AWS and shift left to developers in your org
* Serverless = small pieces, loosely joined
* Use IAM for access control rather than VPC
* Use least privilege principles
* Serverless means AWS handles more infrastructure security responsibilities
* Lambda: be aware of sandbox reuse during warm start - be careful when storing sensitive data in memory or /tmp
* shift left: defense in depth, secure each component (e.g. using IAM)
* Lambda IAM: function policy controls who can invoke function, execution role controls what function can do
* Start narrow (no privileges) and add stuff. Look carefully at any wildcard * in policy.
* AWS SAM policy templates cover lots of common least privilege cases
* New Lambda function urn that can restrict permissions to a specific function urn rather than anything with the appropriate role
* SQS now supports attribute based access controls (using message attributes)
* Separate secrets from code. Use AWS secrets manager, not environment variables. Can then restrict permission to load secret to your Lambda. Load secret on init or each invoke as appropriate.
* Validate untrusted event payloads. Validate before processing, before parsing. Use strict typing, add additional constraints to open ended types like strings.
* ABAC makes management of large systems more scalable
    * Policy that requires function to be tagged on create
* Permission boundaries allows controlled delegation of policy creation to developers
* Can control Lambda function access to internet by attaching it to a VPC and then using something like AWS network firewall. Expensive/scaling implications - only do if you really need it.

## Designing event-driven integrations using Amazon EventBridge

[YouTube](https://youtu.be/eUjbLFPsATE)

* Event bus - account topologies
* Service's will typically have their own accounts so have to deal with multi-account topology
* Most common pattern, especially when starting out is single event bus (in dedicated account) connected to multiple service accounts.
    * Typically common DevOps team owns the event bus
    * Lots of coordination to manage rules
* Other option is multi-bus, multi account
    * Each service has its own event bus owned by the service team
    * Service team manages permissions for other services that subscribe to events
* In both topologies there is actually an event bus in every account. Receiving teams can add their own rules to their event bus.
* Separation between subscription rules that control what a service is sending to another service and integration rules that control what a service does with incoming events.
* Limit of 2000 rules per event bus
* Same content on coupling as "Building next-gen applications with event-driven architectures"
* An event is
    * A signal that a system's state has changed
    * An immutable object
    * A contract for integrating systems
* Event types: notification events, state transfer events, domain events - Martin Fowler definitions
* Roles and responsibilities
    * One logical publisher for each domain event
    * Consistent boundary between bounded contexts
    * Contract between producers and consumers represented as EventBridge schema
    * Producers responsible for event consistency, conforming to contract, backwards compatibility
    * Producer needs to know who is subscribing to what version of an event
    * Producers should make no assumptions about how consumers are using events
    * Consumers are responsible for specifying events they want to receive, rate at which they process them
* Implementing in EventBridge
    * Producer defines schemas
    * Producer defines policies for who can publish events and who can create rules
    * Producer creates events and owns archive of published events
    * Consumer creates rules that route events to consumer's destination
    * Consumer requests replay of archived events if needed
* Working with sensitive data - could encrypt payload and use policies to control who has access to keys. Better to avoid including PII in events.
* Need some conventions for rule naming to avoid multiple consumers clashing
    * e.g. subscriber domain + target + event source + event type
    * BUT 64 char limit for rule names
* Event uniqueness
    * Consumers need to ensure idempotency
    * e.g. With idempotency key as event id
    * Lambda power tools has utilities for recording response from event processing and returning a duplicate response if invoked with duplicate event
    * Power tools approach only works with near live events as it assumes an idempotency window of 5 minutes (which is TTL for recorded responses)
    * If you have DLQ or replay events from archive need idempotency window >> 5 min
    * Assume that events will be duplicated and where possible handle in business logic

## Best practices for advanced serverless developers

[YouTube](https://youtu.be/PiQ_eZFO2GU)

* Platform team enablement
    * CI/CD pipelines
    * Security guardrails - AWS control tower, policies, permission boundaries
    * Reusable infrastructure as code patterns
* Well architected framework serverless application lens
* Event State
    * Async patterns to reduce latency, improve resilience
    * Use EventBridge
    * "Events are the language of serverless applications"
    * Balance between including additional state in event or having receiver call back
    * Avoid exposing implementation details
* Service-full Serverless
    * Instead of event source -> lambda -> destination use direct service integrations where possible to remove the lambda glue logic
    * Rather than putting all your backend logic in a single lambda, split concerns using api gateway, event bus, queues, STEP, etc. with multiple lambdas each focused on a minimal bit of business logic.
    * Orchestration and Choreography again
    * API destinations in EventBridge can directly call any external API
    * Use lambda to transform not to transport
* Fabulous Functions
    * Asynchronous integration built into lambda for SQS, DynamoDB, Kinesis, ... sources
    * Custom runtimes and lambda extensions for more control over lambda init
    * Only load what you need during init - another reason for small focused lambdas
    * Optimize dependencies. Pull in just the specific SDK components you need, can save 100s of ms
    * NodeJS v3 SDK is 3MB package rather than 8MB for v2. TCP connection use now on by default.
    * Prefer Graviton instances
    * Increase memory allocation if lambda is cpu or network constrained. Lambda power tuner is open source tool to find optimal configuration.
    * Only attach to a VPC if you really need to
    * Use reserved concurrency to ensure you have your share of account limit, prevent overloading downstream dependencies, emergency level to turn off processing
    * Understand quotas and how scale up works
* Configuration as code
    * Automate provisioning
    * AWS has SAM and cDK frameworks
    * IAM access analyzer to check for security problems
    * SAM outputs CloudFormation and now optionally TerraForm
    * 75+ templates out of the box. Serverless patterns collection has many more.
* Prototype to production
    * Think about testing quickly rather than testing locally
    * Use mock frameworks locally rather than complete service emulation
    * Test in the cloud as soon as possible
    * SAM accelerate makes it practical to develop in cloud - build what's changed locally and sync changes with cloud
    * Templates for deploying across multiple environments
    * Use multiple delivery pipelines with shared templates to allow each component to deploy independently 
    * Test in production - deploy to subset of traffic. AppConfig Feature flags, CloudWatch evidently.
    * Canaries - CloudWatch synthetics
    * CloudWatch embedded metrics - auto-extract metrics from log entries
    * CloudWatch logs insights
    * Lots of observability stuff in lambda power tools

## Building real-world serverless applications with AWS SAM

[YouTube](https://youtu.be/jZcS-XRt2Mo)

Same presenter as "Building next-gen applications with event-driven architectures" with the same jokes. Good introduction to SAM if you've never worked with it before.

* SAM basics
* SAM local
* SAM accelerate
* SAM deploy (dev environments)
* SAM pipeline (CI/CD for staging/production)
    * Now supports OIDC authorizer (use GitHub without IAM user)
* Native esbuild support (Node tree shaking)
* SAM connectors to describe how data and events flow between source/destination
* [Serverless Land](https://serverlessland.com/)
    * [Resources for this session](https://serverlessland.com/reinvent2022/svs303)
* Let SAM name your resources
* Use SAM delete for cleanup

## Build your application easily & efficiently with serverless containers

[YouTube](https://youtu.be/MqPxzWqttJs)

* Best tools for low concurrency vs high concurrency applications
* Lambda best for low concurrency,  very spiky load, or high variance in work per request (scales to 0, very responsive, separate VM per request)
* At higher concurrency need to think about waiting for IO. With lambda you're paying while you wait. ECS better for IO intensive workload where you have consistent baseline load.
* Need to understand and set limit on number of concurrent requests per container
* AWS App runner manages that for you on ECS Fargate
* App Runner internally uses Envoy proxy load balancer
* App Runner cost model charges for CPU when there are active requests, but only for memory when no requests (once inactive for 1 minute)
* For highest concurrency run on Fargate directly
    * Choose what load balancer you wnat to use (ALB, NLB or API gateway)
    * Choose your own orchestrator (ECS recommended for serverless)
    * Choose your scaling - Auto Scaling or based on CloudWatch metrics
    * Fargate charges for containers * time, not traffic

## Advanced serverless workflow patterns and best practices

[YouTube](https://youtu.be/o6-7BAUWaqg)
[Resources](https://serverlessland.com/reinvent2022/api309)

Heavy focus on using STEP functions and thinking of everything in terms of workflows.

* Step functions first, step functions always when building app
* How to reduce cost
* Dive into new distributed map feature
* Workflow makes it easy to understand what's happening in serverless system - nice ui for looking at history of requests, failures, etc.
* REST API implemented as express workflow with branch per endpoint
* Use express workflow when possible (much cheaper)
* Need standard workflow if duration > 5 minutes, using wait for callback, need exactly once semantics
* Use hybrid with standard workflow with nested express workflows to optimize cost
* For example steps to transform input, call downstream service, transform output
* Use intrinsic functions to avoid having to call out to a lambda for simple transformations
* Avoid polling loops in STEP using callback pattern and emit and wait pattern
* Implementing Saga using STEP
* Circuit breaker as STEP workflow
* Map-Reduce as STEP workflow
* Limit of 40 on concurrent executions in map phase. New distributed map state supports 10K concurrent.
* In distributed mode can choose whether to run map part as standard or express
* Ability to pass getter for items into the map part rather than querying them all up front (avoids payload limits)

## A day in the life of a billion requests

[YouTube](https://youtu.be/tPr1AgGkvc4)

Deep dive into how IAM implements authentication at a rate of half a billion requests a second. Nothing that you'll be able to use day to day but technically interesting.

* Protocol designed in 2006 before SSL/TLS widely adopted - hence use of explicit signature in request
* Signature includes timestamp to prevent replay attacks
* Implement signature using SHA256 based HMAC. Much faster than public-private crypto. Even quantum safe.
* Developer gets keys from AWS console
* Problem now is how to validate signature at scale
* Original solution was authentication request service deployed in each region. ARS called for each request. AWS SigV2. Doesn't scale.
* AWS SigV4 uses multiple nested hmac customer secret + date + region + service with output from each HMAC treated as the key for the next.
* Allows each level to be cached at appropriate level (global iam, region, service).
* As keys are distributed more widely they have less and less scope
* At IAM scale run into problems with distributing and updating long term key derivatives
* Solution is STS. Short lived token that includes all state needed for authentication. Nothing stored on AWS side when STS issues a token. No stored state needs to be touched to validate token.

## Zero-privilege operations: Running services without access to data

[YouTube](https://youtu.be/kNbNWxVQP4w)

Describes how AWS works internally to restrict access to customer data.

* Shift in industry to pervasive encryption with fine grained permissions and access limited to only what is needed.
* Ideally support and admin personnel have zero access to customer data
* At AWS, customers have to grant explicit access via normal mechanisms for support
* EC2 Nitro - developers and operators have no access to production EC2 Nitro Instance memory
* Consider customer data to be radioactive - never want to see or touch it directly
* Data hosting: strong isolation, defense in depth
* Least privilege: grant access only when needed, only while it is needed, prove that it is needed
* Integrate access auditing into all operational practices - always on accountability
* All network traffic within a between AWS data centers is encrypted with AES256 or equivalent. Always on.
* All storage systems support encryption at rest (guard against physical theft)
* No anonymous shared accounts - use IAM roles instead
* Turn on CloudTrail!
* Internal service to service calls also use IAM and SigV4
* All policies used for internal service to service calls are published
* All changes run through IAM Access Analyzer (prove you need access)
* Access should be highly specific and conditional. IAM "forward access sessions" - on "behalf of access" requires proof that customer has recently called service.
* Contigent authorization - rather than granting user admin access, give them access to run just specific tools.
* Hermetic systems - e.g. Nitro, KMS. Operators have no way of accessing. Root of trust down to hardware. 
* Nitro has own cpu/storage with no access to general instance memory
* Instances never share cores or cache lines
* Nitro enclaves allow customers to create their own isolated sub-instance
* AWS Nitro Whitepaper just released
* Long term research into cryptographic computation

## Optimizing performance with CloudFront: Every millisecond matters

[YouTube](https://youtu.be/LkyifXYEtrg)

Quick intro to CloudFront and summary of new CF features wrapped around a rather garbled customer testimonial. One to skip.

* DDOS attacks handled by AWS Shield - 10K+ attacks per month, 99%+ automatically mitigated
* Customer MapBox talks about their journey
    * 8+ AWS regions active-active behind CloudFront
    * Route 53 location aware latency based routing with failover
    * Use cache policies to make caching more specific/effective
    * Use ETags
    * Resumable byte range requests for large files
    * Offload work on origin for cache misses with origin shield (per region cache)
    * Enable TLS 1.3, faster and more secure than TLS 1.2.
    * Content compression with Brotli. Faster to compress/decompress, 25% smaller. Setup so client gets Brotli if they support, otherwise gzip.
    * Use Lambda@edge to move more logic to the edge
    * Heavy use of analytics derived from CloudFront logs
        * Key metrics: cache utilization, latency, errors, traffic alerts
    * 90% of traffic offloaded to CloudFront
* CloudFront functions (JavaScript) at edge locations, Lambda@edge at regional locations
* CloudFront functions architecture - process isolation within pool of worker instances. JS runtime restricted to prevent external access or other unsafe operations
    * Example scenarios: URL redirects, auth token validation
* New features
    * Server timing headers - W3C standard supported by most browsers. CloudFront adds server timing headers for CF operations.
    * JA3 fingerprinting. Way of identifying caller based on SSL handshake. Can be used to identify threat actors or unusual access patterns. CF can add JA3 fingerprint header to incoming request.
    * CF continuous deployment. Can test new distribution by including specific header, then start moving percentage of traffic to new distribution. Roll back at any time.
    * http3 (udp based) supported on CF with fallback to http2 and http1.

## Create real-time, event-driven apps w/Amazon EventBridge & AWS AppSync

[YouTube](https://youtu.be/zFk-iePwyY8)

* Intro to GraphQL
* Intro to AppSync
* Focus on real-time apps
    * Publish-Subscribe async pattern
    * As it happens
    * Push not polling
    * Milliseconds, not seconds
* Real-time GraphQL subscriptions
    * Implemented using WebSocket connect to AppSync
    * Relies on mutations happening through AppSync. AppSync applies mutation and then pushes out events.
    * Can support out of band request - e.g. direct modification of DynamoDB. You are responsible for reporting the mutation to AppSync (perhaps using lambda with DynamoDB streams) using a "local resolver" so that AppSync doesn't try to update the data source itself and just sends out events.
    * Metrics sent to CloudWatch
* Filtering of events
    * Basic filtering - 5 arguments, simple operators, specified by client in subscription
    * Enhanced filtering - more operators, defined in resolvers, JSON format
* Subscription invalidation (filter to decide when client should be disconnected)
    * e.g. Disconnect client when a delete conversation mutation is received by a chat app
* EventBridge + AppSync
    * EventBridge API destination to connect to AppSync
    * Event turns into AppSync mutation - data persistence is optional
    * Fan out event to multiple targets
    * Rich set of rules and filtering capabilities on both sides
* 10 minute live demo

## Discover Cloudscape, an open-source design system for the cloud

[YouTube](https://youtu.be/4Dvqs8KF9B8)

High level intro

* From 2017 onwards AWS has been trying to standardize on one design system and set of components for AWS console. Now over 90% of console is using CloudScape.
* Open sourced in July 2022
* Usual design system spec as set of design tokens and guidance
* Spacing and margins based on rule of 4
* 68 React Typescript components
* [https://cloudscape.design/](https://cloudscape.design/)
* 27 demos showing how everything fits together in an app
* Theming via design tokens
* Light and Dark modes
* Density modes - comfortable and compact modes
* Responsive UI
* Initial use cases for third parties
    * Product that extends AWS management console
    * UI for hybrid cloud management system
    * Data intensive interfaces in general

## Sustainability in the cloud with Rust and AWS Graviton

[YouTube](https://youtu.be/HKAl4tSCp7o)

Focus on how choice of language stack impacts the resources needed at runtime and hence sustainability.

Fascinating table on energy usage (CPU efficiency) and memory use for common language stacks.

| Language | Energy Usage | Memory Usage |
|----------|--------------|--------------|
| C#       | Low          | Medium       |
| Go       | Medium       | Low          |
| Java     | Low          | Medium       |
| NodeJS   | Low          | High         |
| Python   | High         | Low          |
| Ruby     | Medium       | Medium       |
| Rust     | Low          | Low          |

Presenters didn't want to talk about how the data was derived.

* Deep dive on Rust vs Java
* Static compiled vs JVM
* Stack allocation by default vs heap allocation for most things
* Monomorphic by default vs dynamic dispatch
* Rust focus on zero-cost abstractions
* Rust downsides
    * Heap allocation not cheap or free
    * Need new programming style to deal with ownership
    * No runtime reflection
    * Very limited dynamic library loading
* Experiment getting Rust and Java teams to build same app in each language and compare
    * Tests lots of common frameworks for both languages
    * Tested Java with JVM and Graal AOT compiler
* Initial result - all the Rust versions were much faster, up to 3X
* Java developer rewrote app to use native IO and got Graal compiled version on a par with fastest Rust version
* Still huge difference in amount of memory used - 15MB for Rust, 64MB for Graal Java, 240MB for JVM Java
* Some surprises - reminder to benchmark and measure
* Ran another experiment using 128MB Lambda on Graviton comparing warm start performance
    * [Standard sample](https://github.com/aws-samples/serverless-rust-demo) available in multiple languages (compare vs Java JVM)
    * P50 latency 2X for Java, P99 similar (limited by database latency)
    * Graviton latency slightly worse than x86 at P50, going to 1.5X worse at P99
    * Rust and Graviton both use less energy
    * Java cost 2X that of Rust, Graviton cheaper than x86

## What's new for frontend web and mobile developers with AWS Amplify

[YouTube](https://youtu.be/ejzVeq5tkZE)

* Amplify makes it easy for front end developers to build a full stack app
* Amplify Studio, CLI, Hosting, Libraries
* Long demo of building an app using Amplify
* Amplify provisions backend resources you need
* Model data using GraphQL
* Add annotations to the schema to define auth rules and relationships between entities
* Use CLI to provision backend and auth infrastructure
* Also sets up local project for all your code. Use CLI to push changes to backend.
* Deploy includes GraphQL endpoint based on your schema
* New: GraphQL in Amplify Studio UI, real-time data (filtering, selective sync), in-app messages (push notifications)
* Amplify backend somewhere between backend as a service and self managed infrastructure. The deployed infrastructure is accessible by you and can be extended.
* Three options for building front end
    * Generate react components from Figma designs
    * New: Studio Form Builder UI
    * Use supplied UI components
* Support for React, Next.js, Flutter and many more
* Amplify hosting for static/SPA web apps and now hybrid server-side rendered too
* New: Connect to backend libraries
    * Flutter: Rewritten using Dart so your app ends up with single Dart codebase
    * iOS: Rewritten using Swift. Supports async/await.
    * Android: Rewritten using Kotlin.
    * Authenticator component now available for Flutter and React Native
* Provisioned Architecture
    * AWS Amplify Hosting with content served from S3 bucket via CloudFront
    * Amazon Cognito for login
    * AWS AppSync GraphQL API with notifications via server side filtering
    * DynamoDB database
    * Lambda glue logic + your server side logic

## Building a multi-region serverless application with AWS AppSync

[YouTube](https://youtu.be/bUvTxaqWXXs)

Very focused talk on the main implementation choices when building a multi-region AppSync app.

* Base architecture is standard AppSync setup deployed to two regions with replication between the data stores.
* Two choices for how to build single gateway endpoint
    * Route 53 routing + API Gateway. Doesn't support subscription.
    * Route 53 routing + CloudFront with Lambda@Edge. Lambda resolves DNS to determine region and then updates request headers to specify origin to use.
* Replication choices
    * Active-Passive with failover when needed
    * Active-Active with DynamoDB global tables
* Subscription
    * Without extra work subscription is limited to subscribers in the same region where the mutation happened
    * Need to trigger subscriptions by using DynamoDB streams to trigger mutation with local resolver. Works for both direct and replicated changes to DynamoDB.
* Real-time messaging with WebSockets pub/sub
    * Publish message to EventBridge
    * Use EventBridge cross region routing to forward to other region
    * Event triggers a local resolver mutation in both regions
* Managing region failures
    * Route 53 application recovery controller (see earlier talk)
* API Authorization
    * API keys and cognito user pools are single region
    * IAM and lambda authorizer will work cross region

## Accelerate GraphQL API app development & collaboration w/AWS AppSync

[YouTube](https://youtu.be/LyzNM9KIJSU)

Focus on what's new in AppSync

* Merged APIs. Build time generation of a merged read only (queries and subscriptions) API from multiple independently managed source APIs. Intended for multi-team environments where each team maintains ownership of their own GraphQL API but you also want to expose a single combined graph.
* NodeJs resolvers. Rather than having to use VTL you can now write resolver functions using JavaScript/TypeScript. Uses custom AppSync JS runtime. Like VTL focus is on transformation of request/response payload. AppSync still talks to data source direct. No additional charge.

## What's new with Amazon DocumentDB

[YouTube](https://youtu.be/Eg0tJEAZVhU)

Focus on what's new in DocumentDB

* New regions and instance types supported
* Query capabilities: Geospatial indices, aggregation operators, Decimal128 type
* Management features: storage volumes now sized down when you delete data, fast DB cloning, query auditing with DML, performance insights support
* Elastic Clusters!
    * Previously topped out at 24xl instance type and 64TB storage
    * Elastic cluster will support millions of read/write per second, petabytes of 
    storage, up to 300K connections
    * Compatible with MongoDB APIs for sharding
    * Managed sharding - scaling operations take minutes
    * Each shard is a regular DocumentDB cluster deployed across multiple AZs
    * Routing layer that routes request using hash sharding
    * Critical that you choose a good shard key
