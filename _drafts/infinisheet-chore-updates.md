---
title: >
  InfiniSheet: Chore Updates
tags: infinisheet
---

wise words

# Minor updates

* Get everything updated before trying to install new tools
* Like to start with `npm update` to get all the compatible minor versions done
* First time I've had a problem - reports `ERESOLVE could not resolve` errors
* Where package is a direct dependency, npm seems to find the most recent version allowed and then complain if that's more recent that other dependencies support
* I would have expected it to find the most recent version allowed by all
* To get through the minor updates I constrained versions of two direct dependencies to highest commonly supported

```json
  "devDependencies": {
    "@eslint/compat": ">=1.1.0 <1.2",
    "typescript": ">=5.0.2 <5.7",
  }
```

* Now `npm update` runs

```
npm update  
npm WARN deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm WARN deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.

added 37 packages, removed 16 packages, changed 126 packages, and audited 1060 packages in 29s

found 0 vulnerabilities
```

* I've clearly fallen behind on my major updates. Let's see what else is pending.

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

* Start with ESLint. Let's get rid of those shouty deprecation warnings
* ESLint 9 makes flat config files the default. Luckily we sorted that out when first bootstrapping use of ESLint.
* `typescript-eslint` adds support for ESLint 9 in 8.0.0 so we'll need to update that at the same time
* I locked down @eslint/compat because it requires ESLint 9, can remove that restriction.
* `eslint-plugin-react-hooks` adds support for ESLint 9 in 5.0.0 so we need to update that one too

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

* ESLint 9 and corresponding plugins have lots of changes to the default rule sets
* I didn't run into any issues, linting ran clean.

## Typed Linting

