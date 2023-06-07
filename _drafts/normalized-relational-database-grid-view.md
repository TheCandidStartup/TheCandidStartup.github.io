---
title: Normalized Relational Database Grid View
tags: databases cloud-architecture
---

Let me take you back to a time before [NoSQL](https://en.wikipedia.org/wiki/NoSQL), when [E.F. Codd's](https://en.wikipedia.org/wiki/Edgar_F._Codd) [relational rules](https://en.wikipedia.org/wiki/Codd%27s_12_rules) and [normal forms](https://en.wikipedia.org/wiki/Database_normalization) were the last word in database design. Data was modelled logically, without redundant duplication, with integrity enforced by the database. 

To the sceptic, a normalized database is a design that divides the data into as many different tables as possible, regardless of what that means for efficiency and performance. To the believer, a normalized database is an elegant representation of the problem domain that ensures referential integrity and avoids the need for large scale rework as the design evolves over time.

{% include candid-image.html src="/assets/images/databases/tenant-project-issue.png" alt="Tenant-Project-Issue data model" %}

Here's a basic data model for the GitHub Project Issues example of a Grid View that we looked at [last time]({% link _drafts/database-grid-view.md %}). The image is from the [Postgres](https://www.postgresql.org/) database [ERD design tool](https://www.pgadmin.org/docs/pgadmin4/development/erd_tool.html). I'll be using Postgres for my examples but the same basic principles apply to any relational database.

## Basic Schema

There are three tables: tenant, project and issue. There is a 1:many relationship between tenants and projects, and another between projects and issues. Each entity has a name and an id. That's it for tenants and projects. You might be tempted to try and simplify the design. Do you really need three separate tables?

The key to a normalized design is that the columns in each table are independent of each other. There are no constraints that mean a specific value in one column requires a corresponding value in another column. If there are, that's a sign that there's a subset of columns that should be broken out as a separate table. That means, for example, that you couldn't eliminate the tenant table by adding a tenant name column to the project table. Tenant name is dependent on tenant id. We would be redundantly storing that information on every project in the tenant. 

As your design evolves over time you will also find that you need to add additional columns to tenant and project. Best to start with a clean design up front that makes it easy to do so.

Issue is a little more interesting. As well as name and id we have an issue number and state. GitHub issues each have a number that is unique within a project and a state that is either open or closed. I've modeled state as a Postgres [enum type](https://www.postgresql.org/docs/15/datatype-enum.html) so that it's easy to add more types in future. I've also added a [UNIQUE](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS) constraint to ensure that each row in the table has a unique combination of project id and num. 

## Keys

* uuid vs integer vs bigint
* natural keys vs surrogate key

## Example Data Set

## Access Patterns

* Query all issues on a project
* CRUD on individual issues
* Sorting and Grouping

## Pagination

* Need to support large number of issues - incremental loading or pagination
* Explicit in UI or to enable incremental load into virtualized UI
* Offset and Limit
* Keyset Pagination

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