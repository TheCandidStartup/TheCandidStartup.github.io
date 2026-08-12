---
title: >
  InfiniSheet: Chore Updates
tags: infinisheet
thumbnail: /assets/images/frontend/npm-package.png
---

wise words

* Given frozen shoulder haven't had a chance to keep dependencies up to date
* Tried to keep applying dependabot automated updates but hit a problem with some builds in my test matrix failing
* First problem was `api-extractor` complaining of API changes for my packages when built against React 19
* Didn't have the time or energy to figure it out, so removed from test matrix
* Then found that my Node 24 builds were hanging during Playwright install
* Again removed from test matrix
* Single remaining test matrix build seemed to work but dependabot had seemingly given up in disgust and stopped trying to apply updates
* Also have about 30 outstanding security issues due to out of date dependencies, together with many dependabot failures to update transitive dependencies
* So left it until my shoulder improved enough to have a proper go. May take some time.
* Also get the fun of doing first significant round of updates since switching to `pnpm`

Let's see what we've got outstanding

```
% pnpm outdated
┌───────────────────────────────────┬──────────┬─────────┐
│ Package                           │ Current  │ Latest  │
├───────────────────────────────────┼──────────┼─────────┤
│ @microsoft/api-extractor (dev)    │ 7.58.9   │ 7.58.12 │
├───────────────────────────────────┼──────────┼─────────┤
│ @testing-library/user-event (dev) │ 14.6.1   │ 14.6.3  │
├───────────────────────────────────┼──────────┼─────────┤
│ @vitejs/plugin-react-swc (dev)    │ 4.3.0    │ 4.3.3   │
├───────────────────────────────────┼──────────┼─────────┤
│ @vitest/coverage-istanbul (dev)   │ 4.1.5    │ 4.1.10  │
├───────────────────────────────────┼──────────┼─────────┤
│ @vitest/coverage-v8 (dev)         │ 4.1.5    │ 4.1.10  │
├───────────────────────────────────┼──────────┼─────────┤
│ @vitest/ui (dev)                  │ 4.1.5    │ 4.1.10  │
├───────────────────────────────────┼──────────┼─────────┤
│ vitest (dev)                      │ 4.1.5    │ 4.1.10  │
├───────────────────────────────────┼──────────┼─────────┤
│ @playwright/test (dev)            │ 1.59.1   │ 1.62.1  │
├───────────────────────────────────┼──────────┼─────────┤
│ globals (dev)                     │ 17.6.0   │ 17.9.0  │
├───────────────────────────────────┼──────────┼─────────┤
│ rollup (dev)                      │ 4.60.2   │ 4.62.4  │
├───────────────────────────────────┼──────────┼─────────┤
│ rollup-plugin-dts (dev)           │ 6.4.1    │ 6.5.0   │
├───────────────────────────────────┼──────────┼─────────┤
│ typescript-eslint (dev)           │ 8.59.1   │ 8.66.0  │
├───────────────────────────────────┼──────────┼─────────┤
│ @eslint/js (dev)                  │ 9.39.4   │ 10.0.1  │
├───────────────────────────────────┼──────────┼─────────┤
│ @lerna-lite/cli (dev)             │ 4.11.5   │ 5.4.2   │
├───────────────────────────────────┼──────────┼─────────┤
│ @lerna-lite/version (dev)         │ 4.11.5   │ 5.4.2   │
├───────────────────────────────────┼──────────┼─────────┤
│ @storybook/addon-docs (dev)       │ 9.1.20   │ 10.5.6  │
├───────────────────────────────────┼──────────┼─────────┤
│ @storybook/react-vite (dev)       │ 9.1.20   │ 10.5.6  │
├───────────────────────────────────┼──────────┼─────────┤
│ @testing-library/jest-dom (dev)   │ 6.9.1    │ 7.0.0   │
├───────────────────────────────────┼──────────┼─────────┤
│ @types/node (dev)                 │ 22.19.17 │ 26.1.2  │
├───────────────────────────────────┼──────────┼─────────┤
│ @types/react (dev)                │ 18.3.27  │ 19.2.18 │
├───────────────────────────────────┼──────────┼─────────┤
│ @types/react-dom (dev)            │ 18.3.7   │ 19.2.4  │
├───────────────────────────────────┼──────────┼─────────┤
│ eslint (dev)                      │ 9.39.4   │ 10.8.0  │
├───────────────────────────────────┼──────────┼─────────┤
│ eslint-plugin-storybook (dev)     │ 9.1.20   │ 10.5.6  │
├───────────────────────────────────┼──────────┼─────────┤
│ jsdom (dev)                       │ 29.1.1   │ 30.0.1  │
├───────────────────────────────────┼──────────┼─────────┤
│ react (dev)                       │ 18.3.1   │ 19.2.8  │
├───────────────────────────────────┼──────────┼─────────┤
│ react-dom (dev)                   │ 18.3.1   │ 19.2.8  │
├───────────────────────────────────┼──────────┼─────────┤
│ storybook (dev)                   │ 9.1.20   │ 10.5.6  │
├───────────────────────────────────┼──────────┼─────────┤
│ typescript (dev)                  │ 5.9.3    │ 7.0.2   │
├───────────────────────────────────┼──────────┼─────────┤
│ vite (dev)                        │ 7.3.2    │ 8.2.0   │
├───────────────────────────────────┼──────────┼─────────┤
│ eslint-plugin-react-refresh (dev) │ 0.5.2    │ 0.5.3   │
├───────────────────────────────────┼──────────┼─────────┤
│ typedoc (dev)                     │ 0.28.19  │ 0.28.20 │
└───────────────────────────────────┴──────────┴─────────┘
```

