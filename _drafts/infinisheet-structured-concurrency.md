---
title: InfiniSheet Structured Concurrency
tags: infinisheet
---

wise words

* Putting TypeScript Structured Concurrency sketch into practice for Infinisheet
* I use a mixture of `Promise<Result>` and `ResultAsync` types depending on whether I'm using async/await or functional style. What my structured concurrency implementation to support both.
* Both are compatible with `PromiseLike` interface so first attempt was method signatures like

```ts
  startSoon<R extends PromiseLike<Result<unknown,unknown>>>(task: (scope: ConcurrencyScope) => R) {
    const ret = task(this);
    this.addPromise(ret);
    return ret;
  }
```

* The `R extends PromiseLike<Result<unknown,unknown>>` syntax is the standard way of constraining generic types. I don't care what value and error types are, I just care that the function passed returns a promise to some instance of the `Result` type.
* If I call this with `ResultAsync<number,string>` I get an incomprehensible TypeScript error telling me that it's not compatible with `PromiseLike<Result<unknown,unknown>>`.
* However, `ResultAsync<number,string>` is compatible with `PromiseLike<Result<number,string>>` and `PromiseLike<Result<number,string>>` is compatible with `PromiseLike<Result<unknown,unknown>>`. TypeScript seems to get confused determining compatibility if you try to do it one step.
* Can make it work by having caller do more work but that's not friendly.
* Tried to be more explicit about types accepted. e.g. `R extends Promise<Result<unknown,unknown>> | ResultAsync<unknown,unknown>` but end up fighting TypeScript and throwing in lots of casts in my implementation.
* Ended up with middle ground that relies on function overloads.

```ts
  startSoon<R extends ResultAsync<unknown,unknown>>(task: (scope: ConcurrencyScope) => R): R;
  startSoon<R extends Promise<Result<unknown,unknown>>>(task: (scope: ConcurrencyScope) => R): R;
  startSoon<R extends PromiseLike<Result<unknown,unknown>>>(task: (scope: ConcurrencyScope) => R) {
    const ret = task(this);
    this.addPromise(ret);
    return ret;
  }
```

* Naturally does the two step type comparison. First checks that type from caller is compatible with `ResultAsync<unknown,unknown>` or `Promise<Result<unknown,unknown>>`. Then TypeScript checks that the overload function signatures are compatible with the implementation function signature.

# withScope

* Trying to make `withScope` magically do what the user wants based on shape of lambda body being executed. If body returns a `PromiseLike<Result>` or `Result` assume that everything relevant is complete, cancel anything still running and normalize to return equivalent `ResultAsync` back to our caller. If body returns some other form of value, turn it into the value part of a result, wait for tasks to finish and report any error. If body returns void, wait for tasks to finish and return `ResultAsync<void,Error>`.
* Started with simplified case of trying to support body that returns `void` or `Promise<Result>`
* Had to use the overload approach again to keep complexity under control

```ts
export function withScope<R extends Promise<Result<unknown,unknown>>>(parentScope: ConcurrencyScope | null, 
  body: (scope: ConcurrencyScope) => R, options?: ConcurrencyScopeOptions): ResultAsync<InferPromiseOkTypes<R>, InferPromiseErrTypes<R>>>;
export function withScope<E extends InfinisheetError = InfinisheetError>(parentScope: ConcurrencyScope | null, 
  body: (scope: ConcurrencyScope) => void, options?: ConcurrencyScopeOptions):  ResultAsync<void,E>>;
export function withScope<R>(parentScope: ConcurrencyScope | null, 
  body: (scope: ConcurrencyScope) => R, options?: ConcurrencyScopeOptions): ResultAsync<unknown, unknown>>
{
  const scope = new ConcurrencyScope(options);
  const ret = body(scope);
  if (ret === undefined)
    return scope.all().then((result) => result.isErr() ? errAsync(result.error) : okAsync())
  else
    return scope.cancel().then(() => new ResultAsync(ret as Promise<Result<unknown,unknown>>))
}
```

