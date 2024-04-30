---
title: Bootstrapping NPM Publish
tags: frontend
---

wise words

* Want to publish library packages for public use
* Make it as easy as possible to find and consume packages
* Ensure they have a good development experience
  * Type information available in IDE
  * Debug through source code
* Support both TypeScript and vanilla JavaScript clients
* ESM only - stop living in the past people

# Build Package

* Where I got stuck last time
* Using Vite library mode
* No option to produce a TypeScript dts file
* Take a step back and decide what we actually need rather than fiddling around with what Vite gives us

# Package Best Practices

* Use `peerDependencies` rather than `dependencies`. Client gets to choose which version of dependency to install.
* Two main approaches

# Public Structure

* Publish package using same structure as source repo
* Generate *.js, *.js.map, *.d.ts for each *.ts file in dist folder
* Inline source into source map for debugging

Pros
* Simple - all you need is the TypeScript compiler
* Code is directly readable / debuggable
* Typing provided via IDE

Cons
* Lots of files
* Internal structure exposed - hard to change later
* Internal implementation details exposed
* Hard to make it work if you have other assets like CSS
* Source code needs to use import in form "./Component.js" otherwise TypeScript compiler won't output fully compliant ESM

Stats
* react-virtual-scroll `dist` folder contains 31 files with 66KB of content using 147KB on disk, built in 1.48 seconds
* Sample app code bundle is 149KB (including React), source map is 382KB, builds in 377ms

# Abstracted Structure

* Hide all the internal details by bundling everything up into index.js entry point and corresponding index.d.ts declarations
* Corresponding source map file with TypeScript source inlined for debugging
* Depending on type of package may choose to minify (e.g. if intended to load directly into Node), or include full detail (if client expected to bundle themselves)

Pros
* Simple package structure
* Internal structure and implementation details hidden
* Can add in support for other assets like CSS
* Need additional source map for debuggability

Cons
* Need a separate bundler as well as TypeScript compiler
* No clear choice for bundling TypeScript declarations. Lots of edge cases, YMMV. 
* Lots of newcomers trying to address specific DTS concerns. May end up having to try a few to get something that works for you.
* If you're not careful you could easily end up parsing TypeScript source three times (once for type checking, once to transpile to JS, once to generate type declarations)

* Consensus from most "how to guides" is to use Rollup as your bundler. Has direct integration with the TypeScript compiler (using official plugin `rollup-plugin-typescript`) which fits nicely into the Rollup pipeline. 
* Unfortunately builtin plugin won't bundle dts files, need a separate plugin for that. Lots of choices, most mature (but no longer actively maintained) is `rollup-plugin-dts`. 
* To minimize redundant work configure two Rollup pipelines
* First uses `rollup-plugin-typescript` to run TypeScript compiler (including generating dts for each source file) and bundle js and sourcemap output for each type of module you want to support
* Second uses `rollup-plugin-dts` to load per source file dts from first pipeline and bundle into single dts output

Stats
* react-virtual-scroll `dist` folder contains 3 files with 60KB of content using 66KB on disk, built in 931ms
* Sample app code bundle is 149KB, source map is 380KB, builds in 450ms

# NPM Publish

* Head over to npmjs.com

# Test App

* Hacked dev build to use package rather than read src directly. Confirmed that source maps picked up and functional for both approaches
* Production build worked in both cases. Surprisingly, building using the bundled package was slightly slower.
  * In both cases source maps from package aren't carried over into app source map (if you want to debug production build)
  * Known limitation with Rollup when building the app
  * rollup-plugin-sourcemaps fixes this. Or it would if it was still maintained. Doesn't work with Rollup 4.
  * Found @gordonmleigh/rollup-plugin-sourcemaps which is a Rollup 4 compatible rewrite with same interface. Bleeding edge but worked for me. 
