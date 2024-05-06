---
title: Bootstrapping NPM Package Build
tags: frontend
---

I have my monorepo [up and running](/_drafts/bootstrapping-lerna-monorepo.md) for local development. However, I still haven't figured out how to build usable library packages, or even what should be in them. 

{% include candid-image.html src="/assets/images/frontend/npm-package.png" alt="NPM Package" attrib="Cam Bass on [Medium](https://levelup.gitconnected.com/how-to-build-an-npm-package-4158347e7fbf)"%}

I want to publish my library packages for public use via NPM. People using my packages should have a good development experience. To me, that means having typing information available in the IDE, if they choose to use it, and being able to debug through the original source code. 

I intend to support both TypeScript and vanilla JavaScript clients. At least for now, I'm only going to publish ESM modules. However, if there's demand for CommonJS or some other flavor, it should be easy to produce that too. 

# Package Best Practices

Last time I got stuck trying to build a production package using Vite library mode. I'd tried to do the simplest possible thing, given where I was starting from, and it hadn't worked. There's no Vite option to produce a TypeScript dts file. 

It's time to step back and decide what we actually need rather than fiddling around with what Vite gives us. At a minimum we need to produce transpiled JavaScript (so vanilla JavaScript clients can use the package), TypeScript declaration dts files (so that type information is available for TypeScript clients) and source maps (so that debuggers can step through the original source code).

I would like the process of building and publishing a package to be maintainable. That includes minimizing redundant information in config files within a package and sharing as much common config as possible between packages. 

As far as I can tell, there are two main approaches to structuring a package. I think of them as Transparent vs Opaque.

## Transparent Package

A transparent package uses the same structure as the source repo it was built from. In practice that means mirroring the source directory structure and generating a *.js, *.js.map and *.d.ts file for each TypeScript source file.

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

