---
title: AWS re:Invent 2023
tags: aws
---

It's that time of year again. Just like [last year]({% link _posts/2022-12-12-aws-reinvent-2022.md %}), I'm going to use the week after re:Invent to binge on recorded sessions at 1.5X speed, and share my thoughts with you. 

All the sessions are recorded with high quality audio/video and available via both the [AWS web site](https://reinvent.awsevents.com/on-demand/) and [YouTube](https://www.youtube.com/@AWSEventsChannel). 

If you're looking for a comprehensive list of all the new announcements, then head over to the [AWS News Blog](https://aws.amazon.com/blogs/aws/top-announcements-of-aws-reinvent-2023/). 

# Keynotes

## Peter DeSantis - SVP AWS

[YouTube](https://youtu.be/pJG6nmR7XxI?si=c96mUW4DPGRmA_Dm)

The "Monday Night Live tradition of diving deep into the engineering that powers AWS services". This time focus is on Aurora Limitless, Elasticache Serverless, Redshift Serverless and Quantum Computing research. 
* Why serverless is great
    * More elastic
    * Pay only for what you use
    * More sustainable
    * More secure
* Why isn't everything serverless?
    * Customers wary of the new
    * Less capable than traditional services in the beginning
* AWS do whatever customers ask
* Making it easier to use traditional serverfull services like relational databases
    * RDS makes it easier
    * Then Aurora which is effectively built on serverless storage layer ("Grover")
    * Aurora serverless gives you auto scaling of the database engine instances (but still running on dedicated instances)
    * Nitro hypervisor to securely divide physical hardware into instances. Rigid boundaries.
    * Caspian is new hypervisor for databases. Able to dynamically scale memory up and down depending on load. 
        * If physical hardware runs out of memory, Caspian tells DB no more memory is available and migrates it to another physical instance.
        * Prediction system to make sure more resources are available
    * Still have upper limit of fixed number of instances at maximum size. Need to shard DB to go beyond. Which is hard for application to implement.
    * Announcing **Aurora Limitless Database**.
        * Automatically distributes data across multiple shards
        * Provides transactional consistency across shards
        * Lightweight routing layer - just enough metadata to be able to route
        * All shards are elastic, running on Caspian. 
        * Grover makes it easy to split shard by duplicating then using Caspian to scale down. 
        * Needs distributed timekeeping for cross-shard transactions.
        * Rather than using single timekeeper or logical clocks, uses AWS Time Sync service to ensure all system clocks within millisecond.
        * Limits number of ordered transactions you can have. 
        * Latest versions of Nitro have dedicated hardware that interacts with rack local reference clock that in turn is connected to dedicated time distribution hardware synced with an atomic clock. All in hardware. Can sync clocks within some number of nanoseconds.
        * Same system accessible to customers through new version of AWS Time Sync which provides accurate time with sub-microsecond latency. 
        * Means Aurora limitless can have hundreds of thousands of ordered events per second.
    * AWS ElastiCache
        * Currently not serverless
        * Have to specify a server instance to run it on
        * Announcing **Amazon ElastiCache Serverless**
        * Redit 7 and Memcached 1.6 compatible
        * p50 latency of 500 us, p99 of 1.2ms
        * Supports up to 5TB memory
        * Uses same Caspian/Grover shards as Aurora with a low latency, predictable routing layer in front of it
        * Customer story from Riot games, migrating League of Legends to AWS
            * Need to update simulation state 128 times a second to make first person shooter fair
            * Migrated 14 data centers to AWS
            * Needed AWS to version of EKS which could guarantee container would stay up for 35 minutes (length of game)
    * AWS Redshift Serverless
        * Issues with interference between queries. Large ETL query can crowd out small ad-hoc realtime queries.
        * Previously scaled based on query volume, time to spin up new capacity, doesn't work well for mixed size workloads
        * Announcing **Next-generation AI based scaling**
        * ML forecasting model for capacity needed
        * Separate ML model to predict resource requirements of each query
        * Locally trained query that understands your queries, fallback to bigger globally trained model for more complex queries
        * Needs to understand how queries will respond to more resoures (superlinear, linear or sublinear)
        * Intelligent query manager which decides how to best schedule queries using available resources
* Quantum Computing
    * Quick history of quantum computing
    * Need many thousands of qubits to do anything useful
    * Quantum computers are hard to scale because of errors introduced by noise - phase flips as well as bit flips
    * State of art is 1 error per 1000 quantum operations
    * Need 1 error in billions of operations
    * Can do error correction but then need 1000s of physical qubits for each logical. Currently need millions for interesting algorithms.
    * AWS quantum team using new hardware error correction system with 6X improvement

## Adam Selipsky - CEO AWS

[YouTube](https://youtu.be/PMfn9_nTDbM?si=nkBa4A-K__BxFtX0)

AWS CEO "shares his perspective on cloud transformation". Highlighting innovation in data, infrastructure, AI and ML.
* Partnership with Salesforce
* 80% of "unicorn" startups on AWS
* Segways into the standard AWS pitch
* Announcing **AWS S3 Express One Zone**
    * Highest performance and lowest latency cloud storage
    * Designed for caching workloads (*aka can lose data*)
    * Data is stored in single customer selected AZ (colocate with your compute)
    * Single-digit millisecond latency
    * Millions of requests per minute (*which is a weird metric, guess requests per second number wasn't impressive enough*)
    * 50% lower access costs vs S3 standard
* Announcing **AWS Graviton 4**
    * 50% more cores, 30% faster, more efficient
    * R8g is first Graviton 4 instance
* Generative AI
    * AI stack: training and running models, tools to work with standard foundation models, applications that leverage FMs
    * Training and running models
        * Partnership with NVIDIA, always first with latest NVIDIA chips
        * EC2 ultra clusters - up to 20K GPUs
        * Jenson Huang (*with his trademark leather jacket*), live on stage
        * Two million GPUs on AWS already
        * Announcing **availability of three new GPUs on AWS** plus all NVIDIA's software stacks and libraries
        * GH200 chips have GPU + ARM core on same chip with 1TB/s interconnect
        * Announcing **DGX cloud on AWS**. DGX cloud is tool that NVIDIA's AI teams use internally for training.
        * EC2 Capacity blocks for ML - reserve EC2 ultra blocks for short term use
        * Announcing **AWS Trainium 2**
            * 4X faster for Trainium 1 chips
        * AWS Neuron SDK to use standard frameworks on Trainium
    * Tools to work with standard foundation models
        * AWS bedrock - choice of industry standard FMs
        * Partnership with Anthropic - Dario Amodei live on stage
        * Range of AWS Titan FMs
        * Bedrock allows you to fine tune Titan FMs based on your own data
        * Retrieval Augmented Generation (RAG) - using additional data that model wasn't trained on. Now in GA.
        * Continuous pre-training - customizing FM using unlabelled data
        * Agents for Bedrock now in GA. Combines FM + prompts + Lambda to let AI execute tasks (*scary!*)
        * Bedrock security - no customer data used to train shared foundation model, fine tuned model private to you. 
        * Announcing **Guardrails for Bedrock** - specify responsible AI policies for your applications
        * Pfizer customer story
    * Top level of stack
        * Free AI/ML training, commitment to train 25 million people
        * CodeWhisperer code suggestions free for individual use
        * CodeWhisperer Customization using your own code (private to you)
        * Announcing **Amazon Q** generative AI powered assistant
            * Understands user's role and access to information, prevents access to information you shouldn't have access to
            * Integrated into console and AWS marketing site (*lots of third party reports that Q is leaking private AWS information like non-public roadmaps*!)
            * Amazon CodeCatalyst Q integration to plan and automate feature development lifecycle
            * Amazon Q Code Transformation - upgrade code, remove deprecated code, apply security best practices. Only available on Java so far. 
            * Amazon Q as business expert - integrations with 40 enterprise applications
            * Connect to data sources, index them, generate semantic understanding
            * Answers include references to sources
            * Supports queries on ad-hoc data by uploading documents
            * Amazon Q in AWS QuickSight to tailor dashboard and generate reports based on your prompts
            * Amazon Q in AWS Connect call center system
        * BMW customer story
* "Your data is your differentiator"
    * Cloud data services: S3, relational databases, special purpose databases, analytics, AI training
    * Integration using painful ETL process
    * Vision of zero ETL future
    * Last year had Aurora MySQL-RedShift zero ETL integration
    * Announcing **Aurora PostgresSQL, RDS MySQL, DynamoDB zero ETL integrations with Redshift**
    * Announcing **DynamoDB zero ETL integration with OpenSearch**
    * Amazon DataZone to populate and maintain a data catalog
    * Announcing **Amazon DataZone AI Recommendations** to add more automation to the process
* Project Kuiper internet satellites. Announcing **Kuiper Private Connectivity Services**, direct link style connection from customer to AWS via Kuiper
