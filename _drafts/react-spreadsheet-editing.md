---
title: >
  React Spreadsheet: Editable Spreadsheet Data
tags: react-spreadsheet
thumbnail: /assets/images/react-spreadsheet/name-formula-layout.png
---

wise words

# Simple Spreadsheet Data

{% include candid-image.html src="/assets/images/infinisheet/module-architecture.svg" alt="InfiniSheet Architecture" %}

* New package. Reference implementation of `SpreadsheetData`.
* Can be used for mocks, comparing behavior with optimized implementation, sample code.
* Most importantly helps validate that the interface makes sense.
* Code should be as simple and straightforward as possible. No attempt at optimization.
* Start with `EmptySpreadsheetData`, implement `setCellValueAndFormat` and then see what has to happen to the rest to make it work.

# Snapshot Semantics

* Snapshot semantics used in `SpreadsheetData` come from React `useSyncExternalStore` hook
* Intent is that you can read a consistent set of data from an external data source that is continuously changing
* Ask for a snapshot and then read data in the context of that snapshot
* Key requirements are
  * If nothing changes, successive calls to `getSnapshot` must return the same value (compared using `Object.is`)
  * If something changes, values read using an existing snapshot must not change
  * If something changes, the next call to `getSnapshot` must return a different value
* It's not clear how long a snapshot must continue to be valid. Obviously, until React stops using it, but when is that? And can you rely on it?
* React calls `getSnapshot` to see if anything has changed since last snapshot and schedule a render if needed. The render will use the same snapshot throughout, retrieving data from the store. 
* Hypothesis: Snapshot must remain valid until data is retrieved from the store using a more recent snapshot
* May not work if the same external store is used by multiple React components unless you make sure to hoist store to top level
* For reference implementation, simplest and most obviously correct approach is for snapshot to be a literal snapshot - a self contained copy of the data
* Can't copy when `getSnapshot` is called as has to return same object if nothing changed. Have to do it on change.
* Solution is to use an immutable data structure and return the current value whenever `getSnapshot` called.
* [React documentation](https://react.dev/reference/react/useSyncExternalStore#subscribing-to-an-external-store) has a simple example, `todoStore.js`, which does exactly that. I used it as a starting point.

```ts
interface CellContent {
  value: CellValue;
  format: string|undefined;
}

interface SimpleSnapshot {
  values: Record<RowColRef,CellContent>;
  rowCount: number;
  colCount: number;
}

export class SimpleSpreadsheetData implements SpreadsheetData<SimpleSnapshot> {
  constructor () {
    this.#content = {
      values: {},
      rowCount: 0,
      colCount: 0
    }
  }

  #content: SimpleSnapshot;
  }
```

* The spreadsheet values are stored as a simple map from cell name to cell content. I keep track of the current extent of the data separately so that I don't have to search through the whole thing to work out how big it is. I use a `Record` rather than a `Map` as it supports spread syntax, making it easy to implement `setCellValueAndFormat` in an immutable way.

```ts
setCellValueAndFormat(row: number, column: number, value: CellValue, format: string | undefined): boolean {
  const curr = this.#content;
  const ref = rowColCoordsToRef(row, column);

  this.#content = {
    values: { ...curr.values, [ref]: { value, format }},
    rowCount: Math.max(curr.rowCount, row+1),
    colCount: Math.max(curr.colCount, column+1)
  }

  return true;
}
```

{% capture bb_url %}{% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}{% endcapture %}
* Yes, this is horribly inefficient, but this is a reference implementation. The point is to be simple and obviously correct. Efficiency can come later with a real [event sourced]({{ bb_url | append: "#event-sourcing" }}) implementation.
* The getters are simple to implement. Just lookup whatever is needed in the snapshot passed in.

# Subscribe Semantics

* The [React useSyncExternalStore documentation](https://react.dev/reference/react/useSyncExternalStore#subscribing-to-an-external-store) also shows how to implement `subscribe`.

```ts
export class SimpleSpreadsheetData implements SpreadsheetData<SimpleSnapshot> {
  constructor () {
    this.#listeners = [];
  }

  subscribe(onDataChange: () => void): () => void {
    this.#listeners = [...this.#listeners, onDataChange];
    return () => {
      this.#listeners = this.#listeners.filter(l => l !== onDataChange);
    }
  }

  #notifyListeners() {
    for (const listener of this.#listeners)
      listener();
  }

  #listeners: (() => void)[];
}
```

* We maintain an array of listeners and call `#notifyListeners` on any change. The `subscribe` function returns an unsubscribe lambda that removes the corresponding listener from the array.

# Hiding Implementation Details

* I want to hide the details of how `SimpleSnapshot` is implemented. Callers don't need to know anything about the internal structure. I want to be free to change the implementation without it being a breaking change for the API.
* My initial attempt was to not export the `SimpleSnapshot` type.
* Doesn't work as I expected. The type is still copied into the built `.d.ts` typing file. Consuming code can see the structure of `SimpleSnapshot` in VS Code intellisense and access data directly. You can't explicitly import the type, but you can still make use of it.
* Also get errors from API Extractor because I haven't exported the type. 
* Next thought was to define `SimpleSnapshot` as an alias for `unknown` in the API and then cast to the actual internal implementation. Problem with that is that everything is assignable to `unknown`, so caller could pass anything in as a snapshot without triggering a typing error.
* How about using an empty `interface` and having the internal implementation extend from that? Problem is that TypeScript uses [structural typing](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html#structural-type-system). I can declare `interface SimpleSnapshot {}` but the API would accept anything structurally compatible, which is [actually anything](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html#empty-types) apart from `null` or `undefined`.

# Nominal Typing

* The standard solution is to define two separate types, one for public use and one for internal use. The public type is defined in such a way that it won't be structurally compatible with anything that might be passed as a snapshot by accident. Ideally you want a type that is considered different from any type with a different name. This is an example of [nominal typing](https://basarat.gitbook.io/typescript/main-1/nominaltyping#nominal-typing). 
* Typescript doesn't directly support nominal typing but there [are](https://basarat.gitbook.io/typescript/main-1/nominaltyping#using-literal-types) [several](https://basarat.gitbook.io/typescript/main-1/nominaltyping#using-enums) [common](https://basarat.gitbook.io/typescript/main-1/nominaltyping#using-interfaces) [patterns](https://github.com/kourge/ts-brand) used to get a similar effect. 
* They all resolve around adding an unused *brand* property with a type that is highly unlikely to match. This process is known as [type branding](https://www.learningtypescript.com/articles/branded-types). The pattern I went with uses a string enum as the type of the brand. Non-empty string enums are unusual as they are actually nominally typed in TypeScript. Two enums with identical values are treated as separate types.

```ts
/** @internal */
export enum _SimpleSnapshotBrand { _DO_NOT_USE="" };

export interface SimpleSnapshot {
  /** @internal */
  _brand: _SimpleSnapshotBrand;
}
```

* Passing anything that isn't a snapshot returned by `SimpleSpreadsheetData` will result in a type error, unless you forcibly cast with `as unknown as SimpleSnapshot` or go to the lengths of importing `SimpleSnapshotBrand` and pass in `{ _brand: SimpleShotBrand._DO_NOT_USE }`. Neither is happening accidentally. 
* Want to exclude all the branding stuff from API documentation. Couldn't get the @hidden or @ignore tags to work with TypeDoc. Any attempt to use reported as "unknown block tag". No reported issues, lots of stuff suggesting these tags should work.
* Got it to work by using @internal tag and then configuring TypeDoc to exclude things tagged as internal.
* The downside is that the implementation in `SimpleSpreadsheetData.ts` needs to explicitly cast between `SimpleSnapshot` and `SimpleSnapshotContent` on the API boundary. To make it less ugly I added a couple of helpers.

```ts
function asContent(snapshot: SimpleSnapshot) {
  return snapshot as unknown as SimpleSnapshotContent;
}

function asSnapshot(snapshot: SimpleSnapshotContent) {
  return snapshot as unknown as SimpleSnapshot;
}
```

# More Type Theory

* Let's try it out. I replaced `EmptySpreadsheetData` with `SimpleSpreadsheetData` in my storybook. Spreadsheet still starts as empty but now it should save any changes I make.
* Immediately ran into a type error. All my other data sources used `number` as a snapshot which means I'm using a `VirtualSpreadsheet<number>` as my spreadsheet component. It won't work with a `SpreadsheetData` that uses `SimpleSnapshot` as the snapshot type.
* My [initial fear]({% link _posts/2024-09-30-react-spreadsheet-data-interface.md %}) that the propagation of generic types from `SpreadsheetData` would get in the way seems to have come true.
* On a whim I tried using `VirtualSpreadsheet<unknown>` instead. To my surprise it worked. No type errors and I could switch between the different data sources without any issues at runtime. And yes, the editing works too, but that's not important right now.
* In TypeScript a type [defines a *set* of values](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html#types-as-sets) that have something in common. The type `VirtualSpreadsheet<unknown>` represents the set of `VirtualSpreadsheet` instances for every possible `Snapshot` type parameter. So, of course, `VirtualSpreadsheet<unknown>` will accept both `SpreadsheetData<number>` and `SpreadsheetData<SimpleSnapshot>`.
* There's no issue at runtime because `VirtualSpreadsheet` doesn't care what type the snapshot actually is. All it does is call `getSnapshot()` and then pass the value returned back to other `SpreadsheetData` methods.
* Didn't we just tie ourselves in knots to avoid using `unknown` as the public snapshot type for `SimpleSnapshot`? Haven't we just thrown all that hard won type safety away?
* Surprisingly, not. When `VirtualSpreadsheet` is type checked, TypeScript has to make sure that the code will work for every possible value of the `Snapshot` type parameter. It doesn't matter if we later use `VirtualSpreadsheet<unknown>`, the code still has to be safe to use for `VirtualSpreadsheet<number>` and `VirtualSpreadsheet<SimpleSnapshot>` and every other type.
* If I hardcoded `VirtualSpreadsheet` so that the snapshot type is always `unknown` it wouldn't be type safe. I could accidentally pass the wrong argument to `SpreadsheetData` without a type error to catch my mistake. Making `VirtualSpreadsheet` generic makes it type safe, even if I only ever use `VirtualSpreadsheet<unknown>`.
* Which is when I realized. `VirtualSpreadsheet` doesn't need to be generic at all, as long as the internal implementation is generic. I can remove all that complexity from the client.

```ts
export interface VirtualSpreadsheetGenericProps<Snapshot> {
  ...
}

export function VirtualSpreadsheetGeneric<Snapshot>(props: VirtualSpreadsheetGenericProps<Snapshot>) {
  ...
}

export interface VirtualSpreadsheetProps extends VirtualSpreadsheetGenericProps<unknown> {
}

export function VirtualSpreadsheet(props: VirtualSpreadsheetProps) {
  return VirtualSpreadsheetGeneric(props);
}
```

* I renamed the existing `VirtualSpreadsheet` and `VirtualSpreadsheetProps` as `VirtualSpreadsheetGeneric` and `VirtualSpreadsheetGenericProps`. I then added new implementations of `VirtualSpreadsheet` and `VirtualSpreadsheetProps` that are instantiations of the generic versions with `unknown`.
* I ended up having to use explicit functions and interfaces rather than aliases so that the generated TypeDoc documentation was as I wanted.
* By default, the TypeScript eslint plugin complains when you [define an empty interface](https://typescript-eslint.io/rules/no-empty-object-type/). Luckily, you can [configure the rule](https://typescript-eslint.io/rules/no-empty-object-type/#allowinterfaces) to allow empty interfaces that extend other interfaces.
* Bingo. No need for generic types in any of my `VirtualSpreadsheet` sample code. 

# Try It!

Visit the [Empty](https://www.thecandidstartup.org/infinisheet/storybook/?path=/story/react-spreadsheet-virtualspreadsheet--empty) Virtual Spreadsheet story. Embedded right here for your convenience.

{% include candid-iframe.html src="https://thecandidstartup.org/infinisheet/storybook/iframe?id=react-spreadsheet-virtualspreadsheet--empty" width="100%" height="420px" %}

# TODO

* Row and Column names
  * A single column or row is not a valid name. Standard is to use a range containing single row or column.
  * I'm going to support both `A` and `A:A`
  * Name field shows row range selection for single row, e.g. 10:10 if you selected row 10
* Click on column header -> column selected
  * Same as for row with first cell in column selected, name shows column range, e.g. E:E

* Formula round trip
* Google Sheets displayed normalized value - formatted but with a hardcoded format rather than cell format
  * Date: YYYY-MM-DD
  * Time: hh:mm:ss
  * Date Time: YYYY-MM-DD hh:mm:ss
  * Currency: As number with two decimal digits, no currency symbol
  * Percentage: Full fidelity number as percentage with % symbol
  * boolean: TRUE or FALSE
  * Other number: Full fidelity number (as many decimals as needed, scientific notation if too large or small)
  * If you type into a cell with a pure text format, the string is [left as is](https://support.microsoft.com/en-gb/office/stop-automatically-changing-numbers-to-dates-452bd2db-cc96-47d1-81e4-72cec11c4ed8).
* Ensures value can be round tripped without loss
* On update, format stays unchanged if parsed value is of same general class

* OnScroll, OnEditValue, etc. handlers
* Shouldn't allow spreadsheet to grow beyond max sizes - bug when max size == data size
