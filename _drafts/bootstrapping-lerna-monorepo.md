---
title: Bootstrapping a Lerna Monorepo
tags: frontend spreadsheets
---

So far, all the front-end development work I've done has been in the [repo](https://github.com/TheCandidStartup/react-virtual-scroll-grid) I created when [bootstrapping vite]({% link _posts/2023-10-23-bootstrapping-vite.md %}). It's starting to feel a little restrictive. 

The repo is based on a template for a React app. I started adding my [virtual scrolling]({% link _posts/2024-01-29-modern-react-virtual-scroll-grid.md %}) components and now it's an uncomfortable mix of a React component library and a sample app. My [code coverage]({% link _posts/2024-03-18-vitest-code-coverage.md %}) metrics are distorted because it doesn't make sense to unit test a sample app. At some point the sample app will turn into a real [Spreadsheet]({% link _topics/spreadsheets.md %}) application, I'll want somewhere to run end to end tests, there'll be back-end components and more. 

I could create dedicated repos for each purpose but that would add a lot of overhead to my development process. I'd need to divide each update to the code base into multiple commits across the repos involved. Each repo would have its own set of dependent packages to manage. Any change to a component would need the owning package to be built before any consuming app sees the change. 

I'm really enjoying the Vite development experience where I see and resolve errors as I type in Visual Studio Code. I save the file and impacted unit tests automatically rerun while running apps reload themselves. No friction at all. Whatever I do to put in place more structure shouldn't compromise the development experience.

