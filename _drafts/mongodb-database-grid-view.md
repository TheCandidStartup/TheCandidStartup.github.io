---
title: MongoDB Database Grid View
tags: databases
---

[Last time]({% link _drafts/json-relational-database-grid-view.md %}) we dipped our toes into the waters of schemaless databases by using a JSONB column in Postgres to store a set of custom fields. After a few attempts we got it working. However, it didn't offer many benefits compared with the [denormalized relational database optimizations]({% link _posts/2023-07-10-denormalized-relational-database-grid-view.md %}) we previously tried, while bringing in plenty of additional friction of its own. 

{% include candid-image.html src="/assets/images/databases/mongodb_logo_slate_blue.svg" alt="MongoDB logo" %}

This time we're exploring [MongoDB](https://www.mongodb.com) - a NoSQL JSON document database. However, before we get into that, what is meant by a [NoSQL](https://en.wikipedia.org/wiki/NoSQL) database? 

## NoSQL

NoSQL is really just shorthand for a modern database system that isn't a [relational database](https://en.wikipedia.org/wiki/Relational_database). NoSQL databases vary wildly but do have a set of commonly recurring traits.
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

According to the [manual](https://www.mongodb.com/docs/manual/), "MongoDB is a document database designed for ease of application development and scaling". As well as the cloud hosted [Atlas](https://www.mongodb.com/atlas/database) deployment, there is a [free community edition](https://www.mongodb.com/try/download/community) that you can host yourself. AWS have their own [DocumentDB database](https://aws.amazon.com/documentdb/) which is MongoDB compatible at the API and driver level.

MongoDB stores records as [documents](https://www.mongodb.com/docs/manual/core/document/) (equivalent to a relational row) which are gathered together in [collections](https://www.mongodb.com/docs/manual/core/databases-and-collections/) (equivalent to a relational table). Documents are defined using the [BSON](https://bsonspec.org/spec.html) binary JSON representation (equivalent to JSONB in Postgres). Unlike JSONB, BSON has binary representations for commonly used types like dates, integers and double precision floating point numbers. 

Unusually for a NoSQL database, you have access to many of the features provided by relational databases. There's a query API with a [rich set](https://www.mongodb.com/docs/manual/reference/operator/query/) of comparison, logical and projection operators. You can specify a [sort](https://www.mongodb.com/docs/v6.0/reference/method/cursor.sort/) order for the results, over any number of fields. There's a [limit](https://www.mongodb.com/docs/v6.0/reference/method/cursor.limit/) method for pagination. An [interactive shell](https://www.mongodb.com/docs/mongodb-shell/) let's you interact directly with the database. There is optional support for [ACID transactions](https://www.mongodb.com/docs/v6.0/core/transactions/).

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

Documents are stored using the [BSON](https://bsonspec.org/spec.html) binary format. BSON is a super set of JSON and has native support for many types including binary, integers, doubles, and datetime. There's no direct support for enums, like our state field. You either bias for readability and use a string, or for efficiency and use an integer.

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

Here's a query that sorts by custom field and num, then returns the first page of results found. 

```
db.issue.find( { project: UUID("3fe9") } )
        .sort( { "custom_fields.d1": 1, num: 1 } )
        .limit(50)
```

Similar to a relational database, MongoDB's query planner will use an index to retrieve data in sorted order if possible, otherwise it will retrieve all the issues and sort them (known as a [blocking sort](https://www.mongodb.com/docs/v6.0/tutorial/sort-results-with-indexes/)). Naturally, you don't want to use a blocking sort when working with large paginated data sets. 

## Compound Index

As with our [JSON relational database]({% link _drafts/json-relational-database-grid-view.md %}), we can create a compound index over multiple fields to support this query. The index specification document uses a similar syntax to the sort document. 

```
db.issue.createIndex( { project: 1, "custom_fields.d1": 1, num: 1} )
```

And just like last time, if we want to support sorting of any of the 400 possible custom fields, we will need 400 indexes. And yes, once again, we'll need to use [partial indexes](https://www.mongodb.com/docs/v6.0/core/index-partial/) to keep index management to a reasonable level, which in turn means paginating over two separate queries. 

Can a dedicated JSON document database really offer no improvements over Postgres? Well, there is something unique to MongoDB that should help. But first we need to change our schema.

## Idiomatic Mongo Schema

Data modelling is all about defining entities and the relationships between them. With a [normalized relational database]({% link _posts/2023-06-19-normalized-relational-database-grid-view.md %}), you have one way to represent this, regardless of the type of relationship. You use a separate table to store each entity. You represent a relationship with a field that stores the id of the related entity.

MongoDB gives you [two ways](https://www.mongodb.com/docs/manual/core/data-model-design/) to model relationships. You can do it the same way as a normalized relational database using [references](https://www.mongodb.com/docs/manual/tutorial/model-referenced-one-to-many-relationships-between-documents/). Or if the relationship you're modelling represents containment, you can use [embedded documents](https://www.mongodb.com/docs/manual/tutorial/model-embedded-one-to-one-relationships-between-documents/). 

The advantage of embedded documents is that they are stored with the containing document. Any query that retrieves the containing document gets all the embedded documents too. This is exactly what we've been trying to achieve with our [denormalized]({% link _posts/2023-07-10-denormalized-relational-database-grid-view.md %}) and [JSONB]({% link _drafts/json-relational-database-grid-view.md %}) relational database implementations. 

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

This is our [normalized relational database data model]({% link _posts/2023-06-26-custom-fields-normalized-relational-database-grid-view.md %}) mapped directly to the equivalent idiomatic MongoDB schema.  

## Multikey Index

Embedded document data models work well with the MongoDB [Multikey Index](https://www.mongodb.com/docs/manual/core/index-multikey/). When creating an index for a field in an array of embedded documents, MongoDB will add an index entry for *each* embedded document. 

We can create a single index that contains all our custom field attributes and values, with the values for each attribute type listed in order. By default, every document in the collection is included in the index, with null values for any fields that don't exist. I've added a partial filter expression to only include documents that have custom fields. 

```
db.issue.createIndex(
  { "custom_fields.attribute": 1, "custom_fields.value": 1, num: 1},
  { partialFilterExpression: { "custom_fields.attribute" { $exists: true }}}
)
```

The resulting index for our sample data looks like :

| custom_fields.attribute | custom_fields.value | num | Document Id |
|-|-|-|-|-|
| 3812 | 2023-05-01 | 1 | 020e |
| 3812 | 2023-05-02 | 2 | 67d1 |
| 3fe6 | 42 | 3 | af34 |
| 47e5 | "Approved" | 3 | af34 |
| 882a | 2023-06-01 | 1 | 020e |
| 882a | 2023-06-02 | 2 | 67d1 |

Note that there are multiple entries for each document. One row for every custom field defined.

Finally, we've got a clear improvement on our normalized relational data model. We have a single issues collection where a complete issue can be retrieved with a single read and updated with a single write. We have added a single index equivalent to the relational attribute value index. However, this one includes a secondary sort on the num field. For each custom attribute, we have index entries in value order with a secondary sort on num. 

We still need the separate query for issues that don't have the specified custom attribute defined, but that's inevitable unless we want to index up to 400 fields worth of NULL value. 

## The Impossible Query

I was so excited when I saw what you could do with a Multikey Index. I quickly jotted down the query we'd need based on an [example in the MongoDB documentation](https://www.mongodb.com/docs/manual/core/index-multikey/#index-arrays-with-embedded-documents).

```
db.issue.find( { "custom_fields.attribute": "3812" } )
        .sort( { "custom_fields.value": 1, num: 1 } )
```

The example links to a separate page in the manual that provides more detail on how [indexes are used to sort query results](https://www.mongodb.com/docs/manual/tutorial/sort-results-with-indexes/). Right at the top of that page there's a scary looking note.

{% include candid-image.html src="/assets/images/databases/mongodb-multikey-index-note.png" alt="MongoDB Multikey Index Note" %}

What the heck does that mean? The whole point of doing this is to avoid a blocking sort. 

[Index boundary](https://www.mongodb.com/docs/manual/core/multikey-index-bounds/) is a term that MongoDB uses to describe a condition that limits how much of the index will be scanned. Our query has a boundary on custom_fields.attribute of `["3812","3812"]`, because we're only interested in the part of the index that relates to that attribute. That's OK. The problem is that we're sorting on custom_fields.value which has the same path prefix as custom_fields.attribute.

Oh dear. MongoDB won't use our perfect index to return the results we want in sorted order. But why? In the end I tracked down the [issue](https://jira.mongodb.org/browse/SERVER-31898) that led to this note being added to the manual. 

What does it mean to sort on custom_fields.value when custom_fields is an array of embedded documents? Should the sort order change if there's a query predicate?

I'm assuming that if there's a query predicate that selects a single embedded document from the array, the sort order is based on that selected embedded document. This is what MongoDB [used to do in version 3.5 and earlier](https://jira.mongodb.org/browse/SERVER-19402). 

The semantics changed in later versions of MongoDB. Now the sort order is independent of any query predicate. The [sort order](https://www.mongodb.com/docs/v6.0/reference/bson-type-comparison-order/) is always based on whichever embedded document in the array has the smallest value for the specified field. If the issue contains a different custom field with a lower value, MongoDB will sort on that, rather than the custom field I'm actually interested in. Which is why it won't use the index that would give results in the order I actually want. 

OK. You want the sort and query predicate to be independent. That kind of makes sense. So how do I specify a sort condition that looks at a specific embedded document rather than the one with the smallest value?

Well, as far as I can tell, you can't. 

Do let me know if there is a way to make this work. I'd love to be proved wrong.

## Conclusion

MongoDB snatches defeat from the jaws of victory. 

Sadly, the teams I knew that used MongoDB in production had similar experiences. MongoDB is easy to use, with all the convenience features you might expect from a relational database. However, at some point you hit a brick wall. The query you need isn't possible to express, or isn't possible to express efficiently. The query API looks very flexible on the surface, but once you go deeper you run into all kinds of special case restrictions. 

I think this is down to MongoDB's lack of maturity compared with relational databases. As you look back through the last few major versions, you see fundamental changes in semantics. The MongoDB team are still figuring out how things should work. In contrast, the semantics of relational databases were rigorously worked out 30 years ago. The query functionality is deeper and better understood.

Will other NoSQL databases have similar problems? Ironically, I believe that their comparative lack of features will save them. I can get MongoDB to build the index I need, but I can't use it because MongoDB's query planner stops me from accessing it directly. A leaner, meaner NoSQL database would make me plan my own queries and access the index directly.

In 2007, engineers from Amazon published the [Dynamo Paper](https://www.dynamodbguide.com/the-dynamo-paper/). It described the learnings from building an in-house, highly available, lean and mean, key-value store. The paper went on to inspire many of the original NoSQL databases. In 2012, AWS released DynamoDB, a managed database service based on the Dynamo principles. 

Next time we'll find out whether DynamoDB is a better choice for implementing a [database backed grid view]({% link _posts/2023-06-12-database-grid-view.md %}).
