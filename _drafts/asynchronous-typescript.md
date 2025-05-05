---
title: Asynchronous TypeScript
tags: typescript
thumbnail: /assets/images/frontend/ts-logo-128.png
---

One of my main reasons for [choosing TypeScript as a language stack]({% link _posts/2023-05-15-language-stack.md %}) is that it's built on an asynchronous IO, event-driven programming model from the ground up. On the server side, idiomatic NodeJS code scales surprisingly well for a dynamic, low ceremony, fast development stack. 

I'm [about to build](/_posts/2025-05-05-infinisheet-event-log.md) my first, from scratch, public asynchronous API. I want to get it right. I need a better understanding of how asynchronous code works so that I can make the right choices.

# Callbacks

* The original way of exposing asynchronous APIs
* Variety of different styles.
* `setTimeout`
  * Simple callback
* NodeJS `fs.readFile`
  * Callback passed different values on error and success
* `XMLHttpRequest`
  * Create an `XMLHttpRequest`
  * Define the request you want to make
  * Define separate `onload` and `onerror` callbacks
  * Invoke the http request by calling `send()`

# The Event Loop

# Promises

# Microtasks

# Async Functions

# ResultAsync

* Specialization of `Promise<Result<T,E>>`
* Can be used wherever a `Promise` can, including as the return value from an async function. The JavaScript spec for async functions [explicitly supports Promise subclassing](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-newpromisecapability).
