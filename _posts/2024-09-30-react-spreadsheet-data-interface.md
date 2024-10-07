---
title: Spreadsheet Data Interface
tags: react-spreadsheet
thumbnail: /assets/images/boring-spreadsheet.png
---

[Last time]({% link _posts/2024-09-16-react-spreadsheet-infinite-scrolling.md %}), I got fed up with the hardcoded placeholder content in my [react-spreadsheet]({% link _topics/react-spreadsheet.md %}) component. Time to make a start on the spreadsheet data interface that my component will use to retrieve content for display.

The  minimal interface is just size (`rowCount`, `columnCount`) and a `getCellValue` method. The tricky part is that data can change over time. The spreadsheet component needs to *react* to the change and update itself (pun intended).

# useSyncExternalStore

Luckily, React has the [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) hook for just this use case. You pass the hook two functions: `subscribe` and `getSnapshot`. React calls the `subscribe` function with a callback for you to invoke whenever the content of the data store may have changed. React calls the `getSnapshot` function to check whether the data store content has changed since the last render.

The result of `getSnapshot` can be whatever you like, as long as it's comparable using `object.is`. The snapshot must be immutable. React uses the snapshot mechanism to ensure that everything rendered comes from a consistent point in time. 

How you extract data from a snapshot is entirely up to you.

# Generics

