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