* `typescript-eslint` 8 supports [typed linting](https://typescript-eslint.io/getting-started/typed-linting) which adds rules powered by TypeScript's type checking APIs
* Needs some additional lines in `eslint.config.mjs`, copied verbatim from the documentation

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

* Got an error because of trying to lint config files with .ts extensions which aren't in scope for TypeScript.

```
react-virtual-scroll/vite.config.ts
  0:0  error  Parsing error: react-virtual-scroll/vite.config.ts was not found by the project service. Consider either including it in the tsconfig.json or including it in allowDefaultProject
```

* Can't see any point in linting config files so added them to the list to ignore.
* After that, seems to work. ESLint runs and finds additional errors.
* Lots of [`@typescript-eslint/unbound-method`](https://typescript-eslint.io/rules/unbound-method/) in clients of `useVirtualScroll`

```
Avoid referencing unbound methods which may cause unintentional scoping of `this`.
If your function does not access `this`, you can annotate it with `this: void`, or consider using an arrow function instead
```

* `useVirtualScroll` is a custom hook which returns an object containing a collection of values and utility functions.

```ts
export interface VirtualScrollState {
  ...
  onScroll(clientExtent: number, scrollExtent: number, scrollOffset: number): [number, ScrollState];
  doScrollTo(offset: number, clientExtent: number): number;
  getCurrentOffset(): number;
}
```

* This looks like a class with methods to TypeScript rather than the collection of standalone functions it's intended to be
* The clients destructure the object and call the functions. That's a bad idea with the a real object, because the this point gets lost.
* Solution was to add type annotations so that it's clear there's no use of this

```ts
export interface VirtualScrollState {
  ...
  onScroll(this: void, clientExtent: number, scrollExtent: number, scrollOffset: number): [number, ScrollState];
  doScrollTo(this: void, offset: number, clientExtent: number): number;
  getCurrentOffset(this: void): number;
}
```

*  The only other problem found was a [`@typescript-eslint/no-duplicate-type-constituents`](https://typescript-eslint.io/rules/no-duplicate-type-constituents) where I'd declared a type in an overly verbose way as a misguided attempt to convey more meaning to human readers. I removed the duplication. 

# Vitest 2

* Looks like breaking changes only effect advanced configuration options that I'm not using

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

* Unit tests all run successfully
* Coverage report at package level is pulling in unit test files for some reason, throwing off coverage stats
* Running at the workspace level fails completely with 100s of errors about `api-extractor-base.json`. 
* There was a [change in Vite 2.1](https://vitest.dev/guide/workspace.html#defining-a-workspace) which means that a `vitest.workspace.ts` config with the standard pattern of `packages/*` now treats any files in the packages dir as Vitest config files. 
* I put common config files for other tools in there.
* Easy, I thought. Just change the pattern to exclude the config files
* No way to distinguish folders from files with a glob pattern
* All my config files have extensions. Want anything without an extension
* Can use `*.*` for anything with an extension but no obvious way to say anything without
* Can't find any detailed reference documentation for globs anywhere
* Ended up looking at [unit tests](https://github.com/SuperchupuDev/tinyglobby/blob/main/test/index.test.ts) for the `tinyglobby` library that vitest uses
* Suggests that `!packages/*.*` should work
* It appears to work, ignoring the config files and finding my two packages. Then all the unit tests blow up, failing to import anything.
* If I explicitly list the packages using `packages/react-spreadsheet` and `packages/react-virtual-scroll` the same tests run successfully.
* Weirdly listing both `packages/*` and `!packages/*.*` does work
* The vitest docs say that you can reference packages by their config files instead of their folders and that's what I went with in the end. Seems less prone to errors.

```ts
export default defineWorkspace([
  'packages/*/vite.config.ts'
])
```

* Now that it runs, I can see that workspace level coverage also includes the test files in the report
* Looking at my coverage config I can see why

```ts
  coverage: {
    provider: 'istanbul',
    include: ['packages/*/src/**'],
    exclude: ['packages/*/src/test/**']
  }
```

* I explicitly exclude some common source containing test utilities but not the unit tests themselves
* Somehow Vitest 1.x was implicitly excluding them but Vitest 2 isn't
* Once I included them explicitly I got the coverage reports I was expecting again

```ts
  coverage: {
    provider: 'istanbul',
    include: ['packages/*/src/**'],
    exclude: ['packages/*/src/test/**','packages/*/src/*.test.*']
  }
```

# jsdom 25

* May as well do this one next, while I'm looking at unit tests
* Marked as major release but breaking changes only when using non-default options that I don't use

```json
  "devDependencies": {
    "jsdom": "^25.0.0"
  }
```

```
% npm update

added 2 packages, removed 5 packages, changed 8 packages, and audited 1037 packages in 27s
```

* Half my unit tests now failing with a JavaScript runtime error deep inside jsdom: `TypeError: list.map is not a function`
* Rolled back to version 24. Still failing.
* A few unrelated minor updates got applied when I updated jsdom. Reverted `package-lock.json` to previous version and used `npm ci` to get installed state to match
* Now tests are working again
* Tried again but instead of updating `package.json` directly and running `npm update`, I did it properly, restricting scope of changes to just jsdom

```
% npm install -D jsdom@"^25.0.0"

added 2 packages, removed 5 packages, changed 2 packages, and audited 1037 packages in 1s
```

* This time tests run OK
* Let's try the minor updates again

```
% npm update

changed 6 packages, and audited 1037 packages in 19s
```

* Unit tests broken again
* Trawling through `package-lock.json` I see the following changes.
  * `electron-to-chromium`  1.5.66 -> 1.5.67
  * `nwsapi` 2.2.13 -> 2.2.14
  * `ts-api-utils` 1.4.2 -> 1.4.3
  * `nx` 20.1.3 -> 20.1.4

* I updated one at a time, trying unit tests after each. They broke after updating `nwsapi`
* [`nwsapi`](https://github.com/dperini/nwsapi) is an engine that implements the CSS selectors API

```
% npm ls nwsapi
root@ /Users/tim/GitHub/infinisheet
└─┬ jsdom@25.0.1
  └── nwsapi@2.2.14
```

* `nwsapi` is a dependency of `jsdom`
* jsdom requires nwsapi ^2.2.12
* Looks like a bad nwsapi update which I can safely roll back
* I added `nwsapi` to my package.json and excluded the bad version

```json
  "devDependencies": {
    "nwsapi": "^2.2.12 <2.2.14 || ^2.2.15"
  }
```

* Tried `npm update` one more time
* This time everything works
* A day later 2.2.15 was released to fix the problem. The developer had added a new experimental feature behind an feature flag which they'd left turned on. I removed nwsapi from my package.json and updated. Everything still works.

# vite-tsconfig-paths 5

* Dropping support for CommonJS modules which I don't use

```
% npm install -D vite-tsconfig-paths@"^5.0.0" 

changed 1 package, and audited 1037 packages in 2s
```

* Everything builds and runs OK

# Rollup plugin-typescript 12

* Fixing an issue where some combinations of output options would put files in the wrong place
* Breaking change for anyone relying on incorrect behavior

```
% npm install -D @rollup/plugin-typescript@"^12.0.0"

changed 1 package, and audited 1037 packages in 1s
```

* Build now fails with error `Path of Typescript compiler option 'declarationDir' must be located inside the same directory as the Rollup 'file' option.`
* Here's my Rollup config which involved [quite a journey]({% link _posts/2024-05-13-bootstrapping-npm-package-build.md %}) to put together in the first place

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
      typescript({ "declarationDir": "./types", tsconfig: "./tsconfig.build.json" })
    ],
  },
  {
    input: "dist/types/index.d.ts",
    output: [{
      file: "dist/index.d.ts",
      format: "es",
      plugins: []
    }],
    plugins: [      
      dts(),
      del({ targets: "dist/types", hook: "buildEnd" })
    ],
  }
];
```

* This is a two stage pipeline. The first stage uses the `typescript` plugin to transpile and bundle the source code into `dist/index.js` with declaration files output to `dist/types`. The second stage uses the `dts` plugin to read the declaration files in `dist/types` and bundle them into `dist/index.d.ts`.
* In the end had to find the code that [outputs the error message](https://github.com/rollup/plugins/blob/92daef00b0da30de172868d4e0792c8686da0045/packages/typescript/src/options/validate.ts#L72) to understand the problem
* The actual breaking change is not correcting where the output files go, it's [adding validation](https://github.com/rollup/plugins/pull/1728) to stop you putting output files where you want
* Ironically, I'm putting the files in the approved place, under the output directory. It's the validation that's wrong.
* Even more ironically, the original validation in 12.0.0 would have worked. It was changed in 12.1.11 to [fix a different problem](https://github.com/rollup/plugins/pull/1783).
* If you specify a Rollup output file, the validation checks that the output file is inside every typescript directory option. This makes sense if you're using the `outDir` typescript option to specify the overall output dir then writing individual output files into it. It makes no sense if you're using the `declarationDir` option.
* If you specify the overall Rollup output dir (and let Rollup choose the output file name), the validation checks that every typescript directory option is inside the overall output dir. 
* With some fiddling around I was able to rewrite the first stage config so that it does exactly the same thing as before while satisfying the validation checks.

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

# NodeJS 22

* Seeing `@types/node` at version 22 made me check the current version of NodeJS
* NodeJS 22.11.0 release on October 29th 2024 marked the entry of the 22.x release line into "Active LTS"
* Time to upgrade and switch my GitHub builds from 18 and 18 to 20 and 22. 
* Locally I'm still on the [first major version I installed]({% link _posts/2022-09-21-mac-local-blog-dev.md %}), Node 18

```
% node -v
v18.18.1
```

* Using asdf version manager for Node which can query latest available LTS version for me

```
% asdf nodejs resolve lts --latest-available
18.20.3
```

* That's weird. Maybe the check is hardcoded in some way and I need to update asdf

## Brew Update

* I use homebrew to manage software on my Mac that's outside the scope of the npm ecosystem
* Let's see how out of date everything is

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

* I was surprised that querying for outdated software would automatically upgrade homebrew itself and try to migrate `git-credential-manager`, whatever that means
* asdf is several versions behind, and so is lots of other stuff.  I clearly need to upgrade.

## Brew Upgrade

* It's all gone so well so far, I'm sure it will be fine ...

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
Disable this behaviour by setting HOMEBREW_NO_INSTALLED_DEPENDENTS_CHECK.
Hide these hints with HOMEBREW_NO_ENV_HINTS (see `man brew`).
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

* Horribly verbose but looks like it mostly worked with `git-credential-manager` going wrong at the end again
* Let's see what homebrew thinks it's achieved

```
% brew outdated
openssl@1.1 (1.1.1q) < 1.1.1w
git-credential-manager (2.0.785) != 2.6.0
```

* As far as I can tell, the latest asdf used openssl 3 which was installed. Homebrew didn't realize that it could uninstall openssl 1.1. It tried to upgrade it and failed because it's no longer supported but did identify that nothing is using it. I guess I can manually remove it?

## Git Credential Manager

* Homebrew seems to be confused about `git-credential-manager-core` and `git-credential-manager`. `brew list` shows `git-credential-manager-core` is installed but `brew outdated` lists `git-credential-manager, plus there's that failed "migration" from one to the other. 
* Apparently [GCM replaced GCM core](https://github.blog/security/application-security/git-credential-manager-authentication-for-everyone/) in 2022, so it's probably my fault for not keeping up.

* Let's try uninstalling and reinstalling

```
% brew uninstall git-credential-manager-core
Warning: Formula microsoft/git/git-credential-manager-core was renamed to homebrew/cask/git-credential-manager.
Warning: Cask microsoft/git/git-credential-manager-core was renamed to git-credential-manager.
==> Uninstalling Cask git-credential-manager-core
==> Running uninstall script /opt/homebrew/share/gcm-core/uninstall.sh
Error: uninstall script /opt/homebrew/share/gcm-core/uninstall.sh does not exist.
```

```
brew uninstall git-credential-manager     
==> Uninstalling Cask git-credential-manager-core
==> Running uninstall script /opt/homebrew/share/gcm-core/uninstall.sh
Error: uninstall script /opt/homebrew/share/gcm-core/uninstall.sh does not exist.
```

* Seems to be completely screwed up. Try to manually remove it.

```
rm -r /opt/homebrew/Caskroom/git-credential-manager-core
```

* Now try again

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

* That seems to have worked, and removed openssl 1.1 for me too
* Git still works too

## asdf Node 20 and 22

* All that and asdf still reports 18 as latest LTS version
* `asdf list all nodejs` shows that 22.11.0 is the most recent version of Node 22, which is the version that Node announced as the LTS version
* I guess I can install that by hand. Nice thing with asdf as you can have multiple versions of Node installed and switch between them
* If something goes wrong, trivial to switch back

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

* Everything appears to work but I get a warning from node whenever I use lerna, my monorepo build tool.

```
(node:18030) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
```

* Diving deeper

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

* This is a [known issue](https://github.com/lerna/lerna/issues/4074) for lerna. Seems like lerna has lots of old dependencies which need to be brought up to date.
* Let's use asdf to put the most recent version of Node 20 on (latest maintenance LTS) and give that a try

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

* Can run with Node 20 locally for now so I don't have to look at the deprecation notice and wait for lerna to update dependencies

* Still safe to update GitHub Build CI workflow to use Node 20 and 22

## Node 22 Types

* Should be fine to update to node 22 TypeScript types

```
% npm install -D @types/node@22

changed 2 packages, and audited 1037 packages in 1s
```

* Nice, no issues for a change

# rimraf 6

* Drops support for Node 18
* Should be safe to upgrade now

```
 % npm install -D rimraf@6      

added 6 packages, changed 1 package, and audited 1043 packages in 1s
```

* No issues here either

# TypeDoc 0.27

* Released November 27th 2024, with 0.27.1 following a day later
* Too close to the bleeding edge for me
* Leave it for next time
* Annoying, because this update is the thing that's blocking TypeScript 5.7
* TypeScript 5.7 was released November 22nd 2024, happy to let it bake a little longer

# Vite 6

* Released November 26th 2024, with 6.0.1 following a day later
* Too close to the bleeding edge for me
* Leave it for next time

# Minor Updates 3

* Let's check final state

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

* Already out of date
* Another round of minor updates and try again

```
% npm update

changed 27 packages, and audited 1043 packages in 49s

% npm outdated
Package     Current   Wanted  Latest
typedoc     0.26.11  0.26.11  0.27.2
typescript    5.6.3    5.6.3   5.7.2
vite         5.4.11   5.4.11   6.0.2
```

* That's more like what I was expecting to see
* Typedoc and Vite have both had another bug fix release since I started updating. Feeling comfortable with my decision to hold off for now.

# Next Time

* Hopefully, finally get round to installing something new
