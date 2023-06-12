---
title: Custom Fields with a Normalized Relational Database
tags: databases
---

[Last time]({% link _drafts/normalized-relational-database-grid-view.md %}) we discovered that it's relatively easy to build a Grid View application using a Normalized Relational Database. True, it was a toy example with a small number of fixed fields. However, given some reasonable functional limitations, we showed how it could scale to manage large collections with 100,000 items or more. 

{% capture db_url %}{% link _posts/2023-06-12-database-grid-view.md %}{% endcapture %}
Now we're going to up the ante, and add support for custom fields. The [requirements]({{ db_url | append: "#the-hard-way" }}) say we need to support multiple types of field (text, number, date, enum, ... ) and potentially 100s of fields. Each project can have a different set of custom fields. 

{% include candid-image.html src="/assets/images/databases/tenant-project-issue-attribute.png" alt="Tenant-Project-Issue-Attribute data model" %}

Here's the schema from last time with two new tables added. Notice that we didn't need to touch the original tables. To keep things simple, I'm starting by adding support for custom date fields. I'll explain how to extend to other types as we go.

## Schema

There are two new tables: attribute_definition and date_attribute. There is a many:1 relationship between attribute definitions and projects, while the data_attribute table has many:1 relationships with both attribute definitions and issues.

The attribute_definition table is used to define the custom fields in use on a project. Definitions are per project enforced with a foreign key constraint. Each definition has a name, type and num. The type field is modeled as a Postgres enum and for now the only supported value is "date". The num field is used to define an ordering so that the GUI can add columns to the grid view in the right order for each custom field. Just like for issues, I added a UNIQUE constraint on (project,num).

Each project can have different numbers and types of custom field. As usual with normalized design, any form of variability is handled by creating additional tables. The values of all custom date fields are stored in the date_attribute table. As well as storing the value, each row has foreign key constraints which specify which attribute definition this is a value of and which issue has this value for this definition.

The most interesting thing is that date_attribute does not have an explicit id column. I'm using a natural composite key of (issue,attribute_definition) for this table. Each issue can only have one value for any attribute definition. This is a case where there's really no need for a surrogate key. 

## Sample Data Set

Here's the sample data set [from last time]({{ db_url | append: "#sample-data-set" }}) updated with examples for the two new tables.

### tenant

| id | name |
| --   | ---- |
| 0807 | ACME Engineering |
| 3cc8 | Big Media |

### project

| id | name | tenant |
| --   | ---- | -|
| 35e9 | Forth Rail Bridge | 0807 |
| 7b7e | The Daily News | 3cc8 |

### issue

| id | name | project | num | state |
|-|-|-|-|-|
| 020e | Needs Painting | 35e9 | 1 | open |
| 3544 | Launch new newspaper! | 7b7e | 1 | closed |
| 67d1 | Check for rust | 35e9 | 2 | closed |
| 83a4 | Hire reporter for showbiz desk | 7b7e | 2 | open |
| af34 | Girder needs replacing | 35e9 | 3 | open |

### attribute_definition

| id | name | project | num | type |
|-|-|-|-|-|
| 3812 | start | 35e9 | 1 | date |
| 882a | end | 35e9 | 2 | date |

No surprise that it's the engineering firm that are first off the mark making use of the new custom fields feature. They've defined a couple of date fields to capture the start and end date for each issue.

### date_attribute

| issue | attribute_definition | value |
| - | - | - |
| 020e | 3812 | 2023-05-01 |
| 020e | 882a | 2023-06-01 |
| 67d1 | 3812 | 2023-05-02 |
| 67d1 | 882a | 2023-06-02 |

They've added start and end dates to two of their existing issues but haven't bothered adding them to the remaining issue. This schema makes it very low cost to add a new custom field. Values for existing issues can then be added incrementally as needed.

## Access Patterns

As before, I'm going to focus on querying issues within a project. The core query needs to retrieve issues in a specific project including custom field values for each issue. The simplest way of doing this is to use a [LEFT JOIN](https://www.postgresql.org/docs/current/tutorial-join.html) between the issue and date_attribute tables. Using a LEFT join ensures that we also return issues that don't have any attributes defined.

```
SELECT * FROM issue LEFT JOIN date_attribute ON (data_attribute.issue = issue.id)
  WHERE issue.project = '3fe9';
```

which results in

