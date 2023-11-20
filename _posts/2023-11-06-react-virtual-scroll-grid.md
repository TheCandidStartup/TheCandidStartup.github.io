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

## JS vs JSX

[JSX](https://react.dev/learn/writing-markup-with-jsx) is a syntax extension to JavaScript heavily used by React. It lets you directly embed markup in JavaScript that looks very similar to HTML. When the JSX file is transpiled to JavaScript, the markup is replaced by JavaScript code that makes calls to [`React.createElement`](https://react.dev/reference/react/createElement). React uses elements as a lightweight way to describe UI. React then [updates the browser DOM]({{ vs_url | append: "#react-virtual-dom" }}) to match the UI defined by the elements. 

Looking more closely at `VirtualScroller.js` shows that it does indeed include JSX markup. Much of the front end tooling used with React doesn't care what extension you use for JSX. Clearly, Vite does. I renamed the file to `VirtualScroller.jsx` and the browser immediately updated.

{% include candid-image.html src="/assets/images/frontend/react-virtual-scroll-copy-paste.png" alt="React Virtual Scroll Copy and Pasted into Vite project" %}

It works! Now to do a production build so that you can try it out for yourselves. 

## TypeScript Strict Linting

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

Oh dear. In development mode, Vite just transpiles TypeScript to JavaScript without any linting. The assumption is that your IDE will warn you of errors as you edit, while Vite should concentrate on reloading as fast as possible. And to be fair, VS Code did have some squiggly warning underlines that I'd ignored in my excitement. 

When you do a production build, you get the full range of checks. By default, Vite projects are setup with strict TypeScript linting turned on. After all, if you're creating a new TypeScript project, you want to do it properly. I thought about turning strict typing off, but that seems like a mistake. I want to use TypeScript and here's some clear encouragement to go ahead and do it. 

## Adding Type Annotations

I started off with the minimal changes needed to get the code to compile. At some point, I will need to convert `VirtualScroller` to TypeScript. I quickly worked out that now is not the time. Renaming the file with a `.tsx` extension resulted in many more errors. I got nowhere trying to fix them. I clearly need a much better understanding of the TypeScript and React data models. For now, I tell the TypeScript compiler to ignore errors from the import. 

```
// @ts-ignore
import VirtualScroller from './VirtualScroller'
```

The other three errors were easy to fix by adding type annotations. The VirtualScroller component abstracts away the details of how a row of data is represented via the getData function, and how a row is described as React elements via the rowTemplate function. The only constraint is that getData returns an array of items which VirtualScroller will call [`map()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) on, passing in the rowTemplate function. 

```
const getData = (offset: number, limit: number):any[] => {
  ...
}

const rowTemplate = (item: any) => (
  ...
)
```

## Try It!

And here it is, a basic React based virtual scrolling implementation. Go ahead and try it out. I'm curious if you'll notice the same problems I did. 

{% include candid-iframe.html src="/assets/dist/react-basic-virtual-scroll/index.html" width="100%" height="fit-content" %}

If you scroll a page at a time by clicking in the scroll bar above or below the handle, it works perfectly. You see a scroll animation that shows you how the content is moving. New items scroll seamlessly into view. Now try grabbing the scroll handle and moving it around. The content flickers or goes blank for a few seconds, then updates when you stop moving. 

## Theories

The VirtualScroller [uses a fixed size viewport container that scrolls over a child container]({{ vs_url | append: "#virtual-scrolling-implementation-in-react" }}). The child contains the currently loaded rows sandwiched between two padding containers that represent the unloaded virtualized rows. When the [scroll event](https://developer.mozilla.org/en-US/docs/Web/API/Element/scroll_event) on the viewport container is raised, the component updates the React state which triggers a React render that creates the rows that have scrolled into view. 

The scroll event is triggered *after* the browser has scrolled the existing DOM content. Everything works as long as the component updates the DOM to create the newly visible rows *before* the browser schedules a render. It looks like, when you scroll fast and far, the render happens before the DOM is updated. The blank content is one of the padding containers being scrolled into view before the control eventually catches up. 

Why does it happen? No idea. I added some console logging on the key functions and confirmed that every time a scroll event is triggered it's immediately followed by a React [render and commit](https://react.dev/learn/render-and-commit). 

Annoyingly, if I set breakpoints using the browser development tools, it happens every time. Doesn't matter how I trigger the scroll, the padding container scrolls into view and the browser stops at the breakpoint. Even weirder, I can carry on scrolling, and the existing DOM content scrolls up and down, all while JavaScript execution is stopped on a breakpoint.

Modern browsers use a [multi-threaded architecture]({{ vs_url | append: "#chrome-renderingng-architecture" }}) where large parts of the rendering pipeline run off the main JavaScript thread. In particular, scrolling is called out as something that can operate without touching the main thread at all. Does that mean there's some kind of race condition and the child container can be scrolled and the page re-painted before the scroll event has triggered?

## Next Time

I need to dive [down the rabbit hole]({% link _posts/2023-11-13-react-virtual-scroll-grid-2.md %}), get a better understanding of browser and react rendering, and see whether there's some way of fixing it, or whether I need a completely different approach.
