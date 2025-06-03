---
title: Asynchronous React
tags: frontend
thumbnail: /assets/images/frontend/react-icon.png
---

[Last time]({% link _drafts/asynchronous-spreadsheet-data.md %}), I naively updated my spreadsheet frontend component to use an asynchronous update API. Everything looked like it was working, until I added some latency to the API's response. The resulting user experience was terrible. 

Let's do some research, and work out what I should have done. 

# State Updates May be Asynchronous

* State updates often described as async because you don't see the effect until render time. Yet another form of asynchronous API.

# State as a Snapshot

{% include candid-image.html src="/assets/images/frontend/react-state-as-snapshot.svg" alt="React State as a Snapshot" %}

* Standard React model event -> state update -> render. Film strip analogy and image.

* Event handler always runs in context of what was last rendered. Any updates to state result in a render which also generates a new set of event handlers with updated bound state.
* Doesn't work with promises. May complete many state updates and renders later. Completely different context. Completion code tries to clean up for exiting edit mode. May not be in edit mode anymore. May have a completely different cell focused. Maybe opened a different data source.
* Any React app which interacts with a remote backend will run into this. What's the canonical way of dealing with asynchronous behavior?

# Fetching Data with Effects

* [Fetching data](https://react.dev/learn/synchronizing-with-effects#fetching-data) during rendering, `useEffect` cleanup to avoid race conditions. Lifetime of async request tied to next frame in film strip. I also found a [helpful blog post](https://www.developerway.com/posts/fetching-in-react-lost-promises) that covers this ground in more detail. 
* Not relevant for my problem because I'm not fetching data during a render, I'm mutating data and updating state to match in an event handler.

# Pending Update

* Weirdly, the only good description of best practice I could find was in the React 19 [new features blog post](https://react.dev/blog/2024/12/05/react-19).
* Nothing in main docs for case when you're using an async call to modify backend data, then if successful modifying state to match. 
* React 19 has some new features to better support async actions. Helpfully [starts off](https://react.dev/blog/2024/12/05/react-19#actions) with description of current best practice. The new features don't appear to provide any radical changes, just slightly nicer and more concise ways to implement the existing idioms.
* The first pattern is to track whether there's a [pending update](https://react.dev/blog/2024/12/05/react-19#actions) using state. Set a pending flag true before invoking the asynchronous action and then clear it when complete.
* Basic approach is to set some state, for example `isPending`, when creating the asynchronous request. Then clear it when the request completes. While `isPending` is true, disable the parts of the UI that depend on the pending data. For example, I could disable the edit fields in the spreadsheet and prevent changes of selected cell.
* Use the pending flag to lock down the UI. For example, disabling buttons and input fields until the outcome of the update is unknown.
* Which results in a UI that feels sticky and laggy if there's any latency.

# Optimistic Update

* Can make the application feel laggy and unpleasant to use. Alternative is to optimistically update the state, assuming the request will succeed. If the request eventually fails, put the state back the way it was and report the error as if you'd never shown the change. 
* [Optimistic update](https://react.dev/blog/2024/12/05/react-19#new-hook-optimistic-updates) builds on pending update. The difference is that the UI is rendered as if the update had succeeded immediately. If the update fails, you roll back to the previous state and display an error.
* Still need the `isPending` state. If you value your sanity, you'll prevent the user from committing another change while the previous is still pending and might need rolling back. The idea is to cover a bit of lag, not to provide a complete offline editing and reconciliation system.
* Which is the next place you could go, and where I want to get to eventually. That's not something I'm going to hack into my spreadsheet front end component. The idea there is to persistent changes to a local event log, e.g. in local storage, then synchronize them with a backend event log when network connectivity allows. With a whole sub-system to tell the user which of their changes have been rejected due to conflicting edits.
* You can usually unlock more of the UI while you wait for the update to complete. In principle, you could allow the user to navigate elsewhere and start making another change, blocking them only if they try to commit the next update before the previous one is complete.
* You hide the effects of normal latency, only blocking the user in the case of more serious problems.

# Concurrent Rendering

* Everything I've talked about so far is applicable from React 16.8 onwards, when hooks were first introduced.
* Before I get into newer features, I need to discuss concurrent rendering, introduced in React 18.

# External Store

* Found `useSyncExternalStore` in the React reference documentation and thought it would be the perfect abstraction for my `SpreadsheetData` interface. Let's me keep representation of spreadsheet data separate from frontend code and without any dependency on React.
* Turns out that `useSyncExternalStore` [only exists because of concurrent rendering](https://github.com/reactjs/rfcs/blob/main/text/0214-use-sync-external-store.md).
* Always wondered about lifetime of snapshots. Why do you need such a formal model of immutability? You don't really, unless React is using concurrent rendering. If there can be multiple renders in progress, suspending and resuming then you absolutely do need some kind of snapshot model to ensure each render is operating on consistent data.
* Turns out that all the other new features that are presented as minor improvements to asynchronous best practices depend heavily on concurrent rendering under the hood.

# Transitions

* Described as a more convenient way of implementing the pending update pattern.
* Introduces the `useTransition` hook. It returns an `isPending` flag which is `true` while the update is being applied, together with a `startTransition` function. You call `startTransition` in your event hook and pass it a function that applies the update and changes state to match. 

```ts
EXAMPLE HERE
```

* Initial assumption is that this is a simple custom hook that you could write for yourself.
* It actually relies heavily on concurrent rendering. It first triggers an immediate render with the existing state that returns `true` for the `isPending` flag. It then invokes the update. Any changes made to start inside `startTransition` result in a concurrent background render which can be suspended and resumed as needed. The pending UI stays interactive with events processed and the UI rendered. Once the update completes, the results of the background render are merged in.

# Suspense

# Error Boundaries

# Actions

* React 19 documentation has been overhauled to introduce "*Actions*" as a first class concept.
