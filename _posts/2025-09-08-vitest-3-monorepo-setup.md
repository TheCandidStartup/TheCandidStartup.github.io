---
title: Vitest 3 Monorepo Setup
tags: frontend
---

I was about to get started turning my stub `react-spreadsheet` package into a real one, when I noticed a new Vitest related warning from VS Code. 

{% capture note-content %}
This is an updated version of *Vitest Monorepo Setup*, originally published April 19, 2024. Use the [previous version]({% link _posts/2024-08-19-vitest-monorepo-setup.md %}) for Vitest 1.6 - 2.x. 

This version requires Vitest 3 or later.
{% endcapture %}
{% include candid-note.html content=note-content %}

{% include candid-image.html src="/assets/images/vitest/multiple-projects-warning.png" alt="Vitest Multiple Projects Warning" %}

# Vite Config Files

Which reminded me that I haven't done anything to better structure my `vite.config.ts` file for a monorepo. Vitest is built on Vite and conveniently uses the same config file. I currently have an independent config for each app and package with no attempt to share common settings.

App and package configs are very different. My `virtual-scroll-samples` app config is mainly concerned with producing a production build of the app. There are no Vitest settings.

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import sourcemaps from '@gordonmleigh/rollup-plugin-sourcemaps'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths()
  ],
  build: {
    sourcemap: true,
    rollupOptions:  {
      plugins: [sourcemaps()],
      input: {
        main: resolve(__dirname, 'index.html'),
        "list-and-grid": resolve(__dirname, 'samples/list-and-grid/index.html'),
        "trillion-row-list": resolve(__dirname, 'samples/trillion-row-list/index.html'),
        "trillion-square-grid": resolve(__dirname, 'samples/trillion-square-grid/index.html'),
        "horizontal-list": resolve(__dirname, 'samples/horizontal-list/index.html'),
        "paging-functional-test": resolve(__dirname, 'samples/paging-functional-test/index.html'),
        "spreadsheet": resolve(__dirname, 'samples/spreadsheet/index.html'),
        "padding": resolve(__dirname, 'samples/padding/index.html'),
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
```

In contrast, my `react-virtual-scroll` package config is mostly made up of Vitest settings.

```ts
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    includeSource: ['src/**/*.{js,ts}'], 
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'istanbul',
      include: ['src/**'],
      exclude: ['src/test/**','src/*.*test.*','src/*.bench.*'],
    },
  },
  define: { 
    'import.meta.vitest': 'undefined', 
  },
})
```

I copied the `react-virtual-scroll` config when I created the `infinisheet-types` package. It would be great if I can hoist all the common settings up to the workspace level. Searching for "Vitest Workspace" took me straight to the relevant [documentation](https://vitest.dev/guide/projects). 

Vitest provides a way to define multiple project configurations in a single Vitest process. It works well for multiple projects within a monorepo setup but can also be used to run tests with different configurations.

 As far as I can tell, there's [no equivalent](https://vitejs.dev/guide/features.html) for Vite. I'm going to concentrate on sharing the Vitest settings as the rest of the config file is pretty much a stub anyway.

# Root Config

Start by creating a `vitest.config.ts` file in your monorepo's root directory. The simplest root config just tells Vitest where to look for each project.

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    projects: ['packages/*/vite.config.ts']
  }
})
```

I assumed that you could put common config into the root level config and then run Vitest per package as normal. I was wrong on both counts.

If you run Vitest in the package directory, it runs as before, ignoring the root config. The root config is only used if you run Vitest in the root directory. It then checks each package directory for a Vite or Vitest config file, loads all the tests from all the packages and executes them together.

You can define projects with their config directly in the root config but it behaves just like a per-package config file. This isn't shared config, just an alternative place to define test projects. I'm not sure why you'd want to do this. It's much easier to maintain package specific settings in a dedicated file in each package directory.

# Global Settings

