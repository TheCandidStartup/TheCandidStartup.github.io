---
title: >
    Modern React Virtual Scroll Grid 2 : Basic Structure
tags: frontend
---

I have a [plan]({% link _posts/2024-01-29-modern-react-virtual-scroll-grid.md %}), I just need to start executing. Where to start? As you may have realized by my ratio of "writing about coding" vs "actually coding", I have a tendency towards [analysis paralysis](https://en.wikipedia.org/wiki/Analysis_paralysis). The solution that works for me is to pick a small but meaningful subset of what I want to achieve, get it working with a minimum of fuss, then iterate from there to add functionality and clean up any shortcuts.

I'm going to start by getting the basic structure for my scalable virtual scrolling controls in place. That means one control with the scrolling functionality split out as a reusable custom hook. Functionality ported from react-window using modern React idioms and Typescript. 

To keep things simple, I'm looking at a list control hard coded for vertical layout with fixed height items. The virtual scrolling custom hook will just use the basic react-window implementation, no scalable paged scrolling yet. For now, the control only supports a basic subset of the react-window list control props. No `initialScrollOffset`, no `isScrolling` state, no refs, no callbacks, no `ScrollTo` methods, no support for right-to-left layouts, no optimizations. 

Now that I've lowered your expectations, let's have a look at what I did do.

# TypeScript

Up to now I've been copying and pasting existing JavaScript code and hacking in enough TypeScript declarations to shut up the warnings in Visual Studio Code and the TypeScript transpiler. 

Now I'm going to be writing modern React components from scratch, trying to follow TypeScript best practices and hopefully reaping the gains of static type safety and enhanced auto-completion in the IDE. 

Luckily, I found two resources that made it a largely painless process. First, react-window uses [flow](https://flow.org/) type annotations. These are close enough to TypeScript that I could use them as a starting point. Second, the [React+TypeScript Cheatsheets](https://github.com/typescript-cheatsheets/react) project helped me understand the more React specific type annotations and helped fill in the blanks for modern React. 

# App

I'm working in the same [react-virtual-scroll-grid](https://github.com/TheCandidStartup/react-virtual-scroll-grid/blob/e6a3865a8e5368146b80a7444b9833e80fac2040) project as before. Let's work from the top down. The [App module](https://github.com/TheCandidStartup/react-virtual-scroll-grid/blob/e6a3865a8e5368146b80a7444b9833e80fac2040/src/App.tsx) looks pretty much the same as before. 

```
import { VirtualList } from './VirtualList';
 
const Cell = ({ index, style } : { index: number, style: any}) => (
  <div className="cell" style={style}>
    Item {index}
  </div>
);

function App() {
  return (
    <div className="app-container">
      <VirtualList
        height={240}
        itemCount={100}
        itemSize={30}
        width={600}>
          {Cell}
      </VirtualList>
    </div>
  )
}
```

Instead of importing a `FixedListControl` from react-window, I'm now using my new `VirtualList` control. Everything else stays the same. Same props, same way of defining the child component to use for each item in the list. 

While editing this file I immediately noticed the impact of TypeScript. I get auto-completion prompts when adding props to `VirtualList`, errors if I try to specify a prop that the control doesn't support and even an error if I specify more than the single child that the control expects. 

Like react-window, the VirtualList control creates an instance of its child component for every item in the list, passing in a set of per-item props. I was pleasantly surprised that the IDE immediately warns me if I try to add a prop to `Cell` that `VirtualList` doesn't provide. 

# VirtualList control

Let's drill down into the [VirtualList](https://github.com/TheCandidStartup/react-virtual-scroll-grid/blob/e6a3865a8e5368146b80a7444b9833e80fac2040/src/VirtualList.tsx) component. 

## Type Declarations

We're using TypeScript, so the module starts with a set of type declarations. These are subsets of the flow type declarations in react-window, ported to TypeScript. 

```
export type RenderComponentProps = {
  data: any,
  index: number,
  isScrolling?: boolean,
  style: Object, 
};

export type RenderComponent = React.ComponentType<RenderComponentProps>;

export type VirtualListProps = {
  children: RenderComponent,
  height: number,
  width: number,
  itemCount: number,
  itemSize: number,
  itemData?: any,
  itemKey?: (index: number, data: any) => any,
};
```

Straight away we're off the reservation. The React+TypeScript cheat sheets have only a brief mention of `ComponentType` in the advanced section. Conceptually it makes sense. We're declaring a type for the props that can be passed to VirtualList including the built-in `children` prop, then drilling down further and specifying the props that child should expect. I'm just glad that somebody else worked out how to do it. 

## The Component Function

The `VirtualList` component function is simple enough. 

{% raw %}

```
import { useVirtualScroll } from './useVirtualScroll';

type ScrollEvent = React.SyntheticEvent<HTMLDivElement>;

export function VirtualList(props: VirtualListProps): React.JSX.Element {
  const { width, height, itemCount, itemSize } = props;

  const [{ scrollOffset }, onScrollExtent] = useVirtualScroll();

  const totalSize = itemCount * itemSize;

  function onScroll (event: ScrollEvent) {
      const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
      onScrollExtent(clientHeight, scrollHeight, scrollTop);
  }

  return (
    <div onScroll={onScroll} style={{ position: "relative", height, width, 
                                      overflow: "auto", willChange: "transform" }}>
        <div style={{ height: totalSize, width: "100%" }}>
            {renderItems(props, scrollOffset)}
        </div>
    </div>
  );
};
```

{% endraw %}

I call the `useVirtualScroll` custom hook to get the current scroll state and a function to call when a scroll event occurs which will update the state. The scroll hook is generic and will work in either dimension, so it needs to be wrapped in an `onScroll` event handler which passes on the correct values for vertical scrolling. 

Finally, we return the JSX for the rendered control. As usual there's a fixed size outer div and an inner div that it scrolls over. 

## Rendering Items

The react-window implementation directly calls `React.createElement` rather than using JSX. Modern react is all-in on JSX, so I decided to port it. The two divs were simple enough, rendering the visible items was not. 

You can't use loops within JSX. The normal idiom is to build up content in an array and then use `map` to generate JSX for each entry in the array. On top of that I'd have to find a way to specify the child component type being created using a variable rather than a literal in the JSX. In the end I left the implementation as is and pulled it out into a separate function.

```
function renderItems(props: VirtualListProps, scrollOffset: number) {
  const { children, itemData=undefined, itemSize, itemKey = defaultItemKey } = props;

  const [startIndex, stopIndex] = getRangeToRender(props, scrollOffset);

  const items = [];
  for (let index = startIndex; index < stopIndex; index++) {
    const offset = index * itemSize; 
    items.push(
      React.createElement(children, {
        data: itemData,
        key: itemKey(index, itemData),
        index,
        style: { position: "absolute", top: offset, height: itemSize, width: "100%" }
      })
    );
  }

  return items;
}
```

The `getRangeToRender` function is copied over from the `FixedSizeList` implementation in react-window. It's a placeholder that will be replaced when I add the new scalable data binding interface. 

The code loops over the visible items creating an instance of the component specified in the `children` prop for each item. Each item has a style that uses absolute positioning to set the size and position of the item. The original implementation in react-window has a complex caching system for styles to minimize re-rendering of child items. Something else for the todo list.

# useVirtualScroll custom hook

The last piece of the jigsaw is the [useVirtualScroll](https://github.com/TheCandidStartup/react-virtual-scroll-grid/blob/e6a3865a8e5368146b80a7444b9833e80fac2040/src/useVirtualScroll.ts) custom hook. 

```
export type ScrollDirection = "forward" | "backward";
export type ScrollState = { scrollOffset: number, scrollDirection: ScrollDirection};

export function useVirtualScroll() {
  const initValue: ScrollState = {scrollOffset: 0, scrollDirection: "forward"};
  const [scrollState, setScrollState] = useState(initValue);

  function onScroll(clientExtent: number, scrollExtent: number, scrollOffset: number) {
    if (scrollState.scrollOffset == scrollOffset) {
      // No need to change state if scroll position unchanged
      return;
    }

    // Prevent Safari's elastic scrolling from causing visual shaking when scrolling past bounds.
    const newOffset = Math.max(0, Math.min(scrollOffset, scrollExtent - clientExtent));
    const newScrollDirection = scrollState.scrollOffset <= newOffset ? 'forward' : 'backward';
    setScrollState({ scrollOffset: newOffset, scrollDirection: newScrollDirection });
  }
    
  return [scrollState, onScroll] as const;
}
```

We define the state needed to track scrolling in one dimension and implement it using the `useState` hook. The onScroll function uses values from a scroll event to update the state. It uses the modern react idiom of capturing the current state value which can then be compared with the value from the scroll event to work out which direction the user is scrolling. 

If everything works out as planned, we can extend the implementation with SlickGrid's scalable paged scrolling without needing to change the VirtualList component. In future, we can return a `ScrollTo` function for the host component to use, as well as `OnScroll`.

# Try It!

It's not the most exciting demo, but for what it's worth, here's my basic virtual list in all its glory.

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-2/index.html" width="100%" height="fit-content" %}

# Coming Up

Analysis paralysis averted. I have my basic structure in place, it's written in modern React with Typescript, and best of all the exercise has helped flesh out my list of next steps.

1. Scalable data binding interface allowing me to remove the hard coding for fixed size items
2. An implementation of the interface that demonstrates variable size items
3. useIsScrolling custom hook
4. Vertical and Horizontal layout support in the list control
5. ScrollTo implementation
6. A grid control with vertical and horizontal scrolling
7. Paged scrolling
8. All the other props from react-window
9. Optimizations

I also have a parking lot of things to come back to
* JSX all the way down
* Try using relative positioning of child items with a grid layout. Can we reduce the number of unique item styles needed?
* Unit tests
* Monorepo setup
* Build npm package

Next time, we'll see how far we get with the scalable data binding interface.
