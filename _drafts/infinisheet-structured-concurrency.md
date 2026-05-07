---
title: InfiniSheet Structured Concurrency
tags: infinisheet
---

I'm putting my [TypeScript Structured Concurrency]({% link _posts/2026-05-04-typescript-structured-concurrency.md %}) sketch into practice on my [InfiniSheet]({% link _topics/infinisheet.md %}) project. The first step is to flesh out the sketch with real code for the crucial types and functions. 

# Concurrency Scope

I started with a simple skeleton implementation of a concurrency scope class. This represents the state managed by an active scope. A scope has a parent, some options and a list of promises that need to settle before the scope can exit. 

```ts
export class ConcurrencyScope {
  constructor(parent: ConcurrencyScope | null, options?: ConcurrencyScopeOptions) {
    this.parent = parent;
    this.options = options;
    this.promises = [];
  }

  cancel(): void;
  async all(): Promise<void>;
  async allSettled();
  async anyError(): Promise<Result<void,unknown>>;

  readonly parent: ConcurrencyScope | null;
  readonly options?: ConcurrencyScopeOptions | undefined;
  private promises: PromiseLike<Result<unknown,unknown>>[];
}
```

There are some placeholder utility functions that we can implement later. These allow you to cancel work in progress and wait for promises in a variety of ways.

# Promise Like

The InfiniSheet project uses a mixture of `Promise<Result>` and `ResultAsync` return types depending on whether I'm using async/await or functional style. I want my structured concurrency implementation to support both. Both are compatible with the built-in`PromiseLike` interface. 

Here's what my first attempt at a `startSoon` method looked like.

```ts
  startSoon<R extends PromiseLike<Result<unknown,unknown>>>
    (task: (scope: ConcurrencyScope) => R): R
  {
    const ret = task(this);
    this.promises.push(ret);
    return ret;
  }
```

The `R extends PromiseLike<Result<unknown,unknown>>` syntax is the standard way of constraining generic types. I don't care what the value and error types are, I just care that the task function passed in returns a promise to some instance of the `Result` type.

If I call `startSoon` with a task that returns`ResultAsync<number,string>`, I get an incomprehensible multi-line TypeScript error telling me that it's not compatible with `PromiseLike<Result<unknown,unknown>>`. The weird thing is that `ResultAsync<number,string>` is compatible with `PromiseLike<Result<number,string>>`, and `PromiseLike<Result<number,string>>` is compatible with `PromiseLike<Result<unknown,unknown>>`. TypeScript seems to get confused determining compatibility if you try to do it in one step.

# Overloads

I can make it work by having the caller convert types where needed but that's not very friendly. I tried to be more explicit about the types accepted. e.g. `R extends Promise<Result<unknown,unknown>> | ResultAsync<unknown,unknown>`. That just moved the problems into the implementation. It felt like I was fighting TypeScript rather than working with it. I could only get it to work by throwing in lots of casts.

I started again and ended up with a middle ground that relies on function overloads.

```ts
  startSoon<R extends ResultAsync<unknown,unknown>>
    (task: (scope: ConcurrencyScope) => R): R;
  startSoon<R extends Promise<Result<unknown,unknown>>>
    (task: (scope: ConcurrencyScope) => R): R;
  startSoon<R extends PromiseLike<Result<unknown,unknown>>>
    (task: (scope: ConcurrencyScope) => R): R 
  {
    const ret = task(this);
    this.promises.push(ret);
    return ret;
  }
```

This naturally does a two-step type comparison. TypeScript first checks that the type from the caller is compatible with `ResultAsync<unknown,unknown>` or `Promise<Result<unknown,unknown>>`. TypeScript also checks that the overload function signatures are compatible with the implementation function signature.

# withScope

The client's main interaction with the scope system is via the `withScope` utility function. It establishes a new lexical scope, executes a body lambda function and waits for completion of any tasks started in the scope before exiting. 

```ts
await withScope(parentScope, (scope) => {
  scope.startSoon(myFunc);
  scope.startSoon(myOtherFunc);
})
```

I started off trying to make the `withScope` function magically do what the user wants based on the shape of the body lambda function being executed. If the body returns a `PromiseLike<Result>` or `Result` we can assume that everything relevant is complete, cancel anything still running and normalize to return the equivalent `ResultAsync` back to our caller. If the body returns some other form of value, turn it into the value part of a result, wait for the remaining tasks to finish and report any error. If the body returns void, wait for the tasks to finish and return `ResultAsync<void,Error>`.

I started with the simplified case of trying to support bodies that return `void` or `Promise<Result>`. I had to use the overload approach again to keep complexity under control.

