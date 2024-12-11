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

## S3 Metadata
## S3 Tables

# Technical Talks

* Distinguished Engineers: Marc Brooker, Colm MacCarthaigh, Becky Weiss, etc.
* Level 3 or 4
