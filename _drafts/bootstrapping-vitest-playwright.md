---
title: Bootstrapping Vitest Browser Mode with Playwright
tags: frontend
---

wise words

# Browser Mode

# Playwright

# Minor updates

* Get everything updated before trying to install new tools
* Like to start with `npm update` to get all the compatible minor versions done
* First time I've had a problem - reports `ERESOLVE could not resolve` errors
* Where package is a direct dependency, npm seems to find the most recent version allowed and then complain if that's more recent that other dependencies support
* I would have expected it to find the most recent version allowed by all
* To get through the minor updates I constrained versions of two direct dependencies to highest commonly supported

```json
  "devDependencies": {
    "@eslint/compat": ">=1.1.0 <1.2",
    "typescript": ">=5.0.2 <5.7",
  }
```

* Now `npm update` runs

```
npm update  
npm WARN deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm WARN deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.

added 37 packages, removed 16 packages, changed 126 packages, and audited 1060 packages in 29s

found 0 vulnerabilities
```

* I've clearly fallen behind on my major updates. Let's see what else is pending.

```
% npm outdated
Package                    Current   Wanted   Latest
@eslint/compat               1.1.1    1.1.1    1.2.3
@rollup/plugin-typescript   11.1.6   11.1.6   12.1.1
@types/node                20.17.8  20.17.8  22.10.0 
@vitest/coverage-istanbul    1.6.0    1.6.0    2.1.6 
@vitest/coverage-v8          1.6.0    1.6.0    2.1.6 
@vitest/ui                   1.6.0    1.6.0    2.1.6
eslint                      8.57.1   8.57.1   9.15.0
eslint-plugin-react-hooks    4.6.2    4.6.2    5.0.0
jsdom                       24.1.3   24.1.3   25.0.1
rimraf                      5.0.10   5.0.10    6.0.1 
typedoc                    0.26.11  0.26.11   0.27.0
typescript                   5.6.3    5.6.3    5.7.2 
typescript-eslint           7.18.0   7.18.0   8.16.0
vite                        5.4.11   5.4.11    6.0.1
vite-tsconfig-paths          4.3.2    4.3.2    5.1.3 
vitest                       1.6.0    1.6.0    2.1.6 
```

# ESLint 9

* Start with ESLint. Let's get rid of those shouty deprecation warnings
* ESLint 9 makes flat config files the default. Luckily we sorted that out when first bootstrapping use of ESLint.
* `typescript-eslint` adds support for ESLint 9 in 8.0.0 so we'll need to update that at the same time
* I locked down @eslint/compat because it requires ESLint 9, can remove that restriction.
* `eslint-plugin-react-hooks` adds support for ESLint 9 in 5.0.0 so we need to update that one too

```json
  "devDependencies": {
    "@eslint/compat": "^1.1.0",
    "eslint": "^9.0.0",
    "eslint-plugin-react": "^7.34.3",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "typescript-eslint": "^8.0.0",
  }
```

```
% npm update

added 11 packages, removed 11 packages, changed 29 packages, and audited 1060 packages in 25s
```

* ESLint 9 and corresponding plugins have lots of changes to the default rule sets
* I didn't run into any issues, linting ran clean.

## Typed Linting

