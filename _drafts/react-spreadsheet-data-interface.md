---
title: Spreadsheet Data Interface
tags: react-spreadsheet
---

wise words

* Minimal interface is size (rowCount, columnCount) and a `getCellValue` method
* Tricky part is that data can change over time. Spreadsheet component needs to *react* (pun intended) to the change and repaint.

# useSyncExternalStore

* Luckily React has the [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) hook for just this use case
* You pass the hook two functions: `subscribe` and `getSnapshot`
* React calls the `subscribe` function with a callback for you to invoke whenever the content of the store may have changed
* React calls the `getSnapshot` function to check whether the content has changed since the last render
* The "snapshot" can be whatever you like, as long as it's comparable using `object.is`
* The data used for rendering from a snapshot needs to be consistent
* Snapshot mechanism ensures that data rendered is consistent
* How snapshot relates to data is entirely up to you

# Spreadsheet Data Interface

```ts
export interface SpreadsheetData {
  subscribe: (onDataChange: () => void) => () => void,
  getSnapshot: () => number,

  getRowCount(snapshot: number): number,
  getColumnCount(snapshot: number): number,
  getCellValue(snapshot: number, row: number, column: number): string
}
```

* First two methods are compatible with `useSyncExternalStore` methods
* Note that `subscribe` needs to return a method that cancels the subscription
* I've decided to make snapshot a number
* The full implementation of the interface will be based on an event log so index of entry in event log is a natural and minimal snapshot
* The rest is the minimal interface needed to retrieve data. Each method takes a snapshot and should return data corresponding to that snapshot
* For now cell value is just a string. Will eventually be some kind of typed union thing supporting multiple data types.

# React Spreadsheet Data

```ts
export interface ReactSpreadsheetData extends SpreadsheetData {
  getServerSnapshot?: () => number
}
```

* `useSyncExternalStore` has an optional third argument used for server side rendering. 
* Want to be a good citizen and support in case someone wants to use spreadsheet component that way
* Doesn't belong in main interface as its React specific
* As its an optional argument and optional property anything that implements `SpreadsheetData` is also compatible with `ReactSpreadsheetData`
* Costs me almost nothing to support

# Virtual Spreadsheet Implementation

```tsx
export interface VirtualSpreadsheetProps {
  data: ReactSpreadsheetData
}

export function VirtualSpreadsheet(props: VirtualSpreadsheetProps) {
  const { data, minRowCount=100, minColumnCount=26 } = props;

  const snapshot = React.useSyncExternalStore<number>(data.subscribe.bind(data), 
    data.getSnapshot.bind(data), data.getServerSnapshot?.bind(data));

  const [hwmRowIndex, setHwmRowIndex] = React.useState(0);
  const [hwmColumnIndex, setHwmColumnIndex] = React.useState(0);

  const dataRowCount = data.getRowCount(snapshot);
  const rowCount = Math.max(minRowCount, dataRowCount, hwmRowIndex+1);
  const dataColumnCount = data.getColumnCount(snapshot);
  const columnCount = Math.max(minColumnCount, dataColumnCount, hwmColumnIndex+1);

  const Cell = ({ rowIndex, columnIndex, style }: { rowIndex: number, columnIndex: number, style: React.CSSProperties }) => (
  <div className={theme?.VirtualSpreadsheet_Cell} style={style}>
    { (rowIndex < dataRowCount && columnIndex < dataColumnCount) ? data.getCellValue(snapshot, rowIndex, columnIndex) : "" }
  </div>
  );
```

* Implementation pretty simple
* Added data to the props
* Call the `useSyncExternalStore` hook passing in the corresponding methods from the interface
* TypeScript learning moment. Initially passed in `data.subscribe, data.getSnapshot, data.getServerSnapshot`. No errors in VS Code. No build or lint errors. 
* What actually happens is that the function gets passed through but without `data` bound to `this`. Need to bind explicitly to make it work as you might expect.
* Overall grid size adjusted to be max of min size, data size and high water mark
* Internal `Cell` component now renders the cell value from the interface when in range, otherwise the cell is empty

# Fixing Unit Tests

* Changed API which means unit tests are broken
* As currently written, they depend on the old hard coded cell name values

```ts
class TestData implements SpreadsheetData {
  subscribe(_onDataChange: () => void) {
    return () => {};
  }

  getSnapshot() { return 0; }
  
  getRowCount() { return 100; }
  getColumnCount() { return 26; }
  getCellValue(_snapshot: number, row: number, column: number) { 
    return rowColCoordsToRef(row, column); 
  }
}
```

Easy enough to create some mock data that works the same way

# Dealing With Change

```ts
class AppData implements SpreadsheetData {
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

* Still using cell names as content but now starting with an empty spreadsheet and adding a new row every second
* Subscribe sets an internal timer which is canceled on unsubscribe
* `AppData` has a member variable for current number of rows which is incremented in the timer before invoking the callback
* You have to be really careful to maintain the expected snapshot semantics. Notice how `getRowCount` returns the snapshot count, not the current count. Ensures render is consistent even if count incremented in the middle of the render (for example if render was suspended).
* `getCellValue` is only called for the first `getRowCount` rows so no need to do anything extra with the snapshot.
