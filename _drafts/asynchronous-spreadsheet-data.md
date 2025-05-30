---
title: Asynchronous Spreadsheet Data
tags: infinisheet
thumbnail: /assets/images/infinisheet/tracer-bullet-thumbnail.png
---

Last week's tracer bullet development showed that I needed to make my `SpreadsheetData` interface more explicitly asynchronous.

# Asynchronous Spreadsheet Data

```ts
export interface SpreadsheetData<Snapshot> {
  /** 
   * Return load status at the time the snapshot was created 
   * 
   * On Success returns true if load has completed, false if still in progress
   * On Err returns most recent error reported by the storage system
   */
  getLoadStatus(snapshot: Snapshot): Result<boolean,StorageError>,

  /** Set value and format of specified cell
   * 
   * @returns `Ok` if the change was successfully applied
   */
  setCellValueAndFormat(row: number, column: number, value: CellValue, format: string | undefined): ResultAsync<void,SpreadsheetDataError>
}
```

* Added new method that returns status of data loading for a snapshot. Snapshot is either completely loaded, partially loaded and in progress, or has an error.
* Made `setCellValueAndFormat` return a `ResultAsync` rather than `Result`.

# Breaking Change

* Needed to make many unit tests async and add `await` before any call to `setCellValueAndFormat`
* Implementation straight forward with some nice uses of NeverThrow chaining methods.

```ts
export class LayeredSpreadsheetData implements SpreadsheetData<LayeredSnapshot<BaseSnapshot, EditSnapshot>> {
  getLoadStatus(snapshot: LayeredSnapshot<BaseSnapshot, EditSnapshot>): Result<boolean,StorageError> {
    const content = asContent(snapshot);
    return this.#base.getLoadStatus(content.base).andThen((t1) => this.#edit.getLoadStatus(content.edit).map((t2) => t1 && t2));
  }

  setCellValueAndFormat(row: number, column: number, value: CellValue, format: string | undefined): ResultAsync<void,SpreadsheetDataError> {
    const result = this.#base.isValidCellValueAndFormat(row, column, value, format);
    return result.asyncAndThen(() => this.#edit.setCellValueAndFormat(row, column, value, format));
  }
}
```

# Event Sourced Spreadsheet Data

```ts
setCellValueAndFormat(row: number, column: number, value: CellValue,
                      format: string | undefined): ResultAsync<void,SpreadsheetDataError> {
  const curr = this.#content;
  const result = this.#eventLog.addEntry(
    { type: 'SetCellValueAndFormat', row, column, value, format}, curr.endSequenceId);

  return result.andTee(() => {
    ...
  }).mapErr((err): SpreadsheetDataError => {
    switch (err.type) {
      case 'ConflictError': return storageError(err.message, 409);
      case 'StorageError': return err;
    }
  });
}
```

* Easy to add an error mapping clause to the end of the existing chain and return the result
* Loading simple too.  Replaced `isComplete: boolean` property with `loadStatus: Result<boolean,StorageError>`. For now, just stash any error returned by `EventLog.Query` and bail out of the load process. Retry will happen on next sync. Can look at more complex retry logic later.

# Virtual Spreadsheet

* This is where it gets interesting. 
* Existing code consists of a helper function and a couple of event handlers when hitting `Enter` or `Tab` in edit mode. 

```ts
function commitFormulaChange(rowIndex: number, colIndex: number): boolean {
  const [value, format] = parseFormula(formula);
  const result = data.setCellValueAndFormat(rowIndex, colIndex, value, format);
  setDataError(result.isOk() ? null : result.error);
  return result.isOk();
}

...

case "Enter": { 
  if (commitFormulaChange(row, col)) {
    updateFormula(row, col, false); 
    setEditMode(false);
    nextCell(row,col,true,event.shiftKey);
  }
} 
break;

case "Tab": { 
  if (commitFormulaChange(row, col)) {
    updateFormula(row, col, false); 
    setEditMode(false);
    nextCell(row,col,false,event.shiftKey);
  }
  event.preventDefault();
} 
break;
```

* It's easy enough to mechanically change the code to handle the change to an asynchronous `setCellValueAndFormat`.
* Made the helper function async and stuck in an await.

```ts
async function commitFormulaChange(rowIndex: number, colIndex: number): Promise<boolean> {
  const [value, format] = parseFormula(formula);
  const result = await data.setCellValueAndFormat(rowIndex, colIndex, value, format);
  setDataError(result.isOk() ? null : result.error);
  return result.isOk();
}

case "Enter": { 
  void commitFormulaChange(row, col).then((ok) => { if (ok) {
    updateFormula(row, col, false); 
    setEditMode(false);
    nextCell(row,col,true,event.shiftKey);
  }})
} 
break;

case "Tab": { 
  void commitFormulaChange(row, col).then((ok) => { if (ok) {
    updateFormula(row, col, false); 
    setEditMode(false);
    nextCell(row,col,false,event.shiftKey);
  }})
  event.preventDefault();
}
break;
```

