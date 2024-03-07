---
title: Bootstrapping Vitest
tags: frontend
---

[Last time]({% link _posts/2024-03-05-modern-react-virtual-scroll-grid-5.md %}) I reached a level of complexity in my project building a [modern react scalable virtual scrolling grid]({% link _posts/2024-01-29-modern-react-virtual-scroll-grid.md %}) control that I could no longer put off implementing unit tests. 

Time to bootstrap a unit testing framework and get some tests running. I decided to use [Vitest](https://vitest.dev/).

{% include candid-image.html src="/assets/images/vitest-logo.svg" alt="Vitest Logo" %}

# Why Vitest?

I've had a really good experience [using Vite]({% link _posts/2023-10-23-bootstrapping-vite.md %}) as my front end tooling. Vitest is Vite's native test runner. It's built on the same foundations as Vite, shares the same config and transformation pipeline, and also supports Vite's Hot Module Reload. 

The API is compatible with [Jest](https://jestjs.io/), the most popular JavaScript unit test framework, so there's lots of examples to copy from.

You can have Vite and Vitest running at the same time so that every time you save your source file, the relevant unit tests are rerun and the app is updated and reloaded. 

# Installing Vitest

The first step was to get Vitest installed.

```
% npm install -D vitest

added 64 packages, changed 3 packages, and audited 223 packages in 17s

1 high severity vulnerability

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
```

That looks scary. What's going on?

```
% npm audit
# npm audit report

vite  4.0.0 - 4.5.1
Severity: high
Vite XSS vulnerability in `server.transformIndexHtml` via URL payload - https://github.com/advisories/GHSA-92r3-m2mg-pj97
Vite dev server option `server.fs.deny` can be bypassed when hosted on case-insensitive filesystem - https://github.com/advisories/GHSA-c24v-8rfc-w8vw
```

I haven't updated anything since I first installed Vite. Let's see how out of date we are.

```
% npm outdated
Package                           Current   Wanted   Latest
@types/react                      18.2.28  18.2.57  18.2.57 
@types/react-dom                  18.2.13  18.2.19  18.2.19
@types/react-window                 1.8.7    1.8.8    1.8.8 
@typescript-eslint/eslint-plugin    6.7.5   6.21.0    7.0.2 
@typescript-eslint/parser           6.7.5   6.21.0    7.0.2 
@vitejs/plugin-react-swc            3.4.0    3.6.0    3.6.0  
eslint                             8.51.0   8.56.0   8.56.0 
eslint-plugin-react-refresh         0.4.3    0.4.5    0.4.5  
react-window                        1.8.9   1.8.10   1.8.10  
typescript                          5.2.2    5.3.3    5.3.3  
vite                               4.4.11    4.5.2    5.1.3  
```

Looks like the latest minor version of Vite 4 fixes the vulnerability. Let's see.

```
% npm update

added 9 packages, changed 43 packages, and audited 232 packages in 21s

found 0 vulnerabilities
```

There's a note in the [Vitest guide](https://vitest.dev/guide/#adding-vitest-to-your-project) that says it requires Vite 5.0.0 or later. My project is currently using Vite 4, yet npm was happy to install Vitest. Checking my `package-lock.json` file shows that Vitest does indeed have a dependency on Vite 5. Turns out that npm will [install conflicting dependencies](https://npm.github.io/how-npm-works-docs/npm3/how-npm3-works.html) as sub-dependencies.

I'm pretty sure nothing good will come of serving my app using Vite 4 while Vitest tries to use its own copy of Vite 5. The Vite 5 [migration guide](https://vitejs.dev/guide/migration.html) tells me that support has been dropped for versions of Node.js earlier than 18. I'm currently on 18.18.1. 

```
% asdf nodejs resolve lts --latest-available
18.18.1
```

Which is still the most recent LTS version. There's nothing too scary in the migration guide, so let's go for it. I updated my `package.json` dependencies to vite `^5.0.0` and updated again.

```
% npm update

removed 8 packages, changed 5 packages, and audited 224 packages in 9s

found 0 vulnerabilities
```

Let's see if everything still works.

```
npm run dev 

> react-virtual-scroll-grid@0.0.0 dev
> vite

Re-optimizing dependencies because lockfile has changed

  VITE v5.1.4  ready in 111 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

# Running Vitest

Now it's time to see whether vitest runs. I added vitest to the scripts section in `package.json`.

```
  "scripts": {
    ...
    "preview": "vite preview",
    "test": "vitest"
  },
```

Then, despite not having any tests yet, fired it up.

```
% npm run test

> react-virtual-scroll-grid@0.0.0 test
> vitest


 DEV  v1.3.1 /Users/tim/GitHub/react-virtual-scroll-grid

include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/dist/**, **/cypress/**, **/.{idea,git,cache,output,temp}/**, **/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*
watch exclude:  **/node_modules/**, **/dist/**

No test files found, exiting with code 1
```

Which seems reasonable enough. 

# In-Source Tests

The next step is to update `vite.config.ts` and add our test configuration. One of the advantages of vitest is that it shares Vite's configuration and pipeline setup. No need to keep duplicate setups in sync. 

As well as supporting classic component level unit tests defined in their own source files, Vitest also supports "in-source" tests. You can add tests directly to your source files. I'm not sure whether I'll make use of this long term but I'd like to check it out and it should be a quick way to get a test running. 

You need to configure Vitest to tell it where to look and Vite to tell it to ignore the in-source tests in release builds.

```
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    includeSource: ['src/**/*.{js,ts}'], 
  },
  define: { 
    'import.meta.vitest': 'undefined', 
  },
})
```

This feature is best used for testing private helper functions defined within the scope of each module. Let's try it out with the `isListener` function in my `useEventListener` component. We add the tests within a conditional include block.

```
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest
  it('isListener', () => {
    expect(isListener(window)).toBe(true)
  })
}
```

Now we can run the tests again.

```
npm run test

