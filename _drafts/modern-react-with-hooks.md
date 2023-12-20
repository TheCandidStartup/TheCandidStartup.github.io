---
title: Modern React With Hooks
tags: frontend
---

I first came across the phrase "[modern React with Hooks](https://react.dev/blog/2023/03/16/introducing-react-dev#going-all-in-on-modern-react-with-hooks)" when reading the React team's [blog post](https://react.dev/blog/2023/03/16/introducing-react-dev) that introduced the [new React documentation site](https://react.dev/). The documentation had been completely rewritten to focus on modern React, with any mention of class components relegated to a [legacy API reference section](https://react.dev/reference/react/Component). 

My preferred learning style is to dive into source code, see what I can figure out, then start googling when I see something I don't understand. For React, I looked at a [simple sample](https://github.com/dhilt/react-virtual-scrolling)  of how to implement [virtual scrolling]({% link _posts/2023-10-09-paged-infinite-virtual-scrolling.md %}), and two mature libraries that implemented virtual scrolling, [react-window](https://github.com/bvaughn/react-window) and [react-virtualized](https://github.com/bvaughn/react-virtualized). 

All of them used class components. Had I been wasting my time, figuring out the old way to use React? I'm about to start implementing my own React [virtual scroll grid control]({% link _posts/2023-12-04-react-virtual-scroll-grid-5.md %}). I need to figure out what modern react is all about before I start.

## Class Components

What had I learnt from looking at class components? Here's the most significant parts of the [virtual scrolling sample](https://github.com/dhilt/react-virtual-scrolling/blob/basics/basics/src/VirtualScroller.js) that I first looked at. 

```
class Scroller extends Component {
  constructor(props) {
    super(props)
    this.state = setInitialState(props.settings)
    this.viewportElement = React.createRef()
  }
  
  componentDidMount() {
    this.viewportElement.current.scrollTop = this.state.initialPosition
    if (!this.state.initialPosition) {
      this.runScroller({ target: { scrollTop: 0 } })
    }
  }

  runScroller = ({ target: { scrollTop } }) => {
    // Calculate top and bottom padding and retrieve data
    ...

    this.setState({
      topPaddingHeight,
      bottomPaddingHeight,
      data
    })
  }

  render() {
    const { viewportHeight, topPaddingHeight, bottomPaddingHeight, data } = this.state
    return (
      <div
        className="viewport"
        ref={this.viewportElement}
        onScroll={this.runScroller}
        style={{ '{{' }} height: viewportHeight }}>
        <div style={{ '{{' }} height: topPaddingHeight }}></div>
        {
          data.map(this.props.row)
        }
        <div style={{ '{{' }} height: bottomPaddingHeight }}></div>
      </div>
    )
  }
}
```

Pieces of UI are represented as components. React provides a component base class which you extend to create your own components. The base component has a set of methods which you override to define your component's behavior. There's a `render` method which is called to describe how your UI looks and a `componentDidMount` method which is called after an instance of your component has been created. The sample also defines a `runScroller` method which is subscribed to scroll events. 

There's lots of conventions around how member variables are managed. All arguments to the component constructor are passed in a `props` object. Most of the other member variables are in a big structure called `state`. The `runScroller` method updates the state in response to scroll events and the `render` method describes what the UI should look like using a mixture of `props` and `state`.

There's one normal looking member variable, viewportElement, which is the most special case of the lot. It's some kind of special `Ref` type provided by React. It looks like it acts as a reference to the HTML viewport element that is eventually created using the data returned by the `render` method.

## React Mental Model

