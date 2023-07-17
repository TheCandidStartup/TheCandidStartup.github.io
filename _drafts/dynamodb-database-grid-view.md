---
title: DynamoDB Database Grid View
tags: databases AWS
---

DynamoDB is AWS's flagship cloud native, horizontally scalable, NoSQL database. The work that ultimately led to the release of DynamoDB in 2012 [started in 2004](https://www.dynamodbguide.com/the-dynamo-paper/). Amazon was growing rapidly and finding it hard to scale their relational databases. The development of DynamoDB was driven by the [observation](https://www.allthingsdistributed.com/2017/10/a-decade-of-dynamo.html) that 70% of Amazon's queries were key-value lookups using a primary key to return a single row. Another 20% returned a set of rows from a single table. 

DynamoDB was built to satisfy these two use cases while achieving virtually unlimited scalability and consistent single digit milliseconds latency. 

## DynamoDB Data Model

DynamoDB stores items which consist of multiple attributes. DynamoDB supports ten different [data types](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html#HowItWorks.DataTypes) for attributes. These include simple scalar types (string, number, binary, boolean and null), document types equivalent to JSON (list is equivalent to a JSON array, map is equivalent to a JSON object), and three set types (string set, number set, binary set). Sets can contain any number of unique values. Only top level string, number and binary attributes can be used as keys. Items have an overall size limit of 400KB.

The [DynamoDB data model](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.Partitions.html) is a direct reflection of the original requirements. Every DynamoDB primary key includes a partition attribute. DynamoDB maps each row to a dedicated storage instance by [hashing the partition attribute](https://en.wikipedia.org/wiki/Consistent_hashing). As the table grows in size, DynamoDB automatically adds more storage instances, redistributing the data as needed. This allows DynamoDB to scale horizontally pretty much indefinitely. 

Every query must include a specific value for the partition attribute. This means that each query can be handled by routing it to the correct storage instance, by hashing the partition value in the query. This, together with an eventual consistency model, is what ensures DynamoDB's predictable, low latency response. This is all that is required to handle the first use case of key-value lookups returning a single row. 

{% include candid-image.html src="/assets/images/databases/dynamodb-partition-key.png" alt="DynamoDB Simple Key" attrib="[Amazon DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.Partitions.html#HowItWorks.Partitions.SimpleKey)" %}

The primary key can optionally include a sort attribute to create a composite primary key. Data is maintained in sorted order on each storage instance. Querying a table with a composite primary key will return multiple items in sorted order. You can retrieve all items with the same partition attribute, or a subset of items by specifying conditions on the sort attribute. This covers the second use case.

{% include candid-image.html src="/assets/images/databases/dynamodb-partition-sort-key.png" alt="DynamoDB Composite Key" attrib="[Amazon DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.Partitions.html#HowItWorks.Partitions.CompositeKey)" %}

Since it's initial release, DynamoDB has steadily added additional features. These include automatically maintained [secondary indexes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SecondaryIndexes.html), [batch writes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.BatchOperations), query filters, [conditional writes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.ConditionalUpdate), optional [strongly consistent reads](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html), [change data capture](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/streamsmain.html), optional [transactions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transactions.html), and support for a [subset of the PartiQL SQL compatible query language](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ql-reference.html).

* Compound sort key
* Read charged by KB retrieved rather than per row

## How Not To Do It

So, DynamoDB provides some simple building blocks designed for single table queries. How can we use them to implement our database backed grid view?

DynamoDB is a schemaless, NoSQL database with support for JSON like document types. We can use the same sort of JSON based structures that we used with [Postgres JSON]({% link _posts/2023-07-17-json-relational-database-grid-view.md %}) and [MongoDB]({% link _drafts/mongodb-database-grid-view.md %}). We can only index top level attributes, so we need to flatten the structure to something like this:

```
{
  "id": "020e",
  "name": "Needs Painting",
  "project": "35e9",
  "num": 1,
  "state": "open",
  "d1": "2023-05-01",
  "d2": "2023-06-01"
}
```

Once again we'd need 400 indexes to be able to sort by every custom field. We know that's a bad idea. So bad, that DynamoDB doesn't allow it. You can have at most 20 indexes. There's no MongoDB like Multikey Index. Looks like a dead end.

# Classic Design

OK, what if we take our (slightly de-) normalized relational database design and and transpose it into a DynamoDB design? That would require five separate tables: Tenant, Project, Issue, Attribute Definition and Attribute Value. However, there's no support for joins. How do you retrieve an issue together with all it's custom field values? 

Here's what our sample Attribute Value table looks like :
* Separate string_value and number_value attributes. DynamoDB is not entirely schemaless. Partition and Sort keys need to have consistent types. We need to index on value. Need two separate typed valued attributes, and two indexes.

In this case the empty fields in the table represent missing attributes in the DynamoDB item. 

## Single Table Design

* aka Adjacency List Pattern
* Store all entities in the same table
* All rows have three common fields (PK, SK, Data) + whatever other attributes that entity needs
* Include a type identifying prefix in all ids
* Identify top level entities which you want to read/write individually
  * Add a row per entity with PK set to the entity id. If the entity has another field that you want to query by (acts as an alternative id) store that in SK. Otherwise also set SK to entity id.
  * Use Data to store any attribute that you want to be projected into the index
  * Tenant, Project, Issue
* For each top level entity identify reference relationships to other top level entities
  * Add a row per relationship
  * For one to many relationship set PK to entity id on the "one" side and SK to entity id on the many side.
    * Use Data to store any attribute or combination of attributes that you want to sort on in the index
  * For one to one relationship decide which entity is PK and which is SK depending on required access patterns
    * Use Data to store any attribute that you want to be projected into the index
  * Add any other attributes associated with the *relationship*. Could be unique or denormalized (copy of data in main entity row).
* For each top level entity identify containment relationships to sub-entities
  * Add a row for each contained sub-entity with PK set to containing entity id and SK to sub-entity id
  * Use Data to store any attribute or combination of attributes that you want to sort on in the index
  * Add other sub-entity specific attributes

## Sample Data

<!-- This is horrible. I want to style the table by highlighting alternating entities in the table (each entity can span multiple rows). I want to use the compact markdown table for the content. This is the only way I've found to add styling. There's no ids in the html generated by markdown so all I can target is the HTML tags themselves. Embedded style sheet applies to the entire page so I have to target a specific table and then row in the table. -->
<style type="text/css">
table:first-of-type tr:nth-child(2) {background-color:#f3f6fa;}
table:first-of-type tr:nth-child(8) {background-color:#f3f6fa;}
table:first-of-type tr:nth-child(12) {background-color:#f3f6fa;}
table:first-of-type tr:nth-child(16) {background-color:#f3f6fa;}

table:nth-of-type(2) tr:nth-child(2) {background-color:#f3f6fa;}
table:nth-of-type(2) tr:nth-child(6) {background-color:#f3f6fa;}
table:nth-of-type(2) tr:nth-child(7) {background-color:#f3f6fa;}
table:nth-of-type(2) tr:nth-child(10) {background-color:#f3f6fa;}
table:nth-of-type(2) tr:nth-child(12) {background-color:#f3f6fa;}
table:nth-of-type(2) tr:nth-child(13) {background-color:#f3f6fa;}
</style>

| Entity Id (PK) | Related Id (SK) | Data | Name | Num | State | Type
|-|-|-|-|-|-|-|
| tenant-0807 | * | | ACME Engineering |
| tenant-3cc8 | * | | Big Media |
| project-35e9 | tenant-0807 | Forth Rail Bridge |
| project-35e9 | xattrib-35e6 | | Num Items | 3 | | int |
| project-35e9 | xattrib-3812 | | Start | 1 | | date |
| project-35e9 | xattrib-47e5 | | Sign Off | 4 | | text |
| project-35e9 | xattrib-882a | | End | 2 | | date |
| project-7b7e | tenant-3cc8 | The Daily News |
| issue-020e | project-35e9 | 1 | Needs Painting | | open |
| issue-020e | xattrib-3812 | 2023-05-01 | 
| issue-020e | xattrib-882a | 2023-06-01 |
| issue-3544 | project-7b7e | 1 | Launch new newspaper! | | closed |
| issue-67d1 | project-35e9 | 2 | Check for rust | | closed |
| issue-67d1 | xattrib-3812 | 2023-05-02 |
| issue-67d1 | xattrib-882a | 2023-06-02 |
| issue-83a4 | project-7b7e | 2 | Hire reporter for showbiz desk | | open |
| issue-af34 | project-35e9 | 3 | Girder needs replacing | | open |
| issue-af34 | xattrib-3fe6 | 42 |
| issue-af34 | xattrib-47e5 | Approved |

## Global Secondary Index

| Related Id (PK) | Data (SK) | Entity Id |
|-|-|-|
| tenant-0807 | Forth Rail Bridge | project-35e9 |
| tenant-3cc8 | The Daily News | project-7b7e |
| project-35e9 | 1 | issue-020e |
| project-35e9 | 2 | issue-67d1 | 
| project-35e9 | 3 | issue-af34 | 
| project-7b7e | 1 | issue-3544 | 
| project-7b7e | 2 | issue-83a4 | 
| xattrib-3812 | 2023-05-01 | issue-020e | 
| xattrib-3812 | 2023-05-02 | issue-67d1 |
| xattrib-3fe6 | 42 | issue-af34 |  
| xattrib-47e5 | Approved | issue-af34 | 
| xattrib-882a | 2023-06-01 |issue-020e | 
| xattrib-882a | 2023-06-02 | issue-67d1 | 

# DIY Compound Sort Key