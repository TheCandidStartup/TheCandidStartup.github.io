---
title: Free or Not?
---

Last month I dived into AWS cost models and used that to decide whether AWS services are [Serverless or Not]({% link _posts/2022-12-05-serverless-or-not.md %}). As I get closer to actually trying to implement my [open source, serverless, customer deployed, scalable spreadsheet]({% link _posts/2023-01-09-spreadsheets-future-data-systems.md %}) I've found myself wondering about the AWS free tier.  

When you're working for a large SaaS vendor the AWS free tier is irrelevant. You're operating at a scale where you're more focused on advanced provisioning and volume discounts. However, as someone working on my own project, spending my own money, I'm really curious about what I can get for free. As my hypothetical customers will be self deploying the product, it's also interesting to think about what they can get for free too. It would be wonderful if my customers could deploy and kick the tyres on my spreadsheet without incurring any AWS costs.

The [AWS Free Tier](https://aws.amazon.com/free) is intended to allow customers to explore and try out AWS services without worrying about the potential costs. It doesn't quite achieve that aim as each service varies in what features are available free and for how long. You need to read the description of each service carefully and have a good understanding of your usage model to be sure of avoiding an unexpected bill. Even experienced AWS users find themselves being [caught out](https://www.lastweekinaws.com/blog/sagemaker_is_responsible_for_my_surprise_bill/).

Let's arm ourselves with the trusty shield of knowledge by playing a round of Free or Not?

# Who gets the Free Tier?

How does AWS define customer? Who is eligible for the free tier?

The [AWS Free Tier Terms](https://aws.amazon.com/free/terms/) are pretty clear. The free tier allowances are tied to an AWS account. Anyone creating an account is eligible. If you manage multiple accounts using the AWS Organizations feature then you get one set of free tier allowances which are consumed by all the accounts in the organization. What happens if you create multiple independent accounts without using AWS Organizations? That seems to be somewhat of a gray area.

The intent is that you should receive only one set of free tier allowances. The terms say "You will not be eligible for any Offers if you or your entity create(s) more than one account to receive additional benefits under the Offers". However, there are anecdotal reports of people creating multiple accounts for perfectly legitimate reasons (e.g. one for each separate project they're working on) and receiving free tier allowances on each account. The identifying information AWS has is the email address, credit card number and mobile phone number you used to sign up for the account. In practice, it will come down to whatever (undocumented) policy AWS applies to identify accounts with common ownership.

Create AWS accounts as needed, use whatever identifying information is natural, and expect to receive only one set of free tier allowances. Treat it as a bonus if AWS in their wisdom give you more. 

# How long does the Free Tier last?

This varies by service. Most services have a 12 month free tier which starts from the time you create your account. If you create an account but don't get round to doing anything for 9 months you will only have 3 months left. Don't do that. If you want to make use of the free tier leave creation of your account until the last minute.

In most cases you get a monthly allowance (in whatever form makes sense for the service you're using). Go beyond the allowance and you will start being charged. Unused allowance doesn't roll over. 

Some services have an always free tier with no expiry date. Everyone gets a free allowance each month.

Finally, some services have more limited free trials with a service dependent duration (usually less than a month). These start from the point at which you activate the service.

# Compute

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| Lambda | $0.0000133 per GB-second and $0.2 per million requests | 1 million requests and 400K GB-seconds | $5.53 |  Always  |
| Amplify Web App Server Side Rendering | $0.0000556 per GB-second and $0.3 per million requests | None  | $0 | NA  |
| S3 Object Lambda | $0.0000133 per GB-second, $1[^1] per million requests, $0.005 per GB returned | None  | $0 | NA  |
| S3 Select | $0.4 per million requests, $0.002 per GB scanned, $0.0007 per GB returned |  None  | $0 | NA  |

[^1]: $0.4 for the incoming S3 request, $0.2 for invoking the lambda, $0.4 for the S3 request from the lambda

# File Storage

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| EFS | $0.30 per GB-month, $0.03 per GB reads and $0.06 per GB writes | 5 GB, no reads/writes | $1.5 | 12 months |
| S3 | $0.023 per GB-month, $0.09 per GB transferred out to internet, $0.4 per million read requests, $5 per million write requests | 5GB, 20K GET requests, 2K PUT requests  | $0.13 | 12 months |

# Database

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| DynamoDB  | N   | $0     | NA  | NA | $1.25 per million write requests, $0.25 per million read [requests](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html), $0.25 per GB-month | 1 hour  |  &#10004; |
| TimeStream  | N   | $0     | NA  | NA | $0.50 per million write requests, $0.036 per GB-hour in memory, $0.03 per GB-month stored, $0.01 per GB scanned | 1 hour  |  &#10004; |


# Queues and Eventing

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| SQS | N | $0   | $0.40 per million 64KB requests | NA  |  &#10004; |
| SNS | N | $0   | $0.50 per million 64KB requests, $0.09 per GB transferred out to SQS or Lambda[^q6] | NA  |  &#10004; |
| EventBridge | N | $0   | $1 per million 64KB events published | NA  |  &#10004; |

[^q6]: $ 0.09 per GB transferred equivalent to $5 per million 64KB events or $0.09 per million 1KB events

# Orchestration

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| STEP Functions | N | $0 | $25 per million [state transitions](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-transitions.html) | NA  |  &#10004; |
| STEP Functions Express | N | $0 | $0.00001667 per GB-second and $1 per million requests | 100ms  |  &#10004; |

# Gateway

| Service | Cost Model | Free Tier | Monthly Value | Free Tier Duration |
|---------|-----|------------------|---------------|-------|-----------------------|-----|-----|
| Data Transfer out to Internet | $0.09 per GB transferred out | 100GB per month | $9 | Always |
| Data Transfer to other AWS region | $0.02 per GB transferred out | None | $0 | NA |
| CloudFront | $0 | $1 per million https requests, $0.085 per GB transferred out to internet | NA |  &#10004; |
| Amplify Web App Hosting | $0 | $0.15 per GB served | NA |  &#10004; |
| API Gateway (REST API)| $0 | $3.5 per million API calls received, $0.09 per GB transferred out to internet | NA |  &#10004; |
| API Gateway (HTTP API)| $0 | $1 per million 512KB API calls received, $0.09 per GB transferred out to internet | NA |  &#10004; |
| API Gateway (WebSocket API)| $0 | $1 per million 32KB messages sent or received by client, $0.25 per million connection minutes | NA |  &#10004; |
| AppSync (queries and mutations)| $0 | $4 per million requests received, $0.09 per GB transferred out to internet | NA |  &#10004; |
| AppSync (subscriptions)| $0 | $2 per million messages received by client, $0.08 per million connection minutes | NA |  &#10004; |
| Lambda Function URLs | $0 | No additional charge above the cost of invoking the lambda| NA |  &#10004; |
| IoT Core | $0 | $0.30 per million 5KB messages ingested, $1 per million 5KB messages received by client, $0.08 per million connection minutes | NA |  &#10004; |
| Cognito User Pools | $0 | $0.0055 per MAU (first 50k free indefinitely) | NA |  &#10004; |

# Footnotes

All costs correct at time of writing based on AWS US East region.