That's why I'm moving to a [monorepo](https://en.wikipedia.org/wiki/Monorepo).

# Monorepo

{% include candid-image.html src="/assets/images/frontend/monorepo.png" alt="Many Repos vs Monorepo" attrib="Erzhan Torokulov on [Medium](https://javascript.plainenglish.io/javascript-monorepo-with-lerna-5729d6242302)"%}

A monorepo is a version control strategy where multiple projects are stored in the same version control repository. Changes that span multiple projects can be managed using a single commit or PR. You can refactor across the entire codebase. You can share configuration and dependencies that are common across multiple projects.

Monorepos are a popular approach in the Javascript ecosystem. There's a [bewildering array of tooling](https://github.com/korfuri/awesome-monorepo) available to support a variety of approaches.  

# Workspaces

Monorepos used to be an exotic approach that depended on tooling that would work behind the back of whatever package manager you were using. Now all the major package managers (npm, yarn, pnpm) have their own first class support for *workspaces*. Workspaces were first introduced by Yarn and then copied by the other package managers. 

There's a two level structure. A top level `package.json` defines the workspaces used in the repo, and manages shared config and dependent packages. Each workspace is a subdirectory with it's own `package.json`.

Where possible, dependencies are shared between workspaces by *hoisting* them to the root level. Workspaces can be dependent on external packages or other workspaces. The package manager sets things up so that build tooling can resolve dependencies the same way regardless of which form they take. 

The package manager CLI typically allows you to run commands against the root, any specific workspace or all workspaces.

# Lerna

Great. So monorepo support is built into my package manager and I just need to turn it on. 

I could try and do it that way but there are still plenty of dedicated monorepo tools. All that's changed is that they're now built on top of package manager workspaces. They focus on providing higher level functionality. 

After my usual research approach (frantic Googling), I decided to give [Lerna](https://lerna.js.org/) a try. 

Lerna is one of the oldest and most popular monorepo tools. It has three features that seem like they should be valuable for me. 

## Minimal config production build

Lerna will run the npm build command (or any command I like) in each workspace. Which npm will also do for me. The difference is that Lerna uses the dependency information from each workspace's `package.json` to run the builds in the correct order. It can even parallelize the build where possible.

## Versioning

Lerna can [automatically update](https://github.com/lerna/lerna/tree/main/libs/commands/version#readme) the version of each package with semantic versioning based on the repo's commit history. If your commit messages use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) convention, Lerna can determine the appropriate version bump and generate `CHANGELOG.md` files. 

Lerna can also commit the changes it made, tag the commit and run lifecycle hooks.

## Publishing

Finally, Lerna will publish packages to the npm repository for you. It compares current package versions against those already published to work out which packages need to be updated. 

# Overall Approach

I'm going to create a new repo as the home for my monorepo, rather than trying to rebuild the existing repo in place. There's a few reasons. First, the monorepo has much wider scope, so needs a new name. I have lots of blog posts with links to the existing repo which I don't want to break. Second, this is all new to me and I'm likely to screw it up the first time I try it. Using a new repo means I can throw it away and start over if I get it wrong. 

I'm going to use a structure that I've seen in other monorepos I've looked at. All the top level workspace stuff at the root of the hierarchy. A `packages` subdirectory containg a subdirectory for each publishable package. An `apps` subdirectory set up the same way for apps. 

I'll populate that structure by cloning the content of the existing repo, moving everything related to the react components into `packages/react-virtual-scroll` and everything related to the sample app into `apps/virtual-scroll-samples`. Finally, I'll need to copy config files into both locations, adjust as needed, identify the common parts and hoist them up to the root. 

# What's in a name?

Which means that before I can get started I have to come up with a name. Which is famously one of the [two hardest things](https://martinfowler.com/bliki/TwoHardThings.html) in computer science. 

The monorepo will be home for everything related to my [Spreadsheet]({% link _topics/spreadsheets.md %}) project. So really, I need to come up with a name for that. I could just call it "Spreadsheet" but that's too generic. It may be my German heritage, but I tend to lean towards compound nouns when naming. No more than two words to keep it snappy. Which means some variation on "SomethingSheet". 

Given my recent focus on [large grids]({% link _posts/2024-04-22-modern-react-virtual-scroll-grid-8.md %}), my first though was "MegaSheet". Which isn't thinking big enough. The aim is to support billions of rows. How about "GigaSheet"?

Quick Google to see who's already using it. On dear. [GigaSheet](https://www.gigasheet.com/) is a Big Data Spreadsheet. I can't use that. Luckily, I've focused my project so that it's virtually impossible to be covered by an existing product. Unlike GigaSheet, mine's open source, serverless and self-deployed. I'm also aiming at billions of rows and millions of columns. GigaSheet is limited to at most [17,000 columns](https://gigasheet.freshdesk.com/support/solutions/articles/69000829140-troubleshooting-upload-errors).

I need another name that somehow captures all that. I've already ruled out "OpenServerlessGigaMegaSheet". In the end, I went with "InfiniSheet". 

[InfiniSheet](https://github.com/TheCandidStartup/infinisheet) has very few hits on Google and nothing in GitHub. The closest existing product is [InfiniSheets](http://infinisheets.com/), an educational product for generating math worksheets. No real conflict there.

# TypeScript

* TypeScript
  * [Project References](https://moonrepo.dev/docs/guides/javascript/typescript-project-refs) vs [Path Aliases](https://medium.com/@NiGhTTraX/how-to-set-up-a-typescript-monorepo-with-lerna-c6acda7d4559) vs [Internal Packages](https://turbo.build/blog/you-might-not-need-typescript-project-references)
  * Project References too heavyweight: lots of redundant metadata to keep in sync with package.json, need to compile dependent modules before you can use IDE tooling, want to be able to use Vite transpile on demand across packages
  * Internal packages only works for packages that you never intend to publish separately
  * I'm vain enough to think that someone will want to use some of what I'm creating
  * Paths seems like sweet spot for me
  * Does need you to structure tsconfig so that you can have separate overall config for dev (paths defined) vs build (use module resolution)

# Vite

* Vite
  * Split config between overall and per-project stuff
  * Vite runtime is only for browser apps
  * Dev experience for libraries is via Vitest unit tests and sample apps consuming library via Vite
  * In theory Can use Vite to do production build of libraries, need to try that out

# Getting Started

* Converting react-virtual-scroll-grid into a monorepo
  * First step is to convert existing repo into a monorepo with a single package and check everything still works
  * Created a new repo with a new name - infinisheet - to be used by my entire spreadsheet project
  * GigaSheet!
  * Followed Github [instructions](https://docs.github.com/en/repositories/creating-and-managing-repositories/duplicating-a-repository) to mirror existing repository into new one
  * Created `packages/react-virtual-scroll` subdir for my first package and used `git mv` to move everything from top level into package
  * Now `npx lerna init` in root dir to configure as monorepo
  * Doesn't do much: adds a `lerna.json` config file and root `package.json` which enables npm workspaces and adds lerna as a dev dependency.
  * Also installs Lerna and all dependent packages, including those needed by my react-virtual-scroll workspace. Total of 946 packages using 300MB of disk space. 
  * Now I understand comment in a blog from somebody who stopped using Lerna. Mostly due to uncertainty when maintainer changed a couple of years ago. Included throw away comment about how much smaller their package-lock.json file is now. Adding Lerna as a dev dependency has doubled the disk space used and added another 500 packages compared to my original `react-virtual-scroll-grid` repo. 
  * All seems to work
    * `npx lerna run build` at top level found and built my `react-virtual-scroll` workspace
    * `npm run test --workspace=react-virtual-scroll` ran my unit tests from top level
    * If I `cd` into the workspace I can run all my npm scripts as before, e.g. `npm run test`, `npm run build`, `npm run dev`
  * Now need to prepare for multiple workspaces
  * First put the typescript config setup in place with common config hoisted to top level, use of Paths to resolve source files across packages, and ability to build standalone packages that can be published
  
  ## Build standalone package

  * Vite provides [library mode](https://vitejs.dev/guide/build.html#library-mode) for this purpose
  * Not much detail on what all the options are for
  * Need to add `main.ts` that will act as entry point and export everything defined by the package
  * Uses `path` module which isn't in dev dependencies installed by Vite template
  * It's a commonly used Node package (Vite itself is built on Node)
  * Also need to install `@types/node` to resolve typescript errors for vite.config.ts
  * Default is to build both esm and umd versions of the package
  * UMD needs additional configuration. Decided to remove for now. I'm never going to use UMD or test that it works.
  * Pared down build config to essentials needed for esm
  * Build process spits out `dist/react-virtual-scroll.js` which ends with the expected exports. Good enough for now.

  ## Typescript Path Aliases

  * tsconfig.json and tsconfig.build.json at root and package level
  * Config at root, files to include at package level
  * IDE/tests vs prod build configuration
  * tsc -p tsconfig.build.json in build script

  ## Separate sample app

  * Use `git mv` to put all the sample code for `react-virtual-scroll` into `app/virtual-scroll-samples`
  * Copy over and tweak all the required configuration files
  * Does IDE tooling work?
  * Need to change imports to reference `@candidstartup/react-virtual-scroll`
  * Complains about missing exports from `dist/react-virtual-scroll.js`. It's picking up built module not using paths.
  * How does it know where to load source given `@candidstartup/react-virtual-scroll` ?
  * Turns out I needed to name my entry point `index.ts` rather than `main.ts`. Once I did that IDE immediately picked everything up and errors disappeared.
  * Tried running `npm run dev`. Vite starts up but there's a Javascript error in the console. Again, missing export from in `react-virtual-scroll.js`. 
  * Problem is that Vite does not use the tsconfig path aliases when it loads source code.
  * Fortunately there's a Vite plugin, `vite-tsconfig-paths` that does exactly that. Just needed to add as a dev dependency and include in `vite.config.ts`
  * Sample code runs as before and developer tools shows the source being loaded from `packages/react-virtual-scroll/src`
  
  ## Build monorepo

  * Back to top level and ran `npx lerna run build` again.
  * It first built `packages/react-virtual-scroll` and then tried to build `apps/virtual-scroll-samples`
  * Failed trying to import built package due to lack of type declarations
  * Will need to invest some time in figuring out what an npm package should ideally look like and then how to build it.
  * Next time
