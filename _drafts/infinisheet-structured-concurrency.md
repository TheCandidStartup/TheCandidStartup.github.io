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
* Is there any point in trying to specialize based on return type?
* Perhaps have `withScope` always propagate on whatever body returns and cancel anything still active. Concentrate on lifetime management part.
* Do I need `withScopeAsync` for bodies that return `PromiseLike` and `withScope` for everything else?
* Have other variants of `withScope` or explicit control via options if you want different behavior.
