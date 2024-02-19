---
title: >
    Modern React Virtual Scroll Grid 5 : Is Scrolling
tags: frontend
---

Next up on my list of features to implement is a `useIsScrolling` custom hook. It should be a good test of hook composition as I want to use it in conjunction with the `useVirtualScroll` hook  I've [already implemented]({% link _posts/2024-02-05-modern-react-virtual-scroll-grid-2.md %}).  

# React-Window Implementation

{% capture mrvs3_url %}{% link _posts/2024-02-12-modern-react-virtual-scroll-grid-3.md %}{% endcapture %}
This is another feature that I'm porting over from the [react-window](https://github.com/bvaughn/react-window) controls. The controls keep track of whether the user is actively scrolling. This is used internally to determine how to render [overscan items]({{ mrvs3_url | append: "#get-range-to-render" }}). It can optionally be passed to child items so that they can change how they're rendered while scrolling. For example, they might disable heavyweight styles to ensure the control is as responsive as possible while scrolling.

The react-window implementation is fairly simple. An `isScrolling` state variable gets set whenever a scroll event is received. The flag is cleared after a 150ms timeout. Strangely, the timeout isn't implemented using the obvious JavaScript built-in `setTimeOut` function. 

# setTimeout vs requestAnimationFrame

React-window uses a [utility function](https://github.com/bvaughn/react-window/blob/master/src/timer.js) based on a [gist from 2010](https://gist.github.com/joelambert/1002116#file-requesttimeout-js) that emulates the `setTimeout` interface using `requestAnimationFrame`. When the code is called back from `requestAnimationFrame` it checks whether enough time has elapsed and if not calls `requestAnimationFrame` again. Effectively, it's replaced a single call of `setTimeout` with a busy-wait loop.

Why bother? All the comment on the gist says is "for better performance". 

`requestAnimationFrame` was introduced around this time as a better way of implementing animations than using `setTimeout`. The problem with `setTimeout` is that you don't know how fast frames are being rendered. You need to make the timeout interval short enough that you don't miss a frame but not so short that you're wasting cycles and hurting battery life by running too often. Using `requestAnimationFrame` is clearly better. You get called once before each frame is rendered, so you do exactly the right amount of work.

However, in this case, we're not implementing an animation. We actually want a timeout. The other improvement that `requestAnimationFrame` brings is that it doesn't fire on inactive tabs. There are no wasted cycles animating something that isn't visible. But we're not animating! The scroll end timeout is only active while the user is scrolling. You can't scroll on an inactive tab.

Since `requestAnimationFrame` was released, `setTimeOut` implementations have been updated to reduce the rate at which they fire on inactive tabs. Which turns out to be the [reason](https://github.com/bvaughn/react-virtualized/pull/742) for using requestAnimationFrame. 

{% capture note-content %}
Note to self. When you can't understand why the code is the way it is, start by looking at the commit history and any associated issues before going on a wild goose chase.
{% endcapture %}
{% include candid-note.html content=note-content %}

Browsers seem to be quite eager to throttle the rate of setTimeout, even on active tabs, with the result that it can take a second or two for end scrolling to be detected. `requestAnimationFrame` runs at the browser's natural rate for rendering. Typically 30 to 60 frames a second. Hence, no perceivable lag. 

All of which made me wonder. Is this really still the best way of detecting when scrolling ends? 

# Scrollend Event

Amazingly, until six months ago, it really was the best way of detecting when scrolling ends. Then browsers started [adding support](https://developer.chrome.com/blog/scrollend-a-new-javascript-event) for a dedicated [`scrollend`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event) event. 

At time of writing, it's only available on the most recent releases of the major browsers. On my machine, the installed versions of Chrome and Firefox support it, but Safari doesn't. 

The suggestion is to check at runtime whether the event is available and if not to fallback to a timeout based implementation. It would be great if a `useIsScrolling` hook could handle all that for me. 

# Hooks and Events

My current useVirtualScroll hook returns a function which the hosting component needs to call from the onScroll event handler. That's just about manageable for a single event. Doing the same for useIsScrolling would be a mess. It would need to return both an onScroll and onScrollEnd function, with the hosting component having to deal with checking for whether onScrollEnd is supported.

Support for OnScrollEvent was added to the React main branch on October 11, 2023. It's not in any stable release yet. The only way of handling unsupported events is to add an event listener directly to the DOM element. Which means using a ref and binding it to the element, then a `useEffect` to manage the DOM event listener. 

Surely someone has already written custom hooks to manage timeouts and event listeners? 

I found a [useTimeout](https://www.joshwcomeau.com/snippets/react-hooks/use-timeout/) implementation quite quickly, based on Dan Abramahov's in depth description of how to build [useInterval](https://overreacted.io/making-setinterval-declarative-with-react-hooks/). Which is a great read on some of the gotchas involved with trying to wrap an imperative API like `setInterval` and create a declarative API like `useInterval`. The solution he came up with uses two separate `useEffect` hooks (with different dependencies) and a `useRef`, rather than the single `useEffect` you might think you need. 

I'm glad I came across Dan's blog first, because all of the many [many](https://github.com/donavon/use-event-listener) [implementations](https://github.com/realwugang/use-event-listener) [of](https://github.com/uidotdev/usehooks/blob/experimental/index.js#L329) `useEventListener` that I found use the same pattern. 

Ideally I'd be able to use `useEventListener` if scrollend is supported, otherwise fall back to a `useTimeout` based implementation. The [rules of hooks](https://react.dev/warnings/invalid-hook-call-warning) make that difficult. You have to declare all hooks that you might need in the same order for every render. The standard pattern is hooks that can be setup conditionally to do nothing. You declare both hooks, which both have effects that run, but only one actually does anything. 

# Hooks and Reuse

Which leaves me with a question. To what extent should I try and reuse existing third party hooks? Reuse of existing code is what open source is all about. And yet ...

Hooks are small enough that it feels like adding too many bitty dependencies when you could just copy the snippet of code needed. Pulling in a library of hooks means settling for less than the ideal implementation of some hooks. I'm naturally paranoid about taking dependencies. I still remember the [left-pad debacle](https://www.theregister.com/2016/03/23/npm_left_pad_chaos/). I only want to add dependencies for things that add enough value.

If I want to reuse the hard won learning from react-window's isScrolling implementation I'll have to write my own useAnimationTimeout. I couldn't find an existing hooks based implementation. If I'm doing that, would it be better to write `useIsScrolling` without any intermediate hooks? I could have one effect that either manages an event listener or a timeout as appropriate. 

After some thought, I've decided that I'm going to try to do it the "right" way first. One of the advantages claimed for hooks is the way that they can be composed and used as building blocks, so let's try it out.

# useEventListener

I started with the easiest one. [One](https://github.com/realwugang/use-event-listener) of the existing implementations of useEventListener that I found is written in TypeScript, so that seemed like a good starting point. Until I looked at the code. 

There's lots of boilerplate to support browsers that don't have the `addEventListener` API, which has been [widely supported](https://caniuse.com/?search=addEventListener) since 2011. Won't need that. 

The hook tries to support listening to events on multiple different sources. Central to this support is testing whether the source it has been passed is an HTML element. Which it does in the most bizarre way. 

```
function isHtmlControl (obj: any): boolean {
  const div = document.createElement("div")
  try {
    div.appendChild(obj.cloneNode(true))
    return +obj.nodeType === 1
  } catch (e) {
    return false
  }
}
```

There's a case to be made for using duck typing for the most general solution, rather than the simple `obj instanceOf Element`, but this is ridiculous. 

{% capture note-content %}
Note to self. Spend the time needed to validate dependencies, even if you're just copying and pasting code.
{% endcapture %}
{% include candid-note.html content=note-content %}

In the end I kept the TypeScript type assertions and replaced almost everything else with [another implementation](https://github.com/donavon/use-event-listener). 

I made the mistake of thinking that the interface only needed to support `HTMLELement` as an event source. The hosting component can bind a ref to the element and then call `useEventListener(ref.current)`. Which is an interesting example of a temporal off-by-one error. 

The HTML element doesn't get bound to the ref until *after* the first render. Which would normally not be a problem because the element is used inside an effect which runs after the ref is bound. Of course, that only works if you pass the ref all the way though to the effect and dereference it there.

```
type Listener = Window | Document | HTMLElement;

export function useEventListener(eventName: string, 
                                 handler: (event: Event) => void,
                                 element: Listener | RefObject<HTMLElement> | null = window,
                                 options: Options = {}) {
  const savedHandler = useRef<any>();
  const { capture, passive, once } = options;

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    if (!element)
      return;

    const el =  isListener(element) ? element : element.current;
    if (!el)
      return;

    const eventListener = (event: Event) => savedHandler.current(event);
    const opts = { capture, passive, once };
    el.addEventListener(eventName, eventListener, opts);
    return () => {
      el.removeEventListener(eventName, eventListener, opts);
    };
  }, [eventName, element, capture, passive, once]);
}
```

The [implementation](https://github.com/TheCandidStartup/react-virtual-scroll-grid/blob/2f565e6f0fe76398b6a1e268d12d44e008c790ff/src/useEventListener.ts#L18) supports elements that you can directly call `addEventListener` on, as well as React refs to `HTMLElement`. The utility function `isListener` is my implementation of the `isHtmlControl` check. It showcases use of TypeScript [type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates). The check is simple enough, does the input have an `addEventListener` property defined? We're relying on TypeScript static typing so we don't have to cope with every possible pathological input.

```
function isListener(element: Listener | RefObject<HTMLElement>): element is Listener {
  return (element as Listener).addEventListener !== undefined;
}
```

The `element is Listener` type predicate tells TypeScript that if this function returns true, the input must be one of the `Listener` types. TypeScript automatically infers that if `isListener` returns false, the input must be a `RefObject<HTMLElement`. TypeScript can then infer and check all the types in `useEventListener` without any other type declarations or type casts needed. 

# useAnimationTimeout

I started [implementing](https://github.com/TheCandidStartup/react-virtual-scroll-grid/blob/2f565e6f0fe76398b6a1e268d12d44e008c790ff/src/useAnimationTimeout.ts#L18) `useAnimationTimeout` based on [`useTimeout`](https://www.joshwcomeau.com/snippets/react-hooks/use-timeout/) and replacing use of `setTimeout` with `requestAnimationFrame` as in [react-window](https://github.com/bvaughn/react-window/blob/master/src/timer.js). It was a bit fiddly but I just about had it done before realizing it wasn't what I needed. 

This implementation and the Dan Abramahov [blog](https://overreacted.io/making-setinterval-declarative-with-react-hooks/) that inspired it, are focused on *NOT* resetting the timeout on each render. They only reset if the delay changes. They go out of their way  to let you change the callback without a reset (the reason for the second effect and `useRef`).

For debouncing end of scroll detection we *want* a timer that resets every time we render while the control is still scrolling. At first I thought I'd need to build something higher level and special purpose, like `useDebounceTimeout`.    The more I thought about it, the more I realized that the top level useIsScrolling hook would need precise control over when the timer resets. 

I was about to give up on the idea of encapsulating the logic in a generic intermediate hook. Then I realized that all I needed to do was go back to my generic timer and add an additional `key` argument that resets the timer when changed. Just like React components have a built-in key prop that can be used to reset the whole component. 

```
export function useAnimationTimeout(callback: Callback, 
                                    delay: number | null, 
                                    key?: unknown) {
  const requestRef = useRef<number>();
  const savedCallback = useRef<Callback>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
 
  const start = now();
  
  useEffect(() => {
    function tick() {
      requestRef.current = undefined;
      if (delay === null)
        return;

      if (now() - start >= delay) {
        savedCallback.current();
      } else {
        requestRef.current = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      if (typeof requestRef.current === 'number') {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = undefined;
      }
    }
  }, [delay, key]);
}
```

# useIsScrolling

I hope all this effort was worth it. Will `useIsScrolling` come together effortlessly based on my intermediate hooks? Or will it be a nightmare of [impedance mismatches](https://devblogs.microsoft.com/oldnewthing/20180123-00/?p=97865)?

```
const DEBOUNCE_INTERVAL = 150;

export function useIsScrolling(
       element: Window | HTMLElement | RefObject<HTMLElement> | null = window): boolean {

  const [scrollCount, setScrollCount] = useState(0);

  const supportsScrollEnd = ('onscrollend' in window);

  useEventListener("scroll", () => setScrollCount(c => c + 1), element);
  useEventListener("scrollend", () => setScrollCount(0), supportsScrollEnd ? element : null);
  useAnimationTimeout(() => setScrollCount(0),  
    (supportsScrollEnd || (scrollCount == 0)) ? null : DEBOUNCE_INTERVAL, scrollCount);

  return scrollCount > 0;
}
```

To my great surprise it all came together cleanly. The key (no pun intended) was working out what to pass as the `key` argument to `useAnimationTimeout`. I needed something that reset the timeout for each render while the user was scrolling, let the timeout run to completion for any renders after they stopped scrolling and disabled the timer after that. 

Rather than storing an `isScrolling` boolean in the state, I have a `scrollCount` that tracks the number of frames rendered since the user started scrolling. The count gets incremented on each scroll event and reset back to zero when scrolling ends. While the user is scrolling, the count is incrementing which resets the timer. Once they stop scrolling the count remains the same allowing the timer to run to completion. The timer is disabled when the count is zero. 

# Early Adopter Woes

I updated the test app to change the CSS style of the child items while scrolling - the items are greyed out. I tested with Chrome, Firefox and Safari. Chrome and Firefox support the scrollend event and use the scrollend listener, Safari doesn't so has to use the animation timeout. They all worked great when scrolling using the mouse. Chrome and Firefox respond instantly when you let go of the mouse button. There's a noticeable delay waiting for the timeout when using Safari.

The problems start when using the keyboard and mouse wheel to scroll. Safari continues to work fine. Chrome and Firefox would occasionally get stuck in scrolling mode. After a lot of debugging, the reason was clear cut. Scroll end events were sometimes missing. With Chrome the trigger is scrolling using the arrow keys, holding a key down until you hit the top or bottom of the control. It was different with Firefox. There were no missing scroll end events. However, you sometimes get a spurious extra scroll event after the scroll end. Particularly when using the mouse wheel.

It seems like they haven't got all of the bugs out of their scroll end implementations yet. Which left me in a quandary. Should I give up on using the scroll end event? Then I realized. It's a very simple change to [use both](https://github.com/TheCandidStartup/react-virtual-scroll-grid/blob/2f565e6f0fe76398b6a1e268d12d44e008c790ff/src/useIsScrolling.ts#L8C62-L8C87). If the scroll end event fires, then great. If not I have the animation timeout available as a fallback. Even better, if the scroll end event fires, it clears the scroll count which disables the timer. No redundant work needed.

```
const DEBOUNCE_INTERVAL = 150;
const FALLBACK_INTERVAL = 500;

export function useIsScrolling(
       element: Window | HTMLElement | RefObject<HTMLElement> | null = window): boolean {

  const [scrollCount, setScrollCount] = useState(0);

  const supportsScrollEnd = ('onscrollend' in window);
  const delay = supportsScrollEnd ? FALLBACK_INTERVAL : DEBOUNCE_INTERVAL;

  useEventListener("scroll", () => setScrollCount(c => c + 1), element);
  useEventListener("scrollend", () => setScrollCount(0), supportsScrollEnd ? element : null);
  useAnimationTimeout(() => setScrollCount(0), 
    (scrollCount == 0) ? null : delay, scrollCount);

  return scrollCount > 0;
}
```

There's one extra change. I use a longer delay when using the timeout as a fallback for missing scroll events. I don't need to be as trigger happy when covering for the occasional missing scroll end event. 

# Try It!

As ever, feel free to [try it out](/assets/dist/modern-react-scroll-grid-5/index.html) for yourself. Please let me know of any browser versions with odd behavior. 

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-5/index.html" width="100%" height="fit-content" %}

# Conclusion

I've been pleasantly surprised by how well hooks worked here. I was able to separate low level concerns into separate reusable hooks. Each hook, while complex in behavior, remained short enough to view and understand. Composing the low level hooks into a high level custom hook resulted in simple, declarative code. Even better, the logic was equally simple to adjust when working around browser bugs with the scroll end event. 

However, it's become clear to me that I've reached a level of complexity where I need to put some unit tests in place. I've hit the limit of what can sensibly be maintained by manual testing and printf debugging. 

Which will make a great topic for next time. 
