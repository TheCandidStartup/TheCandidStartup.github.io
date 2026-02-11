---
title: Securing my NPM Supply Chain
tags: frontend
---

wise words

* Lots of supply chain attacks
* Current update process is to run `npm update` on an ad hoc basis
* Not smart
* Pushed provenance as a solution. But I'm not checking it when I install packages.
* Still low uptake. Only 10% of InfiniSheet dependencies have provenance

* Crappy tooling - `npm audit signatures` is all there is in npm

```
% npm audit signatures
audited 1175 packages in 9s

1175 packages have verified registry signatures

142 packages have verified attestations
```

* No way to require packages have valid provenance
* Would need list of packages to check given low uptake
* Simplest option for consumer is to require provenance for new version of package if existing version has it (with some way of being able to force install)

* Most attacks have a [short window](https://blog.yossarian.net/2025/11/21/We-should-all-be-using-dependency-cooldowns) between publishing a compromised package and discovery. Often within hours.
* You get hit if you're unlucky enough to run `npm update` during that window.
* Simple mitigation is to wait before installing recently published packages
* `npm install` has a `--before` flag that lets you specify an absolute date when packages need to have been published by. However, its not available for `npm update`.

* I almost resigned myself to writing my own utilities when I remembered to do an internet search first. Unsurprisingly, there are lots of existing tools than can help.

# GitHub Dependabot

* Automation integrated into GitHub that can identify dependencies with known security issues and identify dependencies with newer versions. In both cases, you can configure it to create PRs with updated versions. Crucially, there is a [cooldown](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#cooldown-) option that lets you specify how many days to wait after a package is published before updating to it.
* Already on when I followed instructions to enable it
* As I have touched Infinisheet repository in six months there were a few security alerts present in the GitHub UI
* Don't understand why I didn't receive email notification of new alerts. Configured in my notification settings.
* Haven't set up any specific GitHub permissions as I'm the CandidStartup organization owner
* Just in case I went belt and braces and explicitly gave myself the all repo admin role on the organization and then also explicitly gave myself access to security alerts. 
* Each security alert contains a load of detail on the vulnerability and how to remediate

{% include candid-image.html src="/assets/images/github/dependabot-security-alert.png" alt="Dependabot Security Alert" %}

* By default this is for information only. However, in many cases you can push a button that generates a pull request to patch the problem.
* Uses GitHub actions to create, so can take a few minutes to find a runner. Can also configure dependabot to automatically create pull requests.
* In most cases the change is just an update to your package manager's `package-lock` file. However, nice to have the audit trail.
* Creating a PR will kick off your build workflow so you get confirmation that the update is OK without having to build locally first.
* Commits messages follow conventional commits standard. You can customize the prefixes used via options.
* If you use "Squash & Merge" option when approving PR end up with a single commit with a reasonable comment.
* Can configure dependabot to create PRs for general version updates
* Set up to automatically create and validate PRs for minor updates, previously done ad hoc with "npm update"
* Should have got everything up to date *before* enabling dependabot
* Too many changes
* Painful when it fails
* Edit config file to restrict updates to packages likely to be a problem, wait for bot to run again, repeat.
* No access to details of failures
* Ignores constraints in `package.json`. I currently have storybook locked to version 8.6.4 because later versions have a bug that broke one of my stories. Dependabot created a PR to update to latest 8.6.14.
* Can ignore and unignore dependencies in the group via comments on the pull request. At first after ignore it looked like nothing happened but after a few minutes the original PR was closed and a new one created, kicking off the CI pipeline again.
* Initially thought ignore/unignore were local to the PR being worked on. However, it appears to be a global effect with no visibility of what overrides are in effect. I used `@ignore @microsoft/api-extractor`. In dependabot logs for subsequent runs I found

```
updater | 2026/02/10 10:50:29 INFO <job_1239501723>   > 7.52.11 - from @dependabot ignore command
  proxy | 2026/02/10 10:50:29 [044] GET https://registry.npmjs.org/@microsoft%2Fapi-extractor
  proxy | 2026/02/10 10:50:29 [044] 200 https://registry.npmjs.org/@microsoft%2Fapi-extractor
updater | 2026/02/10 10:50:29 INFO <job_1239501723> All updates for @microsoft/api-extractor were ignored
```

* In future should sort out locally as soon as Dependabot CI run fails
* No notification from GitHub when PRs created, presumably because no reviewer or assignee
* Only way I could find to assign myself to created PRs is using third party `auto-assign-action` GitHub action
* By this time I noticed that I still wasn't getting notifications for new security alerts, so I enabled auto-create of PRs for security updates too. At least the `assigned as reviewer to PR` notifications are coming through.

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
    cooldown:
      default-days: 7
    groups:
      minor-version-updates:
        applies-to: version-updates
        update-types:
          - "minor"
          - "patch"
    ignore:
      - dependency-name: "typedoc*"
        update-types: ["version-update:semver-minor"]
      - dependency-name: "typescript"
        update-types: ["version-update:semver-minor"]
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

# Lerna

* Reducing number of dependencies reduces surface area for supply chain attack
* Lerna pulls in a huge number of dependencies, including Nx
* Lerna has policy of pinning exact versions of all its dependencies which often causes conflicts, particularly because Lerna is slow to update dependencies
* Getting fed up of upselling. Every time I make a change which causes a build to fail, Lerna tells me that it's detected a flaky build and suggests moving to a paid for product.
* Overkill for the simple monorepo functionality I need - run command in each workspace in topological order, version, publish
* Replace with lerna-lite which is much more focused and modular. Can install support for just the lerna commands you use

```
% npm uninstall lerna

removed 495 packages, and audited 661 packages in 6s
```

* Removed nearly half my dependencies

```
% npm install -D @lerna-lite/cli @lerna-lite/run @lerna-lite/version @lerna-lite/publish

added 295 packages, removed 3 packages, changed 3 packages, and audited 953 packages in 11s
```

* And added most of them back again. Sigh.

# pnpm

* [pnpm](https://pnpm.io/) is an alternative package manager in npm ecosystem
* Main difference is a global deduplicated cache of all package versions used on a machine
* `node_modules` for each repo uses links into the central package store
* Less storage required and much faster
* Natural package hierarchy in monorepo with dedicated node_modules for each package's dependencies. Avoids the problem with npm where you can depend on a package pulled into the monorepo by something else without it being included in your own `package.json`
* Faster delivery of new features than npm
* Including, for most recent versions, a cooldown implementation *and* option to block install of package versions where provenance has been downgraded, together with many other features that [mitigate supply chain attacks](https://pnpm.io/supply-chain-security).
* When I set my monorepo up didn't see any reason to use a non-default package manager. That's changed. Time to make the switch.

# Planning

* Didn't think I'd spend so much time thinking about how to install pnpm
* Your package manager can't install itself
* Not an issue for npm as it's bundled with NodJS
* pnpm [documentation](https://pnpm.io/installation) lists 10 different ways of installing it, including using npm
* One of the options is [Corepack](https://github.com/nodejs/corepack#readme) which is described as a NodeJS package manager manager
* Has sparked a [heated debate](https://socket.dev/blog/node-js-takes-steps-towards-removing-corepack) in the NodeJS community between those that want to make corepack mandatory and stop bundling npm, and those that want to keep npm and make corepack optional.
* Latter group seem to have won with [corepack being removed](https://socket.dev/blog/node-js-tsc-votes-to-stop-distributing-corepack) from Node 25 onwards.
* I already use [asdf]() as a tool version manager on my development machine to manage NodeJS versions, I don't need another one.
* There is an asdf plugin for pnpm so can use that locally
* Make it a bit more explicit by setting version to use per repo (stored in `.tool_versions` file) rather than relying on per user setting
* Using GitHub Actions for CI where runner gets setup with specific versions based on a build matrix
* pnpm provides a [setup action](https://github.com/pnpm/action-setup) which installs a specified version of pnpm and integrates with GitHub Actions caching

# Installing pnpm

```
% asdf plugin add pnpm
updating plugin repository...remote: Enumerating objects: 1994, done.
remote: Counting objects: 100% (1052/1052), done.
remote: Compressing objects: 100% (70/70), done.
remote: Total 1994 (delta 1034), reused 982 (delta 982), pack-reused 942 (from 4)
Receiving objects: 100% (1994/1994), 590.71 KiB | 12.57 MiB/s, done.
Resolving deltas: 100% (1193/1193), completed with 24 local objects.
From https://github.com/asdf-vm/asdf-plugins
   8b3d536..c0369a1  master                                       -> origin/master
 * [new branch]      dependabot/github_actions/actions/checkout-6 -> origin/dependabot/github_actions/actions/checkout-6
 * [new branch]      dependabot/github_actions/amannn/action-semantic-pull-request-6.1.1 -> origin/dependabot/github_actions/amannn/action-semantic-pull-request-6.1.1
 * [new branch]      dependabot/github_actions/asdf-vm/actions-4  -> origin/dependabot/github_actions/asdf-vm/actions-4
HEAD is now at c0369a1 feat: add yasm plugin (#1087)

% asdf plugin list
nodejs
pnpm
ruby
```

* Don't know what all that branch stuff is but it seems to have added the plugin

```
% asdf install pnpm latest
Downloading pnpm v9.15.9 from https://registry.npmjs.org/pnpm/-/pnpm-9.15.9.tgz
```

* Weird, pnpm 10.28 is latest and the one I want for all the supply chain security stuff
* `asdf list all pnpm` displays a long list of available versions up to 10.28.2

```
% asdf install pnpm 10.28.2
Downloading pnpm v10.28.2 from https://registry.npmjs.org/pnpm/-/pnpm-10.28.2.tgz
```

```
% asdf local nodejs 22.22.0
% asdf local pnpm 10.28.2
```

* I haven't upgraded asdf for a while and got confused because most recent version changed `asdf local` to `asdf set` and I was looking at the wrong docs when trying to refresh my memory of how to define per repo versions.

```
% pnpm -v
 WARN  The "workspaces" field in package.json is not supported by pnpm. Create a "pnpm-workspace.yaml" file instead.
10.28.2
```

* OK, ready to start migrating

# Migrating from npm

* No recipe in the pnpm docs
* Found [helpful article](https://britishgeologicalsurvey.github.io/development/migrating-from-npm-to-pnpm/) which pointed me in right direction
* Delete `node_modules`
* Add `pnpm-workspace.yaml` and configure as required
  * Define `packages` for monorepo
  * `linkWorkspacePackages` to use local packages defined in workspace rather than downloading from npm
* `pnpm import` to convert npm lock file to pnpm
* `pnpm install` to install dependencies (add `--frozen-lockfile` if you want it to work like `npm ci`)
* Replace any `npm` commands in scripts with `pnpm` equivalents
* Prevent inadvertent use of npm commands
  * Add `preinstall` and `preupdate` script with `npx only-allow pnpm` which errors when you run `npm install` or `npm update`
  * Hack `engines` field in `package.json` to specify non-existent version of npm + create `.npmrc` file containing `engine-strict - true`
* Ideally replace dependencies on other workspace packages with `workspace:*` to ensure they always resolve to current version in workspace. Once done can remove `linkWorkspacePackages` option
* Use catalogs to replace duplicated dependencies for workspace packages

* Before doing anything else I tried to put protections in place against using npm by mistake. Could not get `only-allow` to work. Was fine when executed directly in terminal but would not work when run as an npm script. Kept reporting `sh` errors when trying to run command.
* Did the engines + `.npmrc` hack instead. Certainly stops `npm install` and `npm update` from working.

```
  "engines": {
    "node": ">= 20",
    "npm": "Please use pnpm instead of npm to install dependencies",
    "yarn": "Please use pnpm instead of yarn to install dependencies",
    "pnpm": ">= 10"
  },
```

```
% pnpm import
 WARN  2 deprecated subdependencies found: glob@10.5.0, tar@7.5.4
Progress: resolved 910, reused 0, downloaded 0, added 0, done
```

* I know about tar security vulnerability, haven't applied patch yet
* Old version of glob is news to me. Turns out to be a sub-dependency of a sub-dependency of Storybook. Also in my old npm `package-lock.json` but npm didn't warn me about it.

```
% pnpm install                  
Scope: all 9 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +827
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Downloading storybook@9.1.17: 9.91 MB/9.91 MB, done
Downloading @swc/core-darwin-arm64@1.15.11: 9.29 MB/9.29 MB, done
Progress: resolved 827, reused 0, downloaded 827, added 827, done

devDependencies:
+ @eslint/js 9.39.2
+ @gordonmleigh/rollup-plugin-sourcemaps 0.1.2
+ @lerna-lite/cli 4.11.0
+ @lerna-lite/publish 4.11.1
+ @lerna-lite/run 4.11.1
+ @lerna-lite/version 4.11.1
+ @microsoft/api-extractor 7.55.2
+ @playwright/test 1.58.0
+ @rollup/plugin-typescript 12.3.0
+ @storybook/addon-docs 9.1.17
+ @storybook/react-vite 9.1.17
+ @testing-library/dom 10.4.1
+ @testing-library/jest-dom 6.9.1
+ @testing-library/react 16.3.2
+ @testing-library/user-event 14.6.1
+ @types/node 22.19.7
+ @types/react 18.3.24
+ @types/react-dom 18.3.7
+ @types/react-window 1.8.8
+ @vitejs/plugin-react-swc 4.2.3
+ @vitest/coverage-istanbul 4.0.18
+ @vitest/coverage-v8 4.0.18
+ @vitest/ui 4.0.18
+ eslint 9.39.2
+ eslint-plugin-react 7.37.5
+ eslint-plugin-react-hooks 7.0.1
+ eslint-plugin-react-refresh 0.5.0
+ eslint-plugin-storybook 9.1.17
+ globals 17.3.0
+ jsdom 28.0.0
+ jsdom-testing-mocks 1.16.0
+ neverthrow 8.2.0
+ path 0.12.7
+ react 18.3.1
+ react-dom 18.3.1
+ rimraf 6.1.2
+ rollup 4.57.0
+ rollup-plugin-delete 3.0.2
+ rollup-plugin-dts 6.3.0
+ rollup-plugin-peer-deps-external 2.2.4
+ storybook 9.1.17
+ typedoc 0.28.16
+ typedoc-plugin-coverage 4.0.2
+ typedoc-plugin-extras 4.0.1
+ typescript 5.8.3
+ typescript-eslint 8.54.0
+ vite 7.3.1
+ vite-tsconfig-paths 6.0.5
+ vitest 4.0.18

╭ Warning ───────────────────────────────────────────────────────────────────────────────────╮
│                                                                                            │
│   Ignored build scripts: @swc/core@1.15.11, esbuild@0.25.9, esbuild@0.27.2.                │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.   │
│                                                                                            │
╰────────────────────────────────────────────────────────────────────────────────────────────╯
Done in 9.9s using pnpm v10.28.2
```

* esbuild and swc are bundlers used by Vite. Both have good reasons for post-install scripts and both packages have provenance. Plus npm already ran these.

```
pnpm approve-builds
✔ Choose which packages to build (Press <space> to select, <a> to toggle all, <i> to invert selection) · @swc/core, esbuild
✔ The next packages will now be built: @swc/core, esbuild.
Do you approve? (y/N) · true
node_modules/.pnpm/@swc+core@1.15.11/node_modules/@swc/core: Running postinstall script, done in 442ms
node_modules/.pnpm/esbuild@0.27.2/node_modules/esbuild: Running postinstall script, done in 651ms
node_modules/.pnpm/esbuild@0.25.9/node_modules/esbuild: Running postinstall script, done in 850ms
```

* Updates to package.json scripts
  * Replace `npx lerna run` with `pnpm run -r`
  * Replace `npx` with `pnpm exec`
  * Replace `npm run` with `pnpm run`
  * Remove `--` from run scripts. With pnpm all arguments before the script name are passed to pnpm while all arguments after are passed to the script.
  * Replace `npx lerna publish ...` with `pnpm -r publish`
* If it all works won't need lerna-lite run and publish modules any more.

* Build worked fine apart from one sample app that couldn't resolve imports. Turns out I hadn't included all dependencies. Classic mistake that npm hides.
* Remember to run `pnpm install` after adding missing dependency to package.json to add missing link to `node_modules`
* Unit tests didn't work. Couldn't resolve an import from `@candidstartup/infinisheet-types` from common test code in shared/test. This code is automatically pulled into each test via the `setupFiles` option in my vitest config. Cross package imports from source code inside packages works fine.
* Best guess is that these imports worked previously by resolving via `node_modules`. With npm all local packages are linked into the root `node_modules`, with pnpm they're only linked into `node_modules` for packages that depend on them. Code outside the scope of a package resolves via root `node_modules` so doesn't work.
* Shouldn't need this. Everything resolves fine in VSCode because I have path aliases for `"@candidstartup/*": ["packages/*/src"]` in my tsconfig.json. I use the `vite-tsconfig-paths` plugin so that vitest can use path aliases in the same way. Clearly not working. Then realized that when I set up monorepo, I only included the plugin in the config for apps, once I added it to the package config it started working.
* ??? Need to test version and publish, then remove lerna-lite modules

# GitHub Actions

* Setup for my Build CI action

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [22.x, 24.x]
        react-version: [18, 19]
    name: Node ${{ matrix.node-version }} - React ${{ matrix.react-version }}

    steps:
    - uses: actions/checkout@v4
    - name: Install pnpm
      uses: pnpm/action-setup@v4
      with:
        version: 10
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - name: Use React ${{ matrix.react-version }}
      if: ${{ matrix.react-version == 19 }}
      run: pnpm -r update react@19 react-dom@19 @types/react@19 @types/react-dom@19
```

* Added pnpm install using `pnpm/action-setup@v4`
* Make sure you change `cache` config when setting up Node to `pnpm`
* `pnpm install` defaults to `--frozen-lockfile` (equivalent to `npm ci`) in CI environments. Wanted to call it out explicitly.
* Matrix of supported Node and React versions
* Installs the corresponding version of Node
* React 18 is embedded in pnpm lock file and `package.json`. If React 19 wanted, upgrade as final step.
* React 18 builds work, React 19 fail in unit tests for `react-virtual-scroll` and `react-spreadsheet` with multiple errors which suggest mismatched/multiple versions of React in use.

# Peer Dependencies

* Both packages specify React as a peer dependency. 
* They're library packages. Don't want to force our choice of React version onto app author.
* How can unit tests run if React is a peer dependency?
* Modern package managers install missing peer dependencies by default
* The problem is that pnpm [doesn't](https://github.com/pnpm/pnpm/issues/9900) [upgrade](https://github.com/pnpm/pnpm/issues/8081) peer dependencies
* Lots of worrying comments on those issues, suggesting manually fixes, or deleting lock file and installing from scratch
* I found a simpler fix. When you think about it, React is both a dev dependency (needed to build against and run unit tests) and a peer dependency (consumer supplies their own version of React).

```json
{
  "peerDependencies": {
    "react": "18 - 19"
  },
  "devDependencies": {
    "react": "^18.2.0"
  },
}
```

* Specifying both seems to do the trick

# Mitigating Supply Chain Attacks

* Turn all the options on
* Forced review and whitelist of dependencies that require scripts is on by default

```yaml
blockExoticSubdeps: true
minimumReleaseAge: 10080
trustPolicy: no-downgrade
```

* `minimumReleaseAge` is the equivalent of dependabot's `cooldown` but in minutes rather than days
* Failing dependabot with pnpm error

```
ERR_PNPM_NO_MATCHING_VERSION  No matching version found for tldts@7.0.22 while fetching it from https://registry.npmjs.org/
```

* Version does exist but was released a few hours less than 7 days ago
* Earlier releases of pnpm use this confusing error message if asked to install a version more recent than minimum release age
* Dependabot is still using pnpm 10.16 (latest is 10.29)
* Weird thing is that according to dependabot logs it was running `pnpm update rollup@4.57.1 --lockfile-only` and `tldts` isn't in the dependency tree for rollup.
* In fact, same error shows up multiple times all for packages that don't use `tldts`
* If I run same update command on my machine it works
* If I set pnpm version to 10.16 it fails but with a different error
* Going to put this down to dependabot using a massively outdated version of pnpm 10.
* Open PR to update to 10.23, seemingly abandoned waiting for review
* For now forget about dependabot, see how easy it is to do manually
* `pnpm pnpm -r update --no-save` (updates lockfile and node modules but leaves specifies in package.json as is)

```
 ERR_PNPM_TRUST_DOWNGRADE  High-risk trust downgrade for "@storybook/react-vite@9.1.17" (possible package takeover)
```

* No provenance for the previous version. 
* There's a [long thread](https://github.com/pnpm/pnpm/issues/10202) discussing similar issues where patch release for previous major version that didn't have provenance is treated as a downgrade because it was published after a later major version that did have provenance.
* As far as I can tell, Storybook has never published packages with provenance. This one was published two months ago and I don't see any provenance on any more recent version.
* There is an option to ignore trust policy check beyond a certain age to ease transition. Added `trustPolicyIgnoreAfter: 43200` to allow anything older than a month. After that, the update worked.
* Looking at changes made I see that `tldts` has been downgraded from 7.0.22 to 7.0.21. Then I realized. I must have already installed 7.0.22 manually with npm before upgrading to pnpm. The minimum release age constraint is also applied to stuff that's already installed.
* Lots of updates being done. I think pnpm is updating all transitive dependencies. It looks like npm only updates transitive dependencies if the parent dependency was updated.

# Version and Publish

* After all that versioning (using lerna-lite) and publishing (using pnpm via GitHub Actions trusted publisher) worked without a hitch
* Can now remove `lerna-lite-run` and `lerna-lite-publish` as no longer needed

```
pnpm remove -r @lerna-lite/run @lerna-lite/publish
Scope: all 9 workspace projects
.                                        |  -53 -----
.                                        |   +2 +
Progress: resolved 862, reused 779, downloaded 0, added 2, done
```

* Getting rid of 53 packages is great but why have 2 been added?
* As far as I can tell, they haven't. The lock file shows lots of packages being removed and some changes to remaining 2 lerna packages to remove dead dependencies. 
 
# Dependabot Woes

* Dependabot ignores cooldown when applying security fixes, no equivalent for pnpm
* Now that pnpm is setup, dependabot will fail to create security fix PR if younger than pnpm minimum release age
* Can manually add exception for that specific version but it's a pain

* Dependabot not great at dealing with chains of dependencies when using pnpm to apply security fix
* Vulnerability in @isaacs/brace-expansion 5.0.0, fixed in 5.0.1
* Dependabot tries to use `pnpm update @isaacs/brace-expansion@5.0.1` but that fails because version 5.0.0 is pinned by minimatch 10.1.1. This is fixed by minimatch 10.1.2. There's no constraint preventing update but because dependabot has limited update to brace-expansion it fails.
* Running `pnpm update` manually sorted it out
* Still have problem that I can't get GitHub to notify me when new security alert found. Have to rely on creation of PR indirectly notifying me. No notification if PR creation fails.

* Hoping situation will improve as dependabot catches up with rapid progress made by pnpm.