# Minor Updates

* As usual, addressed minor updates first
* Was nervous about doing everything in one go given issues I'd been having and number of packages to update
* Decided to have a go anyway. If it doesn't work can roll back and try individually.

```
% pnpm update 
 WARN  3 deprecated subdependencies found: @types/parse-path@7.1.0, glob@10.5.0, tsconfck@3.1.6
Progress: resolved 833, reused 0, downloaded 0, added 0, done
Packages: +289 -244
Downloading @swc/core-darwin-arm64@1.15.47: 10.58 MB/10.58 MB, done
node_modules/.pnpm/@swc+core@1.15.47/node_modules/@swc/core: Running postinstall script, done in 599ms
node_modules/.pnpm/esbuild@0.28.1/node_modules/esbuild: Running postinstall script, done in 847ms
Done in 12.6s using pnpm v10.28.2
```

* Lots of packages changed but seemed to go smoothly
* Hopefully the deprecated subdependencies warning will go once everything is updated
* Built went as normal up to the point where `api-extractror` validates that the API hasn't changed 

```
packages/react-virtual-scroll prodapi$ api-extractor run
│ api-extractor 7.58.12  - https://api-extractor.com/
│ 
│ Using configuration from ./api-extractor.json
│ Analysis will use the bundled TypeScript version 5.9.3
│ Warning: You have changed the API signature for this project. Please copy the file "temp/react-virtual-scroll.api.md" to "react-virtual-scroll.api.md", or perform a local build (which does this a…
│ API Extractor completed with warnings
└─ Failed in 1s at /Users/tim/GitHub/infinisheet/packages/react-virtual-scroll
```

* Same error that I'd seen in my React 19 builds, but this time against React 18
* Best case scenario is that something has changed in the React 19 API that my packages depend on, that was later backported to React 18
* The change in the signature is that `JSX.Element` is now imported from `react` rather than `react/jsx-runtime`. This now matches the import in my source code. Assume this is some cleanup in a recent version of API extractor
* I updated my saved API signature to match the changes

* Only other thing to do was to install playwright binaries

