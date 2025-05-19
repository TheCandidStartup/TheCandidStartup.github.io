---
title: Asynchronous Event Log
tags: infinisheet
thumbnail: /assets/images/infinisheet/log-entry.png
---

wise words

* Have synchronous event log interface and reference implementation with the right logic.
* Real implementations will rely on asynchronous storage APIs
* Need event log interface to be async
* Looked at different approaches last time. Settled on NeverThrow's `ResultAsync`

# Interface

```ts
export interface EventLog<T extends LogEntry> {
  addEntry(entry: T, sequenceId: SequenceId): ResultAsync<void,AddEntryError>;
  setMetadata(sequenceId: SequenceId, metaData: LogMetadata): ResultAsync<void,MetadataError>;
  query(start: SequenceId | 'snapshot' | 'start', end: SequenceId | 'end'): ResultAsync<QueryValue<T>,QueryError>;
  truncate(start: SequenceId): ResultAsync<void,TruncateError>
}
```

*  Trivial change. Just replaced `Result` with `ResultAsync`

# Implementation

* Equally trivial changes. Look at `addEntry`, other methods are the same.

```ts
addEntry(entry: T, sequenceId: SequenceId): ResultAsync<void,AddEntryError> {
  if (sequenceId !== this.#endSequenceId)
    return errAsync(conflictError("sequenceId is not next sequence id", this.#endSequenceId));

  this.#entries.push(entry);
  this.#endSequenceId ++;
  return okAsync();
}
```

* Update the function signature to match change in interface.
* Apart from that just had to replace `ok` and `err` with `okAsync` and `errAsync`
* This is a reference implementation so nothing asynchronous going on
* Have we done anything meaningful?
* We've genuinely made the API asynchronous due to the `Promise` guarantee that completion values are always *delivered* asynchronously even if the promise was created already resolved.

# Unit Tests

There's an easy way and a hard way. I could rewrite my `SimpleEventLog` unit tests to use `ResultAsync` methods to chain operations and unwrap results. Or I could make the test functions `async`, stick an `await` in front of every asynchronous API call and leave the rest of the code exactly the same.

```ts
  it('should support snapshot query', async () => {
    const data = new SimpleEventLog<TestLogEntry>;
    for (let i = 0; i < 10; i ++)
      await data.addEntry(testLogEntry(i), BigInt(i))

    await data.setMetadata(4n, { snapshot: "snap" });

    expect(await data.query('snapshot', 'end')).toBeQueryValue([4n, true, 6]);
  })
```

# Consuming the API

