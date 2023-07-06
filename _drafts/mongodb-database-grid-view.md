'.---
title: MongoDB Database Grid View
tags: databases
---

[Last time]({% link _drafts/json-relational-database-grid-view.md %}) we dipped our toes into the waters of schemaless databases by using a JSONB column in Postgres to store a set of custom fields. After a few attempts we got it working. However, it didn't offer many benefits compared with the [denormalized relational database optimizations]({% link _drafts/denormalized-relational-database-grid-view.md %}) we previously tried, while bringing in plenty of additional friction of its own. 

{% include candid-image.html src="/assets/images/databases/mongodb_logo_slate_blue.svg" alt="MongoDB logo" %}

This time we're exploring [MongoDB](https://www.mongodb.com) - a NoSQL JSON document database. However, before we get into that, what is meant by a [NoSQL](https://en.wikipedia.org/wiki/NoSQL) database? 

## NoSQL

NoSQL is really just shorthand for a modern database system that isn't a [relational database](https://en.wikipedia.org/wiki/Relational_database). There's a wide variety of different NoSQL databases but there is a set of commonly recurring traits.
* Queries are performed using calls to an API rather than by executing statements written in [SQL](https://en.wikipedia.org/wiki/SQL)
* Data models are either [schemaless](https://www.mongodb.com/unstructured-data/schemaless) or significantly more flexible than the relational model
* There is a focus on [horizontal](https://en.wikipedia.org/wiki/Scalability#HORIZONTAL-SCALING) rather than [vertical](https://en.wikipedia.org/wiki/Scalability#VERTICAL-SCALING) scaling
* Queries are simpler and more constrained by the underlying data model. Ad hoc joins are not supported.
* There is a more relaxed approach to consistency. [ACID](https://en.wikipedia.org/wiki/ACID) transactions are either not supported or severely limited. Applications are expected to cope with the resulting [eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency). 
* Many features provided by relational databases are missing. Features may be omitted to improve scalability, simplify implementation or to make the database easy to understand.

Not all NoSQL databases exhibit all of these traits but most have a significant subset of them.

## Why MongoDB?

Why did I pick MongoDB for my first look at a NoSQL database? 
* It's a popular JSON document database with a rich set of features and a reputation for ease of use
* It's only a small step from Postgres with JSONB to MongoDB. 
* I have some experience with teams that have used MongoDB in production.

## MongoDB

According to the [manual](https://www.mongodb.com/docs/manual/), "MongoDB is a document database designed for ease of application development and scaling". As well as the cloud hosted [Atlas](https://www.mongodb.com/atlas/database) deployment, there is a [free community edition](https://www.mongodb.com/try/download/community) that you can host yourself. 

MongoDB stores records as [documents](https://www.mongodb.com/docs/manual/core/document/) (equivalent to a relational row) which are gathered together in [collections](https://www.mongodb.com/docs/manual/core/databases-and-collections/) (equivalent to a relational table). Documents are defined using the [BSON](https://bsonspec.org/spec.html) binary JSON representation (equivalent to JSONB in Postgres). Unlike JSONB, BSON has binary representations for commonly used types like dates, integers and double precision floating point numbers. 

* Unusual for NoSQL, has many of the features provided by relational databases.
* Indexing
* Views, Joins, Materialized Views
* Query Planner

## First Try Schema

## BSON 

## Idiomatic Mongo Schema

## Multikey Index

## Why doesn't it work?

## Conclusion
