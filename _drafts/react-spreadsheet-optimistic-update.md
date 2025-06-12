---
title: >
  React Spreadsheet: Optimistic Update
tags: react-spreadsheet
---

I recently made my spreadsheet data interface [more explicitly asynchronous]({% link _posts/2025-06-09-asynchronous-spreadsheet-data.md %}). I naively [updated]({% link _topics/react-spreadsheet.md %}) `VirtualSpreadsheet` to use the new;y asynchronous `setCellValueAndFormat` API. After discovering that the user experience was horrible if there was any latency, I did a deep dive into [best practice]({% link _drafts/asynchronous-react.md %}) for handling asynchronous updates in React.

I decided that the optimistic update pattern was the best fit. Let's go try it out.

# Optimistic Update

The idea is simple. After calling `setCellValueAndFormat` we optimistically update the React state assuming that the update will succeed. If it eventually fails, put the state back the way it was and report the error as if you’d never shown the request succeeding.

The content displayed in each cell comes from the `SpreadsheetData` interface which I'm calling `setCellValueAndFormat` on. To display the updated value optimistically we need to add some React state to track the pending update.

```ts
interface PendingCellValueAndFormat {
  row: number, 
  column: number,
  value: CellValue,
  format?: string | undefined
};

  const [pendingCellValueAndFormat, setPendingCellValueAndFormat] = 
    useState<PendingCellValueAndFormat|null>(null);
```

The rendering function overrides the content for the updated cell if there's a pending update. It also adds an additional class name so that cells with pending updates can be styled differently.

```tsx
  let dataValue: CellValue = undefined;
  let value:string = "";
  let isPending = false;

  if (pendingCellValueAndFormat && pendingCellValueAndFormat.row == rowIndex && 
      pendingCellValueAndFormat.column == columnIndex) {
    dataValue = pendingCellValueAndFormat.value
    value = formatContent(dataValue, pendingCellValueAndFormat.format);
    isPending = true;
  } else if (rowIndex < dataRowCount && columnIndex < dataColumnCount) {
    dataValue = data.getCellValue(snapshot, rowIndex, columnIndex);
    const format = data.getCellFormat(snapshot, rowIndex, columnIndex);
    value = formatContent(dataValue, format);
  }

  // Add VirtualSpreadsheet_Cell__UpdatePending to classNames if isPending
  return <div className={classNames} style={style}>
    { value }
  </div>
```

Finally, I refactored how changes are committed so that all the optimistic update logic is in the `commitFormulaChange` async helper function. The event handlers for `Enter` and `Tab` are now one-liners.

```ts
async function commitFormulaChange(row: number, column: number, isVertical: boolean, 
                                    nextCellBackwards: boolean): Promise<void> {
  if (pendingCellValueAndFormat) {
    setDataError(storageError("Waiting for previous update to complete ..."));
    return;
  }

  // Optimistic update
  const [value, format] = parseFormula(formula);
  setEditMode(false);
  setDataError(null);
  nextCell(row, column, isVertical, nextCellBackwards);
  setPendingCellValueAndFormat({ row, column, value, format })

  const result = await data.setCellValueAndFormat(row, column, value, format);
  setPendingCellValueAndFormat(null);

  if (result.isOk()) {
    // In case we tried to commit while pending
    setDataError(null);
  } else  {
    // Update failed so put things back how they were at point of save
    setSelection(selection);
    setFocusCell(focusCell);
    setName(name);
    setEditMode(editMode);
    setFormula(formula);
    setCellValue(cellValue);

    setDataError(result.error);
  }
}
```

We start with a guard that prevents the user from making another change while an update is still pending. That's followed by the optimistic update itself. We disable edit mode, clear any existing errors, move to the next cell and initialize the pending state.

Now we can apply the update, `await` completion and when done clear the pending state.

Finally, we deal with the aftermath. If the update failed we put all the significant state back the way it was and set our error state. Notice how simple and formulaic the restore code is. The current state values are captured at the point that `setCellValueAndFormat` is called, so all we have to do is set the state back to these values. 

If you're not familiar with asynchronous TypeScript, you may need a double take before you realize this isn't a no-op. 

{% include candid-image.html src="/assets/images/react-spreadsheet/pending-update.png" alt="A pending update in progress" %}

