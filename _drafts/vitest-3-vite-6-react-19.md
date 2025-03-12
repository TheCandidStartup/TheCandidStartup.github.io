---
title: Upgrading to Vitest 3, Vite 6 and React 19
tags: frontend infinisheet
---

There are three big outstanding updates that have been hanging over me for a while. React 19, Vite 6 and Vitest 3. Vite and Vitest are at the heart of my development process. React is *the* dependency for my frontend packages. Understandably I'm nervous given [my experience]({% link _posts/2024-12-09-infinisheet-chore-updates.md %}) the last time I did a round of major updates.


# Vitest 3

According to `npm ls vitest` there are no other dependencies on Vitest apart from Vitest addon packages. Vitest 3 is the first version of Vitest that supports Vite 6. It also supports Vite 5, so it makes sense to update Vitest first.

```
% npm install -D vitest@3 @vitest/ui@3 @vitest/coverage-istanbul@3 @vitest/coverage-v8@3

added 13 packages, changed 13 packages, and audited 1146 packages in 6s
```

None of the breaking changes listed in the [migration guide](https://vitest.dev/guide/migration.html#vitest-3) look like they apply to me. I tried running my test suite and had a couple of tests fail that depend on Vitest support for fake timers.

## Fake Timers

The tests fail on the first assertion after a call to `vi.advanceTimersByTime()`. 

The migration guide did mention a change to fake timers. All timing APIs are now faked by default rather than the previous partial list. That's what I want so I thought I'd be fine.

The problem is that I previously had to extend the list to include `performance` timers.

```ts
export default defineConfig({
  test: {
    fakeTimers: {
      toFake: [...(configDefaults.fakeTimers.toFake ?? []), 'performance'],
    },
  }
})
```

There's no default list anymore, so in Vitest 3 this config fakes `performance` but not any of the other timers. I removed the `fakeTimers` config entirely and the tests all passed.

## Coverage

Coverage reporting continues to work at both the project and workspace level.

## Browser Mode

There are lots of improvements to [Vitest Browser Mode](https://vitest.dev/guide/browser/), so might be worth [another look]({% link _posts/2025-01-06-component-test-playwright-vitest.md %}). 

It still looks like a less pleasant experience than using Playwright direct. I need to try using Playwright first to plug the [holes in test coverage]({% link _posts/2025-03-03-react-spreadsheet-release-ready.md %}). Then I can think about whether it makes sense to try and port the tests to browser mode for unified coverage reporting.

# Vite 6

There's nothing in the [migration guide](https://vite.dev/guide/migration.html) that obviously applies to me. All dependencies on Vite (`vitest`, `storybook` and `vite-tsconfig-paths`) say they support Vite 6. Let's try it and see.

```
% npm install -D vite@6

removed 2 packages, changed 1 package, and audited 1144 packages in 3s
```

That did less than I expected, but OK. 

A full build (including unit and playwright tests) works fine. Storybook and sample apps run in dev mode too. Turned out to be a total anticlimax.

# React 19

React 19 was released 3 months ago and is still on version 19.0.0. Normally I wouldn't dream of upgrading to a new major release without seeing a few bug fix releases first. However, it's been out for 3 months. Maybe it's just incredibly stable?

I want to continue to support both React 18 and 19. React is a peer dependency for my `react-virtual-scroll` and `react-spreadsheet` packages. I don't want to force my choices on package consumers.

I intend to continue developing against React 18 so I don't accidentally start using something that's React 19 only. In principle, it should be safe the other way round as React 18.3 has deprecation warnings for all the React 18 features that were dropped in React 19.

 The first step is to try manually. Upgrade to React 19, run the build and tests, then revert back. Before I can do that, I need to update dependencies in my per-package `package.json` files to say that I support both React 18 and React 19

```json
"dependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

At this point, my monorepo root `package.json` still requires React 18. I confirmed that updating React does nothing. The root dependency is in control. 

```
% npm update react

up to date, audited 1144 packages in 2s
```

Now, let's see what happens when I install React 19.

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

There's a long list of "overridden peer dependency" warnings for Storybook. Storybook supports React 19 components (like all stories, isolated in an iframe) but internally uses React 18 for the Storybook UI.

I tried a full build and much to my surprise everything worked. Full build and Storybook dev environment too. 

I realized that I'd forgotten to upgrade to React 19 types.

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

There's the same sort of Storybook related warnings. However, this time when I run the build I get lots of type errors from TypeScript.

There's a long [list of TypeScript related changes](https://react.dev/blog/2024/04/25/react-19-upgrade-guide#typescript-changes) in the migration guide. There's clearly no runtime impact. Everything ran OK when I built with the old types. Hopefully I can tweak my code so that it passes type checking with both React 18 and 19.

## JSX

JSX is nNo longer](https://react.dev/blog/2024/04/25/react-19-upgrade-guide#the-jsx-namespace-in-typescript) part of the global namespace. I need to use `React.JSX` instead of `JSX`.

## useRef

The `useRef()` function now always requires an argument. Previously it would create a ref with an `undefined` initial value if no argument was given. I had to replace `useRef()` with `useRef(undefined)` in a few places.

The type returned by `useRef<T>(null)` has changed from `RefObject<T>` to `RefObject<T|null>`. The type of `RefObject.current` stays as `T|null`. In contrast, the type `useRef<T>(someValueOfT)` stays as `RefObject<T>` but the type of `RefObject.current` is now `T` rather than `T|null`.

Basically the types are more explicit and predictable now. No magic addition of `null`. I needed to add explicit `|null` to a few types, including some exposed in the API.

I have one place that uses `RefObject<T>(someValueOfT)`. With the React 18 typings I had to handle the possibility of `null` when accessing `ref.current`, even though I never set it to `null`. 

With the React 19 typings, TypeScript knows it can't be null. Which is great. However, I have to leave the null checks in place for compatibility with React 18. Even worse, the TypeScript linter complains that I have pointless null checks. 

In the end I changed the definition to `RefObject<T|null>` so that the same code should work for both.

## React 18 Backwards Compatibility

Time to see whether the changes I made are backwards compatible with React 18. I reverted the root `package.json` and `package-lock.json`, and ran `npm ci` to get back to the previous React 18 install.

I ran a full build with no type check or lint errors. Looks like we can have code compatible with both React 18 and 19.

## Maintaining React 19 compatibility

I want to make sure we maintain React 19 compatibility while developing against React 18. How do I test that everything works on both?

I found an [Old article](https://medium.com/welldone-software/two-ways-to-run-tests-on-different-versions-of-the-same-library-f-e-react-17-react-16-afb7f861d1e9) that shows three ways of running the same test suite against two different versions of React. They're all based on installing multiple versions of React in the repo and then different ways of getting unit tests to resolve to the desired package versions.

It seems fiddly and error prone. I'd also need to do the same thing for the full build and Playwright tests.

Fortunately, with [GitHub Actions]({% link _posts/2024-06-03-bootstrapping-github-actions.md %}) I can brute force a solution. I added the React version to my existing "Build CI" workflow strategy matrix.

{% raw %}

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x, 22.x]
        react-version: [18, 19]
    name: Node ${{ matrix.node-version }} - React ${{ matrix.react-version }}

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

GitHub actions will run four build CI jobs for me, one for each combination of NodeJS and React version. If a job wants React 19, I install it over the default React 18 that `npm ci` puts on. 

# Conclusion

That all went better than I dared to hope. I'm *almost* completely up to date now. Unfortunately, TypeScript 5.8 was released and Storybook doesn't support it yet. 

Oh, well. There's always next time. 

React 19 compatible packages for [react-virtual-scroll](https://www.npmjs.com/package/@candidstartup/react-virtual-scroll) and [react-spreadsheet](https://www.npmjs.com/package/@candidstartup/react-spreadsheet) are now available on npm.

