---
title: >
  React Virtual Scroll 0.5.0 : Render Props
tags: react-virtual-scroll
thumbnail: /assets/images/react-virtual-scroll/render-props-thumbnail.png
---

The [0.4.0 release]({% link _posts/2024-07-01-react-virtual-scroll-0-4-0.md %}) of `react-virtual-scroll` focused on customization. Since then, I've learnt a lot from using `VirtualGrid` and `VirtualList` as building blocks for my [`react-spreadsheet`]({% link _topics/react-spreadsheet.md %}) package. In particular, I learnt that the custom container component props introduced in 0.4.0 aren't a good fit with modern React.

Introducing [React Virtual Scroll 0.5.0](https://www.npmjs.com/package/@candidstartup/react-virtual-scroll/v/0.5.0).

# Modern React

[Modern React]({% link _posts/2024-01-15-modern-react-with-hooks.md %}) replaces class based components with functional components. Once you've implemented a few functional components you start to see a common pattern. Here's a sketch of a higher level component that wraps `VirtualGrid`. 

```tsx
function MyComponent(props: MyComponentProps) {
  const gridRef = React.useRef<VirtualGridProxy>(null);
  const [myState, setMyState] = React.useState<MyComponentState>(null);

  function onClickHandler(event: React.MouseEvent) {
    doSomethingWith(event, props, myState, gridRef);
  }

  return <div onClick={onClickHandler}>
    <VirtualGrid
      ref={gridRef}
      height={props.height}
      width={props.width}>
      {Cell}
    </VirtualGrid>
  </div>
}
```

You end up with a structure that looks pretty similar to a class definition. Instead of a class with member variables and member functions you have a component function with props and hooks (equivalent to member variables) and declarations of nested functions (equivalent to member functions). The top of the component function is equivalent to a constructor and the bottom is equivalent to the class render method. 

The magic of Javascript's [function closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures) ensures that the nested "member" functions have access to all the local "member" variables declared in the component function. The `onClickHandler` can "do something" with `props`,  `myState` and `gridRef`. 

Very clever, but why do this rather than using a class? First, the learning curve is shallower. You don't need all the boilerplate of a class to get started with a simple functional component that just renders some HTML. Second, and more importantly, the semantics of closures fit perfectly with the React mental model. Each time you render a component you create a consistent snapshot of UI, state and event handlers. The event handler closures capture the values of variables when rendered. Eventually an event is processed, state is updated and a new version of the UI and event handlers are rendered to match.

{% include candid-image.html src="/assets/images/frontend/react-state-as-snapshot-function.svg" alt="React State as a Snapshot using Function Components" %}

With class components there are too many ways to shoot yourself in the foot with inappropriate use of mutable member variables.

# Component Props

The `react-virtual-scroll` package [started life]({% link _posts/2024-01-29-modern-react-virtual-scroll-grid.md %}) as a clone of [`react-window`](https://github.com/bvaughn/react-window) rewritten in modern React. The driving philosophy for `react-window` is to provide minimal components that can be customized as needed. The main mechanism used is [Component Props](https://www.totaltypescript.com/pass-component-as-prop-react).

`VirtualGrid` and `VirtualList` each have three component props. The components passed in replace the default implementations for outer and inner containers and children.

```tsx
const Outer = React.forwardRef<HTMLDivElement, VirtualOuterProps >(({...rest}, ref) => (
  <div ref={ref} {...rest}/>
)

const Inner = React.forwardRef<HTMLDivElement, VirtualInnerProps >(({...rest}, ref) => (
  <div ref={ref} {...rest}/>
)

const Cell = ({ row, col, style }: { row: number, col: number, style: React.CSSProperties }) => (
  <div style={style}>
    { `Cell ${row}:${col}` }
  </div>
);

function MyComponent(props: MyComponentProps) {
    ...
    return <div>
      <VirtualGrid
        outerComponent={Outer}
        innerComponent={Inner}>
        {Cell}
      </VirtualGrid>
    </div>
}
```

# Nested Components

What happens when you need to "do something" with `props`, `myState` and `gridRef` inside one of these passed components? If you're like me, you [shoot yourself in the foot]({% link _posts/2024-10-14-react-spreadsheet-selection-focus.md %}) by using a nested component. 

```tsx
function MyComponent(props: MyComponentProps) {
  const gridRef = React.useRef<VirtualGridProxy>(null);
  const [myState, setMyState] = React.useState<MyComponentState>(null);

  const Outer = React.forwardRef<HTMLDivElement, VirtualOuterProps >(({...rest}, ref) => {
    doSomethingWith(props, myState, gridRef); 
    return <div ref={ref} {...rest}/>
  }

  const Inner = React.forwardRef<HTMLDivElement, VirtualInnerProps >(({...rest}, ref) => {
    doSomethingWith(props, myState, gridRef); 
    return <div ref={ref} {...rest}/>
  }

  const Cell = ({ row, col, style }: { row: number, col: number, style: React.CSSProperties }) => (
    <div style={style}>
      { doSomethingWith(row, col, props, myState, gridRef) }
    </div>
  );

  return <div>
    <VirtualGrid
      outerComponent={Outer}
      innerComponent={Inner}>
      {Cell}
    </VirtualGrid>
  </div>
}
```

No typescript errors, no lint errors, no runtime errors. Yet, nothing works right.  The nested components are reset and recreated on every render so any local state changes are lost. Performance tanks. 

React's [reconciliation](https://legacy.reactjs.org/docs/reconciliation.html) algorithm depends on using the same component instances each render. A nested component function ensures you get a new instance every render. 

# Render Props

I managed to [resolve]({% link _posts/2024-10-14-react-spreadsheet-selection-focus.md %}) the mess I'd made by replacing my nested child component with a [render prop](https://react.dev/reference/react/Children#calling-a-render-prop-to-customize-rendering). A render prop is simply a function that returns some JSX. The body of my nested component becomes a simple function which is passed to the component as a render prop. Along with component prop based customization, `react-window` also gave me a generic `itemData` prop which I could use as a render prop. 

```tsx
type CellRender = (row: number, col: number, style: React.CSSProperties) => JSX.Element;
function Cell({ row, col, data, style }: { row: number, co: number, data: unknown, style: React.CSSProperties }) {
  const cellRender = data as CellRender;
  return cellRender(rowIndex, columnIndex, style);
}

function MyComponent(props: MyComponentProps) {
  const gridRef = React.useRef<VirtualGridProxy>(null);
  const [myState, setMyState] = React.useState<MyComponentState>(null);

  const Outer = React.forwardRef<HTMLDivElement, VirtualOuterProps >(({...rest}, ref) => {
    doSomethingWith(props, myState, gridRef); 
    return <div ref={ref} {...rest}/>
  }

  const Inner = React.forwardRef<HTMLDivElement, VirtualInnerProps >(({...rest}, ref) => {
    doSomethingWith(props, myState, gridRef); 
    return <div ref={ref} {...rest}/>
  }

  const cellRender: CellRender = ({ row, col, style }) => (
    <div style={style}>
      { doSomethingWith(row, col, props, myState, gridRef) }
    </div>
  );

  return <div>
    <VirtualGrid
      itemData={cellRender}
      outerComponent={Outer}
      innerComponent={Inner}>
      {Cell}
    </VirtualGrid>
  </div>
}
```

There's no equivalent `innerData` and `outerData` for `innerComponent` and `outerComponent`. Something needs to change. Which is why there's a `react-virtual-scroll 0.5.0`. 

Inner and outer components are optional. They're only needed when you want to customize the grid. There's a `VirtualGrid` specific contract for components to implement, which means you're only going to use it with components created purely for customization.

Instead of adding two more generic data props, I decided to change the API so that you can pass inner and outer render props directly. There's less boilerplate code to write. Render functions are simpler. You don't need any of that React `forwardRef` nonsense. And there's one less way to shoot yourself in the foot. 

```tsx
type CellRender = (row: number, col: number, style: React.CSSProperties) => JSX.Element;
function Cell({ row, col, data, style }: { row: number, co: number, data: unknown, style: React.CSSProperties }) {
  const cellRender = data as CellRender;
  return cellRender(rowIndex, columnIndex, style);
}

function MyComponent(props: MyComponentProps) {
  const gridRef = React.useRef<VirtualGridProxy>(null);
  const [myState, setMyState] = React.useState<MyComponentState>(null);

  const outerRender: VirtualOuterRender = ({...rest}, ref) => {
    doSomethingWith(props, myState, gridRef); 
    return <div ref={ref} {...rest}/>
  }

  const innerRender: VirtualInnerRender = ({...rest}, ref) => {
    doSomethingWith(props, myState, gridRef); 
    return <div ref={ref} {...rest}/>
  }

  const cellRender: CellRender = ({ row, col, style }) => (
    <div style={style}>
      { doSomethingWith(row, col, props, myState, gridRef) }
    </div>
  );

  return <div>
    <VirtualGrid
      itemData={cellRender}
      outerRender={outerRender}
      innerRender={innerRender}>
      {Cell}
    </VirtualGrid>
  </div>
}
```

I did consider replacing the child component with a render prop too but decided against it. It's a more significant change as the child component isn't optional. There's lots of simple use cases where a component prop works just fine. The `itemData` prop is already there if you do need to pass extra context or a full blown render prop. If it ain't broke, don't fix it. 

# Breaking Change

Render props have been implemented for both `VirtualGrid` and `VirtualList`. It goes without saying that this is a breaking change. However, as you can see above, the changes required from consumers are simple and mechanical.

# VirtualGridProxy Enhancements

Along side all the drama of render props, 0.5.0 includes two enhancements to `VirtualGridProxy`, both backwards compatible. 

```ts
export interface VirtualGridProxy {
  /**
   * Scrolls the list to the specified row and column in pixels
   */
  scrollTo(rowOffset?: number, columnOffset?: number): void;

  /**
   * Scrolls the list so that the specified item is visible
   * @param rowIndex - Row of item to scroll to
   * @param columnIndex - Column of item to scroll to
   */
  scrollToItem(rowIndex?: number, columnIndex?: number): void;

  /** Exposes DOM clientWidth property */
  get clientWidth(): number;

  /** Exposes DOM clientHeight property */
  get clientHeight(): number;
}
```

The arguments to `scrollTo` and `scrollToItem` are now optional. You can now scroll to a specific row (without changing the column), scroll to a specific column (without changing the row) or scroll both.

The proxy also exposes `clientWidth` and `clientHeight` properties from the underlying outer `div` container. 

# Links

* [Change Log](https://github.com/TheCandidStartup/infinisheet/blob/04aa6249f51b5da933813c7b17a652d4f4e2a646/packages/react-virtual-scroll/CHANGELOG.md)
* [NPM](https://www.npmjs.com/package/@candidstartup/react-virtual-scroll/v/0.5.0)
