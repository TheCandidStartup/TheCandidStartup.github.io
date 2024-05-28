---
title: Bootstrapping GitHub Actions
tags: frontend
---

wise words

* Want to make sure that I keep on top of build quality
* Best way is to automate
* Time to setup automated build and testing

# GitHub Actions

* First thing to look at is [GitHub actions](https://github.com/features/actions) - automation system built into GitHub
* Two initial questions to answer
  * Is it general purpose enough to run my build and test?
  * Is it restricted for free use?
* Cost first. Github actions is [free](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions) for public repos using the [standard GitHub-hosted runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners/about-github-hosted-runners). Runners are VMs with a choice of Ubuntu Linux, Windows or MacOS preinstalled.
* The documentation describes lots of different workflow scenarios including [Build & Test for Node.js](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs) stacks. Each scenario has a corresponding [starter workflow template](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs#using-a-nodejs-starter-workflow).

# Starter Workflow 

* I followed the instructions to create a new workflow from the starter template and to edit it to meet my requirements.
* The workflow lets you build and test on multiple versions of Node. I'm currently on Node 18 which is now in "Maintenance LTS". Node 20 is now the "Active LTS" version. Makes sense to test with both.
* I'm using Lerna to run build and tests so I needed to change the npm commands for build and run.

Here's the starter workflow after tweaking node versions and npm commands to build and run tests

```
# This workflow will do a clean installation of node dependencies, cache/restore them, 
# build the source code and run tests across different versions of node

name: Build CI

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build:

    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]
        # See supported Node.js release schedule at https://nodejs.org/en/about/releases/

    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run lerna-build
    - run: npm run lerna-test
```

* The starter workflow uses `npm ci` rather than `npm install` to install dependencies. This command is designed for continuous integration scenarios. It performs a clean install of all dependencies specified in `package-lock.json`. It's completely repeatable. No changes are made to `package.json` or `package-lock.json`. Dependencies are fixed.

# First Run

* I committed my tweaked workflow. Nothing seemed to happen. However, when I went back to the `Actions` tab in GitHub I saw this.

{% include candid-image.html src="/assets/images/github/actions.png" alt="GitHub Actions tab" %}

* It appears to have worked first time. And super quick too. Just 42 seconds to build and test on two different versions of Node. The workflow includes a caching mechanism for dependencies so it should be even quicker next time. 
* I was confused at first by the `Event`, `Status`, `Branch` and `Actor` buttons. They look like column headings but the workflow properties below don't line up. They're filters on properties that are there but mostly formatted so they don't jump out. 
* Let's dig deeper.

{% include candid-image.html src="/assets/images/github/workflow-run.png" alt="GitHub Workflow Run" %}

* Drilling one click down doesn't reveal much extra detail. The workflow properties are more explicit. We can see the two separate builds on Node 18 and Node 20. And there's two weird warnings about Node 16. We didn't ask for a build on Node 16.
* Let's come back to those warnings. First, what can we see if we drill into one of those jobs.

{% include candid-image.html src="/assets/images/github/workflow-logs.png" alt="GitHub Workflow Job Logs" %}

* Lots of detail now. We can browse and search all the output from our scripts. The logs are presented in a super accessible way. First, divided into sections for each step of the job. Then within each section preserving any color coding and auto-collapsing indented lines into sub-sections. 

# Badges

{% include candid-image.html src="/assets/images/github/workflow-badge.png" alt="GitHub Workflow Badge" %}

* GitHub has its own built in badge for displaying the status of the most recent completed workflow run. Naturally, my next step was to add one to my README. 
* Coverage results are available in the logs if you drill down far enough. It would be nice to have a "Coverage" badge. GitHub doesn't have anything beyond the overall workflow status. [Shields.io](https://shields.io/badges) has support for dedicated Code Coverage services but nothing for extracting values from GitHub Actions logs.
* There are generic badges that can extract values from structured file formats like JSON, XML and YAML. I know that Vitest code coverage can [produce](https://vitest.dev/config/#coverage-reporter) summary JSON results files. Can I combine the two?
* First problem is getting the JSON file off the runner and somewhere that shields.io can access it.
* GitHub actions allows you to upload workflow output as an [artifact](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts) associated with the workflow. 
* Doesn't help. 
  * Artifacts are stored as compressed ZIP files, JSON file can't be directly accessed.
  * Artifacts are only accessible if you're logged into GitHub (even for public repos). No good for casual README browsers.
  * There's no simple URL for accessing named artifact from latest run. You need to use GitHub API to get id of latest workflow then get list of artifacts and grab the one you want. 
* The only thing I can think of is to run a post-build script that copies the coverage files into the repo and commits them. There's a handy [`Git Auto Commit`](https://github.com/marketplace/actions/git-auto-commit) action that does most of the work for you. I did worry that might set off a recursive build loop. Fortunately, GitHub [prevents](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow) this. Commits performed by a workflow won't trigger further workflow runs. 
* In the end it seems like far more trouble than its worth. Let's leave it for now. 


# Second Run

Adding a badge to my README triggered another build. Which let's us have a look at the effect of caching.

| Build Step | First Run | Second Run |
|------------|-----------|------------|
| Set up job |        1s |         1s |
| Checkout   |        1s |         0s |
| Setup Node |        1s |         2s |
| npm ci     |        9s |         6s |
| npm build  |        7s |         7s |
| npm test   |        5s |         5s |
| Post Node  |        4s |         0s |
|------------|-----------|------------|
| Total      |       30s |        23s |

* There's a small but significant improvement in speed. The time taken to install dependencies in `npm ci` is reduced from 9s to 6s. However, the caching system has it's own overheads. On the first run the `Post Node` step takes an additional 4s to create the cache. On the second run the `Setup Node` step needs an extra 1s to restore the cache. I suspect the impact will be more significant for a larger repo with more dependencies. 

# Deprecated Actions

What about those warnings? When you look more closely you see that it's complaining about the `setup-node@v3` action. Most actions are [implemented](https://docs.github.com/en/actions/creating-actions/about-custom-actions) using JavaScript running in its own Node.js environment. The `setup-node@v3` action runs on Node 16. Which is weird, because that line in the workflow comes verbatim from GitHub's own starter workflow. 

If you look at the [documentation](https://github.com/marketplace/actions/setup-node-js-environment) for the action, you see that the latest version is `v4.0.2`. Version `v4.0.0` was released in October 2023, so GitHub are a little behind in updating their starter workflows.

I updated the workflow to specify `setup-node@v4` and the warnings went away. 

# Further Work

* Long list of available scenarios and actions
* Publishing
  * More than convenience. If you build and [publish](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages) from GitHub actions you can establish the [provenance](https://docs.npmjs.com/generating-provenance-statements) of the package. NPM will verifiably link the package to the commit and workflow that built it. This is a crucial step in improving supply chain security. 
  * Can check if build was triggered by version commit and use that to decide whether to publish package
* Versioning
  * Can continue to run locally or setup a [manual workflow](https://docs.github.com/en/actions/using-workflows/manually-running-a-workflow) with form inputs that let you choose how new version should be generated
* GitHub Pages
  * Can publish GitHub pages for repo, including embedding built samples
* Linting and Prettifying
