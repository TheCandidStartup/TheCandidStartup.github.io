---
title: >
    Modern React Virtual Scroll Grid 6 : ScrollTo
tags: frontend
---

{% capture rvs_url %}{% link _posts/2024-01-29-modern-react-virtual-scroll-grid.md %}{% endcapture %}
Now that we've got [unit testing set up]({% link _posts/2024-03-11-bootstrapping-vitest.md %}) and achieved [good coverage]({% link _posts/2024-04-02-vitest-mocking-time.md %}) with our initial tests, it's time to go back to the [plan]({{ rvs_url }}) and implement the next feature on the list. This time we're looking at providing [`ScrollTo` and `ScrollToItem`]({{ rvs_url | append: "#scrollto" }}) methods for our virtual list control. 

# The Plan

This is the last significant piece of functionality to validate with modern React. Adding your own custom methods to a classic class based React component is straight forward. It's a class, just add a method. In contrast, adding methods to a modern function component is anything but. The theory is well documented. Wrap your function in a `forwardRef` so that it can [accept a `ref` prop](https://react.dev/reference/react/forwardRef#forwardref). Then use the `useImperativeHandle` hook to [bind the ref to a proxy object](https://react.dev/reference/react/forwardRef#exposing-an-imperative-handle-instead-of-a-dom-node) with the methods that you want to expose.

The same mechanism can be used to expose our own custom methods as well as forwarding standard DOM methods to internal HTML elements. In classic React you would often let clients bind refs directly to a component's internal HTML element. Using a proxy object adds an abstraction layer which avoids directly exposing our component's internal structure. 

