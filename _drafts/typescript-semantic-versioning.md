---
title: TypeScript Semantic Versioning
tags: typescript
thumbnail: /assets/images/frontend/ts-logo-128.png
---

The JavaScript NPM ecosystem is built on the foundation of [semantic versioning](https://docs.npmjs.com/about-semantic-versioning). Without semantic versioning, how could you possibly manage upgrades to the hundreds of dependencies accumulated by any real world project? 

Which makes things a little awkward when you discover how TypeScript handles semantic versioning. 

# TypeScript Compiler

The TypeScript compiler [doesn't follow semantic versioning](https://www.learningtypescript.com/articles/why-typescript-doesnt-follow-strict-semantic-versioning). Or at least it has an *interesting* interpretation of semantic versioning.

Major updates are for changes in the TypeScript compiler's API, config file and command line flags. i.e. Breaking changes in how you run the compiler.

Minor updates are for changes in compiler output that might cause breaking changes in your code. i.e. Type errors in code that used to compile OK, no type errors for things that would previously be found.

Upgrading to a new minor version of the TypeScript compiler can result in your package failing to compile. Even worse, new minor versions of the TypeScript compiler can result in type errors when clients consume your package. 

Which explains why so many packages are pinned to specific minor versions of the TypeScript compiler.

# Semantic Versioning for TypeScript Types

While researching this problem I came across a [spec](https://www.semver-ts.org/index.html) for managing changes to TypeScript types in library code. The aim is to ensure no new TypeScript type errors (whether from your changes or upgrade of the TypeScript compiler) in minor version releases.

Great in principle but tricky in practice because of TypeScript's structural typing and the possibility of breaking changes in the compiler. The spec includes [detailed rules](https://www.semver-ts.org/formal-spec/2-breaking-changes.html) for which changes to your types are breaking vs non-breaking.

Changes in supported TypeScript versions are considered to be major updates. That is, changes in the version of TypeScript your consumer has to use. Bugs in types (even if breaking for those relying on buggy behavior) can be fixed in patch releases.

The spec also includes requirements for which TypeScript compiler options to use. You want to avoid forcing your clients to use particular options. In general, you should compile your code using the strictest settings. The resulting package should work for any client using equally or less strict settings.

The final requirements are to document your versioning policy, including which TypeScript versions you support. My first thought was to use `peerDependencies` in each package to define supported versions, with a `peerDependenciesMeta` entry to make TypeScript optional. I can then use a [Dynamic JSON badge](https://shields.io/badges/dynamic-json-badge) to pull the dependencies out and document them in the package README.

In the end I decided to document rather than enforce. In most cases using a newer TypeScript compiler than the one I built the package with will be fine. The package's published types have a much smaller surface area than the source code and use fewer TypeScript features. It's also easier to maintain. I can define TypeScript versions once in the monorepo root `package.json` and reference it from all package READMEs.

{% include candid-image.html src="/assets/images/react-virtual-scroll/dependency-badges.png" alt="Dependency badges in the react-virtual-scroll README" %}

While I was at it, I also added a badge for supported versions of React.

# Rules of Thumb

Evaluating whether changes are breaking can be tricky, so I have some rules of thumb to make life easier.

I use [API Extractor]({% link _posts/2024-07-19-bootstrapping-api-extractor.md %}) to generate a report that defines the public API contract for each package. That makes it easy to see if there have been any changes. If there's no change in the TypeScript compiler or API contract, the change is safe.

I have a checklist than I run through when I update TypeScript.
1. Review release notes for potential issues
2. Check if build with new compiler changes API contract
3. Run full build including component level testing that consumes the built packages

# Testing Types

Vitest includes features for [testing types](https://vitest.dev/guide/testing-types.html). You write assertions using [`expectTypeOf`](https://vitest.dev/api/expect-typeof.html) in special `*.test-d.ts` test files. Instead of executing the tests, Vitest runs the TypeScript compiler with assertion failures reported as type errors.

The assertions you can write are all variations of pulling the types apart and checking they structurally match what you expect. I haven't made any use of this feature, because I get pretty much the same thing for free when API Extractor reports changes in the API. 

# Strictness

The semantic versioning spec [requires](https://www.semver-ts.org/formal-spec/5-compiler-considerations.html#strictness) packages to be built with `strict: true`, `noUncheckedIndexAccess: true`, and `exactOptionalPropertyTypes: true`.

I already have `strict: true` enabled, which turns on a set of recommended individual settings. How difficult can it be to add a couple more?

## No Unchecked Index Access

JavaScript arrays are weird when you think about it. A standard array is indexed by integers `>= 0`. Except there's no integer type to index them with, just the general `number` type. If you pass in a non-natural number it's treated as an object key lookup and for a normal array returns `undefined`.

By default, TypeScript assumes that any access to a `T[]` array using a `number` index will return a `T`. That's clearly wrong, which is where [this option](https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess) comes in. When turned on it assumes that access to a `T[]` array using a `number` index returns `T | undefined`. The same thing applies when querying an unknown property using an [index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures).

Why isn't this on by default, or at least included in `strict`? Try turning it on and you'll see why. Lots of false positives.

TypeScript is very limited in its ability to determine whether an array access is safe. Consider this classic C style iteration over an array.

```ts
const length = array.length;
for (let i = 0; i < length; i ++) {
  const entry = array[i];
  ...
}
```

TypeScript considers `entry` to be possibly `undefined`. Even if TypeScript could handle that case, you run into more problems when the index is passed in via an argument to a function. There's no type that represents a natural number.

For simple cases you can rewrite the iteration.

```ts
for (const entry of array) {
  ...
}
```

Or if you need the index too:

```ts
for (const [i,entry] of array.entries()) {
  ...
}
```

In more complex cases you could add a runtime check.

```ts
const entry = array[i];
if (entry !== undefined) {
  ...
}
```

Or use the [non-null assertion operator](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-) to tell TypeScript it's all fine - there's no `null` or `undefined` values here.

```ts
const entry = array[i]!;
...
```

On balance turning this option on is a good thing. I found and fixed a couple of potential bugs where an array access really could return `undefined`. I was able to rewrite simple iterations to avoid the array access. 
 
It wasn't too painful adding assertion operators when there wasn't a better way of doing it. The assertion operator effectively puts you back into the same place of blissful ignorance you had with the option off. At least you have the chance to think about it this way.

## Exact Optional Property Types

TypeScript lets you [mark properties as optional](https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties) when defining a type by adding a question mark (`?`) to the end of their names. Optional properties don't need to be provided when constructing an instance of the type. 

When you read from an optional property that hasn't been defined,  JavaScript will return `undefined`. TypeScript treats an optional property of type `T` as if it had the type `T | undefined`.

There is some ambiguity about what should happen if you try to explicitly set an optional property to `undefined`. For most purposes a property explicitly set to `undefined` is equally *falsy* as a property that was never defined. For this reason, by default, TypeScript allows you to set optional properties to `undefined`. However, there is a difference between the two that can be detected at runtime. 

[This option](https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes) removes the ambiguity and makes you spell out exactly what you mean. When enabled, an optional property of type `T` must be of type `T` if defined. You can't set it to `undefined`. If you want to allow `undefined` as a possible value you have to explicitly declare the property as type `T | undefined`.

The immediate impact of enabling this property is that you have to go through your source code and add `| undefined` to the end of every optional property declaration. React code, in particular, is full of *props* types with long lists of optional properties. 

It's very rare that you would want an optional property that you can't set to `undefined`. So why go to all this effort? Again, it's so that you don't force your choices on your clients. If your code works with `exactOptionalPropertyTypes` enabled, it will work however your client chooses to set that option. 

For my code, setting the option seemed to have a viral effect. Many of my React components can be customized by passing in your own sub-components. These sub-components need to implement an interface defined by a set of props, some of which are optional. There's lots of knock on impact in higher level components and sample code.

I eventually realized that this was largely my fault. I'd got into a bad habit of defining sub-components with types written out by hand.

```ts
const Row = ({ index, isScrolling, style }: 
  { index: number, isScrolling?: boolean, style: React.CSSProperties }) => (...)
```

When the required interface changes `isScrolling` to `boolean | undefined`, TypeScript complains. This is an accident waiting to happen. What I should have done is to define the component with the type that I'm trying to comply with.

```ts
const Row = ({ index, isScrolling, style }: DisplayListItemProps) => (...)
```

The resulting code is simpler and I get intellisense that documents how the props should be used. If I'd written this in the first place the explicit `| undefined` would have had no impact.

## exactOptionalPropertyTypes all the way down

Your life gets harder if your dependencies don't support `exactOptionalPropertyTypes` too. I use the DOM `addEventListener` API which takes a map of options defined as optional properties, with no explicit `| undefined`. I construct the listener options from props passed into me. Except now I can't because I can't assign something that might be `undefined` to the listener options. 

The original code is simple.

```ts
const opts = { capture, passive, once };
```

You can rewrite the code to construct opts so that only defined properties are added to the object. 

```ts
const opts = { 
  ...(capture !== undefined ? { capture } : {}), 
  ...(passive !== undefined ? { passive } : {}), 
  ...(once !== undefined ? { once } : {})
};
```

Unfortunately, it's much more verbose and has a runtime impact. In this case, the `addEventListener` API works just fine with properties set to `undefined`. Once again, you can use a [non-null assertion operator](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-) to tell TypeScript to ignore the possibility of `null` or `undefined`.

```ts
const opts = { 
  capture: capture!,
  passive: passive!,
  once: once!
};
```

This is less verbose (but still not as concise as the original) and has no runtime impact. However, there's more scope for mistakes once you get into the habit of turning off typechecking.

## Storybook

The Storybook UI doesn't handle optional props with explicit `| undefined` well. The prop gets documented as `union`, hiding the type the user is actually interested in.

The UI already distinguishes between required and optional properties, so at the UI level the `| undefined` is just noise. Luckily I've already [hacked Storybook]({% link _posts/2025-02-17-hacking-storybook-tsdoc.md %}) to add custom processing of prop descriptions and defaults.

Storybook's default parsing creates structured representations of types, which makes it easy to spot unions that end with `undefined`.

```ts
function isUnionUndefined(sbType: SBType): sbType is SBUnionType {
  if (sbType.name !== 'union')
    return false;

  const last = sbType.value.at(-1);
  return last !== undefined && last.name === 'other' && last.value === 'undefined';
}
```

I updated my processing code to remove the `| undefined` and display the type the same way as previously.

There are lots of places where I define callback props using an embedded function type definition.

```ts
  onScroll?: (offset: number, newScrollState: ScrollState) => void
```

When I went through the code on autopilot adding `| undefined` I ended up with this.

```ts
  onScroll?: (offset: number, newScrollState: ScrollState) => void | undefined
```

Which is a function that returns `void` or `undefined`. Not what I intended.

```ts
{
  onScroll?: ((offset: number, newScrollState: ScrollState) => void) | undefined
}
```

This is correct but getting hard to parse by eye. It turns out Storybook also finds it hard. It puts this type in it's `other` category which messes up the docs.

I simplified the declaration by adding type aliases for the callbacks.

```ts
type VirtualListScrollHandler = (offset: number, newScrollState: ScrollState) => void;

{
  onScroll?: VirtualListScrollHandler | undefined;
}
```

Which is easy to understand for human and Storybook. It also simplifies the Storybook docs as it no longer includes complete documentation of the callback parameters. You can look in the API documentation or use Intellisense when you need those. 

## Rat Hole

This option is a much harder sell. I've ended up going down quite a rat hole to end up almost where I started. 

Does anyone really depend on being able to use this option? I hope so, because I've put in a lot of work to support it. Hopefully, it will be a lot simpler to maintain support going forwards.

# Conclusion

[InfiniSheet](https://github.com/TheCandidStartup/infinisheet/blob/main/README.md) is now compliant with [*Semantic Versioning for TypeScript Types*](https://www.semver-ts.org/index.html). Packages built with the required options are available on [npm](https://www.npmjs.com/search?q=%40TheCandidStartup). 
