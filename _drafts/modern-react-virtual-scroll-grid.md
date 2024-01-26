---
title: Modern React Virtual Scroll Grid
tags: frontend
---

Time to go again. I've learnt a lot about how best to [implement virtual scrolling in React]({% link _posts/2023-12-04-react-virtual-scroll-grid-5.md %}). I've got my head round [modern React with Hooks](/_posts/2024-01-15-modern-react-with-hooks.md). Now I'm going to implement my own super scalable virtual scrolling grid control using modern React with Typescript.

The high level plan is to port features from the React class component based [react-window](https://github.com/bvaughn/react-window), change the interface to make it scalable, add [SlickGrid](https://github.com/6pac/SlickGrid)'s scalable paged scrolling implementation, and demonstrate that modern React principles lead to a cleaner implementation. 

Let's start with figuring out what, if anything, would be better implemented using modern React.

# React-Window Code Base

React-Window includes virtual scrolling list and grid components in fixed and variable size flavors. The bulk of the implementation is in [`createListComponent.js`](https://github.com/bvaughn/react-window/blob/master/src/createListComponent.js) and [`createGridComponent.js`](https://github.com/bvaughn/react-window/blob/master/src/createGridComponent.js). These include the common code for both types of grid and list components. Each component gets a dedicated source file which imports the common code and adds implementation specific to that type. These are [`FixedSizeList.js`](https://github.com/bvaughn/react-window/blob/master/src/FixedSizeList.js), [`VariableSizeList.js`](https://github.com/bvaughn/react-window/blob/master/src/VariableSizeList.js), [`FixedSizeGrid.js`](https://github.com/bvaughn/react-window/blob/master/src/FixedSizeGrid.js) and [`VariableSizeGrid.js`](https://github.com/bvaughn/react-window/blob/master/src/VariableSizeGrid.js). Finally, there are a number of small shared helper functions and some [unit tests](https://github.com/bvaughn/react-window/tree/master/src/__tests__).

It seems like a reasonable structure, with effort made to extract and share common code. And yet, looking around the code base, what strikes me is the amount of duplicate code. The list components support vertical **or** horizontal virtual scrolling, depending on configuration. All the code is in `createListComponent.js` with two separate, very similar, implementations for vertical and horizontal scrolling. The grid components need to support vertical **and** horizontal scrolling. All the code for this is in `createGridComponent.js` with another two separate, very similar, implementations for vertical and horizontal scrolling. That's four copies of essentially the same functionality.

If we move up a level to the four component specific source files we see similar duplication. The code to map between item index and offset for fixed size items appears four times for horizontal/vertical scrolling in list and grid components. The same happens for the variable item size components. 

There's additional, smaller scale duplication, across the constructor, render method, lifecycle methods and event handlers. All of which seems to confirm the modern React claim that class components make it hard to share implementation. 

# Virtual Scroller Custom Hook

The modern React solution for these problems is to extract common code into custom hooks which can be reused across multiple components. It seems like I have the perfect test case. Let's try and extract all the code needed for virtual scrolling in a single dimension as a virtual scroller custom hook. List components use a single instance of the hook, configured for horizontal or vertical scrolling as appropriate. Grid components use two instances of the hook, one for vertical and one for horizontal scrolling. 

# State

First, let's look at the state. Here's what it looks like for the react-window list and grid components. The state is the same for both fixed and variable sized item flavors.

## List

* **isScrolling**: Boolean that specifies whether control is currently being scrolled
* **scrollDirection**: Backwards or Forwards
* **scrollOffset**: Position of scroll bar copied from scroll event scrollLeft or scrollTop
* **scrollUpdateWasRequested**: Parent component has requested a different scroll offset

## Grid

* **isScrolling**: Boolean that specifies whether control is currently being scrolled
* **horizontalScrollDirection**: Backwards or Forwards
* **verticalScrollDirection**: Backwards or Forwards
* **scrollLeft**: Position of scroll bar copied from scroll event scrollLeft
* **scrollTop**: Position of scroll bar copied from scroll event scrollTop
* **scrollUpdateWasRequested**: Parent component has called the `ScrollTo` method

We can immediately see that there are two per-dimension properties: scrollDirection and scrollOffset. These would naturally migrate into our virtual scroller custom hook. However, there are also two per-component properties: isScrolling and scrollUpdateWasRequested. 

The isScrolling functionality could be included in the virtual scroller custom hook, or it could be broken out into its own custom hook. Including it in the virtual scroller hook makes the component level implementation simpler, but means that the grid component would redundantly execute the same functionality twice, once in the vertical hook and once in the horizontal. Using a separate hook avoids that and means you could reuse a `useIsScrolling` hook in other non-virtual components, but could be overly verbose.

I think I'll wait and see which approach feels better when I implement. We need a better understanding of control flow and the  `ScrollTo` functionality before deciding what to do about scrollUpdateWasRequested.

# Control Flow

The critical control flow is implemented using six class component methods.

## Constructor

Pretty minimal. The usual class component boiler plate. Populates the state with default values. The only interesting bit is that `scrollOffset` can be initialized from an optional `initialScrollOffset` prop. 

This is an example of [derived state from props](https://legacy.reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html) which is often considered an anti-pattern. It's very easy to get into a mess. What should happen if the parent component later changes the `initialScrollOffset` prop? React components are meant to [handle changes to their props](https://overreacted.io/writing-resilient-components/) but you would then end up with two sources of truth for the scrollOffset.

The [recommended solution](https://legacy.reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#recommendation-fully-uncontrolled-component-with-a-key), which react-window implements, is surprising. The component accepts the prop as the initial value on creation but ignores any subsequent changes. If you want to reset the component with a new initial value, you have to force React to recreate it by [changing its `key`](https://react.dev/reference/react/useState#resetting-state-with-a-key).

## Render

Renders items in the visible window defined by the scroll offset and the size of the component. Calls class methods to map between offsets and item indexes. There are separate implementations for fixed and variable size items provided by the fixed and variable size component subclasses. 

Rendering creates an outer, fixed size div, and an inner child div, big enough to hold all the items.  The component maintains refs to both divs which are exposed to its parent component. The component also uses the outer ref itself when imperatively adjusting the scroll offset. 

## ComponentDidMount

[ComponentDidMount](https://legacy.reactjs.org/docs/react-component.html#componentdidmount) is a React lifecycle method, called after the component is created and first rendered. It uses the outer ref to set the div's current scroll offset to the `initialScrollOffset`, if defined.  We can replace this with the `useEffect` hook in modern React.

## OnScroll

The scroll event handler, added to the outer div. Updates the state in response to the scroll event.
* Sets `scrollDirection` based on comparing the previous scroll offset stored in the state to the current scroll offset
* Sets `scrollOffset` to the current scroll offset
* Sets `isScrolling` to true and `scrollUpdateWasRequested` to false
* Uses the `setState` post-update callback to request a 150ms timeout
* Clears `isScrolling` when the timeout triggers. 

According to the comments, the timeout is used to "debounce" the clear of the `isScrolling` flag. The `isScrolling` flag is typically used to change how child items are rendered while the user is interacting with the control. It makes sense that you don't want to toggle the flag too often. There's an implicit assumption that there's no better way of doing this than recognizing a sequence of scroll events that are close together in time. 

## ScrollTo

The component provides `scrollTo` and `scrollToItem` methods that a parent component can call to imperatively scroll to a specified offset or to bring a specified item into view. How do you do that with a modern React functional component? 

Which I eventually realized was the wrong question. How can a parent component call these methods when it has no control over how or when its child components get created?

Just like React lets you bind a ref to an HTML element, you can also [bind a ref to an instance of a class component](https://legacy.reactjs.org/docs/refs-and-the-dom.html#adding-a-ref-to-a-class-component). Once the initial `Render` completes, you can use the ref to access the component instance and call any methods on it. However, as the documentation helpfully points out, you [can't bind a ref to a function component](https://legacy.reactjs.org/docs/refs-and-the-dom.html#refs-and-function-components) because they don't have instances. 

You can make this work with a function component but the approach is a little obscure. First you need to wrap your function component definition with [`forwardRef`](https://react.dev/reference/react/forwardRef) so that it can accept a ref from its parent. Like the name suggests, this is normally used so that you can forward the ref on to one of your child HTML elements or child components. 

There is a third option. Instead of binding the ref to an HTML element or react class component, you can [bind it to an arbitrary JavaScript object](https://react.dev/reference/react/forwardRef#exposing-an-imperative-handle-instead-of-a-dom-node) with the [`useImperativeHandle`](https://react.dev/reference/react/useImperativeHandle) hook. This is normally used to restrict what the parent component can do with your internal child element or component. The object you return is a wrapper that forwards on only the methods you want to expose.

Nearly there. The trick is that you can [add whatever methods you want to this object](https://react.dev/reference/react/useImperativeHandle#exposing-your-own-imperative-methods). You don't have to limit yourself to forwarding standard DOM methods. We can include `scrollTo` and `scrollToItem` methods as well as providing access to the outer and inner divs. 

What does the ScrollTo method actually do? Weirdly, it calculates and sets the required scroll offset directly in the state *without* scrolling the control to match. Instead it just sets the `scrollUpdateWasRequested` flag and waits for the `ComponentDidUpdate` lifecycle method to be called. 

## ComponentDidUpdate

[ComponentDidUpdate](https://legacy.reactjs.org/docs/react-component.html#componentdidupdate) is a React lifecycle method, called after any update to props or state has been rendered. If `scrollUpdateWasRequested` is set, it sets the scroll offset of the outer div to the scroll offset in the state.

The overall effect is that ScrollTo renders items that are outside the window, then scrolls them into view. What I can't work out is why it does it this way. There's nothing in the comments that explains why. 

Why not set the scroll offset of the outer div directly in `ScrollTo`, then rely on the scroll event handler to set the state, which in turn will trigger a render? After all, react-window does it this way when setting an initial scroll position. It seems overly complex and worse won't work when I implement paged scrolling. Scrolling items outside the window into view only works if the items are on the current page. 

I'll implement the simple, direct approach instead, which means I won't need `scrollUpdateWasRequested`.

## Next Time

I think I know what I'm doing. Now I just need to get on and implement it. Let's see how long the plan can survive contact with the real world. 


