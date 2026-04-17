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
* Just as intrusive as passing abort signals down to the call stack if you have to rewrite your entire code base without async/await.
* [Claim](https://frontside.com/blog/2025-12-23-announcing-effection-v4/) that Effection can interoperate cleanly with async/await
