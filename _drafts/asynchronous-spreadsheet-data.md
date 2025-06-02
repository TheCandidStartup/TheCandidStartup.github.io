---
title: Asynchronous Spreadsheet Data
tags: infinisheet
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
  setCellValueAndFormat(row: number, column: number, value: CellValue, 
    format: string | undefined): ResultAsync<void,SpreadsheetDataError>
}
```

The changes to the interface are simple enough. I added a new method that returns the status of data loading when a given snapshot was created. The data is either completely loaded, partially loaded and in progress, or has an error.

The other change looks even simpler. I changed the return type of `setCellValueAndFormat` from `Result` to `ResultAsync`.

# Breaking Change

Obviously this is a breaking change. I first updated all my other implementations of `SpreadsheetData`. All very straight forward with some nice demonstrations of NeverThrow's `Result` and `ResultAsync` [chaining methods]({% link _posts/2025-05-19-asynchronous-typescript.md %}). 

```ts
export class LayeredSpreadsheetData implements SpreadsheetData<LayeredSnapshot> {
  getLoadStatus(snapshot: LayeredSnapshot): Result<boolean,StorageError> {
    const content = asContent(snapshot);
    return this.#base.getLoadStatus(content.base).andThen(
      (t1) => this.#edit.getLoadStatus(content.edit).map((t2) => t1 && t2));
  }

  setCellValueAndFormat(row: number, column: number, value: CellValue, 
    format: string | undefined): ResultAsync<void,SpreadsheetDataError> {
    const result = this.#base.isValidCellValueAndFormat(row, column, value, format);
    return result.asyncAndThen(
      () => this.#edit.setCellValueAndFormat(row, column, value, format));
  }
}
```

All the corresponding unit tests needed updating too. As [previously]({% link _posts/2025-05-26-asynchronous-event-log.md %}) when changing a method from synchronous to asynchronous, it just involved making the unit test function async and adding `await` before any call to `setCellValueAndFormat`.

# Event Sourced Spreadsheet Data

Now for the point of making these changes. I have a way to provide access to any backend error encountered when loading data. 

```ts
  const result = await this.#eventLog.query(start, 'end');

  if (!result.isOk()) {
    this.#content = { ...curr, loadStatus: err(result.error)};
    this.#notifyListeners();
    break;
  }
```

I've replaced the `EventSourcedSnapshotContent.isComplete: boolean` property with `loadStatus: Result<boolean,StorageError>`. For now, I just stash any error returned by `EventLog.Query` and bail out of the load process. Retry will happen on the next scheduled sync. I can look at more complex retry logic later.

I can also now return errors from asynchronous calls to store data.

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

All I had to do was add an error mapping clause to the end of the existing call chain and return the result rather than ignoring it. 

# Virtual Spreadsheet

This is where it gets interesting. The existing code that calls `setCellValueAndFormat` consists of a helper function and a couple of event handlers when hitting `Enter` or `Tab` in edit mode. 

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

It's easy enough to mechanically change the code to handle the change to an asynchronous `setCellValueAndFormat`. I made the helper function async and stuck in an `await`.

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

I used explicit chaining in the event handler rather than making the whole thing async too. There's bits of the original code, like `event.preventDefault()`, that have to happen synchronously. The only bits that need to be async are the lines that deal with the successful call to `commitFormulaChange`.

The next step was to update the unit tests to deal with async completion. The async code is all buried inside `VirtualSpreadsheet` so there's no promise to `await`.

It turned out to be surprisingly easy, once I discovered how to do it. The React testing `act` function, that ensures all state updates are applied and rendered before your assertions run, has an [async version](https://legacy.reactjs.org/docs/testing-recipes.html#data-fetching) which also ensures that all promises have completed. 

All I had to do was make the test function async and pass an async function to `act`.

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

Unfortunately, this pattern triggers a false positive in an eslint rule, which I'm disabling each time. 

My sample app and Storybook stories just work. Everything runs and appears to have exactly the same behavior as before. So why do I have these nagging feelings of unease?

# Artificial Delay

I went back to `EventSourcedSpreadsheetData` and hacked in a few seconds of latency into the `setCellValueAndFormat` success path.

```ts
setCellValueAndFormat(row: number, column: number, value: CellValue,
                      format: string | undefined): ResultAsync<void,SpreadsheetDataError> {
  ...
  return result.map(() => delayPromise(undefined, 5000))
    .andTee(() => { ...
```

My suspicions were justified. The user experience is horrible.

When you commit a change with `Tab` or `Enter` it looks like nothing has happened. You're still in edit mode, there's no sign that the change has been applied. The automatic reaction is to press the key again. Unfortunately, if you do that, you get a conflict error. The entry has been added to the log, but the in-memory representation in `EventSourcedSpreadsheetData` hasn't been updated yet. Until it has, you'll get errors.

{% include candid-image.html src="/assets/images/infinisheet/async-error.png" alt="Conflict error after pressing Enter twice" %}

You appear to be stuck. The next automatic reaction is to get yourself unstuck by double clicking on another cell. The error is cleared, everything seems to be back to normal, but of course any change you try to make keeps failing. 

Eventually the initial change completes, the spreadsheet updates to show the change and the post commit logic runs. The focus cell jumps to the next cell after the one you originally edited.

It's a mess.

# Next Steps

I've got all sorts of ideas of things I could do, but no real sense for what would work best. It's time for some more research. How do other React apps handle asynchronous completions?

We'll do a deep dive next time.
