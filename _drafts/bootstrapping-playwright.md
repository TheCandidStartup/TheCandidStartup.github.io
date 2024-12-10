---
title: Bootstrapping Playwright
tags: frontend
---

I'm ready to add browser based automated testing to my [InfiniSheet]({% link _topics/infinisheet.md %}) project. Before we get into the details of getting my chosen tool up and running, let's have a quick reminder of [why we need it]({% link _posts/2024-12-02-react-virtual-scroll-state-harmful.md %}).

# Testing Pyramid

The concept of the [test pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) has been around for over a decade now. It's a useful visual metaphor that tells you how to divide tests into buckets with different granularity, while also giving you an idea of how many tests you should have in each bucket.

{% include candid-image.html src="/assets/images/frontend/testing-pyramid.svg" alt="Testing Pyramid" %}

The base of the pyramid is made up of unit tests. These are the most granular, testing the smallest units of code in isolation. The small code size and isolation makes unit tests fast and easy to understand. You should cover as much testing as possible with unit tests. Front end unit testing typically uses a mock DOM implementation, such as jsdom, to increase isolation. 

The next level up in my pyramid is component tests. A component is a meaningful unit of code with a strong abstraction layer and API. In the front end world, a React component would be a great example. You'll use many of the same techniques as unit testing but with more of a focus on the public API. Component testing typically covers more code, particularly when testing higher level components that are built from simpler components. 

Integration tests look at the integration of components with external systems that are typically mocked at the lower levels of the pyramid. A database is the classic example of an external system. For front end components, integration testing will focus on integration with the browser, perhaps running the same tests with each of the major browsers.

Finally, the top level of the pyramid is end to end testing. You might be testing a full stack application, automating a web app which interacts with a backend service that in turn stores data in a database. Tests at this level involve the most integration, have the most dependencies and are the slowest to setup and run.

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

# Installation

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

# Configuration

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

# Locators

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

# Accessible Name

* Names will work nicely and allow a `getByRole` locator
* Spreadsheet cells in grid and headers are more tricky
* Can I give them all names using Row, Column and Cell references?
* No - divs can't have names, only active UI elements

* Gave my input box a name of "name" (it displays the name of a row, column or cell). That's what Google Sheets calls it too.
* `getByRole('textbox', { name: 'name'})` doesn't work
* Turns out the [accessible name](https://accessibilityinsights.io/info-examples/web/input-button-name/) for an input doesn't come from the name attribute
* `title` didn't work either. I had to use `aria-label` to get it to work. 
* Can lookup by title directly using `getByTitle` so went with that. Accessibility is a whole topic on its own so happy to leave for another time.

# Accessing Rows, Columns and Cells

* In the end I realized that locating specific elements isn't that useful. I can locate the header cell for row 5000 but what can I do with it? Check that the text it contains is "5000"? Testing at this level should be about events and layout, things I can't do at unit test level.
* Think about the bugs that motivated use of Playwright. Use the "Scroll To" input field to select row 5000 and find the grid has jumped to 8211.
* Test is to put "5000" into the input field, press enter and then check that the selected row in the row header contains "5000".
* Need to locate elements by semantic class (row, column, cell, focus, selection) and layout
* Despite being at the bottom of the priority list in the Playwright documentation, CSS locators seem like the best fit
* Playwright recommends prioritizing user-visible locators because CSS is an implementation detail that could break when the page changes
* In my case, CSS classes are part of the [contract between component and app]({% link _posts/2024-08-26-css-react-components.md %}). They're semantically meaningful, describing the visual state of the component.
* CSS class based selectors can be easily combined with [layout based queries](https://playwright.dev/docs/other-locators#css-matching-elements-based-on-layout) (the cell to the right of the row header containing "5000") and [DOM structure based queries](https://playwright.dev/docs/other-locators#n-th-element-locator) (the first row in the row header)
* The only problem is that my sample app currently uses CSS Modules so CSS class names are dynamic. Fortunately, my approach to CSS means that the app is in control and it's easy to switch to fixed class names.

# First Test

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

# Developer Experience

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

# Next Time
