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

# Removing Scroll End support

My `useIsScrolling` implementation uses `'onscrollend' in window` to determine whether the DOM supports the `scrollend` event. My first job is to mock `window` so that it's `onscrollend` property is undefined. 

* Have to bounce between vitest and jest documentation. Vitest documentation lacks detail. It claims to have a jest compatible API, so need the jest docs for detail.
* The [`replaceProperty` API](https://jestjs.io/docs/jest-object#jestreplacepropertyobject-propertykey-value) looks like it will do what I want.
* It doesn't exist in vitest. Apparently there are a few differences.
* The [Vitest Migration Guide](https://vitest.dev/guide/migration.html#migrating-from-jest) suggests using `vi.stubEnv` or `vi.spyOn` instead. The former will mock environment variables, the latter will mock the return value from a getter function. However, I want the property itself to appear undefined. 
* A trawl through the entire vitest API eventually turned up `vi.stubGlobal`. At first glance it only lets you stub global variables. However, the description suggests that with jsdom `someGlobalVariable` and `window.someGlobalVariable` are equivalent.