* Thought I could do a runtime check to see if return is void or Promise and use type narrowing. Doesn't work. Have to explicitly cast the non-void case to a promise.
* Problem is that there's various ways that a function with a return type of void can actually return something other than `undefined` at runtime.
* Simplest is that TypeScript lets you pass a function that returns anything to something that expects a void function
* Way to think about void function is that caller should ignore return value
* In general, there is no meaningful runtime check for the void case
* Even worse any body that doesn't match the promise overload will match the void overload, regardless of what it returns. Countless ways that caller can screw up.
* If I want to support special case void body behavior, need a special case `withVoidScope` utility function
* Is there any point in trying to specialize? Probably more confusing that useful. Better to have multiple `withScope` variants for each variation in runtime behavior needed.
* Perhaps have `withScope` always propagate on whatever body returns and cancel anything still active. Concentrate on lifetime management part.
* Crucial insight was to start with most generic version: `body` that returns some `R` and `withScope` that returns `Promise<R>`. By using `await` to create `Promise<R>` from `R`, we get promise flattening for free. Just need appropriate overloads to make it visible to caller.

```ts
export function withScope<R extends PromiseLike<unknown>>(parentScope: ConcurrencyScope | null, 
  body: (scope: ConcurrencyScope) => R, options?: ConcurrencyScopeOptions): Promise<InferPromiseLikeType<R>>;
export async function withScope<R>(parentScope: ConcurrencyScope | null, 
  body: (scope: ConcurrencyScope) => R, options?: ConcurrencyScopeOptions): Promise<R>;
export async function withScope<R>(parentScope: ConcurrencyScope | null, 
  body: (scope: ConcurrencyScope) => R, options?: ConcurrencyScopeOptions): Promise<R>
{
  const scope = new ConcurrencyScope(parentScope, options);
  const ret = await body(scope);
  scope.cancel();
  await scope.allSettled();
  return ret;
}
```

Added a second variant, `withScopeAsync` that returns a `ResultAsync`. Works with any body that returns a `Result` in some form, whether synchronously, as a `Promise`, `PromiseLike` or `ResultAsync`.

```ts
export function withScopeAsync<R extends ResultAsync<unknown, unknown>>(parentScope: ConcurrencyScope | null, 
  body: (scope: ConcurrencyScope) => R, options?: ConcurrencyScopeOptions): R;
export function withScopeAsync<R extends Promise<Result<unknown, unknown>>>(parentScope: ConcurrencyScope | null, 
  body: (scope: ConcurrencyScope) => R, options?: ConcurrencyScopeOptions): ResultAsync<InferPromiseOkTypes<R>,InferPromiseErrTypes<R>>
export function withScopeAsync<R extends Result<unknown, unknown>>(parentScope: ConcurrencyScope | null, 
  body: (scope: ConcurrencyScope) => R, options?: ConcurrencyScopeOptions): ResultAsync<InferOkTypes<R>,InferErrTypes<R>>
export function withScopeAsync<R extends PromiseLike<Result<unknown, unknown>> | Result<unknown, unknown>>(parentScope: ConcurrencyScope | null, 
  body: (scope: ConcurrencyScope) => R, options?: ConcurrencyScopeOptions): ResultAsync<unknown,unknown>
{
  const scope = new ConcurrencyScope(parentScope, options);

  return new ResultAsync((async () => {
    const ret = await body(scope);
    scope.cancel();
    await scope.allSettled();
    return ret;
  })())
}
```

# Generic Error Handling

* Went down a rabbit hole trying to support automatic propagation of errors from any promises/tasks that fail.
* Started by adding type parameter for expected errors. You can then have type system check that task/promise added to scope has valid error and make it clear to client which errors they need to check for at end of scope.
* Doesn't work. Generic error parameter propagates everywhere, including into type of scope being passed down call chain. Ends up being tremendously fiddly with any addition of new error type having to propagate everywhere. If we have calling convention that everyone passes scope down the call chain there should be a single type of scope suitable for use everywhere that doesn't change.
* All for something that is of minor utility. Primary error handling in `Result` based system should be where result is returned. e.g. In the body.
* Looking at aggregated errors for all promises in scope only useful for debugging or for simple case of checking that all fire and mostly forget tasks have completed.
* Already have a base error type, `InfinisheetError` with a discriminated union tag. Hard code that type into `ConcurrencyScope`. Then do runtime narrowing if needed.

```ts
  async anyError(): Promise<Result<void,InfinisheetError>> {
    const results = await Promise.all(this.promises);
    for (const result of results) {
      if (result.isErr())
        return err(result.error);
    }
    return ok();
  }
```

* Sort of thing you could do. In this case check if any of the promises in the scope returned errors.
* Unoptimized: Only have to wait for first error returned, then can cancel rest.

# Unexpected Errors

* Using error included in `Result` for expected errors, any exceptions or rejected promises are unexpected errors. Outside the visibility of the type system.
* Unexpected errors should just propagate through scope, while ensuring everything is canceled.
* try - finally
