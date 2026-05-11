---
title: InfiniSheet Structured Concurrency
tags: infinisheet
thumbnail: /assets/images/typescript/structured-concurrency-logo.png
---

I'm putting my [TypeScript Structured Concurrency]({% link _posts/2026-05-04-typescript-structured-concurrency.md %}) sketch into practice on my [InfiniSheet]({% link _topics/infinisheet.md %}) project. The first step is to flesh it out with real code for the crucial types and functions. 

# Concurrency Scope

I started with a simple skeleton implementation of a concurrency scope class. This represents the state managed by an active scope. A scope has a parent, some options and a list of promises that need to settle before the scope can exit. 

```ts
export class ConcurrencyScope {
  constructor(parent: ConcurrencyScope | null, options: ConcurrencyScopeOptions = {}) {
    this.parent = parent;
    this.options = options;
    this.promises = [];
  }

  cancel(): void;
  async all(): Promise<void>;
  async allSettled();
  async anyError(): Promise<Result<void,unknown>>;

  readonly parent: ConcurrencyScope | null;
  readonly options: ConcurrencyScopeOptions;
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

If I call `startSoon` with a task that returns`ResultAsync<number,string>`, I get an incomprehensible multi-line TypeScript error telling me that it's not compatible with `PromiseLike<Result<unknown,unknown>>`. The weird thing is that `ResultAsync<number,string>` is compatible with `PromiseLike<Result<number,string>>`, and `PromiseLike<Result<number,string>>` is compatible with `PromiseLike<Result<unknown,unknown>>`. 

TypeScript seems to get confused determining compatibility if you try to do it in one step.

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

The client's main interaction with the scope system is via the `withScope` utility function. It establishes a new lexical scope, executes a body lambda function and waits for completion of any tasks started in the scope. 

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

This is why TypeScript refuses to narrow the types. The way to think about void functions is that the *caller* should ignore any return value. In general, there is no meaningful runtime check for the void case. Even worse, any body that doesn't match the promise overload will match the void overload, regardless of what it returns. There's countless ways for a caller to screw up. 

# Radical Simplicity

Does it make sense to automatically vary behavior so much at runtime? It's probably more confusing than useful. It might be better to have multiple `withScope` variants for each variation in runtime behavior needed.

Let's start again with the simplest form of `withScope`. The only structured concurrency feature missing from the JavaScript runtime is execution lifetime management. Let's concentrate on that. 

We can have `withScope` always propagate whatever the body returns and cancel anything still active. The assumption here is that any errors you care about will have been explicitly handled in the body.

In general, if the body returns `R`, `withScope` should return `Promise<R>`. In most cases, `R` will be some form of `Result`, but there's no need to enforce that. 

It turns out that this form of `withScope` can handle most cases. The crucial insight is that using `await` (which is equivalent to `Promise.resolve`) to create a `Promise<R>` from `R` gives you [promise flattening](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise#the_resolve_function) for free. You just need the appropriate overloads to make it the typing clear.

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

We can then use options whenever we want to vary runtime behavior. For example, if we don't want to cancel active tasks on exit.

```ts
await withScope(null, (scope) => {
  void scope.startSoon(myFunc);
  void scope.startSoon(myOtherFunc);
}, { cancelOnExit: false })
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
  const { cancelOnExit = true } = scope.options;

  return new ResultAsync((async () => {
    const ret = await body(scope);
    if (cancelOnExit)
      scope.cancel();
    await scope.allSettled();
    return ret;
  })())
}
```

# Infer Types

You may have noticed my casual use of utility types like `InferPromiseLikeType<R>`. These are used to extract type parameters from more complex types, using the TypeScript [conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) feature.

```ts
type InferPromiseLikeType<R> = R extends PromiseLike<infer T> ? T : never;
```

This is a common TypeScript idiom that I didn't think too much about. It turns out there's a subtle trick when it comes to more complex cases. The original version of utilities for extracting value and error from a `Promise<Result>` looked like this.

```ts
type InferPromiseOkTypes<R> = R extends Promise<Result<infer T, unknown>> ? T : never;
type InferPromiseErrTypes<R> = R extends Promise<Result<unknown, infer E>> ? E : never;
```

This looks like a simple extension of the idiom to pull out a type one level deeper. However, it all went wrong when I threw this test case at it.

```ts
function myFunc(_scope: ConcurrencyScope): Promise<Result<boolean,ValidationError>> {
  return Promise.resolve(ok(true));
}

