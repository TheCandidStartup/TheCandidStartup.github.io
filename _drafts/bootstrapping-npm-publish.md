---
title: Bootstrapping NPM Publish
tags: frontend
---

I have my monorepo [up and running](/_drafts/bootstrapping-lerna-monorepo.md) for local development. However, I still haven't figured out how to publish usable library packages, or even what should be in them. 

I want to publish my library packages for public use. I want to make it as easy as possible to find and consume packages. People using my packages should have a good development experience. To me, that means having typing information available in the IDE, if they choose to use it, and being able to debug through the original source code. 

I intend to support both TypeScript and vanilla JavaScript clients. At least for now, I'm only going to publish ESM modules. However, if there's demand for CommonJS or some other flavor, it should be easy to produce that too. 

# Package Best Practices

Last time I got stuck trying to build a production package using Vite library mode. I'd tried to do the simplest possible thing, given where I was starting from, and it hadn't worked. There's no Vite option to produce a TypeScript dts file. 

It's time to step back and decide what we actually need rather than fiddling around with what Vite gives us. At a minimum we need to produce transpiled JavaScript (so vanilla JavaScript clients can use the package), TypeScript declaration dts files (so that type information is available for TypeScript clients) and source maps (so that debuggers can step through the original source code).

I would like the process of building and publishing a package to be maintainable. That includes minimizing redundant information in config files within a package and sharing as much common config as possible between packages. 

As far as I can tell, there are two main approaches to structuring a package. I think of them as Transparent vs Opaque.

## Transparent Package

A transparent package uses the same structure as the source repo it was built from. In practice that means mirroring the source directory structure and generating a *.js, *.js.map, *.d.ts file for each TypeScript source file.

The main advantage of this approach is [simplicity](https://cmdcolin.github.io/posts/2022-05-27-youmaynotneedabundler). All you need is the TypeScript compiler. Set the appropriate compiler options and it will type check the project and spit out the required files. You do the minimal amount of processing and leave it up to your consumer to decide if they want to bundle or minify whatever they use your package in. 

There are lots of downsides. For a start, you tend to produce packages with many small files. When I tried building a transparent package for `react-virtual-scroll` I ended up with 31 files with 66KB of content using 147KB on disk. My project is tiny, imagine how bloated `node_modules` would get if everyone did this. 

The internal structure of your repo is exposed in your package. If consumers start to depend on this, for example by importing specific sub-components rather than the package as a whole, you won't be able to restructure your repo in future. You may also end up exposing internal implementation details that you would prefer to remain inaccessible. For example, internal components and types that shouldn't be part of the package interface. 

If your package needs to include anything other than code, for example CSS, you'll need additional tooling. 

Finally, from a maintainability point of view, the TypeScript compiler is less flexible than other tooling. The thing I found particularly annoying is that the output you can produce is constrained by the format of import statements used in your source code. For example, if you want to produce fully compliant ESM modules, your import statements [have to look like](https://www.typescriptlang.org/docs/handbook/modules/theory.html#typescript-imitates-the-hosts-module-resolution-but-with-types) `import * from './MyComponent.js`. Specifically, they have to include a file extension and that extension has to be `.js` rather than the actual `.ts` or `.tsx` extension of the source file. 

I find this deeply weird. TypeScript knows what format the imports need to be in the output, so why can't it just rewrite them for me? Even worse, if I change my mind and decide I want to produce CommonJS packages, I would have to change all the import statements in my source files to remove the `.js` extensions. 

Of course nobody does this. Most people write source code with extensionless imports. Which feels cleaner and more aesthetically pleasing. They then produce "ESM-like" packages which also contain extensionless imports. They're not pure-ESM, so you can't load them directly into a browser, but they will work with NodeJS and all the popular bundlers for building web apps. 

## Opaque Package

An opaque package hides all the internal details by bundling everything up. Usually, into a single `index.js` code bundle with a corresponding `index.d.ts` and `index.js.map`. The bundling process can remove dead code and hide internal types. The code is usually not minified so that the package consumer's bundler has full scope to operate. 

The resulting package structure is as simple as it gets. It's usually easy to add in other assets, like CSS, which bundlers already support. There's only a single JavaScript file so there's no internal imports to worry about. The result is inherently pure-ESM. 

Of course, you will need additional tooling. You need a bundler as well as the TypeScript compiler. As we saw with Vite, there's no clear choice for bundling TypeScript declarations. There are lots of edge cases. You may need to [try](https://www.npmjs.com/package/vite-plugin-dts) [a](https://github.com/Swatinem/rollup-plugin-dts) [few](https://api-extractor.com/) [tools](https://github.com/Rich-Harris/dts-buddy) to get something that works for you.

The usual approach is to pick a bundler and keep adding plugins until you get it to work. It's not always obvious what's happening under the hood. If you're not careful you can end up parsing your TypeScript source three times. Once for type checking, once to transpile to JS, and once to generate type declarations.

The [consensus](https://medium.com/codex/bundling-a-typescript-library-for-node-with-rollup-js-2c8add5e736f) [from](https://blog.logrocket.com/how-to-build-component-library-react-typescript/) [most](https://dev.to/siddharthvenkatesh/component-library-setup-with-react-typescript-and-rollup-onj) "how to guides" is to use Rollup as your bundler. It has direct integration with the TypeScript compiler, using the official plugin `rollup-plugin-typescript`, which fits nicely into the Rollup pipeline. The Vite documentation recommends that you use Rollup directly if Vite library mode doesn't work for you, so that's what I'm going to do. 

Unfortunately, the Rollup Typescript plugin won't bundle dts files. You need a separate plugin for that. There's lots of choices. The most mature (but no longer actively maintained) is `rollup-plugin-dts`. 

To minimize redundant work we configure two Rollup pipelines. The first uses `rollup-plugin-typescript` to run the TypeScript compiler (including generating dts for each source file) and bundle js and sourcemap output for each type of module you want to support. The second uses `rollup-plugin-dts` to load the dts files output by the first pipeline and bundle them into a single dts output.

When I tried it out with `react-virtual-scroll`, it produced 3 files with 60KB of content using 66KB on disk. 

## Best of Both Worlds

I like the simplicity of using the TypeScript compiler to produce a transparent package. On the other hand, I like the format of opaque packages better, but worry about the teetering pile of unsupported plugins it's built on. 

In the end, I realized that I could easily do both. I can create common config files that allow me to build using either Rollup or the TypeScript compiler. My default build will use Rollup but I can easily switch to just the TypeScript compiler if needed.

I tried building my sample app using both packages. They both worked and reassuringly resulted in nearly identical app bundles with 149KB of code and a 380KB source map. 

# Implementation

## Package.json

* Use `peerDependencies` rather than `dependencies`. Client gets to choose which version of dependency to install.

## TypeScript

* Inline source into source map for debugging

##  Rollup

# TypeScript

# NPM Publish

* Head over to npmjs.com

# Test App

* Hacked dev build to use package rather than read src directly. Confirmed that source maps picked up and functional for both approaches
* Production build worked in both cases. Surprisingly, building using the bundled package was slightly slower.
  * In both cases source maps from package aren't carried over into app source map (if you want to debug production build)
  * Known limitation with Rollup when building the app
  * rollup-plugin-sourcemaps fixes this. Or it would if it was still maintained. Doesn't work with Rollup 4.
  * Found @gordonmleigh/rollup-plugin-sourcemaps which is a Rollup 4 compatible rewrite with same interface. Bleeding edge but worked for me. 

