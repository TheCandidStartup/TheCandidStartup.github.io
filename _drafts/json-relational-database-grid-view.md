---
title: JSON Relational Database Grid View
tags: databases
---

{% capture de_url %}{% link _drafts/denormalized-relational-database-grid-view.md %}{% endcapture %}
When we [aggresively denormalized]({{ de_url | append: "#combined-issue-and-attribute-value-table" }}) our [Grid View relational database]({% link _posts/2023-06-26-custom-fields-normalized-relational-database-grid-view.md %}), we were able to achieve our aim of a single table solution. However, it came with a lot of unintended consequences. In order to support up to 100 custom fields of each type, we added 400 custom field columns to our issue table, most of which were NULL. In theory the overhead should have been minimal. In practice, we ran into all kinds of implementation and operational problems.

Recently[^1], relational databases have added support for JSON columns. There's even an [ISO standard](https://www.iso.org/standard/67367.html) for it. Unfortunately, implementations [vary wildly](https://blog.jooq.org/standard-sql-json-the-sobering-parts/) in their standards conformance and reliance on non-standard extensions. Fortunately, Postgres has the [most mature and conformant implementation](https://obartunov.livejournal.com/200076.html). 

[^1]: Within the last 10 years. Which is recent when you consider the development history of relational databases.

TODO: Update data model
{% include candid-image.html src="/assets/images/databases/tenant-project-issue-attribute.png" alt="Tenant-Project-Issue-Attribute data model" %}

We can replace the 400 typed, mostly NULL, custom field columns with a single JSON column.

## Schema

The most straight forward schema is to use a JSON document with attribute definition ids as keys, and custom field values as values. Here's what our sample data would look like.

| id | name | project | num | state | custom_fields |
|-|-|-|-|-|-|
| 020e | Needs Painting | 35e9 | 1 | open | {"3812":"2023-05-01","882a":"2023-06-01"} 
| 3544 | Launch new newspaper! | 7b7e | 1 | closed |
| 67d1 | Check for rust | 35e9 | 2 | closed | {"3812":"2023-05-02","882a":"2023-06-02"}
| 83a4 | Hire reporter for showbiz desk | 7b7e | 2 | open |
| af34 | Girder needs replacing | 35e9 | 3 | open | {"3fe6":42,"47e5":"Approved"}

How does the storage overhead compare with our previous implementation attempts? Postgres has two JSON storage types. The JSON type stores the JSON document as a string with whitespace, ordering and precision preserved. The JSONB type converts the JSON document into a binary representation optimized for fast query and indexing. 

The JSON type has 4-6 bytes of document structure overhead per custom field (colons, double quotes, commas, etc), plus another 2 per document (curly brackets) Then we need to add 32 bytes for the attribute id UUID encoded as a string. Finally, there's up to 6 bytes of value type dependent overhead. For example, there's no dedicated date format in JSON so dates have to be encoded as strings. You need to be careful and use an encoding where a string sort corresponds to date order.

The JSONB type[^2] has 8 bytes of document structure overhead per custom field, plus another 8 per document. Keys are encoded as strings, so we still need 32 bytes for the attribute id UUID. There's no dedicated date format in JSONB either. However, numbers are stored using Postgres's Numeric type rather than as strings. Overall, there's still up to 6 bytes of value type dependent overhead.

[^2]: I couldn't find any formal spec for JSONB so had to rely on the [source code](https://github.com/postgres/postgres/blob/b0feda79fdf02710a6039a324299525845a4a9d4/src/include/utils/jsonb.h) and an overview [blog article](https://scalegrid.io/blog/using-jsonb-in-postgresql-how-to-effectively-store-index-json-data-in-postgresql/) to understand the format. 

| Custom Fields Used | Combined table | Attribute Value table | JSON | JSONB |
|-|-|-|-|-|
| 0 | 50 | 0 | 1 | 1 |
| 1 | 50 | 56 | 38-46 | 48-54
| 2 | 50 | 112 | 74-90 | 88-100
| 3 | 50 | 168 | 110-134 | 128-146

Storage overhead doesn't look great compared with our combined table with lots of columns. It's also only marginally better than our current best in class implementation with a separate attribute value child table. 

## Compact Schema

Could we use a more compact JSON representation? Rather than adding 32 bytes of overhead by storing the attribute id UUIDs directly, we can add a json_key column to the attribute definition table. We can encode custom field type and number in a two character string[^3]. We can also make the date format slightly more compact by removing the dashes.

[^3]: To keep the examples readable, I'm using letter (for type) + number, which would need up to 3 characters. As we have at most 400 custom fields per project, you could easily come up with a two character encoding. For example, using base 64.

| id | name | project | num | state | custom_fields |
|-|-|-|-|-|-|
| 020e | Needs Painting | 35e9 | 1 | open | {"d1":"20230501","d2":"20230601"} 
| 3544 | Launch new newspaper! | 7b7e | 1 | closed |
| 67d1 | Check for rust | 35e9 | 2 | closed | {"d1":"20230502","d2":"20230602"}
| 83a4 | Hire reporter for showbiz desk | 7b7e | 2 | open |
| af34 | Girder needs replacing | 35e9 | 3 | open | {"i1":42,"t1":"Approved"}

with a corresponding attribute definition table

| id | name | project | num | type | json_key |
|-|-|-|-|-|-|
| 3812 | Start | 35e9 | 1 | date | d1 |
| 882a | End | 35e9 | 2 | date | d2 |
| 3fe6 | Num Items | 35e9 | 1 | int | i1 |
| 47e5 | Sign Off | 35e9 | 2 | text | t1 |

What does that do to the overhead?

| Custom Fields Used | Combined table | Attribute Value table | JSON | JSONB |
|-|-|-|-|-|
| 0 | 50 | 0 | 1 | 1 |
| 1 | 50 | 56 | 8-16 | 18-24
| 2 | 50 | 112 | 14-30 | 28-40
| 3 | 50 | 168 | 20-44 | 38-56

Looking much healthier. Of course, none of this does us any good if we can't query the data efficiently. 

## Access Patterns

As always, the key query is retrieving issues on a project. We can retrieve the data as stored, with the custom fields encoded using JSON, and parse the JSON in our app server.

```
SELECT id,name,num,state,custom_fields
FROM issue WHERE issue.project = '35e9' ORDER BY num DESC;
```

Or we can get the database to extract the values for us. JSONB format is recommended if you're doing anything more than just storing and retrieving JSON documents.

```
SELECT id,name,num,state,
  to_date(custom_fields->>'d1','YYYYMMDD') AS custom1,
  to_date(custom_fields->>'d2','YYYYMMDD') AS custom2,
  (custom_fields->'i1')::int4 AS custom3,
  custom_fields->>'t1' AS custom4
FROM issue WHERE issue.project = '35e9' ORDER BY num DESC;
```

The `->` [operator](https://www.postgresql.org/docs/15/functions-json.html) extracts the value for the specified top level key. The value returned is in JSONB format, so needs to be cast to the appropriate type. The `->>` operator is a convenience which extracts the value and casts to text type.

* Sort by custom field
* Are the queries efficient? Using standard project,num index to get issues for project then sorting.

## Postgres GIN Index

* What is GIN? Sort index.
* Does it help?
* Only fields in JSON are indexed. Need something with project id and custom fields.
* Should we move all the other fields into JSON too?
* No - GIN doesn't give a sorted order. Only supports existence and equality queries. 

## Postgres Expression Index

* Can define index on any expression, including a mix of standard columns and values extracted from JSON.
* Can build the indexes that we want, but we're back to defining an index for each json_key. Back to 400 indexes. 

## Conclusion

## Footnotes
