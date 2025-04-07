---
title: TypeScript Error Handling
tags: typescript
thumbnail: /assets/images/frontend/ts-logo-128.png
---

wise words
* All real world code needs error handling
* Like any common concern, code is easier to understand and maintain if you have a consistent approach
* The TypeScript language has no opinion on how you should handle errors - try searching the [handbook](https://www.typescriptlang.org/docs/handbook/intro.html) for "error"
* We'll have to look elsewhere for inspiration

# JavaScript Style: Exceptions

* TypeScript is JavaScript with types, so what does JavaScript say about error handling?
* Provides exceptions as core primitive for error handling with the `Error` base class to represent errors
* Plenty of [good practice](https://medium.com/with-orus/the-5-commandments-of-clean-error-handling-in-typescript-93a9cbdf1af5) for use of exceptions, with [ESLint rules](https://typescript-eslint.io/rules/only-throw-error) to enforce it.
* I like these [five commandments](https://medium.com/with-orus/the-5-commandments-of-clean-error-handling-in-typescript-93a9cbdf1af5)
* The most interesting being number 5, "Don't throw exceptions for problems that are expected to happen"
* Exceptions are best suited for truly exceptional situations. Programmer errors, assertion failures, impossible situations. Situations where you'd like to have access to a call stack. Situations where you log the problem and then either blow up or restart the failing sub-system.
* Not when the user types some invalid input into a text box, or when a call to a REST API fails. 
* Exceptions are a clumsy mechanism for cases where errors need to be handled immediately.
* The killer in a TypeScript context is that exceptions are not represented in the type system. You can't rely on typing to ensure that exceptions are handled. 
* What should we do instead for expected problems?
* Good [overview](https://meowbark.dev/Better-error-handling) of alternatives

# Ad Hoc

* Easy to return arbitrarily complex types, so do whatever makes sense for each function.
* My approach to `setCellValueAndFormat`. Couldn't be bothered to think about it so return a `boolean`. Change it to something richer later.
* Lack of consistency
* What do other languages do?

# Go Style: Return Tuple

* Golang is closest to ad hoc style. It uses a common convention where functions return a tuple consisting of the normal return value and a nullable error value. In TypeScript terms this is `[T, E | null]`. Calling code is expected to check whether there's a non-null error value before using the return value.
* You can use this convention in TypeScript without any other tooling or library. Although, there are [packages](https://github.com/thelinuxlich/go-go-try) that provide additional utilities for use with this pattern. 
* This approach doesn't sit right with me. There's no type error if you ignore the error value and use the return value regardless. There's the awkward question of what the return value should be if there is an error. If there's no natural sentinel value you end up with `[T | null, E | null]`. The only valid values are `[T, null]` and `[null, E]` but there's nothing in the types to tell you that.

# Functional Style: Either Convention

Languages with a functional heritage, like Scala and Haskell, have a standard library of types and functions. The [`Either`](https://hackage.haskell.org/package/base-4.21.0.0/docs/Data-Either.html) type is commonly used for error handling. `Either` is a generic type that represents values with two possibilities, called *Left* and *Right*. By convention, *Left* is used to hold and error value and *Right* is used to hold the normal return value. 

This approach is fully type safe. Before you can access either value, you need to check whether the `Either` is *Left* or *Right*. You can use the standard library functions to chain operations together so that the end result is a combination of all the return values, or the first error if any step fails.

This reinforces all my prejudices against classic functional programming. The original functional programming languages were developed at a time when computers had limited resources. They focused on providing a minimal, mathematically complete foundation. Many common idioms that would be separate features in other languages were simply conventions in how you used the foundation.

The result is minimal, elegant code that is completely unreadable unless you're fully immersed in the standard conventions.

# Rust Style: Result Type

Rust has a [functionally identical implementation](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html) that is dedicated for error handling. Instead of `Either` with `Left` and `Right` variants, Rust has `Result` with `Ok` and `Err` variants.

It's simple enough to roll your own minimal `Result` type in TypeScript.

```ts
type Result<T, E> = { success: true, result: T } | { success: false, error: E }
```

As with the functional `Either` convention, this approach is fully type safe. You have to check `success` before accessing either `result` or `error`, with TypeScript narrowing allowing direct access after you've checked for success.

```ts
if (result.success) {
  doSomething(result.result);
} else {
  handleError(result.error);
}
```

# Library Support

The bare bones approach is usable, but you'll soon find yourself wanting nice constructors for `ok` and `err` values, utility functions for working with results from multiple operations, async support and so on. 

Fortunately, both the Rust and functional styles have their advocates in the TypeScript community, with plenty of third party packages providing library support.

At one end of the scale you have massive libraries like [Effect](https://effect.website/) and [ts-fp](https://gcanti.github.io/fp-ts/). These libraries reproduce the experience of working with a classic typed functional language in TypeScript. For better or worse. 
* Some people love functional programming, others hate it. Both agree that using it will change your life.
* I'm writing a library. I don't want to change my clients lives. I want to make it as easy to adopt my library as possible, minimizing the choices I force onto them.

At the other end of the scale, you have a library like [neverthrow](https://github.com/supermacro/neverthrow). It provides you with a `Result` type, and an async equivalent, `ResultAsync`. The types includes some methods for working with results from multiple operations but that's about it. No shift in thinking required. You can use the Result in a simplistic imperative style like the example above if you want.

In the middle you have libraries like [true-myth](https://true-myth.js.org/) that act as a gateway into functional programming. You can use it just like `neverthrow` if you want. However, it also provides a pure functional equivalent of the functionality including such classic functional tricks as [auto-curried functions](https://v4.chriskrycho.com/2017/collection-last-auto-curried-functions.html). It goes beyond error handling to include a `Maybe` type too. 

