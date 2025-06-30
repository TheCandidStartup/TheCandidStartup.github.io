---
title: InfiniSheet Blob Store
tags: infinisheet
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

We left our [scalable cloud spreadsheet project]({% link _topics/spreadsheets.md %}) in a good place. We used [tracer bullet development]({% link _posts/2025-06-02-event-sourced-spreadsheet-data.md %}) and after a [few iterations]({% link _posts/2025-06-09-asynchronous-spreadsheet-data.md %}) got an [end to end simulation]({% link _posts/2025-06-23-react-spreadsheet-optimistic-update.md %}) running against a reference implementation of an event log. 

{% include candid-image.html src="/assets/images/infinisheet/event-sourced-spreadsheet-data-tracer-bullet.svg" alt="Event Sourced Spreadsheet Data Tracer Bullet Development" %}

It's now time to expand scope and tackle the blob store. 

# Blob Store

The backend data storage for the spreadsheet uses a combination of an event log and a blob store. The event log is an append only list of changes to the spreadsheet. The blob store is used to store [regular snapshots]({% link _posts/2023-05-01-spreadsheet-snapshot-data-structures.md %}) of the spreadsheet. The idea is to provide an optimal balance between efficient coarse grained storage and fine grained updates.

The overall [system architecture]({% link _posts/2024-07-29-infinisheet-architecture.md %}) requires a common `BlobStore` interface with a variety of implementations. These include a reference implementation, AWS S3, the NodeJS file system and the browser's Origin Private File System. We need to understand how these different backends work to come up with the right level of abstraction for the `BlobStore` interface.

# S3

