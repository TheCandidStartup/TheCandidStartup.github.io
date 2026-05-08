---
title: InfiniSheet Unexpected Errors, Cancellation and Timeouts
tags: infinisheet
thumbnail: /assets/images/typescript/structured-concurrency-logo.png
---

wise words

* Continuing to flesh out `ConcurrencyScope`

# Unexpected Errors

* Using error included in `Result` for expected errors, any exceptions or rejected promises are unexpected errors. Outside the visibility of the type system.
* Unexpected errors should just propagate through scope, while ensuring everything is canceled.
* try - finally

# Cancellation

# Timeouts

