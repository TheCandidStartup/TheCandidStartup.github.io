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

# Lerna-Lite

* Major version update because Node 22 is now minimum dependency. Matches what I already do.

```
% pnpm update --latest @lerna-lite/cli @lerna-lite/version
 WARN  3 deprecated subdependencies found: @types/parse-path@7.1.0, glob@10.5.0, tsconfck@3.1.6
Progress: resolved 846, reused 0, downloaded 0, added 0, done
Packages: +83 -179
Done in 4.3s using pnpm v10.28.2
```

* Looks like lerna-lite has lost some weight, which is great

# jsdom

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

# Testing Library

* `@testing-library/jest-dom` has a new major version because `@testing-library/dom` is now a peer dependency. I already have it as a direct dev dependency so nothing else needed.

```
% pnpm update --latest @testing-library/jest-dom
 WARN  4 deprecated subdependencies found: @testing-library/jest-dom@6.10.0, @types/parse-path@7.1.0, glob@10.5.0, tsconfck@3.1.6
Progress: resolved 798, reused 0, downloaded 0, added 0, done
Packages: +68 -119
Done in 1.6s using pnpm v10.28.2
```