* `typescript-eslint` 8 supports [typed linting](https://typescript-eslint.io/getting-started/typed-linting) which adds rules powered by TypeScript's type checking APIs
* Needs some additional lines in `eslint.config.mjs`, copied verbatim from the documentation

```
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
```

* Got an error because of trying to lint config files with .ts extensions which aren't in scope for TypeScript.

```
react-virtual-scroll/vite.config.ts
  0:0  error  Parsing error: react-virtual-scroll/vite.config.ts was not found by the project service. Consider either including it in the tsconfig.json or including it in allowDefaultProject
```

* Can't see any point in linting config files so added them to the list to ignore.
* After that, seems to work. ESLint runs and finds additional errors.
* Lots of [`@typescript-eslint/unbound-method`](https://typescript-eslint.io/rules/unbound-method/) in clients of `useVirtualScroll`

```
Avoid referencing unbound methods which may cause unintentional scoping of `this`.
If your function does not access `this`, you can annotate it with `this: void`, or consider using an arrow function instead
```

* `useVirtualScroll` is a custom hook which returns an object containing a collection of values and utility functions.

```ts
export interface VirtualScrollState {
  ...
  onScroll(clientExtent: number, scrollExtent: number, scrollOffset: number): [number, ScrollState];
  doScrollTo(offset: number, clientExtent: number): number;
  getCurrentOffset(): number;
}
```

* This looks like a class with methods to TypeScript rather than the collection of standalone functions it's intended to be
* The clients destructure the object and call the functions. That's a bad idea with the a real object, because the this point gets lost.
* Solution was to add type annotations so that it's clear there's no use of this

```ts
export interface VirtualScrollState {
  ...
  onScroll(this: void, clientExtent: number, scrollExtent: number, scrollOffset: number): [number, ScrollState];
  doScrollTo(this: void, offset: number, clientExtent: number): number;
  getCurrentOffset(this: void): number;
}
```

*  The only other problem found was a [`@typescript-eslint/no-duplicate-type-constituents`](https://typescript-eslint.io/rules/no-duplicate-type-constituents) where I'd declared a type in an overly verbose way as a misguided attempt to convey more meaning to human readers. I removed the duplication. 

# Vitest 2

* Looks like breaking changes only effect advanced configuration options that I'm not using

```json
  "devDependencies": {
    "@vitest/coverage-istanbul": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "vitest": "^2.0.0"
  }
```

```
% npm update

added 10 packages, removed 30 packages, changed 21 packages, and audited 1040 packages in 23s
```

* Unit tests all run successfully
* Coverage report at package level is pulling in unit test files for some reason, throwing off coverage stats
* Running at the workspace level fails completely with 100s of errors about `api-extractor-base.json`. 
* There was a [change in Vite 2.1](https://vitest.dev/guide/workspace.html#defining-a-workspace) which means that a `vitest.workspace.ts` config with the standard pattern of `packages/*` now treats any files in the packages dir as Vitest config files. 
* I put common config files for other tools in there.
* Easy, I thought. Just change the pattern to exclude the config files
* No way to distinguish folders from files with a glob pattern
* All my config files have extensions. Want anything without an extension
* Can use `*.*` for anything with an extension but no obvious way to say anything without
* Can't find any detailed reference documentation for globs anywhere
* Ended up looking at [unit tests](https://github.com/SuperchupuDev/tinyglobby/blob/main/test/index.test.ts) for the `tinyglobby` library that vitest uses
* Suggests that `!packages/*.*` should work
* It appears to work, ignoring the config files and finding my two packages. Then all the unit tests blow up, failing to import anything.
* If I explicitly list the packages using `packages/react-spreadsheet` and `packages/react-virtual-scroll` the same tests run successfully.
* Weirdly listing both `packages/*` and `!packages/*.*` does work
* The vitest docs say that you can reference packages by their config files instead of their folders and that's what I went with in the end. Seems less prone to errors.

```ts
export default defineWorkspace([
  'packages/*/vite.config.ts'
])
```

* Now that it runs, I can see that workspace level coverage also includes the test files in the report
* Looking at my coverage config I can see why

```ts
  coverage: {
    provider: 'istanbul',
    include: ['packages/*/src/**'],
    exclude: ['packages/*/src/test/**']
  }
```

* I explicitly exclude some common source containing test utilities but not the unit tests themselves
* Somehow Vitest 1.x was implicitly excluding them but Vitest 2 isn't
* Once I included them explicitly I got the coverage reports I was expecting again

```ts
  coverage: {
    provider: 'istanbul',
    include: ['packages/*/src/**'],
    exclude: ['packages/*/src/test/**','packages/*/src/*.test.*']
  }
```

# jsdom 25

* May as well do this one next, while I'm looking at unit tests
* Marked as major release but breaking changes only when using non-default options that I don't use

```json
  "devDependencies": {
    "jsdom": "^25.0.0"
  }
```

```
% npm update

added 2 packages, removed 5 packages, changed 8 packages, and audited 1037 packages in 27s
```

* Half my unit tests now failing with a JavaScript runtime error deep inside jsdom: `TypeError: list.map is not a function`
* Rolled back to version 24. Still failing.
* A few unrelated minor updates got applied when I updated jsdom. Reverted `package-lock.json` to previous version and used `npm ci` to get installed state to match
* Now tests are working again
* Tried again but instead of updating `package.json` directly and running `npm update`, I did it properly, restricting scope of changes to just jsdom

```
% npm install -D jsdom@"^25.0.0"

added 2 packages, removed 5 packages, changed 2 packages, and audited 1037 packages in 1s
```

* This time tests run OK
* Let's try the minor updates again

```
% npm update

changed 6 packages, and audited 1037 packages in 19s
```

* Unit tests broken again
* Trawling through `package-lock.json` I see the following changes.
  * `electron-to-chromium`  1.5.66 -> 1.5.67
  * `nwsapi` 2.2.13 -> 2.2.14
  * `ts-api-utils` 1.4.2 -> 1.4.3
  * `nx` 20.1.3 -> 20.1.4

* I updated one at a time, trying unit tests after each. They broke after updating `nwsapi`
* [`nwsapi`](https://github.com/dperini/nwsapi) is an engine that implements the CSS selectors API

```
% npm ls nwsapi
root@ /Users/tim/GitHub/infinisheet
└─┬ jsdom@25.0.1
  └── nwsapi@2.2.14
```

* `nwsapi` is a dependency of `jsdom`
* jsdom requires nwsapi ^2.2.12
* Looks like a bad nwsapi update which I can safely roll back
* I added `nwsapi` to my package.json and excluded the bad version

```json
  "devDependencies": {
    "nwsapi": "^2.2.12 <2.2.14 || ^2.2.15"
  }
```

* Tried `npm update` one more time
* This time everything works
* A day later 2.2.15 was released to fix the problem. The developer had added a new experimental feature behind an feature flag which they'd left turned on. I removed nwsapi from my package.json and updated. Everything still works.

# vite-tsconfig-paths 5

* Dropping support for CommonJS modules which I don't use

```
% npm install -D vite-tsconfig-paths@"^5.0.0" 

changed 1 package, and audited 1037 packages in 2s
```

* Everything builds and runs OK

# Rollup plugin-typescript 12

* Fixing an issue where some combinations of output options would put files in the wrong place
* Breaking change for anyone relying on incorrect behavior

```
% npm install -D @rollup/plugin-typescript@"^12.0.0"

changed 1 package, and audited 1037 packages in 1s
```

* Build now fails with error `Path of Typescript compiler option 'declarationDir' must be located inside the same directory as the Rollup 'file' option.`
* Here's my Rollup config which involved [quite a journey]({% link _posts/2024-05-13-bootstrapping-npm-package-build.md %}) to put together in the first place

```js
export default [
  {
    input: "src/index.ts",
    external: isExternal,
    output: [
      {
        sourcemap: true,
        file: "dist/index.js",
        format: "es"
      },
    ],
    plugins: [
      typescript({ "declarationDir": "./types", tsconfig: "./tsconfig.build.json" })
    ],
  },
  {
    input: "dist/types/index.d.ts",
    output: [{
      file: "dist/index.d.ts",
      format: "es",
      plugins: []
    }],
    plugins: [      
      dts(),
      del({ targets: "dist/types", hook: "buildEnd" })
    ],
  }
];
```

* This is a two stage pipeline. The first stage uses the `typescript` plugin to transpile and bundle the source code into `dist/index.js` with declaration files output to `dist/types`. The second stage uses the `dts` plugin to read the declaration files in `dist/types` and bundle them into `dist/index.d.ts`.
* In the end had to find the code that [outputs the error message](https://github.com/rollup/plugins/blob/92daef00b0da30de172868d4e0792c8686da0045/packages/typescript/src/options/validate.ts#L72) to understand the problem
* The actual breaking change is not correcting where the output files go, it's [adding validation](https://github.com/rollup/plugins/pull/1728) to stop you putting output files where you want
* Ironically, I'm putting the files in the approved place, under the output directory. It's the validation that's wrong.
* Even more ironically, the original validation in 12.0.0 would have worked. It was changed in 12.1.11 to [fix a different problem](https://github.com/rollup/plugins/pull/1783).
* If you specify a Rollup output file, the validation checks that the output file is inside every typescript directory option. This makes sense if you're using the `outDir` typescript option to specify the overall output dir then writing individual output files into it. It makes no sense if you're using the `declarationDir` option.
* If you specify the overall Rollup output dir (and let Rollup choose the output file name), the validation checks that every typescript directory option is inside the overall output dir. 
* With some fiddling around I was able to rewrite the first stage config so that it does exactly the same thing as before while satisfying the validation checks.

```js
  {
    input: "src/index.ts",
    external: isExternal,
    output: [
      {
        sourcemap: true,
        dir: "dist",
        format: "es"
      },
    ],
    plugins: [
      typescript({ "declarationDir": "dist/types", tsconfig: "./tsconfig.build.json" })
    ],
  },
```

# NodeJS 22

* NodeJS 22.11.0 release on October 29th 2024 marked the entry of the 22.x release line into "Active LTS"
* Time to upgrade and switch my GitHub builds from 20 and 18 to 22 and 20. 

# rimraf 6

* Drops support for Node 18
* Should be safe to upgrade now

# TypeDoc 0.27

* Released November 27th 2024, with 0.27.1 following a day later
* Too close to the bleeding edge for me
* Leave it for next time
* Annoying, because this update is the thing that's blocking TypeScript 5.7
* TypeScript 5.7 was released November 22nd 2024, happy to let it bake a little longer

# Vite 6

* Released November 26th 2024, with 6.0.1 following a day later
* Too close to the bleeding edge for me
* Leave it for next time