---
title: Vitest Mocking Time
tags: frontend
---

Last time we achieved a significant increase in code coverage by unit testing the effect of scroll events. As a reminder, here's what our coverage looked like when we finished up.

{% include candid-image.html src="/assets/images/coverage/coverage-end.png" alt="Coverage Starting Point" %}

Apart from a few edge cases, the main thing left to test is my fallback timeout implementation if the `scrollend` event isn't implemented or goes missing. To do that we'll need to [mock](https://vitest.dev/guide/mocking.html) up a missing `scrollend` implementation. Once we get into testing the details of my timeout implementation, we'll need to [mock JavaScript's timer APIs](https://vitest.dev/guide/mocking.html#timers).

# Setup

A lot of what I'll be doing is validating edge cases in my custom hooks. It's easier to do that in a lower level, more targeted unit test. I added `useIsScrolling.test.ts`. 

I started off with a basic test that mirrors what my component level test is doing. Sending a `scroll` event so that `useIsScrolling()` returns `true`, and then then sending a `scrollend` event so that it returns `false`.

```
  it('should be true on scroll and false on scrollend', () => {
    const { result } = renderHook(() => useIsScrolling())
    expect(result.current).toBe(false);

    {act(() => {
      fireEvent.scroll(window, { target: { scrollTop: 100 }});
    })}
    expect(result.current).toBe(true);

    {act(() => {
      fireEventScrollEnd(window);
    })}
    expect(result.current).toBe(false);
  })
```

I also get to cover one of the outstanding edge cases by running the hook on the DOM `window`, which is the default target for `useIsScrolling`. 

# Mocking No Scroll End Support

My `useIsScrolling` implementation uses `'onscrollend' in window` to determine whether the DOM supports the `scrollend` event. My first job is to mock `window` so that it's `onscrollend` property is undefined. 

* Have to bounce between vitest and jest documentation. Vitest documentation lacks detail. It claims to have a jest compatible API, so need the jest docs for detail.
* The [`replaceProperty` API](https://jestjs.io/docs/jest-object#jestreplacepropertyobject-propertykey-value) looks like it will do what I want.
* It doesn't exist in vitest. Apparently there are a few differences.
* The [Vitest Migration Guide](https://vitest.dev/guide/migration.html#migrating-from-jest) suggests using `vi.stubEnv` or `vi.spyOn` instead. The former will mock environment variables, the latter will mock the return value from a getter function. However, I want the property itself to appear undefined. 
* A trawl through the entire vitest API eventually turned up `vi.stubGlobal`. At first glance it only lets you stub global variables. However, the description suggests that with jsdom `someGlobalVariable` and `window.someGlobalVariable` are equivalent.
* Let's try it out

```
describe('useIsScrolling undefining onscrollend', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  })

  it('should fallback to timer if scrollend unimplemented', () => {
    vi.stubGlobal('onscrollend', undefined);
    ...
  })
})
```

* It does override `window.onscrollend` but all it does is change the value of the property from `null` to `undefined`. The property still exists.
* I did consider changing my implementation in `useIsScrolling` to explicitly check to see if `onscrollend` had been set to undefined but that seemed like cheating. Doesn't make any sense to include in production code. 
* I dug into how vitest implements global stubbing. It's very simple. It uses `Object.defineProperty()` to set the value of the property and records the original value in a global map. If the property didn't previously exist it uses `Reflect.deleteProperty()` to remove it in `unstubAllGlobals()`. 
* I can write my own version that actually deletes the property if asked to undefine it, and make it work for any object property like Jest's `replaceProperty` API.
* Put it all together and we end up with a test like this ...

```
describe('useIsScrolling undefining onscrollend', () => {
  afterEach(() => {
    vi.unstubAllPropeties();
  })

  it('should fallback to timer if scrollend unimplemented', () => {
    stubProperty(window, 'onscrollend', undefined);

    const { result } = renderHook(() => useIsScrolling())
    expect(result.current).toBe(false);

    {act(() => {
      fireEvent.scroll(window, { target: { scrollTop: 100 }});
    })}
    expect(result.current).toBe(true);

    // Wait long enough ...

    expect(result.current).toBe(false);
  })
})
```

* Which of course fails. THe timeout hasn't fired by the time the test ends. How do we handle that? 
* The naive thing would be to actually wait. In a C style language you could throw in a `sleep(1000)`.
* In Javascript you have to rely on asynchronous code, not least because the timeout won't be delivered until execution returns to the event loop. 
* With async/await semantics in modern Javascript it doesn't look too different once we've implemented `sleep` by wrapping a promise around `setTimeout`.

```
  function sleep(delay: number) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  it('should fallback to timer if scrollend unimplemented', async () => {
    stubProperty(window, 'onscrollend', undefined);

    const { result } = renderHook(() => useIsScrolling())
    expect(result.current).toBe(false);

    {act(() => {
      fireEvent.scroll(window, { target: { scrollTop: 100 }});
    })}
    expect(result.current).toBe(true);

    await sleep(1000);

    expect(result.current).toBe(false);
  })
```

* It works, but has some serious problems. The test now depends on wall clock time which can easily make for non-deterministic flaky tests.
* To reduce the chance of failing, make the delay longer ...
* Which is the other serious problem. Your tests will take ages. My test reruns have gone from 200ms to 1.2 seconds and I've only added a single time based test.
* React also complains because the timeout triggered by the async sleep modifies React state without being wrapped in in `act`.
* Which means we also need to use the async version of act: 

```
    await act(async () => { await sleep(1000); });
```

# Mocking Time
