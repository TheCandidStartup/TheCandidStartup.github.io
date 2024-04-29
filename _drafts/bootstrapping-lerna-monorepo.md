---
title: Bootstrapping a Lerna Monorepo
tags: frontend spreadsheets
---

So far, all the front-end development work I've done has been in the [repo](https://github.com/TheCandidStartup/react-virtual-scroll-grid) I created when [bootstrapping Vite]({% link _posts/2023-10-23-bootstrapping-vite.md %}). It's starting to feel a little restrictive. 

The repo is based on a template for a React app. I added my [virtual scrolling]({% link _posts/2024-01-29-modern-react-virtual-scroll-grid.md %}) components and now it's an uncomfortable mix of a React component library and a sample app. My [code coverage]({% link _posts/2024-03-18-vitest-code-coverage.md %}) metrics are distorted because it doesn't make sense to unit test a sample app. At some point the sample app will turn into a real [Spreadsheet]({% link _topics/spreadsheets.md %}) application, I'll want somewhere to run end to end tests, there'll be back-end components and more. 

I could create dedicated repos for each purpose but that would add a lot of overhead to my development process. I'd need to divide each update to the code base into multiple commits across the repos involved. Each repo would have its own set of dependent packages to manage. Any change to a component would need the owning package to be built before any consuming app sees the change. 

I'm really enjoying the Vite development experience where I see and resolve errors as I type in Visual Studio Code. I save the file and impacted unit tests automatically rerun while running apps reload themselves. No friction at all. Whatever I do to put in place more structure shouldn't compromise the development experience.