```
% pnpm exec playwright install
Removing unused browser at /Users/tim/Library/Caches/ms-playwright/chromium-1217
...
Downloading Chrome for Testing 151.0.7922.34 (playwright chromium v1234)
...
```

* After that local build completed without problems. Unit and Playwright tests all pass.

# Entering the Matrix

* Pushed changes and confirmed that GitHub actions build completes OK
* Hopefully `api-extractor` and Playwright updates will have fixed the other builds in the test matrix
* Restored React 19 and Node 24 builds
* To my surprise everything completed successfully
* All outstanding security issues gone too

# Picking Battles

* Just the major updates to do now

```
% pnpm outdated
┌─────────────────────────────────┬─────────┬─────────┐
│ Package                         │ Current │ Latest  │
├─────────────────────────────────┼─────────┼─────────┤
│ @eslint/js (dev)                │ 9.39.5  │ 10.0.1  │
├─────────────────────────────────┼─────────┼─────────┤
│ @lerna-lite/cli (dev)           │ 4.11.5  │ 5.4.2   │
├─────────────────────────────────┼─────────┼─────────┤
│ @lerna-lite/version (dev)       │ 4.11.5  │ 5.4.2   │
├─────────────────────────────────┼─────────┼─────────┤
│ @storybook/addon-docs (dev)     │ 9.1.20  │ 10.5.6  │
├─────────────────────────────────┼─────────┼─────────┤
│ @storybook/react-vite (dev)     │ 9.1.20  │ 10.5.6  │
├─────────────────────────────────┼─────────┼─────────┤
│ @testing-library/jest-dom (dev) │ 6.9.1   │ 7.0.0   │
├─────────────────────────────────┼─────────┼─────────┤
│ @types/node (dev)               │ 22.20.1 │ 26.1.2  │
├─────────────────────────────────┼─────────┼─────────┤
│ @types/react (dev)              │ 18.3.31 │ 19.2.18 │
├─────────────────────────────────┼─────────┼─────────┤
│ @types/react-dom (dev)          │ 18.3.7  │ 19.2.4  │
├─────────────────────────────────┼─────────┼─────────┤
│ eslint (dev)                    │ 9.39.5  │ 10.8.0  │
├─────────────────────────────────┼─────────┼─────────┤
│ eslint-plugin-storybook (dev)   │ 9.1.20  │ 10.5.6  │
├─────────────────────────────────┼─────────┼─────────┤
│ jsdom (dev)                     │ 29.1.1  │ 30.0.1  │
├─────────────────────────────────┼─────────┼─────────┤
│ react (dev)                     │ 18.3.1  │ 19.2.8  │
├─────────────────────────────────┼─────────┼─────────┤
│ react-dom (dev)                 │ 18.3.1  │ 19.2.8  │
├─────────────────────────────────┼─────────┼─────────┤
│ storybook (dev)                 │ 9.1.20  │ 10.5.6  │
├─────────────────────────────────┼─────────┼─────────┤
│ typescript (dev)                │ 5.9.3   │ 7.0.2   │
├─────────────────────────────────┼─────────┼─────────┤
│ vite (dev)                      │ 7.3.6   │ 8.2.0   │
└─────────────────────────────────┴─────────┴─────────┘
```

* Want to apply these in order from simplest to most complex
* TypeScript and Vite are major architectural changes, so will leave those to last
* Don't need to do the 4 React 18 to 19 packages at all. I develop against React 18, then upgrade to React 19 in my test matrix.
* Naturally I test local build for each update before pushing and checking that GitHub actions builds succeed

# Lerna-Lite 5

* Major version update because Node 22 is now minimum dependency. Matches what I already do.

```
% pnpm update --latest @lerna-lite/cli @lerna-lite/version
 WARN  3 deprecated subdependencies found: @types/parse-path@7.1.0, glob@10.5.0, tsconfck@3.1.6
Progress: resolved 846, reused 0, downloaded 0, added 0, done
Packages: +83 -179
Done in 4.3s using pnpm v10.28.2
```

