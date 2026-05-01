---
title: TypeScript Structured Concurrency
tags: typescript
thumbnail: /assets/images/frontend/ts-logo-128.png
---

Over time I've come to realize that there's [more to error-handling in concurrent programs](https://blog.nelhage.com/post/concurrent-error-handling/) than [rejected promises or async Results]({% link _posts/2025-05-19-asynchronous-typescript.md %}). The code I'm writing is all a bit ad-hoc. Especially when it comes to async execution lifetimes.

As I'm using TypeScript, I start a concurrent operation by calling an async function which returns a promise. Sometimes I need the result immediately and await promise completion before proceeding. No issues here, but no real concurrency either. 

At the other end of the spectrum, the function is a fire-and-forget operation and I leave the promise dangling. I don't care what the result is, so why slow things down by waiting for it? However, I get nagging warnings from eslint if it realizes that a promise was ignored.

Things get more complex with true concurrent code, where multiple async functions are active at the same time, interacting with shared state. There are multiple promises to manage with varying lifetimes. The functions may [interfere]({% link _posts/2026-03-09-infinisheet-decoupling-event-log-snapshot.md %}) with each other, with changes made by one function resulting in other functions becoming redundant.

It becomes difficult to keep track of everything. Sometimes I'll tear down some state then run into a crash because there's an outstanding async function that still depends on it. Alternatively, I'll end up waiting for async functions whose work is no longer relevant.

All of which made it the perfect time to be [introduced](https://blog.nelhage.com/post/concurrent-error-handling/) to njs's seminal [essay](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/) on structured concurrency. 

# Structured Concurrency

The basic premise is simple. Forty years ago we replaced ad-hoc flow control using `goto` with structured flow control using if, loops and functions. In the same way, we should replace ad-hoc concurrency with higher level structured concurrency primitives.

{% include candid-image.html src="/assets/images/typescript/control-schematics.svg" alt="Structured Flow Control" attrib="[njs blog](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/)" %}

Structured flow control is easy to understand and compose because execution enters at the top and leaves at the bottom. You can treat what happens in between as a black box. 

{% include candid-image.html src="/assets/images/typescript/trio-nursery-schematic.svg" alt="Structured Concurrency" attrib="[njs blog](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/)" %}

In the same way, execution should enter a structured concurrency primitive at the top, concurrent operations run *and* complete before execution leaves at the bottom.

# Trio

njs implemented his ideas in the [Trio](https://trio.readthedocs.io/en/stable/) library for Python. The core structured concurrency primitive in Trio is the nursery. A parent task can't start child tasks without first creating a nursery for them to live in. The nursery object is typically used with Python's `async with` syntax. This defines a lexical scope. Execution enters at the top, child tasks are started *and* complete before execution leaves at the bottom. It's always safe to tear down state used by concurrent tasks after execution leaves the nursery block.

{% include candid-image.html src="/assets/images/typescript/trio-nursery-code-paths.svg" alt="Structured Concurrency in Trio"  attrib="[njs blog](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/)" %}

Nursery blocks can be nested to define parent-child relationships between tasks. Python allows code nested many levels deep to find the owning scope defined by the nearest enclosing nursery block. All child tasks must complete before the parent task can complete. Errors in child tasks propagate to the parent and Trio cancels all other tasks in the same nursery. Having a regular tree structure of tasks makes it easy to implement a [timeout and cancellation system](https://vorpus.org/blog/timeouts-and-cancellation-for-humans/). 

# Features

I like the ideas behind structured concurrency and I'd like to have access to something similar in TypeScript. There are five core features that I'm looking for. 

1. Explicit end of concurrent execution tied to lexical scope or object lifetime
2. Parent-Child hierarchy of concurrent tasks
3. Propagation of errors from child to parent
4. Timeouts for all low level operations
5. Cancellation of unwanted tasks

# JavaScript Runtime

What does the standard JavaScript runtime provide? 

Concurrency is built on promises, most often combined with async/await primitives. A promise is not a "task". A promise is a placeholder for a value that is available now or in the future. A promise [does not own the work that led to it](https://blog.gaborkoos.com/posts/2025-12-23-Cancellation-In-JavaScript-Why-Its-Harder-Than-It-Looks/). You can't cancel a promise.

The contract is that promises will eventually resolve and either produce a value or be rejected. The JavaScript runtime recently added the concept of an [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) which can be passed to potentially blocking operations. The operation tests the signal on a regular basis to determine whether it should abort.

Callers can use an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) to trigger a linked signal and cancel the operation. With the latest runtime you can create an `AbortSignal` that is [triggered after a timeout](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) and [combine](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static) multiple `AbortSignals` into one.

You get an assortment of tools that provide most of the features I'm looking for. There's a parent-child relationship between caller and callee of async functions. Errors propagate from callee to caller. Abort signals and controllers provide timeout and cancellation support. The only thing missing is execution lifetime management.  

The downside is the tools need discipline to use in a structured way. The JavaScript runtime doesn't provide anyway to find lexical scopes higher up the call chain. You need to explicitly pass the relevant scope, like the current abort signal, down the chain. You need to be disciplined about awaiting every promise at the latest possible time. 

The ideal is language integrated features that do the right thing without needing a lot of boiler plate throughout the entire code base.

# Effect

I first looked at [Effect](https://effect.website/) when considering approaches for [error handling]({% link _posts/2025-04-14-typescript-error-handling.md %}). A task is represented by the `Effect<Success, Error, Requirement>` type. The parameters define what the task returns on success, what it returns in case of an error and what required dependencies it has. 

At the time, I went with a simple `Result<Success, Error>` type because I didn't want to constrain clients of my library. Effect is a large library with a very different programming style to regular TypeScript.

The best summary I've seen is that Effect is an [Embedded Domain Specific Language](https://github.com/antoine-coulon/effect-introduction#6-efficiency--performance). It uses TypeScript to describe a set of instructions which are manipulated, optimized and executed by the Effect runtime. The runtime keeps track of scopes making the current scope available when needed.

The DSL defines a hierarchy of tasks which are executed by the runtime using [fibers](https://effect.website/docs/concurrency/fibers/). Fibers are virtual threads implemented by Effect on top of JavaScript async functions. The fiber system supports [bounded concurrency](https://effect.website/docs/concurrency/basic-concurrency/#numbered-concurrency), [lifetime management](https://effect.website/docs/concurrency/fibers/#lifetime-of-child-fibers), [timeouts](https://effect.website/docs/error-management/timing-out/) and [cancellation](https://effect.website/docs/concurrency/basic-concurrency/#interruptions). 

Even if I used Effect entirely internally, it's still not a dependency I want to force on my clients. Maybe there's something lighter weight and less intrusive? Something that looks more like regular TypeScript.

# Effection

[Effection's marketing](https://frontside.com/effection/) looks like it was built to address my concerns about Effect. It provides integrated [structured concurrency for TypeScript](https://frontside.com/effection/blog/2026-02-06-structured-concurrency-for-javascript/). There's no esoteric APIs, no functional language constructs embedded in TypeScript, no sprawling library. It's just TypeScript! 

The code you write is just TypeScript, but not the TypeScript you expect. There's no async/await. You replace async functions with async generators.

```ts
function* countdown() {
  for (let i = 5; i > 1; i--) {
    console.log(`${i}`);
    yield* sleep(1000);
  }
  console.log('blastoff!');
}
```

The crucial difference is that generators are [inherently cancelable](https://frontside.com/blog/2023-12-11-await-event-horizon/). You need to call a generator repeatedly to make progress between calls to `yield`. The Effection runtime has its own scheduler that drives interaction with the hierarchy of generators. The runtime can ask the generator to throw or return rather than continuing execution.

Having execution managed by an external runtime also allows Effection to make scope implicit. The runtime keeps track of the current scope. Access is via the `useScope()` hook. You invoke the hook via a `yield` statement.

```ts
const scope = yield useScope()
```

The `useScope` call returns a special action object which the runtime interprets to look up the current scope and return it via the next call to the generator. In many ways, Effection is also an embedded domain specific language. You're just [reusing existing TypeScript syntax](https://frontside.com/effection/guides/v4/async-rosetta-stone/) to express the same intent as async/await.

There's lots of hype comparing this approach to the doom of the [await event horizon](https://frontside.com/blog/2023-12-11-await-event-horizon/). Your promise may never settle, there are no guarantees!

Of course, correctly written code will eventually settle, and if it supports `AbortSignal` will be just as responsive as generator. Any real world project will eventually call into third party or system APIs that use async/await/abort. You're still relying on that code being correctly written.

Rewriting your entire code base to use generators is even more intrusive than passing abort signals down the call stack. Effection does make it easier to be confident that the code you write is correct, with less boiler plate than the native approach.

Again, I'm writing a library, I don't want to constrain client choices. Exposing an Effection based API is a step too far. I'm not convinced that rewriting the internals to use Effection is necessary or worthwhile.

I use a `Result` based approach for typed handling of expected errors. Checking and propagating errors is part of the cost of doing business. Also supporting a `CanceledError` is not much extra effort.

Effection talk a lot about the cost of manually propagating abort signals down the call chain. It's easy to forget to pass the signal on when abort signals are usually optional arguments.

# Explicit Scope

If you believe cancellation support is important and you're prepared to rewrite your existing code, then the simplest solution is just to make abort signals required arguments. We can add a little bit of abstraction and introduce a `Scope` object. Rather than rewriting code to use Effect's DSL or Effection's async generator based pseudo-DSL, require every function to take a mandatory scope argument. TypeScript will complain if you forget to pass it down.

The scope object can encapsulate all the structured concurrency concerns. We can start simple with scope as a wrapper around an abort signal, together with a list of promises to wait on when the scope ends. Here's a sketch of what it might look like to use a system like this.

```ts
withScope(parentScope, (scope) => {
  scope.addPromise(myFunc(scope));
  scope.addPromise(myOtherFunc(scope));
})
```

You could optionally apply a timeout to the entire scope, internally combining an explicit abort signal with a timeout signal.

```ts
withScope(parentScope, (scope) => {
  scope.addPromise(myFunc(scope));
  scope.addPromise(myOtherFunc(scope));
}, { timeout: 10000 })
```

It would be simple to add some sort of task abstraction which then opens the door for retry policies.

```ts
type Task<T,E> = (scope: Scope) => Promise<Result<T,E>>

withScope(parentScope, (scope) => {
  scope.startSoon(myFunc);
  scope.startSoon(myOtherFunc);
}, { timeout: 10000, retry: { times: 3, backoff: "exponential" }})
```

You still have direct access to the promises returned by each async function or task. Write normal async/await code with the security of knowing that everything will be cleaned up at the end of the scope.

```ts
withScope(parentScope, (scope) => {
  scope.startSoon(myFunc);
  const result = await scope.startSoon(myOtherFunc);
  if (result.isErr()) {
    scope.Cancel();
    return;
  }
  ...
}, { autoCancelOnError: false })
```

The `withScope` utility function creates a new child scope, calls the lambda passed to it and then cleans up at the end. The scope could automatically cancel other tasks if any You can nest `withScope` blocks lexically, or create `Scope` objects directly for more control. You have all the features in the structured concurrency playbook at the cost of a simple calling convention. 

It's important that functions check the scope for cancellation at appropriate moments. For example, before calling blocking IO and in compute intensive loops. Most of the time this can be handled by using scope aware wrapper functions for system APIs like `sleep` and `fetch`. 

# Conclusion

I'm excited. I think I can provide the structured concurrency I need with some simple utilities and a calling convention. Next time we'll see how well that works out in reality.
