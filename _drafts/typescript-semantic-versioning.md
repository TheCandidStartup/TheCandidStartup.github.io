---
title: TypeScript Semantic Versioning
tags: frontend
---

wise words

# TypeScript Compiler

* TypeScript compiler [doesn't follow semantic versioning](https://www.learningtypescript.com/articles/why-typescript-doesnt-follow-strict-semantic-versioning)
* Or at least has an interesting interpretation of semantic versioning
* Major updates are for changes in API and command line flags. i.e. Breaking changes in how you run the compiler.
* Minor updates are for changes in compiler output that might cause breaking changes in your code. i.e. Type errors in code that used to compiler OK, no type errors for things that would previously be found.
* Explains why so many projects are pinned to specific versions of TypeScript compiler

# Semantic Versioning for TypeScript Types

* [Spec](https://www.semver-ts.org/index.html) for managing changes to TypeScript types in library code
* Aim is to ensure no new TypeScript type errors (whether from your changes or upgrade of TypeScript compiler) in minor version releases
* Tricky because of TypeScript's structural typing and possibility of breaking changes in compiler
* Detailed rules for which changes to your types are breaking vs non-breaking
* Bugs in types (even if breaking for those relying on buggy behavior) can be fixed in patch release
* Changes in supported TypeScript versions are major changes. That is, changes in the version of TypeScript your consumer has to use.
* Advice on TypeScript compiler options to use. Want to avoid forcing your clients to use particular options. In general, compile your code using the strictest settings. Then should work for client using equally or less strict settings.
* Document policy

#  Rules of Thumb

* Using API Extractor so have a report that defines public API contract, can easily see changes
* If no change in TypeScript compiler or API contract, change is safe.
* If API contract changes, review against rules to see if should be considered breaking. If in doubt make it a major release.
* If TypeScript compiler changes - review release notes for potential issues, check if build with new compiler changes API contract, build CI includes component level testing consuming built packages. Ideally would run these using previous version of compiler as well
* [Testing Types](https://vitest.dev/guide/testing-types.html) in Vitest