* Looks like lerna-lite has lost some weight, which is great

# jsdom 30

* Major version bump all due to Node 22 being the minimum dependency

```
% pnpm update --latest jsdom              
 ERR_PNPM_UNSUPPORTED_ENGINE  Unsupported environment (bad pnpm and/or Node.js version)

This error happened while installing a direct dependency of /Users/tim/GitHub/infinisheet

Your Node version is incompatible with "jsdom@30.0.1".

Expected version: ^22.22.2 || ^24.15.0 || >=26.0.0
Got: v22.22.0
```

* A friendly reminder that I should also update my development version of NodeJS 22 to latest LTS

```
% asdf install nodejs 22.23.2
Trying to update node-build... ok
To follow progress, use 'tail -f /var/folders/36/wsv4ktt569d_fdzmgy_91vrc0000gn/T/node-build.20260811174533.28045.log' or pass --verbose
Downloading node-v22.23.2-darwin-arm64.tar.gz...
-> https://nodejs.org/dist/v22.23.2/node-v22.23.2-darwin-arm64.tar.gz

WARNING: node-v22.23.2-darwin-arm64 is in LTS Maintenance mode and nearing its end of life.
It only receives *critical* security updates, *critical* bug fixes and documentation updates.

Installing node-v22.23.2-darwin-arm64...
Installed node-v22.23.2-darwin-arm64 to /Users/tim/.asdf/installs/nodejs/22.23.2

% asdf global nodejs 22.23.2

% asdf current
nodejs          22.22.0         /Users/tim/GitHub/infinisheet/.tool-versions
pnpm            10.28.2         /Users/tim/GitHub/infinisheet/.tool-versions
```

* I'd forgotten that I track the current version in a checked-in file. After updating the file.

```
% asdf current
nodejs          22.23.2         /Users/tim/GitHub/infinisheet/.tool-versions
pnpm            10.28.2         /Users/tim/GitHub/infinisheet/.tool-versions
```

* Trying jsdom once more

```
% pnpm update --latest jsdom
 WARN  3 deprecated subdependencies found: @types/parse-path@7.1.0, glob@10.5.0, tsconfck@3.1.6
Progress: resolved 797, reused 0, downloaded 0, added 0, done
Packages: +72 -118
Done in 1.7s using pnpm v10.28.2
```

* There's a new major version of pnpm too. I'll tackle that after some more of the low hanging fruit.

# Testing Library 7

* `@testing-library/jest-dom` has a new major version because `@testing-library/dom` is now a peer dependency. I already have it as a direct dev dependency so nothing else needed.

```
% pnpm update --latest @testing-library/jest-dom
 WARN  4 deprecated subdependencies found: @testing-library/jest-dom@6.10.0, @types/parse-path@7.1.0, glob@10.5.0, tsconfck@3.1.6
Progress: resolved 798, reused 0, downloaded 0, added 0, done
Packages: +68 -119
Done in 1.6s using pnpm v10.28.2
```

# pnpm 11

* This time I remembered to update `.tool-versions` after installing latest pnpm

```
% asdf install pnpm 11.21.0                     
Downloading pnpm v11.21.0 from https://registry.npmjs.org/pnpm/-/pnpm-11.21.0.tgz
Using ASDF_DOWNLOAD_PATH: /Users/tim/.asdf/downloads/pnpm/11.21.0
% asdf current
nodejs          22.23.2         /Users/tim/GitHub/infinisheet/.tool-versions
pnpm            11.21.0         /Users/tim/GitHub/infinisheet/.tool-versions
% pnpm -v
11.21.0
```

* There are lots of minor changes to config with a codemod to apply them

