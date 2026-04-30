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

Nursery blocks can be nested to define parent-child relationships between tasks. All child tasks must complete before the parent task can complete. Errors in child tasks propagate to the parent and Trio cancels all other tasks in the same nursery. Having a regular tree structure of tasks makes it easy to implement a [timeout and cancellation system](https://vorpus.org/blog/timeouts-and-cancellation-for-humans/). 

# Features

I like many of the ideas behind structured concurrency and I'd like to have access to something similar in TypeScript. There are five core features that I'm looking for. 

1. Explicit end of concurrent execution tied to lexical scope or object lifetime
2. Parent-Child hierarchy of concurrent tasks
3. Propagation of errors from child to parent
4. Timeouts for all low level operations
5. Cancellation of unwanted tasks

# JavaScript Runtime

What does the standard JavaScript runtime provide? 

* What are the options for TypeScript and the JavaScript runtimes?
* Concurrency built on promises, most often combined with async/await primitives
* A promise is not a "task". A promise is a placeholder for a value that is available now or in the future
* A promise [does not own the work that led to it](https://blog.gaborkoos.com/posts/2025-12-23-Cancellation-In-JavaScript-Why-Its-Harder-Than-It-Looks/). You can't cancel a promise.
* The contract is that promises will eventually resolve and either produce a value or be rejected.
* JavaScript runtime added the concept of an [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) which can be passed to potentially blocking operations. The operation tests the signal on a regular basis to determine whether it should abort.
* Caller can use an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) to trigger a linked signal and cancel the operation.
* With the latest runtime you can create an `AbortSignal` that is [triggered after a timeout](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) and [combine](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static) multiple `AbortSignals` into one.
* Equivalent to cancellation tokens in other languages
* You get parent-child relationship between async function invocations, propagation of errors, timeout and cancellation support. The only thing missing is execution lifetime management.  
* Still an assortment of tools that require discipline to use in a structured way. Need to explicitly pass signals down the call chain.
* Ideal is language integrated features that do the right thing without needing a lot of boiler plate throughout the entire code base

# Effect

* Looked at [Effect](https://effect.website/) when considering approaches for [error handling]({% link _posts/2025-04-14-typescript-error-handling.md %})
* A task is represented by the `Effect<Success, Error, Requirement>` type
* The parameters define what the task returns on success, what it returns in case of an error and what required dependencies it has. 
* It effectively has a `Result` type bundled in
* At the time went with a simple `Result` type because I didn't want to constrain clients of my library. Effect is a large library with a very different programming style to regular TypeScript.
* The best summary I've seen is that Effect is an [Embedded Domain Specific Language](https://github.com/antoine-coulon/effect-introduction#6-efficiency--performance). It uses TypeScript to describe a set of instructions which are manipulated, optimized and executed by the Effect runtime.
* The DSL defines a hierarchy of tasks which are executed by the runtime using [fibers](https://effect.website/docs/concurrency/fibers/). Fibers are virtual threads implemented by Effect on top of JavaScript async functions. The fiber system supports [bounded concurrency](https://effect.website/docs/concurrency/basic-concurrency/#numbered-concurrency), [lifetime management](https://effect.website/docs/concurrency/fibers/#lifetime-of-child-fibers), [timeouts](https://effect.website/docs/error-management/timing-out/) and [cancellation](https://effect.website/docs/concurrency/basic-concurrency/#interruptions). 
* Maybe there's something lighter weight and less intrusive? Something that looks more like regular TypeScript.

# Effection

* There are JavaScript libraries, like [Effection](https://frontside.com/effection/blog/2026-02-06-structured-concurrency-for-javascript/), that take a more radical approach.
* Throw out async/await and rebuild the whole notion of concurrency on top of async generators. The crucial difference is that generators are [inherently cancelable](https://frontside.com/blog/2023-12-11-await-event-horizon/).
* Need to call a generator repeatedly to make progress between calls to `yield`. The Effection runtime has its own scheduler that drives interaction with the hierarchy of generators. Allows it to make scope implicit.
* Access to scope via a `useScope()` hook. Invoke using `const scope = yield useScope()`. The `useScope` call returns a special action object which the runtime interprets to look up the current scope and return via the next call to the generator.
* Runtime can also ask the generator to throw or return rather than continuing execution.
* Lots of hype comparing this approach to the "await event horizon". No guarantee that promise will ever settle.
* Of course correctly written code will eventually settle, and if it supports an `AbortSignal` will be just as responsive as generator.
* Any real world project will eventually call into third party or system APIs that use async/await/abort. Still relying on that code being correctly written.
* Just as intrusive as passing abort signals down to the call stack if you have to rewrite your entire code base without async/await.
* [Claim](https://frontside.com/blog/2025-12-23-announcing-effection-v4/) that Effection can interoperate cleanly with async/await
* Effection does make it easier to be confident that the code you write is correctly written with less boiler plate than the native approach.
* As with error handling, I'm writing a library, don't want to constrain client choices. Exposing an Effection based API is a step too far.
* Not convinced that rewriting internals to use EFfection is necessary or worthwhile.
* Use `Result` based approach for typed error handling of expected errors. Checking and propagating errors is part of cost of doing business. Also supporting a `CanceledError` is not much extra effort.
* Effection talk a lot about the cost of manually propagating abort signals down call chain. Easy to forget to pass down when abort signals are usually optional arguments.
* If you believe cancellation is important and you're prepared to rewrite, then just make them required arguments. 
* Can add a little bit of abstraction and introduce a `Scope` object. Every function takes scope as a mandatory argument.
* Scope encapsulates an abort signal, default timeout, a list of promises to wait on when scope ends, maybe generic context management like Effection, retry policies, token buckets, ...
* Starts "tasks" as normal, getting a promise back. If you don't want to deal with promise explicitly, add it to the current scope to take care of. 
* Ability to create child scopes with linked signals. All the things in the structured concurrency playbook. 
* Cost is simple calling convention, much less intrusive than rewriting everything as an async generator.

# Concurrency Scope

* What's the simplest thing I can do that gives me a basic set of structured concurrency features?
* The only thing missing from the basic toolkit is execution lifetime
* Define a `ConcurrencyScope` object which plays the same role as a trio nursery. Owns an `AbortController` and `AbortSignal`. Can set an overall timeout for the scope. 
* Rather than rewriting code to use Effect's DSL or Effection's async generator based pseudo-DSL, require every function to take a mandatory scope argument. Can't forget to pass it down.
* Every function is required to check the scope for cancellation at appropriate moments (e.g. before an await), and return `CancelError` if cancelled.
* If awaited function returns `CancelError`, propagate it upwards.
* If you call async function and don't immediately await result, add the returned promise to the scope.
* End a scope by calling `cancel` or `end` methods.
* Can create sub-scope to nest scopes. Internally handles chaining signals so abort of parent scope also aborts child scopes.
