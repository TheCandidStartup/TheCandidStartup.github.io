---
title: Supply Chain Provenance
tags: frontend cloud-architecture
---

wise words

{% include candid-image.html src="/assets/images/github/xkcd-dependency.png" alt="XKCD Cartoon - Open Source Dependencies" attrib="[xkcd](https://xkcd.com/2347/)" %}

* xkcd cartoon
* lzma supply chain attack
  * Overview: https://www.sonatype.com/blog/cve-2024-3094-the-targeted-backdoor-supply-chain-attack-against-xz-and-liblzma
  * Tech Details: https://gist.github.com/thesamesam/223949d5a074ebc3dce9ee78baad9e27

* Blog introducing feature: https://github.blog/2023-04-19-introducing-npm-package-provenance/
* sigstore: https://www.sigstore.dev/

* npm registry integration
  * Version check mark
  * Provenance section at bottom of package page
  * No filter to let you search just for packages with provenance
  * No checkmark in search results

{% include candid-image.html src="/assets/images/github/sigstore-npm-props.png" alt="NPM Package with Provenance Check Mark" %}

{% include candid-image.html src="/assets/images/github/sigstore-npm-provenance.png" alt="NPM Package with Provenance statement" %}

* npm client integration
  * npm audit signatures
  * No option to display list of packages without provenance

In Infinisheet repo
```
% npm audit signatures
audited 971 packages in 9s

971 packages have verified registry signatures

101 packages have verified attestations
```  

A little more than 10% of packages I use have provenance. Still a long way to go. 

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

# Publish Automation - Attempt 1

