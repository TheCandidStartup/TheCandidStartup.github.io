---
title: AWS re:Invent 2025
tags: aws
---

Once again I'm spending the week after re:Invent gorging on [YouTube videos](https://reinvent.awsevents.com/on-demand/) at 1.5x speed. I'm using the same approach as last year to find more nuggets of gold and less corporate filler.

Unlike last year, there's no keynote highlights video, so I'll need to skip through the customer segments and AI hype myself. 

#  Matt Garman - CEO keynote

I can save you some time here. If you're not interested in AI, skip straight to the last 10 minutes of the keynote.

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

* Back to the Future, time travel opening video looking at all the previous times programmers were about to become obsolete
* Werner's last keynote - got better things to do at AWS
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

# Michael Gasch and Eric Johnson - Deep Dive into AWS Lambda Durable Functions

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