I added a subtle yellow tint to show an in progress update. The UI remains fully responsive. You can select something else, or start editing the next cell. You'll get an error if you get too far ahead of yourself.

{% include candid-image.html src="/assets/images/react-spreadsheet/update-optimistic-update-pending.png" alt="Trying to update while a pending update is in progress" %}

If the pending update completes successfully, the error state is cleared and you can try again. If not, you're rolled back to the previous update to correct whatever you did wrong.

In my testing, with a reasonable 50ms latency, I was unable to edit cells fast enough to trigger the error.

# Delay Event Log

Now for some proper testing. I created `DelayEventLog`, a wrapper around any `EventLog` implementation that, strangely enough, adds a configurable delay to the response from each method. 

```ts
export class DelayEventLog<T extends LogEntry> implements EventLog<T> {
  constructor(base: EventLog<T>, delay: number=0) {
    this.#base = base;
    this.delay = delay;
  }

  delay: number;

  addEntry(entry: T, sequenceId: SequenceId): ResultAsync<void,AddEntryError> {
    return delayResult(this.#base.addEntry(entry, sequenceId), this.delay);
  }

  setMetadata(sequenceId: SequenceId, metadata: LogMetadata): ResultAsync<void,MetadataError> {
    return delayResult(this.#base.setMetadata(sequenceId, metadata), this.delay);
  }

  query(start: SequenceId | 'snapshot' | 'start', end: SequenceId | 'end'): ResultAsync<QueryValue<T>,QueryError> {
    return delayResult(this.#base.query(start, end), this.delay);
  }

  truncate(start: SequenceId): ResultAsync<void,TruncateError> {
    return delayResult(this.#base.truncate(start), this.delay);
  }

  #base: EventLog<T>;
}
```

The implementation of `delayResult` is interesting, if awkward. 

```ts
function delayPromise<T>(value: T, delay: number): Promise<T> {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), delay);
  })
}

function delayResult<T,E>(result: ResultAsync<T,E>, delay: number): ResultAsync<T,E> {
  const promiseLike = result.then<Result<T,E>,never>((r) => delayPromise(r, delay));
  return new ResultAsync(Promise.resolve(promiseLike));
}
```

It's easy enough to create a promise that resolves after a specified delay. Chaining it onto a `ResultAsync` is painful. You can use `map` to add it to the success path. However, `mapErr` doesn't accept a promise so you can't do the same for the error path. 

You have to use `ResultAsync.then` which returns a `PromiseLike`. Unfortunately, the `ResultAsync` constructor only accepts a `Promise`, so you need to convert between the two using `Promise.resolve`.

# Event Source Sync Story with Latency Controls

```ts
const eventLog = new SimpleEventLog<SpreadsheetLogEntry>;
const delayEventLogA = new DelayEventLog(eventLog);
const delayEventLogB = new DelayEventLog(eventLog);
const eventSourcedDataA = new EventSourcedSpreadsheetData(delayEventLogA);
const eventSourcedDataB = new EventSourcedSpreadsheetData(delayEventLogB);

type VirtualSpreadsheetPropsAndCustomArgs = VirtualSpreadsheetProps & { 
  eventSourceLatencyA?: number | undefined,
  eventSourceLatencyB?: number | undefined
};

const meta: Meta<VirtualSpreadsheetPropsAndCustomArgs> = { ... }
```

```ts
export const EventSourceSync: Story = {
  argTypes:{
    eventSourceLatencyA: {
      table: {
        category: "Network Simulation",
      },
      control: {
        type: 'number'
      }
    },
    eventSourceLatencyB: {
      table: {
        category: "Network Simulation",
      },
      control: {
        type: 'number'
      }
    },
  },
  render: ( {width: width, height: height, eventSourceLatencyA, 
             eventSourceLatencyB, data: _data, ...args} ) => {
    delayEventLogA.delay = eventSourceLatencyA || 0;
    delayEventLogB.delay = eventSourceLatencyB || 0;
    return <div>
      <VirtualSpreadsheet width={width} height={height} data={eventSourcedDataA} {...args}/>
      <div style={{ marginTop: 10, marginBottom: 10 }}>
        Shared Event Log, Sync every 10 seconds
      </div>
      <VirtualSpreadsheet width={width} height={height} data={eventSourcedDataB} {...args}/>
    </div>
  },
};
```

