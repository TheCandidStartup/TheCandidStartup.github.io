---
title: Bootstrapping GitHub Actions
tags: frontend
---

My monorepo is [up and running]({% link _posts/2024-05-06-bootstrapping-lerna-monorepo.md %}). I can [build]({% link _posts/2024-05-13-bootstrapping-npm-package-build.md %}), [test]({% link _posts/2024-03-18-vitest-code-coverage.md %}), [version and publish]({% link _posts/2024-05-21-bootstrapping-npm-publish.md %}) packages from my machine. However, what happens if I miss a step? How do I make sure that I keep on top of build quality?

The best way is to automate as much as possible. It's time to set up automated build and testing. 

# GitHub Actions

[GitHub Actions](https://github.com/features/actions) is an automation system built into GitHub. It would be great if I didn't have to use a separate service for [continuous integration](https://en.wikipedia.org/wiki/Continuous_integration). 

I had three initial questions that I wanted answers to. Is GitHub Actions general purpose enough to run my build and test? Would I have to change my approach? And, of course, what will it cost? 

Cost first. Github actions is [free](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions) for public repos using the [standard GitHub-hosted runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners/about-github-hosted-runners). Runners are VMs used to execute automation actions. There's a choice of Ubuntu Linux, Windows or MacOS runners. Surprisingly, you're not restricted to the Linux runner. They're all available for free. I also can't see any restrictions on workload or run time. 

The documentation describes lots of different workflow scenarios including [Build & Test for Node.js](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs) stacks. Each scenario has a corresponding [starter workflow template](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs#using-a-nodejs-starter-workflow).

A [workflow](https://docs.github.com/en/actions/using-workflows/about-workflows) is defined using a simple YAML file. Each workflow can contain multiple [jobs](https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow) that execute on a specified runner. Each job has multiple [steps](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idsteps). Steps can run commands, perform simple setup or run custom [actions](https://docs.github.com/en/actions/learn-github-actions/finding-and-customizing-actions). 

You can use actions provided by GitHub, actions created by the GitHub community, or write your own. There's a [GitHub Marketplace page](https://github.com/marketplace?type=actions) that lets you browse and search for actions. 

# Starter Workflow 

I followed the [instructions](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs#using-a-nodejs-starter-workflow) to create a new workflow from the Node.js template. You end up with a YAML file in `.github/workflows` in the root of your repo, which you can edit as required before committing. 

The workflow lets you build and test on multiple versions of Node. I'm currently on Node 18 which is now in "Maintenance LTS". Node 20 is now the "Active LTS" version. Makes sense to test with both. I'm using Lerna to run build and tests so I also needed to change the npm commands for build and run.

Here's the starter workflow after tweaking node versions and npm commands.

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

The workflow is triggered by pushes or pull requests on the main branch. The build will run anytime I make a change. 

There are two actions. The [`checkout`](https://github.com/marketplace/actions/checkout) action checks-out your repo on the runner so that the rest of the workflow can access it. The [`setup-node`](https://github.com/marketplace/actions/setup-node-js-environment) action make sure the required version of node is installed and includes functionality that can cache npm dependencies for future runs.

After that, simply add the commands you want to run.

The starter workflow uses `npm ci` rather than `npm install` to install dependencies. This command is designed for continuous integration scenarios. It performs a clean install of all dependencies specified in `package-lock.json`. It's completely repeatable. No changes are made to `package.json` or `package-lock.json`. Dependencies are fixed.

GitHub Actions pulls off the balancing act of being both incredibly simple and completely general. If it works. 

# First Run

I committed my tweaked workflow. Nothing seemed to happen. However, when I went back to the `Actions` tab in GitHub I saw this.

{% include candid-image.html src="/assets/images/github/actions.png" alt="GitHub Actions tab" %}

It appears to have worked first time. And super quick too. Just 42 seconds to commission a VM, install getting on for a thousand dependencies, build and test. On two different versions of Node. The dependency caching system means it should be even quicker next time. 

I was confused at first by the `Event`, `Status`, `Branch` and `Actor` buttons. They look like column headings but the workflow properties below don't line up. They're actually filters on properties that are there but for some reason not displayed in corresponding columns. 

Drilling one click down doesn't reveal much extra detail. The workflow properties are more explicit. We can see the two separate job runs on Node 18 and Node 20. 

{% include candid-image.html src="/assets/images/github/workflow-run.png" alt="GitHub Workflow Run" %}

There's two warnings about Node 16. Which is weird, because we didn't ask for a build on Node 16. I'll come back to the warnings. First, what can we see if we drill into one of those jobs?

{% include candid-image.html src="/assets/images/github/workflow-logs.png" alt="GitHub Workflow Job Logs" %}

There's lots of detail now. We can browse and search all the output from our commands. The logs are presented in a super accessible way. First, divided into sections for each step of the job. Then, within each section preserving any color coding and auto-collapsing indented lines into sub-sections. 

# Badges

Naturally, my first thought was to stick another badge on the README to show the build status. GitHub has its own [built in badge](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/adding-a-workflow-status-badge) for displaying the status of the most recent completed workflow run. 

{% include candid-image.html src="/assets/images/github/workflow-badge.png" alt="GitHub Workflow Badge" %}

Coverage results are available in the logs if you drill down far enough. It would be nice to surface the results with a "Coverage" badge. GitHub doesn't have anything beyond the overall workflow status. 

[Shields.io](https://shields.io/badges) has support for dedicated Code Coverage services but nothing for extracting values from GitHub Actions logs. There are generic badges that can extract values from structured file formats like JSON, XML and YAML. I know that Vitest code coverage can [produce](https://vitest.dev/config/#coverage-reporter) summary JSON results files. Can I combine the two?

The first problem is getting the JSON file off the runner and somewhere that shields.io can access it. GitHub actions allows you to upload workflow output as an [artifact](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts) associated with the workflow. 

Which doesn't help. Artifacts are stored as compressed ZIP files, the JSON file can't be directly accessed. Artifacts are only accessible if you're logged into GitHub (even for public repos). No good for casual README browsers. Finally, there's no simple URL for accessing a named artifact from the latest run. You need to use the GitHub API to get the id of the latest run, then get the list of artifacts for that run and then you can grab the one you want.

The only thing I can think of is to run a post-build script that copies the coverage files into the repo and commits them. There's a handy [`Git Auto Commit`](https://github.com/marketplace/actions/git-auto-commit) action that does most of the work for you. I did worry that might set off a recursive build loop. Fortunately, GitHub [prevents](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow) this. Commits performed by a workflow won't trigger further workflow runs. 

In the end it seems like far more trouble than it's worth. For now, I've linked the workflow status badge to the [workflow page](https://github.com/TheCandidStartup/infinisheet/actions/workflows/build.yml) in GitHub. From there it's another 3 clicks to open the latest workflow run, open one of the jobs and then open the `npm run lerna-test` step. 

# Second Run

Adding a badge to my README triggered another build. Which lets us have a look at the effect of caching.

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

There's a small but significant improvement in speed. The time taken to install dependencies in `npm ci` is reduced from 9s to 6s. However, the caching system has its own overheads. 

On the first run, the `Post Node` step takes an additional 4s to create the cache. On the second run, the `Setup Node` step needs an extra 1s to restore the cache. I suspect the impact will be more significant for a larger repo with more dependencies. 

# Deprecated Actions

What about those warnings? When you look more closely you see that it's complaining about the `setup-node@v3` action. Most actions are [implemented](https://docs.github.com/en/actions/creating-actions/about-custom-actions) using JavaScript running in its own Node.js environment. The `setup-node@v3` action runs on Node 16. Which is weird, because that line in the workflow comes verbatim from GitHub's own starter workflow. 

If you look at the [documentation](https://github.com/marketplace/actions/setup-node-js-environment) for the action, you see that the latest version is `v4.0.2`. Version `v4.0.0` was released in October 2023, so GitHub are a little behind in updating their starter workflows.

I updated the workflow to specify `setup-node@v4` and the warnings went away. 

# Further Work

Well, that was easy. Makes me want to set up loads more workflows. As well as starter workflows for [continuous integration](https://docs.github.com/en/actions/automating-builds-and-tests/about-continuous-integration), there's ones for [continuous deployment](https://docs.github.com/en/actions/deployment/about-deployments/about-continuous-deployment), [publishing](https://docs.github.com/en/actions/publishing-packages/about-packaging-with-github-actions), and [project management](https://docs.github.com/en/actions/managing-issues-and-pull-requests/using-github-actions-for-project-management). 

The [GitHub Marketplace](https://github.com/marketplace?type=actions) lists over twenty thousand actions across twenty-four categories.

Before I get carried away, I should really implement some more [`react-virtual-scroll`]({% link _topics/react-virtual-scroll.md %}) features and trigger some real builds. I'll tell you about it next time.