* Used explicit chaining in the event handler. There's bits of the original code, like `event.preventDefault()` that have to happen synchronously. The only bits that need to be async are the lines that deal with successful call to `commitFormulaChange`.
* Need to update unit tests to deal with async completion. The async code is all buried inside `VirtualSpreadsheet` so no promise to `await`.
* Turned out to be surprisingly easy. The React testing `act` function that ensures all state updates are applied and rendered before your assertions run has an [async version](https://legacy.reactjs.org/docs/testing-recipes.html#data-fetching) which also ensures that all promises have completed. 
* All I had to do was make the test function async and pass an async function to `act`.

```ts
  // Enter tries to commit changes, moves to next cell down and leaves edit mode
  // eslint-disable-next-line @typescript-eslint/require-await
  {await act(async () => {
    fireEvent.change(focusSink, { target: { value: "changed" }})
    fireEvent.keyDown(focusSink, { key: 'Enter' })
  })}
  expect(setCellValueAndFormatMock).lastCalledWith(1, 0, "changed", undefined)
  expect(focusSink).toHaveProperty("value", "");
  expect(name).toHaveProperty("value", "A3");
  expect(formula).toHaveProperty("value", "A3");
```

* Unfortunately this pattern triggers a false positive in eslint
* It runs and behavior looks exactly the same as before
* So why do I have these nagging feelings of unease?

# Artificial Delay

* I went back to `EventSourcedSpreadsheetData` and hacked in a few seconds delay

```ts
setCellValueAndFormat(row: number, column: number, value: CellValue,
                      format: string | undefined): ResultAsync<void,SpreadsheetDataError> {
  ...
  return result.map(() => delayPromise(undefined, 5000))
    .andTee(() => { ...
```

* The user experience is horrible
* Committing a change with `Tab` or `Enter` looks like nothing is happening. Automatic reaction is to press the key again, which results in a conflict error.
* Next instinct is to get unstuck by double clicking on another cell. Seems back to normal, you can even start making changes, which fail if you try to commit them. 
* Eventually the promise resolves, the original change appears and the focus cell jumps to the next cell after the one you originally edited.
* It's a mess.

# Asynchronous React

* Standard React model event -> state update -> render. Film strip analogy and image.
* State updates often described as async because you don't see the effect until render time. Yet another form of asynchronous API.
* Event handler always runs in context of what was last rendered. Any updates to state result in a render which also generates a new set of event handlers with updated bound state.
* Doesn't work with promises. May complete many state updates and renders later. Completely different context. Completion code tries to clean up for exiting edit mode. May not be in edit mode anymore. May have a completely different cell focused. Maybe opened a different data source.
* Any React app which interacts with a remote backend will run into this. What's the canonical way of dealing with asynchronous behavior?
* [Fetching data](https://react.dev/learn/synchronizing-with-effects#fetching-data) during rendering, `useEffect` cleanup to avoid race conditions. Lifetime of async request tied to next frame in film strip. I also found a [helpful blog post](https://www.developerway.com/posts/fetching-in-react-lost-promises) that covers this ground in more detail. 
* Nothing in main docs for case when you're using an async call to modify backend data, then if successful modifying state to match. 
* React 19 has some new features to better support async actions. Helpfully [starts off](https://react.dev/blog/2024/12/05/react-19#actions) with description of current best practice. The new features don't provide any radical changes, just slightly nicer and more concise ways to implement the existing idioms.
* Basic approach is to set some state, for example `isPending`, when creating the asynchronous request. Then clear it when the request completes. While `isPending` is true, disable the parts of the UI that depend on the pending data. For example, I could disable the edit fields in the spreadsheet and prevent changes of selected cell.
* Can make the application feel laggy and unpleasant to use. Alternative is to optimistically update the state, assuming the request will succeed. If the request eventually fails, put the state back the way it was and report the error as if you'd never shown the change. 
* Still need the `isPending` state. If you value your sanity, you'll prevent the user from committing another change while the previous is still pending and might need rolling back. The idea is to cover a bit of lag, not to provide a complete offline editing and reconciliation system.
* Which is the next place you could go, and where I want to get to eventually. That's not something I'm going to hack into my spreadsheet front end component. The idea there is to persistent changes to a local event log, e.g. in local storage, then synchronize them with a backend event log when network connectivity allows. With a whole sub-system to tell the user which of their changes have been rejected due to conflicting edits.