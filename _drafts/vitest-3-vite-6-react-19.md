---
title: Upgrading to Vitest 3 and Vite 6
tags: frontend
---

Big outstanding updates are React 19, Vite 6 and Vitest 3. 

* Need latest Vitest and Vite for React 19 support, so they go first


# Vitest 3

* First version of Vitest that supports Vite 6
* Supports Vite 5 and 6, so makes sense to update Vitest first.
* No dependencies on Vitest apart from Vitest addon packages
* Update them all together

```
% npm install -D vitest@3 @vitest/ui@3 @vitest/coverage-istanbul@3 @vitest/coverage-v8@3

added 13 packages, changed 13 packages, and audited 1146 packages in 6s
```

* None of the breaking changes listed in the [migration guide](https://vitest.dev/guide/migration.html#vitest-3) look like they apply to me
* Tried running my test suite
* Had a couple of tests fail that depend on Vitest support for fake timers

## Fake Timers

* Assertion failing after call to `vi.advanceTimersByTime`
* Migration guide did mention change to fake timers. All timing APIs are now faked by default rather than the previous partial list.
* That's what I want so thought I'd be fine
* I previously had to extend the list to include `performance`

```ts
export default defineConfig({
  test: {
    fakeTimers: {
      toFake: [...(configDefaults.fakeTimers.toFake ?? []), 'performance'],
    },
  }
})
```

* No default list anymore, so in Vitest 3 this config only fakes `performance`
* Removed the `fakeTimers` config entirely and the tests all passed

## Coverage

* Coverage reporting still working both when running tests at the project and workspace level

## Browser Mode

* Some improvements, worth another look?
* Still less pleasant than using Playwright direct
* Need to try Playwright first to plug holes in test coverage
* Then think about whether it makes sense to try and port to browser mode for unified coverage reporting

# Vite 6

* Nothing obviously applying to me in the [migration guide](https://vite.dev/guide/migration.html)

```
% npm install -D vite@6

removed 2 packages, changed 1 package, and audited 1144 packages in 3s
```

* Did less than I expected, but OK.
* Full build (including unit and playwright tests) works fine
* Storybook and sample apps run fine in dev mode
* Total anticlimax

# React 19

* React 19 released 3 months ago and still on version 19.0.0
* Normally would be very nervous of committing to a major release without seeing a few bug fix releases first. But if out for 3 months maybe it's just incredibly stable?
* Want to support both React 18 and 19, don't force choices on library consumers
* Want to continue dev against React 18 for now so I don't accidentally start using something React 19 only.
* In principle safe the other way as React 18.3 has deprecation warnings for all features being dropped in React 19.
* First step is to try manually. Upgrade to React 19, run build and tests, then revert back.
* First need to update dependencies in `package.json` to say that I support both React 18 and React 19

```json
"dependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

* Updated for all apps and packages in the monorepo but left dependency in root at React 18
* Updating React at this point should do nothing as the root dependency is in control

```
% npm update react

up to date, audited 1144 packages in 2s
```

* Now see what happens when I install React 19

```
 % npm install -D react@19 react-dom@19
npm warn ERESOLVE overriding peer dependency
npm warn While resolving: root@undefined
npm warn Found: react@18.3.1
npm warn node_modules/react
npm warn   peer react@">=16" from @mdx-js/react@3.1.0
npm warn   node_modules/@mdx-js/react
npm warn     @mdx-js/react@"^3.0.0" from @storybook/addon-docs@8.6.4
npm warn     node_modules/@storybook/addon-docs
npm warn   14 more (@storybook/addon-docs, @storybook/blocks, ...)
...
```

* Long list of warnings for Storybook
* Storybook supports React 19 components (isolated in an iframe) but internally uses React 18 for the Storybook UI
* Tried a full build anyone and much to my surprise everything worked
* Storybook and sample dev environments work too
* Realized I'd forgotten to upgrade to React 19 types

```
% npm install -D @types/react@19 @types/react-dom@19
npm warn ERESOLVE overriding peer dependency
npm warn While resolving: root@undefined
npm warn Found: @types/react@18.3.18
npm warn node_modules/@types/react
npm warn   peer @types/react@">=16" from @mdx-js/react@3.1.0
npm warn   node_modules/@mdx-js/react
npm warn     @mdx-js/react@"^3.0.0" from @storybook/addon-docs@8.6.4
npm warn     node_modules/@storybook/addon-docs
npm warn   4 more (@testing-library/react, @types/react-dom, ...)
```

* Same sort of Storybook related warnings
* However, this time when I run the build I get lots of type errors from TypeScript
* Long [list of changes](https://react.dev/blog/2024/04/25/react-19-upgrade-guide#typescript-changes) in the migration guide
* Clearly no runtime impact so hopefully can change code so that it passes type checking with both React 18 and 19

## JSX

[No longer](https://react.dev/blog/2024/04/25/react-19-upgrade-guide#the-jsx-namespace-in-typescript) part of global namespace. Need to uses `React.JSX` instead of `JSX`.

## useRef

* `useRef` now always requires an argument. Previously would default to `undefined` initial value if no argument given. Had to replace `useRef()` with `useRef(undefined)` in a few places.
* Type returned by `useRef<T>(null)` has changed from `RefObject<T>` to `RefObject<T|null>`. Type of `RefObject.current` stays as `T|null`.
* Type of `useRef<T>(someValueOfT)` stays as `RefObject<T>` but type of `RefObject.current` is now `T` rather than `T|null`.
* Basically the types are more explicit and predictable now.
* Needed to add `|null` to a few types, including some exposed in API.
* I have one place that uses `RefObject<T>(someValueOfT)`. With the React 18 typings I had to handle the possibility of `null` when accessing `ref.current`, even though I never set it to `null`. With the React 19 typings, TypeScript knows it can't be null. Which is great. However, I have to leave the null checks in place for compatibility with React 18. Even worse, the TypeScript linter complains that I have pointless null checks. In the end I changed the definition to `RefObject<T|null>` so that the same code should work for both.

## React 18 Compatibility

* Reverted root `package.json` and `package-lock.json` and run `npm ci` to get back to previous React 18 install
* Full build and no type check or lint errors. Looks like we can have code compatible with both React 18 and 19.

## Maintaining React 19 compatibility

* Want to make sure we maintain React 19 compatibility while developing against React 18
* How to test that everything works on both?
* [Old article](https://medium.com/welldone-software/two-ways-to-run-tests-on-different-versions-of-the-same-library-f-e-react-17-react-16-afb7f861d1e9) showing three ways of doing it. Based on installing multiple versions of React in repo and then different ways of getting unit tests to resolve to desired version.
* Seems fiddly and error prone. Also need to test full build and Playwright tests.
* With GitHub workflows can do it the brute force way
* Added React version to my build matrix

{% raw %}

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x, 22.x]
        react-version: [18, 19]

    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - name: Use React ${{ matrix.react-version }}
      if: ${{ matrix.react-version == 19 }}
      run: npm install -D react@19 react-dom@19 @types/react@19 @types/react-dom@19
    ...
```

{% endraw %}

* GitHub workflows will run four build CI jobs, one for each combination of NodeJS and React version.
* If a job wants React 19, install it over the default React 18 that `npm ci` put on. 