The [consensus](https://medium.com/codex/bundling-a-typescript-library-for-node-with-rollup-js-2c8add5e736f) [from](https://blog.logrocket.com/how-to-build-component-library-react-typescript/) [most](https://dev.to/siddharthvenkatesh/component-library-setup-with-react-typescript-and-rollup-onj) "how to" guides is to use Rollup as your bundler. It has direct integration with the TypeScript compiler (using the official plugin `rollup-plugin-typescript`) which fits nicely into the Rollup pipeline. The Vite documentation recommends that you use Rollup directly if Vite library mode doesn't work for you, so that's what I'm going to do. 

Unfortunately, the Rollup Typescript plugin won't bundle dts files. You need a separate plugin for that. There's lots of choices. The most mature (but no longer actively maintained) is `rollup-plugin-dts`. 

To minimize redundant work we configure [two Rollup pipelines](https://gist.github.com/rikkit/b636076740dfaa864ce9ee8ae389b81c#file-rollup-config-js). The first uses `rollup-plugin-typescript` to run the TypeScript compiler. The compiler is configured to check types and generate dts for each source file. The rest of the pipeline bundles js and sourcemap output for each type of module you want to support. The second pipeline uses `rollup-plugin-dts` to load the dts files output by the first pipeline and bundle them into a single dts output.

When I tried it out with `react-virtual-scroll`, it produced 3 files with 60KB of content using 66KB on disk. 

## Best of Both Worlds

I like the simplicity of using the TypeScript compiler to produce a transparent package. On the other hand, I like the format of opaque packages better, but worry about the teetering pile of unsupported plugins it's built on. 

In the end, I realized that I could easily do both. I can create common config files that allow me to build using either Rollup or the TypeScript compiler. My default build will use Rollup but I can easily switch to just the TypeScript compiler if needed.

# Implementation

Let's look at the implementation in more detail.

## Package.json

```
{
  "name": "@candidstartup/react-virtual-scroll",
  "private": false,
  "version": "0.0.0",
  "type": "module",
  "files": ["dist"],
  "module": "./dist/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "dev": "vite",
    "clean": "rimraf dist",
    "prebuild": "npm run clean",
    "build-tsc": "tsc -p tsconfig.build.json",
    "build-rollup": "rollup -c ../rollup.config.mjs",
    "build": "npm run build-rollup",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest"
  },
  "peerDependencies": {
    "react": "^18.2.0"
  }
}
```

We use `package.json` to define high level package meta-data. Our package is configured as a public ESM module with a single import entry point. There are scripts for building via the TypeScript compiler and Rollup, with Rollup as the default. 

Note that `react` is listed under `peerDependencies` rather than `dependencies`. The package will use whatever version of React the consumer has installed. It shouldn't have its own separate version of React.

## TypeScript

Most of the TypeScript configuration is hoisted into a `tsconfig.build.json` shared by everything in `packages/`.

```
{
  "extends": "../tsconfig.build.json",

  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "sourceMap": true,
    "inlineSources": true
  }
}
```

We configure TypeScript to emit JavaScript, type declarations and source maps with the source code inlined. Then at the package level we have a minimal `tsconfig.build.json`.

```
{
  "extends": "../tsconfig.build.json",
  
  "compilerOptions": {
    "outDir": "dist"
  },

  "include": ["src"],
  "exclude": ["src/*.test.*", "src/test"],
}
```

All directories in tsconfig files are resolved relative to the tsconfig file location, not the directory where the TypeScript compiler runs. That's why I have to specify the output directory here, even though it will always be "dist" in every package.

##  Rollup

All the Rollup configuration is in a common config file shared by all packages. There's nothing needed at the per package level.

```
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import del from "rollup-plugin-delete";
import path from "path";

const isExternal = (id) => !id.startsWith(".") && !path.isAbsolute(id);

export default [
  {
    input: "src/index.ts",
    external: isExternal,
    output: [
      {
        sourcemap: true,
        file: "dist/index.js",
        format: "es"
      },
    ],
    plugins: [
      typescript({ "declarationDir": "./types", tsconfig: "./tsconfig.build.json" })
    ],
  },
  {
    input: "dist/types/index.d.ts",
    output: [{
      file: "dist/index.d.ts",
      format: "es",
      plugins: []
    }],
    plugins: [      
      dts(),
      del({ targets: "dist/types", hook: "buildEnd" })
    ],
  }
];
```

The config file returns an array of configurations for the two pipelines that will be run. The output stage is setup to produce ESM modules. If I want to support other formats, I can add additional configs to the `output` array. The typescript plugin is configured to use my `tsconfig.build.json`. Fortunately, file resolution is relative to where Rollup is running not the config file location. 

The typescript plugin lets you override selected config properties. Here I'm overriding where declaration files will be generated to make it easier to feed them into the second pipeline and then clean them up when they're no longer needed.

By default, bundlers will bundle all dependencies. When building a package, I only want to bundle modules that are part of the package. Rollup lets you pass a function to the `external` property which will determine whether a dependency should be treated as external and ignored. I import all internal components using relative paths, so it's easy to check for those. 

## Sample App

I validated the packages produced by using my sample app in two ways. First, I hacked the dev environment by removing the path aliases. This meant that the dev experience would use the built packages rather than reading the source code directly. With both types of package, typing information was available in the IDE and I was able to debug through the source code using the source maps. 

The production build also worked in both cases. Reassuringly they resulted in nearly identical app bundles with 149KB of code and a 380KB source map (most of which is React). 

I enabled source map generation for the sample app so that I could try debugging the production build. In both cases the source maps from the package weren't carried over into the app source map. Instead, the generated source map referenced the JavaScript in the package.

It turns out that this is a [known limitation](https://github.com/rollup/rollup/issues/4532) with  Rollup. The recommended fix is use the plugin `rollup-plugin-sourcemaps`. Unfortunately, the plugin is no longer maintained and doesn't work with  Rollup 4. I found [`@gordonmleigh/rollup-plugin-sourcemaps`](https://github.com/gordonmleigh/rollup-plugin-sourcemaps), which is a Rollup 4 compatible rewrite with the same interface.  It was only recently created but it works for me. The code is incredibly simple so maybe it will be added as an option to Rollup in future.

Here's what the updated app `vite.config.ts` looks like.

```
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import sourcemaps from '@gordonmleigh/rollup-plugin-sourcemaps';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths()
  ],
  build: {
    sourcemap: true,
    rollupOptions:  {
      plugins: [sourcemaps()]
    }
  }
})
```

# Conclusion

It took a while, but I think I've ended up in a good place. Now that I can build usable and maintainable library packages, all I need to figure out is how to publish them. Something for me to look at next time. 
