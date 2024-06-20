---
title: >
  React Virtual Scroll 0.4.0 : Customization
tags: react-virtual-scroll
---

My `VirtualList` and `VirtualGrid` components use the same approach as [React-Window](https://github.com/bvaughn/react-window). A lean and mean implementation that focuses just on virtualization. This is not [SlickGrid](https://slickgrid.net/). The idea is that you can use customization to build whatever higher level functionality you need on top.

Unfortunately, the current implementation is rather lacking in customization features. It's time to fix that. 

# Component Structure

`VirtualList` and `VirtualGrid` use the same structure as most other virtualized scrollable components. There are three levels. 

At the top there's an outer container element. It provides a viewport onto the collection of items displayed in the component. 

The outer container scrolls over a much larger inner child container element. The inner container is sized so that it can accommodate all the items in the collection. 

Finally, all the visible items (and some just out of view) are added as children of the inner container. 

{% include candid-image.html src="/assets/images/react-virtual-scroll/component-structure.svg" alt="Component Structure" %}

The items are rendered using instances of a child component passed in by the caller. The item sizes are specified by an instance of the `ItemOffsetMapping` interface. Currently, these make up the only form of customization available. The items can be whatever you want but you have no control over the inner and outer container elements. 

```
const Row = ({ index, style }) => (
  <div className={"row"} style={style}>
    { ("Item " + index }
  </div>
);

const mapping = useVariableSizeItemOffsetMapping(30, [50]);

...

<VirtualList
  height={240}
  itemCount={1000000000000}
  itemOffsetMapping={mapping}
  width={600}>
  {Row}
</VirtualList>
```

# Class Names

The first change I'm making is to allow users to specify a `className` for the container elements. That allows you to target each element in a style sheet. 

```
<VirtualList
  ...
  className={'outerContainer'}
  innerClassName={'innerContainer'}>
  {Row}
</VirtualList>
```

Most of the time you'll want to style the outer container and let the inner container and items inherit from it. It makes sense to think of this as the `className` for the component as a whole. Use `innerClassName` for the rarer cases where you need to explicitly target the inner component. 

I added a `className` to all my samples with a style that makes the edges of the list and grid components easy to see.

```
.outerContainer {
  border: 1px solid #d9dddd;
}
```

# Custom Container Components

* Examples of use
* Implementation
* Typing frustration
  * Can't specify type that must accept a ref due to JSX/support for legacy types
  * Do get runtime error if you pass simple function component and VirtualList tries to pass a ref to it
  * Also seems to lose type of ref - can specify `forwardRef` to wrong HTML type and it passes type and runtime checks
  * Only solution seems to be to use a rewritten implementation of `forwardRef` that drops legacy component support. Can make that choice at app level, not in a library.

Updated `VirtualList` interface so that client can optionally [pass in their own outer component type](https://www.totaltypescript.com/pass-component-as-prop-react). We define a type that represents the basic properties that `VirtualList` applies to the built in `div`. Can use that with `React.ComponentType` to declare a type for a React user defined component that accepts the required props. 

```
export interface VirtualListOuterProps {
  className: string | undefined;
  children: React.ReactNode;
  style: React.CSSProperties;
  onScroll: (event: ScrollEvent) => void;
}
type VirtualListOuterComponent = React.ComponentType<VirtualListOuterProps>;

export interface VirtualListProps extends VirtualBaseProps {
  ...
  outerComponent?: VirtualListOuterComponent;
};
```

Need an Outer component implementation that accepts className, style, onScroll, children and ref properties. An implementation with default behavior just needs to forward them all on to div. 

The `ref` property isn't included in `VirtualListOuterProps` because refs are a special case. Core React handles binding refs to elements. The minimal implementation of an customer outer component looks like this. 

```
const Outer = React.forwardRef<HTMLDivElement, VirtualListOuterProps >(({className, style, onScroll, children}, ref) => (
  <div className={className} ref={ref} style={style} onScroll={onScroll}>
    {children}
  </div>
)
```

You would expect that the TypeScript type system ensures callers pass in an outer component type with the correct interface. What happens if you forget to add the `fowardRef` wrapper?

```
const Outer = ({className, style, onScroll, children}: VirtualListOuterProps ) => (
<div className={className} style={style} onScroll={onScroll}>
  {children}
</div>)
```

No complaints from TypeScript. Which is understandable. We haven't mentioned a ref property in `VirtualListOuterProps` and `React.ComponentType<VirtualListOuterProps>` covers all components that accept the basic props, whether they support refs or not. I went down a rabbit hole trying increasingly exotic type signatures for `VirtualListOuterComponent`. Nothing worked. Either it made no difference or it would prevent any implementation from working. In the end I had to give up. The wisdom of the internet suggests that it [can't be done](https://stackoverflow.com/questions/71917496/requiring-a-child-that-accepts-a-ref-attribute-in-react-typescript). 

At least there is a runtime error if the component you pass in can't accept a ref. 

{% include candid-image.html src="/assets/images/frontend/react-runtime-ref-error.png" alt="React Runtime Ref Error" %}

Even if you could enforce use of an Outer component with the correct interface, you still need to rely on documentation that covers what is expected of the implementation. 

# Implementation

* Examples of use
* Implementation


