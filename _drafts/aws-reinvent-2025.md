---
title: AWS re:Invent 2025
tags: aws
---

Once again I'm spending the week after re:Invent gorging on [YouTube videos](https://reinvent.awsevents.com/on-demand/) at 1.5x speed. I'm using the same approach as last year to find more nuggets of gold and less corporate filler.

Unlike last year, there's no keynote highlights video, so I'll need to skip through the customer segments and AI hype myself. So much AI slop that lots of interesting stuff was announced in the week *before* re:Invent. 

My focus is on fundamental serverless building blocks for my cloud spreadsheet project: Lambda, S3, DynamoDB, SQS, CloudFront

#  Matt Garman - CEO keynote

I can save you some time here. If you're not interested in AI, skip straight to the last 10 minutes of the keynote.
* 

* [YouTube](https://youtu.be/q3Sb9PemsSo?si=YBxpYTxmzerAXbEt)
* AI infrastructure for AI agents
* Announce: AI Factories - like Outposts for AI, embedded in customer data centers
* Still trying to push Trainium
* Lots of Bedrock inference running on Trainium, 1M chips deployed
* Announce: Trainium3 UltraServers
* Announce: new Mistral AI models
* Announce: Amazon Nova 2 models, pushing price performance angle
* Announce: Amazon Nova Forge, train a custom model by combining your domain specific data with Nova general training data, then run through the standard Nova training process. Then deploy on Bedrock. Claim that this is much more effective than post-training, RAG, etc. 
* Announce: Policy in AgentCore, policies for managing what AI agents can do, sits between AI agent and data/tools.
* Announce: AgentCore Evaluations, inspect agent quality based on real-world behavior, correctness, helpfulness, safety
* Announce: AWS Transform Custom, customize AWS Transform AI migration tool to understand your custom languages, frameworks, etc.
* Announce: Kiro Autonomous agent, more Autonomous, Scalable, Long-running than current Kiro agents. Context maintained indefinitely, rather than session based.
* Announce: AWS Security Agent, scans code and design documents for vulnerabilities. On-demand pentesting.
* Announce: AWS DevOps Agent, investigates incidents, access insights from observability tools, maps resources, identify root cause, recommend CI/CD guardrails to avoid same problem again
* 25 announcements in 10 minutes
* Announce: New compute instances x8i, x8aedz, c8a, c8ine, m8azn, m3 ultra, m4 max
* Announce: Lambda durable functions
* Announce: S3: Max 50TB object size, batch 10X faster, Intelligent-tiering for S3 tables, cross-region replication for S3 tables, S3 access points for FSx for NetApp ONTAP, GA for S3 Vectors
* Announce: GPU acceleration for vector index creation in OpenSearch
* Announce: EMR serverless no longer requires storage to be provisioned
* Announce: GuardDuty support for ECS and EC2
* Announce: GA for SecurityHub
* Announce: Unified data store in CloudWatch using S3 tables
* Announce: RDS: 256TB max size for SQL Server and Oracle DBs, optimize CPUs for SQL server, support SQL Server developer edition, database savings plans

# Werner Vogels - CTO keynote

* [YouTube](https://youtu.be/3Y1G9najGiI?si=rPE3gXkyRn0BYEEY)
* Back to the Future, time travel opening video looking at all the previous times programmers were about to become obsolete
* Werner's last keynote - got better things to do at AWS
* Normally find Werner's keynotes interesting and though provoking. Think he's running out of steam. This year's was ... OK.

* Will AI take my job? ...maybe
* Will AI make me obsolete? ...No, if you evolve
* Comparing progress in the Renaissance to how engineers need to think
* Renaissance Developer Framework
* 1. Curiosity, experimentation, willingness to fail
* Yerkes-Dodson Law - learn the most when you're under some level of pressure (not too much)
* 2. Think in systems, not isolated parts
* Dynamic systems are shaped by feedback loops
* Donella Meadows: [Leverage Points: Places to Intervene in a System](https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/)
* Need to understand the bigger picture
* 3. Communication of thinking is as important as thinking itself
* AI tools replace precise language of programming language with ambiguous prompts
* Specifications reduce ambiguity
* Plug for Kiro - spec driven development
* AI for rapid prototypes, many prototypes with different types of spec
* Feature driven specs: Requirements, Design and Task documents. Mirror how you would plan development before AI.
* Prompt -> Spec -> Tweak Spec -> Generate code
* 4. Developer is an owner. Developer owns the quality of the software, whatever tool they're using.
* Will spend less time writing code, more time reviewing code
* Verification Debt: AI generates code faster than you can understand it
* Hallucination: AI generates something that looks plausible but isn't what you really want
* Spec driven development, automated reasoning, automated testing all help
* Need mechanisms to convert good intentions to good outcomes. e.g. Code reviews, durability reviews, stop ship defects
* Keep doing human-to-human code reviews. Best ways of learning, transferring knowledge
* 5. Developers need to be polymaths
* Expand your knowledge, depth and breadth of understanding
* Unique mix of personal, functional, industry skills
* Expert in field but enough understanding of larger scope

# Breakout Sessions

* Filtered to 300 and 440 level talks, tagged Breakout or Builders session
* Looked at Lambda related talks first as Durable functions only interesting announcement at re:Invent

# Deep Dive into AWS Lambda Durable Functions

* [YouTube](https://youtu.be/XJ80NBOwsow)
* Current state Lamba for stateless, short-lived compute, Step functions for cross-service orchestration and EventBridge for event-driven architecture
* How do you do application logic orchestration?
* Assertion: What developers really want is to write code like it's a monolith (everything in one place) but deploy like it's microservices (decoupled, independent scaling)
* Do it all in Lambda environment using durable functions, including local development and testing
* Durable function is a regular Lambda function (same resource type, same deployment model) with super powers (flag on creation to make it durable)
  * Checkpoint: Save progress and suspend execution
  * Replay: Rerun Lambda function after suspension, interruption or failure BUT can skip over previously checkpointed steps (load saved state)
  * SDK: Extends Lambda event handler with durable functions like "steps" and "waits"
* Max lifetime is one year

```typescript
export const handler = withDurableExecution(async (event: {orderId: string}, context: DurableContext) => {
  const validated = await context.step("validate-order", async () => {
    return orderService.validate();
  })

  await context.wait("wait 5s", { seconds: 5 })

  ...
});
```

* Start by wrapping your event handler with `withDurableExecution` which gives you access to a `DurableContext`
* Then use context to execute steps and wait for things to happen
* Step names appear in console / debugging tools
* Checkpoint and replay flow
  * Checkpointing of each step in your workflow, tracing progress. Whatever you return (if anything) is checkpointed.
  * Automatic retries with backoff and jitter for failing steps
  * Idempotency/Deduplication to ensure only one instance of durable function is running at a time
  * Replay ensures same version of function used as first invocation
  * Wait for time or callback from external service or condition met (e.g. via polling remote service)
  * On hard failure can apply compensation pattern ("saga"), and undo earlier steps with same durability guarantees
* Parallel - creates child context and executes any steps on that child context in parallel
* Wait for callback - you get given a callback id to pass to some remote service. When service has done whatever it needs it calls a new Lambda callback API, passing the id, which then restarts the durable function.
* Kiro works really well due to standardized structure of durable functions
* NodeJS, Python and OCI runtimes supported at launch
* Async invoke (e.g. event driven) can live upto a year, direct invoke is still limited to 15 minutes (makes no sense for caller to hang on the line for longer)
* However, within that 15 minutes function is durable, so retry will connect to same instance
* "ExectionName" parameter used to deduplicate repeat invokes of same instance, ensure only one runs
* Durable invokes - call another lambda function and calling durable function waits for completion
* Event Source mappings still synchronous (15 minute) limit so as not to break concurrency controls. Can call a normal Lambda that then does an async invoke of durable lambda.
* All existing service integrations (e.g S3, EventBridge, API Gateway) "just work" the same way they do for normal lambda
* Important that you use versioned Lambdas so that replay is deterministic
* x86/ARM architectures, DLQs, Layers and extensions, VPC attachment, concurrency settings, SnapStart, Powertools all supported
* Security: New policy to enable use of durable functions and step/wait primitives
* Checkpoints encrypted at rest. At launch only AWS managed keys supported
* `context.logger` is replay aware so don't get pointless duplicates on replay
* X-Ray, CloudWatch metrics, EventBridge monitoring
* Quotas
* Best practices
  * Start simple
  * Bundle SDK using a package manager
  * Prime LLM agents to make them aware of durable functions
  * Align function and durable execution timeouts (function timeout applies to each step)
  * Wrap non-deterministic code and side effects with steps
  * Use `context.logger` replay aware logger
  * Use SDK concurrency primitives (e.g. async/await) for deterministic execution/replay
  * Use your own (de)serializer for large payloads and encryption
  * Lots more in developer guide
* Pricing
  * Durable operations (steps, waits, callbacks) at $8.00/M
  * Data written (persisted from durable ops) $0.25/GB
  * Data retained (during execution and afterwards) at $0.15/GB-month
* Step functions vs durable functions
  * Orchestrate across AWS services vs orchestrating at the application level
  * Whichever you like better

# Secure Multi-Tenant SaaS with AWS Lambda: A Tenant Isolation Deep Dive

* [YouTube](https://youtu.be/FWxwfcI7FTA)
* Recently launched Tenant Isolation feature
* SaaS with per tenant environment vs shared environment
* Noisy neighbours problems
* How Lambda handles concurrency and scaling
* Lambda isolation using Firecracker VMs
* Every function instance has dedicated vCPU, memory, network bandwidth and virtual disk
* Execution environments share *nothing* across different functions
* Execution environments share environment variables, IAM roles/permissions, code across instances of the same function, shared context
* Multi-tenant SaaS application will have instances of a function for different customers running in the same execution environment
* App responsible for making sure that data can't leak between tenants that reuse the same execution environment
  * Function-per-tenant model. Define a separate copy of function per tenant. Good isolation but complex CI/CD/operations. Custom routing layer.
  * App framework/business logic that tries to enforce isolation. Simple CI/CD/ops but easy to screw up if you get business logic wrong. Noisy neighbours issues. Ensuring that shared context is clean when switching tenant. 
  * Tenant Isolation Mode - Lambda will create dedicated execution environments for each tenant
* Flag when you create function to enable tenant isolation mode
* Need to provide `tenantId` parameter when you invoke instance of function, at API level passed as `x-amz-tenant-id` header
* Tenant id passed through to function when invoked
* Id is just a label, arbitrary alphanumeric string up to 128 chars. No need to pre-register. Unlimited number of tenants.
* Will get per-tenant cold starts as execution environments no longer shared
* Concurrency quotas still apply, provisioned concurrency not supported, direct invoke or via API gateway only
* TenantId automatically injected as property into JSON based logs
* In CloudWatch each Lambda function gets own log group and each execution environment gets own log stream. How it's always worked. Now those streams are tenant specific. Each tenant will have one or more log streams, tagged with tenantId. Can setup filter to see logs for specific function and log streams with a particular tenantId.
* For other observability providers include tenantId as another dimension
* API Gateway integration - configure mappings between tenant id in incoming API request to AWS header
* Incoming tenant id can be anything you want - header, request parameter, request path, request body, authorizer id, authorizer custom property, domain prefix, ...
* Sample code for JWT authorizer
* Noisy neighbors by setting per tenant request limits in API gateway
* Lambda security model uses per function execution role to decide what resources function has access to. Function level not tenant level.
* API gateway allows you to implement custom authorizer. e.g. validate JWT token, apply app policies/usage limits, retrieve tenant-scoped short-lived credentials from STS, propagate to Lambda
* Function invocation now has some shared function level permissions + fine grained tenant specific permissions
* For example, can have per-tenant S3 bucket and infrastructure level enforcement of access limits

# From Trigger to Execution: The Journey of Events in AWS Lambda

* [YouTube](https://youtu.be/4zFJ3zDWgeM)
* Part one: Lambda fundamentals
* Deep dive into how each invoke model works, lots of detail and high speed
* Lambda managed instances - announced Sunday? Get to choose which specific instance type your Lambda runs on. Reserved instances, savings plans.
* Invoke model - synchronous request/response (ALB, API Gateway), asynchronous event (S3, EventBridge), event source mapping batch processing stream/queue (Kinesis, SQS)
* Async event puts messages into internal Lambda managed SQS queues with a fleet of pollers which retrieve message and do a sync invoke. Rely on SQS semantics to retry on failure. 
* Event source mapping is very similar, but your queue that Lambda managed pollers connect to and do sync invoke. 
* Queues and streams are different (streams are ordered)
* Long list of special cases handled for you
* Provisioned mode gives you control over how many pollers there are and how they scale up and down
* Filtering of messages before Lambda invoke so only pay for things you're interested in
* Batching to improve efficiency
* Scaling: For stream want to go as fast as you can, for queue want to scale within safe limit that won't overwhelm downstream services
* SQS event mapping has two error mechanisms. SQS DLQ for repeated failures to process message, Lambda invoke failure for throttling/network issues

* Part two: Lambda as queuing service
* More philosophical - skip this if not interested, presentation kind of garbled
* Lessons from queue theory: Buffers smooth variance, specialize workers for different workload types, control variance to prevent instability, coordinate shared resouces through centralized control
* Look at event invoke architectures in even more detail through queue theory lens
* Shuffle sharding over a set of SQS queues
* Separation of pollers and execution environments due to different workload types
* Control / Data plane separation
* Stability controls - reduce variance, control capacity, admission control, back pressure
* Failures and Recovery

# The Art of Embracing Failures in Serverless Architectures

* [YouTube](https://youtu.be/hSkElcxjdfs)
* Engaging talk about handling failures. Goes back to fundamentals but also includes specific, actionable advice.
* Serverless architectures are still computers connected by a network underneath. All the same failure modes still exist, but manifest in different ways.
* Fundamental way of handling failures in distributed systems are timeouts and retries
* Example: Data -> Kinesis -> Lambda. Retry logic built into SDK.
* Retries are fundamentally selfish. My call is more important than anything else.
* Retries can cause cascading failures, especially if failure because system is close to capacity
* SDK retries only "retryable" failures, up to 3 times, with exponential backoff.
* Request across a network can fail with no why of knowing whether request or response was lost. Timeout after which you assume request has failed.
* Original JS SDK default timeout is two minutes! Latest version is infinite!!
* Make sure you configure appropriate timeout. Choosing right value is difficult.
* Timeout that's too short can lead to retry storm
* Other failures related to service limits and throttling
* Serverless can scale almost indefinitely but subject to limits
* Kinesis batch operation can return partial failure if service limit exceeded, part of batch succeeds, rest fails
* Need to understand failure cases for each service, which are retryable and what you need to do
* Lambda polling from Kinesis can result in large number of concurrent lambdas. Easy to hit Lambda concurrency limits. Even worse, limit is per-account so can cause unrelated Lambda to fail.
* Lambda batch processing failure default behavior is to retry repeatedly until data expires. Disaster if there's a poison pill record. Also reprocessing all the other good records. Even worse, no other records in shard will be processed.
* Once bad data expires, can resume processing. But next record probably also just about to expire. Can end up losing loads of data due to single bad record.
* At minimum, limit retries. More advanced, bisect batch to isolate and report bad record while processing the rest.

# Amazon S3 performance: Architecture, design and optimization

* [YouTube](https://youtu.be/JNN5Aw5kVFI)
* Leveraging S3 architecture to achieve high-performance
* Optimizing for high-throughput
* Use S3's scale to your advantage
* 500 trillion objects, 100s of exabytes, 200M rps
* 3 main subsystems: Front end request routing and processing, index mapping metadata to object bytes, durable storage of object bytes on disk
* Faster upload throughput by using multipart uploads to parallelize writes + faster recovery from network issues. Can upload object as you create it.
* Parallelize reads using ranged GETs. Can read what's there even if part way through multi-part upload by using ListParts and then ranged GET on parts.
* Spreading request across S3 fleet. Want the connection for each part to go to different IP address for greater resilience. DNS queries for S3 return multiple IP addresses. Rather than just using first, use all of them. Also, on failure can fallback to another. Latest AWS SDKs do this for you.
* AWS Common Runtime - Best practices baked in
* CRT has configuration for target throughout in Gbps. Easy way to match level of parallelism to available bandwidth on current instance

* Managing concurrent requests
* S3 prefix - parts of object name delimited by separator (looks like a directory but isn't)
* Application can achieve at least 3500 PUT/s or 5500 GET/s per partitioned S3 prefix
* As S3 detects load, it partitions data on prefix. The more different prefixes, the more you can scale. While S3 scaling out, can see 503 errors.
* Careful how you structure things
* Common mistake is to have top level prefix by day (or some other time period). Create and process lots of data for day1, then repeat for day2, etc.
* All partitions created for day1 are unused on following days. Need to do same scale out process for day2, with 503 errors likely again. Keep on repeating.
* Want to use a prefix structure which reuses partitions once they're created. Push day to right end of object name.

* Amazon Express One Zone
* Super fast object storage. Single digit millisecond access, 2M GET/s per directory bucket, 10X data access compared to S3 standard
* Use case is large data processing where high durability isn't needed. e.g. ML training, caches, interactive querying, media streaming.
* Architecture co-locates storage with compute in single AZ, special purpose S3 directory buckets for high transaction rates, session based access for faster auth
* Access from same AZ faster, but cost same from other AZs
* Directory bucket has high scalability up front, doesn't rely on prefix based scaling
* Directory bucket is hierarchical (actually is directories) rather than normal buckets flat namespace. Better performance when listing.

# Deep dive on Amazon S3

* [YouTube](https://youtu.be/S4swTRi1i0w)
* Looking at S3 design for availability
* Availability = dealing with failure
* Need to look at failure through physical view. Drives & servers. Racks & buildings. Overload & network. Transient & permanent.
* Dealing with it means meeting design goals. 99.99% availability, 99.999999999% durability, strong read after write consistency.
* What had to change to achieve strong read after write consistency?
* Metadata stored in index system. Most queries are metadata queries. Quorum based storage. Reads/Writes need to succeed on majority of storage nodes.
* Originally not read after write consistent because metadata is heavily cached
* Made it consistent by implementing cache coherence using a replicated journal. 
* All writes go to journal before storage node. Write to any journal node, which propagates sequentially through all other journal nodes and final one writes to storage.
* Journal enforces strict ordering. Writes are assigned a sequence number. Storage nodes apply changes by reading from journal and keep track of last sequence number applied. Reads from index include latest sequence number.
* Caches store sequence number of each cached value. Before returning a value they check whether any writes have been applied with higher sequence number for that value.
* Separate Witness service keeps track of key + sequence number for each value. Stores conservative approximation. Always safe to say value is stale.
* Now consistent but less available
* If journal node dies, system is down.
* Added dynamic reconfiguration. Gossip with neighbors. If problem detected request reconfiguration to replace failing node. Another quorum based system.
* Now consistent and available. 
* Overall high availability: Need many servers to choose from, while only required to succeed on some, with ability to reconfigure quickly on failure, always a quorum based algorithm somewhere.

* Failure at implementation level
* Identify failure domains and correlated failures
* Server failure => correlated failure of all drives on that server, similar for rack and AZ failures
* Deployment waves to avoid correlated failure if deploy is bad
* Fail-stop failures. Power outage, total host failure. Simple to detect and react to. 
* More complex for high dependency failures. e.g. Switch between AZ1 and AZ2. Now see intermittent failures for requests between AZs.
* Can convert availability problem into latency problem by re-routing requests via AZ3.
* Fail-stop failures in stateful systems can create novel states. e.g. Torn writes. Need to think about crash consistency.
* Grey failure. Server doing something weird, maybe due to downstream issues. Retry but make sure you hit different server (different IP).
* Retry cascades amplify work (e.g. 3X retry at each level). Need to be aware of overall system when deciding whether retries are appropriate.
* Timeout and retry slow request. Lots of wasted work. End up with every request in queue timed out by caller, congestive collapse. Metastable failure.
* When service under load can switch to LIFO stategy so at least some useful work is done. Client can use backoff and jitter when retrying. 
* Self-healing systems. At S3 scale remediation has to be automated.
* Health check server which can take failing servers out of service (update DNS)
* What if health check server goes bad and tries to take every server out of service? Use multiple health check servers and only take something out of service if a quorum agree that it's bad.
* We never make local decisions about health of distributed system.

# An insider's look into architecture choices for Amazon DynamoDB

* Not so much about the specific choices, more about how choices are made, help your team make choices for you application
* Tenets: Context for team, shared understanding, priorities, how decisions are made
* DynamoDB Tenets: Security, Durability, Availability, Predictable low latency (in that order)
* Core concepts for distributed systems - multiple servers, replication, failure, coordination, routing. Confusingly presented as argument between the presenters. 
* What choices did DynamoDB make for Routing, Metadata management, Limits?
* Routing
* Request goes to random request router via DNS and load balancers, spread across AZs with dedicated load balancer per AZ
* Storage nodes have 3 replicas spread across 3 AZs
* Correlated failures more likely across AZs, could lose load balancer, request routers and one storage node
* For availability want to spread requests across AZs: e.g. router in AZ1 calls storage in AZ2
* For latency want to keep with AZ. Requests to AZ1 LB go to routers to AZ1 and take to storage node in AZ1
* "Split horizon" DNS prefers addresses in same AZ as caller
* Have to go cross AZ in case of failure. e.g. If router goes down in AZ2, LB has to send requests to AZ1 and AZ3. Static stability planning ensures each AZ has enough spare capacity provisioned to handle it's share of extra traffic if an AZ goes down.
* What if one AZ receives significantly more traffic than others? Lots of DNS magic to try and keep it balanced. If too much traffic enters, LBs will send to other AZs to balance. 
* Lots of complexity at database level to keep traffic balanced to storage nodes given different requirements for strong and weakly consistent reads for which storage nodes they can talk to. 
* Metadata Management
* Router has to validate caller identity, check caller has access to table, check you're within limits, work out which storage node cluster owns table, work out which partition within cluster you need to access
* Storage node has to enforce rate limiting, retrieve right encryption key from KMS
* Design goal is to do all of that within 10s of microseconds
* While also coping with partition create, move, split and delete
* Metadata system has to handle huge load
* Could add cache to request router but now have situation where large fleet of servers is driving requests to small fleets. Very dangerous. If caches go stale, metadata system falls over.
* Added another layer of cache. Central, scalable, MemDS caching system. Control plane and storage nodes push updates to MemDS. Request routers still have local caches in front of MemDS.
* Eventual consistent cache on top of eventual consistant cache.
* All MetaData is versioned. Storage nodes are ultimate source of truth. If request router uses v20 cached metadata to talk to storage node it can tell router that's out of date and tell it where it moved partition to.
* Hedging. If router has local cache miss, it makes two requests to different MemDS servers and uses first returned.
* Constant work. Even if there's a local cache hit, make two requests to MemDS in background. Ensures MemDS can handle it if all caches go stale. 
* Long-lived connections. Request router is caching data. Want high chance that more requests from same client use same request router. More DNS tricks + right sizing pool of routers.
* Limits
* Limits exist to ensure predictable low latency given physical hardware constraints
* 1000 write unit, 3000 read unit limit per partition
* Why transaction and item size limits? Predictable low latency.
* Secondary indexes limited to 20 because of replication lag impacting latency.

# Dive deep into Amazon DynamoDB

* Deep dive through the lens of two real world customer problems
* Really engaging presentation

* The curious case of the throttled table
* Unexpected write throttling
* System to manage collection of survey data
* Legacy RDBMS system rewritten to DynmamoDB. Legacy system handled 600 TPS peak.
* New system needs to handle 45000 TPS, seeing throttling 800 TPS
* Workflow: read a table and write to three tables
* Privacy important. Separate PII and survey response tables, each with a random id (PiD,SiD). Tied together by entry in RandomID table (PK=PiD,SK=SiD) with restricted access. One way hash to map random id -> national user id.
* App workflow: Generate random id (PiD,SiD pair), record PII and survey, update nation id to store hash(Pid,SiD)
* Tables are scaled, PKs are high cardinality and random. How can this possibly result in write throttling?
* RandomID and NationalID tables have GSIs. Hash -> nationalId, SiD -> PiD.
* Item sizes are 500 bytes for PII, 2K for survey, 400 bytes for NationalId. All small.
* Random Ids are generated in advance and populated in table. Statutory requirement to verify all ids are unique. Microservice that returns the next unused id by progressive paginated scan.
* Where is throtlling? It's on the PII table.
* DynamoDB scales horizontally, hash based partitioning of tables. Compute hash of primary keys, stored in sorted order, then partitioned.
* Hash needs to be fast, have even distribution, be deterministic, avalanche (small change in value results in big unpredictable change to hash)
* Problem is that RandomID and PII table have same PK AND pre-populating RandomId table stores them in sorted order on hash(PiD). 
* Each id you retrieve has hash(pid) close to previous value. When you insert into PII table, you choose partition based on hash(pid). All your writes go into the first partition, then you move on and they all go into second partition, etc.
* Unintended consequence of global deterministic hash. If hash was table specific wouldn't have been a problem. Intend to fix this in future.
* Simplest fix for customer was to make hash for PII table different by adding a fixed prefix character to the PK. Avalanche property of hash function means hash value very different to that on RandomId table and now writes are randomly distributed.
* Now AWS know about this problem, find it's surprisingly common, at least a couple of support incidents a year
* Debugging throttling: Use throttled-keys-only with CloudWatch Contributor Insights (much cheaper than logging everything), new error codes with actionable detail
* Multi-attribute keys for GSIs remove need for funky synthetic keys

* The bizarre latency conundrum
* Customer that ran a big batch process once a day. Huge 2000X spike in traffic while process running. Low traffic interactive app rest of the time.
* Latency is low and predictable during the batch process. Latency is high and unpredictable the rest of the time!
* App has a few thousand app servers all accessing DynamoDB, enough to handle batch process load
* Simulated similar traffic pattern and got same result.
* Requests routed to LB -> Request Rooter -> Storage Node
* Each request needs metadata which is cached
* If connections are long lived and hit same router, get the benefit of cache
* Problem is the 2000X difference in load. During batch process all app servers are busy, same app server makes multiple requests using same connection, gets the benefit of caching. Rest of the time, app servers are barely used. 10 TPS total. 
* Customer over-provisioned for static stability and future plans.
* Solution: Send interactive traffic to a much smaller number of app servers.

# DynamoDB: Resilience & lessons from the Oct 2025 service disruption

* Security, Durability, Availability, Predictable Low Latency
* Oct 20th failed to meet standard on Availability
* Correction of Error post mortem
* Sharing Lessons Learned
* DynamoDB was root cause of wider scale disruption
* Problem was DNS returning zero IPs for clients wanting to connect to DynamoDB -> failure to connect
* How DynamoDB uses DNS
* Everything gets harder every time you scale up an order of magnitude
* e.g. Single LB -> multiple LBs, multiple instance types across fleet rather than all the same.
* 100s of LBS per region, 1000s of instances behind each LB.
* DNS here is resolving dynamodb.us-east-1.api.aws
* During event DNS query was successful but returned zero IP addresses
* Control plane updates DNS records as load balancers added/removed/updated. Each LB has a weight. Some LBs can handle more traffic because they're on a bigger instance type. Automated process for updating weights as LBs change.
* Automated failure handling using health checks to remove unhealthy LBs. For partial failures (e.g. overloaded LB), reduce weight.
* Latency is important. Try to route client requests to geographically close LB.
* DNS Management System per region
* Planner that looks at state of system and decides how to adjust DNS setup
* Plan is JSON versioned file written to S3
* Enactor reads plan and updates Route 53
* Enactor is designed to be bullet proof, minimum dependencies, keep working if other things break
* Three independent instances for redundancy. Update process is idempotent so doesn't matter that they all do the same thing.
* Should all work fine but hard to reason about. Decided to add a lock. Pattern used a lot in AWS. Everyone else uses DynamoDB to implement the lock!
* Dependencies are S3 and route 53. Don't want to add more. Can we use route 53 to implement lock? Use presence of TXT record as lock.
* TXT record includes instance that holds lock and time stamp to show progress being made.
* Locking protocol is to delete record and then recreate with new timestamp (single transaction). Delete will fail if existing record isn't what you expect (someone else has lock). Works great.
* If someone else holds lock, you backoff and retry. 
* Building DNS alias tree: dynamodb.us-east-1.api.aws -> plan-101.ddb.aws -> lb-1, lb-2, ...
* On change build plan-102 tree and then point top level alias at it when you're happy. Rollback is easy if you later find plan is back.
* Id for each record is a UUID. Nightmare for debugging ...
* Lots of different top level endpoints, each with their own TXT record lock (simplest way to make it work in DNS).
* Bug is a race condition between installing new plan and cleaning up old records
* Repeating pattern. Two enactors try to grab lock at same time. One backs off. Other enactors get through several rounds of updates.
* Backoff expires. Get unlucky. Same thing happens multiple times, with same enactor backing off. Backoff protocol (exponential?) causes it to fall further and further behind.
* Eventually enactor gets the lock and installs a very stale plan, older than thought possible.
* Record cleaner removes really old plans
* Race between enactor 1 wanting to clean up old records after install plan 145, enactor 2 wants to install plan 146 and enactor 3 wants to install plan 110
* Enactor 3 installs plan 110 and then enactor 1 immediately deletes it because its too old, leaving top record pointing at nothing
* Installing old plan is OK because its an eventually consistent system, will soon write a newer plan on top
* Problem is that system (top level pointing at nothing) is an inconsistent state. Protocol for writing new plan fails.
* Mitigation
* Hundreds of alarms go off. One pointed directly at root cause but got lost in the noise.
* All internal recovery procedures/tools assume that enactor can be used. Enactor is what broke.
* Updated internal tooling and fixed DNS after 2.5 hours
* Long recovery due to cached bad data
* Froze DNS update in other regions
* Fixed race after two days, rolling deploy over following week. DNS automation re-enabled.
* Lessons learned
* Splunking around in logs. So much cruft built up over the years. No nice neat audit trail.
* Used AI (Amazon Q) to extract cause and effect, build up timeline of relevant events.
* Testing races is difficult. Unit tests pass almost all the time.
* Use formal modeling to validate protocol. Didn't have one for enactor. Used Q to speed up production of a model in time to validate fix.
* Found original design was actually correct, implementation had diverged from design over time.
* Used Q to find deviation of actual code with formal model. Fixed problem. Q validated that code now consistent with model.
* Isolation: One DNS update had region wide impact. Some parts of DynamoDB have cell based architecture. Can we extend that to DNS?
* Cell based architecture needs a way to route requests to the right cell. Usual way is to add a cell router at the front end. 
* Downside is that cell router and DNS are both regional. For most services this is OK.
* At scale of DynamoDB makes sense to have per cell DNS endpoint and DNS configuration
* Use CNAME entries per customer (accountid.ddb.region.api.aws) that point at specific cell
* Needs everyone on latest SDK to enable
* Fundamental trade off of isolation vs global knowledge
* More complex system tends to fail more often. Is it worth adding more complexity for more isolation?
* Turns out generating plans way more frequently than needed
* Maybe divide updates into stuff that can happen more slowly and stuff that has to happen immediately
* But maybe better if you're exercising common path all the time. Lots of trade offs to consider.
* Separation between planner and enactor really nice pattern. Can freeze generation of new plans in a crisis. Think about what you can freeze in your system.
* Understand your dependencies and which are strong dependencies (must be there) and weak dependencies (won't cause request to fail completely if down)

# Wrangling chaos: atoms of emergence

* [YouTube](https://www.youtube.com/watch?v=60bqVu2HEOw)
* Level 500 Chalk Talk. Not recorded at re:Invent. Colm MacCarthaigh ran the same session on Twitch after re:Invent and made a YouTube recording available.
* Emergence: Complex property that emerges from what should be a simple system
* Scope is request/response distributed systems
* Control system theory useful for achieving a stable system
* Have a target value and current value. Difference between the two is the error. Control system should make changes proportional to the size of the error.
* Controller works better if it takes into account the history of the error (effectively the integral of current value over time). cf. Energy integral in heat pump controls.
* Final refinement is to add adjustment proportional to the slope of the error (effectively the derivative of current value over time).
* Control theory says you need all three for system to be stable. This is a PID controller.
* Problem is sudden shocks. Classic example of car going down hill in icy weather. Put foot on brake to slow down. If you push too hard, wheels can lock up and the car speeds up. Have to take foot off brake.
* Similar problem can happen in request/response systems in overload conditions. Common approach is to start throttling requests if you detect overload. Sometimes that can make things much worse.
* In real world systems requests don't come in randomly, usually correlated. 
* e.g. Clients often make a chain of requests (abandon when one fails), with a retry loop around them.
* Graph of number of requests vs throttling rate (percentage of requests that are rejected). No retries.
* Binomial distribution with all requests in chain made at 0% throttling and 1 request made (the first in the chain) at 100% throttling. As you increase the rate of throttling the number of requests made goes down. Exactly what you'd expect.
* Simulate chain of calls with up to two total retries. Makes all requests in chain at 0% throttling, and 3 requests at 100% throttling (initial request + two retries). In between you get a weird graph where the number of requests goes *up* as you start throttling until about 35% and then drops.
* Bad news for a control system if error sometimes goes the wrong way.
* Map out all possible patterns of requests for chain of 3 with up to two retries. Get an asymmetric histogram with least common at the edges (two ways to get 3 and 9 requests), peak at 6 requests (10 ways), with more ways of getting 7 or 8 than 4 or 5.
* Weird graph is effectively this request distribution * basic binomial distribution
* In real world developers tend to add more retries. e.g. Adding retry loop around the whole request chain. Effect is to make the peak number of requests more pronounced and to require a higher rate of throttling before request rates come down. e.g. 60% for chain of 3 with up to 2 retries for individual request and up to 2 of whole chain.
* Counter-intuitive result. Throttle 50% of requests in real world system and you will probably see *increased* load.
* Can completely fix this with small tweak to throttling logic. Instead of throttling requests randomly, throttle entire client. Either all requests from a client are throttled or none of them are. 
* Or fix on client side using global token bucket for all requests on client (implemented in AWS SDK).
* Crazy that CS degrees don't include control theory. Book recommendation: Designing Distributed Control Systems.

* Triggers for metastable behavior
* Caching. In normal usage only small proportion of requests go to origin. If cache restarts, they all do. Often origin can't keep up. Simple fix is to always call origin (cache just used to improve latency). Saw this with DynamoDB. Alternative is some sort of back pressure system to slow caller down.
* Layers. Eg. Front end -> middleware -> Storage. Retry amplification from retries at each layer. Clients give up, server side retries keep going, making it even worse when clients retry.
* Can mitigate with back pressure, smaller timeout value for each successive layer, switch to LIFO queue of requests when system gets overloaded, idempotent requests so that retry can use result from prior request.

# A tale of two transactions

* [YouTube](https://youtu.be/SNnUpYvBfow)
* Marc Brooker comparing Aurora DSQL and Aurora PostgreSQL by looking at how transactions are handled in each system
* Isolation levels are a trade off between where we add complexity for application programmers: achieving correctness or achieving performance.
* Stronger isolation -> easier to achieve correctness but lower concurrency, lower throughput, high availability is hard. Very dependent on traffic patterns.
* Weak isolation -> in theory get better concurrency and performance but in practice dealing with correctness issues at application level makes it even slower.
* Coordination is needed for isolation. Different implementation approaches can reduce or move coordination but can't avoid it.
* Snapshot isolation is sweet spot?
  * Never see uncommitted data
  * Reads are repeatable
  * Reads all come from a single logical point in time
  * Conflicting writes are rejected
  * NOT serializable
* Snapshot isolation cost depends on number of writes
* Serializable isolation cost depends on number of reads and writes
* Serializable pushes complexity onto application programmer as they have to minimize number of reads in a transaction to achieve good performance / avoid contention
* Relative performance of different isolation levels depends entirely on your application's data access patterns. No panacea.
* Aurora PostgreSQL vs DSQL for snapshot isolation
* PostgreSQL uses MVCC. Version of each row for each transaction. 
* Needs to keep track of all versions between lowest xid (all lower are committed) and highest xid (all transactions higher still running)
* Lots of global coordination needed - fine for single server implementation
* DSQL does all coordination at commit time
* Both: No need for read locks, readers don't block writers, writers don't block readers
* DSQL: Clients can't control lock-hold times, no need for long-lived locks at all, lower latency (coordination only at commit)
* PostgreSQL: Earlier knowledge that a transaction can't commit (less wasted work), no transaction run time limit
* DSQL: Clients can't block each other, everything AZ local until you get to commit
* Both have Strong snapshot isolation (strong = strongly consistent). However, PostgreSQL doesn't if you use read replicas (eventual consistent updates to replica).