> react-virtual-scroll-grid@0.0.0 test
> vitest


 DEV  v1.3.1 /Users/tim/GitHub/react-virtual-scroll-grid

 ❯ src/useEventListener.ts (1)
   × isListener

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/useEventListener.ts > isListener
ReferenceError: window is not defined
 ❯ src/useEventListener.ts:52:23
     50|   const { it, expect } = import.meta.vitest
     51|   it('isListener', () => {
     52|     expect(isListener(window)).toBe(true)
       |                       ^
     53|   })
     54| }

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  15:14:44
   Duration  139ms (transform 14ms, setup 0ms, collect 11ms, tests 3ms, environment 0ms, prepare 40ms)


 FAIL  Tests failed. Watching for file changes...
       press h to show help, press q to quit
```

Which I guess is progress of a sort. 

# Adding a DOM environment

Vitest is designed to run unit tests fast, in a lightweight environment. The environment used is node.js, not a browser. There is, indeed, no global window object defined. For front-end tests, I need to bring my own DOM implementation. Vitest [integrates](https://vitest.dev/guide/environment.html) with happy-dom and jsdom but I need to install whichever I choose myself. 

Oh, the tyranny of choice. The [consensus](https://blog.seancoughlin.me/jsdom-vs-happy-dom-navigating-the-nuances-of-javascript-testing) seems to be that happy-dom is faster but missing a lot of features, while jsdom has a pretty complete implementation of the DOM but is more heavyweight and slower. 

I decided to start with jsdom for the more complete coverage of features and try happy-dom if speed becomes an issue. 

Vitest also has experimental support for running tests in a [native browser environment](https://vitest.dev/guide/browser.html). Something else I can try if I have issues with the DOM simulation provided by jsdom. 

```
% npm install -D jsdom

added 38 packages, and audited 262 packages in 1s

