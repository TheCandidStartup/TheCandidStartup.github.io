---
title: Vitest Timer Mocks and User Events
tags: frontend
---

Last time we got Vitest's code coverage tools up and running. Now I'm going to use the code coverage results to drive improvements to my unit test suite. As we go through this process I'll need to lean on additional [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) features.

# Starting Point

How's our coverage looking at the moment?

{% include candid-image.html src="/assets/images/coverage/coverage-start.png" alt="Coverage Starting Point" %}

Ignore `App.tsx`, `VirtualScroller.jsx` and `main.tsx`. They're part of my sample app so not in scope for unit testing. At some point I'll have to put a proper monorepo structure in place so that I can separate the different logical modules properly.

The three source files with dedicated unit tests look pretty healthy: `useEventListener.ts`, `useVirtualScroll.ts` and `VirtualList.ts`. The current `VirtualList` unit test is for fixed size items. Hence `useFixedSizeItemOffsetMapping.ts` has 100% coverage across the board and `useVariableSizeItemOffsetMapping.ts` has 0%. 

The remaining two files, `useAnimationTimeout.ts` and `useIsScrolling.ts`, have partial coverage. Which is understandable because the features they implement aren't are a focus for the existing tests. The tests don't scroll anything yet, so the `useIsScrolling` hook does nothing except initialize itself. The `useAnimationTimeout` hook is activated when `useIsScrolling` receives scroll events, so it's not doing anything either.

We should be able to get a big jump in coverage by updating the `VirtualList` tests to include handling scroll events and testing a variable sized item list.

# 