---
title: Virtual Scroll Samples
tags: react-virtual-scroll
---

Wise words

* After creating monorepo all my ad hoc sample code for manual testing ended up in app/virtual-scroll-samples
* Previously would edit sample to match whatever I wanted to test, then throw it away
* Want to keep track of all the different samples so I can easily run through them rather than having to create again
* Vite [Multi Page App](https://vitejs.dev/guide/build.html#multi-page-app)
* Want to include Sandbox samples so I don't have to test them separately (cd directory, start different vite server instance, repeat)
* Tried really hard to reuse the Sandbox code as is
* Symbolic link source into samples app with index.jsx mapping to index.js
* No need to mess around with config to hack Vite into treating .js files like JSX
* Same errors - Vite is resolviing symbolic link to find file then using resolved files extension ...
* Try the esbuild config trick again. Doesn't work.
* Bashing head against wall, eventually commented the other stuff out of the config file, magically worked
* React plugin is using SWC rather than Rollup ...
* Find equivalent [SWC options](https://github.com/vitejs/vite-plugin-react-swc?tab=readme-ov-file#parserconfig) (with very stern warning in plugin Docs not to abuse)

```
react({
  parserConfig(id) {
    if (id.endsWith(".js")) return { syntax: "ecmascript", jsx: true };
    if (id.endsWith(".jsx")) return { syntax: "typescript", tsx: false };
    if (id.endsWith(".ts")) return { syntax: "typescript", tsx: false };
    if (id.endsWith(".tsx")) return { syntax: "typescript", tsx: true };
  },
});
```

* Success - at least at dev time
* Try a production build but that fails, Rollup complaining
* Nothing obvious in docs, fed up with trying to abuse system
* In the end just copy the files and rename from .js to .jsx

* Maintainability not great
* If I change Sandbox samples have two places to keep in sync. If painful I can create a sync to copy changes from source of truth ...
* Whenever I add a new sample have to also add in root `index.html` and again in `vite.config.js` for the extra entry point
* Copying Sandbox samples does mean that I can rationalize them. 
  * Shared CSS across all samples. 
  * index.html is identical but has to exist in each sample directory for Vite entry point. Minimal stub file, just copy when making new sample.
* Horizontal scrolling feature
  * Implementation
  * Sample
  * Unit Tests update
