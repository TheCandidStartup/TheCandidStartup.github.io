---
title: >
  React Spreadsheet: Layered Data
tags: react-spreadsheet
thumbnail: /assets/images/react-spreadsheet/name-formula-layout.png
---

wise words

# Layered Spreadsheet Data

* Implementation of `SpreadsheetData` that layers two other `SpreadsheetData` instances on top of each other. There's an "edit" layer on top where any changes are stored, with a "base" layer underneath. If a value is `undefined` in the edit layer, the corresponding value is returned from the base layer instead.
* Can use any of my fake data sources as a base layer, with `SimpleSpreadsheetData` as the edit layer.
* Want my implementation to be type safe so natural for `LayeredSpreadsheetData` to be generic on `BaseData` and `EditData` types.

# Down the Typing Rat Hole

## Generic Parameter Constraints

* Will be calling methods on base and edit `SpreadsheetData` implementations so need to [constrain](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints) the generic type parameters to be extensions of `SpreadsheetData`
* Tried sketching out how the generic parameters would work


```ts
class LayeredSpreadsheetData<BaseData extends SpreadsheetData, EditData extends SpreadsheetData> {
  constructor(base: BaseData, edit: EditData) { ... }
}
```

* TypeScript error "Generic type SpreadsheetData requires 1 type argument"

## Parameterized Generic Parameters

* TypeScript happy with `extends SpreadsheetData<unknown>`
* Would remove type safety from my implementation. No type error if I pass the wrong thing as a snapshot, including passing a `base` snapshot to `edit` or vice vera.

* Need to parameterize the snapshot type

```ts
class LayeredSpreadsheetData<BaseData extends SpreadsheetData<BaseSnapshot>, EditData extends SpreadsheetData<EditSnapshot>> {
  constructor(base: BaseData, edit: EditData) { ... }
}
```

* TypeScript error "Cannot find name BaseSnapshot". Doesn't automatically treat `BaseSnapshot` as a type parameter

## Constraints using other type parameters