The equivalent class based [react-window control](https://react-window.vercel.app/#/api/FixedSizeList) allows you to pass both innerRef and outerRef props which bind to the inner and outer divs of the implementation. The `forwardRef` mechanism used for function components only supports a single ref. However, by using a proxy object we hide the details of which inner HTML elements are involved. We can expose methods that interact with either the inner or outer divs as appropriate. 

# Test Driven Development

Honestly, I started with the best intentions. I was going to try and do proper [Test Driven Development](https://en.wikipedia.org/wiki/Test-driven_development). 
* Write a unit test. 
* Write the interface and stub implementation needed to to make it "compile". 
* Confirm that the test fails. 
* Write enough implementation to make the test pass. 
* Rinse and repeat

I find it really hard to get a grasp on the big picture doing it that way. In my view the important thing is to think a step or two ahead. Design your interfaces for testability but also make sure the pieces will eventually fit together. 

I'm going to start in the middle by writing the interface and stub implementation, including the TypeScript typing. Then I can validate interface usability by writing test cases that interact with it. That includes seeing how well the tooling, such as Intellisense, helps me. Writing the implementation still comes last. 


Here's the significant parts of the interface and stub implementation.

```
export interface VirtualListProxy {
  scrollTo(offset: number): void;
  scrollToItem(index: number): void;
};

export const VirtualList = React.forwardRef<VirtualListProxy, VirtualListProps>((props, ref) => {
  const { itemOffsetMapping } = props;
  const outerRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => {
    return {
      scrollTo(offset: number): void {
        outerRef.current?.scrollTo(0, offset);
      },

      scrollToItem(index: number): void {
        this.scrollTo(itemOffsetMapping.itemOffset(index));
      }
    }
  }, [ itemOffsetMapping ]);
...
```

The proxy object has a simple `scrollTo` offset method and `scrollToItem`. I can add more methods over time. 

My simple `function VirtualList` gets turned into a messy looking `const VirtualList = forwardRef<>(() => ...` expression. However, typing works out nicely. `forwardRef` is defined as generic on the wrapped component's props and the ref type. I need to declare each type once and TypeScript infers the rest. 

`scrollTo` just forwards on to the equivalent method on the outer div element. The list control supports scrolling in one dimension only, so no point allowing both x and y scroll arguments. 

`scrollToItem` is then a simple one liner that converts item index to offset and calls `scrollTo`. I need to make use of the `itemOffsetMapping` prop to do the conversion which means it needs to be declared as a dependency for useImperativeHandle.

Oh dear, I seem to have ended up implementing it too. So much for TDD.  At least I did write the unit test before trying it out in my sample app.

```
    const ref = React.createRef<VirtualListProxy>();
    render(
      <VirtualList
        ref={ref}
        height={240}
        itemCount={100}
        itemOffsetMapping={mapping}
        width={600}>
        {Cell}
      </VirtualList>
    )
    const proxy = ref.current || throwErr("null ref");
    {act(() => {
      proxy.scrollTo(100);
    })}
...
```

Intellisense works well. If I try to create an untyped ref with `React.createRef()`, I get an Intellisense error that tells me I need to pass a `Ref<VirtualListProxy>` as the `ref` prop. Then when I try to use the proxy I get Intellisense auto-complete suggestions for the available methods. 

Unfortunately, I get a failure at runtime when I execute the test. 

```
TypeError: outerRef.current?.scrollTo is not a function
 ❯ Object.scrollTo src/VirtualList.tsx:126:65

 ❯ src/VirtualList.test.tsx:113:20
 ```

 At first I thought I was dealing with some weird TypeScript error. Then I realized that the error wasn't shown in the IDE as I typed and came with a runtime call stack. I still had no idea what was going on but once more the internet [came to my rescue](https://github.com/vuejs/vue-test-utils/issues/319). The problem is that `scrollTo` is one of the small list of [unimplemented methods](https://github.com/jsdom/jsdom/blob/2f8a7302a43fff92f244d5f3426367a8eb2b8896/lib/jsdom/browser/Window.js#L932) in jsdom. 

 The best I can do as far as a unit test goes is to provide a mock implementation and validate that it's called with the expected arguments. I could implement enough that I could also exercise the underlying functionality by setting `scrollTop` and sending scroll events, but that would only duplicate what I'm doing in my existing tests that send scroll events.

I wanted to use `vi.spyOn` to create and install my mock as I could then use `vi.restoreAllMocks` in an `afterEach` to cleanup. Unfortunately, `spyOn` refuses to install the mock if there's no existing function. As I only need this for a single test, it was easier to setup and teardown manually.

```
    const mock = vi.fn();
    Element.prototype["scrollTo"] = mock;
    
    try {
      ...

      proxy.scrollTo(100);
      expect(mock).toBeCalledWith(0, 100);

      proxy.scrollToItem(42);
      expect(mock).toBeCalledWith(0, 42*30);
    } finally {
      Reflect.deleteProperty(Element.prototype, "scrollTo");
    }
```

I don't need to wrap my call to `scrollTo` in an `act` as it's being mocked and no React state gets updated.

# End to End Testing

It does mean that I'm back to manual testing to validate that `scrollTo` works end to end as expected. In future I might look at [Playwright](https://playwright.dev/) or similar for automated end to end tests.

I added an input field to my test app and hooked it up to the `scrollToItem` method. It all seemed to work with a couple of annoyances. 

The OnChange handler on the input field fires on every key stroke which gets annoyingly jumpy. The HTML change event is only meant to fire on enter or [when the control loses focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event). It turns out that OnChange in React [behaves differently](https://stackoverflow.com/questions/31272207/to-call-onchange-event-after-pressing-enter-key). It intentionally fires on any change, perhaps in order to be more "reactive". 

The other annoyance is that I can't scroll to index 0. The closest I can get to the top is "Item 1". My first thought was that there was something wrong with the code I'd just written or that I'd misunderstood how `ScrollTo` works. 

It turns out that I have a bug in my extensively unit tested, 100% code coverage, `useVariableSizeItemOffsetMapping.itemOffset` method. Which reinforces the point that 100% code coverage doesn't mean 100% tested.

I did the right thing when I fixed it. First add a unit test case that reproduces the bug, fix it, then confirm that the test passes.

```
      proxy.scrollToItem(0);
      expect(mock).toBeCalledWith(0, 0);
```

# Try It!

As ever, feel free to [try it out](/assets/dist/modern-react-scroll-grid-6/index.html) for yourself. 

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-6/index.html" width="100%" height="fit-content" %}