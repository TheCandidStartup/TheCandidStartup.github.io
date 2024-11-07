---
title: >
  React Virtual Scroll 0.6.0 : Consciously Uncoupling
tags: react-virtual-scroll
---

As we discovered [last time]({% link _drafts/react-glitchy-virtual-scroll.md %}), traditional virtual scrolling implementations don't work properly. Both React and the Chrome browser prioritize responsiveness when scrolling. New frames can be displayed before virtualized components have a chance to render updated content. Content appears torn or goes blank.

Luckily, I have a plan. Instead of rendering visible content into the scrollable area, we can render it into a separate component which is placed *on top* of the scrollable area. The browser can scroll away as much as it likes without impacting the displayed content. It only changes when we update it in response to scroll events. What's displayed may be a frame behind the scroll bar position when interacting, but you don't notice because what's rendered is always consistent.

After lots of thought and experimentation, I've mirrored the decoupling of virtual scrolling and content display by breaking the functionality into separate components. This gives clients much greater flexibility in how they combine the components. Composition for the win!

I've also included pre-composed `VirtualList` and `VirtualGrid` components for simple use cases. These components are largely backwards compatible with previous versions of the package. 

It's time to introduce the new React Virtual Scrolling component family.

# Virtual Container

Let's start simple. The previous generation of components used a common pattern. Components were typically implemented using nested divs with a fixed size outer viewport div and a larger inner div holding the content. The styling and rendering of these divs can be customized by passing in optional [render props]({% link _posts/2024-10-21-react-virtual-scroll-0-5-0.md %}). 

Each component had its own implementation of the pattern, with lots of repeated boiler plate code. Now, I've pulled the common code out into a common component. `VirtualContainer` simply provides a div whose rendering can be customized via a render prop. 

```tsx
export type VirtualContainerRenderProps = React.ComponentPropsWithoutRef<'div'>;

export type VirtualContainerRender = (props: VirtualContainerRenderProps, ref?: React.ForwardedRef<HTMLDivElement>) => JSX.Element;

export interface VirtualContainerComponentProps extends VirtualContainerRenderProps {
  render?: VirtualContainerRender;
}

const defaultContainerRender: VirtualContainerRender = ({...rest}, ref) => (
  <div ref={ref} {...rest} />
)

export const VirtualContainer = React.forwardRef<HTMLDivElement, VirtualContainerComponentProps >(
  function VirtualContainer({render = defaultContainerRender, ...rest}, ref) {
    return render(rest, ref)
})
```

That's all there is to it. It's surprising how much boilerplate code I was able to get rid of. Consolidating all the special case container types into one really helped.

# Auto Sizer

After giving `VirtualContainer` such a big build up, it's ironic that my next component doesn't use `VirtualContainer` at all.

Components like `DisplayList` and `VirtualGrid` need to be given an explicit width and height so that they know what subset of the virtualized content needs to be rendered to fill the viewport. What if you want their size to be dynamic and respond as the browser window is resized and the layout changes? That's where `AutoSizer` comes in.

