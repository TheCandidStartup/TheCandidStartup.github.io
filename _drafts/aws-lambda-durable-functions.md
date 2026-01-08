---
title: AWS Lambda Durable Functions
tags: aws
---

[Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html) functions work best for short lived, compute intensive tasks. An individual Lambda invocation is limited to 15 minutes at most. You pay for the time the function is running, including when it's waiting for IO to complete. If the function fails, you will need some external process that retries it later. [Lambda Durable Functions](https://docs.aws.amazon.com/lambda/latest/dg/durable-functions.html) address these weaknesses. 

The name is slightly misleading. It's still a Lambda function with all the same limits per invocation. The trick is that the function will be invoked repeatedly until complete. That includes retries for failures, restarts after waiting for an external process, and restarts because the current invocation ran out of time. 

You divide your function into separate steps which checkpoint their progress as you go. When the function restarts, you load the last checkpoint and resume from there. You're supplied with an SDK that provides high level abstractions built on the underlying checkpoint and replay model.

You can think of Lambda Durable Functions as a serverless implementation of [Temporal](https://docs.temporal.io/evaluate/understanding-temporal#durable-execution), built on top of the existing AWS Lambda platform.

# SDK

The initial release of Durable Functions includes [SDKs](https://docs.aws.amazon.com/lambda/latest/dg/durable-execution-sdk.html) for JavaScript, TypeScript and Python. NodeJS and Python runtimes are supported.

The SDK includes Step, Wait and Callback primitives. You can write idiomatic async/await code to define a workflow that chains together multiple steps.

```ts
import { DurableContext, withDurableExecution } from "@aws/durable-execution-sdk-js";

export const handler = withDurableExecution(
  async (event: any, context: DurableContext) => {
    
    const step1Output = await context.step("step1", async () => {
      return await doStep1(event.input);
    });
    
    const step2Output = await context.step("step2", async () => {
      return await doStep2(step1Output);
    });
    
    // Create shipment
    const step3Output = await context.step("step3", async () => {
      return await doStep3(step2Output);
    });
    
    return step3Output.results;
  }
);
```

The SDK automatically checkpoints each step by serializing the return value. The SDK also supports more complex workflow patterns including Parallel execution, Mapping steps over collections, Child contexts, and Composition of multiple durable functions. Your code implements whatever logic you want to control the flow of execution from step to step. 

# Retries

Durable functions [automatically retry](https://docs.aws.amazon.com/lambda/latest/dg/durable-execution-sdk-retries.html) failing steps. Each step is configured with a retry strategy. There is a default but you absolutely shouldn't rely on it. Configure your own appropriate strategy for each step via the optional third argument to  `context.step`.

The retry strategy is invoked when an exception is thrown within a step. The strategy determines whether to retry and how long to delay before the retry occurs.

```ts
  const step1Output = await context.step("step1", async () => {
    return await doStep1(event.input);
  }, {
    retryStrategy: (error, attemptCount) => {
      if (attemptCount >= 5) {
        return { shouldRetry: false };
      }
      // Exponential backoff: 2s, 4s, 8s, 16s, 32s (capped at 300s)
      const delay = Math.min(2 * Math.pow(2, attemptCount - 1), 300);
      return { shouldRetry: true, delay: { seconds: delay } };
    }
  });
```

A typical strategy would limit the maximum number of retries and use exponential backoff and jitter. You can use the `error` object to alter your strategy depending on the type of error. 

The SDK implements retry by checkpointing the retry state, exiting the current Lambda invocation and requesting a restart after the specified delay. The durable function service starts a new Lambda invocation which loads the retry checkpoint together with the checkpoints from previous steps.

Your Lambda handler is executed from the top, but the SDK short circuits any completed steps, immediately returning the checkpointed value rather than executing the step again. Meaningful execution resumes from the failed step.

This approach only works if all control logic outside each step is deterministic. It also assumes steps have no side channels or side effects which impact the behavior of later steps.

# Pricing

You pay the normal costs for each Lambda function invocation as well as additional costs for checkpoints and retries.

Lambda
* 1M requests and 400k GB-seconds of compute free per month
* $0.0000166667/GB-second and $0.2/M requests

Lambda Durable Functions
  * No explicit free tier benefits
  * Durable operations (steps, waits, callbacks) at $8.00/M
  * Data written (persisted from durable ops) $0.25/GB, or $0.25/M (1KB write)
  * Data retained (during execution and afterwards) at $0.15/GB-month

Each retry of a step counts as another operation. Callbacks require at least 2 operations (one to create the callback, one to process the result).

The maximum checkpoint size is 256KB. Use a custom serializer to write data to S3 or DynamoDB for large checkpoints. Using S3 will be cheaper once checkpoints are over 20KB. For compound operations, if more than 256KB is returned, the result isn't stored. Instead, on retry, the compound result is reconstructed from sub-operation results.

There are interesting choices when calling out to external services. Do you make the call and leave the Lambda running until you get a response, or structure the interaction as a callback and shutdown the Lambda while waiting for a response?

Using a callback needs an external service that is willing to call you back. The cost is at least two operations, which is equivalent to a GB-second of compute. For a reasonably sized Lambda and external service with acceptable latency, it will be cheaper and faster just to make the request and leave the Lambda running while you wait. If you can overlap the IO with some useful compute, even better. Callbacks only makes sense if you're waiting for some long running job or a human in the loop.

# STEP Functions

* AWS STEP functions is an existing serverless service that provides durable workflows.
* Going further back in time, there's also AWS SWF (Simple Workflow Service).
* STEP functions were billed as a simpler, serverless replacement for SWF.
* At a high level, there's a high degree of overlap between STEP functions and Lambda durable functions.
* Both support durable workflows lasting up to a year, with automated retries

# Amazon States Language

* In STEP functions, workflows are defined declaratively using the [Amazon States Language](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html) DSL.
* Workflows are structured as state machines. Each state performs some action using input passed from the previous state and generating output passed to subsequent states. 
* Transitions specify how control passes from one state to another.
* The state machine includes Task and Wait primitives. Tasks can interact directly with supported AWS services, execute Lambda functions and call arbitrary https APIs.

```json
{
  "StartAt": "Step1",
  "States": {
    "Step1": {
      "Type": "Task",
      "Resource": "arn...doStep1",
      "InputPath": "$.Input",
      "Next": "Step2"
    }
    "Step2": {
      "Type": "Task",
      "Resource": "arn...doStep2",
      "Next": "Step3"
    }
    "Step3": {
      "Type": "Task",
      "Resource": "arn...doStep3",
      "OutputPath": "$.Results",
      "End": true
    }
  }
}
```

* A large part of the states language is concerned with specifying how to extract the values that a task needs from the input to the state and in turn map results from the task to the output of the state. In contrast, this is just regular code in Lambda durable functions.
* The states language also supports more complex workflow patterns including Parallel execution, Maps, and Choices.

# Retries

* Failing tasks can be automatically retried based on a declared error strategy

```json
  "Step1": {
    "Type": "Task",
    "Resource": "arn...doStep1",
    "InputPath": "$.Input",
    "Next": "Step2",
    "Retry": {
      "ErrorEquals": [ "States.ALL" ],
      "MaxAttempts": 5,
      "IntervalSeconds": 2,
      "BackoffRate": 2
    }
  }
```

* Declare multiple different strategies for different errors rather than match all value of `States.ALL`.
* Standard retry patterns provided, just declare what you want rather than writing code for it.
* On the other hand, you're limited to what's provided. In Lambda durable functions you implement retry as code and have full flexibility to do what you like.

# STEP Pricing

Step functions
* 4000 state transitions free per month
* $25/M state transitions
* Max input/output from a state 256KB

# Durable Functions vs STEP

My first reaction was shock at how much more expensive STEP functions are. A STEP state transition is more than 3 times the price of a Lambda Durable Functions step. However, it's not an equivalent comparison. Lambda Durable Functions has a separate charge for checkpointing the output of each step. This is included in the transition charge with STEP. STEP becomes cheaper once checkpoints are over 68KB. 

On the other hand, STEP encourages finer-grained workflows. You can end up with separate tasks for each interaction with an external service, with control logic implemented using multiple Choice tasks. That's a lot of transitions.

Complex multi-state control logic in STEP turns into code running in a durable function. It's easy to make steps coarser so you need less operations, at the cost of more work to redo on failure. With Durable Functions you're paying separately for the underlying compute but control logic doesn't need much compute. If you're willing to provide your own custom checkpoint serialization and store data over 20KB in S3, you can ensure that per step costs are no worse than half the price of a STEP function transition.

The best use case for STEP functions is workflows combining multiple AWS services. The simplicity, integration and observability may well be worth the higher cost. In cases where you're using STEP to orchestrate calls across application Lambda functions, it's a no-brainer to combine them into one Durable Function and eliminate the dependency on STEP. 

# Roll Your Own
 
Durable Functions is built on top of normal Lambda function invocations. It's always interesting to think through what it would take to build something equivalent yourself. Would it be more flexible or better fitted to your needs? How do the costs compare? Is the pricing for Durable Functions a fair reflection of the value being provided?

* Fundamental operations are checkpoint and replay
* Replay is easily achieved by putting an SQS queue in front of a regular Lambda function
* Use `ReportBatchItemFailures` so that you can return explicit response for each message. Unless you say message has been successfully processed it will be redelivered triggering another invocation.
* Set the message visibility timeout to implement simple time based waits
* For callback, set visibility timeout to callback timeout. Provide an API that external service calls on callback that sets the visibility timeout to zero.
* Supports max lifetime of 14 days. For more will need to enqueue a new message when original gets close to maximum lifetime. 
* For checkpoint save current state to DynamoDB and/or S3. Read state of execution whenever function invoked.
* For checkpoints up to 8KB write to DynamoDB directly, otherwise write important properties to DynamoDB and put the body in an S3 object.
* Use a new item for each checkpoint (durable function invocation id in  partition key, checkpoint sequence id in sort key)
* Can read complete checkpoint log with a single Query (up to 1MB of response).

# De-Duplicating Function Invocations

* Durable functions ensures only one running function invocation at a time
* External requests are de-duplicated
* Once a step starts running there won't be any repeat of earlier steps as retry will restart from checkpoint
* Steps need to be idempotent because they can be retried after failure, but you can be sure that a step won't be run again once it has completed and checkpointed. 

* Standard SQS queue has at least once semantics for message processing. Which means a message could be processed more than once, which is equivalent to multiple running function invocations
* Also nothing that prevents client retries from adding duplicated messages to queue
* Options
  1. Function is deterministic and idempotent. Doesn't matter if there are duplicates. You may have some cases like this but not generally possible.
  2. De-duplicate step completion. Checkpoint at end of step uses conditional write and bails out if duplicate invocation. May get code for earlier steps running concurrently with later ones before bail out.
  3. Step leases. At start of STEP create DynamoDB entry with expiry as a lease (expiry < message visibility timeout). If you fail to get lease, bail out.  At end of step use conditional write on lease valid to replace lease with checkpoint. If someone else has lease bail out. If step fails, lease expires, then message visibility timeout expires, message redelivered with lease available.
  4. Use SQS FIFO queues for exactly-once semantics and 5 minute de-duplication window in exchange for 25% higher cost and lower throughput. Still have problem that there may be failure between writing checkpoint and deleting message from SQS which will result in message being delivered again.

FIFO queues always seem to have some gotcha that prevents them from being an easy solution. My preference would be a combination of option 2 and 3. Option 2 doesn't cost any extra, so do it as standard. For many steps that may be enough. For any steps where you need stronger guarantees, use Option 3. 

# Roll Your Own Pricing

SQS
* First million requests per month free
* $0.40/M requests (send message, receive message, change visibility timeout)
* Each 64KB chunk of payload counts as a separate request, max 1MB

DynamoDB
* First 25GB stored free
* $0.625/M WCU (1KB write)
* $0.125/M RCU (4KB read)
* $0.25/GB-month storage

S3
* No explicit free tier benefits
* $5.00/M write requests
* $0.4/M read requests
* $0.023/GB-month storage

* Basic operation cost (checkpoint)
  * Create lease in DynamoDB: $0.625/M
  * Checkpoint metadata to DynamoDB: $0.625/M per KB
  * Checkpoint body to S3: $5.0/M
  * Visibility Timeout: $0.4/M
* Basic operation cost (retry)
  * Receive message $0.4/M
  * Read metadata from DynamoDB: $0.125/M per 4KB
  * Read body from S3: $0.4/M

# Pricing Comparison

| Checkpoint Size | Durable Checkpoint Cost/M | Own Checkpoint Cost/M | Durable Retry Cost/M | Own Retry Cost/M |
|-|-|-|
| 1KB | $8.25 | $1.65 | $8 | $0.525 |
| 8KB | $10 | $6.025 | $8 | $0.65 |
| 20KB | $13 | $6.65 | $8 | $0.925 |
| 20KB+ | $13.25 | $6.65 | $8 | $0.925 |

Using S3 for checkpoints when cheaper (8KB+ for roll your own, 20KB+ for Durable Functions)

# Function Versions

* Durable functions ensures that replays use the same version of the function as the initial invocation
* This is a pain to replicate when rolling your own
* Easy enough to identify which version was active when message added to queue by including the version as a message field
* However, you can't define an event source mapping that directs to different versions of the Lambda function
* Could use a router Lambda function which forwards to the version specific Lambda, but it has to sit there and wait for response
* More heavyweight approach is to use a separate SQS queue for each Lambda version. Add message to the queue for the latest version. Delete queues for old versions once empty. Can use SNS+filter to map the message to the right queue, or make it the producer's responsibility.
* Or make it the Lambda function's responsibility to cope with older versions of messages. At extreme end, each deploy include multiple copies of the code with a switch on entry to dispatch to the right version. 