[S3](https://docs.aws.amazon.com/s3/) is Amazon's foundational blob storage service. It can store blobs of data up to [5 TB](https://docs.aws.amazon.com/general/latest/gr/s3.html#limits_s3), with [no limit on the number of blobs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/BucketRestrictions.html#object-bucket-limitations) you can store. 

S3 has key-value semantics. Keys can be any [UTF-8 string up to 1024 bytes long](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html). There are `GetObject` and `PutObject` APIs to [read](https://docs.aws.amazon.com/AmazonS3/latest/userguide/download-objects.html) and [write](https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html) blobs with a given key.

The `ListObjects` [API](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ListingKeysUsingAPIs.html) lists objects with a specified key prefix. The results are paginated and returned in ascending UTF-8 order. The API also supports an optional `delimiter` argument. When used, only objects *without* the delimiter character in the rest of the key are returned, together with a list of unique key values up to the next delimiter.

That's a convoluted way of saying that the query API lets you pretend that objects are organized hierarchically. If you use `/` as a delimiter, it looks like a cloud file system. However, there are no actual directories stored. You're just using a convention that interprets the object key as a path, combined with a query API that lets you query the "file system" efficiently. 

There are `DeleteObject` and `DeleteObjects` APIs to [delete objects](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DeletingObjects.html) with specified keys, up to 1000 at a time. There's no API to delete an entire set of objects with a common prefix. You have to iterate using `ListObjects` and delete them a page at a time. 

Administrators can use [life cycle rules](https://docs.aws.amazon.com/AmazonS3/latest/userguide/how-to-set-lifecycle-configuration-intro.html) to automatically delete objects based on age, tag and prefix. There is one lifecycle configuration per bucket, which makes it impractical for app servers to perform ad hoc deletes by modifying lifecycle rules.

# NodeJS File

* Posix style file system abstraction based on `Dir` and `FileHandle`
* Open file/dir given path
* Iterate over `Dir` or read all entries in one go with `readdir`
  * Either list of names, or (kind,name,metadata) pairs
* FileHandle readFile/writeFile methods
  * Use `Buffer` to represent file content which is NodeJS wrapper around `UInt8Array`. Or pass `UInt8Array` directly.
* rm/rmdir to delete file/directory, with options for full recursive delete

# Browser Origin Private File System

* File system abstraction based on FileHandle/DirectoryHandle
* Only name (within parent directory) and kind of handle visible to app
* There's an associated full path ("locator") behind the scenes
* Handles can be serialized (e.g. so you can store in database), which presumably would give you access to the internal locator representation
* Get root DirectoryHandle of app's private filesystem using `navigator.storage.getDirectory()`
* Iterate over contents of directory as (key,value) pairs where key is name of entry and value is FileHandle/DirectoryHandle
  * No guarantee on ordering
* Use `FileHandle.getFile()` to read content as `File` which is subclass of `Blob` which gives access to underlying `ArrayBuffer` / `UInt8Array`
* Use `FileHandle.createWritable()` to get `FileSystemWritableFileStream` that you can write data to (as `Blob` or `UInt8Array`)
  * Available in Chrome/Edge since 2020, Firefox since 2023 but Safari only in MacOS 26! (currently in preview)

# Abstraction

* Key-Value style or File System style?
* Key-Value style has simpler interface (no other objects apart from `BlobStore`)
  * Hard code '/' as a delimiter so can map to File System interface
  * Easy for NodeJS as can use key directly as a path (after validating that there's no `..` or initial `/`)
  * For OPFS will need to parse path and open/create intermediate directories. Maybe have a path -> `DirectoryHandle` cache.
  * Could have a `BlobStore.scope(path)` which gives you a new `BlobStore` instance with specified directory as the root. 
* File System has more complex interface (additional objects)
  * 1:1 mapping for NodeJS and OPFS
  * For S3, `FileHandle` and `DirectoryHandle` are just wrappers around an S3 key
    * Name clash with JavaScript file system APIs. Need alternative names. `BlobHandle` and `BlobDirHandle`. 
  * Path wrangling and delimiters taken care of for you, so in some ways simpler
  * Do you need `FileHandle`? Could just do `BlobDir.readBlob` and `BlobDir.writeBlob`

# Event Sourced Spreadsheet Data Use Cases

* Reading and Writing snapshots
* Snapshots eventually broken up into many blobs of different types
* Multiple snapshots over time, with some blobs reused in later snapshots
* Eventual ageing out and deletion of earlier snapshots (apart from blobs still in use)
* Directory per spreadsheet (maybe with some org structure above that)
* Subdir per snapshot, named with sequence id snapshot corresponds to
* Snapshot metadata to include sequence id of oldest blob reused from earlier snapshot
* When event log truncated, iterate over all snapshots. For those more recent, determine oldest snapshot we need to keep. Delete all snapshots older (recursive directory delete) 
* Naming convention for different types of blobs. If we need to iterate over specific types have to store in subdir / rely on common prefix.

# EventLog BlobId

* Expects to identify snapshot and history blob using a `BlobId` which is a `string`
* Gives flexibility to the next level up for how they want to use this
* If I do File System style, what would my `BlobId` be?
* If I'm only thinking about a single spreadsheet then for snapshots it would be name of blob in `snapshots` dir, for history it would be name of blob in `history` dir. Simple enough.
* What about multiple spreadsheets? How does `EventLog` know which `snapshots` dir to look in? 
* `EventLog` doesn't look anywhere. It doesn't care how `BlobId` is interpreted. Layer above decides how to tie `EventLog` and `BlobStore` together
* Simplest way of managing multiple spreadsheets is to use upper layers of blob store as a user visible file system: folders containing spreadsheets. No new abstraction needed. Easy to implement folder hierarchy. 
* Store per-spreadsheet metadata in a blob insider per-spreadsheet directory. Metadata can include `EventLog` id in whatever database is being used.
* Don't need to identify which spreadsheet in `BlobId` because we start from spreadsheet to get `EventLog`. Layer above will already know which `BlobDir` to use with `BlobId` in event log. 

# BlobStore Interface

* Blob name limitations
* Underlying implementations have limits on characters allowed and maximum length for names
* Different for different implementations/platforms
* Assume that implementations will encode names to escape illegal characters. Can't put burden on caller.
* No way around length limitations without significant extra cost so define a workable limit that should work everywhere
