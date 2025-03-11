---
title: Upgrading to Vitest 3 and Vite 6
tags: frontend
---

Big outstanding updates are React 19, Vite 6 and Vitest 3. Not brave enough to tackle React 19 yet, but feels like time to have a go at Vitest and Vite.

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
