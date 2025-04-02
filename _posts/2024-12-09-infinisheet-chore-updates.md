---
title: >
  InfiniSheet: Chore Updates
tags: infinisheet typescript
thumbnail: /assets/images/frontend/npm-package.png
---

[Last time]({% link _posts/2024-12-02-react-virtual-scroll-state-harmful.md %}), I decided that I needed some additional tools for browser based automated testing. Before I can do that, I should really make sure all my existing dependencies are up to date.

That would normally warrant a throw-away opening paragraph before moving on to playing with the new tooling. Not this time. Welcome to my update week of hell. 

# Minor updates

I like to start with `npm update` to get all the compatible minor versions done. That way they're not cluttering up the `npm outdated` list of outstanding major upgrades. 

This is the first time I've had a problem. NPM reports `ERESOLVE could not resolve` errors for `typescript` and `@eslint/compat`. Both are direct `devDependencies` for InfiniSheet. Where a package is a direct dependency, npm seems to find the most recent version allowed and then complain if that's more recent than other dependencies support. 

I expected npm to find the most recent version allowed by all dependencies. Oh well, I'll have to do it manually, and constrain the versions I allow.

```
  "devDependencies": {
    "@eslint/compat": ">=1.1.0 <1.2",
    "typescript": ">=5.0.2 <5.7",
  }
```

Now `npm update` runs

```
npm update  
npm WARN deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm WARN deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.

added 37 packages, removed 16 packages, changed 126 packages, and audited 1060 packages in 29s

found 0 vulnerabilities
```

I've clearly fallen behind on my major updates. Let's see what else is pending.

```
% npm outdated
Package                    Current   Wanted   Latest
@eslint/compat               1.1.1    1.1.1    1.2.3
@rollup/plugin-typescript   11.1.6   11.1.6   12.1.1
@types/node                20.17.8  20.17.8  22.10.0 
@vitest/coverage-istanbul    1.6.0    1.6.0    2.1.6 
@vitest/coverage-v8          1.6.0    1.6.0    2.1.6 
@vitest/ui                   1.6.0    1.6.0    2.1.6
eslint                      8.57.1   8.57.1   9.15.0
eslint-plugin-react-hooks    4.6.2    4.6.2    5.0.0
jsdom                       24.1.3   24.1.3   25.0.1
rimraf                      5.0.10   5.0.10    6.0.1 
typedoc                    0.26.11  0.26.11   0.27.0
typescript                   5.6.3    5.6.3    5.7.2 
typescript-eslint           7.18.0   7.18.0   8.16.0
vite                        5.4.11   5.4.11    6.0.1
vite-tsconfig-paths          4.3.2    4.3.2    5.1.3 
vitest                       1.6.0    1.6.0    2.1.6 
```

# ESLint 9

Let's start with ESLint and get rid of those shouty deprecation warnings. 

ESLint 9 makes flat config files the default. Luckily we sorted that out when first [bootstrapping ESLint]({% link _posts/2024-07-15-bootstrapping-eslint.md %}). The `typescript-eslint` plugin adds support for ESLint 9 in 8.0.0, so we'll need to update that at the same time. I locked down `@eslint/compat` because it requires ESLint 9, so can remove that restriction. Finally, `eslint-plugin-react-hooks` adds support for ESLint 9 in 5.0.0, so we need to update that one too.

```json
  "devDependencies": {
    "@eslint/compat": "^1.1.0",
    "eslint": "^9.0.0",
    "eslint-plugin-react": "^7.34.3",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "typescript-eslint": "^8.0.0",
  }
```

```
% npm update

added 11 packages, removed 11 packages, changed 29 packages, and audited 1060 packages in 25s
```

ESLint 9 and the updated plugins have lots of changes to the default rule sets. However, I didn't run into any issues and linting ran clean.

## Typed Linting

