---
title: Bootstrapping Vitest
tags: frontend
---

Need unit tests

# Why Vitest?

# Installing Vitest

```
% npm install -D vitest

added 64 packages, changed 3 packages, and audited 223 packages in 17s

59 packages are looking for funding
  run `npm fund` for details

1 high severity vulnerability

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
```

Scary.

```
% npm audit
# npm audit report

vite  4.0.0 - 4.5.1
Severity: high
Vite XSS vulnerability in `server.transformIndexHtml` via URL payload - https://github.com/advisories/GHSA-92r3-m2mg-pj97
Vite dev server option `server.fs.deny` can be bypassed when hosted on case-insensitive filesystem - https://github.com/advisories/GHSA-c24v-8rfc-w8vw
```

Haven't updated anything since I first installed Vite.

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

Looks like latest minor version of Vite 4 fixes the vulnerability.

```
% npm update

added 9 packages, changed 43 packages, and audited 232 packages in 21s

60 packages are looking for funding
  run `npm fund` for details

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

59 packages are looking for funding
  run `npm fund` for details

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

Now time to see whether vitest runs. I added vitest to the scripts section in `package.json`.

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

Which seems reasonable enough. Next step is to update `vite.config.ts` and add our test configuration. One of the advantages of vitest is that it shares Vite's configuration and pipeline setup. No need to keep duplicate setups in sync. 

As well as supporting classic component level unit tests defined in their own source files, Vitest also supports "in-source" tests. You can add tests directly to your source files. You need to configure Vitest to tell it where to look and Vite to tell it to ignore the tests in release builds.

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

* Tests run in a node.js environment, not a browser. No window global object.
* Need to bring my own DOM implementation. 
* Vitest integrates with happy-dom and jsdom but need to install whichever I choose myself
* https://blog.seancoughlin.me/jsdom-vs-happy-dom-navigating-the-nuances-of-javascript-testing
* Also experimental support for real browser environment
* Will start with jsdom for more complete coverage of features, try happy-dom if speed is an issue

```
% npm install -D jsdom

added 38 packages, and audited 262 packages in 1s

61 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

Also need to update the config to tell  Vitest to use the jsdom environment

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