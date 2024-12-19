---
title: Typecheck All The Things
tags: frontend
---

Something weird happened the other day.  I opened up one of my unit tests in VS Code to refresh my memory on how a component worked. VS Code reported that the test file had four TypeScript errors. I checked another unit test. That had errors too.

The tests are in my `react-virtual-scroll` package which I haven't touched for a few weeks. I've made other changes that triggered my Build CI workflow several times. All succeeded without errors. I run all my unit tests locally. No problems reported.

# Working it out

What's going on? The errors are all when I'm trying to call Vitest's [mocking API](https://vitest.dev/api/vi.html#mocking-functions-and-objects). Long story short, it turns out that these APIs [changed](https://vitest.dev/guide/migration.html#simplified-generic-types-of-mock-functions-e-g-vi-fn-t-mock-t) when I [upgraded to Vitest 2](https://www.thecandidstartup.org/2024/12/09/infinisheet-chore-updates.html). 

I didn't notice. 

Why would I? My unit tests all passed. The production build was successful. The sample apps all worked. 

How can that be? It's an interesting combination of circumstances.
1. Vite (and by extension Vitest) optimize for fast turnaround. They use Javascript bundlers to transpile TypeScript to JavasScript. This simply removes the type annotations without doing any type checking.
2. During local development VS Code will typecheck as you edit your source code, reporting errors as you make them.
3. During production builds all the source code needed to produce packages and apps is explicitly typechecked.

Can you see the hole? Unit tests aren't included in the built packages and apps, so aren't type checked during a production build. The only time they get type checked is when you open the source file in VS Code.

# Typecheck all the things

* Need to make sure that everything VS Code type checks interactively is explicitly type checked during the Build CI workflow
* Add an explicit `typecheck` script to each project that uses the interactive `tsconfig.json` rather than `tsconfig.build.json` which only includes the source code included in the build outputs. 
