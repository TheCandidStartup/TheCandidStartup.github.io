---
title: Component Testing with Playwright and Vitest
tags: frontend
---

[Last time]({% link _posts/2024-12-16-bootstrapping-playwright.md %}) we added Playwright to our toolbox for end to end testing. We already had [Vitest]({% link _posts/2024-03-11-bootstrapping-vitest.md %}) for unit tests. Now we need to decide on a solution for integration and component testing. 

{% include candid-image.html src="/assets/images/frontend/testing-pyramid.svg" alt="Testing Pyramid" %}

For frontend work, integration testing means checking that our React components work correctly with all the major browsers. So far, all our component testing has been done using Vitest with `jsdom`. If we want to test layout and complex interactions of events, we need to use a real browser DOM.

# Vitest Browser Mode

[Browser Mode](https://vitest.dev/guide/browser/) is an experimental feature that allows you to run Vitest tests natively in the browser. Despite being labelled experimental, it's been part of Vitest since v0.x. You have a choice of backends for interacting with the browser, including Playwright. 

It sounds ideal for component testing. You're still coding in a unit test style but running the tests in a full featured DOM environment. You write component tests in the usual way by rendering a component and then interacting with it. Behind the scenes, Vitest uses its dev server to make the component available as a web app that Playwright can interact with.

## Installation

As I already have Vitest and Playwright installed there's only two more packages to install

```
npm install -D @vitest/browser vitest-browser-react

added 37 packages, and audited 1083 packages in 5s
```

That's a lot chunkier than I expected. I wonder what it's using? 

I couldn't find an npm command that gave me the complete tree of dependencies for `@vitest/browser`. Documentation suggests `npm ls --all` should do it but it didn't give me any dependencies at all. `npm view` gives me the top level dependencies only. After some searching I found [npmgraph](https://npmgraph.js.org/) that generates a pretty graph of dependencies for any npm module, without even having to install it.

{% include candid-image.html src="/assets/images/frontend/vitest_browser_dependencies.svg" alt="Vitest Browser Dependencies" %}

There's clearly a lot going on under the hood given that Playwright will be doing the heavy lifting.

## Configuration

Browser mode is enabled per project by adding some options to the `test` object in the project config. You can have normal Node based unit tests or browser mode, not both. 

The workaround is to define an additional project for your browser mode tests and keep your node based unit tests in the main project. It makes sense for browser mode to be the special case given the way the testing pyramid works. The most convenient way of adding extra projects is via inline definition at the workspace level.

```ts
export default defineWorkspace([
  'packages/*/vite.config.ts',
  {
    test: {
      include: [
        '**/*.browser-test.{ts,tsx}'
      ],
      name: 'chromium',
      browser: {
        enabled: true,
        provider: 'playwright',
        name: 'chromium',
      },
    },
  },
])
```

I added a single project that would run browser tests for all packages using Chromium. If I want to use this for integration testing too, I can add projects for Webkit and Firefox.

## Writing Tests

I initially thought that I would be able to take one of my existing unit tests and run it using browser mode. I'm just changing the DOM implementation, right? Unfortunately, you're also changing the entire process model. In unit test mode you're running Vitest, your test code, the component being tested and jsdom all in the same Node.js process. You have complete control over the environment. You can mock and monkey patch as you like.

With browser mode, Vitest and your test code run in a Node.js process but the component being tested and the DOM are in a browser process with interaction marshalled via the Playwright process. You have to render and interact with your component via a dedicated set of APIs that are closer to Playwright than a unit test.

I started with my [existing Playwright test]({% link _posts/2024-12-16-bootstrapping-playwright.md %}) and attempted to convert it into a Vitest browser mode test for `VirtualSpreadsheet`. Rather than having a `page` object passed in to the test, you use a Vitest utility to render the component and create the equivalent of the Playwright `page`. Unfortunately, it only implements a subset of the Playwright API.

There's a familiar looking [locators API](https://vitest.dev/guide/browser/locators.html) but it doesn't include CSS locators. Also, many of the actions are missing. Some things like `fill` are directly accessible, others are not. Instead of writing `name.press('Enter')` you have to use a separate utility and write  `userEvent.type(name, '{Enter}')`.

Some of the friction comes because Vitest is trying to provide a higher level API that abstracts the underlying provider. It combines a [subset](https://vitest.dev/guide/browser/locators.html) of the Playwright `locator` API with Testing Library's `jest-dom` [assertions](https://vitest.dev/guide/browser/assertion-api.html) and a [subset](https://vitest.dev/guide/browser/interactivity-api.html) of Testing Library's `userEvent` API. The joins show. You have to call `element()` on the locator to get hold of an `HTMLElement` that Testing Library can work with. 

I hacked something together to work around the lack of CSS locators and try to get a runnable test. Unlike Playwright, you need to manually code retries while waiting for the browser to complete actions. The manual [mentions](https://vitest.dev/guide/browser/assertion-api.html) an `expect.element` API that avoids the need to write an explicit `poll` but VS Code claims it doesn't exist when I try to use it. The manual says that "`expect.element` is a shorthand for `expect.poll(() => element)`".

This makes no sense to me, there's no global `element` defined either. In desperation, I came up with the nonsense below, which a few minutes of reflection would have told me can't possibly work.

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

I'm querying for the row before the one I jumped to as "5000" appears in both the `name` input box and row header. VS Code shows no errors so let's go. By default, Vitest pops up the browser while the test is running and then displays a report.

The test failed with `Error: Matcher did not succeed in 1000ms`.

{% include candid-image.html src="/assets/images/frontend/vitest-browser-mode-error.png" alt="Vitest Browser Mode Error" %}

The report includes a screenshot of the UI which shows the test succeeded. Obviously, I've written the assertion incorrectly. I tried to debug using the Vitest VS Code extension but get an error `Failed to fetch dynamically imported module`.

{% include candid-image.html src="/assets/images/frontend/vitest-browser-vs-code-error.png" alt="VS Code Error running Vitest Browser Mode test" %}

There's a [known issue](https://github.com/vitest-dev/vitest/issues/5477) about this error occurring in a variety of different contexts when using browser mode.

I did find a more detailed error message in the terminal.

```
Caused by: Error: expect(received).toHaveTextContent()

received value must be a Node.
```

After a lot of reflection and digging around in the Vitest source, I worked out what was going on. The Vitest manual should have said that `expect.element(locator)` is equivalent to `expect.poll(() => locator.element())`.

Once I changed the final line of my test to `await expect.poll(() => row.element()).toHaveTextContent('4999')`, it worked. 

What about the missing `expect.element`? Buried in an [unrelated section](https://vitest.dev/guide/browser/commands.html#custom-playwright-commands) of the documentation is a tip to add `"@vitest/browser/providers/playwright` to the `compilerOptions.types` section of your `tsconfig.json`". This is presented as a nice to have to get autocompletion. 

It's actually vital that you do this if you're using TypeScript. Once done, VS Code sees the `expect.element` extension and I can use the more friendly looking `expect.element(row).toHaveTextContent('4999')`.

## Coverage

Another reason for investigating Vitest browser mode is the promise of unified coverage metrics across unit tests and browser integration tests. Amazingly to me, it worked first time. The detailed coverage report looks exactly as I expected.

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

Coverage works but there's too much about Vitest browser mode that doesn't. Being unable to debug tests is a deal-breaker for me. The lack of CSS locators makes it significantly more difficult to write tests than using Playwright directly.

It might be possible to write a [custom command plugin](https://vitest.dev/guide/browser/commands.html#custom-commands) that [gives access](https://vitest.dev/guide/browser/commands.html#custom-playwright-commands) to Playwright's native CSS locator API. However, that's beyond the scope of what I'm prepared to do.

Having to be aware of the joins between the different APIs adds friction. Playwright has its own assertions designed for use with its locators. Retry and conversion to element are both handled behind the scenes.

The developer experience with Playwright is so much better that I would find myself writing and debugging tests in Playwright then painfully transferring them to Vitest. Which makes me wonder. Do I need Vitest browser mode at all?

Unified coverage is nice but it's really cheating. The testing pyramid tells us that we should do as much as we can at the unit test level. I absolutely can, and should, test all the component logic using unit tests. If I get it right, I get 100% coverage.

Component-browser integration testing is there to check that the actual interactions between component and browser are the same as we expected with our unit test mocks.

# Playwright Component testing

Can I do component-browser integration testing using Playwright? In a way I already am. Playwright end-to-end testing of my spreadsheet sample app is really just testing `VirtualSpreadsheet` component integration with the browser. The sample is a simple wrapper around the component with just enough of a test fixture to get it running.

Playwright also has an [experimental component testing feature](https://playwright.dev/docs/test-components). Your test starts with mounting a component (using the `mount` API) which you then interact with. This is equivalent to the `render` API in Vitest.

You need to add quite a lot of supporting scaffolding to your project
  * A `playwright/index.html` file used to render the component during testing
  * A `playwright/index.ts` file which sets up the environment for testing. For example, including stylesheets and injecting code into the page
  * [Component Stories](https://playwright.dev/docs/test-components#test-stories) which initialize your component with any complex props needed. The component runs in the browser so your test code can only pass plain JavaScript objects and primitive types to it. Instead of mounting the component directly, you mount a wrapper object which takes care of any complex configuration.

Behind the scenes Playwright uses Vite to compile a bundle containing the component and scaffolding, then serves it using the Vite development server. Use of Vite is hidden away behind the scenes and uses Playwright provided configuration. You [can't reuse your existing config](https://playwright.dev/docs/test-components#i-have-a-project-that-already-uses-vite-can-i-reuse-the-config). Instead you have to copy your high level settings into Playwright's configuration.

This all seems like a really convoluted way of recreating the sample app I already have and would still need. 

# Next Time

I think I'll pass on Playwright component testing. However, it did get me thinking. Is there a better way of creating apps that are simple wrappers around components for testing purposes? Playwright's "component stories" reminded me of another tool I've been meaning to take a look at.

Next time we'll take a look at [Storybook](https://storybook.js.org/). Maybe it will hit the sweet spot for component testing.
