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
