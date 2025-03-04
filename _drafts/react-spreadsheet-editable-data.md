---
title: >
  React Spreadsheet: Editable Data
tags: react-spreadsheet infinisheet
thumbnail: /assets/images/react-spreadsheet/name-formula-layout.png
---

We're on a roll, steadily filling out the [Infinisheet architecture diagram]({% link _posts/2024-07-29-infinisheet-architecture.md %}) with actual implementations. I have a [React based spreadsheet frontend]({% link _posts/2025-03-03-react-spreadsheet-release-ready.md %}) that reads data via a common [spreadsheet data interface]({% link _posts/2024-09-30-react-spreadsheet-data-interface.md %}).

So far, all my implementations of that interface have served up [fake data]({% link _posts/2024-10-07-react-spreadsheet-data-model.md %}). Now I'm going to build my first real implementation with data you can edit.

# Simple Spreadsheet Data

{% include candid-image.html src="/assets/images/infinisheet/simple-spreadsheet-data-architecture.svg" alt="InfiniSheet Architecture" %}

I'm starting with a *reference implementation* of the `SpreadsheetData` interface. A reference implementation should be functionally correct, simple to build and easy to understand. There's no attempt at optimization.

You can use a reference implementation for mocks, checking behavior compared with an optimized implementation and for sample code. Most importantly, it helps validate that an interface makes sense before you invest a lot of effort into an optimized, production quality implementation.

This is a new package, filling out the `simple-spreadsheet-data` box on the architecture diagram. We start with `EmptySpreadsheetData`, implement `setCellValueAndFormat` then see what has to happen to make the rest of it work.

# Snapshot Semantics

The snapshot semantics used in `SpreadsheetData` come from the React [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore) hook. The intent is that you can read a consistent set of data from an external data source that is continuously changing. You ask for a snapshot and then read data in the context of that snapshot.

The key requirements are :
  1. If nothing changes, successive calls to `getSnapshot` must return the same value (compared using `Object.is`).
  2. If something changes, values read using an existing snapshot must not change.
  3. If something changes, the next call to `getSnapshot` must return a different value.

It's not clear how long a snapshot must continue to be valid. Obviously, until React stops using it, but when is that? And can you rely on that behavior?

React calls `getSnapshot` to see if anything has changed since the last snapshot and schedule a render if needed. The render will use the same snapshot throughout, retrieving data from the store. This implies that a snapshot must remain valid at least until data starts being retrieved using a more recent snapshot. There doesn't seem to be any reason why React would need to hang on to the previous snapshot after that. 

Luckily, we don't need to worry about any of that for a reference implementation. The simplest and most obviously correct approach is for a snapshot to be a literal snapshot - a self contained copy of the data. However, you can't create a new copy every time `getSnapshot` is called as it has to return the same object if nothing's changed. 

One solution is to use an immutable data structure and return the current value whenever `getSnapshot` is called. The [React documentation](https://react.dev/reference/react/useSyncExternalStore#subscribing-to-an-external-store) has a simple example, `todoStore.js`, which does exactly that. I used it as a starting point.

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

  getSnapshot(): SimpleSnapshot {
    return this.#content;
  }

  #content: SimpleSnapshot;
}
```

The spreadsheet values are stored as a simple map from cell name to cell content. I keep track of the current extent of the data separately so that I don't have to search through the whole thing to work out how big it is. I use a `Record` rather than a `Map` as records support spread syntax, making it easy to implement `setCellValueAndFormat` in an immutable way.

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
Yes, this is horribly inefficient, but this is a reference implementation. The point is to be simple and obviously correct. Efficiency can come later with a real [event sourced]({{ bb_url | append: "#event-sourcing" }}) implementation.

The getters are simple to implement. Just lookup whatever is needed in the snapshot passed in.

# Subscribe Semantics

The React [useSyncExternalStore documentation](https://react.dev/reference/react/useSyncExternalStore#subscribing-to-an-external-store) also shows how to implement `subscribe`.

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

We maintain an array of listeners and call `#notifyListeners` on any change. The `subscribe` function returns an unsubscribe lambda that removes the corresponding listener from the array.

