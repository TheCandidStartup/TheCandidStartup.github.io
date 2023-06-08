---
title: Normalized Relational Database Grid View
tags: databases cloud-architecture
---

Let me take you back to a time before [NoSQL](https://en.wikipedia.org/wiki/NoSQL), when [E.F. Codd's](https://en.wikipedia.org/wiki/Edgar_F._Codd) [relational rules](https://en.wikipedia.org/wiki/Codd%27s_12_rules) and [normal forms](https://en.wikipedia.org/wiki/Database_normalization) were the last word in database design. Data was modelled logically, without redundant duplication, with integrity enforced by the database. 

To the sceptic, a normalized database is a design that divides the data into as many different tables as possible, regardless of what that means for efficiency and performance. To the believer, a normalized database is an elegant representation of the problem domain that ensures referential integrity and avoids the need for large scale rework as the design evolves over time.

{% include candid-image.html src="/assets/images/databases/tenant-project-issue.png" alt="Tenant-Project-Issue data model" %}

Here's a basic data model for the GitHub Project Issues example of a Grid View that we looked at [last time]({% link _drafts/database-grid-view.md %}). The image is from the [Postgres](https://www.postgresql.org/) database [ERD design tool](https://www.pgadmin.org/docs/pgadmin4/development/erd_tool.html). I'll be using Postgres for my examples but the same basic principles apply to any relational database.

## Basic Schema

There are three tables: tenant, project and issue. There is a 1:many relationship between tenants and projects, and another between projects and issues. Each entity has a name and an id. That's it for tenants and projects. 

You might be tempted to try and simplify the design. Do you really need three separate tables?

The key to a normalized design is that the columns in each table are independent of each other. There are no constraints that mean a specific value in one column requires a corresponding value in another column. If there are, that's a sign that there's a subset of columns that should be broken out as a separate table. That means, for example, that you couldn't eliminate the tenant table by adding a tenant name column to the project table. Tenant name is dependent on tenant id. We would be redundantly storing that information on every project in the tenant. 

As your design evolves over time you will also find that you need to add additional columns to tenant and project. Best to start with a clean design up front that makes it easy to do so.

Issue is a little more interesting. As well as name and id we have an issue number and state. GitHub issues each have a number that is unique within a project and a state that is either open or closed. I've modeled state as a Postgres [enum type](https://www.postgresql.org/docs/15/datatype-enum.html) so that it's easy to add more types in future. I've also added a [UNIQUE](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS) constraint to ensure that each row in the table has a unique combination of project id and num. 

## Keys

The keen eyed amongst you will have noticed that I'm using uuid primary keys. What type of key you use can be a hotly contested debate. 

First off, do you use a [natural](https://en.wikipedia.org/wiki/Natural_key) or [surrogate](https://en.wikipedia.org/wiki/Surrogate_key) key? A natural key is one that already exists in the data you're modelling. For example, you could use name as a natural key for a tenant. A natural key imposes a uniqueness constraint on the data. If we used (project,num) as a natural composite key for the issue table, we wouldn't have needed to add a separate unique constraint.

The down side of a natural key is that changes in requirements can be hard to cope with. For example, if the business rules change so that the natural key is no longer unique, or if the format of data included in the key has to change. This can be particularly painful in a micro-services world where keys from one service may be stored in another. For example, the business may decide that it needs to support the ability to merge projects. Which means renumbering the issues from one of the projects.

In contrast, a surrogate key is entirely independent of the data being modelled. You need an extra column to store a surrogate key but in exchange you know that changes in business rules won't have any impact on keys.

Once you've decided to use a surrogate key, you need to decide what data type to use for the key. There are three choices: integer (32 bits), bigint (64 bits), uuid (128 bits. With integer and bigint keys, the database system allocates a key for newly created data, usually [using a sequence counter](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-identity-column/). 

You may be tempted to start off with an integer key. Four thousand million rows seems like plenty. You can always change it later if your application is a massive success and you start to run out of ids.

Don't. I've lived through too many crises caused by running out of integer ids. The small amount of space you're saving is never worth the potential future pain. In the worst case, the team running the service doesn't realize they're running out of ids until the system refuses to create new records. In the best case, you spot what's happening in time. Then you find out just how painful it can be to change the primary key column of a four thousand million row table.

[UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier) stands for Universally Unique Identifier. Anyone can create a UUID and, if they follow the rules, be confident that for all practical purposes it will not duplicate one that has already been or will later be created. 

Using a UUID is the ultimate in future proofing. If your application scales to the point where you need to migrate to a database cluster, each individual server in the cluster can allocate their own keys knowing that they won't conflict with those from another server. If you add support for a mobile client with offline working, it will be safe for the client to generate keys for newly created records, knowing that they won't conflict with keys created by the database or other clients.

The down side for UUIDs is performance. They're twice the size of a bigint and more expensive to index as they're essentially random values. However, the difference is less than you might think. Around [25% in both size and performance](https://www.cybertec-postgresql.com/en/uuid-serial-or-identity-columns-for-postgresql-auto-generated-primary-keys/) for the worst case of a single column table that just contains ids. Reducing rapidly as you add more columns. 

Most systems I've worked with have used UUIDs and never regretted it.

## Sample Data Set

Let's make this more concrete by populating our tables with some sample data. To keep the samples readable I'm only showing the first 4 digits of each uuid, feel free to generate the other 28 digits yourself.

| id | name |
| --   | ---- |
| 0807 | ACME Engineering |
| 3cc8 | Big Media |

We have two customers for our issue tracking system, each with their own tenant. 

| id | name | tenant |
| --   | ---- | -|
| 35e9 | Forth Rail Bridge | 0807 |
| 7b7e | The Daily News | 3cc8 |

Each of our tenants has a single project. The engineering company has a contract to maintain the Forth Rail bridge, while the media company is working on the launch of a new newspaper.

| id | name | project | num | state |
|-|-|-|-|-|
| 020e | Needs Painting | 35e9 | 1 | open |
| 3544 | Launch new newspaper! | 7b7e | 1 | closed |
| 67d1 | Check for rust | 35e9 | 2 | closed |
| 83a4 | Hire reporter for showbiz desk | 7b7e | 2 | open |
| af34 | Girder needs replacing | 35e9 | 3 | open |

Looks like both projects have only just got started. Notice how the table contains issues from both projects and both customers mixed together. 

## Access Patterns

What access patterns do me need to support? Obviously we need to support [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) on individual tenants, projects and issues. Easy enough to create, read, update and delete individual entities addressed by their primary key. The database automatically creates a primary key index for efficient lookup.

The interesting bit is querying collections of entities. I'm going to focus on issues within a project. The same concerns and solutions will apply to other collections like projects in a tenant. 

The core query needs to retrieve issues in a specific project, ignoring those from other projects and tenants.

```
SELECT * FROM issue WHERE project = '7b7e';
```

which results in

| id | name | project | num | state |
|-|-|-|-|-|
| 3544 | Launch new newspaper! | 7b7e | 1 | closed |
| 83a4 | Hire reporter for showbiz desk | 7b7e | 2 | open |

We need the ability to sort the issues in the grid on one or more columns. For example to group by state and then sort by num in descending order.

```
SELECT * FROM issue WHERE project = '35e9' ORDER BY state ASC, num DESC;
```

which results in

| id | name | project | num | state |
|-|-|-|-|-|
| af34 | Girder needs replacing | 35e9 | 3 | open |
| 020e | Needs Painting | 35e9 | 1 | open |
| 67d1 | Check for rust | 35e9 | 2 | closed |

## API

You will define an API. Doesn't matter what style you use, whether that's [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) or [gRPC](https://grpc.io/) or [GraphQL](https://graphql.org/). Your API will be a simple wrapper around the database queries.

## Pagination

So far, so trivial. Remember the limits we defined last time. The PM would like us to support at least one hundred thousand issues per project. That's too many to load in one go. We need to [paginate](https://itnext.io/the-best-database-pagination-technique-is-530abf2aab51) the results from the database so we can retrieve them a manageable sized page at a time. 

You need to choose an appropriate page size that balances load on the database, amount of data to transfer across the network and number of calls the client needs to make to get all the data. Somewhere between 50 and 500 items is typical. On the client side, old school apps will include explicit pages in their UI with Prev and Next buttons (just like ths [posts]({{ blog_page.url | absolute_url }}) section of this blog). More modern apps will have some kind of [virtualized UI](https://www.kirupa.com/hodgepodge/ui_virtualization.htm), where more issues are loaded as you scroll down the grid view. 

There are two standard ways of [implementing pagination](https://www.citusdata.com/blog/2016/03/30/five-ways-to-paginate/). The simplest, most widely used, and unfortunately least scalable is Limit-Offset. You can add a LIMIT clause to any query to limit the maximum number of records that will be returned. You can add an OFFSET clause to any query to skip a number of records before you start returning results. You can then paginate any query by repeatedly calling it with increasing offsets.

```
SELECT * FROM issue WHERE project = '35e9' ORDER BY state ASC, num DESC OFFSET 0 LIMIT 100;
SELECT * FROM issue WHERE project = '35e9' ORDER BY state ASC, num DESC OFFSET 100 LIMIT 100;
SELECT * FROM issue WHERE project = '35e9' ORDER BY state ASC, num DESC OFFSET 200 LIMIT 100;
...
```

The problem is that the database literally implements OFFSET by skipping records. To query the last page of 100,000 records, the database will retrieve 100,000 records, discard the first 99,900 and then return the last 100. Retrieving all the data is at best an O(n<sup>2</sup>) operation, and frequently worse.

The more scalable, but more complex and less flexible approach is Keyset Pagination. Instead of using offsets to define where each page starts, you use the value of the first record in the page. How do you know what the first record in each page will be? You look at the last record in the previous page and setup a query for whatever comes next. It's more complex because you have to adjust the query depending on what was on the previous page, it's less flexible because you have to iterate through the pages one by one. You can't jump directly to a desired page.

```
SELECT * FROM issue WHERE project = '35e9' ORDER BY num LIMIT 100;
SELECT * FROM issue WHERE project = '35e9' AND num > 100 ORDER BY num LIMIT 100;
SELECT * FROM issue WHERE project = '35e9' AND num > 205 ORDER BY num LIMIT 100;
...
```

In this example we're sorting and paginating by num. Issue num is unique within a project so the query for the next page is greater than the last value on the previous page. There may be gaps where issues have been deleted, so even in this case you have to iterate through the pages one by one. 

If you're sorting on a column that isn't unique, like state, keyset pagination is more complex. How do you handle the case where the range of duplicate values crosses a page boundary? The simplest solution is to also sort on another column that is unique. 

```
SELECT * FROM issue WHERE project = '35e9' ORDER BY state, num LIMIT 100;
SELECT * FROM issue WHERE project = '35e9' AND (state > 'open' OR (state = 'open' AND num > 235)) ORDER BY state, num LIMIT 100;
SELECT * FROM issue WHERE project = '35e9' AND (state = 'closed" AND num > 57) ORDER BY state, num LIMIT 100;
...
```

Here the last records in each page are `(open,235)`, `(closed,57)`, `(closed,211)`.

The most complex thing about Keyset Pagination is that it can be just as inefficient as Limit-Offset, unless you have the right index in place. How do you make sure the right index is in place? I'm glad you asked.

## Indexing

* How efficient are those queries?
* Always use EXPLAIN to understand how performance will scale
* Be wary of toy examples where scan is fast - disable so you can see whether planner can find scalable alternative
* Project/Num constraint helps us out because it creates an index for us. Get all issues in project sorted by num.
* Everything else uses same index to get all in project then uses scan / sort, pick out page. O(n<sup2</sup>logn)
* Beware of throwing index on column at random. Either won't be used or used to iterate across issues from all projects and tenants then filtering to correct project. Need composite index on  (project,attribute).
* For frequently duplicated values, like state, useful to extend composite to another unique attribute. e.g. (project,state,num) so can retrieve grouped by state and then sorted by num within each. Also needed for easy Keyset pagination.
* You won't be able to support every combination of grouping and sorting let alone multi-column sort. Decide carefully.
* May need to fall back on hybrid strategy of loading using some choice of fixed orders and then doing client side stuff once everything has loaded, or for really big datasets once you've loaded a subset of interest.

Next time - custom attributes?