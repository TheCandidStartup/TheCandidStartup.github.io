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

I need to make sure that everything VS Code type checks interactively is explicitly type checked during the Build CI workflow. The type checking that happens when building production packages uses a dedicated `tsconfig.build.json` via a [plugin deep inside Rollup]({% link _posts/2024-05-13-bootstrapping-npm-package-build.md %}). I don't want to mess with that. Even if I did, it wouldn't be obvious what was happening. 

Similarly, any production typechecking performed by [Storybook]({% link _posts/2025-01-13-bootstrapping-storybook.md %}) is hidden inside the `storybook` command. Only my sample app builds have explicit typechecking visible in `package.json`.

I decided that the most transparent thing to do was to add an explicit `typecheck` script to each project. The script uses the TypeScript compiler with the default `tsconfig.json` that VS Code uses. 

```json
{
  "scripts": {
    "typecheck": "tsc -p tsconfig.json",
    "build": "tsc -p tsconfig.build.json && vite build",
  }
}
```

The compiler looks for `tsconfig.json` by default. I decided to make it explicit so that it's clear how it differs from the typechecking performed by the build script.

# Update broken type signatures

Running my `typecheck` script reassuringly reports the same errors as VS Code.

```
src/VirtualList.test.tsx:488:30 - error TS2558: Expected 0-1 type arguments, but got 2.

488       const onScroll = vi.fn<[number,ScrollState],void>();
                                 ~~~~~~~~~~~~~~~~~~~~~~~~~
```

In Vitest 1, `vi.fn` creates a mock function that accepts the specified array of parameter types and has the specified return type. In Vitest 2, it takes a single argument which is simply the type of the function you want to mock. 

In my case, I'm mocking a scroll handler passed to the `VirtualList` `onScroll` prop. The props are typed as `VirtualListProps`, so I should be able to extract the required type from `VirtualListProps.onScroll`, rather than writing it out by hand.

My first attempt was `vi.fn<VirtualListProps.onScroll>`. That doesn't work because you can't use `.` syntax to access the member of a type. However, the error message very helpfully explains I should use `VirtualListProps['onScroll']` instead.

Which doesn't work either. This time the error message tells me that `((offset: number, newScrollState: ScrollState) => void) | undefined` does not satisfy the constraint 'Procedure'. Not quite as helpful but I can see what the problem is. The `onScroll` prop is optional so has a type signature that's the union of the function type I want and `undefined`. 

Some light Googling leads me to the TypeScript utility function [Exclude](https://www.typescriptlang.org/docs/handbook/utility-types.html#excludeuniontype-excludedmembers) which constructs a type by excluding types from an existing union. Which gets me to the final solution that does work.

```ts
  type ScrollHandler = Exclude<VirtualListProps['onScroll'], undefined>;
  const onScroll = vi.fn<ScrollHandler>();
```

# Conclusion

I feel confident that I won't run into type errors unexpectedly in future. The `typecheck` script is run as part of my GitHub actions "Build CI" workflow and my local pre-commit routine. 

I have mixed feelings about the changes I made to fix the type errors. The way that TypeScript allows you to manipulate types is impressive. However, I found the process of coming up with the correct type signature unintuitive. I'm not sure how readable I'll find this code when I come back to it in future. On the positive side, the Intellisense tooltips in VS Code make it easy to figure out what the `ScrollHandler` type definition is doing.
