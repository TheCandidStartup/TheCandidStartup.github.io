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
* As I have touched Infinisheet repository in six months there were a few alerts present in the GitHub UI
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
* Can configure dependabot to create PRs for general version updates
* Ignores constraints in `package.json`. I currently have storybook locked to version 8.6.4 because later versions have a bug that broke one of my stories. Dependabot created a PR to update to latest 8.6.14.
* Can ignore and unignore dependencies in the group via comments on the pull request. At first after ignore it looked like nothing happened but after a few minutes the original PR was closed and a new one created, kicking off the CI pipeline again.
* No notification from GitHub when PRs created, presumably because no reviewer or assignee
* Only way I could find to assign myself to created PRs is using third party auto-assign-action GitHub action
