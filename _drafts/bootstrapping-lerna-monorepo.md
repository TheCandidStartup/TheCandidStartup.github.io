---
title: Bootstrapping a Lerna Monorepo
tags: frontend
---

Wise words

* Currently working in a standard repo that builds a web app
* Contains React virtual scrolling components that should be part of a library
* Unit tests for the components
* Simple test app for the components
* Problems
  * Code coverage metrics include both components (covered by unit tests) and test app (not)
  * Need multiple test apps for different purposes. Currently hacking them together, using and throwing away
  * As I continue with spreadsheet project will need spreadsheet oriented components (another library), front end app, back end components, back end apps
* Traditional way of handling this would be a separate repo for each project
* Adds lots of overhead
  * Each repo is isolated from source control point of view - need separate commits and PRs
  * Each repo has its own dependent packages to manage
  * Need to build and version dependent libraries than use in apps
  * Makes sense if you predominantly work in one repo at a time, e.g. dedicated team per repo
* Alternative is the monorepo
  * Makes sense when one team owns multiple libraries and apps, working across them
  * One repo, multiple projects
  * Can have single commit/PR that touches multiple projects
  * Can share configuration and dependencies common across all projects
* Bewildering array of tooling and approaches
* Package manager workspaces
  * Originally had dedicated monorepo tools that went behind package managers back to manage development of multiple packages in one repo
  * Now all major package managers (npm, yarn, pnpm) have their own dedicated support for workspaces
  * Two level structure
  * Top level `package.json` defines workspaces used in the repo plus shared config
  * Each workspace is a subdirectory with it's own `package.json`
  * Dependencies are shared (where possible) between workspaces
  * CLI can run command against root, specific workspace or all workspaces
* Monorepo tools
  * Now built on top of package manager workspaces
  * Provide higher level tools
* Lerna
  * One of the oldest and most popular tools
  * Easy to get started with enough flexibility to work with any repo structure
  * Latest version removes all the old legacy workspace emulation now provided by package managers
  * Focus on making build, version and publish workflow really simple
    * Build uses package dependencies to determine build order and parallelizes where possible
    * Auto-version packages with semantic versioning based on commit history, updating changelog, creating GitHub releases and tags
    * Publish built and versioned packages to npm
* Approach
  * Create a new repo
  * Setup basic structure
  * Fork files from existing repo into structure
  * Hoist common config and dependencies
* TypeScript
  * [Project References](https://moonrepo.dev/docs/guides/javascript/typescript-project-refs) vs [Path Aliases](https://medium.com/@NiGhTTraX/how-to-set-up-a-typescript-monorepo-with-lerna-c6acda7d4559) vs [Internal Packages](https://turbo.build/blog/you-might-not-need-typescript-project-references)
  * Project References too heavyweight: lots of redundant metadata to keep in sync with package.json, need to compile dependent modules before you can use IDE tooling, want to be able to use Vite transpile on demand across packages
  * Internal packages only works for packages that you never intend to publish separately
  * I'm vain enough to think that someone will want to use some of what I'm creating
  * Paths seems like sweet spot for me
  * Does need you to structure tsconfig so that you can have separate overall config for dev (paths defined) vs build (use module resolution)
* Vite
  * Split config between overall and per-project stuff
  * Vite runtime is only for browser apps
  * Dev experience for libraries is via Vitest unit tests and sample apps consuming library via Vite
  * In theory Can use Vite to do production build of libraries, need to try that out
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
  * Need to add main.ts that will act as entry point and export everything defined by the package
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
  