---
title: Bootstrapping Vitest with Playwright
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
