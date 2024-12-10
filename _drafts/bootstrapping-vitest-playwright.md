---
title: Bootstrapping Playwright with Vitest
tags: frontend
---

wise words

# Playwright

* Had my eye on this for a while
* End to end browser based testing in the same space as [Selenium](https://www.selenium.dev/), [Cypress](https://www.cypress.io/) and [WebDriverIO](https://webdriver.io/)
* Write automated tests that interact with a browser that in turn connects to your web app (either local dev server or real staging/production deployment).
* The main difference is that rather than using the installed web browser, Playwright [installs its own browser binaries](https://playwright.dev/docs/browsers) built against the upstream open source toolkits used by the main browsers. These include Chromium (Chrome and Edge), Webkit (Safari) and Firefox.
* This approach gives Playwright more control over its environment, applying patches where needed to support tighter integration.
* Playwright tests run entirely out of process, driving each browser through an optimized web socket connection. 
* Playwright works with the multiple processes used by modern browsers. For example, you can write tests that interact with multiple browser tabs and multiple origins. 
* Playwright can run the same tests against multiple browsers in parallel.
* Great support for TypeScript out of the box.
* Generates native events indistinguishable from real user.
* Integrated test runner and UI
* Lots more [nice features](https://playwright.dev/)

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

# Playwright Installation

* [Installation documentation](https://playwright.dev/docs/intro) is minimal, suggesting you simply run `npm init playwright@latest`
* This installs everything, populates a project with `package.json` and a config file, then creates some example tests
* I'm using a monorepo so I suspect the standard setup won't be right for me. Plus I like to understand what's going on behind the scenes.
* I'll install manually
* The only mention of manual installation is in the [Updating Playwright](https://playwright.dev/docs/intro#updating-playwright) section at the bottom of the page

```
npm install -D @playwright/test@latest
# Also download new browser binaries and their dependencies:
npx playwright install --with-deps
```

* The first line is as you'd expect but what's `npx playwright install` doing?
* Playwright uses its own system for [downloading and installing browser binaries](https://playwright.dev/docs/browsers#install-browsers)
* By default Chromium, Webkit and Firefox will all be installed
* Browser binaries are stored in [OS-specific cache folders](https://playwright.dev/docs/browsers#managing-browser-binaries)
* Each version of Playwright requires a [specific set](https://github.com/microsoft/playwright/commits/main/packages/playwright-core/browsers.json) of browser binaries
* Unused browser binaries for old versions of Playwright are automatically removed when updating
* I was initially worried about doing an end run around npm like this. However, having a fixed set of binaries for each version of Playwright means that versions are still controlled by your package manager. The only downside is the extra step needed to update the browser binaries whenever Playwright gets updated.
* The `--with-deps` [argument](https://playwright.dev/docs/browsers#install-system-dependencies) is a convenience for CI. It ensures that all system level dependencies required by the browsers are installed on the host system. Developer machines should already have these and if not you probably want more control over what system level changes get made. 

```
% npm install -D @playwright/test

added 3 packages, and audited 1046 packages in 7s
```

* Base package was quick to install. All the meat is in the browsers. Took about three minutes to download everything.

```
 % npx playwright install
Downloading Chromium 131.0.6778.33 (playwright build v1148) from https://playwright.azureedge.net/builds/chromium/1148/chromium-mac-arm64.zip
121.6 MiB [====================] 100% 0.0s
Chromium 131.0.6778.33 (playwright build v1148) downloaded to /Users/tim/Library/Caches/ms-playwright/chromium-1148
Downloading Chromium Headless Shell 131.0.6778.33 (playwright build v1148) from https://playwright.azureedge.net/builds/chromium/1148/chromium-headless-shell-mac-arm64.zip
77.5 MiB [====================] 100% 0.0s
Chromium Headless Shell 131.0.6778.33 (playwright build v1148) downloaded to /Users/tim/Library/Caches/ms-playwright/chromium_headless_shell-1148
Downloading Firefox 132.0 (playwright build v1466) from https://playwright.azureedge.net/builds/firefox/1466/firefox-mac-arm64.zip
81.6 MiB [====================] 100% 0.0s
Firefox 132.0 (playwright build v1466) downloaded to /Users/tim/Library/Caches/ms-playwright/firefox-1466
Downloading Webkit 18.2 (playwright build v2104) from https://playwright.azureedge.net/builds/webkit/2104/webkit-mac-14-arm64.zip
69.5 MiB [====================] 100% 0.0s
Webkit 18.2 (playwright build v2104) downloaded to /Users/tim/Library/Caches/ms-playwright/webkit-2104
Downloading FFMPEG playwright build v1010 from https://playwright.azureedge.net/builds/ffmpeg/1010/ffmpeg-mac-arm64.zip
1.1 MiB [====================] 100% 0.0s
FFMPEG playwright build v1010 downloaded to /Users/tim/Library/Caches/ms-playwright/ffmpeg-1010
```

* Added `playwright.config.ts` and `tests/example.spec.ts` to `spreadsheet-sample` copied from a [Playwright Example](https://github.com/microsoft/playwright/tree/main/examples/svgomg)

```
% npx playwright test

Running 18 tests using 4 workers
  18 passed (18.4s)

To open last HTML report run:

  npx playwright show-report
```

* Running `show-report` opened up an html report in my browser

{% include candid-image.html src="/assets/images/frontend/playwright-show-report.png" alt="Playwright HTML Report" %}

* The example interacts with a web app running at [https://demo.playwright.dev/svgomg](https://demo.playwright.dev/svgomg)
* Interacts with the web page, uploads and downloads a file, using all 3 browsers, in parallel, in 18 seconds
* Had to add `playwright-report` and `test-results` to my `.gitignore`

* You can run Playwright with a UI to develop and debug your tests

{% include candid-image.html src="/assets/images/frontend/playwright-ui.png" alt="Playwright Test UI" %}

* There's a timeline, snapshots for each action, the corresponding test source code, logs, errors, network activity and more
* There's also a [VS Code extension](https://playwright.dev/docs/getting-started-vscode) which includes most of the functionality of the Playwright UI integrated into the VS Code test tab. Test failures are reported in the source code editor window, complete with callstack. You can also live debug a test.

# Writing Tests

* [Playwright tests](https://playwright.dev/docs/writing-tests) perform actions and assert that the resulting state matches expectations
* Playwright automatically waits for actions to complete before checking assertions
* Tests almost always start with navigating to a specific URL

```ts
await page.goto('http://localhost:5173/');
```

* You'll then need to interact with elements on the page. You first need to *locate* the element, then perform an action on it.

```ts
await page.getByRole('link', { name: 'Get started' }).click();
```

## Locators

* There are lots of types of [locator](https://playwright.dev/docs/locators), the documentation lists them in order of preference, with [`getByRole`](https://playwright.dev/docs/api/class-page#page-get-by-role) the most preferred. This locates an element by their [ARIA role](https://www.w3.org/TR/wai-aria-1.2/#roles) and [accessible name](https://w3c.github.io/accname/#dfn-accessible-name). 
* Playwright includes a handy [codegen](https://playwright.dev/docs/codegen-intro#running-codegen) utility if, like me, you're unsure of the best locator to use for an element
* I fired up my spreadsheet sample app and ran `npx playwright codegen http:/localhost:5173`

{% include candid-image.html src="/assets/images/frontend/playwright-codegen.png" alt="Playwright Codegen" %}

* Codegen adds a toolbar and floating palette to your test app
* You can hover over elements in the page and see a suggested locator or record an interactive session and generate actions that you can copy into your test
* It immediately became clear that most of the elements on my page don't have good locators
* Which also implies that they're not very accessible
* The input fields are easy to sort out. I've noticed some warnings in Chrome developer tools that I need either a name or id for autofill to work
* I don't like adding ids to elements within components as ids need to be global on a page. The app should decide.

## Accessible Name

* Names will work nicely and allow a `getByRole` locator
* Spreadsheet cells in grid and headers are more tricky
* Can I give them all names using Row, Column and Cell references?
* No - divs can't have names, only active UI elements

* Gave my input box a name of "name" (it displays the name of a row, column or cell). That's what Google Sheets calls it too.
* `getByRole('textbox', { name: 'name'})` doesn't work
* Turns out the [accessible name](https://accessibilityinsights.io/info-examples/web/input-button-name/) for an input doesn't come from the name attribute
* `title` didn't work either. I had to use `aria-label` to get it to work. 
* Can lookup by title directly using `getByTitle` so went with that. Accessibility is a whole topic on its own so happy to leave for another time.

## Accessing Rows, Columns and Cells

* In the end I realized that locating specific elements isn't that useful. I can locate the header cell for row 5000 but what can I do with it? Check that the text it contains is "5000"? Testing at this level should be about events and layout, things I can't do at unit test level.
* Think about the bugs that motivated use of Playwright. Use the "Scroll To" input field to select row 5000 and find the grid has jumped to 8211.
* Test is to put "5000" into the input field, press enter and then check that the selected row in the row header contains "5000".
* Need to locate elements by semantic class (row, column, cell, focus, selection) and layout
* Despite being at the bottom of the priority list in the Playwright documentation, CSS locators seem like the best fit
* Playwright recommends prioritizing user-visible locators because CSS is an implementation detail that could break when the page changes
* In my case, CSS classes are part of the [contract between component and app]({% link _posts/2024-08-26-css-react-components.md %}). They're semantically meaningful, describing the visual state of the component.
* CSS class based selectors can be easily combined with [layout based queries](https://playwright.dev/docs/other-locators#css-matching-elements-based-on-layout) (the cell to the right of the row header containing "5000") and [DOM structure based queries](https://playwright.dev/docs/other-locators#n-th-element-locator) (the first row in the row header)
* The only problem is that my sample app currently uses CSS Modules so CSS class names are dynamic. Fortunately, my approach to CSS means that the app is in control and it's easy to switch to fixed class names.

## First Test

```ts
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('Scroll to 5000', async ({ page }) => {
  const name = page.getByTitle('Name');
  await name.click();
  await name.fill('5000');
  await name.press('Enter');

  const row = page.locator('.VirtualSpreadsheet_Row__Selected');
  await expect(row).toHaveText('5000');
});
```

## Developer Experience

* Codegen is useful to record something that works as a starting point that you then refine
* VS Code extension is fantastic
* Run test direct from VS Code editor with option to pop up browser to see what's happening
* As you edit locator, corresponding element is highlighted in browser
* Most of the codegen tools are also available from the Playwright tab in VS Code
* `webServer` option in playwright config file lets you specify how to start local dev server, e.g. `npm run dev`
* Then `npx playwright test` on command line or during CI will start server, run tests, shutdown server
* Setting the `reuseExistingServer` option means Playwright will use any existing server running on the specified port rather than erroring out
* Playwright tests will run against a dev server you started manually, or use their own server

```ts
{
  webServer: {
     command: 'npm run dev',
     url: 'http://localhost:5173/',
     reuseExistingServer: !process.env.CI
  }
}
```

* You can use `process.env.CI` to check for a CI environment and use more conservative settings
* VS Code extension works the same way, except that it leaves server running until it exits
* If you need to force quit a dev server then `npx kill-port 5173` will do the trick

# Vitest Browser

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
