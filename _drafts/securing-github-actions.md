---
title: Securing GitHub Actions
tags: frontend
---

wise words

* Drive to improve supply chain security by restricting ability to publish packages to GitHub actions trusted publishing
* If attackers can no longer use local compromise of a maintainer's workstation, what will they turn to instead?
* Obvious next step is to push compromised code to the repo which GitHub actions will build and publish
* Ideally would have some form of manual sign off, e.g. secure 2FA, as gate before publish workflow runs
* Currently can't use trusted publishing and 2FA together
* Also need to require 2FA so that a compromised maintainer account can't disable 2FA
* Has come up repeatedly in [GitHub community discussion](https://github.com/orgs/community/discussions/174507) on supply chain security. Hopefully will be addressed soon.
* The alternative for attackers is to compromise the build and publishing workflow itself.
* GitHub have [published a 2026 roadmap](https://github.blog/news-insights/product-news/whats-coming-to-our-github-actions-2026-security-roadmap/) for improved GitHub actions security, with changes available within 6 months.
* The big surprise for me is that contrary to what you'd expect from the trusted publishing hype, GitHub actions builds are not deterministic/reproducible. Most of the heavy lifting is done by individual actions whose code is retrieved from their own repos. Typically, version tags are used to determine the version of each action. Tags can be moved between commits so an attacker could push their own changes to a compromised action repo and then move the current release tag to the compromised version.
* Roadmap includes improvements to action dependency management as well as more fine grained permissions.
* More recently, they put out a blog post on [things that you can do now](https://github.blog/security/supply-chain-security/securing-the-open-source-supply-chain-across-github/). There is also [security guidance](https://docs.github.com/en/actions/reference/security/secure-use) in the GitHub Actions documentation.

# CodeQL Scanning

* Had been reluctant to turn this on due to past experience with automated code scanning tools
* Usually see huge numbers of false positives with significant work required to tune settings
* Enabling was easy. Went for the automated setup which suggested scanning the GitHub Actions workflows and JavaScript/TypeScript source files it found in my repo. Scans will run weekly and after every change.
* Checked back after an hour and the initial scan had completed. 

{% include candid-image.html src="/assets/images/github/github-code-scanning.png" alt="Code Scanning" %}

Click on Tools to see more information on what was scanned.

{% include candid-image.html src="/assets/images/github/codeql-scanned-files.png" alt="CodeQL Scanned Files" %}

Found two issues, in my GitHub workflows, both real ones.

# Least Privilege

* Can [restrict permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions) at the workflow or individual job level. Should give action the minimum permissions required for the job. Minimize blast radius if action compromised.
* Have two workflows with no defined permissions
* Restricted build workflow to `contents: read`
* Restricted auto assign reviewer workflow to `pull-requests: write`

# Pin Third Party Actions

* Use two third party actions. Neither has the GitHub marketplace verified creator badge.
* Replace versioning by tag

```yaml
permissions:
  pull-requests: write
steps:
  - uses: kentaro-m/auto-assign-action@v2.0.0
```

* With versioning by SHA

```yaml
    permissions:
      pull-requests: write
    steps:
      - uses: kentaro-m/auto-assign-action@f4648c0a9fdb753479e9e75fc251f507ce17bb7e # v2.0.0
```

* Pins version used to specific commit. It's helpful to include the corresponding release tag as a comment.
* To find SHA need to go to action's [repo](https://github.com/kentaro-m/auto-assign-action), then [releases](https://github.com/kentaro-m/auto-assign-action/releases), then the [commit](https://github.com/kentaro-m/auto-assign-action/commit/f4648c0a9fdb753479e9e75fc251f507ce17bb7e) corresponding to the release you want. Click on the copy icon (two squares at bottom right) to copy the full SHA. 

{% include candid-image.html src="/assets/images/github/commit-sha.png" alt="Commit SHA" %}

* You might think this will become a nightmare to maintain. However, you can [configure Dependabot](https://docs.github.com/en/actions/reference/security/secure-use#keeping-the-actions-in-your-workflows-secure-and-up-to-date) to create PRs to keep your actions up to date. Like other version updates, a branch is created and workflows triggered by code changes are run.

```yaml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:23"
    cooldown:
      default-days: 7
```

* Obviously, you've gained nothing if you just blindly upgrade. It's sensible to wait a few days as a cooldown, as well as reviewing the changes in the release.
* If your SHA references a commit with a release tag, Dependabot will create a PR to upgrade to the latest tagged commit. It will also update the tag comment to match.
* Be careful. Dependabot doesn't look for the `Latest` tag. Dependabot created a PR that would upgrade to `pnpm/action-setup` v6.0.0. However, v6.0.0 is a test release that works with a pnpm 11 beta. The v5.0.0 release is the one with the `Latest` tag. I updated to v5.0.0 by hand. 

# Pull Request Target

* Blog post says don't use `pull-request-target` workflow trigger but doesn't say why
* My auto-assign workflow does
* [Post](https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/) from time `pull-request-target` was introduced explains it better
* Problem comes when you checkout code from an external pull request and try building it. Lots of ways for attacker to steal secrets that workflow has access to.
* In my case all I'm doing is adding a reviewer to every pull request created. Doesn't need to touch fork referenced by pull request. In fact, with permissions restricted to the pull request itself, it doesn't have any access to code. 
* For future reference. If you do need to analyze content of pull request and then update pull requests with results, the recommendation is to use two separate workflows. The analysis part is triggered by `pull-request` and has no access to branch target. Effectively analysis runs in a sandbox. Upload results as artifact at end of workflow. Trigger a second workflow on completion of the first, which downloads results and updates pull request.

# Conclusion

It's well worth getting ahead of the curve and taking basic steps to secure your GitHub Actions.
1. Enable CodeQL scanning of your actions
2. Make sure all actions have the minimum permissions needed
3. Pin third party action versions to a SHA
4. Enable Dependabot GitHub Actions updates with a cooldown
5. Review changes before committing
