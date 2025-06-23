---
title: >
  React Spreadsheet: Optimistic Update
tags: react-spreadsheet
---

I recently made my spreadsheet data interface [more explicitly asynchronous]({% link _posts/2025-06-09-asynchronous-spreadsheet-data.md %}). I naively updated `VirtualSpreadsheet` to use the newly asynchronous `setCellValueAndFormat` API. After discovering that the user experience was horrible if there was any latency, I did a deep dive into [best practice]({% link _posts/2025-06-16-asynchronous-react.md %}) for handling asynchronous updates in React.

I decided that the optimistic update pattern was the best fit. Let's go try it out.

# Optimistic Update

The idea is simple. After calling `setCellValueAndFormat`, we optimistically update the React state, assuming that the update will succeed. If it eventually fails, put the state back the way it was and report the error as if you’d never shown the request succeeding.

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

Finally, I refactored how changes are committed so that all the optimistic update logic is in the `commitFormulaChange` async helper function. The event handlers for `Enter` and `Tab` are now one-liners that call `commitFormulaChange`.

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

# Storybook Latency Controls

Armed with my new `DelayEventLog` "network simulation tool", I added custom latency controls to my `EventSourceSync` [Storybook]({% link _posts/2025-02-10-building-infinisheet-storybook.md %}) story. Each spreadsheet gets its own `DelayEventLog` and its own latency control. The controls only make sense for this story but annoyingly Storybook requires the corresponding custom args to be defined at the `VirtualSpreadsheet` component level.

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

Fortunately, the additional args are ignored in the Storybook UI if it can't find `argTypes` definitions for the args. These can be defined at the story level, together with a render method that sets the delay for each `DelayEventLog`.

{% raw %}

```tsx
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
       Shared Event Log ...
      </div>
      <VirtualSpreadsheet width={width} height={height} data={eventSourcedDataB} {...args}/>
    </div>
  },
};
```

{% endraw %}

With the controls docked to the side, you have a great playground for experimenting with the effects of network delays on synchronization between two clients.

{% include candid-image.html src="/assets/images/react-spreadsheet/storybook-event-source-sync-latency-controls.png" alt="Storybook Event Source Sync Latency Controls" %}

# Async Debug Hell

So, I started playing. It seemed to be working as I jumped between spreadsheet clients, making changes, watching them sync across, enjoying the improved UX given the latency. However, eventually I'd always reach a state where the two spreadsheets were out of sync, with missing updates. 

I opened up Chrome developer tools and added some breakpoints. Then immediately got stuck. I was trying to see the internal state of the two `EventSourcedSpreadsheetData` instances, and that of the `SimpleEventLog`. The internal properties simply weren't there. I threw in some `console.log` statements, nothing visible there either. 

# JavaScript and Typescript Private Properties

My classes use [JavaScript private properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties) for their internal properties. The ones with names that start with a `#`.

I didn't give the decision much thought. TypeScript has the `private` keyword that provides [compile time checking and enforcement](https://www.typescriptlang.org/docs/handbook/2/classes.html#caveats). More recent versions of JavaScript include native, runtime enforced, private properties. Recent versions of TypeScript support JavaScript private properties too. Clearly these are the future, and I should be using them.

