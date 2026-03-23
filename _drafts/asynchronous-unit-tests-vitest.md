---
title: Asynchronous Unit Tests with Vitest
tags: frontend infinisheet event-sourced-spreadsheet-data
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

Asynchronous code is great. It's the most efficient way to implement IO heavy workloads. When IO occurs, the current chain of execution is paused, allowing something else to run. There's no multi-threading overhead. You can sustain far higher rates of effective concurrency while using only a single thread. Control is transferred at well defined points so there's no need for critical sections and locks.

The JavaScript runtime relies on an event loop to schedule dependent work when IO operations complete. When an IO operation is invoked, control is transferred back to the event loop with the continuing code scheduled to run as a callback. 

How do you unit test something like this?

# Vitest and async/await

Languages like TypeScript provide [lots of syntactic sugar]({% link _posts/2025-05-19-asynchronous-typescript.md %}) for asynchronous code, including `async` and `await` primitives. Vitest builds on this foundation, allowing you to write asynchronous unit tests that look very similar to normal synchronous code.

```ts
describe('EventLog Interface', () => {
  it('should start out empty', async () => {
    const data = creator();

    let result = await data.query('start', 'end');
    expect(result).toBeQueryValue([0n, true, 0]);

    result = await data.query('snapshot', 'end');
    expect(result).toBeQueryValue([0n, true, 0]);

    result = await data.query(0n, 0n);
    expect(result).toBeQueryValue([0n, true, 0]);

    result = await data.query(0n, 5n);
    expect(result).toBeQueryValue([0n, true, 0]);

    result = await data.query(5n, 30n);
    expect(result).toBeInfinisheetError("InfinisheetRangeError");

    result = await data.query(-5n, 0n);
    expect(result).toBeInfinisheetError("InfinisheetRangeError");
  })
})
```

This is a unit test from my [InfiniSheet]({% link _topics/infinisheet.md %}) project, testing an asynchronous interface to a remote event log. The query methods are asynchronous. A real implementation would include a network round trip. Each `await` is a point where control is transferred back to the event loop with execution resuming later once any IO is complete. Vitest works with the event loop to run all tests to completion.

# Chains of Operations

You can think of asynchronous code as a collection of individual operations with dependencies between them. Operation A must complete before Operation B can run. 

At any time there may be multiple operations that are ready to run. The event loop acts as a scheduler, deciding which operation to run next. My simple unit test defines a sequential chain of operations. The queries run one at a time, with `await` defining a dependency on the previous query.

The code is simple to understand but no more efficient than the equivalent synchronous code. The real power of asynchronous code is when you allow multiple chains of operations to overlap, interleaving operations from different chains.

# Async Interference

I'm currently working on an [event sourced spreadsheet data]({% link _topics/event-sourced-spreadsheet-data.md %}) implementation that provides a great test case. The interface exposes logically independent async functions like `setCellValueAndFormat` and `setViewport` which are implemented as chains of asynchronous operations. These operations interact with common data structures. The implementation has to take [great care]({% link _posts/2026-03-09-infinisheet-decoupling-event-log-snapshot.md %}) to ensure there's no interference when operations from different chains are interleaved.

# Immutable Data Structures

The [data structure]({% link _posts/2025-06-02-event-sourced-spreadsheet-data.md %}) that I'm using is immutable. The current state of the spreadsheet is represented by a small content object. Whenever anything changes, the current content is replaced by a new content object. This wasn't done with asynchronous code in mind but turns out to be really useful for detecting async interference.

The first operation in the chain takes a reference to the current content object. Each subsequent operation can check whether the content is still as expected, or has been modified by something else. We can compare current and previous content and decide whether it's safe to proceed, or that the operation is now redundant and can be abandoned or that the chain should fail with an error. 