Time to fill in the blanks and form a mental model of what React is doing. The links in this section are all to the [old React docs](https://legacy.reactjs.org/docs/getting-started.html), as they made more sense to me at the time. 

Let's start with the render method. Whatever's being returned doesn't look like JavaScript to me. It's [JSX](https://legacy.reactjs.org/docs/introducing-jsx.html), a syntax extension for JavaScript. You need to run your code through a transpiler to [convert the JSX into regular JavaScript](https://legacy.reactjs.org/docs/jsx-in-depth.html) that builds up a data structure using `React.createElement` calls. The render method describes the desired UI using a [tree of element instances](https://legacy.reactjs.org/docs/rendering-elements.html). Instances of your components are created by React based on the JSX rendered by their parents. The attributes and children of each element in the JSX are [passed to your component instance](https://legacy.reactjs.org/docs/components-and-props.html#rendering-a-component) as `props`. 

Props are controlled by the parent element and are [read-only](https://legacy.reactjs.org/docs/components-and-props.html#props-are-read-only). Mutable and private member variables need to be managed as [state](https://legacy.reactjs.org/docs/state-and-lifecycle.html). In order to update the UI, your components need to change their state. React responds to the change by re-rendering the component and all its children. If a child component inherits from `PureComponent` rather than `Component`, it will [only be re-rendered if its props have changed](https://legacy.reactjs.org/docs/optimizing-performance.html#examples). React compares the current and previous element tree to [work out](https://legacy.reactjs.org/docs/reconciliation.html) what updates need to be made to the DOM. 

As suspected, [Refs](https://legacy.reactjs.org/docs/refs-and-the-dom.html) provide a way to access the HTML DOM elements created by React based on the React elements returned by `render`. You add a ref attribute to the appropriate element in your JSX and React updates the corresponding member variable. You can also use refs to [access](https://legacy.reactjs.org/docs/refs-and-the-dom.html#accessing-refs) React components created as a result of rendering. 

Apart from the funny member variable conventions and the funky [JSX](https://legacy.reactjs.org/docs/introducing-jsx.html) syntax used in `render`, this all looks very familiar to me. I've been coding in an object oriented style for 30 years, mostly in C++ and C#. React fits neatly into the UI widget library box.  

## Thinking in React

Which shows how superficial my understanding was. I was thinking of React as a widget library with a really convoluted way of updating the UI. My own fault for focusing on mechanism rather than intent. 

Let's have another look at the new React docs, and in particular the "[Thinking in React](https://react.dev/learn/thinking-in-react)" page in the Quick Start section. Mockup how your UI should look, break it down into a hierarchy of components, build a static version using simple functional React components, work out what local state each component needs and add event handlers to update the state.

Still feels object oriented, but now the objects are hidden behind a functional facade. Is modern React just a widget library with a really convoluted way of building an object hierarchy that has a really convoluted way of updating the UI?

{% include candid-image.html src="/assets/images/frontend/react-data-flow.svg" alt="React Data Flow" %}

There are hints of something more going on. The data flow is interesting. Each component is controlled by *props* passed in by its parent and in turn controls the *props* passed to any child components. More than that, each component controls what children it has, the number of children and their types, not just the arguments passed to them. It's very malleable, you could change the whole structure on every render if you wanted. 

The discussion of *props* vs *state* is illuminating. I like the process of thinking about the pieces of data in the sample application and excluding all the things that are **NOT** state. You should have the minimum amount of state possible. 
* Does it remain unchanged over time? Not state. 
* Is it passed in from a parent via props? Not state. 
* Can you compute it based on existing state or props? Not state.

Data flows downwards. There's an idempotent, even immutable feel to the system. The rendered UI is entirely dependent on the current state and input props. Render a component as many times as you like, change parts of the state in whatever order you like, the end result should be the same. 

Props can be values or functions. Function props allow updates to flow upwards. A button component might have a function prop that should be called whenever the button is clicked. Its parent component can pass down a function that updates the parent's state. Or it could pass down a function that it receives as an input prop from a distant ancestor. 

Now I'm starting to feel nervous again. In my experience, most UI frameworks run into trouble when you start changing things. You run into race conditions, seemingly impossible logic states, unreproducible bugs. There's data flowing cleanly down the hierarchy and then you introduce loops in the flow triggered by events. 

Don't worry, you just need to adjust your mental model. [State behaves like a snapshot](https://react.dev/learn/state-as-a-snapshot). When you change state, you're asking React to re-render the UI based on a different state. It doesn't change the current state immediately. State stays consistent while the UI is rendered *and* while events are processed, until the next render is triggered. 

{% include candid-image.html src="/assets/images/frontend/react-state-as-snapshot.svg" alt="React State as a Snapshot" %}

Think of the state of your UI as a sequence of frames in a film, with each render creating a new frame. Each frame is immutable once rendered. Changes triggered by events create a new state for the next frame and then render the UI to match.

Conceptually at least. Behind the scenes, React is mutating the DOM to match the current rendered UI and managing a hierarchy of component instances that mutate and persist from frame to frame. As long as you follow the rules, everything will be fine. Unfortunately, there's lots of ways you can shoot yourself in the foot.

## Function vs Class Components

Class components are [particularly prone to problems](https://overreacted.io/writing-resilient-components/). The rules on proper use of props and state are simply conventions that you are encouraged to follow. It's easy to leave the path of success, especially if you're used to normal object oriented idioms. 

Props are passed to your constructor. You might assume that some or all of the props are configuration fixed for the life of the component instance. Not so. Props can be changed whenever the parent component re-renders. It's up to React's reconciliation algorithm to decide whether it creates a new component instance or changes the props on an existing instance. 

You may remember that props are read only within a component. It's common to copy props values into your state so that you can change them later. The virtual scrolling code I looked at initially does exactly this. That causes two problems if the props change. First, you might end up ignoring the change. If you add the extra code needed to handle [updating your derived state](https://legacy.reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html), you are likely to introduce race conditions by having two sources of truth.

Your `render` method should be a pure function with the output entirely determined by the input props and state. In a class component, `render` has access to the component instance's `this` pointer. You will be tempted to use that power. So much so, that by default React assumes that render is **NOT** a pure function. You have to explicitly derive from [PureComponent](https://react.dev/reference/react/PureComponent) to tell React that you're following the rules.

Async code, such as function props invoked as event handlers, can have subtle errors. Remember the conceptual model of frames in a film? Events triggered in one "frame" of the UI should execute their logic based on the state for that frame. However, event handlers are usually async, triggered some time after the UI was rendered. The data they access may have changed since then, particularly if accessing normal member variables of the class. 

In the diagrams above the render and event handler functions are shown in yellow to illustrate that they are not entirely dependent on the state that rendered the UI. If the implementation matched the conceptual model, the diagram should look more like this:

{% include candid-image.html src="/assets/images/frontend/react-state-as-snapshot-function.svg" alt="React State as a Snapshot using Function components" %}

Function components [give you this behavior by default](https://overreacted.io/how-are-function-components-different-from-classes/). A function component is simply a function that implements rendering. It has no direct access to the component instance state. It naturally behaves as a pure function. 

Event handlers are implemented as nested functions within the render function. React state and the method for updating the state are only available inside the rendering function. The event handler can access variables in the outer scope of the rendering function via the JavaScript closure feature. 

```
function Scroller({ viewportHeight, settings }) {
  const [scrollTop, setScrollTop] = useState(0);

  function runScroller({ target: { newScrollTop } }) {
    console.log(`Scroll top at last render was ${scrollTop}`);
    setScrollTop( newScrollTop );
  }

  // Calculate top and bottom padding and retrieve data
  { topPaddingHeight, bottomPaddingHeight, data } = 
    calculateLayout(viewportHeight, settings, scrollTop);

  return (
    <div
      className="viewport"
      onScroll={runScroller}
      style={{ '{{' }} height: viewportHeight }}>
      <div style={{ '{{' }} height: topPaddingHeight }}></div>
      {
        data.map(settings.row)
      }
      <div style={{ '{{' }} height: bottomPaddingHeight }}></div>
    </div>
  )
}
```

React makes use of many lesser known JavaScript features, so it's worth having a good [mental model of how JavaScript works](https://overreacted.io/what-is-javascript-made-of/). In this case, the killer feature is that the values of variables declared in the rendering function are captured at the point where the nested `runScroller` function is defined. If the original values later change, the event handler still uses the values captured when the UI was rendered.

The first time I saw code like this, I thought it was a mistake. You're defining a new instance of your event handler function every time the component renders. Isn't that tremendously wasteful? At least with a class component method, you can reuse the same function definition. 

Of course this is a feature, not a bug. If the variables captured by the closure are different each time the component renders, then you need a new function definition each time. If the captured variables rarely change, use the handy [useCallback](https://react.dev/reference/react/useCallback) hook to cache the definition between renders.

## React with Hooks

* [Thinking in React hooks](https://2019.wattenberger.com/blog/react-hooks)

## Rules of Hooks

* useState order dependence
* safe composition (what is NOT a hook)
* [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)

* [React as a UI Runtime](https://overreacted.io/react-as-a-ui-runtime/)
  * Understand React programming model in more depth
  * React programs output a tree that may change over time
  * We're mostly concerned with DOM trees, but in principle you could use the React core with any kind of tree structure
  * The tree has some kind of imperative API for manipulating the structure. React is a layer on top. 
  * React helps you predictably manipulate a complex tree in response to external events
  * React makes two assumptions
    1. The tree is relatively stable and most updates don't radically change the structure
    2. That individual nodes of the tree represent consistent objects
  * A *renderer* is the interface between React and the tree. For example, ReactDOM is a renderer for DOM trees.
  * React can work with both mutable and immutable tree structures
  * There's a 1:1 relationship between React elements and nodes in the tree. React elements describe what the corresponding node should look like.
  * The main job of React is to make the tree structure match a provided React element tree.
  * *Which bits of this are worth calling out?*

## Effects as Synchronization

## React Best Practices

* React in Equations
  * Render: Props In + Local State -> Rendered elements with Props and event handlers
  * Events: Event + event handler and state captured at last render -> New State
  * Side Effects: Rendered UI + State captured at last render -> New external state and/or New component state

* Writing resilient components from Dan Abramhov's blog: 
  * Don't stop the data flow
    * In Rendering
      * Props can change at any time
      * Common mistake is initializing state in constructor based on props. Later changes in props get ignored
      * Use memoization/pure component behavior to optimize cases where some props don't change, rather than lifecycle methods
    * In Side Effects
      * Classic mistake is fetching data based on a prop value. Then displaying stale data if prop changes.
      * Really hard to get right with class components - need to override both componentDidMount and componentDidUpdate. Fiddly code.
    * In Optimizations
      * Easy to break data flow if you try to aggressively optimize
      * Classic mistake is to write your own comparison function and forget to compare function props
      * Stick to approaches that use shallow equality like `PureComponent` and `React.memo`
  * Always be ready to render
    * Better expressed as rendering should be a pure function
    * Same starting state+props -> same output
    * Doesn't matter how many times render is called or whether state, props or both change each render
  * No component is a singleton
    * Write your components as if there can be more than one instance of them
    * Better design, even if right now there's only one instance
    * As things evolve you'll often end up with multiple instances of something you thought was a singleton
  * Keep the local state isolated
    * What state is truly local vs something that can be managed in a state manager like Redux?
    * If there are instances of the component with the same props, will interaction in one be reflected in the other?
    * No -> then it's local state
    * Don't hoist state higher than necessary