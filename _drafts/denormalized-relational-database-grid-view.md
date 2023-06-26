---
title: Denormalized Relational Database Grid View
tags: databases
---

We've been good. We've followed the rules. Our [database is fully normalized]({% link _posts/2023-06-19-normalized-relational-database-grid-view.md %}) and we have all the referential integrity checks we need in place. And yet. Our queries seem overly complex. There's a constant battle to try and keep queries scalable. Despite all that, query performance is not what we'd like.

Maybe we could try [denormalizing](https://en.wikipedia.org/wiki/Denormalization) the database? Denormalization attempts to improve read performance by adding redundant copies of data. It comes at the cost of reduced write performance and often with a loss of [referential integrity](https://en.wikipedia.org/wiki/Referential_integrity). 

{% capture cf_url %}{% link _posts/2023-06-26-custom-fields-normalized-relational-database-grid-view.md %}{% endcapture %}
[Last time]({{ cf_url }}) I left you with a [list of problems]({{ cf_url | append: "#conclusion" }}) inherent in our normalized database design for a [Grid View](/_posts/2023-06-12-database-grid-view.md) with support for custom fields.
1. We achieved *O(nlogn)* scaling at the cost of a really big constant factor due to the number of joins required.
2. All those joins make the queries complex. As do the per custom field clauses in each query. Even worse, you have to dynamically build the queries at run time because every project has different numbers and types of attributes. 
3. You need an extra join for each attribute type.
4. Sorting on a custom field requires complex pagination code that works across two different queries, one of which can have problems with long query times.
5. The secondary sort for duplicate custom field values is on issue id, which to an end user looks like a random order.

We're going to look at some different ways of denormalizing our [database schema]({{ cf_url | append: "#schema" }}), see what the pros and cons are, and whether they address any of our pain points.

{% include candid-image.html src="/assets/images/databases/tenant-project-issue-attribute.png" alt="Tenant-Project-Issue-Attribute data model" %}

## Indexes

## Materialized Views

## Combined Attribute Value table

## Combined Issue and Attribute Value table

## Dropping Referential Integrity Constraints