| id | name | project | num | state | issue | attribute_definition | value |
|-|-|-|-|-|-|-|-|
| 020e | Needs Painting | 35e9 | 1 | open | 020e | 3812 | 2023-05-01 |
| 020e | Needs Painting | 35e9 | 1 | open | 020e | 882a | 2023-06-01 |
| 67d1 | Check for rust | 35e9 | 2 | closed | 67d1 | 3812 | 2023-05-02 |
| 67d1 | Check for rust | 35e9 | 2 | closed | 67d1 | 882a | 2023-06-02 |
| af34 | Girder needs replacing | 35e9 | 3 | open |

This includes all the data we need but is horribly verbose. There is a separate row for each custom field defined for an issue, with the fixed fields duplicated. Ideally our API will return results that look more like

| id | name | project | num | state | start | end |
|-|-|-|-|-|-|-|
| 020e | Needs Painting | 35e9 | 1 | open | 2023-05-01 | 2023-06-01 |
| 67d1 | Check for rust | 35e9 | 2 | closed | 2023-05-02 | 2023-06-02 |
| af34 | Girder needs replacing | 35e9 | 3 | open |

We could post-process the results from the database to get them in the right form but that will make it hard to paginate. Much better if we can get the database to return the records in the form we want. 

The most direct way of doing this is to specify the columns we want in the output and to join each attribute explicitly. 

```
SELECT id,name,project,num,state,custom1.value AS custom1,custom2.value AS custom2 FROM issue
  LEFT JOIN date_attribute AS custom1 ON (custom1.issue = issue.id AND custom1.attribute_definition = '3812')
  LEFT JOIN date_attribute AS custom2 ON (custom2.issue = issue.id AND custom2.attribute_definition = '882a')
  WHERE issue.project = '35e9';
```

This does make the query project specific. You need to use the attribute definitions for the project to build the required query. Running the query results in

| id | name | project | num | state | custom1 | custom2 |
|-|-|-|-|-|-|-|
| 020e | Needs Painting | 35e9 | 1 | open | 2023-05-01 | 2023-06-01 |
| 67d1 | Check for rust | 35e9 | 2 | closed | 2023-05-02 | 2023-06-02 |
| af34 | Girder needs replacing | 35e9 | 3 | open |

You can order and paginate this result set in the same ways we looked at last time for the original fixed fields schema. You can easily extend this query to more attributes, and to different types of attribute stored in other tables, by adding additional LEFT JOIN clauses. 

## Explain yourself

Hopefully, at this point, you're wondering whether this query is efficient. Let's have a look.

```
EXPLAIN SELECT id,name,project,num,state,custom1.value AS custom1,custom2.value AS custom2 FROM issue
  LEFT JOIN date_attribute AS custom1 ON (custom1.issue = issue.id AND custom1.attribute_definition = '3812')
  LEFT JOIN date_attribute AS custom2 ON (custom2.issue = issue.id AND custom2.attribute_definition = '882a')
  WHERE issue.project = '35e9' ORDER BY num DESC;
```

I've added an ORDER by clause to the end of the query to see whether the query plan is suitable for pagination. 

```
Nested Loop Left Join  (cost=0.44..29.08 rows=1 width=548)
  ->  Nested Loop Left Join  (cost=0.29..18.61 rows=1 width=544)         
    ->  Index Scan Backward using issue_project_num_key on issue  (cost=0.13..8.15 rows=1 width=540)
        Index Cond: (project = '35e9'::uuid)
    ->  Index Scan using date_attribute_pkey on date_attribute custom1  (cost=0.15..8.17 rows=1 width=20)
        Index Cond: ((issue = issue.id) AND (attribute_definition = '3812'::uuid))
  ->  Index Scan using date_attribute_pkey on date_attribute custom2  (cost=0.15..8.17 rows=1 width=20)
      Index Cond: ((issue = issue.id) AND (attribute_definition = '882a'::uuid))
```

The query plan uses a nested join of issue with date_attribute for the first custom attribute, with the result of that joined to date_attribute for the second custom attribute. As we're starting with the issue table, the planner can use the (project,num) index to find the required project and then iterate through issues in num order. For each join, the planner looks for attributes with the specified attribute definition and the current issue's issue id. There will be at most one such record which can be found using the primary key index on (issue,attribute_definition).

If we have *k* customer fields, the cost scales as O(knlogn), compared with O(nlogn) for the original fixed fields query. Cost has increased by a potentially large, but constant factor. There is some mitigation. Attributes are sorted by issue in the index for each attribute type, so should benefit greatly from the database's disk page cache. However, if all the attributes are clustered together in the index, why do we need to lookup each one separately? Is there a more efficient way to do this?

## Aggregate Functions

It turns out that combining results from multiple rows is a common problem in SQL. 