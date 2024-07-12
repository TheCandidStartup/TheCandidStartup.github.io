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
* Initially just created new directory and copied files in by hand. Must initialize new workspace in npm so `package-lock.json` contains the correct entries: `npm init -w packages/react-spreadsheet`.

{% include candid-image.html src="/assets/images/frontend/typedoc-two-packages-home.png" alt="Home page in packages mode with two packages" %}

* Much better. Now I get an explicit top level page for the monorepo as a whole that picks up the `name` option. The navigation hierarchy highlighting works properly and makes it clear that there are two separate pages.
* Interestingly, the package page concatenates the `@packageDocumentation` TSDoc comment and the package README. Will need to think about what I want to do here.
* Cross-package links work using [TSDoc declaration references](https://tsdoc.org/pages/spec/overview/). Thankfully, TypeDoc has an understandable [description of the syntax](https://typedoc.org/guides/declaration-references/). Interestingly, it's different from the [examples](https://tsdoc.org/pages/tags/link/) in the TypeDoc documentation. Maybe the TSDoc examples were still using "old" syntax? Whatever, at least it's clearly explained and actually works. 

# Tweaking the Output

* Lots of config options
* Disabled inclusion of package README.md. Lots of stuff not relevant to API docs. Will rely on package documentation.
* Most important API items (`VirtualGrid`, `VirtualList`) are listed last in index and navigation bar. They're React components not obscure functions. 
* Can use custom `@group` tag to define your own groups in the index. Mark `VirtualList` and `VirtualGrid` as Components rather than Functions. 
* API Extractor reports invalid tag when I use them. Need a `tsdoc.json` configuration file to [tell TSDoc parser about custom tags](https://api-extractor.com/pages/configs/tsdoc_json/).
* TypeDoc comes with a `tsdoc.json` file which declares all it's custom tags. However, annoyingly, you also need a separate declaration to say which tags you're using to shut the warning up.

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
  "extends": ["@microsoft/api-extractor/extends/tsdoc-base.json", "typedoc/tsdoc.json"],
  "supportForTags": {
    "@group": true
  }
}
```

* Put this in my packages directory and then need another stub config file in each package folder

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
  "extends": ["../tsdoc.json"]
}
```

* Can explicitly specify how groups are ordered, putting Components first in the index. However, doesn't effect order in Navigation side bar.
* Unless configure navigation so that groups become an extra nesting layer in the hierarchy ...
* Lots of trial and error to work out which options have to go in `packageOptions` and which at top level
* `groupOrder` and `kindSortOrder` need to be in `packageOptions`, but `navigation` has to be at top level.
* Can add additional clickable links to the navigation side bar and top bar to tie output into your site's navigation hierarchy

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

* Can see logically how it will fit in with the rest of this site

{% include candid-image.html src="/assets/images/frontend/typedoc-customized.png" alt="TypeDoc package page with customized content" %}

* html output so can't use my Jekyll templates directly. However, TypeDoc does allow you to add a custom stylesheet so I'll be able to tweak the default look to align with the rest of the site. 
* Before spending hours tweaking the stylesheet I need to make sure I can publish to GitHub pages

# Publishing

* Should be able to publish the classic way by checking the generated HTML into GitHub, then using the standard GitHub pages setup to publish. The output even includes a `.nojekyll` file so GitHub knows to use use the html as is rather than running it through Jekyll. 
* Want to avoid having to check in generated documentation. Extra manual step and clutters up repo.
* GitHub Pages uses GitHub Actions to publish. You can write your own publishing workflow using the same building blocks that GitHub Pages uses.
  * [upload-pages-artifact](https://github.com/actions/upload-pages-artifact): Creates an artifact ZIP of the directory you want to publish
  * [deploy-pages](https://github.com/actions/deploy-pages): Deploys an artifact ZIP to GitHub Pages
* I copied my NPM Publish workflow and modified it to come up with this.

```
name: Docs

on:
  workflow_dispatch:
  workflow_run:
    workflows: [Build CI]
    types: [completed]

jobs:
  build:
    if: |
        github.event_name == 'workflow_dispatch' ||
        ( github.event.workflow_run.conclusion == 'success' &&
          github.event.workflow_run.event == 'push' &&
          github.event.workflow_run.head_branch == 'main' &&
          contains(github.event.workflow_run.head_commit.message, 'chore(release)'))
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.X
          registry-url: https://registry.npmjs.org/
      - run: npm ci
      - run: npx typedoc
      - uses: actions/upload-pages-artifact@v3
        with:
          path: "temp/"

  publish:
    needs: build
    permissions:
      pages: write      # to deploy to Pages
      id-token: write   # to verify the deployment originates from an appropriate source
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

* The `deploy-pages` documentation recommends running it in a separate job, so I did. With the requirement to upload the content as an artifact, there's nothing stopping you running the two stages as separate jobs. I can see how this might be more reliable?

* Triggered a run manually. Build went find. Publish resulted in this.

```
Run actions/deploy-pages@v4
Fetching artifact metadata for "github-pages" in this workflow run
Found 1 artifact(s)
Creating Pages deployment with payload:
{
	"artifact_id": 1694669341,
	"pages_build_version": "2908bdcfcfd9eab618209be2108bc5059da34a9e",
	"oidc_token": "***"
}
Error: Creating Pages deployment failed
Error: HttpError: Not Found
    at /home/runner/work/_actions/actions/deploy-pages/v4/node_modules/@octokit/request/dist-node/index.js:124:1
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at createPagesDeployment (/home/runner/work/_actions/actions/deploy-pages/v4/src/internal/api-client.js:125:1)
    at Deployment.create (/home/runner/work/_actions/actions/deploy-pages/v4/src/internal/deployment.js:74:1)
    at main (/home/runner/work/_actions/actions/deploy-pages/v4/src/index.js:30:1)
Error: Error: Failed to create deployment (status: 404) with build version 2908bdcfcfd9eab618209be2108bc5059da34a9e. Request ID 2BC1:22C3E:4BBB537:8CCB6B2:66910182 Ensure GitHub Pages has been enabled: https://github.com/TheCandidStartup/infinisheet/settings/pages
```

* I'm so glad there was a meaningful error message at the end. Doh. Remember to enable GitHub Pages before trying to deploy it. Pick "GitHub Actions" as the source.

{% include candid-image.html src="/assets/images/github/pages-action-source.png" alt="GitHub Pages Settings configured to use GitHub Actions" %}

* When you first enable "GitHub Actions" as the source you will be encouraged to configure a workflow from a template. Ignore this if, like me, you've already created your own workflow. There's no extra step needed to connect GitHub pages to a specific workflow. Once enabled, any workflow can publish. Once a workflow has published, the UI changes to show the details seen here.
* When you have a pages site at the organization level with a custom domain, any project sites automatically use the same custom domain. Which is how I ended up with the Docs published to [https://thecandidstartup.org/infinisheet](https://thecandidstartup.org/infinisheet).
