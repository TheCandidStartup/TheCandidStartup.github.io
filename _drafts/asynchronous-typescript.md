---
title: Asynchronous TypeScript
tags: typescript
thumbnail: /assets/images/frontend/ts-logo-128.png
---

One of my main reasons for [choosing TypeScript as a language stack]({% link _posts/2023-05-15-language-stack.md %}) is that it's built on an asynchronous IO, event-driven programming model from the ground up. On the server side, idiomatic NodeJS code scales surprisingly well for a dynamic, low ceremony, fast development stack. 

I'm [about to build](/_posts/2025-05-05-infinisheet-event-log.md) my first, from scratch, public asynchronous API. I want to get it right. I need a better understanding of how asynchronous code works so that I can make the right choices.

# Callbacks

* The original way of exposing asynchronous APIs
* Part of the JavaScript runtime environment, e.g. browser or NodeJS.
* Typings for use with TypeScript are straightforward
* Variety of different styles.
* `setTimeout`
  * Simple callback
* NodeJS `fs.readFile`
  * Callback passed different values on error and success
* `XMLHttpRequest`
  * Create an `XMLHttpRequest`
  * Configure the request you want to make, e.g. by adding request headers
  * Define separate `onload` and `onerror` callbacks
  * Invoke the http request by calling `send()`
* Synchronous and asynchronous errors handled differently
  * Errors when configuring `XMLHttpRequest` throw JavaScript `Error` objects
  * Errors executing the request asynchronously are reported via callback. It's up to you if you want to throw an `Error` in response.
* Not all callback based APIs are asynchronous. Many, such as [Array.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach) are completely synchronous. Some APIs invoke the callback synchronously if data is already available and asynchronously if not. This can make code very [difficult to reason about](https://blog.izs.me/2013/08/designing-apis-for-asynchrony/).
* Invoking a sequence of asynchronous operations can easily lead to [callback hell](http://callbackhell.com/).

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

[Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) were added to JavaScript with [ES2015](https://developers.google.com/web/shows/ttt/series-2/es2015). A `Promise` is an object representing the eventual complete or failure of an asynchronous operation. 

You call an asynchronous API and it returns a `Promise`. Instead of passing callbacks to the API, you attach them to the promise by calling the `then` method. Promises replace the chaotic variety of callback based APIs with a common way of interacting with an asynchronous API. 

```ts
type OnFulfilled<T,TResult> = (value: T) => TResult | Promise<TResult>;
type OnRejected<TResult2> = (reason: any) => TResult | Promise<TResult>;

interface Promise<T> {
    then<TResult1, TResult2>(onfulfilled?: OnFulfilled<T,TResult1>, 
      onrejected?: OnRejected<T,TResult2>): Promise<TResult1 | TResult2>;
}
```

This is a simplified version of the typing for the `Promise` interface. The interface is generic on type `T`, which is the value returned on successful completion of the asynchronous operation. The `then` method takes two optional arguments, `onfulfilled` and `onrejected`. If the promise is successfully *fulfilled*, `OnFulfilled` is called with the completion value . If the promise is *rejected*, `OnRejected` is called with the reason for the error. 

Note the lack of strong typing for errors. This is because promises were designed to match the JavaScript exception based error handling model. Any errors thrown by the underlying asynchronous operation are caught and passed as the reason to `onrejected`. Exceptions are not represented in the type system, so rejection reasons can literally be anything. 

Only one of the callbacks will be invoked. If it returns a `Promise`, that becomes the return value from the call to `then`, otherwise the result is wrapped in a new `Promise` which is already either *fulfilled* or *rejected* depending on which callback was invoked. There is special case support for [thenables](https://masteringjs.io/tutorials/fundamentals/thenable), which are objects that are compatible with the `Promise` interface without being instances of the runtime `Promise` class.

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
type Resolve = (value: T | Promise<T>) => void;
type Reject = (reason?: any) => void
interface PromiseConstructor {
    new <T>(executor: (resolve: Resolve, reject: Reject) => void): Promise<T>;
    reject<T>(reason?: any): Promise<T>;
    resolve<T>(value: T | Promise<T>): Promise<>>;
}
```

The `reject` static method creates a *rejected* promise with the provided reason. 

The `resolve` static method can take a simple value or an object compatible with the `Promise` interface. It creates either a *fulfilled* promise for the value or a promise that tracks the state of the provided `Promise` or *thenable*. 

The constructor is used when wrapping old asynchronous APIs that don't natively support promises. You provide an *executor* function which invokes the asynchronous operation. The *executor* function is passed *resolve* and *reject* callbacks by the JavaScript runtime. When the operation completes, it calls *resolve* on success or *reject* on failure. That in turn sets the state of the promise appropriately and invokes the `then` method. 

This is how you could wrap the `setTimeout` function to create a promise based alternative. 

```ts
const timeoutPromise = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
```

Many of the old callback based APIs have newer promise based replacements. For example, [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) replaces `XMLHttpRequest`.

# Microtasks

Unlike callback based APIs, promises [guarantee](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#timing) that callbacks passed to `then` are always invoked asynchronously, even if the promise is already *fulfilled*. This helps avoid many bugs by ensuring consistency of behavior. 

Promise callbacks are added to a [microtask queue](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide). Any microtasks added by the current event loop job are executed before the next job. The use of microtasks allows promised to provide consistent asynchronous behavior without introducing unnecessary delays for cases that could have been synchronous. 

# Async Functions

```ts
async function foo() {
  try {
    const result = await doSomething();
    const newResult = await doSomethingElse(result);
    const finalResult = await doThirdThing(newResult);
    console.log(`Got the final result: ${finalResult}`);
  } catch (error) {
    failureCallback(error);
  }
}
```

# ResultAsync

* Specialization of `Promise<Result<T,E>>`
* Can be used wherever a `Promise` can, including as the return value from an async function. The JavaScript spec for async functions [explicitly supports Promise subclassing](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-newpromisecapability).
