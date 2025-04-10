---
title: InfiniSheet Error Handling
tags: infinisheet react-spreadsheet
---

wise words

* Last time looked at general options for error handling in TypeScript
* Liked Rust style `Result<T,E>` types
* Choice of rolling my own minimal implementation or using `neverthrow` or `true-myth`
* Both `neverthrow` and `true-myth` follow the Rust conventions closely.

```ts
type Result<T,E> = Ok<T,E> | Err<T,E>
```

They both provide `Ok` and `Err` classes with a standard set of utility methods for combining results. They both provide `ok()` and `err()` convenience methods for creating instances of `Ok` and `Err`. 

If I end up writing my own, I'll do the same. 

# Spreadsheet Data

* `setCellValueAndFormat` method on `SpreadsheetData` interface currently just returns a bool for success or failure

```ts
export interface SpreadsheetData<Snapshot> {
  setCellValueAndFormat(row: number, column: number, value: CellValue, format: string | undefined): bool;
}
```

* Want to add more formal error handling so that I can report meaningful error messages in the UI. 
* Use as a test case
* Immediate problem. There's no value to return for the success case. How to handle that?
* Could return `Error | null` but feels backwards. The return value is "falsy" on success. Also kind of ad hoc approach I'm trying to get away from. 
* Interesting to see how the two libraries handle this case. For now, just return a `string` for the error case. Focus on the differences between the libraries. Once I have a winner can figure out what a full blown `SpreadsheetDataError` type should look like. 

# Neverthrow

* Version 8.2.0, 63 versions over 6 years
* 112 KB unpacked size including es and cjs bundled distributions. No source or maps.
* 408 dependents
* 800K npm weekly downloads
* 5k GitHub stars
* 49 contributors
* Increases size of my bundled Spreadsheet sample app by 7KB. Lots of convenience methods for inter-operating between `Result` and `ResultAsync`. Whole thing gets pulled in when you use `Result`.
* Minimal documentation in README. JSDoc comments/intellisense only on utility methods.
* Works smoothly, use `Result<void,string>` for a function that would normally return void but now wants to return a `string` when there's an error.

```ts
import { Result, err } from "./Result";

export class EmptySpreadsheetData implements SpreadsheetData<number> {
  setCellValueAndFormat(...args): Result<void,string> 
  { return err("Not implemented")); }
}
```

* No documentation/intellisense for key entry points: `Result`, `Ok`, `Err`, `ok`, `err`.
* Does have decent documentation for all the helper methods you can use to combine results.
* Wrap by importing and re-exporting my own type aliases and wrapper functions
* All direct access to `neverthrow` isolated in `Result.ts` source file in `infinisheet-types`. Means I can change implementation in future with minimal impact.
* Can add my own documentation to entry points, including links to `neverthrow` site.

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

* Magic of TypeScript structural typing means original and wrapper types interoperate nicely
* Tweaked TypeDoc `externalPattern` configuration so that we can pull in `neverthrow` documentation for methods on inherited `Ok` and `Err` classes

# True Myth

* Version 8.5.2, 77 versions over 8 years
* 1 MB unpacked size including source, es and cjs unbundled distributions with source and type maps
* 56 dependents
* 300K npm weekly downloads
* 1k GitHub stars
* 22 contributors
* Increases size of my bundled Spreadsheet sample app by 2KB. Each feature is defined as a separate module. Using `Result` doesn't pull in True Myth's equivalent of `ResultAsync`. 
* TypeDoc documentation, excellent Intellisense

* Can declare return as `Result<void,string>` without any typecheck errors. Returning an error works as expected, `return err("Not implemented")`. However, `return ok()` results in the incomprehensible error `type Result<Unit,never> is not assignable to type Result<void,string>`. You can get it to work by using `return ok(undefined)` but it's not intuitive.
* Unit is a common concept in functional languages. All functions return a value so how do you type a function that has nothing to return? You return `Unit`. `Unit` is a type with a single valid value, also called `Unit`.
* Similarly `boolean` is a type with two valid values, `true` and `false`.
* Returning a type with a single valid value tells you nothing interesting. Which is why classic functional languages use returning `Unit` as a convention for functions that have nothing meaningful to return. It avoids the need to add a special case like `void` to the language.
* True Myth would really like you to use `Result<Unit,string>` as your result type. The `ok()` convenience method is hardwired to return a `Result<Unit,never>` when called with no arguments.
* `Unit` is a separate module so if you use this style you need two separate import statements as well as the two separate types

```ts
import { Result, ok, err} from 'true-myth/result`
import { Unit } from `true-myth/unit`
```

* I can re-export all these from `infinisheet-types` to make life simpler for my clients. However, you're still adding conceptual complexity. Need to explain what this wacky `Unit` thing is to someone who just wants to use a React spreadsheet component.
* Can use same *wrapper* approach we used with `neverthrow` to export our own version of `ok()` which forwards on to `true-myth` while creating `Result<void,never>` when given no arguments.
* Can't easily get away from all the references to `Unit` in the documentation.
