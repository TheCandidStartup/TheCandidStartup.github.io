---
title: InfiniSheet Unexpected Errors, Cancellation and Timeouts
tags: infinisheet
thumbnail: /assets/images/typescript/structured-concurrency-logo.png
---

wise words

* Continuing to flesh out `ConcurrencyScope`

# Unexpected Errors

* Using error included in `Result` for expected errors, any exceptions or rejected promises are unexpected errors. Outside the visibility of the type system.
* Unexpected errors should just propagate through scope, while ensuring everything is canceled.
* try - finally

```ts
  let completed = false;
  try {
    const ret = await body(scope);
    completed = true;
    return ret;
  } finally {
    if (cancelOnExit || !completed)
      scope.cancel();
    await scope.allSettled();
  }
```

* Logic is a bit awkward because you want to force cancellation if there's an unexpected error

# Cancellation

* AbortController and AbortSignals member of ConcurrencyScope
* Trio has separate concurrency and cancel scopes - python allows search up stack to find nearest of each
* Can't do that - have single explicit scope that I pass down
* Have one scope object that does both jobs
* Add options to control whether this scope object acts as a concurrency scope, cancel scope or both

```ts
export interface ConcurrencyScopeOptions {
  timeout?: number | undefined;
  cancelOnExit?: boolean | undefined;
  newCancelScope?: boolean | undefined;
  newConcurrencyScope?: boolean | undefined;
}
```

* Can add Trio like `withTimeout` utility function with different defaults. e.g. `newCancelScope` is true and `newConcurrencyScope` is false
* Depending on cancel scope option decide whether we inherit abort controller from parent or create a new one
* Depending on concurrency scope option decide whether we inherit promises list from parent or create a new one

```ts
export class ConcurrencyScope {
  constructor(parent: ConcurrencyScope | null, options: ConcurrencyScopeOptions = {}) {
    const { newCancelScope = true, newConcurrencyScope = true } = options;
    this.parent = parent;
    this.options = options;

    if (newConcurrencyScope || !parent) {
      this.ownPromises = true;
      this.promises = [];
    } else {
      this.ownPromises = false;
      this.promises = parent.promises;
    }

    if (newCancelScope || !parent) {
      this.abortController =  new AbortController();
      this.abortSignal = parent ? AbortSignal.any([this.abortController.signal, parent.abortController.signal]) : this.abortController.signal;
    } else {
      this.abortController = parent.abortController;
      this.abortSignal = parent.abortSignal;
    }
  }
```
* If we have a parent scope and are creating a new cancel scope we use `AbortSignal.any` to combine our abort signal with our parent's. If our parent cancels, any operations we started are canceled too. If we cancel, only operations started by us or our children are canceled.

# Sleep

* Need a cancellable operation to test whether any of this works
* Added a `sleep` method to `ConcurrencyScope` which uses `setTimeout` to implement cancellable sleep

```ts
  sleep(delay: number): Promise<Result<void,CancelError>> {
    const signal = this.abortSignal;

    return new Promise<Result<void,CancelError>>((resolve) => {
      function onAbort() {
        clearTimeout(timerId);
        resolve(err(cancelError()));
      }

      signal.addEventListener("abort", onAbort, { once: true });

      const timerId = setTimeout(() => {
        signal.removeEventListener("abort", onAbort );
        resolve(ok());
      }, delay);
    })
  }
```

* Adds an event listener to the scope's abort signal which cancels the timer using `clearTimeout`
* Being a good citizen by removing the event listener if the timer completes without being canceled
* Wrap the whole thing up in a promise that returns `Result<void,CancelError>`
* Added new Infinisheet `CancelError`

# Timeouts

* If scope has timeout, create a timeout `AbortSignal` and combine it in with the standard `AbortController` driven signal

```ts
    if (options.timeout) {
      this.abortSignal = AbortSignal.any([this.abortSignal, AbortSignal.timeout(options.timeout)]);
    }
```

* Makes sense to distinguish explicit cancellation from timeout
* Added `TimeoutError` and updated `sleep` to return `Result<void,CancelError|TimeoutError>`
* Abort signal has a reason field when aborted which is populated with a `DOMException` object which can be used to determine abort vs timeout

```ts
function reasonToError(signal: AbortSignal): CancelError | TimeoutError {
  return (signal.reason?.name === 'TimeoutError') ? timeoutError() : cancelError();
}
```

# Unit Testing with Fake Timers

* Rely on fake timers for unit testing

```ts
  it('cancel sleep', async () => {
    vi.useFakeTimers();
    const scope = new ConcurrencyScope(null);
    const promise = scope.sleep(100);
    const now = Date.now();

    scope.cancel();
    await vi.runAllTimersAsync();
    expect(await isPendingPromise(promise)).toEqual(false);
    const elapsed = Date.now() - now;
    expect(elapsed).toEqual(0);
    const result = await promise;
    expect(result._unsafeUnwrapErr()).toEqual(cancelError());
  })
```

* Makes it easy to check that cancel works as expected with `sleep`
* Next check that timeout works

```ts
  it('timeout sleep', async () => {
    vi.useFakeTimers();

    const scope = new ConcurrencyScope(null, { timeout: 50 });
    const promise = scope.sleep(100);
    const now = Date.now();
    await vi.runAllTimersAsync();
    expect(await isPendingPromise(promise)).toEqual(false);
    const elapsed = Date.now() - now;
    expect(elapsed).toEqual(50);
    const result = await promise;
    expect(result._unsafeUnwrapErr()).toEqual(timeoutError());

    AbortSignal.timeout = origTimeout;
  })
```

* It doesn't. Timeout doesn't happen.
* Took a while to figure it out.
* Turns out that Vitest fake timers doesn't support `AbortSignal.timeout`
* Which is weird. Surely `AbortSignal.timeout` is implemented using `setTimeout` internally? That is faked.
* I dove into the jsdom source code and as expected it uses `setTimeout` internally.
* The problem is that `Vitest` doesn't use the jsdom implementation of `AbortSignal` and `AbortController`
* Vitest uses the NodeJS implementation of `fetch` as jsdom doesn't have a working implementation of `fetch`
* The `fetch` API interacts with `AbortSignal` which means Vitest needs to use the NodeJS implementation of `AbortSignal` and `AbortController` too
* The NodeJS implementation of `AbortSignal.timeout` uses the NodeJS internal implementation of `setTimeout` which doesn't have a fake
* Seems to be a stand off between [Vitest](https://github.com/vitest-dev/vitest/issues/3088) and [fake-timers](https://github.com/sinonjs/fake-timers/issues/418) maintainers as to where the work should be done
* Implementing a basic equivalent is simple enough

```ts
function abortSignalTimeout(delay: number) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(new DOMException("Timed out!", "TimeoutError")), delay);
  return controller.signal;
}
```

* Just a pain to have to monkey patch `AbortSignal.timeout` in every unit test that might use cancellation functionality. Gets worse if clients of my library need to do the same.
* As I'm in a tracer bullet phase of development I can do whatever is expedient rather than whatever is right for the long term
* Just replace my use of `AbortSignal.timeout` with my implementation
* The [NodeJS implementation](https://github.com/nodejs/node/blob/bf7e79c264eef9bd0c743588aa6a158a26d90103/lib/internal/abort_controller.js#L202) is much more sophisticated. It uses an internal method to abort the signal that doesn't need a separate controller object. It uses a weak reference to the signal so the timeout doesn't keep it alive if no longer needed. Finally, it uses a [finalization registry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry) to cancel the timeout if the signal is GCed. 
