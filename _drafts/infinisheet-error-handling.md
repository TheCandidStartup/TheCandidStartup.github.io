---
title: InfiniSheet Error Handling
tags: infinisheet react-spreadsheet
---

wise words

* Last time looked at general options for error handling in TypeScript
* Liked Rust style `Result<T,E>` types
* Choice of rolling my own minimal implementation or using `neverthrow` or `true-myth`

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

* Works smoothly, use `Result<void,string>` for a function that would normally return void but now wants to return a `string` when there's an error.
* No documentation for key entry points: `Result`, `Ok`, `Err`, `ok`, `err`.
* Does have decent documentation for all the helper methods you can use to combine results.
* Wrap by importing and re-exporting my own type aliases and wrapper functions
* Can add my own documentation to entry points, including links to `neverthrow` site.
* Magic of TypeScript structural typing means original and wrapper types interoperate nicely
* Tweaked TypeDoc configuration so that we can pull in `neverthrow` documentation for methods on inherited `Ok` and `Err` classes

# True Myth

* Version 8.5.2, 77 versions over 8 years
* 1 MB unpacked size including source, es and cjs unbundled distributions with source and type maps
* Each feature is accessible as a separate es6 module
* 56 dependents
* 300K npm weekly downloads
* 1k GitHub stars
* 22 contributors
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
* Ironically no documentation for `Result` type but can wrap to add our own.
* Can't easily get away from all the references to `Unit` in the documentation.
* Build spreadsheet sample app, bundled for production. Bundle size increases by 2KB for this minimal use of `true-myth`.
