---
title: Component Testing with Playwright and Vitest
tags: frontend
---

wise words

# Vitest Browser Mode

* Extends Vitest so that it can run tests using a real browser rather than a DOM emulation library like `jsdom`
* Can use Playwright as the backend for running tests
* Still unit tests but running in a more full featured environment
* You write component tests in the usual way by rendering a component and then interacting with it. Behind the scenes, Vitest uses it's dev server to make the component available as a web app that Playwright can interact with.
* Can mix browser tests and normal jsdom tests in the same workspace
* Some minor annoyances. You have to pick the test environment on a per package basis.
* If you want both unit and browser tests for the same package, you'll have to add an additional inline project config to the workspace.

# The Plan

* Get everything installed so that I can try both standalone Playwright and Vitest browser mode
* Want to support component level testing using Vitest browser mode
* Check whether code coverage works for browser mode and whether you can get a combined view for all tests in the workspace
* Want to support end to end testing for apps using Playwright standalone
* Use `VirtualSpreadsheet` and `spreadsheet-sample` as test cases

## Installation

* As I already have vitest and Playwright installed there's only one more package to install

```
npm install -D @vitest/browser

added 36 packages, and audited 1082 packages in 5s
```

* That's a lot chunkier than I expected
* I couldn't find an npm command that gave me the complete tree of dependencies for `@vitest/browser`. Documentation suggests `npm ls --all` should do it but it didn't give me any dependencies at all. `npm view` gives me the top level dependencies only. After some searching I found [npmgraph](https://npmgraph.js.org/) that generates a pretty graph of dependencies for any npm module, without even having to install it.


{% include candid-image.html src="/assets/images/frontend/vitest_browser_dependencies.svg" alt="Vitest Browser Dependencies" %}

* There's clearly a lot going on under the hood given that Playwright will be doing the heavy lifting
* Spoke too soon. There's another utility package required to render React components

```
npm install -D vitest-browser-react

added 1 package, and audited 1083 packages in 3s
```

## Configuration

* Browser mode is enabled per project by adding some options to the `test` object in the project config
* You can have normal Node based unit tests or browser mode, not both
* The workaround is to define an additional project for your browser mode tests and keep your node based unit tests in the main project
* Makes sense for browser mode to be the special case given testing pyramid
* Most convenient way of adding extra projects is via inline definition at the workspace level

## Writing Tests

* Started with my existing Playwright test and attempted to convert into a Vitest browser mode test for `VirtualSpreadsheet`
* Rather than having `page` object passed in to test can use Vitest utility to render component and create equivalent of Playwright `page`
* Only implements a subset of the Playwright API
* Instead of `press` have to use a separate utility `userEvent.type(name, '{Enter}')`
* Trying to define a higher level API that abstracts the underlying provider
* Follows the `testing-library` `userEvent` API
* Some things, like `fill`, directly accessible on "page" object, others not
* There's no CSS locator API!
* Hacked together something less specific to try and get runnable test
* Need to manually code retries waiting for browser to complete operations
* Manual mentions an `expect.element` API that avoids need to write explicit `poll` but it doesn't appear to exist
* Manual says that "`expect.element` is a shorthand for `expect.poll(() => element)`"
* Made no sense to me, there's no `element` defined either
* In desperation, I came up with the nonsense below, which a few minutes of reflection would have told me can't possibly work.

```tsx
test('Scroll to 5000', async ({}) => {
  const page = render(
    <VirtualSpreadsheet
      data={data}
      theme={VirtualSpreadsheetDefaultTheme}
      height={240}
      width={600}>
    </VirtualSpreadsheet>)

  const name = page.getByTitle('Name');
  await name.click();
  await name.fill('5000');
  await userEvent.type(name, '{Enter}');

  const row = page.getByText("4999")
  await expect.poll(() => row).toHaveTextContent("4999");
});
```

* Querying for row before the one I jumped to as "5000" appears in both `name` input box and row header
* VS Code shows no errors so let's go.
* By default pops up Chromium browser while the test is running and then displays report
* Test fails with `Error: Matcher did not succeed in 1000ms`

{% include candid-image.html src="/assets/images/frontend/vitest-browser-mode-error.png" alt="Vitest Browser Mode Error" %}

* Report includes a screenshot of the UI which shows the test succeeded. Obviously I've written the assertion incorrectly.
* Tried to debug using VS Code extension but get an error `Failed to fetch dynamically imported module`

{% include candid-image.html src="/assets/images/frontend/vitest-browser-vs-code-error.png" alt="VS Code Error running Vitest Browser Mode test" %}

* There's a [known issue](https://github.com/vitest-dev/vitest/issues/5477) about this error in a variety of different contexts
* There's a more detailed error message in the console

```
Caused by: Error: expect(received).toHaveTextContent()

received value must be a Node.
```

* Time for those few minutes of reflection and some digging around in the Vitest source code
* Vitest browser mode combines a [subset](https://vitest.dev/guide/browser/locators.html) of the Playwright `locator` API with Testing Library's `jest-dom` [assertions](https://vitest.dev/guide/browser/assertion-api.html) and a [subset](https://vitest.dev/guide/browser/interactivity-api.html) of Testing Library's `userEvent` API.
* You need to be aware of the joins. In particular you need to call the `element()` method on a locator to get an `HTMLElement` that you can pass to the assertion.
* The Vitest manual should have said that `expect.element(locator)` is equivalent to `expect.poll(() => locator.element())`
* Once I changed the final line of my test to `await expect.poll(() => row.element()).toHaveTextContent('4999')`, it worked
* What about the missing `expect.element`? Buried in an [unrelated section](https://vitest.dev/guide/browser/commands.html#custom-playwright-commands) of the documentation is a tip to add `"@vitest/browser/providers/playwright` to the `compilerOptions.types` section of your `tsconfig.json`. This is presented as a nice to have to get autocompletion. 
* It's actually vital that you do this if you're using TypeScript. Once done, VS Code sees the `expect.element` extension and I can use the more friendly looking `expect.element(row).toHaveTextContent('4999')`

## Coverage

* Another reason for investigating Vitest browser mode was the promise of unified coverage metrics across unit tests and browser integration tests. 
* Amazingly to me, it worked first time.
* Detailed coverage report looks exactly as I expected

```
 RUN  v2.1.8 /Users/tim/GitHub/infinisheet
      Coverage enabled with istanbul

 ✓ |@candidstartup/react-spreadsheet| src/RowColRef.test.ts (5)
 ✓ |@candidstartup/react-spreadsheet| src/VirtualSpreadsheet.test.tsx (5)
 ✓ |chromium| packages/react-spreadsheet/src/VirtualSpreadsheet.browser-test.tsx (1)
 ✓ |@candidstartup/react-virtual-scroll| src/AutoSizer.test.tsx (1)
 ✓ |@candidstartup/react-virtual-scroll| src/DisplayGrid.test.tsx (1)
 ✓ |@candidstartup/react-virtual-scroll| src/DisplayList.test.tsx (8)
 ✓ |@candidstartup/react-virtual-scroll| src/VirtualCommon.test.ts (4)
 ✓ |@candidstartup/react-virtual-scroll| src/VirtualGrid.test.tsx (6) 340ms
 ✓ |@candidstartup/react-virtual-scroll| src/VirtualList.test.tsx (12) 307ms
 ✓ |@candidstartup/react-virtual-scroll| src/VirtualScroll.test.tsx (3)
 ✓ |@candidstartup/react-virtual-scroll| src/VirtualScrollProxy.test.ts (1)
 ✓ |@candidstartup/react-virtual-scroll| src/useEventListener.test.ts (2)
 ✓ |@candidstartup/react-virtual-scroll| src/useIsScrolling.test.ts (4)
 ✓ |@candidstartup/react-virtual-scroll| src/useVirtualScroll.test.ts (4)
 ✓ |@candidstartup/react-virtual-scroll| src/useEventListener.ts (1)

 Test Files  15 passed (15)
      Tests  58 passed (58)
```

## Conclusion

* Coverage works but there's too much about Vitest browser mode that doesn't
* Being unable to debug tests is a deal-breaker for me
* Lack of CSS locators makes it significantly more difficult to write tests than using Playwright directly
* It might be possible to write a [custom command plugin](https://vitest.dev/guide/browser/commands.html#custom-commands) that [gives access](https://vitest.dev/guide/browser/commands.html#custom-playwright-commands) to Playwright's native CSS locator API. Beyond the scope of what I'm prepared to do.
* Having to be aware of the joins adds friction. Playwright has it's own assertions designed for use with it's locators. Retry and conversion to element are handled behind the scenes.
* Developer experience with Playwright is so much better that I would find myself writing tests in Playwright then transferring them to Vitest
* Do I need Vitest browser mode at all?
* Unified coverage is nice but it's really cheating. Testing pyramid tells us that we should do as much as we can at the unit test level. I absolutely can, and should, test all the component logic using unit tests. If I get it right, I get 100% coverage.
* Component-browser integration testing is there to check that the actual interactions between component and browser are the same as we expected with our unit test mocks.

# Playwright Component testing

* Can I do component-browser integration testing using Playwright? In a way I already am. Playwright end-to-end testing of my spreadsheet sample app is really just testing `VirtualSpreadsheet` component integration with the browser. The sample is a simple wrapper around the component with just enough of a test fixture to get it running.
* Playwright also has an [experimental component testing feature](https://playwright.dev/docs/test-components).
* Your test starts with mounting a component (using the `mount` API) which you then interact with. This is equivalent to the `render` API in Vitest.
* You need to add quite a lot of supporting scaffolding to your project
  * A `playwright/index.html` file uses to render component during testing
  * A `playwright/index.ts` file which sets up the environment for testing, for example including stylesheets and injecting code into the page
  * [Component wrappers](https://playwright.dev/docs/test-components#test-stories) which initialize your component with any complex props needed. The component runs in the browser so your test code can only pass plain JavaScript objects and primitive types to it. Instead of mounting the component directly, you mount a wrapper which takes care of any complex configuration.
* Behind the scenes Playwright uses Vite to compile a bundle containing the component and scaffolding, then serves it using the Vite development server
* Seems like a really convoluted way of recreating the sample app I already have and would still need