The `typescript-eslint` plugin supports a new, easy to configure system for [typed linting](https://typescript-eslint.io/getting-started/typed-linting). Typed linting adds rules powered by TypeScript's type checking APIs. I needed to add a few lines to `eslint.config.mjs`, copied verbatim from the documentation.

```
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
```

When I ran linting again, I got an error from trying to lint config files with .ts extensions which aren't in scope for TypeScript.

```
react-virtual-scroll/vite.config.ts
  0:0  error  Parsing error: react-virtual-scroll/vite.config.ts was not found by
  the project service. Consider either including it in the tsconfig.json or including
  it in allowDefaultProject
```

I can't see much point in linting config files, so added them to the list of files to ignore. After that, it seems to work. ESLint runs and finds additional errors. Most of them are from the [`@typescript-eslint/unbound-method`](https://typescript-eslint.io/rules/unbound-method/) rule in clients of `useVirtualScroll`.

```
Avoid referencing unbound methods which may cause unintentional scoping of `this`.
If your function does not access `this`, you can annotate it with `this: void`, 
or consider using an arrow function instead
```

`useVirtualScroll` is a custom hook which returns an object containing a collection of values and utility functions.

```ts
export interface VirtualScrollState {
  ...
  onScroll(clientExtent: number, scrollExtent: number, scrollOffset: number): [number, ScrollState];
  doScrollTo(offset: number, clientExtent: number): number;
  getCurrentOffset(): number;
}
```

This looks like a class with methods to TypeScript, rather than the collection of standalone functions it's intended to be. To be fair, it would look like a class with methods to any human reading the code too.

The `useVirtualScroll` clients use destructuring to extract the values and functions from the object. That's a bad idea with a real instance-of-a-class object, because the `this` pointer gets lost. The solution is to add additional type annotations so that it's clear there's no use of `this`.

```ts
export interface VirtualScrollState {
  ...
  onScroll(this: void, clientExtent: number, scrollExtent: number, scrollOffset: number): [number, ScrollState];
  doScrollTo(this: void, offset: number, clientExtent: number): number;
  getCurrentOffset(this: void): number;
}
```

The only other problem found was from the [`@typescript-eslint/no-duplicate-type-constituents`](https://typescript-eslint.io/rules/no-duplicate-type-constituents) rule, where I'd declared a type in an overly verbose way as a misguided attempt to convey more meaning to human readers. I removed the duplication. 

# Vitest 2

Upgrading to Vitest 2 takes care of another four packages. Based on the [migration guide](https://vitest.dev/guide/migration.html), it looks like breaking changes only effect advanced configuration options that I'm not using.

```json
  "devDependencies": {
    "@vitest/coverage-istanbul": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "vitest": "^2.0.0"
  }
```

```
% npm update

added 10 packages, removed 30 packages, changed 21 packages, and audited 1040 packages in 23s
```

Unit tests all run successfully. However, the coverage report at the package level is pulling in unit test files for some reason, throwing off the coverage stats. Running at the workspace level fails completely with 100s of errors about `api-extractor-base.json`. 

It turns out there was a [change in Vite 2.1](https://vitest.dev/guide/workspace.html#defining-a-workspace) which means that a `vitest.workspace.ts` config with the standard pattern of `packages/*` now treats any files in the packages dir as Vitest config files. Previously files were ignored. No idea why that's not considered a breaking change.

I've put common package level config files for a variety of tools in the packages directory. Easy, I thought. Just change the pattern to exclude the config files.

There's no way to distinguish folders from files with a glob pattern. I need to find some feature of the naming that distinguishes them. All my config files have extensions, so I need a pattern that matches anything without an extension.

I can use `*.*` to match anything with an extension but there's no obvious way to negate that. A variety of Google searches fail to find anything resembling a reference manual for glob patterns.

I ended up looking at [unit tests](https://github.com/SuperchupuDev/tinyglobby/blob/main/test/index.test.ts) for the `tinyglobby` library that Vitest uses. That suggests that `!packages/*.*` should work. 

It appears to work when I try it, ignoring the config files and finding my two packages. Then all the unit tests blow up with errors on import statements. 

If I explicitly list the packages using `packages/react-spreadsheet` and `packages/react-virtual-scroll`, the same tests run successfully. After trying some more combinations, I found that listing both `packages/*` and `!packages/*.*` works. 

It doesn't fill me with confidence.

The Vitest workspace docs say that you can reference packages by their config files instead of their folders. That's what I went with in the end. Feels like it should be less prone to errors.

```ts
export default defineWorkspace([
  'packages/*/vite.config.ts'
])
```

Now that the workspace level unit tests run, I can see that the workspace level coverage report also includes the test files. Looking at my coverage config I can see why.

```ts
  coverage: {
    provider: 'istanbul',
    include: ['packages/*/src/**'],
    exclude: ['packages/*/src/test/**']
  }
```

I explicitly exclude some common source code containing test utilities but not the unit test source files. Somehow, Vitest 1.x was implicitly excluding them but Vitest 2 doesn't. Once I excluded them explicitly I got the coverage reports I was expecting.

```ts
  coverage: {
    provider: 'istanbul',
    include: ['packages/*/src/**'],
    exclude: ['packages/*/src/test/**','packages/*/src/*.test.*']
  }
```

# jsdom 25

May as well do this one next, while I'm looking at unit tests. It's marked as a major release but the breaking changes only apply to obscure non-default options that I don't use. 

```json
  "devDependencies": {
    "jsdom": "^25.0.0"
  }
```

```
% npm update

added 2 packages, removed 5 packages, changed 8 packages, and audited 1037 packages in 27s
```

Oh dear. Half my unit tests are failing with a JavaScript runtime error deep inside jsdom: "`TypeError: list.map is not a function`". 

I rolled the changes back to version 24. Tests are still failing. 

A few unrelated minor updates got applied when I ran `npm update` after editing `package.json`. I reverted `package-lock.json` to the previous version and used `npm ci` to get the installed state to match. Thankfully, the tests are working again.

I tried again but this time instead of updating `package.json` directly and running `npm update`, I did it properly, restricting the scope of changes to just `jsdom`.

```
% npm install -D jsdom@25

added 2 packages, removed 5 packages, changed 2 packages, and audited 1037 packages in 1s
```

This time the tests run fine. Let's try the minor updates again.

```
% npm update

changed 6 packages, and audited 1037 packages in 19s
```

And of course the unit tests are broken again. Trawling through `package-lock.json`, I see the following changes.
* `electron-to-chromium`  1.5.66 -> 1.5.67
* `nwsapi` 2.2.13 -> 2.2.14
* `ts-api-utils` 1.4.2 -> 1.4.3
* `nx` 20.1.3 -> 20.1.4

I reverted back, then updated them one at a time, running the unit tests after each one. They broke after updating `nwsapi`.

[`nwsapi`](https://github.com/dperini/nwsapi) is an engine that implements the CSS selectors API. Let's see what it's a dependency for. 

```
% npm ls nwsapi
root@ /Users/tim/GitHub/infinisheet
└─┬ jsdom@25.0.1
  └── nwsapi@2.2.14
```

Surprise, `nwsapi` is a dependency of `jsdom`. However, `jsdom` 25 only requires `nwsapi` 2.2.12 or later. It looks like this is a bad `nwsapi` update which I can safely roll back. I added `nwsapi` to my package.json and excluded the bad version.

```json
  "devDependencies": {
    "nwsapi": "^2.2.12 <2.2.14 || ^2.2.15"
  }
```

Then I tried `npm update` one more time. This time everything works.

A day later `nwsapi` 2.2.15 was released to fix the problem. The developer had added a new experimental feature behind a feature flag which they'd accidentally left turned on. I removed `nwsapi` from my package.json and updated. All fine.

# vite-tsconfig-paths 5

This Vite plugin is dropping support for CommonJS modules. Shouldn't effect me as all my stuff is ESM.

```
% npm install -D vite-tsconfig-paths@5 

changed 1 package, and audited 1037 packages in 2s
```

For a change, everything builds and runs OK.

# Rollup plugin-typescript 12

Looking at the [change log](https://github.com/rollup/plugins/blob/master/packages/typescript/CHANGELOG.md) and the [PR of the breaking change](https://github.com/rollup/plugins/pull/1728), this appears to be fixing a problem where TypeScript type declaration files could be output in the wrong place. It will be a breaking change for anyone relying on the incorrect behavior.

```
% npm install -D @rollup/plugin-typescript@12

changed 1 package, and audited 1037 packages in 1s
```

My build now fails with the error "`Path of Typescript compiler option 'declarationDir' must be located inside the same directory as the Rollup 'file' option`". Here's the relevant part of my Rollup config, which involved [quite a journey]({% link _posts/2024-05-13-bootstrapping-npm-package-build.md %}) to put together in the first place.

```js
export default [
  {
    input: "src/index.ts",
    external: isExternal,
    output: [
      {
        sourcemap: true,
        file: "dist/index.js",
        format: "es"
      },
    ],
    plugins: [
      typescript({ "declarationDir": "dist/types", tsconfig: "./tsconfig.build.json" })
    ],
  }
];
```

This is the first part of a two stage pipeline. It uses the `typescript` plugin to transpile and bundle the source code into `dist/index.js` with declaration files output to `dist/types`. The second stage, not shown, uses the `dts` plugin to read the declaration files in `dist/types` and bundle them into `dist/index.d.ts`.

I don't understand what the error is complaining about. The generated output goes into `dist/types`, which is located inside `dist`, which is the directory containing the Rollup file option, `dist/index.js`. 

In the end, I had to find the code that [outputs the error message](https://github.com/rollup/plugins/blob/92daef00b0da30de172868d4e0792c8686da0045/packages/typescript/src/options/validate.ts#L72) to understand the problem. The actual breaking change is not correcting where the output files go, it's [adding validation](https://github.com/rollup/plugins/pull/1728) to stop you putting output files where you want.

Ironically, I'm putting the files in the approved place, under the output directory. It's the validation code that's wrong. Even more ironically, the original validation in 12.0.0 would have worked. It was changed in 12.1.11 because it [breaks a different valid use case](https://github.com/rollup/plugins/pull/1783).

If you specify a Rollup output file, the latest validation code checks that the output file is inside every TypeScript directory option. This makes sense if you're using the `outDir` TypeScript option to specify the overall output dir, then writing individual output files into it. It makes no sense if you're using the `declarationDir` option, or a combination of directory options.

If you specify the overall Rollup output dir (and let Rollup choose the output file name), the validation works the other way round, and checks that every TypeScript directory option is inside the overall output dir.

With some fiddling around I was able to rewrite the config so that it does exactly the same thing as before while satisfying the validation checks.

```js
  {
    input: "src/index.ts",
    external: isExternal,
    output: [
      {
        sourcemap: true,
        dir: "dist",
        format: "es"
      },
    ],
    plugins: [
      typescript({ "declarationDir": "dist/types", tsconfig: "./tsconfig.build.json" })
    ],
  },
```

This feels like an anti-feature to me. All that effort putting in validation checks that instead of preventing the user from shooting themselves in the foot, takes the gun and does it for them.

# NodeJS 22

Seeing `@types/node` at version 22 in the list of outdated packages made me check the current version of NodeJS. [NodeJS 22.11.0](https://nodejs.org/en/blog/release/v22.11.0), released on October 29th 2024, marks the entry of the 22.x release line into "Active LTS". I try to support both the "Active LTS" and "Maintenance LTS" version of NodeJS. 

It's time to upgrade and switch my GitHub builds from Node 18 and 20 to Node 20 and 22. Locally, I'm still on the [first major version I installed]({% link _posts/2022-09-21-mac-local-blog-dev.md %}), Node 18. 

```
% node -v
v18.18.1
```

I'll need to upgrade that first and make sure everything works with Node 22. I use the [asdf version manager](https://asdf-vm.com/) for Node, which can query and install the latest available LTS version for me.

```
% asdf nodejs resolve lts --latest-available
18.20.3
```

That's weird. Maybe the check is hardcoded in some way and I need to update asdf first?

## Brew Update

I use [Homebrew](https://brew.sh/) to manage software on my Mac. Let's see how out of date everything is.

```
% brew outdated
Running `brew update --auto-update`...
==> Downloading https://ghcr.io/v2/homebrew/portable-ruby/portable-ruby/blobs/sha256:303bed4c7fc431a685db3c3c151d873740114adbdccd23762ea2d1e39ea78f47
######################################################################################################################################################################################### 100.0%
==> Pouring portable-ruby-3.3.6.arm64_big_sur.bottle.tar.gz
==> homebrew/core is old and unneeded, untapping to save space...
Untapping homebrew/core...
Untapped 3 commands and 7246 formulae (7,402 files, 801.5MB).
==> Auto-updated Homebrew!

You have 11 outdated formulae and 1 outdated cask installed.
==> Migrating cask git-credential-manager-core to git-credential-manager
Error: inreplace failed
/opt/homebrew/Caskroom/git-credential-manager/.metadata/2.0.785/20220914161131.951/Casks/git-credential-manager.rb:
  expected replacement of /\A\s*cask\s+"git\-credential\-manager\-core"/ with "cask \"git-credential-manager\""
asdf (0.10.2) < 0.14.1
autoconf (2.71) < 2.72
automake (1.16.5) < 1.17
ca-certificates (2022-07-19_1) < 2024-11-26
coreutils (9.1) < 9.5
gmp (6.2.1_1) < 6.3.0
libtool (2.4.7) < 2.5.4
openssl@1.1 (1.1.1q) < 1.1.1w
readline (8.1.2) < 8.2.13
tree (2.1.1_1) < 2.2.1
unixodbc (2.3.11) < 2.3.12
git-credential-manager (2.0.785) != 2.6.0
```

I was surprised that querying for outdated software would automatically upgrade Homebrew itself and try to migrate `git-credential-manager`, whatever that means. It looks like I haven't updated anything since setting up my Mac. I clearly need to upgrade.

## Brew Upgrade

Everything's gone so well so far. What's the worst that could happen?

```
% brew upgrade
==> Upgrading 11 outdated packages:
tree 2.1.1_1 -> 2.2.1
libtool 2.4.7 -> 2.5.4
coreutils 9.1 -> 9.5
gmp 6.2.1_1 -> 6.3.0
asdf 0.10.2 -> 0.14.1
readline 8.1.2 -> 8.2.13
unixodbc 2.3.11 -> 2.3.12
ca-certificates 2022-07-19_1 -> 2024-11-26
autoconf 2.71 -> 2.72
openssl@1.1 1.1.1q -> 1.1.1w
automake 1.16.5 -> 1.17

==> Upgrading ca-certificates
  2022-07-19_1 -> 2024-11-26 
==> Pouring ca-certificates--2024-11-26.all.bottle.tar.gz
==> Regenerating CA certificate bundle from keychain, this may take a while...
🍺  /opt/homebrew/Cellar/ca-certificates/2024-11-26: 4 files, 239.4KB
==> Running `brew cleanup ca-certificates`...
Removing: /opt/homebrew/Cellar/ca-certificates/2022-07-19_1... (3 files, 222.6KB)

==> Upgrading readline
  8.1.2 -> 8.2.13 
==> Pouring readline--8.2.13.arm64_sonoma.bottle.tar.gz
🍺  /opt/homebrew/Cellar/readline/8.2.13: 51 files, 1.7MB
==> Running `brew cleanup readline`...
Removing: /opt/homebrew/Cellar/readline/8.1.2... (48 files, 1.7MB)

==> Upgrading gmp
  6.2.1_1 -> 6.3.0 
==> Pouring gmp--6.3.0.arm64_sonoma.bottle.tar.gz
🍺  /opt/homebrew/Cellar/gmp/6.3.0: 22 files, 3.3MB
==> Running `brew cleanup gmp`...
Removing: /opt/homebrew/Cellar/gmp/6.2.1_1... (21 files, 3.2MB)

==> Upgrading coreutils
  9.1 -> 9.5 
==> Pouring coreutils--9.5.arm64_sonoma.bottle.1.tar.gz
🍺  /opt/homebrew/Cellar/coreutils/9.5: 477 files, 13.5MB
==> Running `brew cleanup coreutils`...
Removing: /opt/homebrew/Cellar/coreutils/9.1... (480 files, 13.3MB)

==> Upgrading autoconf
  2.71 -> 2.72 
==> Pouring autoconf--2.72.arm64_sonoma.bottle.1.tar.gz
🍺  /opt/homebrew/Cellar/autoconf/2.72: 72 files, 3.6MB
==> Running `brew cleanup autoconf`...
Removing: /opt/homebrew/Cellar/autoconf/2.71... (71 files, 3.2MB)

==> Upgrading automake
  1.16.5 -> 1.17 
==> Pouring automake--1.17.arm64_sonoma.bottle.tar.gz
🍺  /opt/homebrew/Cellar/automake/1.17: 134 files, 3.3MB
==> Running `brew cleanup automake`...
Removing: /opt/homebrew/Cellar/automake/1.16.5... (131 files, 3.5MB)

==> Upgrading libtool
  2.4.7 -> 2.5.4 
==> Pouring libtool--2.5.4.arm64_sonoma.bottle.tar.gz
🍺  /opt/homebrew/Cellar/libtool/2.5.4: 76 files, 4.0MB
==> Running `brew cleanup libtool`...
Removing: /opt/homebrew/Cellar/libtool/2.4.7... (75 files, 3.8MB)

==> Upgrading unixodbc
  2.3.11 -> 2.3.12 
==> Pouring unixodbc--2.3.12.arm64_sonoma.bottle.tar.gz
🍺  /opt/homebrew/Cellar/unixodbc/2.3.12: 48 files, 2.3MB
==> Running `brew cleanup unixodbc`...
Removing: /opt/homebrew/Cellar/unixodbc/2.3.11... (48 files, 2.3MB)

==> Upgrading asdf
  0.10.2 -> 0.14.1 
==> Installing dependencies for asdf: openssl@3
==> Installing asdf dependency: openssl@3
==> Pouring openssl@3--3.4.0.arm64_sonoma.bottle.tar.gz
🍺  /opt/homebrew/Cellar/openssl@3/3.4.0: 7,236 files, 33.4MB
==> Installing asdf
==> Pouring asdf--0.14.1.all.bottle.tar.gz
🍺  /opt/homebrew/Cellar/asdf/0.14.1: 193 files, 777.6KB
==> Running `brew cleanup asdf`...
Removing: /opt/homebrew/Cellar/asdf/0.10.2... (168 files, 717.0KB)

==> Upgrading tree
  2.1.1_1 -> 2.2.1 
==> Pouring tree--2.2.1.arm64_sonoma.bottle.tar.gz
🍺  /opt/homebrew/Cellar/tree/2.2.1: 9 files, 187.7KB

==> Running `brew cleanup tree`...
Removing: /opt/homebrew/Cellar/tree/2.1.1_1... (8 files, 177.2KB)
Removing: /Users/tim/Library/Caches/Homebrew/tree_bottle_manifest--2.1.1_1... (7.3KB)
Removing: /Users/tim/Library/Caches/Homebrew/tree--2.1.1_1... (59.2KB)

==> Upgrading 1 dependent of upgraded formulae:
openssl@1.1 1.1.1q -> 1.1.1w
Error: openssl@1.1 has been disabled because it is not supported upstream! It was disabled on 2024-10-24.
==> Checking for dependents of upgraded formulae...
==> No broken dependents found!

==> Upgrading 1 outdated package:
git-credential-manager 2.0.785 -> 2.6.0
==> Upgrading git-credential-manager-core
==> Running uninstall script /opt/homebrew/share/gcm-core/uninstall.sh
==> Purging files for version 2.6.0 of Cask git-credential-manager
Error: git-credential-manager: uninstall script /opt/homebrew/share/gcm-core/uninstall.sh does not exist.
```

The output is horribly verbose but it looks like it mostly worked. Although `git-credential-manager` goes wrong at the end again. Let's see what Homebrew thinks it's achieved.

```
% brew outdated
openssl@1.1 (1.1.1q) < 1.1.1w
git-credential-manager (2.0.785) != 2.6.0
```

As far as I can tell, the latest asdf uses openssl 3, which was installed. Homebrew didn't realize that it could uninstall openssl 1.1. It tried to upgrade it and failed because it's no longer supported but did identify that nothing is using it. I guess I can manually remove it?

## Git Credential Manager

Homebrew seems to be confused about `git-credential-manager-core` and `git-credential-manager`. `brew list` shows `git-credential-manager-core` is installed but `brew outdated` lists `git-credential-manager`, plus there's that failed "migration" from one to the other. 

Apparently [GCM replaced GCM core](https://github.blog/security/application-security/git-credential-manager-authentication-for-everyone/) in 2022, so it's probably my fault for not keeping up.

Let's try uninstalling and reinstalling

```
% brew uninstall git-credential-manager-core
Warning: Formula microsoft/git/git-credential-manager-core was renamed to homebrew/cask/git-credential-manager.
Warning: Cask microsoft/git/git-credential-manager-core was renamed to git-credential-manager.
==> Uninstalling Cask git-credential-manager-core
==> Running uninstall script /opt/homebrew/share/gcm-core/uninstall.sh
Error: uninstall script /opt/homebrew/share/gcm-core/uninstall.sh does not exist.

brew uninstall git-credential-manager     
==> Uninstalling Cask git-credential-manager-core
==> Running uninstall script /opt/homebrew/share/gcm-core/uninstall.sh
Error: uninstall script /opt/homebrew/share/gcm-core/uninstall.sh does not exist.
```

Seems to be completely screwed up. I do a few Google searches to find out how best to manually remove it.

```
rm -r /opt/homebrew/Caskroom/git-credential-manager-core
```

Now try again.

```
% brew install git-credential-manager
==> Installing Cask git-credential-manager
installer: Package name is Git Credential Manager
installer: Upgrading at base path /
installer: The upgrade was successful.
🍺  git-credential-manager was successfully installed!

==> `brew cleanup` has not been run in the last 30 days, running now...
==> Autoremoving 1 unneeded formula:
openssl@1.1
Uninstalling /opt/homebrew/Cellar/openssl@1.1/1.1.1q... (8,097 files, 18MB)
Removing: /Users/tim/Library/Caches/Homebrew/portable-ruby-3.1.4.arm64_big_sur.bottle.tar.gz... (12.4MB)
Pruned 0 symbolic links and 1 directories from /opt/homebrew
```

That seems to have worked, and removed openssl 1.1 for me too. Even better, Git still works.

## Installing Node 20 and 22 with asdf

All that and asdf still reports 18 as the latest LTS version. It does know about more recent versions, `asdf list all nodejs` shows that 22.11.0 is the most recent version of Node 22, which is the version that Node announced as the LTS version. I guess I can install that by hand. The nice thing with asdf is that you can have multiple versions of Node installed and switch instantly between them. If something goes wrong, it's trivial to switch back.

```
% asdf install nodejs 22.11.0
Trying to update node-build... ok
To follow progress, use 'tail -f /var/folders/36/wsv4ktt569d_fdzmgy_91vrc0000gn/T/node-build.20241202141149.14899.log' or pass --verbose
Downloading node-v22.11.0-darwin-arm64.tar.gz...
-> https://nodejs.org/dist/v22.11.0/node-v22.11.0-darwin-arm64.tar.gz
Installing node-v22.11.0-darwin-arm64...
Installed node-v22.11.0-darwin-arm64 to /Users/tim/.asdf/installs/nodejs/22.11.0

% node -v
v18.18.1

% asdf global nodejs 22.11.0
% node -v
v22.11.0
```

Everything appears to work but I get a warning from Node whenever I use Lerna, my monorepo build tool.

```
(node:18030) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
```

Diving deeper.

```
% node --trace-deprecation node_modules/.bin/lerna info
(node:19930) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
    at node:punycode:3:9
    at BuiltinModule.compileForInternalLoader (node:internal/bootstrap/realm:399:7)
    at BuiltinModule.compileForPublicLoader (node:internal/bootstrap/realm:338:10)
    at loadBuiltinModule (node:internal/modules/helpers:114:7)
    at Function._load (node:internal/modules/cjs/loader:1100:17)
    at TracingChannel.traceSync (node:diagnostics_channel:315:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:218:24)
    at Module.require (node:internal/modules/cjs/loader:1340:12)
    at require (node:internal/modules/helpers:141:16)
    at Object.<anonymous> (/Users/tim/GitHub/infinisheet/node_modules/node-fetch/node_modules/whatwg-url/lib/url-state-machine.js:2:18)
lerna notice cli v8.1.9
```

This is a [known issue](https://github.com/lerna/lerna/issues/4074) for Lerna. It seems like Lerna has lots of old dependencies which need to be brought up to date.

Let's use asdf to put the most recent version of Node 20 on (latest maintenance LTS) and give that a try.

```
% asdf install nodejs 20.18.1                          
Trying to update node-build... ok
To follow progress, use 'tail -f /var/folders/36/wsv4ktt569d_fdzmgy_91vrc0000gn/T/node-build.20241202160023.20348.log' or pass --verbose
Downloading node-v20.18.1-darwin-arm64.tar.gz...
-> https://nodejs.org/dist/v20.18.1/node-v20.18.1-darwin-arm64.tar.gz

WARNING: node-v20.18.1-darwin-arm64 is in LTS Maintenance mode and nearing its end of life.
It only receives *critical* security updates, *critical* bug fixes and documentation updates.

Installing node-v20.18.1-darwin-arm64...
Installed node-v20.18.1-darwin-arm64 to /Users/tim/.asdf/installs/nodejs/20.18.1

% asdf global nodejs 20.18.1                           
% npx lerna info
lerna notice cli v8.1.9
```

I can run with Node 20 locally for now so I don't have to look at the deprecation notice. Let's hope Lerna finds it easier to update its dependencies than I have. It's still safe for me to update my GitHub Build CI workflow to use Node 20 and 22.

## Node 22 Types

It should be fine to update to Node 22 TypeScript types.

```
% npm install -D @types/node@22

changed 2 packages, and audited 1037 packages in 1s
```

Nice, no issues for a change.

# rimraf 6

The breaking change is dropping support for Node 18. It should be safe to upgrade now.

```
 % npm install -D rimraf@6      

added 6 packages, changed 1 package, and audited 1043 packages in 1s
```
No issues here either.

# TypeDoc 0.27

TypeDoc 0.27 was released on November 27th 2024, with 0.27.1 following a day later. There's a [long list](https://github.com/TypeStrong/typedoc/blob/master/CHANGELOG.md) of new features and breaking changes. 

That's too close to the bleeding edge for me. I'm going to leave upgrading until next time. It's a little annoying as this is what's blocking the upgrade to TypeScript 5.7.

TypeScript 5.7 was released November 22nd 2024, so maybe it's a good thing that I'm not updating immediately.

# Vite 6

 Vite 6 was released on November 26th 2024, with 6.0.1 following a day later. It sounds like there's been a [significant rework](https://vite.dev/blog/announcing-vite6) of Vite internals. Also too close to the bleeding edge.

# Minor Updates 3

Let's check the final state we've ended up with.

```
% npm outdated
Package                      Current   Wanted   Latest
@eslint/js                    9.15.0   9.16.0   9.16.0
@vitest/coverage-istanbul      2.1.6    2.1.8    2.1.8
@vitest/coverage-v8            2.1.6    2.1.8    2.1.8
@vitest/ui                     2.1.6    2.1.8    2.1.8
eslint                        9.15.0   9.16.0   9.16.0 
eslint-plugin-react-refresh   0.4.14   0.4.16   0.4.16 
globals                      15.12.0  15.13.0  15.13.0
rollup                        4.27.4   4.28.0   4.28.0
typedoc                      0.26.11  0.26.11   0.27.2
typescript                     5.6.3    5.6.3    5.7.2 
vite                          5.4.11   5.4.11    6.0.2
vitest                         2.1.6    2.1.8    2.1.8 
```

We're already out of date. Another round of minor updates and try again.

```
% npm update

changed 27 packages, and audited 1043 packages in 49s

% npm outdated
Package     Current   Wanted  Latest
typedoc     0.26.11  0.26.11  0.27.2
typescript    5.6.3    5.6.3   5.7.2
vite         5.4.11   5.4.11   6.0.2
```

That's more like what I was expecting to see. TypeDoc and Vite have both had another bug fix release since I started updating. I'm feeling very comfortable with my decision to hold off for now.

# Next Time

Hopefully, I'll finally get round to [installing something new]({% link _posts/2024-12-16-bootstrapping-playwright.md %}).