```ts
export function withScope<R extends Promise<Result<unknown,unknown>>>
  ( parentScope: ConcurrencyScope | null, 
    body: (scope: ConcurrencyScope) => R, 
    options?: ConcurrencyScopeOptions
  ): ResultAsync<InferPromiseOkTypes<R>, InferPromiseErrTypes<R>>>;
export function withScope<E extends InfinisheetError = InfinisheetError>
  ( parentScope: ConcurrencyScope | null, 
    body: (scope: ConcurrencyScope) => void,
    options?: ConcurrencyScopeOptions ):  ResultAsync<void,E>>;
export function withScope<R>
  ( parentScope: ConcurrencyScope | null, 
    body: (scope: ConcurrencyScope) => R, 
    options?: ConcurrencyScopeOptions): ResultAsync<unknown, unknown>>
{
  const scope = new ConcurrencyScope(options);
  const ret = body(scope);
  if (ret === undefined) {
    return scope.anyError().then(
      (result) => result.isErr() ? errAsync(result.error) : okAsync());
  } else {
    scope.cancel();
    return scope.all().then(() => new ResultAsync(ret as Promise<Result<unknown,unknown>>));
  }
}
```

I thought I could do a runtime check to see if the body return is void or a Promise. TypeScript should use type narrowing to infer that `ret` is `undefined` in the if clause and a `Promise<Result>` in the else clause.

It doesn't work. TypeScript refuses to narrow the type in the else clause. I had to explicitly cast `ret` to a promise. 

The problem is that there's [various ways](https://typescript-eslint.io/rules/strict-void-return) that a function with a return type of void can actually return something other than `undefined` at runtime. The simplest is that TypeScript lets you pass a function that returns anything to something that expects a void function.

This is why TypeScript refuses to narrow the types. The way to think about void functions is that the *caller* should ignore any return value. In general, there is no meaningful runtime check for the void case.

Even worse any body that doesn't match the promise overload will match the void overload, regardless of what it returns. There's countless ways for a caller to screw up. 

# Radical Simplicity

Does it make sense to vary behavior so much at runtime? It's probably more confusing than useful. It might be better to have multiple `withScope` variants for each variation in runtime behavior needed.

Let's start again with the simplest form of `withScope`. The only structured concurrency feature missing from the JavaScript runtime is execution lifetime management. Let's concentrate on that. 

We can have `withScope` always propagate whatever the body returns and cancel anything still active. In general, if the body returns `R`, `withScope` should return `Promise<R>`. It turns out that this form of `withScope` can handle most cases. The crucial insight is that using `await` (which is equivalent to `Promise.resolve`) to create a `Promise<R>` from `R` gives you [promise flattening](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise#the_resolve_function) for free. You just need the appropriate overloads to make it visible to the caller.

```ts
export function withScope<R extends PromiseLike<unknown>>
  ( parentScope: ConcurrencyScope | null, 
    body: (scope: ConcurrencyScope) => R, 
    options?: ConcurrencyScopeOptions): Promise<InferPromiseLikeType<R>>;
export async function withScope<R>
  ( parentScope: ConcurrencyScope | null, 
    body: (scope: ConcurrencyScope) => R, 
    options?: ConcurrencyScopeOptions): Promise<R>;
export async function withScope<R>
  ( parentScope: ConcurrencyScope | null, 
    body: (scope: ConcurrencyScope) => R, 
    options?: ConcurrencyScopeOptions): Promise<R>
{
  const scope = new ConcurrencyScope(parentScope, options);
  const ret = await body(scope);
  scope.cancel();
  await scope.allSettled();
  return ret;
}
```

We can then use options whenever we want to vary runtime behavior. For example, if we don't want to cancel active tasks on exit, instead waiting for them to complete before moving on.

```ts
await withScope(null, (scope) => {
  void scope.startSoon(myFunc);
  void scope.startSoon(myOtherFunc);
}, { noCancelOnExit: true })
```

I added a second variant, `withScopeAsync`, that returns a `ResultAsync`. It works with any body that returns a `Result` in some form, whether synchronously, as a `Promise`, `PromiseLike` or `ResultAsync`.

```ts
export function withScopeAsync<R extends ResultAsync<unknown, unknown>>
  ( parentScope: ConcurrencyScope | null, 
    body: (scope: ConcurrencyScope) => R, 
    options?: ConcurrencyScopeOptions): R;
export function withScopeAsync<R extends Promise<Result<unknown, unknown>>>
  ( parentScope: ConcurrencyScope | null, 
    body: (scope: ConcurrencyScope) => R, 
    options?: ConcurrencyScopeOptions
  ): ResultAsync<InferPromiseOkTypes<R>,InferPromiseErrTypes<R>>
export function withScopeAsync<R extends Result<unknown, unknown>>
  ( parentScope: ConcurrencyScope | null, 
    body: (scope: ConcurrencyScope) => R, 
    options?: ConcurrencyScopeOptions
  ): ResultAsync<InferOkTypes<R>,InferErrTypes<R>>
export function withScopeAsync<R extends PromiseLike<Result<unknown, unknown>> | 
                                         Result<unknown, unknown>>
  ( parentScope: ConcurrencyScope | null, 
    body: (scope: ConcurrencyScope) => R, 
    options?: ConcurrencyScopeOptions): ResultAsync<unknown,unknown>
{
  const scope = new ConcurrencyScope(parentScope, options);

  return new ResultAsync((async () => {
    const ret = await body(scope);
    if (!options?.noCancelOnExit)
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
