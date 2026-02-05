---
title: >
  InfiniSheet: Chore Updates
tags: infinisheet typescript
thumbnail: /assets/images/frontend/npm-package.png
---

wise words

* Spent six months playing around with Home Assistant and  heat pumps
* Now picking up real development again
* Six months without updating dependencies means another week of update hell, a year since [my last one]({% link _posts/2024-12-09-infinisheet-chore-updates.md %}). 

# Minor Updates

As usual, I started by applying as many minor and patch updates as I could using `npm update`. Where I ran into build failures, I rolled back the associated updates to deal with individually later. This time the problem cases were API Extractor and TypeDoc.

# API Extractor

* Naturally, trying updating failure cases individually 
* API Extractor fails with weird `A tag is already defined using the name @jsx` error. I don't have any `@jsx` tags in my source code
* Once of the changes listed for API Extractor is update to latest TSDoc library
* The TSDoc library has a minor change to "standardize" how `@jsx` (amongst others) is handled
* Someone else [reported the same error](https://github.com/microsoft/tsdoc/issues/454) when using typedoc
* Problem seems to be that TSDoc didn't previously define `@jsx` so clients had to do it themselves. Now TSDoc is defining it and erroring out if any client defines it themselves.
* Updating TypeDoc to latest version got API Extractor working again

# TypeDoc

* Generates documentation which look OK but with a reported documentation coverage of 0%
* [Latest version](https://github.com/Gerrit0/typedoc-plugin-coverage/blob/main/CHANGELOG.md#v400-2025-04-19) of typedoc-plugin-coverage says it now respects the TypeDoc `packagesRequiringDocumentation` flag
* This is a new option in TypeDoc 0.28 which defaults to requiring each package to be documented
* Took me a long time to figure out that this doesn't work for monorepo setups
* In monorepo each package is converted individually and then merged together before being rendered to HTML
* The coverage plugin (and TypeDoc validation checking for undocumented items) runs *after* merging. In this case the default is that nothing is required to be documented.
* Had to explicitly list all packages in `typedoc.jsonc`

```json
{
  "packagesRequiringDocumentation": [
    "@candidstartup/event-sourced-spreadsheet-data",
    "@candidstartup/infinisheet-types",
    "@candidstartup/react-spreadsheet",
    "@candidstartup/react-virtual-scroll",
    "@candidstartup/simple-spreadsheet-data"
  ]
}
```

* Naturally the first time I tried it I forgot about the `@candidstartup/` prefix for each package name

# TypeScript

* Easy update this time

```
% npm install -D typescript@5.9

changed 1 package, and audited 1156 packages in 6s
```

* Everything built without issues
* Need to be careful. I define my [supported]({% link _posts/2025-04-07-typescript-semantic-versioning.md %}) TypeScript versions in `package.json`. Npm replaced "5.0 - 5.8" with "5.9". Unlike `^` prefixes, ranges aren't preserved. If you remember, specify the range on the npm command line, otherwise fix up in `package.json` and `package-lock.json` afterwards.

# Lerna to Lerna-Lite

* Lerna is always a pain because it uses pinned versions for many of its dependencies and is slow to publish updates that use more recent versions
* Lots of vulnerabilities reported in Lerna dependencies
* Finally decided to replace with lerna-lite which has less dependencies and is more frequently updated

```
% npm install -D @lerna-lite/cli @lerna-lite/run @lerna-lite/version @lerna-lite/publish
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'yargs@18.0.0',
npm warn EBADENGINE   required: { node: '^20.19.0 || ^22.12.0 || >=23' },
npm warn EBADENGINE   current: { node: 'v20.18.1', npm: '10.8.2' }
npm warn EBADENGINE }
```

# NodeJS minor update

* Easy to forget about NodeJS as its a dependency of npm so can't be managed by it.
* I use asdf as my NodeJS runtime manager

```
% asdf install nodejs 20.19.6
Trying to update node-build... ok
To follow progress, use 'tail -f /var/folders/36/wsv4ktt569d_fdzmgy_91vrc0000gn/T/node-build.20260120104223.39445.log' or pass --verbose
Downloading node-v20.19.6-darwin-arm64.tar.gz...
-> https://nodejs.org/dist/v20.19.6/node-v20.19.6-darwin-arm64.tar.gz

WARNING: node-v20.19.6-darwin-arm64 is in LTS Maintenance mode and nearing its end of life.
It only receives *critical* security updates, *critical* bug fixes and documentation updates.

Installing node-v20.19.6-darwin-arm64...
Installed node-v20.19.6-darwin-arm64 to /Users/tim/.asdf/installs/nodejs/20.19.6

% asdf global nodejs 20.19.6
```

* Time to switch from building against Node 20 and Node 22, to Node 22 and Node 24
* Let's get Lerna-Lite finished before pulling trigger on that

# Lerna-Lite configuration

* Almost a drop in replacement
* I needed to change `lerna.json` to get it to find all npm workspaces defined packages
* This version of Lerna-Lite is equivalent to Lerna 9. I was previously on Lerna 8 so may be major upgrade effect rather than subtle difference with Lerna-Lite.

```json
{
  "$schema": "node_modules/@lerna-lite/cli/schemas/lerna-schema.json",
  ...
  "useWorkspaces": true
}
```

* Lerna-Lite has some additional features missing from Lerna.
* There's a `--dry-run` flag that updates change logs, package.json and lock files but doesn't check anything in

```
npx lerna version --conventional-commits --dry-run

Changes (8 packages):
 - @candidstartup/spreadsheet-sample: 0.12.0 => 0.13.0 (private)
 - @candidstartup/storybook: 0.12.0 => 0.13.0 (private)
 - @candidstartup/virtual-scroll-samples: 0.12.0 => 0.13.0 (private)
 - @candidstartup/event-sourced-spreadsheet-data: 0.12.0 => 0.13.0
 - @candidstartup/infinisheet-types: 0.12.0 => 0.13.0
 - @candidstartup/react-spreadsheet: 0.12.0 => 0.13.0
 - @candidstartup/react-virtual-scroll: 0.12.0 => 0.13.0
 - @candidstartup/simple-spreadsheet-data: 0.12.0 => 0.13.0

✔ [dry-run] Are you sure you want to create these versions? Yes
lerna-lite WARN npm we recommend using --sync-workspace-lock which will sync your lock file via your favorite npm client instead of relying on Lerna-Lite itself to update it.
lerna-lite info [dry-run] > git commit -m chore(release): version v0.13.0
lerna-lite info [dry-run] > git tag v0.13.0 -m v0.13.0
...
```

* The `--sync-workspace-lock` uses `npm install --package-lock-only` to update npm's `package-lock.json` files (with equivalents for other package managers). This reduces the chance of Lerna messing things up. 

# NodeJS Major Update

* Using same principle as last time. Develop locally against latest maintenance LTS release so not inadvertently depending on anything specific to latest release
* Update GitHub Actions build workflow to build against latest maintenance and active LTS.

```
% asdf install nodejs 22.22.0                                                           
Trying to update node-build... ok
...
Installed node-v22.22.0-darwin-arm64 to /Users/tim/.asdf/installs/nodejs/22.22.0

% asdf global nodejs 22.22.0
```

* Updated GitHub workflows to include Node 22 and 24 in the build/test matrix
* Docs uses Node 22 but went all the way to Node 24 for publishing as that includes npm 11.5.1 required for eventual trusted publishing

# Storybook

* Last time I tried a minor update ran into trouble with Storybook
* Appeared to update OK but then encountered TypeScript errors with one of my stories
* Something in 8.6.5 and later broke type inferencing for arguments to the Story `render` method
* I have three stories that override render, and all of them have the same errors
* I thought this would be fixed in a later version so locked version to 8.6.4 in my `package.json` and moved on
* Now we have `8.6.15`, and `9.X` and `10.X`. I have updated of common packages blocked because 8.6.4 wants an earlier version.
* I need to move on somehow.
* Started by removing the locked version (changing `8.6.4` to `^8.6.4`) and running npm update.
* Still haven't fixed type inferencing problem.
* Decided to workaround in code so that I can apply major upgrades with the confidence of starting from a working version
* Here's an example of problem code

{% raw %}

```ts
  render: ( {width: _width, height, ...args} ) => (
    <AutoSizer style={{ width: '100%', height }}>
      {({width}) => (
        <VirtualSpreadsheet width={width} height={height} {...args}/>
      )}
    </AutoSizer>
  )
```

{% endraw %}

* Previously TypeScript would infer the exact types for width, height and args and was able to validate that required args were passed to VirtualSpreadsheet
* Now TypeScript insists that all args are of type any. Which means `width` and `height` don't match and it can't find the required `data` argument in `args`.
* Adding explicit types to signature of render method doesn't work as TypeScript complains that signature now doesn't match `Story` type
* Much messing around until I came up with this

{% raw %}

```ts
  render: ( {...input} ) => {
    const {width: _width, height, ...args} = input as { width: number, height: number, data: typeof testData};
    return <AutoSizer style={{ width: '100%', height }}>
      {({width}) => (
        <VirtualSpreadsheet width={width} height={height} {...args}/>
      )}
    </AutoSizer>
  }
```

{% endraw %}

* Instead of changing the type signature of the render method, I cast the arguments to the correct type

## Build Hell

* Everything looked good locally, so checked in
* Build CI failed on the React 19 part of the build matrix.
* Logs show install of React 19 causes loads of dependency errors with Storybook components
* Installed React 19 locally and got the same problem
* Couldn't figure it out. For some reason kept resolving `@storybook/react` to 8.6.4 and then reporting conflicts with later versions of other Storybook components.
* In the end resolved it by updating the Storybook versions in my `package.json` from `^8.6.4` to require at least the versions that worked for me locally, a mixture of `^8.6.14` and `^8.6.15`
* For some reason npm can't resolved the dependencies after installing React 19 if given too free a hand

## Storybook 9

Storybook is now at version 10 but the [migration instructions](https://storybook.js.org/docs/releases/migration-guide) say to upgrade to version 9 first. The version 9 [instructions](https://storybook.js.org/docs/releases/migration-guide-from-older-version) suggest using `npx storybook@latest upgrade` to install the updated packages and apply migrations to handle breaking changes. I guess they weren't updated after version 10 was released. The most recent version 9 release is tagged `v9` so I used that rather than `latest`.

```
% npx storybook@v9 upgrade
Need to install the following packages:
storybook@9.1.17
Ok to proceed? (y) y

npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated rimraf@2.6.3: Rimraf versions prior to v4 are no longer supported
npm warn deprecated tar@6.2.1: Old versions of tar are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exhorbitant rates) by contacting i@izs.me
```

Lots of scary warnings. I think these must be temporary dependencies of the upgrade script. The versions I use are much more recent and I don't use `inflight` at all.


```
┌  Storybook Upgrade - v9.1.17
│
◇  1 project detected
│
●  Upgrading from 8.6.15 to 9.1.17
│
◆  Updated package versions in package.json files
│
◆  4 automigration(s) detected
│
◇  Select automigrations to run
│  consolidated-imports, remove-addon-interactions, renderer-to-framework, remove-essential-addons
│
◆  Completed automigrations for /apps/storybook/.storybook
│
◆  Dependencies installed
│
▲  Since you are in a monorepo, we advise you to deduplicate your dependencies. We
│  can do this for you but it might take some time.
│
◇  Execute npm run dedupe?
│  Yes
│
◆  Dependencies deduplicated
│
◇  Checking the health of your project(s)..
│
│  Your Storybook project looks good!
│
◇  The upgrade is complete!
│
│  Your project(s) have been upgraded successfully! 🎉
```

* The upgrade went smoothly. Changes were all due to Storybook packages being renamed and/or merged. Required updates to `package.json` and to import statements at the top of my source files.
* Everything builds and runs without errors.

## Storybook 10

* Lots of activity, frequent updates, three this week. 
* Decided to leave until things have settled down a bit

# Vite 7

* Nothing scary in the [migration guide](https://vite.dev/guide/migration)
* Used `npm ls vite` to identify all my tooling dependent on vite and then searched through `package-lock.json` to confirm that they all listed Vite 7 as a supported major version.
* Guess I just go for it

```
% npm install -D vite@latest

added 2 packages, changed 1 package, and audited 907 packages in 3s
```

* Everything builds and runs without errors. Total anti-climax.
* Unrelated update to the `vite-tsconfig-paths` plugin so did that too

```
% npm install -D vite-tsconfig-paths@latest

changed 1 package, and audited 907 packages in 2s
```

* Equally anti-climactic

# Vitest 4

* Long list of breaking changes in the [migration guide](https://vitest.dev/guide/migration.html#vitest-4)
* Don't think any apply to me

```
% npm install -D vitest@latest @vitest/ui@latest @vitest/coverage-v8@latest @vitest/coverage-istanbul@latest

added 22 packages, removed 9 packages, changed 15 packages, and audited 920 packages in 5s
```

* Once again, anti-climactic. Everything builds. Unit tests, code coverage and benchmarks all run.

# ESLint

* `eslint-plugin-react-hooks` has supported new interfaces for a while so can remove `fixupPluginRules(eslintPluginReactHooks)` from my eslint config and uninstall the `@eslint/compat` package it came from

```
% npm uninstall -D @eslint/compat

removed 1 package, and audited 932 packages in 2s
```

* Major release of `eslint-plugin-react-hooks` since then (removing legacy support) so may as well update that too

```
% npm install -D eslint-plugin-react-hooks@latest

added 4 packages, changed 1 package, and audited 933 packages in 2s
```

* Similarly there's also a major release of `eslint-plugin-react-refresh` dropping legacy support and tweaking the config interface

```
% npm install -D eslint-plugin-react-refresh@latest

changed 1 package, and audited 932 packages in 2s
```

* Dependabot threw in a minor update of `typescript-eslint` while I was working through this which deprecated it's wrapper `config` function. Apparently all rolled into base ESLint's new `defineConfig` function. This function also flattens it's arguments meaning you no longer have to guess when to use the `...` spread operator.

Config changes from

```js
import { fixupPluginRules } from '@eslint/compat';
import tseslint from "typescript-eslint";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  ...tseslint.configs.recommendedTypeChecked,
  {
    plugins: {
      "react-hooks": fixupPluginRules(eslintPluginReactHooks),
      "react-refresh": reactRefresh
    }
  }
)
```

to 

```js
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import { reactRefresh } from "eslint-plugin-react-refresh";

export default defineConfig(
  tseslint.configs.recommendedTypeChecked,
  reactRefresh.configs.vite(),
  {
    plugins: {
      "react-hooks": eslintPluginReactHooks,
    }
  }
)
```

# Unit Test Environment

* Another anti-climax. Updated the jsdom and globals packages used for unit test environment to latest versions. No issues.

```
% npm install -D jsdom@latest

added 11 packages, removed 3 packages, changed 14 packages, and audited 929 packages in 3s
```

```
% npm install -D globals@latest

changed 1 package, and audited 929 packages in 1s
```