* Ready to try publishing. First idea was to add an extra step to my existing Build CI workflow to run `npm run lerna-publish`. Used the [npm documentation](https://docs.npmjs.com/generating-provenance-statements) to include the npm auth token in the environment and to force provenance generation to be used. I'm using lerna to publish packages so can't pass a provenance flag through to the npm publish call. I don't want to publish every build, so I made the publish step conditional. It will only run on a push to main, only for one of the matrix builds and only if the triggering commit was created by `lerna version`.

```
- name: Publish to NPM on release
  if: |
      github.ref == 'refs/heads/main' &&
      matrix.node-version == '20.X' &&
      contains(github.event.head_commit.message, 'chore(release)')
  env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_PUBLISH_TOKEN }}
      NPM_CONFIG_PROVENANCE: true
  run: npm run lerna-publish
```

I created a new version for my `react-virtual-scroll` 0.3.0 release and waited to see what would happen. 

{% include candid-image.html src="/assets/images/github/npm-publish-run-1.png" alt="Lerna Publish Fails" %}

I've seen that error before. The same thing happened when I [first ran lerna publish]({% link _posts/2024-05-21-bootstrapping-npm-publish.md %}) on my machine without logging into npm first. Seems likely that my NPM automation token hasn't been picked up.

It turns out that the way GitHub actions handles authentication with npm is a [little convoluted](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages#publishing-packages-to-the-npm-registry). You need to explicitly specify the NPM package registry URL in the `setup-node` action, even though its the default. This triggers `setup-node` to write a hardcoded `.npmrc` file to the runner which includes `_authToken=${NODE_AUTH_TOKEN}`. Finally, you need to make sure that `NODE_AUTH_TOKEN` is defined in the environment when you run the publish.

My workflow was missing the `registry-url: 'https://registry.npmjs.org` line. All I needed to do was add it and rerun. 

At this point I realized two things. First, I needed some way of rerunning a publish if something went wrong. Second, tagging publishing onto the end of the "Build CI" workflow meant that my CI build as a whole would fail if something went wrong when publishing. 

# Publish Automation - Attempt 2

I decided to use a separate workflow for publishing. I could configure it to support two triggers. It would be called from the end of the Build CI workflow if the conditions were met or you could trigger it manually. Here, the publishing step is a separate job that runs if all the build jobs have succeeded.

```
publish-if-neeeded:
  needs: build
  if: |
      github.ref == 'refs/heads/main' &&
      contains(github.event.head_commit.message, 'chore(release)')
  uses: ./.github/workflows/npm-publish.yml
```

The publish workflow looks like this

```
name: NPM Publish

on: [workflow_dispatch, workflow_call]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v3
        with:
          node-version: 20.X
          registry-url: https://registry.npmjs.org/
      - run: npm ci
      - run: npm run lerna-build
      - run: npm run lerna-test
      - run: npm run lerna-publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_PUBLISH_TOKEN }}
          NPM_CONFIG_PROVENANCE: true
```

As it's a separate workflow, potentially on a different runner, which might be triggered manually, it needs to include all the build steps as well as the publish. I can live with the duplication as it won't be run that often. 

{% include candid-image.html src="/assets/images/github/npm-publish-workflow.png" alt="Publish Workflow can be manually triggered" %}

Now I can rerun the publish and see if it gets any further.

{% include candid-image.html src="/assets/images/github/npm-publish-run-2.png" alt="Lerna Publish Fails Again" %}

That's a new error. Google came up with no results for `TLOG_CREATE_ENTRY_ERROR`. Searching GitHub found some hits in [sigstore-js](https://github.com/sigstore/sigstore-js) which is part of the [sigstore](https://www.sigstore.dev/) project used by npm to record provenance. It looks like the sigstore library throws that error if it can't communicate with the sigstore backend. 

Which left me stuck. Lerna gives me no context for what might have triggered the error. I couldn't find any way to enable more verbose logging. So I decided to use `npm publish` directly to see if that would show me more information related to the error.

```
Run npm publish --workspaces --verbose --provenance --access public
npm verb cli /opt/hostedtoolcache/node/20.13.1/x64/bin/node /opt/hostedtoolcache/node/20.13.1/x64/bin/npm                                        
npm notice 
npm notice Publishing to https://registry.npmjs.org/ with tag latest and public access
npm notice publish Signed provenance statement with source and build information from GitHub Actions
npm notice publish Provenance statement published to transparency log: https://search.sigstore.dev/?logIndex=99921087
npm http fetch PUT 200 https://registry.npmjs.org/@candidstartup%2freact-virtual-scroll 2178ms
+ @candidstartup/react-virtual-scroll@0.3.0
```

Annoyingly it worked first time. Either the error was something intermittent or somehow the way Lerna calls `npm publish` triggers the error. I was tempted to give up on `lerna publish` at this point. However, `npm publish` by itself isn't enough. It isn't idempotent. If you run publish again it will error because the package has already been published. That makes it painful to automate when working in a monorepo because only some packages may need publishing but `npm publish --workspaces` will try and publish all of them. Dealing with this is the value add that Lerna brings.

I decided to try `lerna publish` again to see if the problem was an intermittent error with the sigstore backend. Of course as I had already published the `react-virtual-scroll` 0.3.0 package, Lerna refused to try publishing again no matter how I tried to force it. I need to create version 0.3.1 and trigger the publish via Build CI. 

{% include candid-image.html src="/assets/images/github/npm-publish-run-3.png" alt="Lerna Publish Fails a Third Time" %}

It failed again, but back to the authentication error. Which is really weird. On [further reading](https://docs.github.com/en/actions/using-workflows/reusing-workflows) it seems that workflow dispatch is more like a subroutine call than triggering an independent workflow. There's lots of complex language explaining which bits of content come from the calling workflow and which from the called workflow.

I've also still got the problem where a publish failure results in failure of my Build CI workflow. 

# Publish Automation - Attempt 3

There's another way of chaining workflows. You can trigger a workflow to run when another workflow completes. With this approach I can pull all the publishing related stuff out of the Build CI workflow. I also switched to calling Lerna directly rather than via an npm script so that I could tweak the command line without having to edit another file.

```
name: NPM Publish

on:
  workflow_dispatch:
  workflow_run:
    workflows: [Build CI]
    types: [completed]

jobs:
  build:
    if: |
        github.event_name == 'workflow_dispatch' ||
        ( github.event.workflow_run.conclusion == 'success' &&
          github.event.workflow_run.event.ref == 'refs/heads/main' &&
          contains(github.event.workflow_run.event.head_commit.message, 'chore(release)'))
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.X
          registry-url: https://registry.npmjs.org/
      - run: npm ci
      - run: npm run lerna-build
      - run: npm run lerna-test
      - run: npx lerna publish from-package --yes
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_PUBLISH_TOKEN }}
          NPM_CONFIG_PROVENANCE: true
```

For whatever reason, this time it worked. 

{% include candid-image.html src="/assets/images/github/npm-publish-run-4.png" alt="Lerna Publish Success" %}

# Result