There were a few annoyances. Most TypeScript code targets earlier versions of JavaScript. In this case TypeScript replaces the JavaScript private properties with a [polyfill](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap#emulating_private_members) based on a `WeakMap`. I had to remember to change the JavaScript target version in each of my projects to avoid this.

The syntax is plain ugly. Clearly the TypeScript syntax highlighter used by the blog thinks so too. It highlights each "#" in red, trying to tell me that I've made a mistake.

This debug problem was the final straw. I didn't bother working out what exactly was going on, I just ripped out the `#` properties and replaced them with `private`. In hindsight, I suspect that Storybook in dev mode was using the polyfill. Whatever, I've had enough.

I'm relying on TypeScript static type checking for everything else. Why would I need runtime enforcement of private properties anyway? If a client really needs to monkey patch access, let them. Why incur additional runtime overhead for something that clients almost certainly don't want?

# Snapshots to the Rescue

Once debugger access was restored, it didn't take me long to work out the problem. The `SimpleEventLog` content was fine. However, one of the in-memory log segments in `EventSourcedSpreadsheetData` had duplicate entries. 

Obviously that shouldn't happen. The inner loop of my sync implementation even checks that the response from each event log query is safe to append to the log segment.

```ts
const curr = this.content;
const start = (segment.entries.length == 0) ? 'snapshot' : curr.endSequenceId;
const result = await this.eventLog.query(start, 'end');

if (curr.endSequenceId != value.startSequenceId) {
  // Shouldn't happen unless we have buggy event log implementation
  throw Error(`Query returned ${value.startSequenceId}, expected ${curr.endSequenceId}`);
}
  
segment.entries.push(...value.entries);
```

Can you see the problem?

I assign the current snapshot to `curr` to reduce the amount of typing needed later. It's easy to forget that all kinds of things could have happened between the `await` on the query and execution resuming. In this case, a delayed `setCellValueAndFormat` call completed successfully and updated the in-memory log segment, creating a new snapshot. 

It was safe to add the query results to the old snapshot referenced by `curr`, but that's no longer the most recent snapshot when we resume. The fix was easy. Just bail out of the sync if the current snapshot has changed behind our back.

```ts
const result = await this.eventLog.query(start, 'end');

if (curr != this.content) {
  // Must have had setCellValueAndFormat complete successfully and update content to match
  // Query result no longer relevant
  break;
}
```

I'd [previously](({% link _posts/2025-06-09-asynchronous-spreadsheet-data.md %})) thought of the snapshot semantics in `SpreadsheetData` as a tax needed to be compatible with React's `useSyncExternalStore`. I now realize that they're hugely beneficial when it comes to dealing with asynchronous logic. It's a simple check to see whether anything has changed. If necessary, you can compare the previous and latest snapshot to decide how best to handle completion. 

While staring at this code, I found one other problem. I have an early out for any query which returns no log entries. I'd forgotten that the `loadStatus` might still need updating.

```ts
if (curr.loadStatus.isErr() || curr.loadStatus.value != isComplete) {
  // Careful, even if no entries returned, loadStatus may have changed
  this.content = { ...curr, loadStatus: ok(isComplete) }
  this.notifyListeners();
}
```

# Unit Tests

This is the kind of bug that screams for a unit test. It's an awkward thing to test manually. There's asynchronous logic combined with time delays. Can I turn that into a non-flaky unit test while retaining my sanity?

It turned out to be surprisingly easy. I enabled vitest's [fake timers](https://vitest.dev/guide/mocking.html#timers) to mock the time delays. I was delighted to find lots of handy utility methods for advancing the current time *and* triggering any dependent async completions. 

I used `runOnlyPendingTimersAsync` which advances time to trigger any timer completions in the event queue, but not any timers added subsequently. I can set up a scenario with overlapping operations, trigger the completion code and then check assertions.

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

`SpreadsheetData` provides a load status for each snapshot to determine whether data has completely loaded or whether there are any errors. I reused the existing error reporting infrastructure in `VirtualSpreadsheet` to report to the end user.

{% raw %}

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

{% endraw %}

# Conflict Error

The event log is used to detect conflicting updates. A conflict is reported if a client tries to add an entry to the log without having synced with the previous entry. If you're not aware of changes that other clients have made, how can you know that your change makes sense?

Until now, I just passed the event log error up the chain. Unfortunately, "sequenceId is not next sequence id" doesn't make much sense to the end user of a spreadsheet. Let's give them a more meaningful error message.

```ts
const result = this.eventLog.addEntry({ type: 'SetCellValueAndFormat', 
  row, column, value, format}, curr.endSequenceId);
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

We also use our trick of comparing snapshots to remediate the issue. If the snapshot hasn't changed since trying to add the entry, we know that our loaded data must be out of sync. We can set the `loadStatus` to incomplete and immediately trigger a sync. 

We can improve the experience again at the `VirtualSpreadsheet` level by combining the conflict error state from our previous call to `setCellValueAndFormat` with the current load status. 

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

Usually you'll see this.

{% include candid-image.html src="/assets/images/react-spreadsheet/out-of-sync-loading.png" alt="Out of sync error while loading" %}

Followed by this when all log entries have been loaded.

{% include candid-image.html src="/assets/images/react-spreadsheet/out-of-sync-try-again.png" alt="Out of sync error review changes and try again" %}

# Try It!

Visit the [Event Source Sync](https://www.thecandidstartup.org/infinisheet/storybook/?path=/story/react-spreadsheet-virtualspreadsheet--event-source-sync&args=eventSourceLatencyA:5000;eventSourceLatencyB:50) story. Or play with the embedded version right here. I've preconfigured the controls with 5000 ms of latency for the top spreadsheet, and 50 ms for the bottom.

{% include candid-iframe.html src="https://thecandidstartup.org/infinisheet/storybook/iframe.html?id=react-spreadsheet-virtualspreadsheet--event-source-sync&args=eventSourceLatencyA:5000;eventSourceLatencyB:50" width="100%" height="840" %}

* Edit a cell in the top spreadsheet and hit `Enter`. Wait for the pending update to complete (yellow highlight goes away).
* Edit another cell. This time don't wait. Edit a third cell straight away and see what happens when you press `Enter`.
* Edit some cells in the bottom spreadsheet. Try typing `a` and `Enter` over and over. Aim for 15 rows or so. Latency here is only 50 ms. See if you can make changes fast enough to trigger an error. I can't. 
* Wait for the changes to sync to the upper spreadsheet. Note the "Loading ..." progress message that appears after the first few entries are synced.
* Fill another column of cells in the bottom spreadsheet. Now quickly switch to the top spreadsheet and make a change before the sync completes. You should get a "Client out of sync, loading ..." error once the final change completes, switching to "Client was out of sync, review changes and try again" once the sync completes.
* Hit 'Enter' again. This time the change should complete.
* Now really stress it. Fill another column in the bottom spreadsheet, switch to the top and quickly change two cells one after the other. You should see a "Waiting for previous update to complete ..." error, then the second update rolled back because the first update failed with "Client out of sync", then things should proceed as before.
* Go nuts. Jump around. Change random stuff. The error messages should make sense. You should be able to make progress. And most importantly, you should end up with the same results in both spreadsheets when you're done. 

# Conclusion

I'm really happy with how things have ended up. I've simulated two clients interacting using a shared event log. The experience seems reasonable to me. There's lots more I could polish but at this point I think I have a good basis for further work.

