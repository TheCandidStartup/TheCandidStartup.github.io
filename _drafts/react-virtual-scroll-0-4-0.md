---
title: >
  React Virtual Scroll 0.4.0 : Customization
tags: react-virtual-scroll
---

wise  words

# Component Structure

* Outer div -> inner div -> virtualized children
* Only customization is via component you pass in as template for each child

# Outer Div Class Name

# Outer Component

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

{% include candid-image.html src="/assets/images/frontend/react-runtime-ref-error.png" alt="NPM Provenance Workflow TLDR" %}

Even if you could enforce use of an Outer component with the correct interface, you still need to rely on documentation that covers what is expected of the implementation. 

# Inner Component

* Examples of use
* Implementation