```
% pnpx codemod run pnpm-v10-to-v11
Packages: +3
Downloading @codemod.com/cli-darwin-arm64@1.13.18: 39.32 MB/39.32 MB, done
Progress: resolved 7, reused 0, downloaded 3, added 3, done
[1/2] 🔍 Resolving package from registry: https://app.codemod.com ...
[2/2] 🏁 Running codemod: pnpm-v10-to-v11
Workflow started cff47dff-b62a-441a-8d41-2ff0baa8eec9
⏺ Run pnpm v10 → v11 migration

  ⚠  Shell command requires approval
  Step: Run pnpm v10 → v11 migration
  Node: Migrate to pnpm v11
  Command:
    node -e "import(require('url').pathToFileURL(process.env.CODEMOD_PATH+'/dist/index.js').href)"

> Run this command? Yes

pnpm v11 migration complete. Run your package manager's install command to refresh the lockfile.
Workflow completed in 19.0s

Run summary
  Modified     0
  Unmodified   0
```

* The run summary suggests nothing has changed but git shows that my old `.npmrc` file has been deleted with the `engine-strict` flag moved into `pnpm-workspace.yaml`, together with some existing options being restructured.

```yaml
engineStrict: true
allowBuilds:
  '@swc/core': true
  esbuild: true
```

* Migration script ends by suggesting you run install

```
% pnpm install
Scope: all 9 workspace projects
✔ The modules directories will be removed and reinstalled from scratch. Proceed? Yes
Recreating /Users/tim/GitHub/infinisheet/node_modules
✓ Lockfile passes supply-chain policies (798 entries in 13.5s)
Lockfile is up to date, resolution step is skipped
Packages: +711
Downloading @swc/core-darwin-arm64@1.15.47: 10.57 MB/10.57 MB, done
Downloading storybook@9.1.20: 9.97 MB/9.97 MB, done
Progress: resolved 711, reused 0, downloaded 711, added 711, done
node_modules/.pnpm/@swc+core@1.15.47/node_modules/@swc/core: Running postinstall script, done in 749ms
node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild: Running postinstall script, done in 1.2s
node_modules/.pnpm/esbuild@0.28.1/node_modules/esbuild: Running postinstall script, done in 950ms

Done in 20.8s using pnpm v11.21.0
```

* Seems like enough has changed internally to require all packages to be reinstalled
* No change to lock file
* Running install again tells me everything is up to date
* I had to bump the version of pnpm installed in my GitHub actions workflows manually
* pnpm 11 supports a new `setup` action which installs NodeJS and pnpm in a single action. It's pretty new, so I'll stick with the current process for now. Also feel more comfortable letting the official GitHub action handle NodeJS install.

# Storybook 10

* Main change is moving to a pure ESM distribution. That means dropping support for earlier versions of Node and requiring all config files to be valid ESM. My project has been pure ESM from the start, so should be fine.
* There's a [migration script](https://storybook.js.org/docs/releases/migration-guide#automatic-upgrade) which will do anything needed for you let's give it a whirl. 