# Hiding Implementation Details

This has all gone smoothly so far. Time to dive down a rat hole.

I want to hide the details of how `SimpleSnapshot` is implemented. Callers don't need to know anything about the internal structure. I want to be free to change the implementation without it being a breaking change for the API.

My initial attempt was to not export the `SimpleSnapshot` type. 

It doesn't work as I expected. The type is still copied into the built `.d.ts` typing file. Consuming code can see the structure of `SimpleSnapshot` in VS Code intellisense and access the data directly. You can't explicitly import the type, but you can still make use of it. I also get errors from API Extractor because I'm using a type in the API that hasn't been exported. 

My next thought was to define `SimpleSnapshot` as an alias for `unknown` in the API and then cast to the actual interface in the implementation. The problem with that is that everything is assignable to `unknown`, so the caller could pass anything in as a snapshot without triggering a type error.

How about using an empty `interface` and having the internal implementation extend from that? The problem there is that TypeScript uses [structural typing](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html#structural-type-system). I can declare `interface SimpleSnapshot {}` but the API would accept anything structurally compatible, which is [actually anything](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html#empty-types) apart from `null` or `undefined`.

# Nominal Typing

Ideally you want a public type that is compatible only with a type that has the same name, that is, itself. This is [nominal typing](https://basarat.gitbook.io/typescript/main-1/nominaltyping#nominal-typing). Typescript doesn't directly support nominal typing but there [are](https://basarat.gitbook.io/typescript/main-1/nominaltyping#using-literal-types) [several](https://basarat.gitbook.io/typescript/main-1/nominaltyping#using-enums) [common](https://basarat.gitbook.io/typescript/main-1/nominaltyping#using-interfaces) [patterns](https://github.com/kourge/ts-brand) used to get a similar effect. 

They all resolve around adding an unused *brand* property with a type that is highly unlikely to match. This process is known as [type branding](https://www.learningtypescript.com/articles/branded-types). The pattern I went with uses a string enum as the type of the brand. Non-empty string enums are unusual as they are actually nominally typed in TypeScript. Two enums with identical values are treated as separate types.

```ts
/** @internal */
export enum _SimpleSnapshotBrand { _DO_NOT_USE="" };

export interface SimpleSnapshot {
  /** @internal */
  _brand: _SimpleSnapshotBrand;
}
```

Passing anything that isn't a snapshot returned by `SimpleSpreadsheetData` will result in a type error, unless you forcibly cast with `as unknown as SimpleSnapshot` or go to the lengths of importing `_SimpleSnapshotBrand` and pass in `{ _brand: _SimpleShotBrand._DO_NOT_USE }`. Neither is happening accidentally. 

I want to exclude all the branding stuff from my API documentation. I couldn't get the `@hidden` or `@ignore` TSDoc tags to work with TypeDoc. Any attempt to use them is reported as an "unknown block tag" error. I can't see any known issues for this. I do see lots of content suggesting that these tags work just fine for other people.

After spelunking through the source code I saw that I should be able to get the same effect by using the `@internal` tag together with TypeDoc config to exclude content tagged as internal. For whatever reason, this worked.

The downside of using entirely separate types for the public and internal representations of `SimpleSnapshot` is that the implementation code needs to explicitly cast between `SimpleSnapshot` and `SimpleSnapshotContent` on the API boundary. To make it less ugly I added a couple of helpers.

```ts
function asContent(snapshot: SimpleSnapshot) {
  return snapshot as unknown as SimpleSnapshotContent;
}

function asSnapshot(snapshot: SimpleSnapshotContent) {
  return snapshot as unknown as SimpleSnapshot;
}
```

# More Type Theory

I now have a type safe implementation of `SimpleSnapshotData`. Let's try it out. I replaced `EmptySpreadsheetData` with `SimpleSpreadsheetData` in my storybook. The spreadsheet still starts as empty but now it should save any changes I make when edited.

I immediately ran into a type error. All my other data sources use `number` as a snapshot, which means I'm using a `VirtualSpreadsheet<number>` as my spreadsheet component. It won't work with a `SpreadsheetData` that uses `SimpleSnapshot` as the snapshot type.

My [initial fear]({% link _posts/2024-09-30-react-spreadsheet-data-interface.md %}) that the propagation of generic types from `SpreadsheetData` would get in the way seems to have come true.

On a whim I tried using `VirtualSpreadsheet<unknown>` instead. To my surprise it worked. No type errors and I could switch between the different data sources without any issues at runtime. And yes, editing works too, but that's not important right now.

In TypeScript, a type [defines a *set* of values](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html#types-as-sets) that have something in common. The type `VirtualSpreadsheet<unknown>` represents the set of `VirtualSpreadsheet` instances for every possible `Snapshot` type parameter. So, of course, `VirtualSpreadsheet<unknown>` will accept both `SpreadsheetData<number>` and `SpreadsheetData<SimpleSnapshot>`.

There's no issue at runtime because `VirtualSpreadsheet` doesn't care what type the snapshot actually is. All it does is call `getSnapshot()` and then pass the value returned back to other `SpreadsheetData` methods.

Didn't we just tie ourselves in knots to avoid using `unknown` as the public snapshot type for `SimpleSnapshot`? Have I just thrown all that hard won type safety away?

Surprisingly, no. When `VirtualSpreadsheet` is type checked, TypeScript has to make sure that the code will work for every possible value of the `Snapshot` type parameter. It doesn't matter if we later use `VirtualSpreadsheet<unknown>`, the code still has to be safe to use for `VirtualSpreadsheet<number>` and `VirtualSpreadsheet<SimpleSnapshot>` and every other type.

If I hardcoded `VirtualSpreadsheet` so that the snapshot type is always `unknown` it wouldn't be type safe. I could accidentally pass the wrong argument to `SpreadsheetData` without a type error to catch my mistake. Making `VirtualSpreadsheet` generic makes it type safe, even if I only ever use `VirtualSpreadsheet<unknown>`.

Which is when I realized. `VirtualSpreadsheet` doesn't need to be generic at all, as long as the internal implementation is generic. I can remove all that complexity from client code.

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

I renamed the existing `VirtualSpreadsheet` and `VirtualSpreadsheetProps` as `VirtualSpreadsheetGeneric` and `VirtualSpreadsheetGenericProps`. I then added new implementations of `VirtualSpreadsheet` and `VirtualSpreadsheetProps` that are instantiations of the generic versions with `unknown`.

I ended up having to use explicit functions and interfaces rather than aliases so that the generated TypeDoc documentation was as I wanted.

By default, the TypeScript eslint plugin complains when you [define an empty interface](https://typescript-eslint.io/rules/no-empty-object-type/). Luckily, you can [configure the rule](https://typescript-eslint.io/rules/no-empty-object-type/#allowinterfaces) to allow empty interfaces that extend other interfaces.

Bingo. No need for generic types in any of my `VirtualSpreadsheet` sample code. Select a cell, type something, hit `Enter`. 

# Try It!

Visit the [Empty](https://www.thecandidstartup.org/infinisheet/storybook/?path=/story/react-spreadsheet-virtualspreadsheet--empty) Virtual Spreadsheet story. Also embedded right here for your convenience.

{% include candid-iframe.html src="https://thecandidstartup.org/infinisheet/storybook/iframe?id=react-spreadsheet-virtualspreadsheet--empty" width="100%" height="420px" %}


# Next Time

The empty spreadsheet is editable, but what about the other data sources? How do I make "fake" data sources that programmatically generate content for trillions of cells editable? 

Don't worry, I have a cunning plan.
