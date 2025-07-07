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

S3 has key-value semantics. Keys can be any [UTF-8 string up to 1024 bytes long](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html). There are `GetObject` and `PutObject` APIs to [read](https://docs.aws.amazon.com/AmazonS3/latest/userguide/download-objects.html) and [write](https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html) blobs with a given key. The S3 [JavaScript SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) describes a bewildering set of options for representing blob content, many of which are platform dependent. The one common denominator seems to be `Uint8Array`.

The `ListObjects` [API](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ListingKeysUsingAPIs.html) lists objects with a specified key prefix. The results are paginated and returned in ascending UTF-8 order. The API also supports an optional `delimiter` argument. When used, only objects *without* the delimiter character in the rest of the key are returned, together with a list of unique key values up to the next delimiter.

That's a convoluted way of saying that the query API lets you pretend that objects are organized hierarchically. If you use `/` as a delimiter, it looks like a cloud file system. However, there are no actual directories stored. You're just using a convention that interprets the object key as a path, combined with a query API that lets you query the "file system" efficiently. 

There are `DeleteObject` and `DeleteObjects` APIs to [delete objects](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DeletingObjects.html) with specified keys, up to 1000 at a time. There's no API to delete an entire set of objects with a common prefix. You have to iterate using `ListObjects` and delete them a page at a time. 

Administrators can use [life cycle rules](https://docs.aws.amazon.com/AmazonS3/latest/userguide/how-to-set-lifecycle-configuration-intro.html) to automatically delete objects based on age, tag and prefix. There is one lifecycle configuration per bucket, which makes it impractical for app servers to perform ad hoc deletes by modifying lifecycle rules.

# NodeJS File

NodeJS provides access to a [Posix style file system](https://nodejs.org/api/fs.html#file-system) based on `Dir` and `FileHandle` objects. You open a [file](https://nodejs.org/api/fs.html#fspromisesopenpath-flags-mode) or [directory](https://nodejs.org/api/fs.html#fspromisesopendirpath-options) for a given path. 

Once you have a `FileHandle`, you can read and write to it. Blob content can be represented using the NodeJS specific `Buffer` class or the standard JavaScript `Uint8Array`. 

Once you have a `Dir`, you can [iterate over it](https://nodejs.org/api/fs.html#dirread), retrieving one directory entry at a time. Entries are returned in no particular order, as provided by the underlying operating system. The iteration state is part of the `Dir`. I couldn't find anyway of resetting it, so it looks like you have to open a new `Dir` each time. 

There are [rm](https://nodejs.org/api/fs.html#fspromisesrmpath-options) and [rmdir](https://nodejs.org/api/fs.html#fspromisesrmdirpath-options) APIs to remove blobs and directories, with options for a full recursive delete. 


# Browser Origin Private File System

[Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API#origin_private_file_system) gives browser based apps access to their own private file system. It's a conventional looking file system abstraction based on `FileSystemFileHandle` and `FileSystemDirectoryHandle` objects. 

The API is relatively new. It's been generally available in Chrome/Edge since 2020, and Firefox/Safari since 2023. However, writable files will only be available in Safari when OS 26 is released later in 2025. 

The only metadata visible to the app is `name` (within parent directory) and `kind` of handle. Each handle has an associated full path *locator* behind the scenes. Handles can be serialized, for example to store them in a database, or transfer to a web worker via `postMessage`. 

You get access to the root directory of the app's private filesystem using `navigator.storage.getDirectory`. The [entries](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle/entries) method returns a new asynchronous iterator over the contents of the directory as (name,`FileSystemHandle`) pairs. The order of entries is undefined. You can also directly open files and directories using `FileSystemDirectoryHandle.getFileHandle` and `FileSystemDirectoryHandle.getDirectoryHandle`, optionally creating them if they don't exist.

Use [FileSystemFileHandle.getFile](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/getFile) to read content as a `File` object. `File` is a subclass of `Blob` which in turn gives you access to the underlying `UInt8Array`.

Use [FileSystemFileHandle.createWritable]() to get a `FileSystemWritableFileStream` that you can write data to as a `Blob` or `UInt8Array`.

Files and directories can be removed with [FileSystemDirectoryHandle.removeEntry](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle/removeEntry), including options for recursive removal of directories. 

# Common Abstraction

What would a common abstraction over these backends look like? The main question is whether to use a key-value or file system style interface.

The key-value style is potentially simpler. You don't need to expose any other objects apart from `BlobStore`. You would have to hard code `/` as a delimiter so that you can map the interface to file system backends. NodeJS and OPFS implementations would also need to do a lot of work to manage intermediate directories behind the scenes. You might need some caching to do it efficiently.

The file system style needs an additional `BlobDir` interface. It's straightforward to implement for NodeJS and OPFS. It should be equally simple for S3. The `BlobDir` object is just a wrapper around an S3 key prefix.

Otherwise, it's just a matter of identifying lowest common denominators. Ordering of blobs returned by queries is undefined. Blob content is represented as `Uint8Array`. Paths are at most 1024 UTF-8 bytes long, names are at most 255 UTF-8 bytes long. Names cannot contain control codes, any of the characters in `<>:"/\|?*`, non-Unicode characters, or Unicode surrogates. Names cannot be `.` or `..`.

# Use Cases

Before deciding, we should also review some high level use cases for the blob store.
* Storing spreadsheet snapshots
* Large snapshots will be broken up into many blobs of different types
* There will be multiple snapshots over time, with some blobs from earlier snapshots reused in later ones
* Snapshots will eventually age out and need to be deleted (apart from any blobs still in use by later snapshots)
* It makes sense to have a directory/prefix per spreadsheet, perhaps with some org structure above that
* Will probably use a separate sub-directory for each snapshot
* Snapshot metadata needs to include information about blobs referenced from earlier snapshots
* When the event log is truncated, we need to work out which snapshots are safe to delete. May involve iteration over all snapshots
* Use recursive directory delete to delete a snapshot
* Will use a naming convention for different types of blobs. If we need to iterate over specific types, will have to store them in type specific sub-directories or rely on common prefix queries.

# BlobStore Interface

After weighing it all up, I decided to go with a file system style interface. From a practical point of view, it's simple to implement across all the different backends. In addition, the lowest common denominator says that we can't rely on ordering of blobs returned by queries. The way to mitigate that is by adding more structure so that we can query for exactly what we need. That works well with the formal directory hierarchy provided by a file system.

To match S3 semantics there are no APIs to explicitly create or delete directories. You can think of them as being created on demand when you first write a blob in one, and deleted automatically when the last blob is removed. 

I was torn when it came to the directory query API. The iterator model used by NodeJS and OPFS is very appealing. However, in the end, I decided against it. There's no good place to insert error handling. If something goes wrong, async iterators return a rejected promise. There's no way to retry apart from backing out and starting again from scratch. Which makes sense, you don't expect file systems to fail part way through an iteration.

That's not the case for S3. It uses an explicit paginated query API. Any API request can fail, but can be retried. I went with a query API that's more aligned with S3. Which also ends up looking similar to the query API in my `EventLog` interface.

The resulting interface uses three objects. The `BlobStore` itself, a `BlobDir` for each directory and `BlobDirEntries` for a page of results from `BlobDir.query`. The interface is generic on a continuation token. This is returned with the first page of query results and can be passed into the next call to `query` to get the next page. The actual type of continuation token is specific to each implementation. 

```ts
export interface BlobDirEntries<ContinuationT> {
  blobs: BlobName[];
  dirs: BlobName[];
  continuation?: ContinuationT | undefined;
}

export interface BlobDir<ContinuationT> {
  readBlob(name: BlobName): ResultAsync<Uint8Array,ReadBlobError>;
  writeBlob(name: BlobName, content: Uint8Array): ResultAsync<void,WriteBlobError>;
  removeBlob(name: BlobName): ResultAsync<void,RemoveBlobError>;
  getDir(name: BlobName): ResultAsync<BlobDir<ContinuationT>,GetDirError>;
  query(continuation?: ContinuationT): 
    ResultAsync<BlobDirEntries<ContinuationT>,DirQueryError>;
  removeAll(): ResultAsync<void,RemoveAllBlobDirError>;
}

export interface BlobStore<ContinuationT> {
  getRootDir(): ResultAsync<BlobDir<ContinuationT>,GetRootDirError>;
}
```

Currently, `BlobStore` has a single method which returns the root directory as a `BlobDir`. You can use a `BlobDir` to read, write and remove blobs in the directory. Use `removeAll` to remove everything in the directory recursively.

The `getDir` method gives you a `BlobDir` for a sub-directory. This succeeds whether there's an existing directory or not. If not, the directory is created on the first call to `writeBlob`. The `query` method returns a page of results as `BlobDirEntries`. You get separate arrays of blob names and dir names. Only directories that contain blobs are included. A continuation token is included if there are more results.

# Reference Implementation

As ever, the first stage in validating the interface is to create a reference implementation. I'm using a simple `Map` to store the blobs and sub-directories in a `BlobDir`. There's a [branded opaque type]({% link _posts/2025-03-10-react-spreadsheet-editable-data.md %}) for the continuation token in the public interface. The internal implementation is a wrapper around an iterator. I'll need to do the same for NodeJS and OPFS implementations, so it's a good opportunity to try it now. 

```ts
interface SimpleBlobStoreIter {
  dir: SimpleBlobDir;
  iter: MapIterator<[BlobName,BlobDir<SimpleBlobStoreContinuation>|Uint8Array]> | undefined;
}

export enum _SimpleBlobStoreBrand { _DO_NOT_USE="" };
export interface SimpleBlobStoreContinuation {
  _brand: _SimpleBlobStoreBrand;
}

export class SimpleBlobDir implements BlobDir<SimpleBlobStoreContinuation> {
  private map: Map<BlobName,BlobDir<SimpleBlobStoreContinuation>|Uint8Array>
}

export class SimpleBlobStore implements BlobStore<SimpleBlobStoreContinuation> {
  constructor () {
    this.root = undefined;
  }

  getRootDir(): ResultAsync<SimpleBlobDir,GetRootDirError> {
    if (!this.root)
      this.root = new SimpleBlobDir;
    return okAsync(this.root);
  }
  private root: SimpleBlobDir | undefined;
}
```

The `SimpleBlobStore` implementation is straightforward. We create a root `SimpleBlobDir` on demand and hand it out whenever asked. The `SimpleBlobDir` implementation is more interesting. Let's go through it a method at a time.

## getDir

```ts
  getDir(name: BlobName): ResultAsync<BlobDir<SimpleBlobStoreContinuation>,GetDirError> {
    if (!name)
      return errAsync(invalidBlobNameError());

    const value = this.map.get(name);
    if (!value) {
      const dir = new SimpleBlobDir();
      this.map.set(name,dir);
      return okAsync(dir);
    }

    if (value instanceof SimpleBlobDir)
      return okAsync(value);

    return errAsync(notBlobDirError());
  }
```

The `getDir` method looks up the name in the map and if not found creates a `SimpleBlobDir` to represent the sub-directory. The underlying directory is not meant to exist until the first blob is written. Regardless, we add it to the map immediately. It turned out to be simpler to ignore empty directories rather than ensuring they don't exist.

Errors are returned if the name is invalid or is already being used for a blob. I haven't implemented full name validation yet. 

## writeBlob

```ts
  writeBlob(name: BlobName, content: Uint8Array): ResultAsync<void,WriteBlobError> {
    if (!name)
      return errAsync(invalidBlobNameError());
    const value = this.map.get(name);
    if (value instanceof SimpleBlobDir && value.map.size > 0)
      return errAsync(notBlobError());

    this.map.set(name,new Uint8Array(content));
    return okAsync();
  }
```

When writing a blob we first check to see whether there's an existing directory of the same name, ignoring empty directories. If that passes we store a *copy* of the blob content in the map. Note that this will overwrite and discard any empty directory.

`removeBlob` follows the same pattern. 

## readBlob

```ts
  readBlob(name: BlobName): ResultAsync<Uint8Array,ReadBlobError> {
    if (!name)
      return errAsync(invalidBlobNameError());
    const value = this.map.get(name);
    if (!value || (value instanceof SimpleBlobDir && value.map.size == 0))
      return errAsync(storageError("Blob does not exist", 404));

    if (value instanceof Uint8Array) {
      return okAsync(value);
    } else {
      return errAsync(notBlobError())
    }
  }
```

For `readBlob` we need to make sure we return the correct error when we encounter an empty directory. It's reported as a `404` does not exist, rather than "not a blob".

## query

```ts
  query(continuation?: SimpleBlobStoreContinuation): 
        ResultAsync<BlobDirEntries<SimpleBlobStoreContinuation>,DirQueryError> {
    let iter;
    if (continuation) {
      const sbsIter = asIter(continuation);
      if (sbsIter.dir !== this)
        return errAsync(noContinuationError("Invalid continuation"));
      iter = sbsIter.iter;
      if (!iter)
        return errAsync(noContinuationError("Can't reuse continuation"));

      // Iterator is mutated so can't reuse continuation to retry query
      sbsIter.iter = undefined;
    } else {
      iter = this.map.entries();
    }
    const entries: BlobDirEntries<SimpleBlobStoreContinuation> = { blobs: [], dirs: [] }

    for (let i = 0; i < QUERY_PAGE_SIZE; i ++) {
      const result = iter.next();
      if (result.done)
        return okAsync(entries);

      const [name, value] = result.value;
      if (value instanceof SimpleBlobDir) {
        if (value.map.size > 0)
          entries.dirs.push(name);
      } else {
        entries.blobs.push(name);
      }
    }

    entries.continuation = asContinuation({ dir: this, iter });
    return okAsync(entries);
  }
```

The basic idea is to iterate over the map building up a page of results. If we get a complete page, we add the iterator to the results as a continuation token. As usual, we ignore empty directories.

There's some interesting error handling. Iterators are mutated when they're used, so you can't repeat a query with the same continuation token. We set the iterator in the token to `undefined` when it's used and return a new token for the next page. The token also has a `dir` property so we can spot the case where someone has called us with a continuation from a different `BlobDir`. 

You may think it's weird that a reference implementation doesn't allow retries. However, the NodeJS and OPFS implementations have the same limitations so it's worth modeling this case. I expect errors during iteration to be rare for these implementations. It should be perfectly reasonable for clients to handle a `NoContinuationError` by restarting the query from the beginning. In contrast, such errors are common for the S3 implementation which will allow retries. 

# Unit Tests

Naturally, I created an [interface test]({% link _posts/2025-06-30-unit-test-code-reuse.md %}) for `BlobStore` and used it for `SimpleBlobStore`. My first attempt was horribly verbose.

```ts
test('should start out empty', async () => {
  const data = creator();
  const result = await data.getRootDir();
  expect(result.isOk()).toEqual(true);
  const root = result._unsafeUnwrap();

  const result2 = await root.query();
  expect(result2.isOk()).toEqual(true);
  const entries = result2._unsafeUnwrap();
  expect(entries.continuation).toBeUndefined();
  expect(entries.blobs.length).toEqual(0);
  expect(entries.dirs.length).toEqual(0);

  const result3 = await root.readBlob("not there");
  expect(result3.isErr()).toEqual(true);
  const err = result3._unsafeUnwrapErr() as StorageError;
  expect(err.type).toEqual("StorageError");
  expect(err.statusCode).toEqual(404);
  
  const result4 = await root.removeBlob("not there");
  expect(result4.isOk()).toEqual(true);

  const result5 = await root.removeAll();
  expect(result5.isOk()).toEqual(true);
})
```

That's up to six lines of code to take one action and check that it gives the expected results. I added some [custom matchers and utilities]({% link _posts/2025-06-30-unit-test-code-reuse.md %}) and ended up with something much simpler, more readable and more maintainable.

```ts
test('should start out empty', async () => {
  const data = creator();
  const root = expectUnwrap(await data.getRootDir()); 

  expect(await root.query()).toBeBlobDirEntries([], []);
  expect(await root.readBlob("not there")).toBeStorageError(404);
  expect(await root.removeBlob("not there")).toBeOk();
  expect(await root.removeAll()).toBeOk();
})
```

After that, things went much quicker and I was easily able to get to 100% coverage of `SimpleBlobStore`.

# Next Time

I have some confidence in the interface from building out and testing a reference implementation. However, before I can try it with my `EventSourcedSpreadsheetData` tracer bullet, I need to figure out how to run snapshot creation using a background worker.
