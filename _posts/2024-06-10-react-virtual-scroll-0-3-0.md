---
title: >
  React Virtual Scroll 0.3.0 : Paging Functional Test
tags: react-virtual-scroll
---

{% capture rvs8_url %}{% link _posts/2024-04-22-modern-react-virtual-scroll-grid-8.md %}{% endcapture %}
I need a small test app with paged scrolling enabled to use for functional testing. I've talked previously about [hacking]({{ rvs8_url | append: "#functional-testing"}}) the internal `useVirtualScroll` component to enable paged scrolling for small lists.  I don't want to have to keep doing that. Instead, I want to add the paging functional test as one of my set of permanent samples. 

{% include candid-image.html src="/assets/images/react-virtual-scroll/paging-functional-test.png" alt="Paging Functional Test Sample" %}

To do that properly I need two new features. Welcome to [React-Virtual-Scroll 0.3.0](https://www.npmjs.com/package/@candidstartup/react-virtual-scroll/v/0.3.0).

# Paging Config Props

The paged virtual scrolling implementation is based on two hardcoded constants.
  * `MAX_SUPPORTED_CSS_SIZE` - Maximum size of an HTML element beyond which CSS layout will break
  * `MIN_NUMBER_PAGES` - Minimum number of pages to use once paged scrolling is activated

Paged scrolling is enabled when the container would otherwise end up larger than `MAX_SUPPORTED_CSS_SIZE`. When enabled, each page (apart from the last) will cover `MAX_SUPPORTED_CSS_SIZE/MIN_NUMBER_PAGES` pixels. 

When I wanted to test functional behavior, I would temporarily change the constants. I want a dedicated sample that doesn't involve hacking the source code. 

My first thought was that this is JavaScript. I can [monkey patch](https://en.wikipedia.org/wiki/Monkey_patch) the constants at runtime. It turns out to be surprisingly hard to do. For a start, I need to change the way that the `react-virtual-scroll` module [is loaded](https://github.com/DataDog/import-in-the-middle) so that I can provide access to module variables. It might not work in a production build if the bundler renames variables. The whole thing looks really ugly.

My next thought was to change the constants into variables with default values and provide an exported override function so that the functional test app can change the values. It's still pretty hacky. Overriding the values is a global change. Weird stuff will happen if you change the values with existing instances around. 

Then I realized. I can turn the constants into props with default values. The implementation is clean. It's a non-breaking change.

## Implementation

The two props can be defined once for both `VirtualList` and `VirtualGrid`.

```
export interface VirtualBaseProps {
  ...
  maxCssSize?: number,
  minNumPages?: number
};
```

I need to extend the interface for the `useVirtualScroll` custom hook.

```
function useVirtualScroll(totalSize: number, 
  maxCssSize = MAX_SUPPORTED_CSS_SIZE, minNumberPages = MIN_NUMBER_PAGES): VirtualScroll
```

Then all I need to do is pass the props through in `VirtualList` and `VirtualGrid`. My paging functional test sample looks like this.

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

Paged scrolling is activated for containers larger than 1500 pixels with 5 pages for every 1500 pixels. The container in this sample is 3000 pixels (100 items by 30 pixels each) for a total of 10 pages.

# On Scroll Callback

My previous functional testing relied heavily on browser debugging tools to monitor the scroll state. If I had an `onScroll` callback, I could display scroll state values as part of the sample. An `onScroll` callback is another thing on my [missing feature list]({% link _posts/2024-01-29-modern-react-virtual-scroll-grid.md %}) compared with [`react-window`](https://github.com/bvaughn/react-window). 

The `react-window` class based components invoke the callback in `componentDidMount` and `componentDoUpdate`. This is equivalent to using an [effect](https://react.dev/reference/react/useEffect) in modern React. The end result is that the callback is invoked after the state has been updated and the component rendered.

I don't want to do it like that. The React mental model is that events trigger changes to state which React uses to render a new version of the UI, then we go round again with events based on the updated UI. 

{% include candid-image.html src="/assets/images/frontend/react-state-as-snapshot.svg" alt="React State as a Snapshot" %}

With a normal list component you would add an `onScroll` event handler on the outer `div` to change state in other components based on how the list has been scrolled. You can't do that with `VirtualList` because of the paging system. The `scrollTop` value on the outer `div` is the position within the current page not the list as a whole. That's one reason why we don't give direct access to the `div`.

I need to provide my own `onScroll` that abstracts away the details of the paging system. However, I want it to behave like `OnScroll` on the underlying div. In particular, I want it to be invoked during scroll event processing. Then a subscriber can change state in other components to match, before the app is re-rendered. 

## Implementation

I added an `onScroll` callback to the `VirtualList` props. The callback for `VirtualGrid` will have different parameters so it can't be in the shared props.

```
export interface VirtualListProps extends VirtualBaseProps {
  ...
  onScroll?: (offset: number, newScrollState: ScrollState) => void;
};
```

The callback has two parameters. All you need in most cases is the offset being scrolled to in the overall list. The second parameter is the full `ScrollState` for more advanced use cases, like my functional test. The `ScrollState` includes the `scrollOffset` in container space, the `renderOffset` you need to add to get the offset in list space, the current page for paged scrolling and the current `scrollDirection`.

```
export type ScrollDirection = "forward" | "backward";
export interface ScrollState { 
  scrollOffset: number, 
  renderOffset: number,
  page: number, 
  scrollDirection: ScrollDirection, 
};
```

I updated the sample app to display the current offset and ScrollState properties, as well as the item corresponding to that offset. As this is a functional test I didn't spend any time making it look pretty. 

Everything worked as expected except when using the "Item" text entry box. The reported `scrollDirection` is always `forward` regardless of what item you're scrolling to. 

I have a unit test for that functionality in `useVirtualScroll.test.ts` which passes. There must be something going wrong at the `VirtualList` level. This is the first time I've exposed `scrollDirection` at the component level so I haven't been able to test this before. 

It took me a long time to work out the problem. All `VirtualList` does is call a `doScrollTo` helper method provided by `useVirtualScroll`, which is what my existing unit test checks. Here's the relevant parts of the `VirtualList` code. Can you see the problem?

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

The `useImperativeHandle` hook takes three arguments. The ref to bind your proxy object to, a lambda that creates and returns the proxy object and an array of dependencies. I'd skimmed over the  [React documentation](https://react.dev/reference/react/useImperativeHandle) and understood that I needed to include any state and props referenced by the proxy object in the dependency array. 

There's nothing magical about state and props. React caches and reuses the created proxy object, only calling the creation lambda if the dependencies have changed. The `doScrollTo` helper method captures state variables in order to work out the scroll direction. It isn't listed in the dependencies array which means that the captured state it uses for the comparison is always the initial `ScrollState`. Anywhere you scroll to is forwards from that.

All I need to do is update the dependencies array. While I'm at it, I need to add `isVertical` too. I forgot to add that as a dependency when I added horizontal scroll support. However, before I do that, I need to write a failing unit test that demonstrates the problem.

```
// Scroll back to first item
{act(() => { proxy.scrollToItem(0); })}
...
expect(onScroll).toBeCalledWith(0, 
  { scrollOffset: 0, renderOffset: 0, page: 0, scrollDirection: 'backward'})
```

Failing unit test written. Dependency array updated. Unit test passes. Sample app works. Job done. 

# Try It

The paging functional test is embedded below or you can [explore the full set of samples](/assets/dist/react-virtual-scroll-0-3-0/index.html).

{% include candid-iframe.html src="/assets/dist/react-virtual-scroll-0-3-0/samples/paging-functional-test/index.html" width="100%" height="fit-content" %}

# Finishing Up

All that's left is making the corresponding changes to VirtualGrid. The `onScroll` function looks like this.

```
export interface VirtualGridProps extends VirtualBaseProps {
  ...
  onScroll?: (rowOffset: number, columnOffset: number, 
    newRowScrollState: ScrollState, newColumnScrollState: ScrollState) => void;
};
```

The rest of the changes are mechanical and straightforward now that we've got `VirtualList` working. Have a look at the [commit](https://github.com/TheCandidStartup/infinisheet/commit/6287d28281bcdfa9c04891c15602c505bf59a69a) if you're interested in the detail.

All that's left is to publish a [new package](https://www.npmjs.com/package/@candidstartup/react-virtual-scroll/v/0.3.0). The package page in NPM has some interesting changes. Can you see what's changed compared with [0.2.0](https://www.npmjs.com/package/@candidstartup/react-virtual-scroll/v/0.2.0)? 

I'll tell you all about it [next time]({% link _posts/2024-06-17-supply-chain-provenance.md %}).
