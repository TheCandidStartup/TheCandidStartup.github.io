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

* 