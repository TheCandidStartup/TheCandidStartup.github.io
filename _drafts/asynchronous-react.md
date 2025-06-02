---
title: Asynchronous React
tags: frontend
thumbnail: /assets/images/frontend/react-icon.png
---

wise words

# Asynchronous React

{% include candid-image.html src="/assets/images/frontend/react-state-as-snapshot.svg" alt="React State as a Snapshot" %}

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
