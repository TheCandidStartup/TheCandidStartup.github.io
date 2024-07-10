---
title: Bootstrapping TypeDoc
tags: frontend
---

wise words

# TypeDoc

# Installation

* https://typedoc.org/guides/installation/

```
% npm install typedoc -D

added 12 packages, and audited 1027 packages in 3s
```

* Not as heavyweight as API extractor

```
% npx typedoc --version

TypeDoc 0.26.4
Using TypeScript 5.5.2 from /Users/tim/GitHub/infinisheet/node_modules/typescript/lib
```

* Another good sign. Using installed TypeScript rather than bundling its own out of date version.

# First Run

```
% npx typedoc --out temp src/index.ts 

[warning] Code block with language jsx will not be highlighted in comment for @candidstartup/react-virtual-scroll as it was not included in the highlightLanguages option
[info] Documentation generated at ./temp
[warning] Found 0 errors and 1 warnings
```

* Helpful error message. Except I don't have any jsx tagged code blocks in my TSDoc comments
* Let's have a look at what was generated

{% include candid-image.html src="/assets/images/frontend/typedoc-index-defaults.png" alt="Published docs home page using TypeDoc defaults" %}

* Nice touch. It's pulled my `README.md` in as the default top level home page
* Which explains the jsx warning. My README does include a couple of jsx code examples.
* Where did my package documentation go? Took me a while to work out the navigation structure.
* There are two top level pages both identified as "@candidstartup/react-virtual-scroll".
* There's a navigation tree on the left. It looks like we have the root page selected. We don't. If you click on the highlighted page you get.

{% include candid-image.html src="/assets/images/frontend/typedoc-package-page.png" alt="Package Page using TypeDoc defaults" %}

* There's my package documentation and the sort of generated categorized contents page I was expecting to see.
* You have to click the link in the top left corner to get back to the home page. 
* Everything is functional. No broken links or garbled markup.
* Compared with API Extractor, there's much less detail on the content page. No type signatures or descriptions.

{% include candid-image.html src="/assets/images/frontend/typedoc-item-page.png" alt="Item Page using TypeDoc defaults" %}

* All my document comments are there once you look at individual items
* Everything is nicely cross-linked
* There's a generated type hierarchy
* Inherited properties are included so you can see everything on one page
* A really nice touch is auto-generated links to the corresponding source code in GitHub.

# Monorepo Setup

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["packages/*"],
  "entryPointStrategy": "packages"
}
```

```
% npx typedoc
[info] Converting project at ./packages/react-virtual-scroll
[warning] No entry points were provided, this is likely a misconfiguration
[info] Merging converted projects

./README.md:19:25 - [warning] The relative path ./packages/react-virtual-scroll is not a file and will not be copied to the output directory
19    * [react-virtual-scroll](./packages/react-virtual-scroll): Modern React components for lists and grids that scale to trillions of rows and columns

./README.md:23:27 - [warning] The relative path ./apps/virtual-scroll-samples is not a file and will not be copied to the output directory
23    * [virtual-scroll-samples](./apps/virtual-scroll-samples): Test app for react-virtual-scroll package
```

* Behavior for packages mode is effectively to run typedoc recursively in each package, then merge all the results together. I don't have a config file per package, so can't find `src/index.ts` entry point. 
* The other warnings are because my repo README includes links to other Markdown files in the repo. These turn into links to GitHub in the generated docs.
* All ready to add yet another stub config file when I noticed a comment in the [TypeDoc Monorepo Example](https://github.com/Gerrit0/typedoc-packages-example) about a new `packageOptions` setting. Hot off the presses in the latest v0.26 release. So new it hasn't made it into the documentation yet. The idea is that you put whatever per-package config setting you need under here rather than duplicating in each package.

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["packages/*"],
  "entryPointStrategy": "packages",
    "packageOptions": {
    "entryPoints": ["src/index.ts"]
  },
}
```

* This time it worked. However, the output wasn't quite what I expected. Here's what the top level homepage looks like now. 

{% include candid-image.html src="/assets/images/frontend/typedoc-packages-home.png" alt="Home page in packages mode with a single package" %}

* It's showing my repo README rather than the package repo. However, it's using the name of the first package rather than the name of the monorepo.
* There's a `name` config option to set the name explicitly rather than let TypeDoc work it out. 

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "name": "InfiniSheet",
  "entryPoints": ["packages/*"],
  "entryPointStrategy": "packages",
    "packageOptions": {
    "entryPoints": ["src/index.ts"]
  },
}
```

* Makes no difference. My monorepo is unusual in that so far it consists of a single package. Maybe there's a TypeDoc bug when "merging" documentation for a single package.
* I created a stub for a second package and ran it again.

{% include candid-image.html src="/assets/images/frontend/typedoc-two-packages-home.png" alt="Home page in packages mode with two packages" %}

* Much better. Now I get an explicit top level page for the monorepo as a whole that picks up the `name` option. The navigation hierarchy highlighting works properly and makes it clear that there are two separate pages.
* Interestingly, the package page concatenates the `@packageDocumentation` TSDoc comment and the package README. Will need to think about what I want to do here.
