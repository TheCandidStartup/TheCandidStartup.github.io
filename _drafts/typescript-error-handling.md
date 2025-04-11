---
title: TypeScript Error Handling
tags: typescript
thumbnail: /assets/images/frontend/ts-logo-128.png
---

All real world code needs error handling. Like any common concern, code is easier to understand and maintain if you have a consistent approach. 

The TypeScript language has no opinion on how you should handle errors. Try searching the [handbook](https://www.typescriptlang.org/docs/handbook/intro.html) for "error". You won't find much.

We'll have to look elsewhere for inspiration.

# JavaScript: Exceptions

TypeScript is JavaScript with types, so what does JavaScript say about error handling? JavaScript provides [exceptions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling#exception_handling_statements) as the core primitive for error handling. There's a family of built-in classes derived from [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) that you can use to represent errors.

There are plenty of examples of [good practice](https://engineering.udacity.com/handling-errors-like-a-pro-in-typescript-d7a314ad4991) for use of exceptions, with [ESLint rules](https://typescript-eslint.io/rules/only-throw-error) to enforce them. I particularly like these [five commandments](https://medium.com/with-orus/the-5-commandments-of-clean-error-handling-in-typescript-93a9cbdf1af5). The one that resonates with me most is number 5. 

> Don't throw exceptions for problems that are expected to happen

This matches my experience with other languages that provide exceptions. Exceptions are best suited for truly exceptional situations. Programmer errors, assertion failures, impossible states. Situations where you'd like to have access to a call stack. Situations where you log the problem and then either blow up or restart the failing sub-system. Not when the user types some invalid input into a text box, or when a call to a REST API fails.

Exceptions are a clumsy mechanism for cases where errors need to be handled immediately. The killer in a TypeScript context is that exceptions are not represented in the type system. You can't rely on typing to ensure that exceptions are handled. 

What can you do instead? This is a good [overview](https://meowbark.dev/Better-error-handling) of some alternatives.

# Ad Hoc

TypeScript makes it easy to return arbitrarily complex types, so do whatever makes sense for each function. It's easy to get started, just do whatever feels right. 

The problem, of course, is a lack of consistency. Similar patterns with slight differences repeated throughout the code base.

What do other languages do?

# Go: Return Tuple

[Golang](https://go.dev/) is closest to the ad hoc style. It uses a [common convention](https://go.dev/blog/error-handling-and-go) where functions return a tuple consisting of the normal return value and a nullable error value. In TypeScript terms this is `[T, E | null]`. Calling code is expected to check whether there's a non-null error value before using the return value.

You can use this convention in TypeScript without any other tooling or library. Although, there are [packages](https://github.com/thelinuxlich/go-go-try) that provide additional utilities for use with this pattern. 

Unfortunately, this approach doesn't sit right with me. There's no type error if you ignore the error value and use the return value regardless. There's the awkward question of what the return value should be if there is an error. If there's no natural sentinel value you end up with `[T | null, E | null]`. The only valid values are `[T, null]` and `[null, E]` but there's nothing in the types to tell you that.

# Functional Languages: Either Convention

Languages with a functional heritage, like [Scala](https://www.scala-lang.org/) and [Haskell](https://www.haskell.org/), have a standard library of types and functions. The [`Either`](https://hackage.haskell.org/package/base-4.21.0.0/docs/Data-Either.html) type is commonly used for error handling. `Either` is a generic type that represents values with two possibilities, called *Left* and *Right*. By convention, *Left* is used to hold an error value, and *Right* is used to hold the normal return value. 

This approach is fully type safe. Before you can access either value, you need to check whether the `Either` is *Left* or *Right*. You can use the standard library functions to chain operations together so that the end result is a combination of all the return values, or the first error if any step fails.

The use of `Either` reinforces all my prejudices against classic functional programming. The original functional programming languages were developed at a time when computers had limited resources. They focused on providing a minimal, mathematically complete foundation. Many common idioms that would be separate features in other languages were simply conventions in how you used the foundation.

The result is minimal, elegant code that is completely unreadable unless you're fully immersed in the standard conventions.

# Rust: Result Type

[Rust](https://www.rust-lang.org/) has a [functionally identical implementation](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html) that is dedicated for error handling. Instead of `Either` with `Left` and `Right` variants, Rust has `Result` with `Ok` and `Err` variants.

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

This one I like.

# Library Support

The bare bones approach is usable, but you'll soon find yourself wanting nice constructors for `Ok` and `Err` values, utility functions for working with results from multiple operations, async support and so on. 

Fortunately, both the Rust and functional styles have their advocates in the TypeScript community, with plenty of third party packages providing library support.

At one end of the scale you have massive libraries like [Effect](https://effect.website/) and [ts-fp](https://gcanti.github.io/fp-ts/). These libraries reproduce the experience of working with a classic functional language in TypeScript. For better or worse. 

Some people love functional programming, others hate it. Both agree that using it will change your life. However, I'm writing a library. I don't want to change my clients lives. I want to make it as easy to adopt my library as possible, minimizing the choices I force onto them.

At the other end of the scale, you have a library like [neverthrow](https://github.com/supermacro/neverthrow). It provides you with a `Result` type, and an async equivalent, `ResultAsync`. The types include some methods for working with results from multiple operations but that's about it. No shift in thinking required. You can use `Result` in a simplistic imperative style, like the ad hoc example, if you want.

In the middle you have libraries like [true-myth](https://true-myth.js.org/) that act as a gateway into functional programming. You can use `true-myth` just like `neverthrow` if you want. However, it also supports a more functional style including such classic tricks as [auto-curried functions](https://v4.chriskrycho.com/2017/collection-last-auto-curried-functions.html). It goes beyond error handling to include a `Maybe` type too. 

# Next Time

I'm torn between creating my own `Result` type and using `neverthrow` or `true-myth`. If I write my own it will fit cleanly with the rest of my code. I won't have to worry about pulling in a stack of extra runtime dependencies.

On the other hand, what a waste of time. Why write my own naive, incomplete version when there are existing battle tested implementations to choose from? Both `neverthrow` and `true-myth` are small packages with zero external dependencies. Maybe I could integrate one of them and have it feel natural.

There's only one way to decide. Let's drag race them.
