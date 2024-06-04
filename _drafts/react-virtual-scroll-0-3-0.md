---
title: >
  React Virtual Scroll 0.3.0 : Paging Config
tags: react-virtual-scroll
---

wise words

# Paging Config Props

* Paged virtual scrolling based on two hardcoded constants
  * `MAX_SUPPORTED_CSS_SIZE` - Maximum size of an HTML element beyond which CSS layout will break
  * `MIN_NUMBER_PAGES` - Minimum number of pages to use once paged scrolling activated
  * Each page (apart from last) will be `MAX_SUPPORTED_CSS_SIZE/MIN_NUMBER_PAGES` big
* To test functional behavior with an easy to observe small sample I hacked value of constants
* Want to add functional paging test sample into my sample app without the hackery
* This is JavaScript, I can monkey patch in my sample app
* Surprisingly hard to do. Need to change way module is loaded to be able to hook behavior. May not work in production build if bundler renames variables. Looks ugly.
* Next thought. Change variables from `const` to `let` and provide an override function so app can set the values. Still pretty hacky. Global change. Weird stuff will happen if you change with existing instances. Have to export stuff from previously internal module.
* Then I realized. I can turn the constants into props with default values. Clean implementation. Non-breaking change.

General properties which can be defined once for both `VirtualList` and `VirtualGrid`

```
export interface VirtualBaseProps {
  ...
  maxCssSize?: number,
  minNumPages?: number
};
```

Extend interface for `useVirtualScroll` custom hook

```
function useVirtualScroll(totalSize: number, 
  maxCssSize = MAX_SUPPORTED_CSS_SIZE, minNumberPages = MIN_NUMBER_PAGES): VirtualScroll
```

Then pass props through in `VirtualList` and `VirtualGrid`. My paging functional test sample is then

```
<VirtualList
  ref={list}
  height={240}
  itemCount={100}
  itemOffsetMapping={mapping}
  maxCssSize={1500}
  minNumPages={5}
  width={600}>
  {Row}
</VirtualList>
```

* Paged scrolling is activated for containers larger than 1500 pixels with 5 pages for every 1500 pixels. The container in this sample is 3000 pixels (100 items by 30 pixels each) for a total of 10 pages.

# On Scroll Callback

* Another thing on the missing feature list compared with `react-window`
* Will also be really useful for my paging functional test as I can show exactly what's going on
* The `react-window` class based components invoke the callback in `componentDidMount` and `componentDoUpdate`. This is equivalent to using an effect in modern React. The end result is that the callback is invoked after the state has been updated and the component rendered.
* I don't want to do it like that. The React mental model is that events trigger changes to state which React uses to render a new version of the UI, then we go round again with events based on the updated UI. 

{% include candid-image.html src="/assets/images/frontend/react-state-as-snapshot.svg" alt="React State as a Snapshot" %}

* With a normal list component you would add an `onScroll` event handler on the outer `div` to change state in other components based on how the list has been scrolled. You can't do that with `VirtualList` because of the paging system. The `scrollTop` value on the outer `div` is the position within the current page not the list as a whole. That's one reason why we don't give direct access to the `div`.
* I need to provide my own `onScroll` that abstracts away the details of the paging system. However, I want it to behave like `OnScroll` on the underlying div. In particular, I want it to be invoked during scroll event processing. Then a subscriber can change state in other components to match, before the app is re-rendered. 

```
export interface VirtualListProps extends VirtualBaseProps {
  ...
  onScroll?: (offset: number, newScrollState: ScrollState) => void;
};
```

* OnScroll has two parameters. The first, all you need in most cases, is the offset being scrolled to in grid space. The second is the full ScrollState for more advanced use cases. This includes the `scrollOffset` in container space, the `renderOffset` you need to add to get the offset in grid space, the current page for paged scrolling and the current `scrollDirection`.

```
export type ScrollDirection = "forward" | "backward";
export interface ScrollState { 
  scrollOffset: number, 
  renderOffset: number,
  page: number, 
  scrollDirection: ScrollDirection, 
};
```

* Updated sample app to display all ScrollState properties
* All as expected except when using the scroll to item text entry box the `scrollDirection` is always `forward` regardless of what you do. 
* I have a unit test for that functionality in `useVirtualScroll.test.ts` which passes.
* Must be something going wrong at the `VirtualList` level. This is the first time I've exposed `scrollDirection` at the component level so haven't been able to test before. 
* Took me a long time to work out the problem. All `VirtualList` does is call a `doScrollTo` helper method provided by `useVirtualScroll`, which is what my existing unit test checks.

* Here's the relevant parts of the `VirtualList` code. Can you see the problem?

```
  const { doScrollTo } = useVirtualScroll(totalSize, props.maxCssSize, props.minNumPages);

  React.useImperativeHandle(ref, () => {
    return {
      scrollTo(offset: number): void {
        const outer = outerRef.current;
        if (outer) {
          if (isVertical)
            outer.scrollTo(0, doScrollTo(offset, outer.clientHeight));
          else
            outer.scrollTo(doScrollTo(offset, outer.clientWidth), 0);
        }
      },

      scrollToItem(index: number): void {
        this.scrollTo(itemOffsetMapping.itemOffset(index));
      }
    }
  }, [ itemOffsetMapping ]);
```

The `useImperativeHandle` hook takes three arguments. The ref to bind your proxy object to, a lambda that creates and returns the proxy object and an array of dependencies. I'd skimmed over the  [React documentation](https://react.dev/reference/react/useImperativeHandle) and understood that I needed to include any state and props referenced by the proxy object in the dependency array. There's nothing magical about state and props. React caches and reuses the created proxy object, only calling the creation lambda if the dependencies have changed. The `doScrollTo` helper method captures state variables in order to work out the scroll direction. It isn't listed in the dependencies array which means that the captured state it uses for the comparison is always the initial `ScrollState`. Anywhere you scroll to is forwards from that.
* Updating the dependencies array should fix it. While I'm at it, I need to add `isVertical` too. Before I do that, I need to write a failing unit test that demonstrates the problem.
* Failing test written. Fix applied and test now passes. Example works.

* Try it out! Paged functional embed + link.

* Made the corresponding changes to VirtualGrid with a 2D `onScroll` function

```
export interface VirtualGridProps extends VirtualBaseProps {
  ...
  onScroll?: (rowOffset: number, columnOffset: number, 
    newRowScrollState: ScrollState, newColumnScrollState: ScrollState) => void;
};
```

