---
title: Bootstrapping NPM Publish
tags: frontend
---

 wise words

 * Want to publish library packages for public use
 * Make it as easy as possible to find and consume packages
 * Ensure they have a good development experience
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
* Generate *.js for each *.ts file
* Generate a *.d.ts for each *.ts file

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

# Abstracted Structure

* Hide all the internal details by bundling everything up into index.js entry point and corresponding index.d.ts declarations
* Include sourcemap for debuggability, have option of inlining original TypeScript code
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

# NPM Publish

* Head over to npmjs.com
