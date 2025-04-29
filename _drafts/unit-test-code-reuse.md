---
title: Unit Test Code Reuse with Vitest
tags: frontend
---

wise words

# Unit Tests

# Setup and Teardown

# Context

# Assertions

# Refactoring Common Code

# Deeply Equal

{% include candid-image.html src="/assets/images/frontend/deeply-equal-error-display.png" alt="Deeply Equal Error Display" %}

# Custom Matchers

{% include candid-image.html src="/assets/images/frontend/custom-matcher-error-display.png" alt="Custom Matcher Error Display" %}

{% include candid-image.html src="/assets/images/frontend/custom-matcher-detailed-error-vscode.png" alt="Custom Matcher Detailed Error in VSCode" %}

{% include candid-image.html src="/assets/images/frontend/custom-matcher-detailed-error-terminal.png" alt="Custom Matcher Detailed Error in Terminal" %}

# Reusing Tests

* Scoped values?
* Define extended test with context that sets up reference implementation of component
* Write tests that use it
* Import those tests into different suites that use `test.scoped` to override the component implementation
