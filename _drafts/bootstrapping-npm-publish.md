---
title: Bootstrapping NPM Publish
tags: frontend
---

I figured out [how to build]({% link _drafts/bootstrapping-npm-package-build.md %}) usable library packages. Now I just have to work out how to get them published. I want to make it as easy as possible for others to find and consume my packages. 

{% include candid-image.html src="/assets/images/frontend/npm-react-virtual-scroll-thumbnail.png" alt="react-virtual-scroll published on NPM" %}

As with package build, I want the process to be lightweight and easy to maintain. With that in mind, [I chose Lerna]({% link _posts/2024-05-06-bootstrapping-lerna-monorepo.md %}) as my monorepo tool. Lerna has workflows that should help automate the process. 

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
* bugs
* author
* description
* license: BSD-3-Clause
* readme
* homepage
* keywords
* publishConfig.access
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
* Don't create "version" script in top level package.json to run lerna version for you. Version is name of predefined lifecycle script that lerna version will run for you for potentially infinite recursion fun (luckily errored out second time through)

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

```
% npm run lerna-publish

> lerna-publish
> npx lerna publish from-git

lerna notice cli v8.1.2

Found 1 package to publish:
 - @candidstartup/react-virtual-scroll => 0.1.1

? Are you sure you want to publish these packages? Yes
lerna info publish Publishing packages to npm...
lerna WARN notice Package failed to publish: @candidstartup/react-virtual-scroll
lerna ERR! E404 Not found
lerna ERR! errno "undefined" is not a valid exit code - exiting with code 1
```

* Unhelpful error message because I hadn't run `npm login` on the command line first
* Redirected to web where I entered username, password and Google authenticator OTP

```
% npm run lerna-publish

> lerna-publish
> npx lerna publish from-git

lerna notice cli v8.1.2

Found 1 package to publish:
 - @candidstartup/react-virtual-scroll => 0.1.1

? Are you sure you want to publish these packages? Yes
lerna info publish Publishing packages to npm...
? This operation requires a one-time password: ******
lerna success published @candidstartup/react-virtual-scroll 0.1.1
lerna notice 
lerna notice 📦  @candidstartup/react-virtual-scroll@0.1.1
lerna notice === Tarball Contents === 
lerna notice 1.5kB  LICENSE          
lerna notice 18.8kB dist/index.js    
lerna notice 1.5kB  package.json     
lerna notice 38.2kB dist/index.js.map
lerna notice 2.8kB  README.md        
lerna notice 2.9kB  dist/index.d.ts  
lerna notice === Tarball Details === 
lerna notice name:          @candidstartup/react-virtual-scroll         
lerna notice version:       0.1.1                                       
lerna notice filename:      candidstartup-react-virtual-scroll-0.1.1.tgz
lerna notice package size:  14.4 kB                                     
lerna notice unpacked size: 65.7 kB                                     
lerna notice shasum:        6cd84089f7b724d8c1d61f1b9ae910a3679f493e    
lerna notice integrity:     sha512-0zuqSwVhFtb8D[...]8YvmraVskjPqw==    
lerna notice total files:   6                                           
lerna notice 
Successfully published:
 - @candidstartup/react-virtual-scroll@0.1.1
lerna success published 1 package
```

* Annoyingly if you have two factor auth on, npm requires the OTP on each publish
* If that gets too annoying I can look at setting up an authentication token for fully automated publish

{% include candid-image.html src="/assets/images/frontend/npm-react-virtual-scroll.png" alt="react-virtual-scroll published on NPM" %}

* Lots of tools that let you try out or test quality of npm packages

{% include candid-image.html src="/assets/images/frontend/are-types-wrong-react-virtual-scroll.png" alt="Checking react-virtual-scroll types" %}