```ts
setCellValueAndFormat(row: number, column: number, value: CellValue, format: CellFormat): ResultAsync<void,SpreadsheetDataError> {
  const curr = this.content;
  const entry: SetCellValueAndFormatLogEntry = 
    { type: 'SetCellValueAndFormat', row, column, value, format };

  return this.addEntry(curr, entry).map((addEntryValue) => {
    if (this.isCompatibleLog(curr)) {
      // Safe to update content
    } else {
      // Bail or fail
    }
  }).mapErr((err): SpreadsheetDataError => {
    switch (err.type) {
      case 'ConflictError':
        if (this.isCompatibleLog(curr)) {
          // Safe to update content to reflect error state
        } else {
          // Bail or fail
        }
        return storageError("Client out of sync", 409);
      case 'StorageError': 
        return err;
    }
  });
}
```

This is a simplified version of the `setCellValueAndFormat` function. The chain of operations is defined using [ResultAsync]({% link _posts/2025-05-19-asynchronous-typescript.md %}) `map` and `mapErr` methods. At each step I use the `isCompatibleLog` utility method to check whether the current content is compatible with the content at the start of the chain.

# Scheduling

Ideally, I'd like to test all the different ways that operations can interleave. Unfortunately, we're at the mercy of the scheduler when it comes to ordering of unconstrained operations.

The JavaScript runtime has two levels of scheduling. At the top level is the event loop. Callbacks are registered to run at specific times or when IO completes. Jobs are executed in order. 

Each job can contain microtasks. These are asynchronous operations that are ready to run immediately but need to be executed as callbacks to match the required semantics for promises and async/await. When control returns to the event loop at the end of each job, any pending microtasks creating during the job are run *before* the next event loop job. 

So far my testing has been ad hoc. I write an initial version of each test in a natural way. Then I tweak the tests until I find a code sequence that results in an order of operations that I haven't seen yet. It's hard to test all the different execution permutations, or to figure out which are possible. I need a more systematic approach.

# Vitest Fake Timers

