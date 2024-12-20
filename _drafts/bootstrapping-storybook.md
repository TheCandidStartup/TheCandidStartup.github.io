---
title: Bootstrapping Storybook
tags: frontend
---

wise words

* component and integration testing
* create apps that are simple wrappers around components for testing purposes

# Storybook

* what it is
* options for component and integration testing

# Installation

* As with Playwright, little detail on installation and configuration, just a command to run "inside your project's root directory"
* When that's done is launches a setup wizard to take you through an onboarding experience
* There's nothing in the Docs about monorepos
* I did find this [discussion](https://github.com/storybookjs/storybook/discussions/22521) of different ways to setup Storybook in a monorepo
* The simplest approach is to run the default setup in the root of the monorepo
* There are various downsides described that mean this isn't the best long term solution but seems like the easiest way to kick the tyres and see if I want to go further

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

* Not surprising as we're in root of monorepo so nothing in `package.json` for the installer to go on. 
* Thought it would just be a case of picking `react` from a list of frameworks. The choice includes `react`, `react_scripts`, `react_native`, `react_project` and `webpack_react`.
* Nothing in the storybook documentation to explain the difference.
* The best thing I could find was a [stack overflow question](https://stackoverflow.com/questions/71074658/whats-the-difference-react-vs-react-project-vs-webpack-react-for-storybook) which suggests the difference is in what dependencies are added to `package.json`.
* I can fix up the dependencies easily enough if wrong, so went with `react`.

```
✔ Please choose a project type from the following list: › react
 • Adding Storybook support to your "React" app • Detected Vite project. Setting builder to Vite. ✓

  ✔ Getting the correct version of 9 packages
    Configuring eslint-plugin-storybook in your package.json
  ✔ Installing Storybook dependencies
. ✓
Installing dependencies...

up to date, audited 1132 packages in 1s

found 0 vulnerabilities

attention => Storybook now collects completely anonymous telemetry regarding usage.
This information is used to shape Storybook's roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://storybook.js.org/telemetry

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

* I checked the changes made to `package.json` and didn't see anything too weird. This is the monorepo root `package.json` so only contains dev dependencies. 

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

* I'll integrate the eslint config into my main eslint config later
* As well as installing Storybook, the setup script adds some configuration files in `.storybook` and a complete example in `stories`.

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

* The setup process has detected that I'm using Vite and has included some sort of magic to handle the case where Storybook is installed in a nested directory within a monorepo. 
* The final step is to run the dev server with the example

{% include candid-image.html src="/assets/images/frontend/storybook-example.png" alt="Storybook Dev Server with example project" %}

* I was looking forward to experiencing the setup wizard but it didn't appear for me. I was able to trigger it manually by changing the URL in the browser to `http://localhost:6006/?path=onboarding`.
* It uses large tooltips to guide you through the process of changing the Props for an example button control and saving it as a new story. Then you get to see some lovely animated fireworks.

# First Story

* I added `../packages/*/src/*.stories.@(js|jsx|mjs|ts|tsx)` to the `stories` key in the config file. I'm going to put my stories next to the corresponding component source file.
* I copied one of the example stories to `VirtualList.stories.tsx` and started hacking

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
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked
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

Stories are self-contained ES6 modules that in theory can be imported by anything in the JavaScript ecosystem. Stories need to comply with [Component Story Format](https://storybook.js.org/docs/api/csf). In CSF each module has one required [default export](https://storybook.js.org/docs/api/csf#default-export) and one or more [named exports](https://storybook.js.org/docs/api/csf#named-story-exports). 

The default export, usually named meta, defines metadata for a component which controls how the the component appears inside Storybook. Each named export is a story that represents an interesting state of the component. The simplest story is a list of `args` which are passed as props to your component. 

There's quite a lot of boiler plate to write. As it's a self contained ES6 module, you have to import all your dependencies explicitly, including Storybook APIs and types as well as your component. You'll need to provide reasonable values for any required props. Complex props may pull in additional dependencies. My `VirtualList` component requires a child React component and an implementation of a mapping interface.

The resulting story is actually more verbose than the corresponding sample app.

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

* It worked first time!
* Storybook has generated interactive documentation using my [TSDoc]({% link _posts/2024-07-08-bootstrapping-tsdoc.md %}) comments. It hasn't done a perfect job - there's a few tags it doesn't understand.
* You can view the current value of all props, even the complex ones, and change them
* When you scroll the list, the values passed to the `onScroll` callback are recorded in the actions tab
* I'd need an awful lot more code in the sample app to achieve a fraction of this

# Build a Static App

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

* Seems to have worked. I tried opening the generated `index.html` directly in the browser. Nothing displayed.
* The Storybook [documentation](https://storybook.js.org/docs/sharing/publish-storybook#build-storybook-as-a-static-web-application) suggests using `http-server` to preview locally.

```
% npx http-server /Users/tim/GitHub/infinisheet/storybook-static
Need to install the following packages:
http-server@14.1.1
Ok to proceed? (y) y

Starting up http-server, serving /Users/tim/GitHub/infinisheet/storybook-static

http-server version: 14.1.1

http-server settings: 
CORS: disabled
Cache: 3600 seconds
Connection Timeout: 120 seconds
Directory Listings: visible
AutoIndex: visible
Serve GZIP Files: false
Serve Brotli Files: false
Default File Extension: none

Available on:
  http://127.0.0.1:8080
  http://192.168.1.94:8080
  http://192.168.1.190:8080
Hit CTRL-C to stop the server
```

* That worked. Looks and behaves just like the dev server.
* There are instructions on how to [deploy the built app using GitHub Pages](https://storybook.js.org/docs/sharing/publish-storybook#github-pages) which would allow me to include the Storybook as part of my online documentation. 
* No obvious option for specifying the base path that static app will be served from (cf Vite option). There's a Storybook [discussion](https://github.com/storybookjs/storybook/discussions/17433) that suggests you can [dynamically adjust the Vite config](https://storybook.js.org/docs/api/main-config/main-config-vite-final) that Storybook uses to build. 

# Component Testing

My main reason for looking at Storybook was to find a good solution for component and integration testing. Storybook supports a range of testing functionality.

Storybook has [direct support](https://storybook.js.org/docs/writing-tests/component-testing) for basic component tests. Each story can include a [`play`](https://storybook.js.org/docs/writing-stories/play-function) function which can interact with the component and check assertions. There's one play function per story, so not designed for an extensive test suite. 

The play function is executed and the assertions checked when you look at a story in the Storybook UI. You can also use the [test-runner](https://storybook.js.org/docs/writing-tests/component-testing#execute-tests-with-the-test-runner) command line utility to run all tests for you. 

I think it makes more sense to think of the play function as a way to put the component into a particular state. For example, I might want to create stories that show my `VirtualSpreadsheet` component with row, column and cell selected. The easiest way to achieve that is to interact with the component and click on the appropriate element. 

Storybook has utilities that allow you to [import and run stories in Vitest](https://storybook.js.org/docs/writing-tests/import-stories-in-tests/stories-in-unit-tests). That might be useful for basic validation of story logic but isn't what I'm looking for.

The simplest approach is to use [Playwright to interact with your Storybook](https://storybook.js.org/docs/writing-tests/import-stories-in-tests/stories-in-end-to-end-tests#with-playwright). 

* Each story has a dedicated URL, e.g. `http://localhost:6006/?path=/story/react-virtual-scroll-virtuallist--default`
* The page hosts your component within an iframe
* You can locate the component within the page using `page.locator('iframe[title="storybook-preview-iframe"]').contentFrame()` then chain on whatever locator you want within the page.
* Interact with arg controls as part of the test using `page.locator('#control-itemCount')`
* Alternatively you can use a URL that contains just the control (the content of the iframe) and interact with it directly `http://localhost:6006/iframe.html?id=react-virtual-scroll-virtuallist--default`
* You can create multiple stories as starting points for tests or [override the args](https://storybook.js.org/docs/writing-stories/args#setting-args-through-the-url) of existing stories in the URL `http://localhost:6006/?path=/docs/react-virtual-scroll-virtuallist--docs&args=itemCount:200` or `http://localhost:6006/iframe.html?id=react-virtual-scroll-virtuallist--default&args=itemCount:200`


