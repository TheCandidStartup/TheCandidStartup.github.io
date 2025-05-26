---
title: Asynchronous Event Log
tags: infinisheet
thumbnail: /assets/images/infinisheet/log-entry.png
---

I've [created]({% link _posts/2025-05-05-infinisheet-event-log.md %}) an event log interface and reference implementation. The interface exposes all the functionality I'll need with a minimal API. There's enough of an abstraction layer that it should allow for multiple real implementations.

There's one problem (so far). The interface is synchronous and all the real implementations I'm planning on building rely on asynchronous storage APIs. My event log interface needs to be asynchronous too.

We looked at the options for asynchronous APIs in TypeScript [last time]({% link _posts/2025-05-19-asynchronous-typescript.md %}). I'm [already using]({% link _posts/2025-04-22-infinisheet-error-handling.md %}) NeverThrow's Rust style `Result<T,E>` types for synchronous APIs. I decided to use their `ResultAsync<T,E>` class for my asynchronous APIs.

# Integration

I used the [same approach]({% link _posts/2025-04-22-infinisheet-error-handling.md %}) as `Result` to integrate `ResultAsync` into [InfiniSheet]({% link _topics/infinisheet.md %}). I added `ResultAsync.ts` to the `infinisheet-types` module, with wrappers around the NeverThrow entry points that I can document.

```ts
import { errAsync as neverthrow_errAsync, okAsync as neverthrow_okAsync, 
  ResultAsync as neverthrow_ResultAsync } from "neverthrow";

/**
 * `ResultAsync` allows you to work with asynchronous Results in a type safe way
 * 
 * `ResultAsync<T,E>` is a wrapper around `Promise<Result<T,E>>` which provides the same
 *  methods for chaining different `Result` and `ResultAsync` together as {@link Result}, 
 *  while also chaining the asynchronous operations together using `Promise.then`.
 * 
 * `ResultAsync` is *thenable* (implements `PromiseLike<T>`) so can be used in most places
 *  that a `Promise` can, including with `await`.
 * 
 * Compatible with [`neverthrow`](https://github.com/supermacro/neverthrow)
 * 
 * @typeParam T - The type of the value contained in the `ResultAsync` for the success case
 * @typeParam E - The type of the error contained in the `ResultAsync` for the failure case
 */
export class ResultAsync<T,E> extends neverthrow_ResultAsync<T,E> {}

/**
 * Create an instance of `ResultAsync` containing an {@link Ok} variant of {@link Result}
 *
 * Equivalent to `new ResultAsync(Promise.resolve(new Ok(value)))`
 *
 * @typeParam T - The type of the value contained in the `ResultAsync` for the success case
 * @typeParam E - The type of the error contained in the `ResultAsync` for the failure case
 * @param value - The value to wrap in a `Result.Ok`.
 */
export function okAsync<T, E = never>(value: T): ResultAsync<T, E> {
  return neverthrow_okAsync(value);
}

/**
 * Create an instance of `ResultAsync` containing an {@link Err} variant of {@link Result}
 *
 * Equivalent to `new ResultAsync(Promise.resolve(new Err(err)))`
 *
 * @typeParam T - The type of the value contained in the `Result` for the success case
 * @typeParam E - The type of the error contained in the `Result` for the failure case
 * @param err - The value to wrap in a `Result.Err`.
 */
export function errAsync<T = never, E = unknown>(err: E): ResultAsync<T, E> {
  return neverthrow_errAsync<T,E>(err)
}
```

# Interface

Updating my `EventLog` interface was trivial. Just replace `Result` with `ResultAsync`.

```ts
export interface EventLog<T extends LogEntry> {
  addEntry(entry: T, sequenceId: SequenceId): ResultAsync<void,AddEntryError>;
  setMetadata(sequenceId: SequenceId, metaData: LogMetadata): ResultAsync<void,MetadataError>;
  query(start: SequenceId | 'snapshot' | 'start', end: SequenceId | 'end'): ResultAsync<QueryValue<T>,QueryError>;
  truncate(start: SequenceId): ResultAsync<void,TruncateError>
}
```

# Implementation

My reference implementation needed equally trivial changes. This is the implementation for `addEntry`, the other methods work the same way.

```ts
addEntry(entry: T, sequenceId: SequenceId): ResultAsync<void,AddEntryError> {
  if (sequenceId !== this.#endSequenceId)
    return errAsync(conflictError("sequenceId not next sequence id", this.#endSequenceId));

  this.#entries.push(entry);
  this.#endSequenceId ++;
  return okAsync();
}
```

I updated the function signature to match the change in interface. Apart from that, I just had to replace `ok` and `err` with `okAsync` and `errAsync`.

This is a simple in-memory reference implementation, so there's nothing actually asynchronous going on. Have we done anything meaningful?

We have genuinely made the API asynchronous due to the `Promise` guarantee that completion values are always *delivered* asynchronously, even if the promise was created already resolved.

# Unit Tests

We should see more meaningful changes in our unit tests, where we have to interact with the now asynchronous API. 

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

# Next Time

Well, that was almost too easy. Next time we'll try building an implementation of the `SpreadsheetData` [interface]({% link _posts/2025-02-03-react-spreadsheet-edit-ready.md %}) on top of our reference event log. That should throw up some interesting [impedance mismatches](https://startup-house.com/glossary/what-is-impedance-mismatch). 
