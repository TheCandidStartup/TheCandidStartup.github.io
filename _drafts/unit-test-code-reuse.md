---
title: Unit Test Code Reuse with Vitest
tags: frontend
---

I'm a [strong believer]({% link _posts/2024-03-11-bootstrapping-vitest.md %}) in unit tests. I [try to get]({% link _posts/2024-04-02-vitest-mocking-time.md %}) close to 100% code coverage with my tests. Which means I have a lot of unit test code. Normally, you try to minimize duplication, or as it's often termed [Don't Repeat Yourself](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself). That has it's own special challenges when it comes to unit tests.

# Unit Test Code

Unit test code is a very particular thing. It's shaped by the particular unit test framework you're using, In my case that's [Vitest]({% link _posts/2024-03-11-bootstrapping-vitest.md %}). The framework provides an API for describing test suites, test cases and assertions of expected behavior.

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
  beforeEach(() => {
    const mock = vi.fn();
    Element.prototype["scrollTo"] = mock;
  })
  afterEach(() => {
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  })
```

Here I use Vitest's `beforeEach` and `afterEach` hooks to install and remove a mock `scrollTo` method on [DOM elements](https://developer.mozilla.org/en-US/docs/Web/API/Element). 

I tend to use this approach only when there is cleanup code which needs to be run after each test, regardless of what happens during the test. Anything more than single line setup code is best extracted as a utility function. If there's no cleanup needed, I prefer calling the utility function explicitly at the start of each test, making it clearer what's going on.

# Context

Vitest lets you provide additional [context](https://vitest.dev/guide/test-context.html) to each test. The context can be used to provide utility functions, test fixtures, shared state or whatever you want.

So far, I've found no reason to use context. I prefer calling a utility function if I want to create a test fixture. If I want to provide some common static context to all tests, I can define a local variable at the test suite level, or a module variable at the test file level. 

# Refactoring Common Code

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
