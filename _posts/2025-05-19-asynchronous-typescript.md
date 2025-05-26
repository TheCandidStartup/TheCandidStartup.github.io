---
title: Asynchronous TypeScript
tags: typescript
thumbnail: /assets/images/frontend/ts-logo-128.png
---

One of my reasons for [choosing TypeScript as a language stack]({% link _posts/2023-05-15-language-stack.md %}) is that it's built on an asynchronous IO, event-driven programming model, from the ground up. On the server side, idiomatic NodeJS code scales surprisingly well for a dynamic, low ceremony, fast development stack. 

I'm [about to build]({% link _posts/2025-05-05-infinisheet-event-log.md %}) my first, from scratch, public asynchronous API. I want to get it right. I need a better understanding of how asynchronous code works so that I can make the right choices.

# Callbacks

[Callbacks](https://developer.mozilla.org/en-US/docs/Glossary/Callback_function) are the original way of exposing asynchronous JavaScript runtime APIs. There are a variety of different styles. For example, `setTimeout` takes a simple callback invoked after a delay with no error handling. NodeJS APIs, like `fs.readfile`, use a single callback with separate `err` and `data` parameters. 

At the other end of the scale you have `XMLHttpRequest`. You create an `XMLHttpRequest` object, call methods on it to define your request, set separate `onload` and `onerror` callbacks and finally invoke the asynchronous operation by calling `send`.

There's similarly no uniformity in error handling, even within an API. [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) throws JavaScript `Error` objects for errors when defining the request, includes errors reported by the server in the `status` property accessible once `onload` has been invoked and reports other asynchronous errors via `onerror`.

Not all callback based APIs are asynchronous. Many, such as [Array.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach), are completely synchronous. Some APIs invoke the callback synchronously if data is already available and asynchronously if not. This can make code very [difficult to reason about](https://blog.izs.me/2013/08/designing-apis-for-asynchrony/).

Invoking a sequence of asynchronous operations can easily lead to [callback hell](http://callbackhell.com/).

```ts
doSomething(function (result) {
  doSomethingElse(result, function (newResult) {
    doThirdThing(newResult, function (finalResult) {
      console.log(`Got the final result: ${finalResult}`);
    }, failureCallback);
  }, failureCallback);
}, failureCallback);
```

Code that is hard to read, debug and maintain. 

# The Event Loop

JavaScript [execution environments](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model) are driven by an event loop. There's a [queue of jobs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model#job_queue_and_event_loop) to execute with associated JavaScript callback functions and [execution contexts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model#stack_and_execution_contexts). 

Jobs are added to the end of the queue when events are delivered or asynchronous operations complete. The event loop processes the queue in order, removing the next job and executing the callback. Each JavaScript agent is single threaded, so the callback runs until it returns back to the event loop.

# Promises

[Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) were added to JavaScript with [ES2015](https://developers.google.com/web/shows/ttt/series-2/es2015). A `Promise` is an object representing the eventual completion or failure of an asynchronous operation. 

You call an asynchronous API and it returns a `Promise`. Instead of passing callbacks to the API, you attach them to the promise by calling the `then` method. Promises replace the chaotic variety of callback based APIs with a common way of interacting with asynchronous APIs. 

```ts
type OnFulfilled<T,TResult> = (value: T) => TResult | PromiseLike<TResult>;
type OnRejected<TResult2> = (reason: any) => TResult | PromiseLike<TResult>;

interface Promise<T> {
    then<TResult1, TResult2>(onfulfilled?: OnFulfilled<T,TResult1>, 
      onrejected?: OnRejected<T,TResult2>): Promise<TResult1 | TResult2>;
}
```

This is a simplified version of the typing for the `Promise` interface. The interface is generic on type `T`, which is the value returned on successful completion of the asynchronous operation. The `then` method takes two optional arguments, `onfulfilled` and `onrejected`. If the promise is successfully *fulfilled*, `OnFulfilled` is called with the completion value . If the promise is *rejected*, `OnRejected` is called with the reason for the error. 

Note the lack of strong typing for errors. This is because promises were designed to match the JavaScript exception based error handling model. Any errors thrown by the underlying asynchronous operation are caught and passed as the reason to `onrejected`. Exceptions are not represented in the type system, so rejection reasons can literally be anything. 

Only one of the callbacks will be invoked. If it returns a `Promise`, that becomes the return value from the call to `then`, otherwise the result is wrapped in a new `Promise` which is already either *fulfilled* or *rejected* depending on which callback was invoked. There is special case support for [thenables](https://masteringjs.io/tutorials/fundamentals/thenable), typed as `PromiseLike` in Typescript. These are objects that have a compatible `then` method but aren't instances of the runtime `Promise` class.

If the required callback is not provided, `then` returns a new `Promise` with the same *fulfilled* or *rejected* state as the current `Promise`. 

All these pieces combine to produce the magic that lets us avoid callback hell. Multiple asynchronous operations can be composed by chaining together calls to `then`. If an earlier promise in the chain is *rejected*, that state propagates down the chain until a call to `then` that has an `onrejected` handler. For convenience, there is a `catch(onrejected)` method which is equivalent to `then(null, onrejected)`.

```ts
doSomething()
  .then((result) => doSomethingElse(result))
  .then((newResult) => doThirdThing(newResult))
  .then((finalResult) => {
    console.log(`Got the final result: ${finalResult}`);
  })
  .catch(failureCallback);
```

The `Promise` class has a [variety of ways](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#static_methods) to construct new promises.

```ts
type Resolve = (value: T | PromiseLike<T>) => void;
type Reject = (reason?: any) => void
interface PromiseConstructor {
    new <T>(executor: (resolve: Resolve, reject: Reject) => void): Promise<T>;
    reject<T>(reason?: any): Promise<T>;
    resolve<T>(value: T | Promise<T>): Promise<>>;
}
```

The `reject` static method creates a *rejected* promise with the provided reason. 

The `resolve` static method can take a simple value or any `PromiseLike` object. It creates either a *fulfilled* promise for the value or a promise that tracks the state of the provided `Promise` or *thenable*. 

The constructor is used when wrapping old asynchronous APIs that don't natively support promises. You provide an *executor* function which invokes the asynchronous operation. The *executor* function is passed *resolve* and *reject* callbacks by the JavaScript runtime. When the operation completes, it calls *resolve* on success or *reject* on failure. That in turn sets the state of the promise appropriately and invokes the `then` method. 

This is how you could wrap the `setTimeout` function to create a promise based alternative. 

```ts
const timeoutPromise = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
```

Many of the old callback based APIs have newer promise based replacements. For example, [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) replaces `XMLHttpRequest`.

# Microtasks

Unlike callback based APIs, promises [guarantee](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#timing) that callbacks passed to `then` are always invoked asynchronously, even if the promise is already *fulfilled*. This helps avoid many bugs by ensuring consistency of behavior. 

Promise callbacks are added to a [microtask queue](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide). Any microtasks added by the current event loop job are executed before the next job. The use of microtasks allows promises to provide consistent asynchronous behavior without introducing unnecessary delays for cases that could have been synchronous. 

# Async Functions

[Async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) and the associated `await` operator allow you to write more natural, imperative style code when working with promises. You can think of an `async` function as syntactic sugar that is transformed into native promise based code at runtime. The example below implements exactly the same logic as the native promise based version above.

```ts
(async () => {
  try {
    const result = await doSomething();
    const newResult = await doSomethingElse(result);
    const finalResult = await doThirdThing(newResult);
    console.log(`Got the final result: ${finalResult}`);
  } catch (error) {
    failureCallback(error);
  }
})();
```

You can only use the `await` operator inside an `async` function. The [Async IIFE](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/async_function#async_iife) pattern can be used to write async code at the top level. Our async sample code is wrapped inside an anonymous async function that is declared and executed immediately.

The [await operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) is used to wait for a promise or thenable and get its fulfillment value. That is, `await PromiseLike<T>` returns `T`. Behind the scenes, the runtime calls `then` with a callback that resumes execution with the remaining code in the function. If the argument to `await` is a simple value, a new resolved Promise is created for that value and then waited on.

The `try ... catch` handles rejected promises, reinforcing the equivalence between exceptions in synchronous code and rejected promises in asynchronous code.

The promise chain is [constructed dynamically](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function#description) as the code executes. This makes it easy to use loops and conditionals that can be awkward to implement with static promise chains.

```ts
  let response;
  for (let i = 0; i < NUM_RETRIES; i ++) {
    response = await fetch(url);
    if (response.status >= 500 || response.status == 429)
      await timeoutPromise(backoffAndJitterDelay(i));
    else
      break;
  }
```

Whether a function is declared `async` or not is an implementation detail. It's not part of an API contract or interface definition.

```ts
interface API {
  doSomething(): Promise<number>;
}
```

You could implement the `doSomething` method using a regular function or an `async` function. Your choice. 

# Promised you a Result

We previously looked at [error handling in TypeScript]({% link _posts/2025-04-14-typescript-error-handling.md %}). I decided to use [Rust style](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html) `Result<T,E>` types. How does that approach extend to asynchronous code?

The idea behind `Result` types is to handle expected failures explicitly, supported by the type system. A `Result<T,E>` is either in an `Ok` state with a `value T` or in an `Err` state with an `error E`. 

You often want to execute a sequence of operations, skipping the remaining operations if there's an error. Implementations of `Result`, like [NeverThrow](https://github.com/supermacro/neverthrow), provide support for chaining operations together, with errors propagated to the end of the chain. 

Does this synchronous `Result` based code look familiar?

```ts
doSomething()
  .andThen((value) => doSomethingElse(value))
  .andThen((newValue) => doThirdThing(newValue))
  .map((finalValue) => {
    console.log(`Got the final result: ${finalValue}`);
  })
  .mapErr((error) => failureCallback(error));
```

The obvious approach for asynchronous APIs is to return a `Promise<Result<T,E>>`. Expected failures are part of the promise's fulfillment value. Rejected promises, like exceptions, are only used for truly exceptional, unexpected errors. The sort that propagate to the top of the callstack where they get logged before blowing up, or restarting the failing sub-system. 

Let's try converting our example to asynchronous code based on `Promise<Result<T,E>>`.

```ts
doSomething()
  .then((result) => result.isOk() ? doSomethingElse(result.value) : err(result.error))
  .then((newResult) => newResult.isOk() ? doThirdThing(newResult.value) : err(newResult.error))
  .then((finalResult) => {
    if (finalResult.isOk())
      console.log(`Got the final result: ${finalResult.value}`);
    else
      failureCallback(finalResult.error);
  })
```

That looks messy. The problem is that the `Promise` and `Result` chaining methods don't combine well. The `Result.andThen` method expects an expression that returns a `Result` but `doSomethingElse` returns a `Promise<Result>`. You end up having to write the error propagation logic by hand. 

It looks better as an async function. You also have the ability to short circuit the remaining asynchronous operations if there's an error.

```ts
  const result = await doSomething();
  const newResult = result.isOk() ? await doSomethingElse(result.value) : err(result.error);
  const finalResult = newResult.isOk() ? await doThirdThing(newResult.value) : err(newResult.error);
  if (finalResult.isOk())
    console.log(`Got the final result: ${finalResult.value}`);
  else
    failureCallback(finalResult.error);
```

# ResultAsync

NeverThrow also provides a `ResultAsync<T,E>` class which attempts to fix some of the issues with using `Promise<Result<T,E>>`. `ResultAsync` is a wrapper around a `Promise<Result<T,E>>` that provides similar chaining methods to `Result`. Unlike `Result`, these methods combine async chaining and result chaining in a single call. 

The chaining version of our sample code looks exactly the same with asynchronous code using `ResultAsync` as it did with synchronous code using `Result`.

```ts
doSomething()
  .andThen((value) => doSomethingElse(value))
  .andThen((newValue) => doThirdThing(newValue))
  .map((finalValue) => {
    console.log(`Got the final result: ${finalValue}`);
  })
  .mapErr((error) => failureCallback(error));
```

You can mix and match asynchronous and synchronous calls with `ResultAsync` and `Result` in the same chain. `ResultAsync` is also a `PromiseLike` so you can use it in most places that expect a `Promise`, including with `await`. 

However, if you use `await` you lose most of the benefits of `ResultAsync`. You're back in a world where you handle the asynchronous completion and error propagation separately. The cleanest `async` function version of this sample is the same as it was when using `Promise<Result<T,E>>` directly.

```ts
  const result = await doSomething();
  const newResult = result.isOk() ? await doSomethingElse(result.value) : err(result.error);
  const finalResult = newResult.isOk() ? await doThirdThing(newResult.value) : err(newResult.error);
  if (finalResult.isOk())
    console.log(`Got the final result: ${finalResult.value}`);
  else
    failureCallback(finalResult.error);
```

# Implementing ResultAsync APIs

A `ResultAsync` API provides added benefits over a `Promise<Result>` API without adding constraints for the consumer. If you don't like the `ResultAsync` chaining methods you can treat it like a regular `Promise`. Unfortunately, that's not true when it comes to *implementing* a `ResultAsync` API.

It's straightforward to implement the API using `ResultAsync` chaining methods. It gets more difficult if you want to use an `async` function. An `async` function can't return a `ResultAsync`, it *must* return a native `Promise` object.

You can work around this restriction by using the Async IIFE pattern again. 

```ts
class MyAPI implements API {
  doSomething(): ResultAsync<number,APIError> {
    return new ResultAsync((async () => {
      await timeoutPromise(10);
      return ok(3);
    })())
  }
}
```

Whatever `Result` you return from your inner async function is wrapped with a `Promise` by the JavaScript runtime, which you in turn wrap in a `ResultAsync`, ending up in the same place as if you'd been able to return a `ResultAsync` directly. Just a lot uglier.

It also works if the inner async function tries to return a `ResultAsync`, but it's better that you don't. A `ResultAsync` is *thenable*, so the JavaScript runtime wraps it with a `Promise` that forwards the `then` method on. Which means you end up with a double wrapped result. A `ResultAsync` around the `Promise` created by the JavaScript runtime around a `ResultAsync` with its own inner `Promise<Result>`.

# Conclusion

I'm [going to use]({% link _posts/2025-05-26-asynchronous-event-log.md %}) `ResultAsync` for my asynchronous APIs, matching my synchronous APIs that return `Result`. Using `ResultAsync` provides additional benefits for the API consumer over using `Promise<Result>`. It's also more compact to write. 

As the API implementer, I can live with the ugliness of the Async IIFE pattern for the times when I need to use an `async` function.
