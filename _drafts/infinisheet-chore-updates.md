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

# Dependabot

* Link to supply chain post
* Set up to automatically create and validate PRs for minor updates, previously done ad hoc with "npm update"
* Should have got everything up to date *before* enabling dependabot
* Too many changes
* Painful when it fails
* Edit config file to restrict updates to packages likely to be a problem, wait for bot to run again, repeat.
* No access to details of failures
* In future should sort out locally as soon as Dependabot CI run fails

# API Extractor

* Both excluded from Dependabot minor updates after build failures
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
