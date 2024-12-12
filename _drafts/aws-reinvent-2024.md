---
title: AWS re:Invent 2024
tags: aws
---

wise words

* Trying to optimize my investment, find the "good stuff" with as little effort as possible
* [AWS Top Announcements of Reinvent 2024 Blog](https://aws.amazon.com/blogs/aws/top-announcements-of-aws-reinvent-2024/) has product announcements but nothing about the technical sessions I'm interested in. Also no mention of Aurora DSQL which was my most interesting announcement of Reinvent.
* Official [AWS on-demand sessions](https://reinvent.awsevents.com/on-demand/) is hopeless for finding your way through. Just links to YouTube play lists with lots of sessions missing. Nothing beyond the session title to go on.
* Unofficial [session planners](https://reinvent-planner.cloud/) are far better at letting you filter the catalog to find something interesting, then search for the title on YouTube yourself.

# Keynotes

## CEO Matt Garman

* [Keynote highlights in 10 minutes](https://youtu.be/rQiziOkJFSg?si=uvHcX8k6W3MsfJr-) from AWS
* Trainium2 UltraServers
* Apple using AWS
* Trainium3 next year
* S3 Tables
* S3 Metadata
* Aurora DSQL
* JPMorgan Chase Customer Segment
* Andy Jassy, Amazon CEO - Amazon Nova AI models
* Amazon Q Developer agents for generating unit tests, documentation and code reviews
* Amazon Q Developer automated porting of .Net code from Windows to Unix
* Amazon Q Transform for VMWare - port VMWare to native cloud
* Amazon Q Transform for Mainframe - port mainframe applications to native cloud
* PagerDuty customer segement
* Amazon Q Business automation for complex workflows
* Next Gen Amazon SageMaker - rebranding lots of stuff as SageMaker

## CTO Werner Vogels

* S3 Story Mockumentary
* 20 years at Amazon - looking back
* thefrugalarchitect.com updated - architect with cost in mind
* Everything fails, all the time, so plan for failure
* Keep it simple - systems tend to become more complex over time as you crowbar features in
* Simplexity - Simplicity principles for managing complex systems
* Tesler's law - Complexity can neither be created nor destroyed only moved somewhere else
* Intended vs Unintended complexity
* Warning signs
  * Declining feature velocity
  * Frequent escalations
  * Time-consuming debugging
  * Excessive codebase growth
  * Inconsistent patterns
  * Dependencies everywhere
  * Undifferentiated Work
* Example - customers having to deal with eventual consistency in S3. Moved complexity into S3 by implementing strong consistency for them.
* Simplicity requires discipline
* Canva Customer Segment - Planning for scale: Monolith with internal service model that could be easily sharded into microservices when needed
* Lehman's laws of software evolution
  * Continuing Change - systems must be continually adapted else they become progressively less satisfactory
  * Continuing Growth - The functional content of a system must be continually increased to maintain user satisfaction with the system over its lifetime
  * Increasing Complexity - As a system evolves its complexity increases unless work is done to maintain or reduce it
  * Declining Quality - A system will be perceived to be declining in quality unless it is rigorously maintained and adapted to its changing operational environment
* Lessons in Simplexity
  * Make evolvability a requirement
    * Modeled on business concepts
    * Hidden internal details
    * Fine-grained interfaces
    * Smart endpoints
    * Decentralized
    * Independently deployable
    * Automated
    * Cloud-native design principles
    * Isolate failure
    * Highly observable
    * Multiple paradigms
    * Example: Amazon S3 from 6 microservices to 300+ behind backwards compatible API
  * Break complexity into pieces
    * Example: CloudWatch - started as simple metadata storage service, got very complex over time, anti-pattern: Megaservice
    * System disaggregation
    * Low coupling / high cohesion
    * Well-defined APIs
    * Example: Modern Cloudwatch has many separate components behind frontend service. Individual components rewritten from C to Rust
    * How big should a service be?
      * Extend existing service or create a new one?
      * Can you keep an understanding in your head?
  * Align organization to architecture - Andy Warfield (Distinguished Engineer) on how architecture/organizational complexity is managed in S3
    * Build small teams, challenge the status quo, encourage ownership
    * Your organization is at least as complex as the software
    * Successful teams worry about not performing well
    * Constructively challenge the status quo
    * Have new team members include a Durability threat model in their new feature designs
    * Focus on ownership
    * Effective leaders ensure teams have agency and so a sense of ownership
    * Effective leaders drive urgency
  * Organize into cells
    * Cell based architecture
    * Shard microservice into cells
    * Reduce the scope of impacts
    * Shuffle sharding to map customers to cells
    * Partitioning strategy + Control plane
    * Cell should be big enough to handle biggest workload required, small enough to test at full scale
    * Time to build service is insignificant compared with time you'll be operating it
    * In a complex system, you must reduce the scope of impact
  * Design predictable systems
    * Constant work principle
    * Example: Pushing config changes to fleet of workers. Instead of doing live, with unpredictable amount of work for different workers, write config to file in S3, then all workers pull latest config from S3 on a schedule and apply everything.
    * Reduce the impact of uncertainty
  * Automate complexity
    * Automate everything that doesn't need a human in the loop
    * Automation is the standard approach, human step is the exception
    * Example: Automating threat intelligence inside AWS
    * Automation makes complexity manageable
    * Looking at automating support ticket triage with AI
    * Automate everything that doesn't require human judgement
* Too Good to Go Customer Segment
* Database Complexity Burden
  * EC2 -> RDS -> Aurora -> Aurora Serverless and Unlimited -> Aurora DSQL
  * Multi-region strong consistency with low latency, Globally synchronized time
  * Implemented as hierarchy of independent distributed components following Simplexity principles
  * Rattles quickly through DSQL architecture
  * Simplification of distributed systems if you have accurate, globally synchronized time
  * Single microsecond accuracy
  * Each timestamp has an error bound, [ClockBound](https:/github.com/aws/clock-bound) library for working with bounded timestamps
  * Also used in DynamoDB global tables with strong consistency
  * Have added time as a fundamental building block you can use to simplify your algorithms

# Product Launches

## Aurora DSQL

### Get Started with  Amazon Aurora DSQL

* Marc Brooker
* [YouTube](https://youtu.be/9wx5qNUJdCE?si=cHFSEX5kdVUv5wA0)
* External view - how to build your stuff on top of DSQL
* Multi-region active-active serverless optimized for transactional workloads
* Started in January 2021
* Scalable up and down
* Serverless like DynamoDB and S3 are serverless
* In multi-region setup no compromise on consistency, isolation, ACID properties
* Postgres compatible - cover "most" of PostgreSQL surface area
* Small single region application
  * DNS -> ALB -> App Server -> Regional DSQL Endpoint
  * Thousands of requests per second, 99.9% availability with ASG, no data loss on failover, easy to add more app servers
* Serverless application
  * Lambda Function URLs -> Lambda Function -> Regional DSQL Endpoint
  * Tens of thousands of requests per second, 99.95% availability, no infrastructure
* Large single-region application
  * DNS -> LB -> 3 x App stack per AZ -> Regional DSQL Endpoint
  * Tens of thousands of requests per seconds, 99.95% availability, infrastructure depends on app stack used
* Avoid hot write keys
  * Incrementing counter hit by lots of transactions
  * Design schema so that you spread reads and writes across multiple keys
  * Specific to writes, reads never conflict, read only transactions always commit
  * Concurrent transaction conflicts. No read-write, write-read conflicts. Only write-write can conflict.
  * Traditional DBs love data locality (performance from caching working set in server memory), DSQL loves dispersion
  * Don't have to worry at low scale - thousands of requests per second or less
* Multi-region Active-Active

{% include candid-image.html src="/assets/images/databases/dsql-multi-region-active-active-app.png" alt="Multi-Region Active-Active App Architecture" %}

* Multi-region Active-Active
  * Just taken single-region architecture and stamped it out in each region with Global DNS for request routing
  * No inter-region connections needed at app level
  * AZ failure: Availability impact milliseconds to seconds, no data loss, no consistency loss
  * Region failure: Availability impact of milliseconds in remaining regions, time for global DNS to reroute for failed region, no data loss, no consistency loss
  * Active-Active benefits: Caches/JITs are warm (compared with failover region), you know both sides work, easy capacity planning, route customers to closest region, DSQL offers symmetric latency (doesn't matter which regional endpoint you speak to).
* Multi-region speed tips
  * Reads are always in-region (including commits for read only transactions, reads in read-write transactions)
  * Writes are always in-region
  * Relies on clock architecture
  * Read-write transactions commits cross regions - 15-100ms penalty depending on region configuration
  * Transactions improve latency! - amortize cost of commit across multiple statements
  * More keys in the transaction increases chance of conflict with another transaction, so don't go mad
* Isolation and Consistency
  * Snapshot isolation only for preview
  * Strongly consistent (linearizable), even across regions, even for scale-out reads
  * Together gives you "strong snapshot isolation"
  * In most cases you shouldn't have to worry about consistency in your app
  * Equivalent to Postres REPEATABLE READ, better than all MySQL isolation levels
  * Only Postgres SERIALIZABLE is stronger
  * Strong snapshot isolation is a sweet spot
  * Serializable has big performance downsides which requires app programmer to write code that avoids problems
  * No performance benefit for weaker isolation levels in DSQL
  * Designing for scalability naturally gives you most of snapshot isolation for free

### Deep Dive into Amazon Aurora DSQL and its architecture

* Marc Brooker
* [YouTube](https://youtu.be/huGmR_mi5dQ?si=X1oQT0QD7e2AdmI7)

* Focus on internals of DSQL, app programmer doesn't need to know this stuff
* Rethinking transactional databases
* Event sourced system! - "the journal is the database"
* Built on internal AWS journal service - atomic and durable for free
* Adjudicator service looks for conflicts with other recently committed transactions (since this one started) before writing to journal - isolated
* Distributed commit protocol between adjudicators for scalability
* Key space distributed between adjudicators. Where they do have to collaborate on a transaction uses much improved version of two phase commit
* Need to index journal for efficient query. Storage provides efficient ways to query data. Not responsible for durability or concurrency control.
* Database rows are sharded across storage nodes.
* Multiple journals!
* Query processor - lots of query work pushed down to storage layer: simple get, filters, counts, projection
* Interactive transactions - multiple round trips from app to database during a transaction (possibly even interacting with user)
* Transaction and session router -> PostgreSQL Query processor running in Firecracker VM per connection
* CTO Keynote mentioned that Firecracker VM can be suspended and rehydrated for long interactive transactions (e.g. humans in the loop). Potentially scaling compute down to zero if no activity even with active transactions. 
* Isolation of reads
  * Depends on AWS time sync foundation
  * Clock read at start of transaction
  * Every query to storage includes "at time t" condition
  * Storage nodes implement MVCC
  * No coordination needed at all between query processors and storage nodes
  * Not using Postgres implementation - new approach that avoids need for Vacuum
* Five layer architecture: Router, query processor, adjudicator, journal, storage with each layer scaling horizontally/independently/dynamically
* Scalability and resilience comes from avoiding coordination
* During transaction query processor reads direct from storage nodes that contain required data and buffers writes internally
* At commit time query processor interacts with adjudicators that own relevant key space which then write to a single journal. Storage engines that own modified data are notified and pull updates from the journal.
* Isolation deep dive
  * No coordination before commit
  * Optimistic concurrency control
  * Transaction starts at Tstart, ends at Tcommit
  * Transaction can commit if (and only if) no other transaction has written to the same keys between Tstart and Tcommit
  * Writes are all performed at Tcommit
  * Contract with adjudicator: Here are keys I intend to write + my Tstart, if no other transaction has written these keys since Tstart pick a Tcommit and write changes to the journal, never allow another transaction to pick a lower Tcommit.
* Multi-Region
  * All about minimizing round trips between regions
  * Only commits of write transactions need cross-region coordination. Need to check isolation rules and make data durable. 
  * Optimized for fast failover. Only place this matters is failover of adjudicator that owns a keyspace. Adjudicators only have fixed size transient soft state. 
  * Preview supports three region architecture. Two active regions with data storage, one journal only "witness" region. If there's a network split, the active region on the same side as the witness region has a clear majority and can continue to be available. For large scale geography can put witness region in the middle to optimize for latency. 
  * Adjudicators spread across regions. Only one adjudicator for each range of keyspace.
  * If region fails or is isolated, new adjudicators have to be started on the majority side.
  * Region can use its existing QPs, journals and storage nodes for everything else. Journal and Storage are replicated. QPs only have transient state.
  * Journal and Storage use existing internal components that are foundations for DynamoDB and Aurora. They already handle ordered replication across hosts, AZs, regions.
  * ??? How do you know which journal to write a transaction to?

{% include candid-image.html src="/assets/images/databases/dsql-multi-region-internals.jpg" alt="Multi-Region Internal Architecture" %}

* Implementation Quality
  * Built in Rust
  * Deterministic simulation testing - effectively unit tests for distributed system behavior. Open source library "Turmoil" on GitHub.
  * Fuzzing of SQL surface area, compare with results on RDS and Aurora
  * Formal methods
  * Runtime monitoring - compare runtime logs against formal specification to ensure that actual implementation matches formal spec
* More details in Marc Brooker's [blog](https://brooker.co.za/blog/)
  * [Aurora DSQL and A Personal Story](https://brooker.co.za/blog/2024/12/03/aurora-dsql.html): Overview of DSQL and history of work that led up to it
  * [Reads and Compute](https://brooker.co.za/blog/2024/12/04/inside-dsql.html): DSQL read path, avoiding need for cache in query processor
  * [Transactions and Durability](https://brooker.co.za/blog/2024/12/05/inside-dsql-writes.html): DSQL write path, only commited transactions written to journal, how storage nodes know they have all data from transactions committing before a given time
  * [Wait! Isn't That Impossible](https://brooker.co.za/blog/2024/12/06/inside-dsql-cap.html): Multi-region architecture
  * [MemoryDB: Speed, Durability, and Composition](https://brooker.co.za/blog/2024/04/25/memorydb.html): More details about the Journal service in the context of its use in MemoryDB

## S3 Tables

## S3 Metadata

* [YouTube](https://youtu.be/hB0AxWKh4wA?si=zj8o9aeMZ-74eLGt): Unlock the power of your data with Amazon S3 Metadata
* Customer metadata stores have to live outside of storage - difficult to build, operate, scale, keep consistent
* Automatically generate rich metadata for every object in your S3 buckets
* Accessible with simple SQL semantics
* Includes system metadata, object tags and user-defined metadata
* Stored in an Iceberg table in an Amazon S3 table bucket
* Metadata generated in "near real-time" as content of your S3 bucket changes
* Journal table - "system table" for your bucket, AWS managed, change events, read only
* 21 system metadata fields - e.g. object size, storage class, create date, object tags
* Can be queried using lots of AWS and open source analytics tools
* Custom metadata - use S3 object tags and user-defined metadata to get custom stuff
* Can create your own tables in table bucket (e.g. using Lambda to process new S3 objects) and join with journal table

# Technical Talks

* Distinguished Engineers: Marc Brooker, Colm MacCarthaigh, Becky Weiss, David Yanacek
* Authors of [Builder's Library](https://aws.amazon.com/builders-library) articles
* Level 3 or 4
