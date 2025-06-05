---
title: Asynchronous React
tags: frontend
thumbnail: /assets/images/frontend/react-icon.png
---

[Last time]({% link _drafts/asynchronous-spreadsheet-data.md %}), I naively updated my [spreadsheet frontend component]({% link _topics/react-spreadsheet.md %}) to use an asynchronous update API. Everything looked like it was working, until I added some latency to the API's response. The resulting user experience was terrible. 

The result from the API was applied to the UI based on the React state at the time the API was invoked. By the time the response was available, the state of the UI had changed so much that the update no longer made sense.

Let's do some research, and work out what I should have done. 

# State Updates May be Asynchronous

You often see the assertion that state updates in React are asynchronous. You can trace this back to the [legacy React documentation](https://legacy.reactjs.org/docs/state-and-lifecycle.html#state-updates-may-be-asynchronous). When you call `setState`, the current value of the state doesn't change. All updates are queued up and applied the next time the UI is rendered.

The behavior is asynchronous in a way, but not what most people think of when you say asynchronous today.

# State as a Snapshot

The current documentation uses [State as a Snapshot](https://react.dev/learn/state-as-a-snapshot) to describe this behavior. I like the movie frame analogy.

{% include candid-image.html src="/assets/images/frontend/react-state-as-snapshot.svg" alt="React State as a Snapshot" %}

Think of the state of your UI as a sequence of frames in a movie, with each render creating a new frame. Each frame is immutable once rendered. Changes triggered by events create a new state for the next frame and then render the UI to match.

Event handlers always run in the context of what was last rendered. Any updates to state result in a render which also generates a new set of event handlers with updated bound state.

This doesn't work well with asynchronous APIs. The API may complete many state updates and renders later. The code from my spreadsheet component looks like this. 

```ts  
  commitFormulaChange(row, col, editValue).then(() => {
    setFormula(row, col, editValue); 
    setEditMode(false);
    nextCell(row,col);
  }).catch(() => {
    setError(row,col);
  })
```

The `then` handler is running in a different context but using state from the time the API was invoked. The completion code updates the formula displayed in the current cell to match the updated value, turns off edit mode and moves to the next cell. However, by the time it runs we may not be in edit mode anymore. We may have a completely different cell selected. The user may have got fed up waiting and opened a different spreadsheet.

Any React app which interacts with a remote backend will run into this. So, what's the canonical way of dealing with truly asynchronous behavior?

# Fetching Data with Effects

The only thing I could find in the React documentation that really addresses this is [fetching data](https://react.dev/learn/synchronizing-with-effects#fetching-data) asynchronously. You're rendering some UI and need some data to populate it. The API used to retrieve the data is asynchronous so you use an [effect](https://react.dev/learn/synchronizing-with-effects) to synchronize the state with the API. 

```ts
useEffect(() => {
  let ignore = false;

  async function startFetching() {
    const json = await fetchTodos(userId);
    if (!ignore) {
      setTodos(json);
    }
  }

  startFetching();

  return () => {
    ignore = true;
  };
}, [userId]);
```

The provided example uses the effect's cleanup function to tie the lifetime of the asynchronous request to the current state. If the UI is rendered again with a different `userId` state, before the original request completes, the original response is ignored. The new render runs the effect again, which makes a new request with the new `userId`. 

This [blog post](https://www.developerway.com/posts/fetching-in-react-lost-promises) covers the ground in much more detail. It's all very interesting but not directly relevant for my problem because I'm not fetching data during a render. I'm mutating data and updating state to match in an event handler.

# Pending Update

Weirdly, for this use case, the only good description of best practice I could find was in the React 19 [new features blog post](https://react.dev/blog/2024/12/05/react-19). Helpfully, the post [starts off](https://react.dev/blog/2024/12/05/react-19#actions) with a description of current best practice. We'll look at the new features later.

The first pattern described uses an additional state variable to track whether there's a [pending update](https://react.dev/blog/2024/12/05/react-19#actions). Set an `isPending` flag before calling the asynchronous update API, then clear it when the request completes. While `isPending` is true, disable the parts of the UI that depend on the pending data. For example, I could disable the edit fields in my spreadsheet and stop the user from navigating to another cell. 

```ts
function spreadsheet() {
  const [isPending, setPending] = useState(false);

  function onEnter() {
    setPending(true);
    commitFormulaChange(row, col, editValue).then(() => {
      setFormula(row, col, editValue); 
      setEditMode(false);
      nextCell(row,col);
    }).catch(() => {
      setError(row,col);
    }).finally(() => {
      setPending(false);
    })
  }

  // Return JSX with edit and navigation disabled if isPending
}
```

The idea is to ensure that the current context when the request completes is still valid. In general, you block the UI from changing any state variables that the request depends on.

Unfortunately, this results in a UI that feels sticky and laggy if there's some latency, and like a prison if there's a longer delay.

# Optimistic Update

The alternative is to optimistically update the state, assuming the request will succeed. If the request eventually fails, put the state back the way it was and report the error as if you'd never shown the request succeeding. 

[Optimistic update](https://react.dev/blog/2024/12/05/react-19#new-hook-optimistic-updates) builds on pending update. You still need some `isPending` state. If you value your sanity, you'll prevent the user from committing another change while the previous is still pending and might need rolling back. The idea is to cover a bit of lag, not to provide a complete offline editing and reconciliation system.

```ts
function spreadsheet() {
  const [isPending, setPending] = useState(false);

  function onEnter() {
    setPending(true);

    setFormula(row, col, editValue);
    setEditMode(false);
    nextCell(row,col);

    commitFormulaChange(row, col, editValue).catch(() => {
      selectCell(row,col);
      setFormula(row,col,formula);
      setEditMode(true);
      setEditValue(editValue);
      setError(row,col);
    }).finally(() => {
      setPending(false);
    })
  }

  // Return JSX with edit disabled if isPending
}
```

Here, the way that state is captured when the API is invoked, makes it easy to reset everything in the error handler.

You can leave more of the UI enabled while in the pending state. In theory, allowing the user to do anything short of making another change. You hide the effects of normal latency, only blocking the user in the case of more serious problems. Works great in the usual case where updates generally succeed. If failures are common, the frequent rollbacks are jarring.

# Concurrent Rendering

Everything I've talked about so far is applicable from React 16.8 onwards, when hooks were first introduced. Before I get into newer features, I need to discuss concurrent rendering, [introduced in React 18](https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react).

Before React 18, rendering occurred as a single, uninterrupted, synchronous transaction. Once rendering starts, nothing can interrupt it until the results are visible. 

In contrast, with concurrent rendering, React can start rendering an update, pause in the middle, then continue later. It can render new screens in the background while the existing UI stays responsive, handling events and re-rendering. It can abandon in-progress renders that are no longer needed.

# External Store

My spreadsheet component uses the `useSyncExternalStore` hook. This allows me to implement a separate backing store for [spreadsheet data]({% link _posts/2024-09-30-react-spreadsheet-data-interface.md %}), independent of React, then easily bind it to my React component. 

I found `useSyncExternalStore` in the React [reference documentation](https://react.dev/reference/react/useSyncExternalStore). I didn't realize at the time, but `useSyncExternalStore` [only exists because of concurrent rendering](https://github.com/reactjs/rfcs/blob/main/text/0214-use-sync-external-store.md).

External stores need to implement a snapshot mechanism. React retrieves a snapshot of the current state of the store and uses it when rendering. I've always wondered about the lifetime of snapshots. Why do you need such a formal model of immutability? 

You don't really, unless React is using concurrent rendering. If there can be multiple renders in progress, suspending and resuming, then you absolutely do need some kind of snapshot system to ensure each render is operating on consistent data.

It turns out that all the new React 19 asynchronous update features depend heavily on concurrent rendering under the hood.

# Transitions

The React 19 new features blog presents the [`useTransition`](https://18.react.dev/reference/react/useTransition) hook as a more convenient way of implementing the pending update pattern. The hook returns an `isPending` flag which is `true` while the update is being applied, together with a `startTransition` function. You call `startTransition` in your event handler and pass it a function that applies the update and changes state to match. The big change for React 19 is that you can pass an async function to `startTransition`. 

```ts
function spreadsheet() {
  const [isPending, startTransition] = useTransition();

  function onEnter() {
    startTransition(async () => {
      try {
        await commitFormulaChange(row, col, editValue);
        setFormula(row, col, editValue); 
        setEditMode(false);
        nextCell(row,col);
      } catch {
        setError(row,col);
      }
    })
  }

  // Return JSX with edit and navigation disabled if isPending
}
```

There's also a `useOptimistic` [hook](https://react.dev/reference/react/useOptimistic) to support the optimistic update pattern. The hook returns a value based on normal state that can be overridden with an optimistic value during an update. Any optimistic values are reset when the next transition completes. 

```ts
function spreadsheet() {
  const [isPending, startTransition] = useTransition();
  const [optimisticFormula, setOptimisticFormula] = useOptimistic(formula);

  function onEnter() {
    setOptimisticFormula(editValue);
    setEditMode(false);
    nextCell(row,col);

    startTransition(async () => {
      try {
        await commitFormulaChange(row, col, editValue);
        setFormula(row, col, editValue); 
      } catch {
        selectCell(row,col);
        setEditMode(true);
        setEditValue(editValue);
        setError(row,col);
      }
    })
  }

  // Return JSX using optimisticFormula instead of formula. Disable navigation if isPending.
}
```

In the example above I'm only using an optimistic value for `formula`. The way I manage edit mode and cell selection make it simpler to implement optimistic updates by setting and restoring the state manually. Which makes me wonder, is it really worth adding the complexity of these additional abstractions for something that I can do easily do myself by manipulating state directly?

My initial assumption was that these are simple custom hooks that you could write for yourself. They actually rely heavily on concurrent rendering.

Calling `startTransition` triggers an immediate render with the existing state that returns `true` for the `isPending` flag. It then invokes the update function. Any changes made to state inside `startTransition` result in a concurrent background render which can be suspended and resumed as needed. The pending UI stays interactive with events processed and the UI rendered. Once the update completes, the state changes made inside `startTransition` become visible and the background render is applied to the DOM. 

The `useOptimistic` hook is designed to work with concurrent rendering and transitions. The optimistic value is used for the main render with the real value used for the transition's background render. You can also call the optimistic `set` function during the transition to provide progress updates visible in the main render.

The point is not to make it slightly easier to implement the classic pending and optimistic update patterns. The point is to use concurrent rendering to solve two different problems.
* Rendering complex UI updates in the background without blocking the main UI
* Batching together all state changes from a complex async process so that they all get shown together at the end. 

There's an awful lot going on here. Transitions is a complex feature with [interesting implications](https://www.developerway.com/posts/use-transition). The React documentation includes a long list of [caveats](https://react.dev/reference/react/useTransition#starttransition-caveats). Worryingly for me, there are more caveats when using transitions [with an external store](https://react.dev/reference/react/useSyncExternalStore#caveats).

If your changes are quick to render and it's easy to arrange for all state operations to happen at the end of your asynchronous update, then I'd steer clear of transitions. Simpler is better, right?

# Suspense

# Error Boundaries

# Custom Events

# Completion Handler

```ts
function spreadsheet() {
  const completionRef = React.useRef(handleCompletion);
  React.useEffect(() => { completionRef.current = handleCompletion });

  function handleCompletion(changeRow: number, changeCol: number) {
    updateFormula(changeRow, changeCol); 
    if (editMode && changeRow == row && changeCol == col) {
      setEditMode(false);
      nextCell(row,col);
    }
  }

  function onEnter() {
    commitFormulaChange(row, col).then({
      completionRef.current.handleCompletion(row, col);
    })
  }
}
```
