---
title: InfiniSheet Blob Store
tags: infinisheet
---

wise words

* Abstracting over S3, NodeJS File interface and Browser Origin Private File System
* Plus an in-memory reference implementation

# S3

* Key-Value semantics
* Key can be any string up to 1024 bytes long
* GetObject/PutObject to read/write blob with given key
* ListObjects to list objects with specified key prefix (paginated)
  * Entries listed in ascending UTF8 binary order
  * Can specify delimiter character to get directory like semantics
  * Returns only objects without delimiter in rest of key, + list of key values up to next delimiter with duplicates eliminated
* DeleteObject/DeleteObjects to delete objects with specified key (up to 1000 at a time for DeleteObjects)
* Delete all objects with given prefix needs iteration with ListObjects/DeleteObjects calls per page of 1000 entries
* Can use lifecycle rules for bulk delete but lifecycle config is set as single object per bucket. Not practical to update from concurrent app servers

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
