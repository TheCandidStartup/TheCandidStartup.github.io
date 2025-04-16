---
title: InfiniSheet Error Handling
tags: infinisheet react-spreadsheet
---

[Last time]({% link _posts/2025-04-14-typescript-error-handling.md %}), we looked at general options for error handling in TypeScript. I liked [Rust style](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html) `Result<T,E>` types. 

I was left with a choice of rolling my own minimal implementation or using [neverthrow](https://github.com/supermacro/neverthrow) or [true-myth](https://true-myth.js.org/). Both `neverthrow` and `true-myth` are small, self-contained packages that follow the Rust conventions closely.

```ts
type Result<T,E> = Ok<T,E> | Err<T,E>
```

They both provide `Ok` and `Err` classes with a set of utility methods for working with results. They both provide `ok()` and `err()` convenience methods for creating instances of `Ok` and `Err`. 

If I end up writing my own, I'll do the same. 

# Spreadsheet Data

My `SpreadsheetData` [interface]({% link _posts/2024-09-30-react-spreadsheet-data-interface.md %}) currently has one method, `setCellValueAndFormat`, that allows you to edit data. [Currently]({% link _posts/2025-02-03-react-spreadsheet-edit-ready.md %}), it just returns a `boolean` for success or failure.

```ts
export interface SpreadsheetData<Snapshot> {
  setCellValueAndFormat(row: number, column: number,
    value: CellValue, format: string | undefined): boolean;
}
```

I want to add more formal error handling so that I can report meaningful error messages in the UI. I'm going to use this method as a test case. However, there's an immediate problem. There's no value to return for the success case. How do you handle that?

I could return `Error | null` but that feels backwards. The return value is "falsy" on success, which is immediately counter-intuitive. This is also the kind of ad hoc approach I'm trying to get away from.

It will be interesting to see how the two libraries handle this case. For now, I'll just return a `string` for the error case. The point is to focus on the differences between the libraries. Once I have a winner, or decide to roll my own, I can figure out what a full blown `SpreadsheetDataError` type should look like. 

# Neverthrow

I'm starting with `neverthrow`. It's the smallest library of the two and the most popular. It has 850K [npm](https://www.npmjs.com/package/neverthrow) weekly downloads, 408 dependent packages using it, 5.2K [GitHub](https://github.com/supermacro/neverthrow) stars and 49 contributors. The package is currently at version 8.2.0 and has had 63 versions released over 6 years.

There is minimal documentation, most of which is embedded in the [README](https://github.com/supermacro/neverthrow/blob/master/README.md). There's no Intellisense for the key entry points: `Result`, `Ok`, `Err`, `ok`, `err`. However, scanning through the README gave me enough to get started.

The example code for some of the utility methods showed me how to handle functions that normally return void. It turned out to be surprisingly simple. If you have a function that returns a `number` on success and a `string` on error, you'd use a `Result<number,string>`. Similarly, if the function returns `void` on success, you'd use a `Result<void,string>`.

```ts
import { Result, err } from "neverthrow";

export class EmptySpreadsheetData implements SpreadsheetData<number> {
  setCellValueAndFormat(row, column, value, format): Result<void,string> 
  {
    if (isValid(value)) {
      ...
      return ok();
    } else {
      return err("Invalid value")); 
    }
  }
}
```

Note that the `ok()` constructor needs no arguments if the success return is `void`. In most cases, TypeScript can infer the type parameters for `ok` and `err`. 

Replacing the `boolean` return with `Result<void,string>` increased the bundle size for my spreadsheet sample app by 7KB. There are lots of convenience methods that support inter-operation between `Result` and `ResultAsync`. The end result is that the whole of `neverthrow` gets pulled in if you use any part of it. It's a good job it's not that big.

The next question is how to make `neverthrow` feel like a natural part of [InfiniSheet]({% link _topics/infinisheet.md %}) rather than something external grafted on. The first step is to re-export the main entry points from `infinisheet-types`. Then clients can import `Result` at the same time they import `SpreadsheetData`. 

I realized that I could provide my own documentation/intellisense for the main entry points by defining type aliases and wrapper functions. I created my own `Result.ts` source file in `infinisheet-types` and restricted direct access to `neverthrow` to that file. It also means I can change implementation in future with minimal impact.


```ts
import type { Ok as neverthrow_Ok, Err as neverthrow_Err } from "neverthrow";
import { err as neverthrow_err, ok as neverthrow_ok } from "neverthrow";

/** An `Ok` instance is the *successful* variant of the {@link Result} type */ 
export interface Ok<T,E> extends neverthrow_Ok<T,E> {}

/** An `Err` instance is the failure variant of the {@link Result} type */
export interface Err<T,E> extends neverthrow_Err<T,E> {}

/** A `Result` represents success ({@link Ok}) or failure ({@link Err}) */
export type Result<T,E> = Ok<T,E> | Err<T,E>;

/** Create an instance of {@link Ok} */
export function ok<T, E = never>(value: T): Ok<T, E>
export function ok<_T extends void = void, E = never>(value: void): Ok<void, E>
export function ok<T, E = never>(value: T): Ok<T, E> {
  return neverthrow_ok<T,E>(value); 
}

/** Create an instance of {@link Err} */
export function err<T = never, E extends string = string>(err: E): Err<T, E>
export function err<T = never, E = unknown>(err: E): Err<T, E>
export function err<T = never, _E extends void = void>(err: void): Err<T, void>
export function err<T = never, E = unknown>(err: E): Err<T, E> {
  return neverthrow_err<T,E>(err)
}
```

The magic of TypeScript structural typing means that the `neverthrow` original types and my wrapper types interoperate nicely. 

It turns out that `neverthrow` does have decent embedded JSDoc comments for the `Ok` and `Err` utility methods. I tweaked my [TypeDoc]({% link _posts/2024-08-05-bootstrapping-typedoc.md %}) `externalPattern` [configuration](https://typedoc.org/documents/Options.Input.html#externalpattern) so that we can pull in the `neverthrow` documentation for methods from the inherited `Ok` and `Err` classes, while continuing to exclude React.

{% include candid-image.html src="/assets/images/infinisheet/neverthrow-ok-docs.png" alt="NeverThrow Ok integrated into InfiniSheet docs" %}

# True Myth

`true-myth` is a couple of years older than `neverthrow`. It's currently on version 8.5.3 with 77 released versions over 8 years. However, it hasn't gained as much traction as `neverthrow`. It has 300K [npm](https://www.npmjs.com/package/true-myth) weekly downloads, only 56 dependent packages using it, 1.1K [GitHub](https://github.com/true-myth/true-myth) stars and 22 contributors. 

In contrast to `neverthrow`, the documentation is excellent. The docs are generated from JSDoc comments using TypeDoc, with full Intellisense in VS Code. 

As with `neverthrow`, I declared the return type as `Result<void,string>`. That seemed fine, with no resulting type check errors. Returning an error works as expected, `return err("Invalid value")`. However, `return ok()` results in the incomprehensible error `"type Result<Unit,never> is not assignable to type Result<void,string>"`. After some experimentation I got it to work by using `return ok(undefined)` but it's hardly intuitive. 

*Unit* is a common concept in functional languages. All functions return a value, so how do you type a function that has nothing to return? You return `Unit`. `Unit` is a type with a single valid value, also called `Unit`. Similarly, `boolean` is a type with two valid values, `true` and `false`.

Returning a type with a single valid value tells you nothing interesting. Which is why classic functional languages use returning `Unit` as a convention for functions that have nothing meaningful to return. It avoids the need to add a special case like `void` to the language.

True Myth would really like you to use `Result<Unit,string>` as your result type. The `ok()` convenience method is hardwired to return a `Result<Unit,never>` when called with no arguments. 

`Unit` is a separate module, so if you use this style you need two separate import statements as well as the two separate types.

```ts
import { Result, ok, err} from 'true-myth/result`
import { Unit } from `true-myth/unit`
```

The separation into modules does mean that you only pay for what you use. Adding `true-myth` only increased the bundle size for my Spreadsheet sample app by 2KB. Using `Result` doesn't pull in True Myth's equivalent of `ResultAsync`. The down side is slightly more verbose code when you need to use multiple `true-myth` modules.

As with `neverthrow`, I can use a wrapper to re-export the required types from `infinisheet-types`. However, you're still adding conceptual complexity. I'd need to explain what this wacky `Unit` thing is to someone who just wants to use a React spreadsheet component. 

I could wrap `ok()` so that it returns a Result<void,string>. However, it feels like I'm going against the grain. The documentation is full of references to `Unit` and other functional concepts. True Myth really wants to convert you to the joys of functional programming by reinventing core TypeScript features.

# Rolling my Own

If I rolled my own implementation, it would end up being a subset of `neverthrow`. At this point, I can't see any point in doing that. If I need to do it in future, I can copy and paste whatever I want to take from `neverthrow` into `Result.ts`.

# Best of Both

So, I've decided to go with `neverthrow`. The only real downside is the minimal documentation. Wrapping and re-exporting the main entry points gives me a chance of addressing that. 

I was wondering where to start with writing my own documentation when I realized that the `true-myth` documentation applied equally well to `neverthrow`. After a few minor tweaks to remove mentions of `Unit`.

{% include candid-image.html src="/assets/images/infinisheet/neverthrow-ok-truemyth-docs.png" alt="NeverThrow ok using True Myth doc comments" %}

# Next Time

All that remains is to use this in anger. I need to add a proper `SpreadsheetDataError` type, add some failure cases to my sample `SpreadsheetData` implementations and then handle failure gracefully in my React spreadsheet component.
