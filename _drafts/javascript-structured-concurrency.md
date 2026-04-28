---
title: TypeScript Structured Concurrency
tags: typescript
thumbnail: /assets/images/frontend/ts-logo-128.png
---

wise words

* Over time have come to realize that there's [more to error-handling in concurrent programs](https://blog.nelhage.com/post/concurrent-error-handling/) than [rejected promises or async Results]({% link _posts/2025-05-19-asynchronous-typescript.md %}). The code I'm writing is all a bit ad-hoc. Especially when it comes to object lifetimes.
* All the cool young languages are using [structured concurrency](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/)
  * Lifetime of concurrent operations tied to lexical scope
  * Defines parent-child relationship between concurrent "tasks"
  * All child tasks must complete before parent task can complete
  * Error in child propagates to parent, cancels other children
  * Scope is implicit context accessible to descendants. No need to explicitly propagate timeouts, etc. down call stack.
* Python "async with" syntax makes it easy to bolt onto the existing concurrency constructs
* Common pattern is to fan out a bunch of concurrent operations and then wait for them to complete
* Can get messy in real life, especially if the network is involved
* Any task can succeed, fail or never complete
* Critical to think about [timeouts](https://vorpus.org/blog/timeouts-and-cancellation-for-humans/)

* What are the options for TypeScript and the JavaScript runtimes?
* Concurrency built on promises, most often combined with async/await primitives
* A promise is not a "task". A promise is a placeholder for a value that is available now or in the future
* A promise [does not own the work that led to it](https://blog.gaborkoos.com/posts/2025-12-23-Cancellation-In-JavaScript-Why-Its-Harder-Than-It-Looks/). You can't cancel a promise.
* The contract is that promises will eventually resolve and either produce a value or be rejected.
* JavaScript runtime added the concept of an [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) which can be passed to potentially blocking operations. The operation tests the signal on a regular basis to determine whether it should abort.
* Caller can use an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) to trigger a linked signal and cancel the operation.
* With the latest runtime you can create an `AbortSignal` that is [triggered after a timeout](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) and [combine](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static) multiple `AbortSignals` into one.
* Equivalent to cancellation tokens in other languages
* Still an assortment of tools that require discipline to use in a structured way
* Ideal is language integrated features that do the right thing without needing a lot of boiler plate throughout the entire code base
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
* Scope encapsulates an abort signal, default timeout, a list of promises to wait on when scope ends, maybe generic context management like Effection.
* Starts "tasks" as normal, getting a promise back. If you don't want to deal with promise explicitly, add it to the current scope to take care of. 
* Ability to create child scopes with linked signals. All the things in the structured concurrency playbook. 
* Cost is simple calling convention, much less intrusive than rewriting everything as an async generator.