function myOtherFunc(_scope: ConcurrencyScope): ResultAsync<number,StorageError> {
  return okAsync(4);
}

const result = await withScopeAsync(null, async (scope) => {
  const ret = scope.startSoon(myFunc);
  const result = await scope.startSoon(myOtherFunc);
  if (result.isErr())
    return result;
  return await ret;
})
```

The return type of the body function, as determined by TypeScript, is `Promise<Result<boolean,ValidationError> |  Err<number,StorageError>>`. The return type from `withScopeAsync` should be `ResultAsync<number|boolean, ValidationError|StorageError>`. My typings came up with `ResultAsync<never,never>`. They couldn't handle the more complex union return type.

TypeScript has a [distributive conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types) feature that should help with unions. The conditional is checked against each type in the union separately, with the results combined together. It doesn't do anything in my case because the union is nested within the outer `Promise`. 

The trick is to rewrite the utility types to unwrap the nested types one step at a time.

```ts
export type InferOkTypes<R> = R extends Result<infer T, unknown> ? T : never;
export type InferErrTypes<R> = R extends Result<unknown, infer E> ? E : never;
export type InferPromiseOkTypes<R> = R extends Promise<infer T> ? InferOkTypes<T> : never;
export type InferPromiseErrTypes<R> = R extends Promise<infer T> ? InferErrTypes<T> : never;
```

We first extract the value of the promise, `Result<boolean,ValidationError> |  Err<number,StorageError>`. The `InferOkTypes` conditional is applied separately to each side of the union, extracting `boolean` and `number` which are combined as `boolean | number`. The same happens with `InferErrTypes`.

The final inferred type, `ResultAsync<number|boolean, ValidationError|StorageError>`, is exactly what we want. All without the caller having to write any explicit types.

# Generic Error Handling

I went down a rabbit hole trying to support automatic propagation of errors from any promises/tasks that fail. I started by adding a `ConcurrencyScope<E>` type parameter for expected errors. You can then have the type system check that any tasks/promises added to the scope have compatible error types. It also makes it clear to the client which errors they need to check for at the end of the scope.

It didn't work. The generic error type parameter propagates everywhere, including into the type of the scope being passed down the call chain. That makes it really painful to use. If you add some new code with new error types down the call tree, you end up having to propagate the new error type everywhere. 

If we have a calling convention that everyone passes a scope down the call chain, it needs to be a fixed, simple type that you don't have to think about.

I also realized that generic error handling is of very little use. The primary error handling in `Result` based system should be where the result is returned. Callers handle errors explicitly and where needed manually propagate them up the call stack.

Looking at aggregated errors for all promises in the scope is only useful for debugging or for the simple case of checking that all fire and mostly forget tasks have completed.

I already have a base error type, `InfinisheetError`, with a discriminated union tag. All errors within InfiniSheet are implementations of `InfinisheetError`. Instead of using a generic error parameter, I can hard code it as `InfinisheetError`. If I want any generic error handling, I can use runtime type checks.

```ts
  private promises: PromiseLike<Result<unknown,InfinisheetError>>[];

  async anyError(): Promise<Result<void,InfinisheetError>> {
    const results = await Promise.all(this.promises);
    for (const result of results) {
      if (result.isErr() && result.error.type !== 'CancelError')
        return err(result.error);
    }
    return ok();
  }
```

For example, this utility returns any error returned by any promise/task in the scope, ignoring cancellation.

# Conclusion

That was harder than I was expecting. Lots of false starts and dead ends. Plenty of TypeScript learning moments too. However, I'm happy with where we ended up. I think there's a good foundation to build on next time. 
