---
title: React Virtual Scroll Grid
tags: frontend
---

{% capture vs_url %}{% link _posts/2023-10-09-paged-infinite-virtual-scrolling.md %}{% endcapture %}
[Last time]({% link _posts/2023-10-23-bootstrapping-vite.md %}), I bootstrapped Vite and scaffolded a React+Typescript project from a template. The observant amongst you will have noticed that I called the project "react-virtual-scroll-grid". It may have had React in it, but there was no sign of any [virtual scrolling grid]({{ vs_url }}). 

I have a plan. I need a virtual scrolling grid control for my [spreadsheets project]({% link _topics/spreadsheets.md %}). Let's try and build one as a learning exercise. I can use the React [implementation](https://github.com/dhilt/react-virtual-scrolling) from "[Virtual scrolling: Core principles and basic implementation in React](/https://blog.logrocket.com/virtual-scrolling-core-principles-and-basic-implementation-in-react/)" as a starting point. Once I have something working in React, I can try the same exercise with other frameworks. Compare and contrast. 

## Copy and Paste

The implementation consists of [VirtualScroller.js](https://github.com/dhilt/react-virtual-scrolling/blob/basics/basics/src/VirtualScroller.js), the virtual scrolling component, together with a [sample app](https://github.com/dhilt/react-virtual-scrolling/blob/basics/basics/src/index.js) and [style sheet](https://github.com/dhilt/react-virtual-scrolling/blob/basics/basics/src/style.css). The code is three years old at time of writing and the app scaffold is different from what I have. I vaguely remember seeing something about changes in the latest versions of React. The instantiation of the virtual scroller component is obvious enough.

```
const AppComponent = () => (
  <VirtualScroller className="viewport" get={getData} settings={SETTINGS} row={rowTemplate}/>
)
```

So I copied the relevant line into the corresponding place in my `App.tsx`, replacing the existing boiler plate page. 

```
function App() {
  return (
    <>
      <div>
        <VirtualScroller className="viewport" get={getData} settings={SETTINGS} row={rowTemplate}/>
      </div>
    </>
  )
}
```

I then copied over the the import of `VirtualScroller` and the dependent definitions of `getData`, `SETTINGS` and `rowTemplate`. All that remained was to add the contents of their style sheet to `App.css` and drop `VirtualScroller.js` into the project. I saved everything and my browser instantly updated.

{% include candid-image.html src="/assets/images/frontend/vite-parse-error.png" alt="Vite Parse Error after dropping VirtualScroller.js into the project" %}

[JSX](https://react.dev/learn/writing-markup-with-jsx) is a syntax extension to JavaScript heavily used by React. It lets you directly embed markup in JavaScript that looks very similar to HTML. When the JSX file is transpiled to JavaScript, the markup is replaced by JavaScript code that makes calls to [`React.createElement`](https://react.dev/reference/react/createElement). React uses elements as a light weight way to describe UI. React then [updates the browser DOM]({{ vs_url | append: "#react-virtual-dom" }}) to match the UI defined by the elements. 

Looking more closely at `VirtualScroller.js` shows that it does indeed include JSX markup. Much of the front end tooling used with React doesn't care what extension you use for JSX. Clearly, Vite does. I renamed the file to `VirtualScroller.jsx` and the browser immediately updated.

{% include candid-image.html src="/assets/images/frontend/react-virtual-scroll-copy-paste.png" alt="React Virtual Scroll Copy and Pasted into Vite project" %}

I was going to show you the live control embedded in an iframe, but the project wouldn't build due to typescript errors. By default, Vite projects are setup with strict linting turned on. 

```
src/App.tsx:2:29 - error TS7016: Could not find a declaration file for module './VirtualScroller'. '/Users/tim/GitHub/react-virtual-scroll-grid/src/VirtualScroller.jsx' implicitly has an 'any' type.

2 import VirtualScroller from './VirtualScroller'
                              ~~~~~~~~~~~~~~~~~~~

src/App.tsx:13:18 - error TS7006: Parameter 'offset' implicitly has an 'any' type.

13 const getData = (offset, limit) => {
                    ~~~~~~

src/App.tsx:13:26 - error TS7006: Parameter 'limit' implicitly has an 'any' type.

13 const getData = (offset, limit) => {
                            ~~~~~

src/App.tsx:26:21 - error TS7006: Parameter 'item' implicitly has an 'any' type.

26 const rowTemplate = item => (
                       ~~~~
```
