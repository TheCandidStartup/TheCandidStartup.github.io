---
title: >
  InfiniSheet: Chore Updates with pnpm
tags: infinisheet
thumbnail: /assets/images/frontend/npm-package.png
---

wise words

* Glut of dependabot security alerts
* All in dev dependencies, most transitive dependencies of my dev tooling
* No risk for consumers of my packages, so not too concerned
* Waiting for alerts to close out as my direct dev dependencies release updates
* Taking ages, some weeks have 20+ open security alerts
* Time to take a look for myself

# Minor Updates

* Direct dependency minor updates handled well by weekly dependabot run
* Takes a couple of minutes to review and commit the PR. That's it.

# Transitive Dependencies Inconsistently Updated

* Can get in state where transitive dependency can be updated to a fixed version without violating any constraints but hasn't
* Example with `picomatch` security issue fixed in `4.0.4`. For most dependents, pnpm has already updated to `4.0.4`. However, for Vite it's left at `4.0.3`

```
vite 7.3.1
├─┬ fdir 6.5.0
│ └── picomatch 4.0.3 peer
├── picomatch 4.0.3
└─┬ tinyglobby 0.2.15
  ├─┬ fdir 6.5.0
  │ └── picomatch 4.0.4 peer
  └── picomatch 4.0.4
```

* Vite `package.json` specified dependency on picomatch `^4.0.3`. Nothing stopping use of `4.0.4`
* Weirdly, Vite also has a dependency on `tinyglobby` which has its own dependency on `picomatch`. In this case pnpm has updated to `4.0.4`. The specified dependency is also `^4.0.3`.
* `pnpm update picomatch` says everything is up to date, no changes needed, as does `pnpm update picomatch@4.0.4`
* Vite has a direct dependency on `picomatch`. It also has a dependency on `fdir` which in turn has a peer dependency on `picomatch`.

# pnpm Overrides

* The best [fix](https://blog.logto.io/pnpm-upgrade-transitive-dependencies) I could find was to use pnpm's [overrides](https://pnpm.io/settings#overrides) feature
* This is normally used to forcibly change how a dependency is resolved without having to hack its package.json
* In this case we use override to gently encourage pnpm to do an update it should already have done

* Overrides are applied in the `pnpm-workspace.yaml` file

```
overrides:
  "vite>picomatch": 4.0.4
```

* You can apply an override globally, to all uses of a package, or to a specific dependency relationship. Here, I've restricted the override to Vite's use of picomatch. 

```
% pnpm install
Packages: -2
```

* This time `pnpm-lock.yaml` is updated and I can see that `picomatch 4.0.3` is no longer used
* The interesting thing is that you can now remove the override from `pnpm-workspace.yaml`. It was only needed to nudge pnpm to use the version it should have picked up anyway. Now that it's found the correct version it won't downgrade to an earlier version.

```
% pnpm install
Already up to date
```

* Used the same track for minimatch and handlebars

# jsdom

* Upgrade from 28.x to 29.x was enough to update another transitive dependency with `undici` security alerts
