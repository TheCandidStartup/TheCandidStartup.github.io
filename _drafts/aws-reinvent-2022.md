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