* TypeScript lets you use other [type parameters in generic constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#using-type-parameters-in-generic-constraints)
* What happens if I explicitly add `BaseSnapshot` and `EditSnapshot` as additional type parameters

```ts
class LayeredSpreadsheetData<BaseData extends SpreadsheetData<BaseSnapshot>, EditData extends SpreadsheetData<EditSnapshot>, BaseSnapshot, EditSnapshot> {
  constructor(base: BaseData, edit: EditData) { ... }
}
```

* Now TypeScript is happy. No errors. I'm not happy. Now caller has four type parameters to specify, two of which are redundant.

```ts
const data = new LayeredSpreadsheetData<EmptySpreadsheetData, SimpleSpreadsheetData, number, SimpleSnapshot>(new EmptySpreadsheetData, new SimpleSpreadsheetData)
```

## Inferring Generic Parameters

* TypeScript will infer type parameters from constructor arguments. If I remove all the type parameters from the code above, TypeScript will infer the type `LayeredSpreadsheetData<EmptySpreadsheetData, SimpleSpreadsheetData, unknown, unknown>`.
* You can see how it got there. There's no constraints on `BaseSnapshot` and `EditSnapshot` so `unknown` is a reasonable choice given that every instantiation of `SpreadsheetData` is compatible with `SpreadsheetData<unknown>`.

## More Constraints for Better Inference

* I've previously made the argument that it's fine to instantiate a generic class with `unknown` as the implementation of the class is still type safe. However, it's annoying that TypeScript can't infer the more precise type. There's also some impact on external type safety. 
* Will eventually need to define a `LayeredSnapshot` type based on `BaseSnapshot` and `EditSnapshot`. In the unlikely event that I use two different instantiations of `LayeredSpreadsheetData` I would end up with identical types for `LayeredSnapshot` and no type errors if I mixed them up.
* How about adding some constraints for `BaseSnapshot` and `EditSnapshot`?
* Typescript is great at manipulating types. You can use [conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types) to extract the snapshot type from an instantiation of `SpreadsheetData`

```ts
export type SnapshotType<T> = T extends SpreadsheetData<infer TResult> ? TResult : never;
```

* My first attempt didn't work

```ts
class LayerSpreadsheetData<BaseData extends SpreadsheetData<BaseSnapshot>, EditData extends SpreadsheetData<EditSnapshot>, 
  BaseSnapshot extends SnapshotType<BaseData>, EditSnapshot extends SnapshotType<EditData> {
  constructor(base: BaseData, edit: EditData) { ... }
}
```

* TypeScript complains that "type parameter BaseSnapshot has a circular constraint". I guess it has a point. 

## Generic Parameter Defaults

* It does work when I write out the instantiation

```ts
const data = new LayeredSpreadsheetData<EmptySpreadsheetData, SimpleSpreadsheetData, SnapshotType<EmptySpreadsheetData>, SnapshotType<SimpleSpreadsheetData>>(new EmptySpreadsheetData, new SimpleSpreadsheetData)
```

* TypeScript supports [defaults](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-parameter-defaults) for generic type parameters. Which is how I ended up with this.

```ts
class LayeredSpreadsheetData<BaseData extends SpreadsheetData<BaseSnapshot>, 
  EditData extends SpreadsheetData<EditSnapshot>, BaseSnapshot = SnapshotType<BaseData>, EditSnapshot = SnapshotType<EditData>> {
  constructor(base: BaseData, edit: EditData) { ... }
}
```

* Which actually works. Both `new LayeredSpreadsheetData(...)` and `new LayeredSpreadsheet<EmptySpreadsheetData, SimpleSpreadsheetData>(...)` infer the correct generic types. 

# Layered Snapshot

* Layered snapshot is basically a tuple containing the base snapshot and edit snapshot
* I used the same approach as before to define an internal snapshot type

```ts
interface LayeredSnapshotContent<BaseSnapshot, EditSnapshot> {
  base: BaseSnapshot,
  edit: EditSnapshot
}
```

* With a separate opaque branded type for external use
* The branding needs to make use of the generic type parameters to ensure that different instantiations have distinct public snapshot types.

```ts
export enum _LayeredSnapshotBrand { _DO_NOT_USE="" };

export interface LayeredSnapshot<BaseSnapshot,EditSnapshot> {
  /** @internal */
  _brand: [ _LayeredSnapshotBrand, BaseSnapshot, EditSnapshot ]
}
```

* Remember that the `_brand` field is never used. It just has to be there in the declaration for when TypeScript does its structural typing analysis.

# Complete class declaration

* It's taken a while but we now have all the pieces needed to put the complete class declaration together.

```ts
export class LayeredSpreadsheetData<BaseData extends SpreadsheetData<BaseSnapshot>, 
  EditData extends SpreadsheetData<EditSnapshot>, BaseSnapshot = SnapshotType<BaseData>, EditSnapshot = SnapshotType<EditData>>
    implements SpreadsheetData<LayeredSnapshot<BaseSnapshot, EditSnapshot>> {

  constructor(base: BaseData, edit: EditData) {
    this.#base = base;
    this.#edit = edit;
  }

  #base: BaseData;
  #edit: EditData;
  #content: LayeredSnapshotContent<BaseSnapshot, EditSnapshot> | undefined;
}  
```

# Implementation

* Let's hope the implementation is simpler than sorting out the typing was.

## Get Snapshot

* We keep a copy of the most recent snapshot in `#content`. We create a new snapshot if either base or edit snapshot have changed, or if we don't have a cached snapshot yet.

```ts
getSnapshot(): LayeredSnapshot<BaseSnapshot, EditSnapshot> {
  const baseSnapshot = this.#base.getSnapshot();
  const editSnapshot = this.#edit.getSnapshot();

  if (!this.#content || this.#content.base != baseSnapshot || this.#content.edit != editSnapshot) {
    this.#content = { base: baseSnapshot, edit: editSnapshot } ;
  }

  return asSnapshot(this.#content);
}
```

## Subscribe

* Equally simple. Forward the subscriber onto base and edit layer, return a thunk that unsubscribes from both.

```ts
subscribe(onDataChange: () => void): () => void {
  const unsubscribeBase = this.#base.subscribe(onDataChange);
  const unsubscribeEdit = this.#edit.subscribe(onDataChange);
  return () => {
    unsubscribeBase();
    unsubscribeEdit();
  }
}
```

## Setters and Getters

* Just a matter of forwarding calls on to the appropriate place and processing the results
* All edits go to the edit layer
* All value and format queries go to the edit layer if the corresponding cell is defined, otherwise the base layer
* Row and column counts use the maximum value from the two layers
* ItemOffsetMapping is complicated to do in a general way. For now I just forward on to the base layer. Works for current use case where I have fake data in the base layer and an empty edit layer. I haven't exposed a way of changing the extend of a row or column so will do for now.

```ts
getColumnCount(snapshot: LayeredSnapshot<BaseSnapshot, EditSnapshot>): number {
  const content = asContent(snapshot);
  return Math.max(this.#base.getColumnCount(content.base), this.#edit.getColumnCount(content.edit));
}

getColumnItemOffsetMapping(snapshot: LayeredSnapshot<BaseSnapshot, EditSnapshot>): ItemOffsetMapping {
  return this.#base.getColumnItemOffsetMapping(asContent(snapshot).base);
}

getCellValue(snapshot: LayeredSnapshot<BaseSnapshot, EditSnapshot>, row: number, column: number): CellValue {
  const content = asContent(snapshot);
  const editValue = this.#edit.getCellValue(content.edit, row, column);
  if (editValue !== undefined)
    return editValue;

  return this.#base.getCellValue(content.base, row, column);
}

getCellFormat(snapshot: LayeredSnapshot<BaseSnapshot, EditSnapshot>, row: number, column: number): string | undefined {
  const content = asContent(snapshot);
  const editValue = this.#edit.getCellValue(content.edit, row, column);
  return (editValue === undefined) ? this.#base.getCellFormat(content.base, row, column) : this.#edit.getCellFormat(content.edit, row, column);
}

setCellValueAndFormat(row: number, column: number, value: CellValue, format: string | undefined): boolean {
  return this.#edit.setCellValueAndFormat(row, column, value, format);
}
```

# Try It!

Visit the [Test Data](https://www.thecandidstartup.org/infinisheet/storybook/?path=/story/react-spreadsheet-virtualspreadsheet--test-data) Virtual Spreadsheet story. Also embedded right here for your convenience.

{% include candid-iframe.html src="https://thecandidstartup.org/infinisheet/storybook/iframe?id=react-spreadsheet-virtualspreadsheet--test-data" width="100%" height="420px" %}

* Try changing existing values
* Scroll around and come back
* Scroll to the end and watch additional rows being added to the base layer
* Change values a few rows a head and watch what happens as the additional rows catch up

# Conclusion

* Spent a lot more time on typing than actual implementation. Was it worth it?
* I learned a lot more about the TypeScript type system
* The strict typing did help me. As I figured out which layers to forward on to, I often ended up changing the `SpreadsheetData` instance  I was calling, with VS Code intellisense immediately reminding me that I needed to change the snapshot I was passing in too.

