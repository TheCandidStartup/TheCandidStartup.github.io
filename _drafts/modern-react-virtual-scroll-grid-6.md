---
title: >
    Modern React Virtual Scroll Grid 6 : Scroll To
tags: frontend
---

* Refer back to [plan]({% link _posts/2024-01-29-modern-react-virtual-scroll-grid.md %}) with direct link to ScrollTo section
* Last significant piece of functionality to validate with modern React
* Using an imperative handle lets us expose our own methods as well as forwarding standard DOM methods
* Acts as an abstraction layer which means we aren't directly exposing internals
* Equivalent class based react-window control allows you to pass both innerRef and outerRef which bind to the inner and outer divs of the implementation
* With function component and forwardRef you are only allowed a single ref
* Only need a single ref with imperative handle as we can expose methods which apply to either inner or outer div as appropriate
* Was going to try and do proper TDD: write the test, write interface/stub needed to make it "compile", write implementation that will pass test
* Hard to get a grasp on the big picture doing it that way. In my view the important thing is to think a step or two ahead. Design your interfaces for testability but also make sure the pieces will eventually fit together.
* Going to start by writing interface/stub including typing. Then write test case to try out consuming the interface, including intellisense. Then implementation.
*  Here's the significant parts of the interface and stub implementation

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

* Started with just a simple `scrollTo` offset method and `scrollToItem`. Can add more methods over time. 
* My simple `function VirtualList` gets turned into a messy looking `const VirtualList = forwardRef(() => ...` expression
* Typing works out nicely. `forwardRef` is defined as generic on the wrapped components props and the ref type. Only need to declare each type once and TypeScript infers the rest. 
* `scrollTo` just forwards on to the equivalent method on the outer div element. List is vertical so no point allowing both x and y scroll arguments.
* `scrollToItem` is then a simple one liner that converts item index to offset and calls `scrollTo`
* As I make use of the itemOffsetMapping prop, I need to declare it in the list of dependencies for useImperativeHandle.
* Oh dear, I seem to have ended up implementing it too. So much for TDD.  
* At least I did write the unit test before trying it out in my sample app.

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

* Intellisense works nicely as long as I know I'm trying to create a ref to a VirtualListProxy
* I get a failure at runtime. 

```
TypeError: outerRef.current?.scrollTo is not a function
 ❯ Object.scrollTo src/VirtualList.tsx:126:65

 ❯ src/VirtualList.test.tsx:113:20
 ```

 * At first I thought I was dealing with some weird TypeScript error. Then I realized that the error wasn't shown in the IDE as I typed and came with a call stack at runtime. 
 * Still not sure what was going on but once more the internet [came to my rescue](https://github.com/vuejs/vue-test-utils/issues/319) after a quick google. The problem is that `scrollTo` is one of the small list of [unimplemented methods](https://github.com/jsdom/jsdom/blob/2f8a7302a43fff92f244d5f3426367a8eb2b8896/lib/jsdom/browser/Window.js#L932) in jsdom. 
 * The best I can do as far as a unit test goes is to provide a mock implementation and validate that it's called with the expected arguments. 
 * I could implement enough that I could also exercise the underlying functionality by setting `scrollTop` and sending scroll events, but that would only duplicate what I'm doing in my existing tests that send scroll events.
* I wanted to use `vi.spyOn` to create and install my mock as I could then use `vi.restoreAllMocks` in an `afterEach` to cleanup. Unfortunately, `spyOn` refuses to install the mock if there's no existing function so I have to setup and teardown manually.

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

* I don't need to wrap my call to `scrollTo` in an act as it's being mocked and no React state gets updated
* Back to manual testing to validate that it works end to end as expected
* In future I might look at Playwright or similar for automated end to end tests
* I added an input field to my test app and hooked it up the `scrollToItem` method
* All seems to work with a couple of annoyances. The OnChange handler on the input field fires on every key stroke which gets annoyingly jumpy. HTML change event is only meant to fire on enter or [when control loses focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event). 
* Turns out that OnChange in React [behaves differently](https://stackoverflow.com/questions/31272207/to-call-onchange-event-after-pressing-enter-key). It intentionally fires on any change, perhaps in order to be more "reactive". 
* The other annoyance is that I can't scroll to index 0. The closest I can get to the top is "Item 1". 
* My first thought was that there was something wrong with the code I'd just written or that I'd misunderstood how `ScrollTo` works.
* It turns out that I have a bug in my extensively unit tested, 100% code coverage, `useVariableSizeItemOffsetMapping.itemOffset` method. 
* Which reinforces the point that 100% code coverage doesn't mean 100% tested. 
* I did the right thing when I fixed it. First add a unit test that reproduces the bug, fix it, confirm that the test passes.
* 