found 0 vulnerabilities
```

I also need to update the config to tell Vitest to use the jsdom environment.

```
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    includeSource: ['src/**/*.{js,ts}'], 
    environment: 'jsdom'
  },
  define: { 
    'import.meta.vitest': 'undefined', 
  },
})
```

Cross my fingers and run the tests again.

```
% npm run test

> react-virtual-scroll-grid@0.0.0 test
> vitest


 DEV  v1.3.1 /Users/tim/GitHub/react-virtual-scroll-grid

 ✓ src/useEventListener.ts (1)
   ✓ isListener

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  10:45:47
   Duration  387ms (transform 16ms, setup 0ms, collect 12ms, tests 1ms, environment 245ms, prepare 41ms)


 PASS  Waiting for file changes...
       press h to show help, press q to quit
```

Victory! Now I can complete my `isListener` test suite.

```
    expect(isListener(window)).toBe(true)
    expect(isListener(document)).toBe(true)
    expect(isListener(document.createElement("div"))).toBe(true)
    expect(isListener(createRef())).toBe(false)
```

# Testing Custom Hooks with React Testing Library

At the next level up we have custom hooks. After extensive googling it seems that [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) is the standard React test framework and pretty much the only game in town for testing hooks. 

Hooks are tricky to test because they're designed to be run within the context of a component render. You need a tool that emulates that environment to test them in a standalone fashion. Vitest includes an [example](https://github.com/vitest-dev/vitest/tree/main/examples/react-testing-lib) that shows how to integrate with React Testing Library and has sample tests for both components and hooks. 

```
% npm install -D @testing-library/react

added 76 packages, and audited 338 packages in 4s
```

Ouch, that's a lot of extra packages. More than Vitest itself. 

Finally, I'm ready to add an actual unit test source file. But where to put it? What's the best project layout? If I put until tests elsewhere in my folder structure, should I use [relative or absolute imports](https://medium.com/thefork/escaping-relative-import-paths-hell-in-javascript-9f258baeb15e)?

For now, I'm going to punt on all that and put the tests next to the source files being tested. I decided to start with my simplest custom hook, adding `useVirtualScroll.test.ts`.

```
import { act, renderHook } from '@testing-library/react'
import { useVirtualScroll } from './useVirtualScroll'

describe('useVirtualScroll', () => {
  it('should have initial value', () => {
    const { result } = renderHook(() => useVirtualScroll())
    const [{ scrollOffset, scrollDirection }] = result.current;
    expect(scrollOffset).toBe(0);
    expect(scrollDirection).toBe("forward");
  })

  it('should update offset and direction OnScroll', () => {
    const { result } = renderHook(() => useVirtualScroll());
    const [{}, onScrollExtent] = result.current;
    
    act(() => {
      onScrollExtent(100, 1000, 50);
    })

    const [{ scrollOffset, scrollDirection }] = result.current;
    expect(scrollOffset).toBe(50);
    expect(scrollDirection).toBe("forward");
  })
})
```

You use React Testing Library's `renderHook` method to run your hook and return a result that you can assert against. `act` is a utility provided by React to support unit testing. It [ensures](https://legacy.reactjs.org/docs/testing-recipes.html#act) that all work (e.g. renders, effects) triggered by a change are complete before continuing. 

Of course the test didn't work first time. I needed a couple of config tweaks to `tsconfig.js` (add "vitest/globals" to types) and `vite.config.ts` (add "globals: true" flag) to get it to recognize the jest style "global API" use of `describe`. 

Working out what was needed wasn't easy. In the end I needed a careful line by line comparison of my current project config and that in the example to see what I was missing.

# Component Level Tests

Now we can move up to component level tests. There's two ways we can go. We can continue to use React Testing Library to render and interact with the component and check that the resulting state of the DOM is as we would expect. Or, we can use the [React Test Renderer](https://legacy.reactjs.org/docs/test-renderer.html) to render and interact with the component. 

The test renderer is an alternative implementation of the React DOM provided by the React team. It renders the component as JSON. You can write assertions directly against the rendered JSON or compare the JSON against a snapshot of the expected state.

I decided to stick with React Testing Library for now. It provides a higher level API, particularly when you add its companion [user-event](https://testing-library.com/docs/user-event/intro/) and [jest-dom](https://testing-library.com/docs/ecosystem-jest-dom) packages. The first makes it easy to generate realistic sequences of events, as if a user was interacting with the component.  The second provides higher level matchers for writing assertions about the state of the DOM.

I've used Snapshot based approaches in the past. It's easy to generate tests with high coverage. The downside is that such tests can be fragile as every form of change is a breaking change. I might experiment with snapshots in the future, but for now I'll focus on writing meaningful tests. 

So, two more packages to install. Wonder how many other dependencies these will drag in?

```
% npm install -D @testing-library/jest-dom

