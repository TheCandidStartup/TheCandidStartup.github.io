---
title: Unit Test Code Reuse with Vitest
tags: frontend
---

I'm a [strong believer]({% link _posts/2024-03-11-bootstrapping-vitest.md %}) in unit tests. I [try to get]({% link _posts/2024-04-02-vitest-mocking-time.md %}) close to 100% code coverage with my tests. Which means I have a lot of unit test code. Normally, you try to minimize duplication, or as it's often termed [Don't Repeat Yourself](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself). That has it's own special challenges when it comes to unit tests.

# Unit Test Code

Unit test code is a very particular thing. It's shaped by the particular unit test framework you're using. In my case that's [Vitest]({% link _posts/2024-03-11-bootstrapping-vitest.md %}). The framework provides an API for describing test suites, test cases and assertions of expected behavior.

Here's an individual unit test I created recently for an [asynchronous event log]({% link _posts/2025-05-26-asynchronous-event-log.md %}) component. Here `describe`, `test` and `expect` are provided by the [Vitest API](https://vitest.dev/api/). The test creates an empty event log and then runs a variety of queries that check whether the implementation has the expected behavior.

```ts
describe('SimpleEventLog', () => {
  test('should start out empty', async () => {
    const data = new SimpleEventLog;

    let result = await data.query('start', 'end');
    expect(result.isOk());
    let value = result._unsafeUnwrap();
    expect(value.startSequenceId).toEqual(0n);
    expect(value.isComplete).toEqual(true);
    expect(value.entries.length).toEqual(0);

    result = await data.query('snapshot', 'end');
    expect(result.isOk());
    value = result._unsafeUnwrap();
    expect(value.startSequenceId).toEqual(0n);
    expect(value.isComplete).toEqual(true);
    expect(value.entries.length).toEqual(0);

    result = await data.query(0n, 0n);
    expect(result.isOk());
    value = result._unsafeUnwrap();
    expect(value.startSequenceId).toEqual(0n);
    expect(value.isComplete).toEqual(true);
    expect(value.entries.length).toEqual(0);

    result = await data.query(0n, 5n);
    expect(result.isOk());
    value = result._unsafeUnwrap();
    expect(value.startSequenceId).toEqual(0n);
    expect(value.isComplete).toEqual(true);
    expect(value.entries.length).toEqual(0);

    result = await data.query(5n, 30n);
    expect(result.isErr());
    let err = result._unsafeUnwrapErr();
    expect(err.type).toEqual("InfinisheetRangeError");

    result = await data.query(-5n, 0n);
    expect(result.isErr());
    err = result._unsafeUnwrapErr();
    expect(err.type).toEqual("InfinisheetRangeError");
  })
})
```

The code is also shaped by the tooling used to run the tests. When a unit test fails you want the cause to be as obvious as possible. That encourages simple, sequential code. The tooling reports an error on a particular line in the test. If that's buried inside nested loops or at the bottom of a callstack of function calls, it's going to be hard to figure out what happened.

The downside is that unit test code can easily become verbose and repetitive. We're going to look at some possible solutions compatible with Vitest.

# Shared Utilities

Any code that doesn't directly interact with unit test framework APIs can easily be extracted as a shared utility. This is just regular code. All the normal rules apply.

For example, when testing React components with the jsdom [environment](https://vitest.dev/config/#environment), I need to mock browser layout behavior, which in turn means overriding layout related properties in the DOM.

```ts
export function overrideProp(element: HTMLElement, prop: string, val: unknown) {
  if (!(prop in element))
    throw `Property ${prop} doesn't exist when trying to override`;

  Object.defineProperty(element, prop, {
    value: val,
    writable: false
  });
}
```

I extracted a handy utility function that I can use in all my React component test suites.

# Setup and Teardown

Most frameworks include [Setup and Teardown](https://vitest.dev/api/#setup-and-teardown) hooks. You can provide a setup function that runs before every test in a test suite and a teardown function that runs after every test.

```ts
describe('VirtualSpreadsheet', () => {
  let mock;

  beforeEach(() => {
    mock = vi.fn();
    Element.prototype["scrollTo"] = mock;
  })
  afterEach(() => {
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  })
```

Here I use Vitest's `beforeEach` and `afterEach` hooks to install and remove a mock `scrollTo` method on [DOM elements](https://developer.mozilla.org/en-US/docs/Web/API/Element). I stash the mock function in a variable that's accessible to all tests in case they need to check whether the mock was called.

I tend to use this approach only when there is cleanup code which needs to be run after each test, regardless of what happens during the test. Anything more than single line setup code is best extracted as a utility function. If there's no cleanup needed, I prefer calling the utility function explicitly at the start of each test, making it clearer what's going on.

# Fixtures

Fixtures are a more sophisticated form of setup and teardown hooks. A fixture typically takes the form of an object that the test interacts with. Unit test frameworks will setup the fixtures needed for each test, make them available to the test and then tear them down after each test.

Vitest supports fixtures using the same approach as [Playwright](https://playwright.dev/). The [Vitest documentation](https://vitest.dev/guide/test-context.html#extend-test-context) has some gaps that assume you're familiar with Playwright fixtures. I had to read the [Playwright documentation](https://playwright.dev/docs/test-fixtures) before I fully understood what was going on. 

In Vitest, fixtures are part of the [test context](https://vitest.dev/guide/test-context.html) object. The test context is provided to every test as an optional argument. You define additional fixtures by creating a custom test. Let's turn our mock scroll function into a fixture.

```ts
import { test as baseTest } from 'vitest'

export const test = baseTest.extend({
  scrollMock: async ({}, use) => {
    const mock = vi.fn();
    Element.prototype["scrollTo"] = mock;

    await use(mock);

    Reflect.deleteProperty(Element.prototype, "scrollTo");
  }
})
```

There's a lot going on here. You call `extend` on the base `test` and pass in an object. Each fixture is defined as a property whose value is an `async` function. The function has two required arguments. The first is a test context. The fixture can access anything it needs, including other fixtures. The second argument is a `use` callback function. Your fixture implementation should run any setup code needed to initialize the fixture, pass the fixture to `use` and `await` it, then run any teardown code.

You can define as many fixtures as you like. You can also extend an existing custom test to add more fixtures. You would typically have shared utility code that defines all the fixtures needed for your project. You then import your custom test into each unit test file and use the fixtures in your tests.

```ts
describe('My Test Suite', () => {
  test('needs mocked scroll', async ({ scrollMock }) => {
    ...
    expect(scrollMock).toBeCalledTimes(1);
  }
})
```

There's lots of magic happening behind the scenes. Fixtures are only initialized if they're used. You [should use object destructuring](https://vitest.dev/guide/test-context.html#fixture-initialization) to retrieve the fixtures from the context. The getters accessed when destructuring run the corresponding fixture functions (recursively if they depend on other fixtures), returning whatever was passed to the `use` callback. Once the test completes, the functions are resumed so they can cleanup. 

So far, I've had no compelling need for fixtures. Most of my tests create a single "fixture" (`SimpleEventLog` in my initial example) that doesn't need any explicit cleanup. It's easier to start each test with an explicit single line fixture creation.

# Context Properties and Projects

You can also extend the test context with regular properties. Anything that isn't a fixture is just added to the context where it can be accessed by each test. This becomes useful for code reuse when combined with Vitest [projects](https://vitest.dev/guide/projects.html). You can define multiple projects which include a common set of unit test files. You can [override](https://vitest.dev/guide/test-context.html#default-fixture) context properties on a per project basis. For example, you could run the same backend test suite against production, staging and dev environments using three projects with a different base URL context property for each. 

It's good to know that this kind of large scale reuse is possible, but at the moment my code reuse needs are more fine grained.

# Refactoring Common Code

In particular, I run the same set of assertions for every query in my event log unit test. If it was any other sort of code, I'd refactor it and extract a common `expectQueryResult` function. What happens if I do that here?

```ts
function expectQueryResult(result: Result<QueryValue<LogEntry>, QueryError>, 
  startSequenceId: SequenceId, isComplete: boolean, length: number) {
  expect(result.isOk());
  let value = result._unsafeUnwrap();
  expect(value.startSequenceId).toEqual(startSequenceId);
  expect(value.isComplete).toEqual(isComplete);
  expect(value.entries.length).toEqual(length);
}

describe('SimpleEventLog', () => {
  test('should start out empty', async () => {
    const data = new SimpleEventLog;

    let result = await data.query('start', 'end');
    expectQueryResult(result, 0n, true, 0);

    result = await data.query('snapshot', 'end');
    expectQueryResult(result, 0n, true, 0);

    result = await data.query(0n, 0n);
    expectQueryResult(result, 0n, true, 0);

    result = await data.query(0n, 5n);
    expectQueryResult(result, 0n, true, 0);

    ...
  }
}
```

That looks much cleaner. However, remember what I said about the code being shaped by the tooling. Let's see what happens if I change one of the arguments to the second `expectQueryResult` so that the test fails.

{% include candid-image.html src="/assets/images/frontend/refactor-unit-test-detailed-error-terminal.png" alt="Refactored unit test standard error reporting" %}

{% include candid-image.html src="/assets/images/frontend/refactor-unit-test-detailed-error-vscode.png" alt="Refactored unit test VSCode error reporting" %}

# Deeply Equal

{% include candid-image.html src="/assets/images/frontend/deeply-equal-error-display.png" alt="Deeply Equal Error Display" %}

# Custom Matchers

{% include candid-image.html src="/assets/images/frontend/custom-matcher-error-display.png" alt="Custom Matcher Error Display" %}

{% include candid-image.html src="/assets/images/frontend/custom-matcher-detailed-error-vscode.png" alt="Custom Matcher Detailed Error in VSCode" %}

{% include candid-image.html src="/assets/images/frontend/custom-matcher-detailed-error-terminal.png" alt="Custom Matcher Detailed Error in Terminal" %}

# Reusing Tests

{% include candid-image.html src="/assets/images/frontend/interface-test-detailed-error-vscode.png" alt="Interface Test Detailed Error in VSCode" %}

{% include candid-image.html src="/assets/images/frontend/interface-test-drill-down-vscode.png" alt="Interface Test in VSCode, drilling down to test code" %}

{% include candid-image.html src="/assets/images/frontend/interface-test-detailed-error-terminal.png" alt="Interface Test Detailed Error in Terminal" %}

* Scoped values?
* Define extended test with context that sets up reference implementation of component
* Write tests that use it
* Import those tests into different suites that use `test.scoped` to override the component implementation
