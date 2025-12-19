---
title: AWS Lambda Durable Functions
tags: aws
---

wise words

* What's the full set of features?
* How does it compare vs STEP or rolling your own durability on top of SQS/DynamoDB/S3?
* How does the pricing stack up?

# Pricing

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

Step functions
* 4000 state transitions free per month
* $25/M state transitions
* Max input/output from a state 256KB

# Implications

* Between 3X cheaper and 3X more expensive than STEP functions depending on checkpoint size
* Charge for data written sneaks up on you, no separate charge with STEP functions, STEP is cheaper once checkpoints bigger than 68KB.
* STEP encourages finer-grained workflows so often even more expensive
* Complex multi-state control logic in STEP turns into code running in a durable function
* Easy to make steps coarser so you need less operations at the cost of more work to redo from last checkpoint on failure
* With Durable functions you're paying separately for the underlying compute but control logic doesn't need much
* Interesting choices when calling out to external services. Do you make the call and leave the Lambda running until you get a response, or structure as a callback and shutdown the Lambda while waiting for a response?
* Using a callback needs an external service that is willing to call you back. Tight coupling. Cost is at least two operations, which is equivalent to a GB-second of compute. For a reasonably sized Lambda and external service with acceptable latency, it will be cheaper and faster just to make the request and leave the Lambda running while you wait. If you can overlap the IO with some useful compute, even better. Only makes sense if you're waiting for some long running job or a human in the loop. 
* If you have large state you will need custom serializers and write most of it to S3. Cheaper once checkpoints over 20KB.

# Rolling your own
 
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
* Basic operation cost (checkpoint)
  * Checkpoint metadata to DynamoDB: $0.625/M per KB
  * Checkpoint body to S3: $5.0/M
  * Visibility Timeout: $0.4/M
* Basic operation cost (retry)
  * Receive message $0.4/M
  * Read metadata from DynamoDB: $0.125/M per 4KB
  * Read body from S3: $0.4/M

| Checkpoint Size | Durable Checkpoint Cost/M | Own Checkpoint Cost/M | Durable Retry Cost/M | Own Retry Cost/M |
|-|-|-|
| 1KB | $8.25 | $1.025 | $8 | $0.525 |
| 8KB | $10 | $5.40 | $8 | $0.65 |
| 64KB | $24 | $6.025 | $8 | $0.925 |
| 256KB | $72 | $6.025 | $8 | $0.925 |

# Function Versions

* Durable functions ensures that replays use the same version of the function as the initial invocation
* This is a pain to replicate when rolling your own
* Easy enough to identify which version was active when message added to queue by including the version as a message field
* However, you can't define an event source mapping that directs to different versions of the Lambda function
* Could use a router Lambda function which forwards to the version specific Lambda, but it has to sit there and wait for response
* More heavyweight approach is to use a separate SQS queue for each Lambda version. Add message to the queue for the latest version. Delete queues for old versions once empty. Can use SNS+filter to map the message to the right queue, or make it the producer's responsibility.
* Or make it the Lambda function's responsibility to cope with older versions of messages. At extreme end, each deploy include multiple copies of the code with a switch on entry to dispatch to the right version. 