# Async Debug Hell

# JavaScript and Typescript Private Properties

# Fixing Sync

```ts
  private async syncLogsAsync(): Promise<void> {
    this.isInSyncLogs = true;

    // Set up load of first batch of entries
    const segment = this.content.logSegment;
    let isComplete = false;

    while (!isComplete) {
      const curr = this.content;
      const start = (segment.entries.length == 0) ? 'snapshot' : curr.endSequenceId;
      const result = await this.eventLog.query(start, 'end');

      if (curr != this.content) {
        // Must have had setCellValueAndFormat complete successfully and update content to match
        // Query result no longer relevant
        break;
      }

      // Process query results
      ...

      if (curr.loadStatus.isErr() || curr.loadStatus.value != isComplete) {
        // Careful, even if no entries returned, loadStatus may have changed
        this.content = { ...curr, loadStatus: ok(isComplete) }
        this.notifyListeners();
      }
    }

    this.isInSyncLogs = false;
  }
```

# Unit Tests

```ts
it('should handle delays', async () => {
  vi.useFakeTimers();

  const baseLog = new  SimpleEventLog<SpreadsheetLogEntry>;
  const log = new DelayEventLog(baseLog, 50000);
  const data = new EventSourcedSpreadsheetData(log);
  let subscribePromise = subscribeFired(data);

  // Subscribe should trigger new call to sync after 10 seconds while
  // initial sync in constructor is still waiting for query

  // Wait for the dust to settle, subscription should have fired
  await vi.runOnlyPendingTimersAsync();
  await subscribePromise;

  // Initial load should have completed, despite overlapping syncs
  const status = data.getLoadStatus(data.getSnapshot());
  expect(status.isOk() && status.value).toBe(true);

  // Set value, result available after time has elapsed, subscribe will trigger
  // a sync that happens before result is available. Should cope.
  const promise = data.setCellValueAndFormat(0, 0, 42, undefined);
  subscribePromise = subscribeFired(data);

  // When sync is triggered, make sure its processed before set complete.
  log.delay = 0;

  // Wait for the dust to settle, subscription should have fired, result should be available
  await vi.runOnlyPendingTimersAsync();
  await subscribePromise;

  const result = await promise;
  expect(result.isOk()).toBe(true);
  const snapshot = data.getSnapshot();
  expect(data.getRowCount(snapshot)).toEqual(1);
  expect(data.getCellValue(snapshot, 0, 0)).toEqual(42);
})
```

# Load Status

```ts
if (!dataError) {
  const status = data.getLoadStatus(snapshot);
  if (status.isErr()) {
    errorTagAlign = "end";
    errorTag = <div className={theme?.VirtualSpreadsheet_ErrorTag} style={{ zIndex: 2 }}>
      {status.error.message}
    </div>
  } else if (!status.value) {
    errorTagAlign = "end";
    errorTag = <div className={theme?.VirtualSpreadsheet_ErrorTag} style={{ zIndex: 2 }}>
      {"Loading ..."}
    </div>
  }
}
```

# Conflict Error

```ts
const result = this.eventLog.addEntry({ type: 'SetCellValueAndFormat', row, column, value, format}, curr.endSequenceId);
return result.andTee(() => {
  ...
}).mapErr((err): SpreadsheetDataError => {
  switch (err.type) {
    case 'ConflictError':
      if (this.content == curr) {
        // Out of date wrt to event log, nothing else has updated content since then, so set
        // status for in progress load and trigger sync.
        this.content = { ...curr, loadStatus: ok(false) }
        this.syncLogs();
      }
      return storageError("Client out of sync", 409);
    case 'StorageError': 
      return err;
  }
});
```

* "sequenceId not next sequence id"

```ts
if (dataError) {
  let message = dataError.message;
  if (dataError.type == 'StorageError' && dataError.statusCode == 409) {
    const status = data.getLoadStatus(snapshot);
    if (status.isOk()) {
      if (status.value)
        message = "Client was out of sync, review changes and try again";
      else
        message = "Client out of sync, loading ..."
    }
  }
}
```

# Try It!

# Conclusion

