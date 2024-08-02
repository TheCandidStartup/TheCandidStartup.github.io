---
title: Introducing React Spreadsheet
tags: react-spreadsheet frontend
---

wise words

* Have a stub react-spreadsheet package and a spreadsheet sample in react-virtual-scroll. Let's combine the two to start off a real react-spreadsheet package.
* Before I could get started I noticed a new warning from VS Code

{% include candid-image.html src="/assets/images/react-spreadsheet/vitest-workspace-warning.png" alt="Vitest Workspace Warning" %}

* Which reminded me that I haven't done anything to better structure my `vite.config.ts` file for a monorepo. I have an independent config for each app and package with no attempt to share common settings.
* App and package configs are very different. So far, I only have one app so lets focus on package configs for now.
* Most of the package config consists of vitest settings so would be great if I can hoist them to the workspace level.
* vitest supports an explicit workspace level config for monorepo setups
* As far as I can tell from vite documentation and the wisdom of the internet, vite doesn't have any equivalent
* Concentrate on sharing the vitest settings as the rest of the config file is pretty much a stub anyway
* Simplest workspace file just tells vitest where to look for each project

```ts
import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/*'
])
```

* I assumed that you could put common config into the workspace file and then run vitest per package as normal
* Wrong. If you run vitest in the package dir it runs as normal, ignoring the workspace file.
* The workspace file is only used if you run vitest at the root. It then checks each package directory for a vite or vitest config file, loads the tests and executes them.
* You can put config into the workspace file but it behaves just like a per-package config. This isn't shared config, just an alternative place to define test projects. Not sure why you'd want to do this. Seems less maintainable to me. 
* Coverage is a special case. The documentation explains that some settings, like coverage, apply globally at the workspace level. Fine, I'll move those settings into the workspace file. Wrong again. The configs in the workspace file are per-package config, not workspace level config! You have to put your coverage options into a separate `vitest.config.ts` file in the root directory. This isn't documented but is covered in a [Q&A discussion](https://github.com/vitest-dev/vitest/discussions/3852).
* Annoyingly, coverage at the workspace level ignores the definition of packages in the workspace file. You have to explicitly specify what to include.

```ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      include: ['packages/*/src/**'],
      exclude: ['packages/*/src/test/**'],
    },
  },
})
```

* At this point I've done enough to fix the VS Code warning. The vitest plugin uses the workspaces file to load tests from all packages. I can run all the tests, run tests for a selected package or individually. Seems to work fine.
* I can also run coverage for the entire workspace in one go. Will need some real packages to see whether this is quicker than running coverage for each package as I do now. Both ways work, so that's nice. 
* The workspace documentation has a separate section on sharing config. You need to put your shared config in a separate file and then import and use the `mergeConfig` utility to combine with per-package config. Interestingly, this seems to be generic. It should work with vite config too.
* I was expecting another misunderstanding on my part, but it worked as expected. I was able to move almost everything into a shared vitest.config.ts

```ts
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    includeSource: ['src/**/*.{js,ts}'], 
    environment: 'jsdom',
    setupFiles: '../../shared/vitest-setup.jsdom.ts',
    coverage: {
      provider: 'istanbul',
      include: ['src/**'],
      exclude: ['src/test/**'],
    },
    fakeTimers: {
      toFake: [...(configDefaults.fakeTimers.toFake ?? []), 'performance'],
    },
  },
  define: { 
    'import.meta.vitest': 'undefined', 
  },
})
```

I could then pull it into a per-package stub. I left the React plugin in my per package config as I'll have a mix of React and vanilla TypeScript packages. If needed, I can have a whole cascade of common configs for different scenarios.

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
