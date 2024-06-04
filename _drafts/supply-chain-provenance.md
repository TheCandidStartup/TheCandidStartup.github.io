---
title: Supply Chain Provenance
tags: frontend cloud-architecture
---

wise words

* xkcd cartoon
* lzma supply chain attack
  * Blog introducing feature: https://github.blog/2023-04-19-introducing-npm-package-provenance/
  * Overview: https://www.sonatype.com/blog/cve-2024-3094-the-targeted-backdoor-supply-chain-attack-against-xz-and-liblzma
  * Tech Details: https://gist.github.com/thesamesam/223949d5a074ebc3dce9ee78baad9e27

* Publishing
  * More than convenience. If you build and [publish](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages) from GitHub actions you can establish the [provenance](https://docs.npmjs.com/generating-provenance-statements) of the package. NPM will verifiably link the package to the commit and workflow that built it. This is a crucial step in improving supply chain security. 
  * Can check if build was triggered by version commit and use that to decide whether to publish package
* Versioning
  * Can continue to run locally or setup a [manual workflow](https://docs.github.com/en/actions/using-workflows/manually-running-a-workflow) with form inputs that let you choose how new version should be generated
  * Not worth it. Simpler and more flexible to continue versioning on my machine then use push of that commit to trigger publish.

In Infinisheet repo
```
% npm audit signatures
audited 971 packages in 9s

971 packages have verified registry signatures

101 packages have verified attestations
```

* Basic setup for automated publish https://httptoolkit.com/blog/automatic-npm-publish-gha/
* Create NPM granular access token with read-write access to `@candidstartup` scope

{% include candid-image.html src="/assets/images/github/npm-token-generated.png" alt="NPM Token Generated - Use it or lose it" %}

* Copy token and store it as a secret for project's GitHub actions
* Go to Settings -> Secrets -> Actions
* Have a choice of per environment, per repository or per organization secrets
* Environment secrets let you have separate secrets for production, staging and dev with different levels of access. More control than we need.
* Organization secrets let you define a secret at the Organization level shared by multiple repos based on permission policies. Again, more control than we need.
* Created a repository secret for `infinisheet`

{% include candid-image.html src="/assets/images/github/repository-secret.png" alt="GitHub Repository Secret" %}

* Make sure npm package settings are configured for publish via access token

{% include candid-image.html src="/assets/images/github/npm-publishing-access.png" alt="NPM Package Publishing Access" %}