---
title: Free or Not?
---

Last month I dived into AWS cost models and used that to decide whether AWS services are [Serverless or Not]({% link _posts/2022-12-05-serverless-or-not.md %}). As I get closer to actually trying to implement my [open source, serverless, customer deployed, scalable spreadsheet]({% link _posts/2023-01-09-spreadsheets-future-data-systems.md %}) I've found myself wondering about the AWS free tier.  

When you're working for a large SaaS vendor the AWS free tier is irrelevant. You're operating at a scale where you're more focused on advance provisioning and volume discounts. However, as someone working on my own project, spending my own money, I'm really curious about what I can get for free. As my hypothetical customers will be self deploying the product, it's also interesting to think about what they can get for free too. It would be wonderful if my customers could deploy and kick the tyres on my spreadsheet without incurring any AWS costs.

The [AWS Free Tier](https://aws.amazon.com/free) is intended to allow customers to explore and try out AWS services without worrying about the potential costs. It doesn't quite achieve that aim as each service varies in what features are available free and for how long. You need to read the description of each service carefully and have a good understanding of the usage model to be sure of avoiding an unexpected bill. Even experienced AWS users find themselves being [caught out](https://www.lastweekinaws.com/blog/sagemaker_is_responsible_for_my_surprise_bill/).

Let's arm ourselves with the trusty shield of knowledge by playing a round of *Free or Not?*

# Who gets the Free Tier?

How does AWS define a customer? Who is eligible for the free tier?

The [AWS Free Tier Terms](https://aws.amazon.com/free/terms/) are pretty clear. The free tier allowances are tied to an AWS account. Anyone creating an account is eligible. If you manage multiple accounts using the AWS Organizations feature then you get one set of free tier allowances which are shared by all the accounts in the organization. What happens if you create multiple independent accounts without using AWS Organizations? That seems to be somewhat of a gray area.

The intent is that you should receive only one set of free tier allowances. The terms say "You will not be eligible for any Offers if you or your entity create(s) more than one account to receive additional benefits under the Offers". However, there are anecdotal reports of people creating multiple accounts for perfectly legitimate reasons (e.g. one for each separate project they're working on) and receiving free tier allowances on each account. The identifying information AWS has is the email address, credit card number and mobile phone number you used to sign up for the account. In practice, it will come down to whatever (undocumented) policy AWS applies to identify accounts with common ownership.

Create AWS accounts as needed, use whatever identifying information is natural, and expect to receive only one set of free tier allowances. Treat it as a bonus if AWS in their wisdom give you more. 

# How long does the Free Tier last?

This varies by service. Most services have a 12 month free tier which starts from the time you create your account. If you create an account but don't get round to doing anything for 9 months you will only have 3 months left. Don't do that. If you want to make use of the free tier leave creation of your account until the last minute.

In most cases you get a monthly allowance (in whatever form makes sense for the service you're using). Go beyond the allowance and you will start being charged. Unused allowance doesn't roll over. 

Some services have an always free tier with no expiry date. Everyone gets a free allowance each month.

Finally, some services have more limited free trials with a service dependent duration (usually a month or two). These start from the point at which you activate the service.

# Analysis

I'm focusing on the Serverless services that I identified [last time]({% link _posts/2022-12-05-serverless-or-not.md %}). I've added a few additional services in the existing categories and a whole new category for Build, Deploy and Management services. For each service I list the base cost model, what (if anything) is included in the free tier, what that's worth in dollars per month and finally how long the free tier lasts. If you don't want to wade through all the tables, you can jump straight to my [conclusions](#conclusion).

## Compute

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| Lambda | $0.0000133 per GB-second and $0.2 per million requests | 1 million requests and 400K GB-seconds | $5.53 |  Always  |
| Amplify Web App Server Side Rendering | $0.0000556 per GB-second and $0.3 per million requests | 100 GB-hours, 500K requests  | $20.15 | 12 months  |
| S3 Object Lambda | $0.0000133 per GB-second, $1[^1] per million requests, $0.005 per GB returned | None  | $0 | NA  |
| S3 Select | $0.4 per million requests, $0.002 per GB scanned, $0.0007 per GB returned |  None  | $0 | NA  |

[^1]: $0.4 for the incoming S3 request, $0.2 for invoking the lambda, $0.4 for the S3 request from the lambda

## File Storage

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| EFS | $0.30 per GB-month, $0.03 per GB reads and $0.06 per GB writes | 5 GB, no reads/writes | $1.5 | 12 months |
| S3 | $0.023 per GB-month, $0.4 per million read requests, $5 per million write requests | 5GB, 20K GET requests, 2K PUT requests  | $0.13 | 12 months |

## Database

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| DynamoDB  | $1.25 per million write requests, $0.25 per million read [requests](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html), $0.2 per million streams read requests, $0.25 per GB-month | 25 GB, 2.5M streams reads, no reads/writes  | $6.75 | Always |
| TimeStream  | $0.50 per million write requests, $0.036 per GB-hour in memory, $0.03 per GB-month stored, $0.01 per GB scanned | None  | $0 | NA  |


## Queues and Eventing

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| SQS | $0.40 per million 64KB requests | 1M requests | $0.40 | Always |
| SNS | $0.50 per million 64KB requests, $0.09 per GB transferred out to SQS or Lambda[^q1] | 1M requests[^q2] | $0.50 | Always |
| EventBridge Event Bus | $1 per million 64KB events published | None | $0 | NA |
| EventBridge Event Replay | $0.1 per GB archived, $0.023 per GB-month stored, $1 per million events replayed | None | $0 | NA |
| EventBridge Pipes | $0.4 per million 64KB chunks delivered | None | $0 | NA |
| EventBridge Scheduler | $1 per million invocations | 14M invocations | $14 | Always |

[^q1]: $ 0.09 per GB transferred equivalent to $5 per million 64KB events or $0.09 per million 1KB events
[^q2]: Data transfer out to SQS/Lambda is charged at "internet rates" and should be included in the "data transfer out to internet" free tier

## Orchestration

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| STEP Functions | $25 per million [state transitions](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-transitions.html) | 4000 state transitions  | $0.10 | Always |
| STEP Functions Express | $0.00001667 per GB-second and $1 per million requests |  None  | $0 | NA  |

## Gateway

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| Route 53 | $3-$306 registration per domain per year depending on TLD[^g1], $0.5 per hosted zone per month, $0-$0.8 per million queries depending on type[^g2], from $0.5 per health check[^g3] per month | 50 basic health checks for AWS resources | $25 | Always |
| Data Transfer out to Internet | $0.09 per GB transferred out | 100 GB | $9 | Always |
| Data Transfer to other AWS region | $0.02 per GB transferred out | None | $0 | NA |
| CloudFront | $1 per million https requests, $0.085[^g4] per GB transferred out to internet, $0.1 per million function invocations, $0.6 per million lambda@edge requests + $0.00005 per GB-second | 10M requests, 1 TB transfer out, 2M function invocations | $97.14 | Always
| Amplify Web App Hosting | $0.15 per GB served | 15 GB | $2.25 | 12 months |
| API Gateway (REST API)| $3.5 per million API calls received | 1M calls received | $3.50 | 12 months |
| API Gateway (HTTP API)| $1 per million 512KB API calls received | 1M calls received | $1.00 | 12 months |
| API Gateway (WebSocket API)| $1 per million 32KB messages sent or received by client, $0.25 per million connection minutes | 1M messages, 750K connection minutes | $1.19 | 12 months |
| AppSync (queries and mutations)| $4 per million requests received | 250K requests | $1 | 12 months |
| AppSync (subscriptions)| $2 per million messages received by client, $0.08 per million connection minutes | 250K messages, 600K connection minutes | $0.65 | 12 months |
| Lambda Function URLs | No additional charge above the cost of invoking the lambda | NA | $0 | NA |
| IoT Core | $0.30 per million 5KB messages ingested, $1 per million 5KB messages received by client, $0.08 per million connection minutes | 250K messages ingested, 500K messages received, 2.25M connection minutes | $0.75 | 12 Months |
| Cognito User Pools | $0.0055 per MAU | 50K MAUs | $275 | Always |

[^g1]: From $3 for .click to $306 for .movie
[^g2]: $0 for alias queries that resolve to AWS resources, $0.4 for standard queries, $0.6 for latency based routing queries, $0.7 for geo DNS and GeoProximity queries, $0.8 for IP-based routing queries
[^g3]: Add $1 for each optional feature: HTTPS, string matching, fast interval, latency measurement
[^g4]: Depends on location of *client*. $0.85 applies to North America and Europe only. Prices in other regions vary from $0.11 to $0.12.

## Build, Deploy and Manage

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| Amplify Web App Hosting | $0.01 per build minute | 1000 minutes | $10 | 12 months |
| CodeBuild | $0.0034-$0.65[^b1] per instance per minute | 100 minutes on small instance | $0.5 | Always |
| CodePipeline | $1 per active pipeline per month | One active pipeline | $1.00 | Always |
| CodeArtifact | $0.05 per GB-month, $5 per million requests | 2GB, 100K requests | $0.6 | Always |
| CodeDeploy | Free for deployments to Lambda | NA | $0 | NA |
| X-Ray | $5[^b2] per million traces recorded, $0.5 per million traces retrieved or scanned | 100K traces recorded, 1M traces retrieved or scanned | $1 | Always |
| CloudWatch Metrics | $0.3 per metric per month, $10 per million API requests | 10 metrics, 1 million API requests | $13 | Always |
| CloudWatch Dashboard | $3 per dashboard per month | 3 dashboards for up to 50 metrics | $9 | Always |
| CloudWatch Alarms | $0.1 per standard alarm per month, $0.1 per metric analyzed per month for metric insights, $0.3 per high resolution alarm per month | 10 standard alarms | $1 | Always |
| CloudWatch Logs | $0.5 per GB ingested, $0.03 per GB stored per month[^b3], $0.005 per GB scanned by log insights queries | 5GB ingested, 5GB stored, 5GB scanned | $2.68 | Always |
| CloudWatch Contributor Insights | $0.5 per rule per month, $0.02 per million matching log events | 1 rule, 1M matching events | $0.52 | Always |
| CloudWatch Synthetics | $0.0012 per canary run | 100 canary runs | $0.12 | Always |
| CloudFormation Hooks | $0.9 per thousand handler operations, $0.00008 per second beyond first 30 seconds per operation | 1000 handler operations | $0.90 | Always |

[^b1]: $0.0034 for linux arm1.small, $0.005 for linux general1.small, $0.01 for linux general1.medium, $0.018 for Windows general1.medium, ..., $0.65 for linux gpu1.large
[^b2]: Plus $1 per million if X-Ray insights is enabled
[^b3]: Logs are stored compressed with size about 15% of data ingested

# Conclusion

If you were hoping that the free tier would save you from inadvertently racking up a big bill you're set to be disappointed. Of the 25 services that actually have a free tier, half of them cover a monthly amount of $1 or less. Most of the rest of them come in under the $10 mark. 

Maybe the free tier lets you kick the tyres and learn how a service works without having to pay? Again, you need to be careful and check what's actually covered. The headline for DynamoDB is that you get 25GB of storage for free indefinitely. Sounds great, but you still have to pay for any reads and writes to access your data. S3 covers you for 5GB of storage and a few thousand GETs and PUTs. Want to LIST the content of your bucket? You'll have to pay for that. 

Some services include a corner case feature in the free tier and nothing else. Step forward Route 53, which gives you a generous 50 basic health checks a month (a $25 value!) but makes you pay for everything else. Similarly EventBridge gives you 14M scheduler invocations a month (a $14 value) but excludes event publishing, replay and pipes.

The most generous service? Take a bow Cognito User Pools. As well as having a simple high level cost model of $0.0055 per MAU, you get the first 50K MAUs free every month indefinitely. That works out at up to a $275 value. In practice that means I will never pay a dime for Cognito User Pools and nor will 99% of my hypothetical customers.

The second service that stands out is CloudFront. You get 10 million requests and one terabyte of data out free every month indefinitely. A $97 value. If you're hosting any kind of small to medium scale web app on AWS it will be cheaper as well as higher performance to stick it behind CloudFront rather than using direct access to a public S3 bucket.

In third place we have Amplify Web Hosting. Amplify is a high level, easy to use service that takes care of all the details when hosting a web app. It includes building and deploying the app ($10 value), Server Side Rendering ($20 value) and a CDN for hosting the app ($2.25 value). Amplify is a perfect demonstration of the principle that the higher level services have a more generous free tier. If I was being cynical I might think that's because the higher level services have much bigger margins and can afford to be more generous. Amplify is built on foundations provided by CodeBuild, Lambda and CloudFront. If you used those services directly, the equivalent of the Amplify free tier would cost you $3.40, $4.89 and $1.27 respectively. 

Finally, which is the least generous service? The lowest monthly value of any service that has a free tier is STEP functions with 4000 state transitions worth $0.10. However, STEP Functions free tier is always free and includes all of the standard STEP functionality.

My award for least valuable free tier goes to everyone's favorite service, S3. You have just 12 months to enjoy the benefits of 5GB of storage, 20K GET requests and 2K PUT requests worth $0.13 a month. That's a total of $1.56 for the lifetime of your account.

## Footnotes

All costs correct at time of writing based on AWS US East region.