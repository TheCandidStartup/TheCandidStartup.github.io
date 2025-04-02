---
title: TypeScript Semantic Versioning
tags: frontend typescript
---

wise words

# TypeScript Compiler

* TypeScript compiler [doesn't follow semantic versioning](https://www.learningtypescript.com/articles/why-typescript-doesnt-follow-strict-semantic-versioning)
* Or at least has an interesting interpretation of semantic versioning
* Major updates are for changes in API and command line flags. i.e. Breaking changes in how you run the compiler.
* Minor updates are for changes in compiler output that might cause breaking changes in your code. i.e. Type errors in code that used to compile OK, no type errors for things that would previously be found.
* Explains why so many projects are pinned to specific versions of TypeScript compiler

# Semantic Versioning for TypeScript Types

* [Spec](https://www.semver-ts.org/index.html) for managing changes to TypeScript types in library code
* Aim is to ensure no new TypeScript type errors (whether from your changes or upgrade of TypeScript compiler) in minor version releases
* Tricky because of TypeScript's structural typing and possibility of breaking changes in compiler
* Detailed rules for which changes to your types are breaking vs non-breaking
* Bugs in types (even if breaking for those relying on buggy behavior) can be fixed in patch release
* Changes in supported TypeScript versions are major changes. That is, changes in the version of TypeScript your consumer has to use.
* Advice on TypeScript compiler options to use. Want to avoid forcing your clients to use particular options. In general, compile your code using the strictest settings. Then should work for client using equally or less strict settings.
* Document policy, including which TypeScript versions you support
* Could use `peerDependencies` in each package to define supported versions, with `peerDependenciesMeta` to make TypeScript optional
* Use a [Dynamic JSON badge](https://shields.io/badges/dynamic-json-badge) to pull the dependencies out and document them in README
* Decided to document rather than enforce. In most cases newer TypeScript compiler will be fine because published types have a much smaller surface area than source code. Also means I can define TypeScript versions once in monorepo root and reference from all package READMEs.

#  Rules of Thumb

* Using API Extractor so have a report that defines public API contract, can easily see changes
* If no change in TypeScript compiler or API contract, change is safe.
* If API contract changes, review against rules to see if should be considered breaking. If in doubt make it a major release.
* If TypeScript compiler changes - review release notes for potential issues, check if build with new compiler changes API contract, build CI includes component level testing consuming built packages. Ideally would run these using previous version of compiler as well
* [Testing Types](https://vitest.dev/guide/testing-types.html) in Vitest
* If client uses TypeScript compiler outside the tested range, it may work, or they may encounter typing errors.
* Packages are supplied as bundled JS + `.d.ts` typings. Much smaller surface area in amount of code and number of TypeScript features it relies on. 

# Strictness

* I already do `strict: true`
* Added `noUncheckedIndexAccess: true` - array access issues
* JavaScript arrays are weird when you think about it. Standard array indexed by integers >= 0. Except there's no integer type, just a general number, to index them with. If you pass in a non-natural number it's treated as an object key lookup and for a normal array returns `undefined`. 
* By default TypeScript assumes that any access to a `T[]` array using a `number` index will return a `T`. 
* That's clearly wrong, which is where this option comes in. When turned on it assumes that access to a `T[]` array using a `number` index returns `T | undefined`. 
* Why isn't this on by default, or at least included in `strict`? Try turning it on and you'll see why. Lots of false positives.
* TypeScript is very limited in its ability to determine whether an array access is safe.
* Consider this classic C style iteration over an array

```ts
const length = array.length;
for (let i = 0; i < length; i ++) {
  const entry = array[i];
  ...
}
```

* TypeScript considers `entry` to be possibly `undefined`
* Even if TypeScript could handle that case, you run into more problems when the index is passed in via an argument to a function. There's no type that represents a natural number.
* For simple cases you can rewrite the iteration

```ts
for (const entry of array) {
  ...
}
```

* Or if you need the index too

```ts
for (const [i,entry] of array.entries()) {
  ...
}
```

* In more complex cases you need to decide between adding a runtime check

```ts
const entry = array[i];
if (entry !== undefined) {
  ...
}
```

* Or using the [non-null assertion operator]() to tell TypeScript it's all fine - there's no `null` or `undefined` values here.

```ts
const entry = array[i]!;
...
```

* On balance I think turning this option on is a good thing. I found and fixed a couple of potential bugs where an array access really could return `undefined`. I was able to rewrite simple iterations to avoid the array access. 
* Wasn't too painful adding assertion operators when there wasn't a better way of doing it. Effectively puts you back into the same place of blissful ignorance you had with the option off. At least you have the chance to think about it this way.

* Added `exactOptionalPropertyTypes: true`
* Makes code more verbose - added `| undefined` to so many properties ...
* Seemed to have a viral effect. Many of my React components can be customized by passing in your own sub-components. These sub-components need to implement an interface defined by a set of props, some of which are optional. Lots of knock on impact in higher level components and sample code.
* Realized that this was largely my fault. I'd got into a bad habit of defining sub-components with types written out by hand.

```ts
const Row = ({ index, isScrolling, style }: { index: number, isScrolling?: boolean, style: React.CSSProperties }) => (...)
```

* When the required interface changes `isScrolling` to `boolean | undefined`, TypeScript complains. Accident waiting to happen. What I should have done is use the type that I'm trying to comply with.

```ts
const Row = ({ index, isScrolling, style }: DisplayListItemProps) => (...)
```

* The code is simpler and I get intellisense that documents how the props should be used. If I'd written this in the first place the explicit `| undefined` would have had no impact.

* Your life gets harder if your dependencies don't support `exactOptionalPropertyTypes` too. I use the DOM `addEventListener` API which takes a map of options defined as optional properties, with no explicit `| undefined`. I construct the listener options from props passed into me. Except now I can't because I can't assign something that might be `undefined` to the listener options. 
* Original code

```ts
const opts = { capture, passive, once };
```

* Rewriting to construct opts so that only defined properties are added to the object
* Runtime impact

```ts
const opts = { 
  ...(capture !== undefined ? { capture } : {}), 
  ...(passive !== undefined ? { passive } : {}), 
  ...(once !== undefined ? { once } : {})
};
```

* Rewriting using [non-null assertion operator]() to tell TypeScript to ignore the possibility of `null` or `undefined`
* Less verbose, no runtime impact. 
* More scope for mistakes once you get into the habit of turning off typechecking

```ts
const opts = { 
  capture: capture!,
  passive: passive!,
  once: once!
};
```

# Storybook

* Storybook UI doesn't handle optional props with explicit `| undefined` well. Get documented as `union`, hiding the type the user is actually interested in.
* UI distinguishes between required and optional properties, so at the UI level the `| undefined` is noise.
* Luckily I've hacked Storybook to add custom processing of prop descriptions and defaults.
* Storybook's default parsing creates structured representations of types which makes it easy to spot unions that end with `undefined`

```ts
function isUnionUndefined(sbType: SBType): sbType is SBUnionType {
  if (sbType.name !== 'union')
    return false;

  const last = sbType.value.at(-1);
  return last !== undefined && last.name === 'other' && last.value === 'undefined';
}
```

* Updated the code to remove the `| undefined` and display the same way as previously.

* Lots of places where I define callback props using an embedded function type definition

```ts
  onScroll?: (offset: number, newScrollState: ScrollState) => void
```

* When I went through the code on autopilot adding `| undefined` I ended up with

```ts
  onScroll?: (offset: number, newScrollState: ScrollState) => void | undefined
```

* Which is a function that returns `void` or `undefined` not what I intended.

```ts
{
  onScroll?: ((offset: number, newScrollState: ScrollState) => void) | undefined
}
```

* This is correct but getting hard to parse by eye. Turns out Storybook also finds it hard. Ended up sticking it in it's `other` category and messing up the docs. 
* Added type aliases for the callbacks resulting in code like this.

```ts
export type VirtualListScrollHandler = (offset: number, newScrollState: ScrollState) => void;

{
  onScroll?: VirtualListScrollHandler | undefined;
}
```

* Which is easy to understand for human and Storybook. Also simplifies Storybook docs as no longer includes complete documentation of the callback parameters. You can look in the API documentation or use Intellisense when you need those. 
