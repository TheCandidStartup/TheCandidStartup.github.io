---
title: MongoDB Database Grid View
tags: databases
---

[Last time]({% link _drafts/json-relational-database-grid-view.md %}) we dipped our toes into the waters of schemaless databases by using a JSONB column in Postgres to store a set of custom fields. After a few attempts we got it working. However, it didn't offer many benefits compared with the [denormalized relational database optimizations]({% link _posts/2023-07-10-denormalized-relational-database-grid-view.md %}) we previously tried, while bringing in plenty of additional friction of its own. 

{% include candid-image.html src="/assets/images/databases/mongodb_logo_slate_blue.svg" alt="MongoDB logo" %}

This time we're exploring [MongoDB](https://www.mongodb.com) - a NoSQL JSON document database. However, before we get into that, what is meant by a [NoSQL](https://en.wikipedia.org/wiki/NoSQL) database? 

## NoSQL

NoSQL is really just shorthand for a modern database system that isn't a [relational database](https://en.wikipedia.org/wiki/Relational_database). There's a wide variety of different NoSQL databases but there is a set of commonly recurring traits.
* Queries are performed using calls to an API rather than by executing statements written in [SQL](https://en.wikipedia.org/wiki/SQL)
* Data models are either [schemaless](https://www.mongodb.com/unstructured-data/schemaless) or significantly more flexible than the relational model
* Queries are simpler and aligned with the underlying data model
* Cross table queries, such as joins, are not supported
* Referential integrity is not enforced
* There is a more relaxed approach to consistency. [ACID](https://en.wikipedia.org/wiki/ACID) transactions are either not supported or severely limited. Applications are expected to cope with the resulting [eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency). 
* There is a focus on [horizontal](https://en.wikipedia.org/wiki/Scalability#HORIZONTAL-SCALING) rather than [vertical](https://en.wikipedia.org/wiki/Scalability#VERTICAL-SCALING) scaling
* Many features provided by relational databases are missing. Features may be omitted to improve scalability, simplify implementation or to make the database easy to understand.

Not all NoSQL databases exhibit all of these traits but most have a significant subset of them.

## MongoDB

MongoDB is a popular JSON document database with a rich set of features and a reputation for ease of use. It's only a small step from Postgres with JSONB to MongoDB, which makes it a perfect starting point in the world of NoSQL. In addition, I have some experience with teams that have used MongoDB in production.

According to the [manual](https://www.mongodb.com/docs/manual/), "MongoDB is a document database designed for ease of application development and scaling". As well as the cloud hosted [Atlas](https://www.mongodb.com/atlas/database) deployment, there is a [free community edition](https://www.mongodb.com/try/download/community) that you can host yourself. 

MongoDB stores records as [documents](https://www.mongodb.com/docs/manual/core/document/) (equivalent to a relational row) which are gathered together in [collections](https://www.mongodb.com/docs/manual/core/databases-and-collections/) (equivalent to a relational table). Documents are defined using the [BSON](https://bsonspec.org/spec.html) binary JSON representation (equivalent to JSONB in Postgres). Unlike JSONB, BSON has binary representations for commonly used types like dates, integers and double precision floating point numbers. 

Unusually for a NoSQL database, you have access to many of the features provided by relational databases. There's a query API with a [rich set](https://www.mongodb.com/docs/manual/reference/operator/query/) of comparison, logical and projection operators. You can specify a [sort](https://www.mongodb.com/docs/v6.0/reference/method/cursor.sort/) order for the results, over any number of fields. There's a [limit](https://www.mongodb.com/docs/v6.0/reference/method/cursor.limit/) method for pagination. An [interactive shell](https://www.mongodb.com/docs/mongodb-shell/) let's you interact directly with the database.

You can create [indexes](https://www.mongodb.com/docs/manual/indexes/) to improve query performance. There's even a [query planner](https://www.mongodb.com/docs/v6.0/core/query-plans/) that decides which index to use together with an [explain](https://www.mongodb.com/docs/v6.0/reference/command/explain/) method to figure out what it's doing. 

Makes me feel right at home. Let's get started.

## First Try Schema

We can begin with pretty much the same schema we used with Postgres JSONB. Here's how one of the sample issues looks as a JSON document. 

```
{
  "_id": "020e",
  "name": "Needs Painting",
  "project": "35e9",
  "num": 1,
  "state": "open",
  "custom_fields": 
  {
    "d1": "2023-05-01",
    "d2": "2023-06-01"
  }
}
```

In MongoDB every document must have a field called "[_id](https://www.mongodb.com/docs/v6.0/core/document/#the-_id-field)" which stores a unique identifier for the document within it's collection. 

## BSON Storage

Documents are stored using the [BSON](https://bsonspec.org/spec.html) binary format. BSON has native support for many types including binary, integers, doubles, and datetime. There's no direct support for enums, like our state field. You either bias for readability and use a string, or for efficiency and use an integer.

MongoDB provides [libraries](https://www.mongodb.com/docs/drivers/) for multiple programming languages that make it easy to work with BSON data and call the MongoDB API. Here's how you would use JavaScript to create our sample issue ready to be serialized as BSON.

```
var issue = {
  _id: UUID("020e"),
  name: "Needs Painting",
  project: UUID("35e9"),
  num: NumberInt(1),
  state: "open",
  custom_fields: 
  {
    d1: ISODate("2023-05-01"),
    d2: ISODate("2023-06-01")
  }
}
```

Apart from the additional types, BSON is a pretty much straight transliteration of JSON into a binary form. Like JSONB, field names are embedded explicitly as strings so [short field names are preferred](https://www.mongodb.com/docs/manual/core/data-model-operations/#storage-optimization-for-small-documents) to avoid overhead.

## Access Patterns

While not written in SQL, MongoDB queries should look familiar. All the standard elements are present and correct, just using a different syntax. Here's our basic query that returns issues on a project sorted by num.

```
db.issue.find( { project: UUID("3fe9") } ).sort( { num: 1 } )
```

The API uses a [fluent](https://en.wikipedia.org/wiki/Fluent_interface) style with methods chained together. The find method is passed a [query filter document](https://www.mongodb.com/docs/manual/core/document/#std-label-document-query-filter) that specifies a set of fields and conditions. The [sort](https://www.mongodb.com/docs/manual/reference/method/cursor.sort/) method is passed a sort document which specifies a set of fields and sort directions (1 for ascending, -1 for descending).

Here's query that sorts by custom field and num, then returns the first page of results found. 

```
db.issue.find( { project: UUID("3fe9") } ).sort( { "custom_fields.d1": 1, num: 1 } ).limit(50)
```

Similar to a relational database, MongoDB's query planner will use an index to retrieve data in sorted order if possible, otherwise it will retrieve all the issues and sort them (known as a [blocking sort](https://www.mongodb.com/docs/v6.0/tutorial/sort-results-with-indexes/)). Naturally, you don't want to use a blocking sort when working with large paginated data sets. 

## Compound Index

As with our [JSON relational database]({% link _drafts/json-relational-database-grid-view.md %}), we can create a compound index over multiple fields to support this query. The index specification document uses a similar syntax to the sort document. 

```
db.issue.createIndex( { project: 1, "custom.fields.d1": 1, num: 1} )
```

And just like last time, if we want to support sorting of any of the 400 possible custom fields, we will need 400 indexes. And yes, once again, we'll need to use [partial indexes](https://www.mongodb.com/docs/v6.0/core/index-partial/) to keep index management to a reasonable level, which in turn means paginating over two separate queries. 

Can a dedicated JSON document database really offer no improvements over Postgres? Well, there is something unique to MongoDB that should help. But first we need to change our schema.

## Idiomatic Mongo Schema

Data modelling is all about defining entities and the relationships between them. With a [normalized relational database]({% link _posts/2023-06-19-normalized-relational-database-grid-view.md %}), you have one way to represent this, regardless of the type of relationship. You use a separate table to store each entity. You use a field storing the id of another entity for a relationship.

MongoDB gives you [two ways](https://www.mongodb.com/docs/manual/core/data-model-design/) to model relationships. You can do it the same way as a normalized relational database using [references](https://www.mongodb.com/docs/manual/tutorial/model-referenced-one-to-many-relationships-between-documents/). Or if the relationship you're modelling represents containment, you can use [embedded documents](https://www.mongodb.com/docs/manual/tutorial/model-embedded-one-to-one-relationships-between-documents/). 

The advantage of embedded documents are that they are stored with the containing document. Any query that retrieves the containing document gets all the embedded documents too. This is exactly what we've been trying to achieve with our [denormalized]({% link _posts/2023-07-10-denormalized-relational-database-grid-view.md %}) and [JSONB]({% link _drafts/json-relational-database-grid-view.md %}) relational database implementations. 

If we model custom fields as embedded documents our sample issue document will look something like this:

```
var issue = {
  _id: UUID("020e"),
  name: "Needs Painting",
  project: UUID("35e9"),
  num: NumberInt(1),
  state: "open",
  custom_fields: 
  [
    { attribute: UUID("3812"), value: ISODate("2023-05-01") },
    { attribute: UUID("882a"), value: ISODate("2023-06-01") }
  ]
}
```

This is our normalized relational database data model mapped directly to the equivalent idiomatic MongoDB schema.  

## Multikey Index

## Conclusion
