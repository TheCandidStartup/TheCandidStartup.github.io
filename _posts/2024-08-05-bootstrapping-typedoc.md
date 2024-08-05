---
title: Bootstrapping TypeDoc
tags: frontend
thumbnail: /assets/images/frontend/typedoc-logo.png
---

[Last time]({% link _posts/2024-07-19-bootstrapping-api-extractor.md %}) I gave up on using [API Extractor](https://api-extractor.com/pages/setup/generating_docs/) to generate API Reference Documentation. API Extractor creates Markdown with embedded html tags as an intermediate format. It simply wasn't compatible with GitHub Pages hosted sites. 

Time to try one of the alternatives.

# TypeDoc

TypeDoc is an independent open source project. Like API Extractor, it generates API reference documentation for TypeScript projects. Unlike API Extractor, it operates directly on the TypeScript source code and outputs html for a fully functional static website. No need to insert it carefully into your build pipeline. No worries about finding a compatible Markdown publishing pipeline. 

TypeDoc is [highly configurable](https://typedoc.org/options/) and supports an ecosystem of [plugins](https://typedoc.org/guides/plugins/) and [themes](https://typedoc.org/guides/themes/).

# Installation

[Installation](https://typedoc.org/guides/installation/) is straightforward. Reassuringly, and unlike API Extractor, it already formally supports the latest TypeScript 5.5.

```
% npm install typedoc -D

added 12 packages, and audited 1027 packages in 3s
```

It appears to be less heavyweight than API Extractor. Let's check that it installed OK. 

```
% npx typedoc --version

TypeDoc 0.26.4
Using TypeScript 5.5.2 from /Users/tim/GitHub/infinisheet/node_modules/typescript/lib
```

Another good sign. It uses the installed TypeScript rather than bundling its own out of date copy.

# First Run

```
% npx typedoc --out temp src/index.ts 

[warning] Code block with language jsx will not be highlighted in comment
  for @candidstartup/react-virtual-scroll as it was not included in the 
  highlightLanguages option
[info] Documentation generated at ./temp
[warning] Found 0 errors and 1 warnings
```

That's an unusually helpful error message. It explains what the problem is and points you towards a solution. Except I don't have any jsx tagged code blocks in my TSDoc comments.

Let's have a look at what was generated.

{% include candid-image.html src="/assets/images/frontend/typedoc-index-defaults.png" alt="Published docs home page using TypeDoc defaults" %}

It's pulled in my `README.md` as the default top level home page. Which explains the jsx warning. My README does include a couple of jsx code examples.

Where did my package documentation go? It took me a while to work out the navigation structure. There are two top level pages both identified as "@candidstartup/react-virtual-scroll". 

There's a navigation tree on the left. It looks like we have the root page selected. We don't. If you click on the highlighted page you get this.

{% include candid-image.html src="/assets/images/frontend/typedoc-package-page.png" alt="Package Page using TypeDoc defaults" %}

There's my package documentation and the sort of generated categorized contents page I was expecting to see. You have to click the link in the top left corner to get back to the home page. 

On the plus side, everything is functional. No broken links or garbled markup. However, compared with API Extractor, there's much less detail on the content page. No type signatures or descriptions.

Let's see what an API item looks like. 

{% include candid-image.html src="/assets/images/frontend/typedoc-item-page.png" alt="Item Page using TypeDoc defaults" %}

Looking good. All my TSDoc comments are there. Everything is nicely cross-linked. There's a generated type hierarchy. Inherited properties are included so you can see everything on one page. A really nice touch is auto-generated links to the corresponding source code in GitHub.

# Monorepo Setup

TypeDoc has dedicated support for monorepos. You can configure it to generate documentation for each package and merge the results into a combined set of documentation. 

I created a top level `typedoc.jsonc` configuration file. 

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["packages/*"],
  "entryPointStrategy": "packages"
}
```

Then ran TypeDoc again at the top level. 

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

The behavior in packages mode is effectively to run TypeDoc recursively in each package. I don't have a config file per package, so it can't find the `src/index.ts` entry point inside my `react-virtual-scroll` package. 

The other warnings are because my repo README includes relative links to folders in the repo. These turn into links to GitHub in the generated docs. I'll deal with them later. 

I was ready to add yet another stub config file to each package when I noticed a comment in the [TypeDoc monorepo example](https://github.com/Gerrit0/typedoc-packages-example) about a new `packageOptions` setting. Hot off the presses in the latest v0.26 release. So new it hasn't made it into the documentation yet. The idea is that you put whatever per-package config setting you need under `packageOptions` rather than duplicating in each package.

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

This time it worked. However, the output wasn't quite what I expected. Here's what the top level homepage looks like now. 

{% include candid-image.html src="/assets/images/frontend/typedoc-packages-home.png" alt="Home page in packages mode with a single package" %}

It's pulled in my monorepo README rather than the package README. However, it's using the name of the first package rather than the name of the monorepo.

There's a `name` config option to set the name explicitly rather than let TypeDoc work it out. Maybe that will work.

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

Makes no difference. 

My monorepo is unusual in that so far it consists of a single package. Maybe there's a TypeDoc bug when "merging" documentation for a single package. Let's test that theory by creating a stub for a second package. I'm going to need a `react-spreadsheet` package [soon]({% link _posts/2024-07-29-infinisheet-architecture.md %}), so let's create that.

{% capture note %}
Reminder to self. Make sure you initialize the new workspace using `npm init -w packages/react-spreadsheet` rather than just creating a new directory and copying a few files in. If you don't, your Build CI workflow will fail because `package-lock.json` is missing entries for the new package. 
{% endcapture %}
{% include candid-note.html content=note %}

After running TypeDoc again I got this.

{% include candid-image.html src="/assets/images/frontend/typedoc-two-packages-home.png" alt="Home page in packages mode with two packages" %}

Much better. Now I have an explicit top level page for the monorepo as a whole that picks up the `name` option. The navigation hierarchy highlighting works properly and makes it clear that there are two separate pages.

Interestingly, the package page concatenates the `@packageDocumentation` TSDoc comment and the package README. I'll need to think about what I want to do here.

# Cross-Package Links

Now that I have two packages, I can test cross-package links. Links between packages use [TSDoc declaration references](https://tsdoc.org/pages/spec/overview/). Thankfully, TypeDoc has an understandable [description of the syntax](https://typedoc.org/guides/declaration-references/). 

Here's my test case.

```ts
/**
 * Placeholder Stub Package Documentation
 *
 * Link to {@link @candidstartup/react-virtual-scroll!VirtualList | VirtualList}
 * in {@link @candidstartup/react-virtual-scroll!}
 * @packageDocumentation
 */
 ```

Worryingly, the syntax TypeDoc uses is different from the [examples](https://tsdoc.org/pages/tags/link/) in the TSDoc documentation. TypeDoc uses `!` as a module/component separator, while TSDoc uses `#`. Maybe the TSDoc examples are still using the ["old" syntax](https://tsdoc.org/pages/spec/overview/)? Whatever, at least TypeDoc's syntax is clearly explained and actually works when I try it. 

Except when I rebuild the project I get failures in the TSDoc ESLint plugin. 

```
4:19   warning  tsdoc-reference-missing-hash: The declaration reference appears to contain a package name or import path, but it is missing the "#" delimiter  tsdoc/syntax
5:14   warning  tsdoc-reference-missing-hash: The declaration reference appears to contain a package name or import path, but it is missing the "#" delimiter  tsdoc/syntax
```

Even more annoyingly, the entire plugin appears as a single rule so I can't disable just the declaration reference checks. For now, I disabled the plugin.

The build gets further but then fails with the same error in API Extractor. It turns out that it's not just the TSDoc spec and examples that are out of date. The TSDoc parser is also still using the "old" declaration reference syntax. There's been [no progress](https://github.com/microsoft/tsdoc/issues/202) since 2019.

I can't blame TypeDoc. They're [trying to do the right thing](https://github.com/TypeStrong/typedoc/issues/2621) by using the "new" syntax.

At least API Extractor lets me disable individual warnings. I disabled the `tsdoc-reference-missing-hash` warning which allowed the build to succeed. It's clear that the TSDoc ESLint plugin and API Extractor are running the same checks using the same code. I uninstalled the ESLint plugin.

# Custom Tags

The most important API items (`VirtualGrid`, `VirtualList`) are listed last in the TypeDoc index and navigation bar. They're React components not random functions. They should be called out separately. 

TypeDoc supports a custom [`@group`](https://typedoc.org/tags/group/) tag to define your own groups in the index. I marked `VirtualList` and `VirtualGrid` with `@group Components`.

Of course, API Extractor reports an invalid tag error when I build the project. I needed to create a `tsdoc.json` configuration file to [tell the TSDoc parser about custom tags](https://api-extractor.com/pages/configs/tsdoc_json/).

TypeDoc comes with a `tsdoc.json` file which declares all its custom tags. However, you also need a separate declaration to say which tags you're using to shut the warning up.

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
  "extends": ["@microsoft/api-extractor/extends/tsdoc-base.json", "typedoc/tsdoc.json"],
  "supportForTags": {
    "@group": true
  }
}
```

I can put that in my packages directory and then use a stub config file in each per-package directory.

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
  "extends": ["../tsdoc.json"]
}
```

# Tweaking the Output

There are *lots* of configuration options to play with. Naturally, I tried a few out. 

I disabled inclusion of the package `README.md`. There's lots of stuff in there that isn't relevant to API docs. I'll rely on the package documentation TSDoc comment. 

You can explicitly specify how groups are ordered. I put "Components" first in the index. However, that doesn't effect the order of API items in the navigation side bar. Unless you configure the side bar so that groups appear as an additional layer of containers in the hierarchy. 

It took lots of trial and error to work out which options have to go in `packageOptions` and which at the top level. For example, `groupOrder` and `kindSortOrder` need to be in `packageOptions`, while `navigation` has to be at the top level.

You can also add additional clickable links to the navigation side bar and top bar to tie the documentation into your site's navigation hierarchy.

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "name": "InfiniSheet",
  "entryPoints": ["packages/*"],
  "entryPointStrategy": "packages",
  "packageOptions": {
    "entryPoints": ["src/index.ts"],
    "groupOrder": [ "Components", "Hooks" ],
    "kindSortOrder": [
      "Function",
      ...
    ],
    "readme": "none"
  },
  "navigation": {
    "includeGroups": true
  },
  "out": "temp",
  "navigationLinks": {
    "Posts": "https://thecandidstartup.org/blog/",
    "Topics": "https://thecandidstartup.org/topic-index.html",
    "About": "https://thecandidstartup.org/about.html",
    "Contact": "https://thecandidstartup.org/contact.html",
    "Now": "https://thecandidstartup.org/now.html",
  },
  "sidebarLinks": {
    "The Candid Startup": "https://thecandidstartup.org"
  },
  "highlightLanguages": [
    ...
    "jsx"
  ]
}
```

I think I can see how the generated documentation could fit in with the rest of [The Candid Startup]({{ '/' | absolute_url }}).

{% include candid-image.html src="/assets/images/frontend/typedoc-customized.png" alt="TypeDoc package page with customized content" %}

TypeDoc generates html so I can't use my Jekyll templates directly. However, TypeDoc does allow you to add a custom stylesheet so I'll be able to tweak the default look to align with the rest of the site. 

# Conclusion

TypeDoc looks like a winner. I'll need to investigate how to integrate it into my GitHub Pages based publishing pipeline. There will also need to be some tweaks to the site's information architecture. Which I'll be sure to tell you about next time. 