Vitest provides [fake timers](https://vitest.dev/api/vi.html#vi-usefaketimers) which mock calls to the runtime's timers. This gives you some control over the scheduler. 

In theory, you can use `vi.runAllTicks()` to run all pending microtasks. In practice it does nothing because Vitest doesn't fake the NodeJS `nextTick` function by default. Apparently, too many things [break](https://vitest.dev/config/faketimers.html#faketimers-tofake) if you do that.

You can still force microtasks to run the natural way by returning control to the event loop. Vitest has many utilities for manipulating time and invoking faked timers. The async variants of these methods execute via the event loop so will run pending microtasks as well. The least intrusive is `vi.advanceTimersByTimeAsync(0)`. This leaves current time unchanged so won't execute any timer callbacks but will run pending microtasks.

If you use timers, e.g. `setTimeout` or `setInterval`, you can pass the number of milliseconds to advance time, triggering any timers due within that time period (including any new ones scheduled by code triggered by the existing timers).

If you don't want to keep track of time passing you can use `vi.advanceTimersToNextTimerAsync()` to move time on to fire the next timer due.

The next level up is `vi.runOnlyPendingTimers()` which will move time on to the last timer due, so executing all existing timers, but not any added later than the current last pending.

Finally, there's `vi.runAllTimersAsync()` which will keep moving time on and executing timers until there are no timers left. Don't try this with `setInterval` or your test will fail when you hit the infinite execution limit (10,000 timers by default).

When multiple microtasks or jobs are pending, they will all be executed in the scheduler defined order. There's no way to choose which operation to run next.

# Mock Delays

We can do better by defining time delays for each operation and then advancing time explicitly. The event sourced spreadsheet data implementation is built on `EventLog` and `BlobStore` interfaces. I already have simple reference implementations that I use when unit testing. 

These interfaces are a natural seam in the architecture for insertion of mocks. They also reflect real world problems. In a real implementation the interfaces are abstractions over calling a network API. Calls over a network really do see a wide range of delays. Any sequence of operations we can induce by introducing delays to network calls can and will happen in the real world.

I've created delay wrappers that use `setTimeout` to return results from the wrapped interface after a delay.

```ts
export class DelayEventLog<T extends LogEntry> implements EventLog<T> {
  constructor(base: EventLog<T>, delay: number=0) {
    this.base = base;
    this.delay = delay;
  }

  delay: number;

  addEntry(entry: T, sequenceId: SequenceId, snapshotId?: SequenceId): ResultAsync<AddEntryValue,AddEntryError> {
    return delayResult(this.base.addEntry(entry, sequenceId, snapshotId), this.delay);
  }

  setMetadata(sequenceId: SequenceId, metadata: LogMetadata): ResultAsync<void,MetadataError> {
    return delayResult(this.base.setMetadata(sequenceId, metadata), this.delay);
  }

  query(start: SequenceId | 'snapshot' | 'start', end: SequenceId | 'end', snapshotId?: SequenceId): ResultAsync<QueryValue<T>,QueryError> {
    return delayResult(this.base.query(start, end, snapshotId), this.delay);
  }

  truncate(start: SequenceId): ResultAsync<void,TruncateError> {
    return delayResult(this.base.truncate(start), this.delay);
  }

  private base: EventLog<T>;
}
```

The interfaces use `ResultAsync` types to represent the pending result or error from each async method. The `delayResult` helper returns the wrapped result once the `setTimeout` callback is triggered.

```ts
export function delayPromise<T>(value: T, delay: number): Promise<T> {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), delay);
  })
}

export function delayResult<T,E>(result: ResultAsync<T,E>, delay: number): ResultAsync<T,E> {
  if (delay == 0)
    return result;
  const promiseLike = result.then<Result<T,E>,never>((r) => delayPromise(r, delay));
  return new ResultAsync(Promise.resolve(promiseLike));
}
```

Be careful with delays of zero. My first attempt at this didn't have any special case handling. The fake timers implementation treats zero delay timers created in dependent operations as if they had a delay of 1ms. 

It's useful to put a delay wrapper in place with an initial delay of 0 and then be selective about where you introduce real delays. It took me a long time to figure out why `vi.advanceTimersByTimeAsync(0)` wasn't running all the pending operations. 

# Coalescing setViewport calls

The `setViewport` method tells the spreadsheet engine which area of the spreadsheet you're interested in. It kicks off a chain of two operations which eventually loads the data needed from the blob store. 

```ts
  setViewport(viewport: SpreadsheetViewport|undefined): void { 
    this.content = { ...this.content, viewport, mapLoadStatus: ok(false) };
    this.notifyListeners();
    const curr = this.content;

    void this.syncLogsPromise.then(() => {
      if (this.isCompatibleViewport(curr)) {
        const segment = this.content.logSegment;
        void segment.tileMap.loadTiles(segment.snapshot, curr.viewport).then((result) => {
          if (this.isCompatibleViewport(curr)) {
            this.content = { ...this.content, mapLoadStatus: result }
            this.notifyListeners();
          }
        })
      }
    });
  }
```

The spreadsheet UI calls `setViewport` whenever the visible spreadsheet area changes. That happens a lot when you're scrolling through a spreadsheet a row at a time. 

The UI is notified whenever the content changes. This happens twice during `setViewport`. At the start we mark the content as stale. The UI can display a loading status if it wants. Once the data has loaded we mark the content as complete (or unavailable) and notify the UI so it can update itself. 

Multiple `setViewport` calls are allowed to overlap, with operations from earlier calls abandoned if they see that the desired viewport has changed. There are two ways that overlapping `setViewport` calls can interfere with each other. We want to test them both.

# Test Harness

The spreadsheet engine accesses low level functionality through abstract interfaces. That makes it easy to hook up reference implementations suitable for unit testing and add delay wrappers where needed.

```ts
  const blobStore = new DelayBlobStore(new SimpleBlobStore);
  const worker = new SimpleWorker<PendingWorkflowMessage>;
  const host = new SimpleWorkerHost(worker);
  const log = new  SimpleEventLog<SpreadsheetLogEntry>(host);

  const data = new EventSourcedSpreadsheetData(log, blobStore, host, {viewportEmpty: true});
  await vi.advanceTimersByTimeAsync(0);

  const mock = vi.fn();
  const unsubscribe = data.subscribe(mock);
```

We can then create an instance of the engine, wait for any pending microtasks to complete and then subscribe to be notified when content changes.

# Natural Test

The test case that you would naturally write covers one of the interfering sequences of operations.

```ts
  data.setViewport({ rowMinOffset: 0, columnMinOffset: 0, width: 100, height: 100 });
  data.setViewport({ rowMinOffset: 100, columnMinOffset: 0, width: 100, height: 100 });
  expect(mock).toBeCalledTimes(2);

  await vi.advanceTimersByTimeAsync(0);
  expect(mock).toBeCalledTimes(3);

  // Validate that loaded content matches second viewport
```

You call `setViewport` twice. In each case the current viewport is updated, listeners are notified and the first async operation is scheduled. You expect the mock listener to be called twice. 

Calling `vi.advanceTimersByTimeAsync` runs all the async operations. The work for the first call to `setViewport` is abandoned at the first operation because the viewport has changed. The two operations for the second `setViewport` run to completion resulting in one additional notification. 

# Delay Test

The other interesting case is where the second `setViewport` is called when the first call has completed its first operation and is waiting for the second to run.

```ts
  blobStore.delay = 100;
  data.setViewport({ rowMinOffset: 0, columnMinOffset: 0, width: 100, height: 100 });
  await vi.advanceTimersByTimeAsync(0);
  expect(mock).toBeCalledTimes(1);

  blobStore.delay = 0;
  data.setViewport({ rowMinOffset: 100, columnMinOffset: 0, width: 100, height: 100 });
  await vi.advanceTimersByTimeAsync(0);
  expect(mock).toBeCalledTimes(3);

  await vi.advanceTimersByTimeAsync(100);
  expect(mock).toBeCalledTimes(3);

// Validate that loaded content matches second viewport
```

We can simulate this case by adding a delay to the blob store, making the first call to `setViewport` and then allowing pending operations to run. We only see one notification because the chain of operations is waiting at `loadTiles`. 

We then make the second call to `setViewport` with a delay of zero and again run pending operations. All the operations for the second call complete with two additional notifications.

Finally, we advance time so that the first call's second operation can run and abandon because the viewport has changed.

# Code Coverage

[Code Coverage]({% link _posts/2024-03-18-vitest-code-coverage.md %}) is a useful tool to validate that you're exercising all code paths in your unit tests. It also forces you to look at your code with fresh eyes. You may be missing a test case for an order of operations you hadn't considered. Or, you might realize that you're protecting against an impossible order of operations and you have redundant code.

Remember that code coverage is not a substitute for independent thought and analysis. If you haven't included a check for async interference, code coverage won't tell you that it's missing.

# Vitest Code Coverage Weirdness

To speed things up and look at the big picture I'm running a vitest coverage report for my [entire monorepo]({% link _posts/2025-09-08-vitest-3-monorepo-setup.md %}). All unit tests in all packages are run and combined into one coverage report.

Something changed when I got all my dependencies [up to date]({% link _posts/2026-02-16-infinisheet-chore-updates.md %}). Files that I haven't touched, that had 100% coverage across the board, are reporting low function coverage, despite having 100% coverage of all the lines in the functions that are supposedly not being called. The corresponding unit tests for the problem files explicitly call every function.

If I run coverage at the package level, it reports 100% function coverage. For now, I'm ignoring function coverage at the repo level if statements, branches and lines are all at 100%.

# Conclusion

I have a much better understanding of the tools at my disposal and the kinds of unit tests I need to write. All my async operations have checks for potential async interference. My unit tests have 100% coverage of the code paths through those checks.

I'm ready to move on to the next feature on my backlog. 