added 10 packages, and audited 348 packages in 4s

% npm install -D @testing-library/user-event

added 1 package, and audited 349 packages in 748ms
```

A pleasant surprise. 

This time I carefully replicated the rest of the config from the [vitest example](https://github.com/vitest-dev/vitest/blob/main/examples/react-testing-lib) which includes
* Adding a `setup.ts` file which imports jest-dom and referencing it from vite.config.ts
* Adding a `wrapper.tsx` file copied from [`tests-utils.tsx`](https://github.com/vitest-dev/vitest/blob/main/examples/react-testing-lib/src/utils/test-utils.tsx) in the example. This implements the render wrapper pattern and sets up auto-cleanup after each test as described in the [React Testing Library setup guide](https://github.com/vitest-dev/vitest/blob/main/examples/react-testing-lib/src/utils/test-utils.tsx). Each test will import the wrapper rather than importing React Testing Library directly.

I added `VirtualList.test.tsx` and this time it ran first time. It's based on my fixed size item sample app. I can use exactly the same JSX to configure the component, pass it into React Testing Library's `render` method and then write assertions based on what I expect to see. 

```
import { render, screen } from './test/wrapper'
import { VirtualList } from './VirtualList'
import { useFixedSizeItemOffsetMapping } from './useFixedSizeItemOffsetMapping';

describe('Fixed Size VirtualList', () => {
  const Cell = ({ index, style }: { index: number, style: any }) => (
    <div className={ index == 0 ? "header" : "cell" } style={style}>
      { (index == 0) ? "Header" : "Item " + index }
    </div>
  );
    
  const mapping = useFixedSizeItemOffsetMapping(30);
  
  it('should default to rendering the top of the list', () => {
    render(
      <VirtualList
        height={240}
        itemCount={100}
        itemOffsetMapping={mapping}
        width={600}>
        {Cell}
      </VirtualList>
    )
    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.queryByText('Item 9')).toBeNull()
  })
})
```

# Complete Run

Here's what a verbose run of my "full" test suite looks like. I'm up and running. 

```
 RUN  v1.3.1 /Users/tim/GitHub/react-virtual-scroll-grid

 ✓ src/useEventListener.ts (1)
   ✓ isListener
 ✓ src/useVirtualScroll.test.ts (2)
   ✓ useVirtualScroll (2)
     ✓ should have initial value
     ✓ should update offset and direction OnScroll
 ✓ src/VirtualList.test.tsx (1)
   ✓ Fixed Size VirtualList (1)
     ✓ should default to rendering the top of the list

 Test Files  3 passed (3)
      Tests  4 passed (4)
   Start at  16:13:59
   Duration  837ms (transform 205ms, setup 403ms, collect 322ms, tests 32ms, environment 832ms, prepare 150ms)
```

# Next Up

I've got a long way to go before I have a reasonably complete set of tests. There's also plenty [more toys](https://vitest.dev/guide/features.html) to play with: coverage tools, a nice UI, concurrent exection of tests, type testing, integration with Visual Studio Code, ...