`AutoSizer` was inspired by [`react-virtualized-auto-sizer`](https://github.com/bvaughn/react-virtualized-auto-sizer), a companion project to `react-window`. It provides a higher order component which measures its size, then passes explicit width and height props to its children.

I've implemented my own version in modern React. The original has an overly complex implementation and boundary issues. It subscribes to events on its *parent* and resizes its child to the area of its parent. There's lots of edge cases because it can't control its parent's lifetime. At the same time, it imposes constraints on the parent. For example, it only really works if the parent has a single child. The documentation suggests the workaround of wrapping the component in a dedicated div.

I've gone for a much simpler implementation with a nested div setup. `AutoSizer` measures the size of the outer div. The outer div's size is controlled by it's parent in the usual way. There are no constraints on the parent and no unnatural interactions with it. Clients can apply whatever style they want to the outer div to influence the layout process. 

The inner div is unusual. It has zero width and height with a visible overflow. Children are added to the inner div. It's vital that children have no influence on the size of the outer div. It's easy to end up with infinite loops if we pass a measured size to a child which in turn makes itself bigger which then increases the size of it's parent. Wrapping the children in a zero size div ensures that the outer div ignores child sizes when determining it's own size. The visible overflow ensures the children are visible. 

```tsx
<div ref={ref} className={className} style={style}>
  <div style={{ overflow: 'visible', width: 0, height: 0 }}>
  {children({height, width})}
  </div>
</div>
```

There's no need to use `VirtualContainer` as these divs don't need to support additional customization. `AutoSizer` does a very specific job as a higher order component. Any further customization would be applied to the parent or children.

Children are defined using a render prop with `width` and `height` parameters. This provides flexibility in how the measured width and height are used. You use an `AutoSizer` like this:

```tsx
<AutoSizer style={{ height: '100%', width: '100%' }}>
{({height,width}) => (
  <DisplayList
    ...
    height={height}
    width={width}>
    {Row}
  </DisplayList>
)}
</AutoSizer>
```

The implementation uses a simple layout effect to determine the initial size and to add a [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) to track future resizes. Resize observers are only available in a browser context so we take care not to crash if used in a unit test or server side rendering.

```ts
React.useLayoutEffect(() => {
  const div = ref.current;
  if (!div)
    return;

  setHeight(div.clientHeight);
  setWidth(div.clientWidth);

  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(resizeCallback);
    resizeObserver.observe(div);
    return () => { resizeObserver.disconnect() }
  }
}, [resizeCallback])
```

Great care is needed to avoid running the effect repeatedly which would result in observers being repeatedly disconnected and recreated. We use separate `width` and `height` state as primitives are directly comparable by React. Subsequent renders can be short circuited if the size hasn't changed. That avoids having to explicitly check whether width and height have changed. Which in turn means there are no dependencies on state or props in the resize handler. The layout effect runs once on mount. 

* SAMPLE!

A sample app using `AutoSizer` is embedded above. It doesn't do anything interesting if you can't resize it, so best follow this link run the sample on a dedicated page.

As usual, unit testing achieves 100% code coverage. I needed to add the [`jsdom-testing-mocks`](https://www.npmjs.com/package/jsdom-testing-mocks) package to my development environment to provide a `ResizeObserver` mock as it's not supported by `jsdom`.

# Virtual Scroll

* Uncouple the virtual paged scrolling functionality from VirtualList and VirtualGrid into a separate component
* Has an `OnScroll` callback and a `contentRender` render prop for rendering content on top of the viewport
* Props for `scrollableWidth` and `scrollableHeight`
* Set both for two-dimensional scrolling experience, set one for horizontal or vertical scrolling experience
* One component does both and can dynamically switch as size of scrollable area changes relative to size of viewport

* OG VirtualScroll sample with display of state

# Virtual List

* DisplayList needs to be big enough to cover the VirtualScroll viewport client area. It can be larger, as long as it remains within the scrollable area. 
* Size client area depends on styling and whether scroll bars are visible. Using the overall size of the VirtualScroll. and not worrying about being slightly too large, doesn't work in all cases. List is the simplest example. Has a large scroll height (so vertical scroll bar displayed) but minimal width. Over sizing display list width will result in an unintended horizontal scroll bar. 
* Most general solution is to measure the actual size of the client area and pass that through to DisplayList

* VirtualList = VirtualScroll + AutoSizer + DisplayList
* Need AutoSizer because the DisplayList needs to perfectly fit the VirtualScroll client area
* If you oversize DisplayList it will impact size of scrollable area

# Display Grid

# Virtual Grid

* VirtualGrid = VirtualScroll + AutoSizer + DisplayGrid

# Upgrading

* Kept as much of the existing `VirtualList` and `VirtualGrid` interface as I could
* In general all the samples and `react-spreadsheet` just worked without any code changes despite massive internal changes
* Was most worried about `outerRender` and `innerRender` customization
* `outerRender` is used to customize how component interacts with it's parent
* `innerRender` is used to customize how component interacts with it's children
* In principle, structure in between can change
* All the `outerRender` stuff was fine
* One problem was the padding sample which recreates a `react-window` sample
* Adds padding to top and bottom of a `VirtualList`
* Uses `innerRender` to mess with layout of children
* Has strong dependency on how layout used to be done with absolute positioning
* Reimplementing equivalent hackery isn't possible with the new structure because you need access to internals
* There's a better way. If you have more complex needs use the basic components yourself

# Overscan

# Layout Shift

{% include candid-image.html src="/assets/images/react-virtual-scroll/spreadsheet-perf-decoupled-legacy.png" alt="Performance tool frame capture" %}

* Layout Shift = stuff on the page moving around
* https://web.dev/articles/debug-layout-shifts#devtools
* In our case that's expected as we're moving content in a DisplayGrid to simulate the effects of scrolling

# Cumulative Layout Shift

* Core web performance metric
* https://web.dev/articles/cls
* Calculates an abstract score based on the number and size of layout shifts during an interaction session
* Intent is to measure only unintended layout shifts - for example from async tasks like image or content load
* Layout shifts within 500ms of user interaction are ignored.

* Tool in Chrome. Here's metric when scrolling around the grid using the keyboard.
{% include candid-image.html src="/assets/images/react-virtual-scroll/web-metrics-good.png" alt="Web metrics during keyboard navigation" %}

* Here's the metric for the same grid when using mouse wheel and scroll bar
{% include candid-image.html src="/assets/images/react-virtual-scroll/web-metrics-bad.png" alt="Web metrics during scrolling" %}

* Scrolling doesn't count as intended!
* Consider this to be a false positive
* Only happens when user actively scrolling, so no impact on CLS score during page load (which is important for Google Search's [page experience](https://developers.google.com/search/docs/appearance/page-experience) based ranking)

# React 18 Rendering

{% include candid-image.html src="/assets/images/react-virtual-scroll/spreadsheet-perf-decoupled-modern.png" alt="Performance tool frame capture" %}

# Try It!

* Link to NPM release
* Spreadsheet sample

# Next Time