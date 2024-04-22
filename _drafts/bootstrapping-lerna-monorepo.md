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
  * Project References vs Paths vs Internal Packages
  * Project References too heavyweight: lots of redundant metadata to keep in sync with package.json, need to compile dependent modules before you can use IDE tooling, want to be able to use Vite transpile on demand across packages
  * Internal packages seems hacky and needs 