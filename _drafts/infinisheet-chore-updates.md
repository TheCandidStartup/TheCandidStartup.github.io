---
title: >
  Updates: Vite 8, TypeScript 6, Storybook 10, pnpm 11
tags: infinisheet
thumbnail: /assets/images/frontend/npm-package.png
---

My [frozen shoulder]({% link _posts/2026-07-17-frozen-shoulder.md %}) problem means I haven't had a chance to keep dependencies up to date on my [InfiniSheet]({% link _topics/infinisheet.md %}) project. I tried to keep applying dependabot automated updates but hit a problem with some builds in my test matrix failing.

The first problem was `api-extractor` complaining of API changes for my packages when built against React 19. I didn't have the time or energy to figure it out, so removed React 19 from the build matrix. Then I found out that my Node 24 builds were hanging during Playwright install. So I removed that build too. 

The single remaining build continued to work but dependabot had seemingly given up in disgust and stopped trying to apply updates. I also have about 30 outstanding security issues due to out of date dependencies, together with many dependabot failures to update transitive dependencies.

I left it until my shoulder improved enough to have a proper go. It may take some time. I also get the fun of doing the first significant round of updates since [switching]({% link _posts/2026-02-23-securing-npm-supply-chain.md %}) to `pnpm`.

Let's see what we've got outstanding.

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

As usual, I addressed minor updates first. I was nervous about doing everything in one go given the issues I'd been having and the number of packages to update. I decided to have a go anyway. If it doesn't work we can roll back and try updating packages individually.

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

Lots of packages have changed but the update seemed to go smoothly. Hopefully the deprecated subdependencies warning will go once everything else is updated. The build proceeds as normal up to the point where `api-extractror` validates that the API hasn't changed.

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

This is the same error I saw in my React 19 builds, but this time against React 18. The change in the signature is that `JSX.Element` is now imported from `react` rather than `react/jsx-runtime`. This now matches the import in my source code. I assume this is some cleanup in a recent version of API extractor.

I updated my saved API signature to match the changes. The only other thing I needed to do was install playwright binaries.

```
% pnpm exec playwright install
Removing unused browser at /Users/tim/Library/Caches/ms-playwright/chromium-1217
...
Downloading Chrome for Testing 151.0.7922.34 (playwright chromium v1234)
...
```

After that the build completes without problems. Unit and Playwright tests all pass.

# Entering the Matrix

I pushed the changes and confirmed that the single remaining GitHub actions build completes OK. Hopefully `api-extractor` and Playwright updates will have fixed the other builds in the matrix.

I restored React 19 and Node 24 builds. To my surprise everything completed successfully. All the outstanding security issues have gone too.

# Picking Battles

That leaves the major updates outstanding.

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

I want to apply these in order from simplest to most complex. TypeScript and Vite are major architectural changes, so will leave those to last.

I don't need to do the four React 18 to 19 packages at all. I develop against React 18, then upgrade to React 19 in my build matrix.

# Lerna-Lite 5

This is a major version update because Node 22 is now a minimum dependency. Which matches what I already do.

```
% pnpm update --latest @lerna-lite/cli @lerna-lite/version
 WARN  3 deprecated subdependencies found: @types/parse-path@7.1.0, glob@10.5.0, tsconfck@3.1.6
Progress: resolved 846, reused 0, downloaded 0, added 0, done
Packages: +83 -179
Done in 4.3s using pnpm v10.28.2
```

Looks like `lerna-lite` has lost some weight, which is great.

# jsdom 30

Another major version bump due to Node 22 being the minimum dependency.

```
% pnpm update --latest jsdom              
 ERR_PNPM_UNSUPPORTED_ENGINE  Unsupported environment (bad pnpm and/or Node.js version)

This error happened while installing a direct dependency of /Users/tim/GitHub/infinisheet

Your Node version is incompatible with "jsdom@30.0.1".

Expected version: ^22.22.2 || ^24.15.0 || >=26.0.0
Got: v22.22.0
```

A friendly reminder that I should also update my development version of NodeJS 22 to the latest LTS build.

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

I'd forgotten that I now track the current version in `.tool-versions`. 