The `useSyncExternalStore` hook is generic. Most of my previous experience with generic language features is with [templates](https://en.cppreference.com/w/cpp/language/templates) in early versions of C++. Templates were complex to understand, resulted in obscure compiler errors, significantly changed the compilation and linking process and were impossible to debug. I quickly learnt to avoid templates if at all possible.

```ts
export function useSyncExternalStore<Snapshot>(
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => Snapshot,
    getServerSnapshot?: () => Snapshot,
): Snapshot;
```

Which is probably why my first reaction on seeing the `useSyncExternalStore` definition was to pick a fixed type to use as a snapshot and minimize the contamination of my code with generics. My main implementation of a data store is going to be based on event sourcing, so I can use an index into the event log as a snapshot. Nice and simple. A snapshot is just a number.

I've also been thinking about how to combine multiple data stores into a single view. You could have a `MultiSpreadsheetData` interface that wrapped an array of `SpreadsheetData` instances. The `getCellValue` method would call each child store in turn until it found a defined value. You could have a read-only reference data store and overlay an empty editable data store. 

Unfortunately, that needs a more complex snapshot. In general, `MultiSpreadsheetData` would need to return an array containing each child store's snapshot. I briefly thought about an end run around the type system by declaring `Snapshot` as `unknown` or `any`. Then I realized that I'm better than that.

TypeScript is a long way from C++. In the end, I decided to try embracing TypeScript generics and see where I ended up. After all, this whole process is meant to be a learning experience. I was comforted by the thought that TypeScript is simply a set of annotations on top of JavaScript. All that compiling TypeScript does is remove the annotations. The runtime code will be exactly the same regardless of whether functions are generic or based on fixed types.

# Spreadsheet Data Interface

```ts
export interface SpreadsheetData<Snapshot> {
  subscribe(onDataChange: () => void): () => void,
  getSnapshot(): Snapshot,

  getRowCount(snapshot: Snapshot): number,
  getColumnCount(snapshot: Snapshot): number,
  getCellValue(snapshot: Snapshot, row: number, column: number): string
}
```

After all that build up, there should be no surprises with the interface. The first two methods are compatible with the required parameters from `useSyncExternalStore`. The interface is generic on `Snapshot` so each implementation can use whatever it wants to represent a snapshot. Note that the subscribe method returns a function that React can use to cancel the subscription. 

The remaining functions are the minimal interface needed to retrieve data. Each method takes a `Snapshot` parameter and should return data corresponding to that snapshot. For now the cell value is just a string. We'll eventually need some kind of typed union thing that can support multiple data types.

# React Spreadsheet Data

```ts
export interface ReactSpreadsheetData<Snapshot> extends SpreadsheetData<Snapshot> {
  getServerSnapshot?: () => Snapshot
}
```

The optional third argument to `useSyncExternalStore` is used for React server side rendering. As it's React specific it doesn't belong in the base `SpreadsheetData` interface. However, I want to be a good citizen and support it in case someone wants to use `react-spreadsheet` that way. As it's an optional argument and optional property, anything that implements `SpreadsheetData` is also compatible with `ReactSpreadsheetData`.

It costs me almost nothing to support it. 

# Virtual Spreadsheet Implementation

Finally we get to the main event. What needs to change in `VirtualSpreadsheet` to support the data interface? Surprisingly little.

```tsx
export interface VirtualSpreadsheetProps<Snapshot> {
  data: ReactSpreadsheetData<Snapshot>
}

export function VirtualSpreadsheet<Snapshot>(props: VirtualSpreadsheetProps<Snapshot>) {
  const { data, minRowCount=100, minColumnCount=26 } = props;

  const subscribeFn = React.useCallback((cb: () => void) => data.subscribe(cb), [data]); 
  const snapshot = React.useSyncExternalStore<Snapshot>(subscribeFn, 
    data.getSnapshot.bind(data), data.getServerSnapshot?.bind(data));
```

The most intrusive change was adding `data` to `VirtualSpreadsheetProps`. As I feared, that requires both `VirtualSpreadsheetProps` and `VirtualSpreadsheet` to become generic on `Snapshot`. Remember, these are just type annotations. We get increased type safety with no runtime impact.

Internally, the big change is the addition of the `useSyncExternalStore` hook, passing through the corresponding methods from the data interface object. This created two learning moments. 

Initially, I passed `data.subscribe, data.getSnapshot, data.getServerSnapshot` to `useSyncExternalStore`. No errors in VS Code. No build or lint errors. Just a failure at runtime if one of the methods accesses a member variable. 

What actually happens is that the methods get passed through without `data` bound to `this`. You need to use the `bind` utility to make it work as you might expect.

Now the second learning moment. I initially passed `data.subscribe.bind(data)` as the first argument. Everything worked but I later realized that React was unsubscribing and re-subscribing on every render. The [small print](https://react.dev/reference/react/useSyncExternalStore#caveats) in the React documentation explains that this will happen if you pass a different subscribe function on a subsequent render. 

Of course, `data.subscribe.bind(data)` returns a new function each time it's called. I used the [`useCallback`](https://react.dev/reference/react/useCallback) hook to [memoize](https://en.wikipedia.org/wiki/Memoization) the bound function and ensure that it only changes if the `data` prop changes. 

This works, but fails the ESLint rule `react-hooks/exhaustive-deps`.  ESLint can only validate that dependencies are correct if the first argument to `useCallback` is an inline function definition. My first thought was to disable the rule for this line with a [configuration comment](https://eslint.org/docs/latest/use/configure/rules#using-configuration-comments-1). However, I realized that it would be straightforward to replace `bind` with an equivalent arrow function expression. 

The rest of the changes were simple. 

```tsx
  const [hwmRowIndex, setHwmRowIndex] = React.useState(0);
  const [hwmColumnIndex, setHwmColumnIndex] = React.useState(0);

  const dataRowCount = data.getRowCount(snapshot);
  const rowCount = Math.max(minRowCount, dataRowCount, hwmRowIndex+1);
  const dataColumnCount = data.getColumnCount(snapshot);
  const columnCount = Math.max(minColumnCount, dataColumnCount, hwmColumnIndex+1);

  const Cell = ({ rowIndex, columnIndex, style }: { rowIndex: number, columnIndex: number, style: React.CSSProperties }) => (
  <div className={theme?.VirtualSpreadsheet_Cell} style={style}>
    { (rowIndex < dataRowCount && columnIndex < dataColumnCount) ? 
        data.getCellValue(snapshot, rowIndex, columnIndex) : "" }
  </div>
  );
```

The overall grid size becomes the max of min size, data size and high water mark. The internal `Cell` component now renders the cell value from the interface when in range, otherwise leaves the cell empty.

# Fixing Unit Tests

Adding a new required prop is a breaking change, which broke all my unit tests. As currently written, they depend on the old hard coded cell name values. It was easy enough to create some mock data that works the same way.

```tsx
class TestData implements SpreadsheetData<number> {
  subscribe(_onDataChange: () => void) {
    return () => {};
  }

  getSnapshot() { return 0; }
  
  getRowCount(_snapshot: number) { return 100; }
  getColumnCount(_snapshot: number) { return 26; }
  getCellValue(_snapshot: number, row: number, column: number) { 
    return rowColCoordsToRef(row, column); 
  }
}

const data = new TestData;

render(
  <VirtualSpreadsheet
    data={data}
    height={240}
    width={600}>
  </VirtualSpreadsheet>
)
```

Notice that we don't need to specify the `Snapshot` type when `VirtualSpreadsheet` is rendered. TypeScript can infer it from the type of `data`.  

# Dealing With Change

The change in interface also broke my sample app. I decided to be a bit more adventurous with my app data. 

```ts
class AppData implements SpreadsheetData<number> {
  constructor() { this.count = 0; }

  subscribe(onDataChange: () => void) {
    const intervalId = setInterval(() => { 
      this.count ++;
      onDataChange();
    }, 1000)
    return () => { clearInterval(intervalId) }
  }

  getSnapshot() { return this.count; }
  
  getRowCount(snapshot: number) { return snapshot; }
  getColumnCount(_snapshot: number) { return 26; }
  getCellValue(_snapshot: number, row: number, column: number) { 
    return rowColCoordsToRef(row, column); 
  }

  count: number;
}
```

I still use cell names as content but now start with an empty spreadsheet and add a new row every second. Each row has 26 columns, so I can test how [infinite scrolling]({% link _posts/2024-09-16-react-spreadsheet-infinite-scrolling.md %}) feels when going past the end of existing content. 

The subscribe method starts a timer which is canceled on unsubscribe. `AppData` has a member variable which is a `count` of the current number of rows. The `count` is incremented in the timer before invoking the callback to React.

You have to be really careful to maintain the expected snapshot semantics. Notice how `getRowCount` returns the snapshot count, not the current count. This ensures the render is consistent even if `count` gets incremented in the middle of the render. As `getCellValue` is only called for the first `getRowCount` rows, there's no need to make it explicitly dependent on `snapshot`. 

# Try It!

How much time have you spent reading this page? How many rows of data does the demo spreadsheet contain? 

{% include candid-iframe.html src="/assets/dist/react-spreadsheet-data-interface/index.html" width="100%" height="fit-content" %}

That's how many seconds it's been since you loaded the page. 

# Next Time

I've sketched out how `VirtualSpreadsheet` can display string data from an arbitrary source. [Next time]({% link _posts/2024-10-07-react-spreadsheet-data-model.md %}), we'll flesh out the data model so that we have parity with [Excel](https://support.microsoft.com/en-gb/office/type-function-45b4e688-4bc3-48b3-a105-ffa892995899). 
