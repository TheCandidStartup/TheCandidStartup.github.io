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

* Quick start thinking in React page: https://react.dev/learn/thinking-in-react
  * Break UI into tree of component parts
  * Implement a static version
  * Find minimal UI state
  * Work out where state should live
  * Add inverse data flow (interactivity)
* Data flow diagram
* Seems superficial - still all about components
* Some important points
  * Data flows from the top of the tree down
  * Props vs State
  * Keep state minimal
* React in Equations
  * Render: Props In + Local State -> Rendered elements with Props and event handlers
  * Events: Event + event handler and state captured at last render -> New State
  * Side Effects: Rendered UI + State captured at last render -> New external state and/or New component state
* Writing resilient components from Dan Abramhov's blog: https://overreacted.io/writing-resilient-components/
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


## React with Hooks

* Capture of render state is a feature not a bug
* [Thinking in React hooks](https://2019.wattenberger.com/blog/react-hooks)
* [What is JavaScript Made Of](https://overreacted.io/what-is-javascript-made-of/)

## Rules of Hooks

* useState order dependence
* safe composition (what is NOT a hook)
* [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)

## Effects as Synchronization