```
% asdf current
nodejs          22.23.2         /Users/tim/GitHub/infinisheet/.tool-versions
pnpm            10.28.2         /Users/tim/GitHub/infinisheet/.tool-versions
```

After updating that I successfully updated jsdom.

```
% pnpm update --latest jsdom
 WARN  3 deprecated subdependencies found: @types/parse-path@7.1.0, glob@10.5.0, tsconfck@3.1.6
Progress: resolved 797, reused 0, downloaded 0, added 0, done
Packages: +72 -118
Done in 1.7s using pnpm v10.28.2
```

There's a new major version of pnpm too. I'll tackle that after some more of the low hanging fruit.

# Testing Library 7

`@testing-library/jest-dom` has a new major version because `@testing-library/dom` is now a peer dependency. I already have it as a direct dev dependency so nothing else needed.

```
% pnpm update --latest @testing-library/jest-dom
 WARN  4 deprecated subdependencies found: @testing-library/jest-dom@6.10.0, @types/parse-path@7.1.0, glob@10.5.0, tsconfck@3.1.6
Progress: resolved 798, reused 0, downloaded 0, added 0, done
Packages: +68 -119
Done in 1.6s using pnpm v10.28.2
```

# pnpm 11

This time I remembered to update `.tool-versions` after installing the latest pnpm.

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

There are lots of minor changes to the config format with a codemod to apply them.

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

The run summary suggests nothing has changed but git shows that my old `.npmrc` file has been deleted with the `engine-strict` flag moved into `pnpm-workspace.yaml`, together with some existing options being restructured.

```yaml
engineStrict: true
allowBuilds:
  '@swc/core': true
  esbuild: true
```

The migration script ends by suggesting you run `pnpm install`.

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

It looks like enough has changed internally to require all packages to be reinstalled. There's no change to the lock file. Running install again tells me everything is up to date.

I had to bump the version of pnpm in my GitHub actions workflows manually. Pnpm 11 supports a new `setup` action which installs NodeJS and pnpm in a single action. It's pretty new, so I'll stick with the current process for now. I also feel more comfortable letting the official GitHub action handle NodeJS install.

# Storybook 10

The main change is moving to a pure ESM distribution. That means dropping support for earlier versions of Node and requiring all config files to be valid ESM. My project has been pure ESM from the start, so should be fine.

There's a [migration script](https://storybook.js.org/docs/releases/migration-guide#automatic-upgrade) which will do anything needed for you. Let's give it a whirl. 

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

I don't know what the package build question was about. The only option was `esbuild` and you couldn't progress without selecting it. Looks like Storybook uses a more recent version of `esbuild` and has forced a rebuild of the package?

On the positive side, we've got rid of one of our deprecated dependencies. Two left to go.

It turns out my config file isn't pure ESM. I added some boilerplate copied from the Storybook manual to handle module resolution in a monorepo. The boilerplate made use of `require`. The migration fixed it up.

```ts
// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from "node:module";
import { join, dirname } from "path";

const require = createRequire(import.meta.url);

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
```

That works but seems kind of ugly. The example boilerplate in the manual has been updated for ESM so I switched to that.

```ts
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const getAbsolutePath = (packageName: string) =>
  dirname(fileURLToPath(import.meta.resolve(`${packageName}/package.json`)));
```

# ESLint 10

This is another dependency dropping support for old versions of Node. It also drops support for the old config file format (which we migrated away from a while back).

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