That's why I'm moving to a [monorepo](https://en.wikipedia.org/wiki/Monorepo).

# Monorepo

{% include candid-image.html src="/assets/images/frontend/monorepo.png" alt="Many Repos vs Monorepo" attrib="Erzhan Torokulov on [Medium](https://javascript.plainenglish.io/javascript-monorepo-with-lerna-5729d6242302)"%}

A monorepo is a version control strategy where multiple projects are stored in the same version control repository. Changes that span multiple projects can be managed using a single commit or PR. You can refactor across the entire codebase. You can share configuration and dependencies that are common across multiple projects.

Monorepos are a popular approach in the Javascript ecosystem. There's a [bewildering array of tooling](https://github.com/korfuri/awesome-monorepo) available to support a variety of approaches.  

# Workspaces

Monorepos used to be an exotic approach that depended on tooling that would work behind the back of whatever package manager you were using. Now all the major package managers (npm, yarn, pnpm) have their own first class support for [*workspaces*](https://docs.npmjs.com/cli/v10/using-npm/workspaces). Workspaces were first introduced by Yarn and then copied by the other package managers. 

There's a two level structure. A top level `package.json` defines the workspaces used in the repo, and manages shared config and dependent packages. Each workspace is a subdirectory with its own `package.json`.

Where possible, dependencies are shared between workspaces by *hoisting* them to the root level. Workspaces can be dependent on external packages or other workspaces. The package manager sets things up so that build tooling can resolve dependencies the same way regardless of which form they take. 

The package manager CLI typically allows you to run commands against the root, any specific workspace or all workspaces.

# Lerna

Great. So monorepo support is built into my package manager and I just need to turn it on. 

I could try and do it that way but there are still plenty of dedicated monorepo tools. All that's changed is that they're now built on top of package manager workspaces. They focus on providing higher level functionality. 

After my usual research approach (frantic Googling), I decided to give [Lerna](https://lerna.js.org/) a try. 

Lerna is one of the oldest and most popular monorepo tools. It has three features that seem like they should be valuable for me. 

## Minimal config production build

Lerna will run the npm build command (or any command I like) in each workspace. Which npm will also do for me. The difference is that Lerna uses the dependency information from each workspace's `package.json` to run the builds in the correct order. It can even parallelize the build where possible.

## Versioning

Lerna can [automatically update](https://github.com/lerna/lerna/tree/main/libs/commands/version#readme) the version of each package with semantic versioning based on the repo's commit history. If your commit messages use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format, Lerna can determine the appropriate version bump and generate `CHANGELOG.md` files. 

Lerna can also commit the changes it made, tag the commit and run lifecycle hooks.

## Publishing

Finally, Lerna will publish packages to the npm repository for you. It compares current package versions against those already published to work out which packages need to be updated. 

# Overall Approach

I'm going to create a new repo as the home for my monorepo, rather than trying to rebuild the existing repo in place. There's a few reasons. First, the monorepo has much wider scope, so needs a new name. I have lots of blog posts with links to the existing repo which I don't want to break. Second, this is all new to me and I'm likely to screw it up the first time I try it. Using a new repo means I can throw it away and start over if I get it wrong. 

I'm going to use a structure that I've seen in other monorepos I've looked at. All the top level workspace stuff is at the root of the hierarchy. A `packages` subdirectory contains a subdirectory for each publishable package. An `apps` subdirectory is set up the same way for apps. 

I'll populate that structure by cloning the content of the existing repo, moving everything related to the react components into `packages/react-virtual-scroll` and everything related to the sample app into `apps/virtual-scroll-samples`. Finally, I'll need to copy config files into both locations, adjust as needed, identify the common parts and hoist them up to the root. 

# What's in a name?

Which means that before I can get started I have to come up with a name. Which is famously one of the [two hardest things](https://martinfowler.com/bliki/TwoHardThings.html) in computer science. 

The monorepo will be home for everything related to my [Spreadsheet]({% link _topics/spreadsheets.md %}) project. So really, I need to come up with a name for that. I could just call it "Spreadsheet" but that's too generic. It may be my German heritage, but I tend to lean towards compound nouns when naming. No more than two words to keep it snappy. Which means some variation on "SomethingSheet". 

Given my recent focus on [large grids]({% link _posts/2024-04-22-modern-react-virtual-scroll-grid-8.md %}), my first though was "MegaSheet". Which isn't thinking big enough. The aim is to support billions of rows. How about "GigaSheet"?

Quick Google to see who's already using it. On dear. [GigaSheet](https://www.gigasheet.com/) is a "Big Data Spreadsheet". Luckily, I've focused my project so that it's virtually impossible to be covered by an existing product. Unlike GigaSheet, mine's open source, serverless and self-deployed. I'm also aiming at billions of rows and millions of columns. GigaSheet is limited to at most [17,000 columns](https://gigasheet.freshdesk.com/support/solutions/articles/69000829140-troubleshooting-upload-errors).

I need another name that somehow captures all that. I don't think "OpenServerlessGigaMegaSheet" will fly. In the end, I went with "InfiniSheet". 

[InfiniSheet](https://github.com/TheCandidStartup/infinisheet) has very few hits on Google and nothing in GitHub. The closest existing product is [InfiniSheets](http://infinisheets.com/), an educational product for generating math worksheets. No real conflict there.

# TypeScript

The next decision is how to set up TypeScript so that I still have a zero friction development experience while working with multiple packages in a monorepo. The simplest setup is that each package is its own isolated TypeScript project. However, that means having to build dependent packages before they can be consumed. Not the experience I'm looking for. 

## Project References

Fortunately, TypeScript has [Project References](https://www.typescriptlang.org/docs/handbook/project-references.html), a dedicated feature for working with multiple modules. Unfortunately, it's [far from zero friction](https://moonrepo.dev/docs/guides/javascript/typescript-project-refs). The deal breaker is that you need access to the output declaration files (`.d.ts`) for each dependent module. Which again means having to build them first. Even worse, you have to redundantly specify the dependencies between modules in your `tsconfig` files as well as in `package.json`. 

## Internal Packages

The other extreme is an approach called [Internal Packages](https://turbo.build/blog/). You're back to relying on the package system to resolve code in dependent packages. The difference is that instead of pointing `package.json` at your build output, you point it at your TypeScript source. Amazingly, this works. TypeScript will quite happily use the source files directly if it knows where to find them. 

Internal Packages is simple to configure, and delivers a true zero friction development experience. The downside is that there's no easy way to build and publish those packages for external use. They really are internal packages. I'm vain enough to think that someone will want to use some of what I'm creating. I want a zero friction development experience together with the ability to build and publish packages when I choose.

## Path Aliases

There is a third way. You can define [path aliases](https://www.typescriptlang.org/tsconfig/#paths) in your `tsconfig` file. You can write an import statement for a package and use a path alias to tell TypeScript where to load from. For example the alias `"@candidstartup/*": ["packages/*/src"]` will map any import from a `@candidstartup` scoped package to the corresponding package subdirectory in the monorepo. 

That checks the box for zero friction development. Enabling production build and publish needs [careful configuration](https://medium.com/@NiGhTTraX/how-to-set-up-a-typescript-monorepo-with-lerna-c6acda7d4559). Path aliases override any module based resolution that TypeScript would normally perform. I can provide a `package.json` set up for production builds without compromising on development experience. However, in order to perform a production build, I have to use a `tsconfig` without path aliases. The trick is to use different files for development and production build. You can avoid duplication by using the [`extends`](https://www.typescriptlang.org/tsconfig/#extends) keyword to inherit from other configuration files. 

The overall structure uses `tsconfig.build.json` at the root level containing common compiler options. A root `tsconfig.json` inherits from that and adds the path aliases. Finally, each package has its own `tsconfig.build.json` and `tsconfig.json` which inherit from the corresponding root files and add package specific configuration. 

# Vite

Vite and Vitest are the other major parts of my tooling. Vitest shares Vite's configuration file and transformation pipeline so once Vite is properly configured, Vitest should be fine. 

In [principle](https://betterprogramming.pub/lerna-monorepo-with-vite-and-storybook-e29e54559214), it's possible to split `vite.config.ts` between common config and per package setup. In practice it's fiddly. Vite configuration is a TypeScript source file which exports a call to the Vite function `defineConfig` with the desired config passed in as a `UserConfig` object literal. You need a base config which exports a wrapper around Vite's `defineConfig` which combines the package level `UserConfig` with the common config. 

For now, I'll stick with independent `vite.config.ts` per package. I can revisit once I get everything working and have a better understanding of what's common and what's not. The Vite runtime is intended for use by browser based apps. The runtime development experience for libraries is via Vitest unit tests. I'll need to figure out whether apps and packages need separate configs. 

My current `react-virtual-scroll-grid` repo builds a browser app. In [theory](https://vitejs.dev/guide/build.html#library-mode), you can use Vite to do the production build for packages too. I need to try it out and see how well it works.

One thing I will need to do is make sure that the Vite transformation pipeline can find all the source code needed when running the development version of an app. By default, Vite ignores TypeScript path aliases. Fortunately there's a Vite plugin, `vite-tsconfig-paths`, that fixes that. It just needs to be [added](https://github.com/NiGhTTraX/ts-monorepo/tree/master?tab=readme-ov-file#vite) to the list of plugins in the Vite config. 

# Getting Started

I started out by converting my existing repo into a monorepo with a single package and checking that everything still works. I created the `infinisheet` repo in Github and followed GitHub's [instructions](https://docs.github.com/en/repositories/creating-and-managing-repositories/duplicating-a-repository) to mirror the existing repo into it. 

I created a `packages/react-virtual-scroll` subdirectory for my first package and used `git mv` to move everything from the top level into the package `react-virtual-scroll` directory. Now the moment of truth. I ran `npx lerna init` in the root directory to configure it as a monorepo.

It turned out to be an anticlimax. All that happens is that it adds a `lerna.json` config file and a root `package.json` which enables npm workspaces and adds Lerna as a dev dependency. It also installs Lerna together with all the dependencies needed by my react-virtual-scroll workspace. It ended up with a total of 946 packages using 300MB of disk space. 

While researching Lerna I came across a [blog](https://dev.to/logto/why-we-stopped-using-lerna-for-monorepos-4i5i) from someone that stopped using it a couple of years ago. The trigger seemed to be uncertainty caused by the change in maintainer at that time. It wasn't enough to put me off. The blog included a throw away comment about how much smaller their package-lock.json file is after removing Lerna. Now I get it. Adding Lerna as a dev dependency has doubled the disk space used and added another 500 packages compared to my original `react-virtual-scroll-grid` repo.

On the positive side, it all seems to work.
* Running `npx lerna run build` at the top level found and built my `react-virtual-scroll` workspace
* `npm run test --workspace=react-virtual-scroll` ran my unit tests
* If I `cd` into the workspace I can run all my npm scripts as before, e.g. `npm run test`, `npm run build`, `npm run dev`

# Multiple Workspaces

On to the fun stuff. Getting everything set up for multiple workspaces. 
  
## Build Standalone Package

I started by configuring `react-virtual-scroll` to build a library package rather than the sample app. Vite provides [library mode](https://vitejs.dev/guide/build.html#library-mode) for this purpose. According to the documentation, library mode has a simple and opinionated configuration for browser-oriented JavaScript framework libraries. There's not much detail on what all the options in the example code are for.

```
export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'lib/main.js'),
      name: 'MyLib',
      // the proper extensions will be added
      fileName: 'my-lib',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
```

It took a bit of research to figure it out. The `name` and `fileName` properties are redundant copies of information that's already in `package.json`. There's an assumption that your package will have a `main.ts` file that acts as the entry point and exports everything defined by the package. The implementation on the Vite side is minimal. You're left to generate an absolute path to the entry file yourself. The example code uses the Node `path` module which needs to be installed and added to your dev dependencies. You also need to add `@types/node` to resolve TypeScript errors when you first try to import `path` in `vite.config.ts`. 

The `lib` configuration options don't do everything that's needed. Internally, Vite uses [Rollup](https://rollupjs.org/) for production builds. The other part of the configuration is passing [Rollup options](https://rollupjs.org/configuration-options/) straight through to Rollup. 

Weirdly, given Vite's focus on being forward looking and only supporting ESM packages, the default is to build both ESM and [UMD](https://github.com/umdjs/umd) versions of your package. A lot of the configuration complexity comes from supporting UMD. I decided to disable the UMD support. I'm never going to use UMD or test that it works. 

I pared down the config to its essentials and was left with this.

```
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      formats: ['es']
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
    }
  },
})
```

I reran the build which completed successfully and output `dist/react-virtual-scroll.js`. I had a quick look and confirmed that it ends with the expected exports. Good enough for now.

## Typescript Path Aliases

Next up was creating the TypeScript configuration files needed to work with path aliases. I split my existing tsconfig.json into four files. First, `tsconfig.build.json` at the root level, which contains all the compiler options. 

```
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* vitest */
    "types": [
      "vitest/importMeta",
      "vitest/globals"
    ]
  },
}
```

The compiler options are inherited by `tsconfig.json` at the root level, which adds in the path alias definitions. This is the configuration used by the IDE and the Vite development runtime. 

```
{
  "extends": "./tsconfig.build.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@candidstartup/*": ["packages/*/src"]
    }
  },
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

The `references` key was created by the Vite template when I bootstrapped my original repo. Bizarrely, it's a TypeScript project reference. As far as I can tell, it's a hack that allows the IDE to type check `vite.config.ts` correctly. Vite is a TypeScript application built on NodeJS. Your project's Vite config is a TypeScript source file which needs TypeScript compiler options appropriate for Node rather than a browser. 

The use of paired `tsconfig.build.json` and `tsconfig.json` files continues at the package level. They extend the corresponding root file and specify which source files are in scope.

```
{
  "extends": "../../tsconfig.build.json",
  "include": ["src"],
  "exclude": ["src/*.test.*", "src/test"],
}
```

```
{
  "extends": "../../tsconfig.json",
  "include": ["src"]
}
```

All that's left is making sure that the production build uses the package's `tsconfig.build.json` rather than the default `tsconfig.json`. The build script generated by the Vite template is `"tsc && vite build"`. 

The TypeScript compiler is configured so that it only does type checking. The actual transpilation and bundling into a package is handled by Rollup invoked by `vite build`. It's easy enough to ensure that the TypeScript compiler uses the right configuration by passing it on the command line with `tsc -p tsconfig.build.json`.

There isn't any obvious way of doing the same for `vite build`. I went trawling through the Rollup config options and worked out how I could pass a `tsconfig` of my choice through to the Rollup typescript plugin that handles transpilation. When I tried it, the build failed with a Rollup error pointing out that my compile options disable output. Which is when I realized that Rollup couldn't have used my `tsconfig.json`. It's set up for type checking, not code generation. 

In the end I went trawling through the [Vite source code](https://github.com/vitejs/vite/blob/main/packages/vite/rollup.config.ts). Vite uses its own internal `tsconfig`, depending on what kind of package you want to generate. I didn't need to do anything else. 

## Separate Sample App

I used `git mv` to put all the sample code for `react-virtual-scroll` into `app/virtual-scroll-samples`. I copied over and tweaked all the required configuration files. I also needed to change all the imports in the sample app source code to reference `@candidstartup/react-virtual-scroll`. Now Visual Studio Code complains about missing exports from `dist/react-virtual-scroll.js`. It's picking up the built module rather than using the path aliases.

Which got me thinking. How does TypeScript know to load `main.ts` given an import from `@candidstartup/react-virtual-scroll` which is mapped to `packages/src/react-virtual-scroll`? Obviously it doesn't and ends up using module resolution instead. However, TypeScript has a [directory module resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html#directory-modules-index-file-resolution) feature which means it will automatically look for `index.ts` when asked to import from a directory. 

Once I renamed my entry point to be `index.ts` rather than `main.ts`, the IDE immediately picked everything up and the errors disappeared. Next, I tried running `npm run dev`. Vite starts up and once I made sure that I had `vite-tsconfig-paths` in `vite.config.ts`, everything worked as normal. The sample code runs as before and the browser developer tools show me that source is being loaded from `packages/react-virtual-scroll/src`.
  
## Build the Monorepo

I went back to the top level and ran `npx lerna run build` again. Lerna figured out the dependencies and first built `packages/react-virtual-scroll` and then tried to build `apps/virtual-scroll-samples`. It failed trying to import the built package due to a lack of type declarations. 

Of course. The package output needs to include `dist/react-virtual.scroll.d.ts` as well as `dist/react-virtual-scroll.js`. There must be a Vite build flag to enable it. 

There isn't. The more I read about the alternatives, the more unsure I am about what to do next. I think I'm going to have to invest some time in figuring out what an npm package should ideally look like and then work out how best to build it. That will have to wait for next time. 