It gets more confusing. When running Vitest in the root directory, some configuration, like reporters and coverage, needs to be [defined in the root config](https://vitest.dev/guide/projects.html#defining-projects) rather than the per-package config files.

The tests to run are picked up from the per-package configs but coverage specific options, like which files to include in the coverage report, need to be specified here.

```ts
export default defineConfig({
  test: {
    projects: ['packages/*/vite.config.ts']
    coverage: {
      provider: 'istanbul',
      include: ['packages/*/src/**'],
      exclude: ['packages/*/src/test/**','src/*.*test.*','src/*.bench.*'],
    },
  },
})
```

# Taking Stock

At this point I've done enough to fix the VS Code warning. The Vitest plugin uses the root config file to load tests from all packages. I can run all the tests, run tests for a selected package or individually. Seems to work fine.

{% include candid-image.html src="/assets/images/vscode/vitest-testing-palette.png" alt="Vitest in VS Code Testing Palette" %}

I can also run coverage for the entire repo in one go. In testing with my small monorepo, running at the root level is about 30% quicker than letting lerna run a coverage test for each package. You also get a combined coverage report doing it this way.

{% include candid-image.html src="/assets/images/vitest/root-coverage.png" alt="Vitest Monorepo Coverage" %}

# Shared Testing Code

My existing `react-virtual-scroll` package has three files of common testing code in `react-virtual-scroll/src/test`.
* `setup.ts`: a Vitest setup file that automatically makes Jest DOM assertions available for use in each test
* `wrapper.tsx`: a wrapper around `@testing-library/react` that I copied from an official Vitest example
* `utils.ts`: my own set of utility functions

Moving them out from under `react-virtual-scroll/src` means updating all the `import` statements that reference them *and* updating the TypeScript `tsconfig.json` to include them in the set of files processed by the compiler. 

My first thought was to add them to my root `tsconfig.json` which the per-package `tsconfig.json` extends. Unfortunately, that doesn't work because any property in the per-package config overrides that in the root, [even if it's an array property](https://miyoon.medium.com/array-parameters-in-tsconfig-json-are-always-overwritten-11c80bb514e1). Arrays aren't merged.

I had to add `test` to the include array in each per-package stub config.

```
{
  "extends": "../../tsconfig.json",
  "include": ["src", "../../shared/test"]
}
```

# Shared Vite Config

The project documentation has a separate section on [sharing config](https://vitest.dev/guide/projects.html#configuration). You need to put your shared config in a separate file and then import it and use the `mergeConfig` utility to combine with your per-package config. Interestingly, `mergeConfig` seems to be generic. It appears to work with Vite settings too.

I was expecting another misunderstanding on my part, but it worked as expected. I was able to move almost everything into a shared `vitest.config.ts`. I've left the old coverage settings in place so that I can still run per package coverage.

```ts
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    includeSource: ['src/**/*.{js,ts}'], 
    environment: 'jsdom',
    setupFiles: '../../shared/test/setup-jsdom.ts',
    coverage: {
      provider: 'istanbul',
      include: ['src/**'],
      exclude: ['src/test/**','src/*.*test.*','src/*.bench.*'],
    },
  },
  define: { 
    'import.meta.vitest': 'undefined', 
  },
})
```

I could then pull the shared config into a per-package stub. I left the React plugin in my per-package config as I have a mix of React and vanilla TypeScript packages. If needed, I can have a whole cascade of common configs for different scenarios.

```ts
import { defineConfig } from 'vite'
import { mergeConfig } from 'vitest/config'
import configShared from '../../shared/vitest.config'
import react from '@vitejs/plugin-react-swc'

export default mergeConfig(
  configShared,
  defineConfig({
    plugins: [react()],
  })
)
```

# Conclusion

That was more confusing than it needed to be, but I seem to have ended up in a reasonable place. The VS Code warning has gone, I have a system for managing shared Vite and Vitest settings, and I have the option of running unit tests and coverage either per package or for the entire workspace at once.
