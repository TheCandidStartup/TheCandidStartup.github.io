---
title: Bootstrapping Storybook
tags: frontend
---

[Last time]({% link _posts/2025-01-06-component-test-playwright-vitest.md %}), we had a look at Vitest browser mode and Playwright component testing. I was looking for a tool to help with component and integration testing of my React components. 

Neither worked well enough to convince me. In both cases you needed to write a significant amount of wrapper code to make components testable. About the same amount of code as a simple standalone sample app. In both cases the developer experience was worse than using Playwright to test a sample app. 

What if there was a way to write that component wrapper code once and have it automatically integrated into an app that's a combination of sample app, interactive documentation and component test fixture?

# Storybook

[Storybook]() describes itself as a "frontend workshop for building UI components and pages in isolation". Teams use it for UI development, testing and documentation. Storybook supports all the major UI [frameworks](https://storybook.js.org/docs/get-started/frameworks), including React with Vite.

Storybook generates an app that showcases your components. Each component has its own page with embedded documentation and controls that allow you to modify component props and interact with the component. Different component states can be saved as [stories](https://storybook.js.org/docs/get-started/whats-a-story). Each story has a corresponding page in the app. 

Stories are defined using [Component Story Format](https://storybook.js.org/docs/api/csf). CSF is simply an ES6 module, written in JavaScript or TypeScript, that exports `Story` objects and component metadata. 

CSF is portable, allowing stories to be integrated with a variety of [design](https://storybook.js.org/docs/sharing/design-integrations) and [testing](https://storybook.js.org/docs/writing-tests) tools.

# Installation

As with Playwright, there's [little detail](https://storybook.js.org/docs/get-started/install) on installation and configuration, just a command to run "inside your project's root directory". Once that's done, it promises to launch a setup wizard to take you through an onboarding experience.

There's nothing in the documentation about monorepos. However, I did find this [discussion](https://github.com/storybookjs/storybook/discussions/22521) of different ways to set up Storybook in a monorepo.

The simplest approach is to run the default setup in the root of the monorepo. There are various downsides described that mean this isn't the best long term solution. It does seem like the easiest way to kick the tyres and see if I want to go further.

```
% npx storybook@latest init
Need to install the following packages:
storybook@8.4.7
Ok to proceed? (y) y

╭──────────────────────────────────────────────────────╮
│                                                      │
│   Adding Storybook version 8.4.7 to your project..   │
│                                                      │
╰──────────────────────────────────────────────────────╯
 • Detecting project type. ✓
Installing dependencies...

up to date, audited 1047 packages in 1s

found 0 vulnerabilities
    We couldn't detect your project type. (code: UNDETECTED)
    You can specify a project type explicitly via `storybook init --type <type>`, see our docs on how to configure Storybook for your framework: https://storybook.js.org/docs/get-started/install

✔ Do you want to manually choose a Storybook project type to install? … yes
```

I'm running this in the root of a monorepo, so not surprising that there's nothing in `package.json` for the installer to go on. Should be simple enough to pick "React" from a list of project types. 

There's a long list of choices including `react`, `react_scripts`, `react_native`, `react_project` and `webpack_react`. There's nothing in the Storybook documentation to explain the differences. The best thing I could find was a [stack overflow question](https://stackoverflow.com/questions/71074658/whats-the-difference-react-vs-react-project-vs-webpack-react-for-storybook) which suggests the difference is in what dependencies are added to `package.json`.

I can fix up the dependencies easily enough if wrong, so went with `react`.

```
✔ Please choose a project type from the following list: › react
 • Adding Storybook support to your "React" app
 • Detected Vite project. Setting builder to Vite. ✓

  ✔ Getting the correct version of 9 packages
    Configuring eslint-plugin-storybook in your package.json
  ✔ Installing Storybook dependencies

Installing dependencies...

up to date, audited 1132 packages in 1s

found 0 vulnerabilities
```

I checked the changes made to `package.json` and didn't see anything too weird. This is the monorepo root `package.json`, so only contains dev dependencies. 

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "devDependencies": {
    "@chromatic-com/storybook": "^3.2.3",
    "@storybook/addon-essentials": "^8.4.7",
    "@storybook/addon-interactions": "^8.4.7",
    "@storybook/addon-onboarding": "^8.4.7",
    "@storybook/blocks": "^8.4.7",
    "@storybook/react": "^8.4.7",
    "@storybook/react-vite": "^8.4.7",
    "@storybook/test": "^8.4.7",
    "eslint-plugin-storybook": "^0.11.1",
    "storybook": "^8.4.7",
  },
  "eslintConfig": {
    "extends": [
      "plugin:storybook/recommended"
    ]
  }
}
```

I'll integrate the eslint config into my main eslint config later. As well as installing Storybook, the setup script adds some configuration files in `.storybook` and a complete set of example components and stories in `stories`. This is the `main.ts` config file.

```ts
import type { StorybookConfig } from "@storybook/react-vite";

import { join, dirname } from "path";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-onboarding"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-interactions"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
};
export default config;
```

The setup process has detected that I'm using Vite and has included some sort of magic to handle the case where Storybook is installed in a nested directory within a monorepo. 

Setup ends by running the dev server with the example stories.

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Storybook was successfully installed in your project! 🎉                   │
│   To run Storybook manually, run npm run storybook. CTRL+C to stop.          │
│                                                                              │
│   Wanna know more about Storybook? Check out https://storybook.js.org/       │
│   Having trouble or want to chat? Join us at https://discord.gg/storybook/   │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

Running Storybook

> storybook
> storybook dev -p 6006 --quiet

@storybook/core v8.4.7

info Using tsconfig paths for react-docgen
14:36:54 [vite] ✨ new dependencies optimized: @storybook/blocks
14:36:54 [vite] ✨ optimized dependencies changed. reloading
```

Everything seems to be working.

{% include candid-image.html src="/assets/images/frontend/storybook-example.png" alt="Storybook Dev Server with example project" %}

I was looking forward to experiencing the setup wizard but it didn't appear for me. I was able to trigger it manually by changing the URL in the browser to `http://localhost:6006/?path=onboarding`. It uses large tooltips to guide you through the process of changing the Props for an example button control and saving it as a new story. 

Then you get to see some lovely animated fireworks.

# First Story

I added `../packages/*/src/*.stories.@(js|jsx|mjs|ts|tsx)` to the `stories` key in the config file. The recommended practice is to put stories next to the corresponding component source file. I copied one of the example stories to `VirtualList.stories.tsx` and started hacking.

```tsx
import React from "react";
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { VirtualList } from './VirtualList';
import { useVariableSizeItemOffsetMapping } from './useVariableSizeItemOffsetMapping';

const mapping = useVariableSizeItemOffsetMapping(30, [50]);

const meta = {
  title: 'react-virtual-scroll/VirtualList',
  component: VirtualList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
  },
  // Use `fn` to spy on the onScroll arg, which will appear in the actions panel once invoked
  args: { onScroll: fn() },
} satisfies Meta<typeof VirtualList>;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => (
  <div className={ index == 0 ? "header" : "cell" } style={style}>
    { (index == 0) ? "Header" : "Item " + index }
  </div>
);

export const Default: Story = {
  args: {
    children: Row,
    itemCount: 100,
    itemOffsetMapping: mapping,
    width: 600,
    height: 240,
  },
};
```

In CSF each module has one required [default export](https://storybook.js.org/docs/api/csf#default-export) and one or more [named exports](https://storybook.js.org/docs/api/csf#named-story-exports). The default export, usually named meta, defines metadata for a component which controls how it appears inside Storybook. Each named export is a story that represents an interesting state of the component. The simplest story is a list of `args` which are passed as props to your component. 

There's quite a lot of boilerplate to write. As it's a self contained ES6 module, you have to import all your dependencies explicitly, including Storybook APIs and types as well as your component. You'll need to provide reasonable values for any required props. Complex props may pull in additional dependencies. 

My `VirtualList` component requires a child React component and an implementation of a mapping interface. The resulting story is actually more verbose than the corresponding standalone sample app.

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { VirtualList, useVariableSizeItemOffsetMapping } from '@candidstartup/react-virtual-scroll';

const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => (
  <div className={ index == 0 ? "header" : "cell" } style={style}>
    { (index == 0) ? "Header" : "Item " + index }
  </div>
);

function App() {
  const mapping = useVariableSizeItemOffsetMapping(30, [50]);

  return (
    <VirtualList
      height={240}
      itemCount={100}
      itemOffsetMapping={mapping}
      width={600}>
      {Row}
    </VirtualList>
  )
}

createRoot(document.getElementById('root')!).render(<App />);
```

However, you do get a lot for your money once you fire up Storybook. 

{% include candid-image.html src="/assets/images/frontend/storybook-first-story.png" alt="VirtualList story as it appears in Storybook" %}

What do you know, it worked first time.

Storybook has picked up my new story and included my component. There's auto-generated interactive documentation using my [TSDoc]({% link _posts/2024-07-08-bootstrapping-tsdoc.md %}) comments. It hasn't done a perfect job. There's a few tags it doesn't understand.

You can view the current value of all props, even the complex ones, and change them. When you scroll the list, the values passed to the `onScroll` callback are recorded in the actions tab.

I'd need an awful lot more code in the sample app to achieve a fraction of this.

# Static App

So far, I've been running the Storybook development server. When using Vite, this is simply a wrapper around the Vite dev server. You can also build Storybook as a standalone static app. 

Let's give it a try.

```
% npm run build-storybook

> build-storybook
> storybook build

@storybook/core v8.4.7

info => Cleaning outputDir: storybook-static
info => Loading presets
info => Building manager..
info => Manager built (192 ms)
info => Building preview..
info Using tsconfig paths for react-docgen
vite v5.4.11 building for production...
✓ 136 modules transformed.
storybook-static/assets/context-C0qIqeS4.png                 6.12 kB
storybook-static/assets/styling-Bk6zjRzU.png                 7.24 kB
storybook-static/iframe.html                                16.55 kB │ gzip:   4.47 kB
storybook-static/assets/VirtualList.stories-BhGFM1Uu.js     26.21 kB │ gzip:   6.42 kB
...

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 2.18s
info => Preview built (2.74 s)
info => Output directory: /Users/tim/GitHub/infinisheet/storybook-static
```

Again, Storybook is using Vite behind the scenes. The build looks like it worked. I tried opening the generated `index.html` directly in the browser. Nothing displayed.

The Storybook [documentation](https://storybook.js.org/docs/sharing/publish-storybook#build-storybook-as-a-static-web-application) suggests using `http-server` to preview locally.

```
% npx http-server /Users/tim/GitHub/infinisheet/storybook-static
Need to install the following packages:
http-server@14.1.1
Ok to proceed? (y) y

Starting up http-server, serving /Users/tim/GitHub/infinisheet/storybook-static
```

That worked. Looks and behaves just like the dev server.

There are instructions on how to [deploy the built app using GitHub Pages](https://storybook.js.org/docs/sharing/publish-storybook#github-pages) which would allow me to include storybook as part of my online documentation.

There's no obvious option for specifying the base path that the static app will be served from. Vite has a [base config option](https://vite.dev/guide/build#public-base-path) for this. There's a Storybook [discussion](https://github.com/storybookjs/storybook/discussions/17433) that suggests you can [dynamically adjust the Vite config](https://storybook.js.org/docs/api/main-config/main-config-vite-final) that Storybook uses to build. 

# Component Testing

My main reason for looking at Storybook was to find a good solution for component and integration testing. Storybook supports a range of testing functionality.

Storybook has [direct support](https://storybook.js.org/docs/writing-tests/component-testing) for basic component tests. Each story can include a [`play`](https://storybook.js.org/docs/writing-stories/play-function) function which can interact with the component and check assertions. There's one play function per story, so not designed for an extensive test suite. 

The play function is executed and the assertions checked when you look at a story in the Storybook UI. You can also use the [test-runner](https://storybook.js.org/docs/writing-tests/component-testing#execute-tests-with-the-test-runner) command line utility to run all tests for you. 

I think it makes more sense to think of the play function as a way to put the component into a particular state. For example, I might want to create stories that show my `VirtualSpreadsheet` component with row, column and cell selected. The easiest way to achieve that is to interact with the component and click on the appropriate element. 

Storybook has utilities that allow you to [import and run stories in Vitest](https://storybook.js.org/docs/writing-tests/import-stories-in-tests/stories-in-unit-tests). That might be useful for basic validation of story logic but isn't what I'm looking for.

The simplest approach is to use [Playwright to interact with your Storybook](https://storybook.js.org/docs/writing-tests/import-stories-in-tests/stories-in-end-to-end-tests#with-playwright). 

Each story has a dedicated URL that you can treat as a [permalink](https://storybook.js.org/docs/configure/user-interface/sidebar-and-urls#permalink-to-stories). By default, this is based on a combination of the component's title and the story's name. For example, the URL for my first story is `/?path=/story/react-virtual-scroll-virtuallist--default`.

The page hosts your component within an iframe. You can locate the component within the page using `page.locator('iframe[title="storybook-preview-iframe"]').contentFrame()` then chain on whatever locator you want within the page. This is not documented and determined by experiment, so would be sensible to abstract the details within some common test utility functions. 

Similarly, you can interact with the arg controls using locators like `page.locator('#control-itemCount')` which gives you access to an input field that sets the `itemCount` prop. 

If you don't need to interact with the arg controls, you can use a URL that contains just the component (the content of the iframe) and interact with it directly: `/iframe.html?id=react-virtual-scroll-virtuallist--default`.

You can create multiple stories as starting points for tests or [override the args](https://storybook.js.org/docs/writing-stories/args#setting-args-through-the-url) of existing stories in the URL. For example,  `/?path=/docs/react-virtual-scroll-virtuallist--docs&args=itemCount:200` or `/iframe.html?id=react-virtual-scroll-virtuallist--default&args=itemCount:200`.

# Black Box Testing

This all looks great but there's a problem. Component and integration tests should treat the component as a black box, interacting entirely through the public interface.

Storybook prioritizes ease of setup and encourages intrusive integration. Stories are placed next to the corresponding component's source code. Stories use relative imports not package imports. The Storybook app uses a custom build process that directly includes component source code rather than using the built packages.

I could have libraries that pass all unit, component and integration tests while being unusable because I've forgotten to export something vital.

# Storybook as a monorepo app

The consensus from the Storybook monorepo [discussion](https://github.com/storybookjs/storybook/discussions/22521) is that Storybook should be set up as just another app in the monorepo. There are lots of benefits from doing it this way.

You can get rid of the extra special case directories in the monorepo root. Your Storybook config and stories become part of a dedicated app. You can set everything up like any other app. There's no need for special Storybook build commands, output directories and dependency management. 

We can use `dev` and `build` scripts like any other app rather than `storybook` and `build-storybook`. There's a clean separation of Storybook dependencies from those for other apps and packages. Our stories can import components using fully scoped packages and resolve the dependency like any other app. 

Finally, this approach also gives you the option to have multiple Storybook apps if you need different configurations. For example, if you have components that use other frameworks.

I started by removing all the sample stories to get down to a minimal set of files to muck around with. I then set up a basic app skeleton by copying and pasting from my existing `spreadsheet-sample` app. 

The Storybook [Vite builder](https://storybook.js.org/docs/builders/vite) uses the project's existing Vite config file by default so hopefully should just work. 
* I moved the `.storybook` config directory from root to `apps/storybook/.storybook`
* Moved `VirtualList.stories.tsx` from `packages/react-virtual-scroll/src` to `apps/storybook/src`
* Updated `.storybook/main.ts` to look for stories in `../src` rather than `../stories` or directly in packages
* Changed the story to import from `@candidstartup/react-virtual-scroll`

Finally, I updated `package.json`.

```json
{
  "name": "@candidstartup/storybook",
  "private": true,
  "version": "0.6.2",
  "type": "module",
  "files": [
    "dist"
  ],
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "storybook build -o dist",
    "preview": "vite preview --port 6006",
    "playwright": "npx playwright test",
    "lint": "eslint . --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "@candidstartup/react-virtual-scroll": "^0.6.2",
    "@candidstartup/react-spreadsheet": "^0.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

I nearly failed at the first hurdle of changing the package name to "storybook". My first attempt missed off the `@candidstartup` scope qualifier. Everything worked fine until I checked it in and CI failed running `npm ci` with an unintelligible multi-page dependency error. 

After an hour tearing my hair out I eventually found that npm writes an `eresolve-report.txt` file into the npm logs directory which tells you exactly what the problem is. No idea why it doesn't output it to the terminal. Obviously, npm is going to get confused by a dependency tree that includes both my private app package called "storybook" and the main Storybook package also called "storybook". 

The rest of the changes were straightforward.
* Added storybook scripts for `dev` and `build`
* Changed the output directory for the build to the standard `dist` from default of `storybook-static`
* Added my dependencies for the build and left it to Storybook to add whatever it needed at build time

I left the copied `vite.config.ts`, `tsconfig.json` and `tsconfig.build.json` config files as is. To my surprise the dev and build scripts worked first time. I tried running `vite preview` and it happily worked with the build output that Storybook put in `dist`. No need for `http-server`.

I've used the standard Storybook port of `6006` for both dev and preview. This avoids potential conflict with other apps if I want to have Storybook running as a reference while I work on them. Using the same port for dev and preview should make it easy to run Playwright tests against both.

Storybook actually works too well. It picks up and uses the TypeScript path alias definition in my `tsconfig.json` for both development and production builds. This is the definition that allows package imports like `@candidstartup/react-virtual-scroll` to be resolved against the source code in the monorepo. This gives a great development experience but you don't want it to happen for production builds. For true component testing you want the production build to consume the built packages via `node_modules`. 

My other app production builds use the built packages because Vite uses it's own internal `tsconfig`. This doesn't have the path alias or the `vite-tsconfig-paths` plugin that allows Vite to make use of the alias. Storybook must be overriding that behavior somehow.

I initially tried to configure Storybook to use a `tsconfig.build.json` config file, which doesn't include the path alias, but couldn't find an option for that.

Storybook does provide a way to tweak the final merged Vite configuration using the Storybook `viteFinal` [config option](https://storybook.js.org/docs/builders/vite#configuration). That allowed me to remove the `vite-tsconfig-paths` plugin from `vite.config.ts` and then add it conditionally for development builds in `viteFinal`.

```ts
import tsconfigPaths from 'vite-tsconfig-paths';

const config: StorybookConfig = {
  ...,
  async viteFinal(config, { configType }) { 
    const { mergeConfig } = await import("vite");

    if (configType === 'PRODUCTION')
      return config;

    return mergeConfig(config, {
      plugins: [ tsconfigPaths() ]
    })
  }
};
```

# Playwright Test

I added `VirtualList.spec.ts` containing the simplest possible Playwright test.

```ts
import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test('Control loads', async ({ page }) => {
  await page.goto('/iframe.html?id=react-virtual-scroll-virtuallist--default');
  const header = page.getByText('Header');
  await expect(header).toBeInViewport();
});
```

The test loads the isolated version of the component, looks for the first item in the list and confirms that it's in the viewport. Then, I copied `playwright.config.ts` from my spreadsheet sample app and updated it to work with Storybook.

```ts
{
  webServer: {
     command: (process.env.CI || process.env.PROD) ? 'npm run preview' : 'npm run dev',
     url: 'http://localhost:6006/',
     reuseExistingServer: !process.env.CI
  }
}
```

I use the production build when in a CI environment and default to the dev version otherwise. I added a check on my own environment variable so I can force use of the production build locally for final testing, without activating all the other CI specific behavior. Use it like this: `PROD=true npm run playwright`.

I first tried to run the test using the Playwright VS Code extension, but found that only the spreadsheet sample app test had been loaded. It turns out that by default the extension only loads tests for the first config file it finds. You can choose which config file to use via a dropdown in the UI

{% include candid-image.html src="/assets/images/frontend/playwright-vscode-multiple-configs.png" alt="Playwright VSCode Extension with multiple configs" %}

If you click on the icon next to the drop down you can multi-select configs so that all tests are loaded. No idea why this isn't the default.

# ESLint

The final, and most time consuming step, was setting up ESLint to use the storybook plugin. I removed the old style eslint config that `storybook init` added to the root `package.json`, then attempted to merge the Storybook plugin config into my usual per app `eslint.config.mjs`. 

```ts
import configs from "../../eslint.config.mjs";
import tseslint from "typescript-eslint";
import storybook from "eslint-plugin-storybook";

export default tseslint.config(
  ...configs,
  ...storybook.configs['flat/recommended'],
  { ignores: [ ".storybook" ] },
);
```

I had the same experience as every time I touch the new eslint flat config format. It wasn't obvious how to make it work. It seems that every ESLint plugin has a slightly different way of exposing recommended configs. 

After a few false starts I did what I should have done in the first place. I found the Storybook plugin repo and read the [instructions](https://github.com/storybookjs/eslint-plugin-storybook) on how to configure it. 

[Once again]({% link _posts/2024-12-09-infinisheet-chore-updates.md %}) I ran into trouble with typed linting and config files. As previously, I took the easy way out and ignored the config files when linting.

# Build and CI

Once I had Storybook configured as a standard monorepo app, everything else just worked. My [Lerna]({% link _posts/2024-05-06-bootstrapping-lerna-monorepo.md %}) driven local build process runs the dev, build, lint and playwright scripts for each package based on the dependency order defined by `package.json`. 

My [GitHub Actions]({% link _posts/2024-06-03-bootstrapping-github-actions.md %}) powered CI workflow does the same thing. 

# Next Time

All that's left is to write those Storybook test utility functions, add some CSS for basic styling, [add stories for each component]({% link _posts/2025-02-10-building-infinisheet-storybook.md %}), and flesh out the Playwright tests.
