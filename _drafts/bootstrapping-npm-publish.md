---
title: Bootstrapping NPM Publish
tags: frontend
---

I figured out [how to build]({% link _drafts/bootstrapping-npm-package-build.md %}) usable library packages. Now I just have to work out how to get them published. I want to make it as easy as possible for others to find and consume my packages. As with package build, I want the process to be lightweight and easy to maintain. With that in mind, [I chose Lerna]({% link _drafts/bootstrapping-lerna-monorepo.md %}) as my monorepo tool. Lerna has workflows that should help automate the process. 

# Public Repositories

* NPM is obvious public repo
* GitHub has an integrated package feature
* NPM is owned by GitHub, maybe I can publish via GitHub and it will be accessible via NPM?
* No - GitHub packages are their own world
* GitHub packages are scoped to the owning user or organization
* Needs extra configuration in your package manager for each user or organization you want to consume packages from
* NPM is the default location so zero config
* Wisdom of the internet says that GitHub only makes sense for private packages

# NPM Scopes

* May have noticed from last two posts that my sample app imports my `react-virtual-scroll` package from `"@candidstartup/react-virtual-scroll"`.
* The "@candidstartup" part is an npm scope. 
* Have choice of publishing unscoped or scoped packages
* Scope acts as a namespace. I can use whatever name I like within a scope without worrying about clashing with other packages.
* Also helps with Candid Startup brand identity.
* Unlike GitHub packages, there's no extra config to consume scoped packages. Just include the scope in the name when importing. 
* Scopes can help prevent [npm substitution attacks](https://github.blog/2021-02-12-avoiding-npm-substitution-attacks/) as no one else can publish to your scope

# Creating an NPM account

* Before going any further I wanted to create an npm account and secure my "candidstartup" scope
* Scopes follow the same naming rules as npm packages so no funny symbols or capital letters
* Scopes are tied to npm organizations so I need to create one of those first
* Create user account
* Create organization with same name as scope, with the user account as the owner

# Package Metadata

* What does a published package need to populate NPM UI?
* repository
* author
* description
* license: BSD-3-Clause
* readme
* homepage
* keywords
* changelog?
* engines?

# Conventional Commits

* More prep that I didn't know I needed
* It's customary to maintain a `CHANGELOG.md` in your repo that describes what has changed in each release of your package
* That's a pain to maintain. What if you didn't have to?

# Versioning

* Conventional Commits
* Generates overall change log for entire repo together with package specific ones filtered to contain just changes to that package
* ignoreChanges
* Initial version
* Default behavior is to use global version number applied to all packages. However, only packages with changes are updated.
* After adding a "feature"

```
% npx lerna version --conventional-commits
lerna notice cli v8.1.2
lerna info current version 0.0.1
lerna info Looking for changed packages since v0.0.1
lerna info ignoring diff in paths matching [ '**/src/test/**', '**/src/*.test.*' ]
lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"

Changes:
 - virtual-scroll-samples: 0.0.1 => 0.1.0 (private)
 - @candidstartup/react-virtual-scroll: 0.0.1 => 0.1.0

? Are you sure you want to create these versions? Yes
lerna info execute Skipping releases
lerna info git Pushing tags...
lerna success version finished
```

* Screen shot of react-virtual-scroll in GitHub showing updated files
* Screen shot of generated change log

# Publishing

* Head over to npmjs.com


 

