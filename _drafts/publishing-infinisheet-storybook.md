---
title: Publishing the InfiniSheet Storybook
tags: frontend blog infinisheet
---

wise words

* Finally have a storybook that I'm happy to publish
* Things left to do: Build to be served from subpath, tying into the navigation structure of the blog and existing Typedoc API docs, GitHub actions to deploy

# Production Build

* Built and ran a production build for the first time in ages, ready to experiment with serving from a subpath
* Which is when I realized that Autodocs were missing
* First thought was a problem with my hacked TSDoc support. Disabled it but made no difference.
* Eventually realized it's because the production build uses built packages for projects in the monorepo, rather than importing source code directly.
* Setup this way for proper [component testing]({% link _posts/2025-01-13-bootstrapping-storybook.md %})
* Autodocs relies on static analysis of source code. In theory you should be able to do the same analysis using the `.d.ts` typing file built for each package. In practice it doesn't work. 
* Storybook documentation [calls this out](https://storybook.js.org/docs/writing-docs/autodocs#the-auto-generated-documentation-is-not-showing-up-in-a-monorepo-setup) in its troubleshooting section
* Under the hood Storybook relies on `react-docgen` to do the static analysis. Lack of support for `.d.ts` is a [known issue](https://github.com/reactjs/react-docgen/issues/929). 
* Storybook also supports an [alternative tool](https://storybook.js.org/docs/api/arg-types#automatic-argtype-inference), `react-docgen-typescript`. This one uses the TypeScript compiler to parse the code, so should be able to handle `.d.ts` files. 
* Unfortunately, it doesn't work either. There's a [known issue](https://github.com/styleguidist/react-docgen-typescript/issues/483) for this one too. The package was last updated three years ago, so I don't hold out much hope that it will be fixed.
* Which is a pain. I can't publish Storybook documentation without a production build against source code, but I want a production build against built packages for component testing.

# Two Production Builds

* The answer is to create two production builds. Once setup for publishing, the other for testing.
* Interestingly, Storybook has a `--test` flag that optimizes builds for testing, in part by stripping out the documentation.
* I'm already dynamically tweaking the Vite configuration to control whether Storybook builds against source or packages. Easy to update the test for building against packages to `(options.configType === 'PRODUCTION' && options.test)`.
* Unfortunately, the resulting test build is only partially functional. As well as stripping out the documentation, the *Controls* tab for each story only displays controls for args that were explicitly set in the Story. At least for the Vite React framework, Storybook is relying on the static analysis to determine the complete set of props for each component.
* It gets worse. The *Controls* tab often displays no controls at all.

{% include candid-image.html src="/assets/images/frontend/storybook-test-missing-controls.png" alt="Storybook --test mode missing Controls" %}

* This one is particularly weird. If you open a story directly using the corresponding URL, the controls appear. When you navigate to another story, they don't. If you refresh the page, they appear. Except for some stories where the controls don't appear no matter what you do. 
* There are reports of [similar issues](https://github.com/storybookjs/storybook/issues/30340), although the reproduction steps are different. 

# Smoke Test

* This is the first time I've run into a brick wall with Storybook. 
* For now, I intend to use the test build for simple smoke testing. Just make sure each story renders correctly.
* I'll have to run more complex tests that need to interact with the controls against the regular build. 
* Not ideal but better than nothing.

# Publishing

* I already use GitHub pages to [publish Typedoc documentation]({% link _posts/2024-08-12-publish-api-documentation.md %}) to the Candid Startup site.
* GitHub pages publishes to a fixed location for each repo in an organization. For Infinisheet, it goes to [thecandidstartup.org/infinisheet](https://thecandidstartup.org/infinisheet).
* One of the drawbacks of using a monorepo is that everything I want to publish has to live under the same root. 
* I can put the built Storybook into `infinisheet/storybook` without interfering with the Typedoc output.
* I initially thought I'd need to do a special build with a different base path. However, Storybook is a single page app with a single route. You can put the build output under whatever path you like and it still works. 

# GitHub Actions

* I need to publish all the pages for Infinisheet in a single deployment step. The easiest way to achieve that is to add Storybook to the existing `docs.yml` workflow. 

# Theming Storybook

# Landing Pages

* I was able to make Typedoc output fit into the overall information architecture. It was easy to customize the output to use the CS favicon and a similar navigation header.
* Doesn't seem like any easy way to do that with Storybook. It's very much it's own monolithic thing. 
* Simplest thing is to add handwritten documentation landing pages for each package with links back into the main site.

# Blog Updates

* Adds links to Storybook

# Try It!