Looks like `eslint-plugin-react` doesn't support ESLint 10 yet. There's an [open PR](https://github.com/jsx-eslint/eslint-plugin-react/pull/4022) that is being actively worked on. Will have to leave this one for now.

# TypeScript 6 - 7

TypeScript 7 is a complete rewrite of the TypeScript compiler in Go. The aim is to be as backwards compatible as possible. However, they are taking the opportunity to jettison a lot of legacy features.

The recommended approach is to migrate via TypeScript 6. TypeScript 6 uses the existing JavaScript codebase while supporting the same reduced feature set as TypeScript 7.

Why is that any better if you have to fix errors due to removed features anyway? There's a [big difference](https://codingdunia.com/blog/typescript-7-migration-guide/#what-breaks-when-you-upgrade) in developer experience between a feature that the compiler understands and provides a targeted deprecation warning for, and a feature that just looks like a synxtax error.

TypeScript 7 was only released a month ago. The current release is 7.0.2. I'd like to give it some more bake time. However, it does make sense to move to TypeScript 6 now.

```
% pnpm update typescript@^6              
✓ Lockfile passes supply-chain policies (verified 19h ago)
[WARN] 2 deprecated subdependencies found: @types/parse-path@7.1.0, tsconfck@3.1.6
Progress: resolved 803, reused 0, downloaded 0, added 0, done
[WARN] Issues with peer dependencies found. Run "pnpm peers check" to list them.
Packages: +22 -21
Done in 3.5s using pnpm v11.21.0
% pnpm peers check
Issues with peer dependencies found

✕ unmet peer typescript
  Installed: 6.0.3
  Wanted:
    ^5.0.0:
      tsconfck@3.1.6
```

That's one of the deprecated dependencies. `tsconfck` is deprecated because it is no longer maintained. It doesn't support anything later than TypeScript 5. Time to figure out where that deprecated dependency is coming from.

```
% pnpm ls --depth Infinity tsconfck
Legend: production dependency, optional only, dev only

root /Users/tim/GitHub/infinisheet (PRIVATE)
│
│   devDependencies:
└─┬ vite-tsconfig-paths@6.1.1
  └── tsconfck@3.1.6
```

`vite-tsconfig-paths` is a Vite plugin that I use to enable Vite to resolve paths in the same way that TypeScript does. The maintainer [doesn't seem interested](https://github.com/aleclarson/vite-tsconfig-paths/pull/220) in removing the deprecated dependency.

Apparently, Vite 8 has native support for this feature, so looks like my best bet is to try moving to Vite 8 first.

# Vite  8

Vite 7 and earlier are built around the `rollup` bundler, with the `esbuild` and `swc` bundlers used for more limited use cases where speed is vital. In Vite 8, all three are replaced by `rolldown`, a Rust based rewrite of `rollup`.

Rolldown is much faster (removing the need for `esbuild` and `swc`). This is a big change, particularly as I rely on several `rollup` plugins. However, `rolldown` is meant to be API compatible with `rollup`, so my plugins should still work.

```
% pnpm update vite@8             
✓ Lockfile passes supply-chain policies (verified 20h ago)
[WARN] 2 deprecated subdependencies found: @types/parse-path@7.1.0, tsconfck@3.1.6
Progress: resolved 831, reused 0, downloaded 0, added 0, done
Packages: +20 -11
Downloading @rolldown/binding-darwin-arm64@1.2.3: 7.23 MB/7.23 MB, done
Done in 4.1s using pnpm v11.21.0
```

A full production build including unit and playwright tests completes first time. My package builds use `rollup` directly so I need to switch that over manually. In addition, there are some runtime warnings with pointers to work I still need to do.

```
(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite:
  - `__dirname` (vite.config.ts:17:23). Use `import.meta.dirname` instead
Set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress this warning.
│
▲  Vite The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig
│  paths resolution natively via the resolve.tsconfigPaths option. You can remove
│  the plugin and set resolve.tsconfigPaths: true in your Vite config instead.
│
▲  Vite [vite:react-swc] We recommend switching to `@vitejs/plugin-react` for
│  improved performance as no swc plugins are used. More information at
│  https://vite.dev/rolldown
```

I replaced `__dirname` with `import.meta.dirname` in all my vite config files as requested. I removed use of `vite-tsconfig-paths` plugin in all my Vite and Vitest config files and replaced it with the `resolve.tsconfigPaths` option. 

```ts
export default defineConfig({
  resolve: {
    tsconfigPaths: true
  }
})
```

I removed `vite-tsconfig-paths` from package.json and with it the deprecated dependency that was blocking update to TypeScript 6.

```
% pnpm remove -r vite-tsconfig-paths
Scope: all 9 workspace projects
✓ Lockfile passes supply-chain policies (verified 4h ago)
[WARN] 1 deprecated subdependencies found: @types/parse-path@7.1.0
.                                        |  -13 -
Progress: resolved 828, reused 707, downloaded 0, added 0, done
Done in 2.8s using pnpm v11.21.0
```

I also fixed another native config loader warning. I was importing my shared `vitest.config.ts` config without specifying the `.ts` file extension. 
Adding `.ts` leads to a TypeScript error, which is why I left it off in the first place. This time I held my nose and did what TypeScript wants, importing as `vitest.config.js` (even though it seems ridiculous to import a file with the extension it *would have* if I had run it through the TypeScript compiler).

# Vite plugin-react 6

Finally, I replaced `plugin-react-swc` with the standard `plugin-react`.  The standard plugin has also been re-implemented in Rust, so should now be as fast as SWC.

```
% pnpm remove -r @vitejs/plugin-react-swc
Scope: all 9 workspace projects
✓ Lockfile passes supply-chain policies (verified 26m ago)
[WARN] 1 deprecated subdependencies found: @types/parse-path@7.1.0
.                                        |   -5 -
Progress: resolved 812, reused 702, downloaded 0, added 0, done
Done in 4.3s using pnpm v11.21.0

% pnpm add -D -w @vitejs/plugin-react
✓ Lockfile passes supply-chain policies (verified 2m ago)
[WARN] 1 deprecated subdependencies found: @types/parse-path@7.1.0
Progress: resolved 813, reused 0, downloaded 0, added 0, done

devDependencies:
+ @vitejs/plugin-react ^6.0.5

Packages: +1
+
Done in 4.8s using pnpm v11.21.0
```

# Rollup to Rolldown

Package builds use Rollup directly as my requirements were too complex for Vite. I need to transform and bundle TypeScript source as JavaScript, as well as generating and bundling `.d.ts` type files.

Vite (and Rollup) have no direct support for type files. I use a plugin to bundle type files which takes as input the per source file type files generated by the TypeScript compiler. I use a two pass approach.

```js
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import del from "rollup-plugin-delete";
import path from "path";

const isExternal = (id) => !id.startsWith(".") && !path.isAbsolute(id);

export default [
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

The first pass transforms and bundles the TypeScript source code and also uses the TypeScript plugin to generate `.d.ts` files. The second pass reads the generated `.d.ts` files, uses the dts plugin to bundle them and then deletes the intermediate generated `.d.ts` files.

Rolldown is meant to be a drop in replacement, supporting existing rollup plugins, so you might think that this config will just work with rolldown. The problem is that we rely on the passes being executed in series. Rolldown makes aggressive use of concurrency and runs both passes in parallel.

There's no way to turn concurrent execution off. The manual suggests writing your own build script using the Rolldown API if you want more control. As a starting point, I can run each pass separately with separate Rolldown commands. 

To use Rolldown directly, I needed to add it as a direct dev dependency. 

The first pass works as expected. No faster than Rollup, presumably because most of the time is spent in the TypeScript plugin.

The second pass doesn't work at all, dying deep inside Rolldown. After chopping down the config file I came to the conclusion that it isn't compatible with `rollup-plugin-dts`.

# Rolldown DTS Plugin

It turns out there's a [replacement](https://github.com/sxzz/rolldown-plugin-dts) `rolldown-plugin-dts`. 

```
% pnpm add -D -w rolldown-plugin-dts
✓ Lockfile passes supply-chain policies (813 entries in 6.1s)
[WARN] 1 deprecated subdependencies found: @types/parse-path@7.1.0
Progress: resolved 845, reused 0, downloaded 0, added 0, done

devDependencies:
+ rolldown-plugin-dts ^0.28.1

Packages: +10
Done in 6.7s using pnpm v11.21.0
```

Even better, it handles generation of the intermediate `.d.ts` files for you. It looks like we should be able to build everything using a single pass.

```js
import { defineConfig } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'
import path from "path";

const isExternal = (id) => !id.startsWith(".") && !path.isAbsolute(id);

export default defineConfig({
  input: "src/index.ts",
  external: isExternal,
  output: [
    {
      sourcemap: true,
      dir: "dist",
      format: "es"
    },
  ],
  plugins: [dts({ tsconfig: "./tsconfig.build.json" })]
})
```

It works, or at least looks like it does.  It generates the expected `index.js`, `index.js.map` and `index.d.ts`. There's even an option to generate an `index.d.ts.map` which I was never able to do before.

Unfortunately, the `index.d.ts` is buggy. The package I tested it with imports a type from another package and re-exports it. The export is missing from the Rolldown build. Looking at [open issues](https://github.com/sxzz/rolldown-plugin-dts/issues) for `rolldown-plugin-dts`, there are lots of problems related to exports.

I guess the Rolldown tooling isn't mature enough yet for my purposes. I kept the option to perform a Rolldown build so that I can easily try again in future, and left the existing Rollup build in place for now.

# TypeScript 6

*This time the `pnpm upgrade` works without any dependency issues. I use `tsc` to typecheck all my source files and immediately hit my first TypeScript 6 error.

```
│ error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.
```

This is an option in my root tsconfig file

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@candidstartup/*": ["packages/*/src"]
    }
  }
}
```

When I initially set this up, `baseUrl` was a required option if you wanted to use the `paths` option. Now, they tell me to remove it and add the `baseUrl` prefix to each path.

```json
{
  "compilerOptions": {
    "paths": {
      "@candidstartup/*": ["./packages/*/src"]
    }
  }
}
```

On to the next error.

```
│ src/App.tsx(2,8): error TS2882: Cannot find module or type declarations for side-effect import of '@candidstartup/react-spreadsheet/VirtualSpreadsheet.css'.
│ src/App.tsx(3,8): error TS2882: Cannot find module or type declarations for side-effect import of './App.css'.
```

This is caused by the following statements in one of my React sample apps.

```ts
import '@candidstartup/react-spreadsheet/VirtualSpreadsheet.css';
import './App.css';
```

Obviously, these imports aren't TypeScript source code. They're a signal to the bundler to include these CSS files when the application is built. In previous versions of TypeScript these "side-effect imports" were ignored by the compiler. Now you need to tell the compiler to ignore them. The recommended approach is to add a generic module declaration to a `.d.ts` file that is pulled into each compile. Luckily, I already have one of those for CSS modules which is easy to extend.

```ts
declare module '*.module.css' {
  const content: Record<string, string>;
  export default content;
}

// Recognize all CSS files as module imports.
declare module "*.css" {}
```

With that change all files pass type checking. I run into another problem when I try to build a package.

```
% pnpm run build              
$ rollup -c ../rollup.config.mjs

src/index.ts → dist...
(!) [plugin typescript] @rollup/plugin-typescript TS5011: The common source directory 
of 'tsconfig.build.json' is './src'. The 'rootDir' setting must be explicitly set to 
this or another path to adjust your output's file layout.
```

The `rootDir` option used to be optional. It specifies the root directory that includes all the source code that the compiler will see. The compiler would previously evaluate all the include patterns that you specified for input and work out the most specific directory that included all the source files it found. Apparently, this takes a significant amount of time on large projects, so now you have to specify it explicitly.

It's easy enough for my root `tsconfig.json`, used for general purpose tooling like VS Code. The root dir is just the root dir for my entire monorepo.

```json
{
  "compilerOptions": {
    "rootDir": "./",
    "paths": {
      "@candidstartup/*": ["./packages/*/src"]
    }
  }
}
```

When building packages, `rootDir` has another purpose. The output generated into your `dist` directory matches the input directory structure relative to `rootDir`. If you want sensible output, you need to set `rootDir` to your `src` directory. Relative paths are evaluated relative to the tsconfig where they're declared, which means updating the stub `tsconfig.build.json` files for each of my packages.

```json
{
  "extends": "../tsconfig.build.json",
  
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },

  "include": ["src"],
  "exclude": ["src/*.test.*", "src/test"],
}
```

# Dependabot

The repo is in a much healthier state but I'm still not getting minor update PRs from dependabot. Apparently, dependabot pauses automated checks if there are too many errors or too many ignored PRs. I went to "Insights -> Dependency Graph -> Dependabot" and used the manual "Check for Updates" button. 

That generated a PR with the 11 minor updates released since I started this process. The build matrix completed successfully. I just need to commit the PR. That should unpause the weekly automated checks too.

# Conclusion

That'll do for now. Hopefully, I can get back to a normal update cadence now.
