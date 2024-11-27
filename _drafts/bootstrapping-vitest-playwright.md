---
title: Bootstrapping Vitest Browser Mode with Playwright
tags: frontend
---

wise words

# Browser Mode

# Playwright

# Update

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

# ESLint

* Start with ESLint. Let's get rid of those shouty deprecation warnings
* ESLint 9 makes flat config files the default. Luckily we sorted that out when first bootstrapping use of ESLint.
* `typescript-eslint` adds support for ESLint 9 in 8.0.0 so we'll need to update that at the same time
* I locked down @eslint/compat because it requires ESLint 9, can remove that restriction.
* `eslint-plugin-react-hooks` adds support for ESLint 9 in 5.0.0 so we need to update that one too