```
% pnpm dlx storybook@10.5.6 upgrade
Downloading storybook@10.5.6: 6.06 MB/6.06 MB, done
Packages: +71
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 141, reused 49, downloaded 30, added 71, done
✔ Choose which packages to build (Press <space> to select, <a> to toggle all, <i> to invert selection) 
All packages were added to allowBuilds with value false.
[WARN] 3 deprecated subdependencies found: glob@7.2.3, inflight@1.0.6, rimraf@2.6.3
Packages: +201
Progress: resolved 271, reused 144, downloaded 65, added 131, done
✔ Choose which packages to build (Press <space> to select, <a> to toggle all, <i> to invert selection) esbuild
✔ The next packages will now be built: esbuild.
Do you approve? Yes

┌  Storybook upgrade - v10.5.6
│
◐  Detecting projects: 1 projects│
●  Loading main config failed as the file does not seem to be valid ESM. Trying a
│  temporary fix, please ensure the main config is valid ESM.
◇  1 project detected
│
●  Upgrading from 9.1.20 to 10.5.6
│
◆  Updated package versions in package.json files
│
◆  1 automigration(s) detected
│
◇  Select automigrations to run
│  fix-faux-esm-require
│
◆  Completed automigrations for /apps/storybook/.storybook
│
◇  Dependencies installed
│
▲  Since you are in a monorepo, we advise you to deduplicate your dependencies. We
│  can do this for you but it might take some time.
│
◇  Execute pnpm run dedupe?
│  Yes
│
│  Deduplicating dependencies...
│
│  ✓ Lockfile passes supply-chain policies (verified 10s ago)
│
│  Progress: resolved 1, reused 0, downloaded 0, added 0
│
│  Progress: resolved 278, reused 201, downloaded 0, added 0
│
│  Progress: resolved 626, reused 522, downloaded 0, added 0
│
│  [WARN] 2 deprecated subdependencies found: @types/parse-path@7.1.0,
│  tsconfck@3.1.6
│
│  Packages: -68
│  --------------------------------------------------------------------
│
│  Progress: resolved 802, reused 704, downloaded 0, added 0, done
│

│
│  Dependencies deduplicated
│
◇  Checking the health of your project(s)..
│
│  Your Storybook project looks good!
│
◇  Your project(s) have been upgraded successfully! 🎉
│
│  If you want to learn more about the automigrations that executed in your
│  project(s), please check the following links:
│  • fix-faux-esm-require:
│  https://storybook.js.org/docs/faq#how-do-i-fix-module-resolution-in-special-environments
│
│  For a full list of changes, please check our migration guide:
│  https://storybook.js.org/docs/releases/migration-guide?ref=upgrade
│
└  Storybook upgrade completed!
```

*  Don't know what the package build question was about. The only option was `esbuild` and you couldn't progress without selecting it. Presumably building the migration script?
* I also seem to have acquired another two deprecated dependencies.
* Turns out my config file isn't pure ESM. I added some boilerplate copied from the Storybook manual to handle module resolution in a monorepo. The boilerplate made use of require. The migration fixed it up.

```ts
// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from "node:module";
import { join, dirname } from "path";

const require = createRequire(import.meta.url);

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
```

* That works but seems kind of ugly. The example boilerplate in the manual has been updated for ESM so I switched to that.

```ts
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const getAbsolutePath = (packageName: string) =>
  dirname(fileURLToPath(import.meta.resolve(`${packageName}/package.json`)));
```

# ESLint 10

* Another dependency dropping support for old versions of Node. Also drops support for the old config file format (which we migrated away from a while back).

```
% pnpm update --latest eslint @eslint/js        
✓ Lockfile passes supply-chain policies (verified 54m ago)
[WARN] "@eslint/js@>=9.39.5 <10.0.0-0" was updated to 10.0.1, not 9.39.5, to match the version preferred by your manifests and already installed dependencies. To use 9.39.5, add an override to pnpm-workspace.yaml: overrides: { "@eslint/js@>=9.39.5 <10.0.0-0": "9.39.5" }
[WARN] "eslint@>=9.39.5 <10.0.0-0" was updated to 10.8.0, not 9.39.5, to match the version preferred by your manifests and already installed dependencies. To use 9.39.5, add an override to pnpm-workspace.yaml: overrides: { "eslint@>=9.39.5 <10.0.0-0": "9.39.5" }
[WARN] 2 deprecated subdependencies found: @types/parse-path@7.1.0, tsconfck@3.1.6
Progress: resolved 789, reused 0, downloaded 2, added 0, done
[WARN] Issues with peer dependencies found. Run "pnpm peers check" to list them.
Packages: +20 -33
Done in 3.1s using pnpm v11.21.0

% pnpm peers check
Issues with peer dependencies found

✕ unmet peer eslint
  Installed: 10.8.0
  Wanted:
    "^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7":
      eslint-plugin-react@7.37.5
```

* Looks like `eslint-plugin-react` doesn't support ESLint 10 yet. There's an [open PR](https://github.com/jsx-eslint/eslint-plugin-react/pull/4022) that is being actively worked on. Will have to leave this one for now.
