---
title: AWS Lambda Durable Functions
tags: aws
---

Lambda functions work best for short lived, compute intensive tasks. An individual Lambda invocation is limited to 15 minutes at most. You pay for the time the function is running, including when it's waiting for IO to complete. If the function fails, you will need some external process that retries it later. Durable functions address these weaknesses. 

The name is slightly misleading. It's still a Lambda function with all the same limits per invocation. The trick is that the function will be invoked repeatedly until complete. That includes retries for failures, restarts after waiting for an external process, and restarts because the current invocation ran out of time. 

You divide your function into separate steps which checkpoint their progress as you go. When the function restarts, you load the last checkpoint and resume from there. You're supplied with an SDK that provides high level abstractions built on the underlying checkpoint and replay model.

You can think of Lambda Durable Functions as a serverless implementation of [Temporal](https://docs.temporal.io/evaluate/understanding-temporal#durable-execution), built on top of the existing AWS Lambda platform.

# Example Durable Function

# Lambda Pricing

Lambda
* 1M requests and 400k GB-seconds of compute free per month
* $0.0000166667/GB-second and $0.2/M requests

Lambda Durable Functions
  * No explicit free tier benefits
  * Durable operations (steps, waits, callbacks) at $8.00/M
  * Each retry of a step counts as another operation, callbacks are at least 2 operations (one to create, one to process result)
  * Data written (persisted from durable ops) $0.25/GB, or $0.25/M (1KB write)
  * Data retained (during execution and afterwards) at $0.15/GB-month
  * Max checkpoint size is 256KB - use S3 or DynamoDB for large checkpoints
  * For compound operations, if more than 256KB is returned, result isn't stored and is reconstructed from sub-operation results on replay

* Interesting choices when calling out to external services. Do you make the call and leave the Lambda running until you get a response, or structure as a callback and shutdown the Lambda while waiting for a response?
* Using a callback needs an external service that is willing to call you back. Tight coupling. Cost is at least two operations, which is equivalent to a GB-second of compute. For a reasonably sized Lambda and external service with acceptable latency, it will be cheaper and faster just to make the request and leave the Lambda running while you wait. If you can overlap the IO with some useful compute, even better. Only makes sense if you're waiting for some long running job or a human in the loop. 
* If you have large state you will need custom serializers and write most of it to S3. Cheaper once checkpoints over 20KB.

# STEP Functions

# Example STEP Function

# STEP Pricing

Step functions
* 4000 state transitions free per month
* $25/M state transitions
* Max input/output from a state 256KB

# Durable Functions vs STEP

* Between 3X cheaper and 3X more expensive than STEP functions depending on checkpoint size
* Charge for data written sneaks up on you, no separate charge with STEP functions, STEP is cheaper once checkpoints bigger than 68KB.
* STEP encourages finer-grained workflows so often even more expensive
* Complex multi-state control logic in STEP turns into code running in a durable function
* Easy to make steps coarser so you need less operations at the cost of more work to redo from last checkpoint on failure
* With Durable functions you're paying separately for the underlying compute but control logic doesn't need much


# Roll Your Own
 
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
| 1KB | $8.25 | $1.025 | $8 | $0.525 |
| 8KB | $10 | $5.40 | $8 | $0.65 |
| 64KB | $24 | $6.025 | $8 | $0.925 |
| 256KB | $72 | $6.025 | $8 | $0.925 |

# De-Duplicating Function Invocations

* Steps need to be idempotent because they can be retried after failure
* Durable functions ensures only one running function invocation at a time
* External requests are de-duplicated
* Once a step starts running there won't be any repeat of earlier steps as retry will restart from checkpoint

* Standard SQS queue has at least once semantics for message processing which is equivalent to multiple running function invocations
* Also nothing that prevents client retries from adding duplicated messages to queue
* Options
  * Function is deterministic and idempotent. Doesn't matter if there are duplicates.
  * De-duplicate step completion. Checkpoint at end of step checks if already done, if so bails out duplicate invocation. May get code for earlier steps running concurrently with later ones before bail out.
  * Step leases. At start of STEP create DynamoDB entry with expiry as a lease (expiry < message visibility timeout>). If you fail to get lease, bail out. If step fails, lease expires, then message visibility timeout expires, message redelivered with lease available.
  * Use SQS FIFO queues for exactly-once semantics and 5 minute de-duplication window in exchange for double the cost and lower throughput 

# Function Versions

* Durable functions ensures that replays use the same version of the function as the initial invocation
* This is a pain to replicate when rolling your own
* Easy enough to identify which version was active when message added to queue by including the version as a message field
* However, you can't define an event source mapping that directs to different versions of the Lambda function
* Could use a router Lambda function which forwards to the version specific Lambda, but it has to sit there and wait for response
* More heavyweight approach is to use a separate SQS queue for each Lambda version. Add message to the queue for the latest version. Delete queues for old versions once empty. Can use SNS+filter to map the message to the right queue, or make it the producer's responsibility.
* Or make it the Lambda function's responsibility to cope with older versions of messages. At extreme end, each deploy include multiple copies of the code with a switch on entry to dispatch to the right version. 