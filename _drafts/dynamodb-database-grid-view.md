---
title: DynamoDB Database Grid View
tags: databases
---

## DynamoDB Data Model

* Compound sort key

## Adjacency List Design Pattern

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


| PK | SK | Data | Name | Num | State | Type
|-|-|-|
| tenant-0807 | * | | ACME Engineering |
| tenant-3cc8 | * | | Big Media |
| project-35e9 | tenant-0807 | Forth Rail Bridge |
| project-35e9 | xattrib-35e6 | | Num Items | 3 | | int |
| project-35e9 | xattrib-3812 | | Start | 1 | | date |
| project-35e9 | xattrib-47e5 | | Sign Off | 4 | | text |
| project-35e9 | xattrib-882a | | End | 2 | | date |
| project-7b7e | tenant-3cc8 | The Daily News |
| issue-020e | project-35e9 | 1 | Needs Painting | | open |
| issue-020e | value-3812 | 2023-05-01 | 
| issue-020e | value-882a | 2023-06-01 |
| issue-3544 | project-7b7e | 1 | Launch new newspaper! | | closed |
| issue-67d1 | project-35e9 | 2 | Check for rust | | closed |
| issue-67d1 | value-3812 | 2023-05-02 |
| issue-67d1 | value-882a | 2023-06-02 |
| issue-83a4 | project-7b7e | 2 | Hire reporter for showbiz desk | | open |
| issue-af34 | project-35e9 | 3 | Girder needs replacing | | open |
| issue-af34 | value-3fe6 | 42 |
| issue-af34 | value-47e5 | Approved |

<style type="text/css">
table:first-of-type tr:nth-child(2) {background-color:#f3f6fa;}
table:nth-of-type(2) tr:nth-child(1) {background-color:#f3f6fa;}
tr:nth-child(8) {background-color:#f3f6fa;}
tr:nth-child(12) {background-color:#f3f6fa;}
tr:nth-child(16) {background-color:#f3f6fa;}
</style>

| Another | table |
| Another | table |
| Another | table |