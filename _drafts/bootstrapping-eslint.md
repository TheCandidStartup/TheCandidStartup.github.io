---
title: Bootstrapping ESLint
tags: frontend
---

I've [added some TSDoc based comments]({% link _posts/2024-07-08-bootstrapping-tsdoc.md %}) to my [open source project]({% link _topics/react-virtual-scroll.md %}). TSDoc has an [ESLint plugin](https://www.npmjs.com/package/eslint-plugin-tsdoc) that checks for syntax errors in your TSDoc comments. I'd like to try it out, which means getting ESLint off the ground first.

{% include candid-image.html src="/assets/images/intellisense/eslint-logo.png" alt="ESLint Logo" %}

[ESLint](https://eslint.org/) is a static analyzer that looks for problems in your JavaScript based code. It has a pluggable architecture with a rich [ecosystem of plugins](https://github.com/dustinspecker/awesome-eslint).

# Getting Started

Getting it working was easier than I thought. It was installed and setup when I [bootstrapped Vite]({% link _posts/2023-10-23-bootstrapping-vite.md %}). I just hadn't noticed it before. I wonder what I'll see the first time I run it. 

```
  57 problems (55 errors, 2 warnings)
  27 errors and 0 warnings potentially fixable with the `--fix` option.
```

Whoops. I wonder what horrors I have lurking in my code base. Altogether there were seven different types of problem found. 

## react-hooks/exhaustive-deps

This comes from a React Hooks plugin that Vite set up for me. It's identified a missing entry from a React hook dependency array. This is a really easy mistake to make and one that has [bitten me]({% link _posts/2024-06-10-react-virtual-scroll-0-3-0.md %}) before. 

This is a real problem that by itself makes ESLint worth using. Strangely, it's a warning by default. I updated the config to make it an error. 

## no-prototype-builtins

I have a unit testing utility that allows me to mock properties on arbitrary objects, even if they haven't been defined yet. ESLint has identified a subtle but real problem. I call `hasOwnProperty` on the object I'm mocking to see if the property has been defined. I'm assuming that this will end up calling the builtin `Object.prototype.hasOwnProperty`. However, that's not always the case. For example, if the object defines its own `hasOwnProperty()` method.

The best practice is to call `Object.prototype.hasOwnProperty` directly. 

## react-refresh/only-export-components

This is from another plugin that Vite set up for me. It identifies code structured in such a way that Hot Module Reload (HMR) won't work for changes in that code. The main driver for Vite is development experience and near instant reloads, so it makes sense that they install a plugin like this.

In my case, the problem was with unit test setup code that does some fancy wrapping and re-exporting. There's no need for fast
refresh of React components in unit tests so I used an eslint comment to disable the warning for that file. 

```
/* eslint-disable react-refresh/only-export-components */
```

## @typescript-eslint/no-explicit-any

Another plugin installed by Vite. TypeScript developers frequently use the `any` type as a crutch to get code working quickly. In almost all cases that means you lose the full benefit of using TypeScript. You should use an explicit type if known, or `unknown` if not. 

I had lots of instances of this error that were indeed easy to fix by using an explicit type or `unknown` as appropriate. 

## no-var

The `let` and `const` keywords were [added to JavaScript in 2015](https://hacks.mozilla.org/2015/07/es6-in-depth-let-and-const/) to fix problems with `var`. Nobody should be using `var` for new code. However, copy and pasting from example code meant that I was. 

I had lots of these but thankfully this rule comes with auto-fix support. Run ESLint again with the `--fix` flag and your code is changed for you. In my case it correctly fixed all but one instance. The last instance was more complex. I'd declared the same variable twice which `var` allows but `let` doesn't. It was an easy manual fix to remove the second declaration. 

## no-extra-semi

In JavaScript [some statements](https://eslint.org/docs/latest/rules/no-extra-semi) need to end with a semicolon and some don't. I come from a C++ background so I think statements look incomplete without a semicolon. 

This seems like a pointless rule to me. What harm does it do to add semicolons that aren't strictly required? 

This is another rule with auto-fix support. All the extra semicolons were removed when I used `--fix` to sort out my use of `var`.

## @typescript-eslint/no-unused-vars

If the `no-extra-semi` rule seems pointless, this one feels positively perverse. The TypeScript compiler will warn you about unused variables and parameters. If the variable is intentionally unused, you can tell the compiler to stop complaining about it by prefixing it with a "_". 

This rule also checks for unused variables but still complains if the variable starts with "_". Apparently this is [on purpose](https://github.com/typescript-eslint/typescript-eslint/issues/8464) because the authors didn't like the approach used by the TypeScript compiler. Thankfully it's easy to configure the rule to ignore unused vars that follow the TypeScript convention.

```js
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
    ]
  }
```

# ESLint TSDoc Plugin

Finally, I could move on to installing [eslint-plugin-tsdoc](https://www.npmjs.com/package/eslint-plugin-tsdoc)

```
% npm install --save-dev eslint-plugin-tsdoc

added 7 packages, and audited 983 packages in 3s
```

I followed the instructions to configure `.eslintrc.cjs`. You need to add the plugin and for some reason explicitly say that you want TSDoc syntax errors to be reported.

```js
  plugins: [..., 'eslint-plugin-tsdoc'],
  rules: {
    ...,
    'tsdoc/syntax': "error"
  }
```

How did my first attempt at writing TSDoc comments go? Not too bad. Four instances of the same, easy to fix problem. 

```
  66:6   error  tsdoc-param-tag-missing-hyphen: The @param block should be followed by a parameter name and then a hyphen  tsdoc/syntax
  67:6   error  tsdoc-param-tag-missing-hyphen: The @param block should be followed by a parameter name and then a hyphen  tsdoc/syntax
  86:6   error  tsdoc-param-tag-missing-hyphen: The @param block should be followed by a parameter name and then a hyphen  tsdoc/syntax
  92:6   error  tsdoc-param-tag-missing-hyphen: The @param block should be followed by a parameter name and then a hyphen  tsdoc/syntax
```

# Build Workflows

I added linting to my GitHub Actions "Build CI" and "Publish" workflows. I want to make sure I keep up with linting.

# Monorepo Setup

I want to setup my ESLint configuration so that as much as possible is shared between the packages in my monorepo. Reading the [ESLint Docs](https://eslint.org/docs/latest/use/configure/configuration-files) confirms that I can split the configuration across multiple config files. It also reveals the the ESLint configuration format is being changed. ESLint 8, which is the version I'm on, supports both the [old](https://eslint.org/docs/latest/use/configure/configuration-files-deprecated) `.eslintrc.cjs` format and the new "flat" `eslint.config.js` format. In ESLint 9 the old format has already been deprecated. It makes sense to switch to the new format before doing any major surgery.

## Upgrading

I noticed that my installation of `typescript-eslint` is a major version behind. The breaking change is requiring more recent versions of dependencies, all of which I'm already on. The other change for 7.0 is full support for flat config files. I updated and reran linting (with the existing old style config). Worked fine. 

## Migration Tool

Time to convert the config files. ESLint includes a [migration tool](https://eslint.org/docs/latest/use/configure/migration-guide) suitable for simple config files (no JavaScript functions). I think mine qualify.

```js
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'eslint-plugin-tsdoc'],
  rules: {
    "react-refresh/only-export-components": ["warn", {
        allowConstantExport: true,
    }],
    "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
    }],
    "tsdoc/syntax": "error",
    "react-hooks/exhaustive-deps": "error",
  },
}
```

Let's give it a whirl.

```
npx @eslint/migrate-config .eslintrc.cjs 
Need to install the following packages:
@eslint/migrate-config@1.1.1
Ok to proceed? (y) y

Migrating .eslintrc.cjs

WARNING: This tool does not yet work great for .eslintrc.(js|cjs|mjs) files.
It will convert the evaluated output of our config file, not the source code.
Please review the output carefully to ensure it is correct.


Wrote new config to ./eslint.config.mjs

You will need to install the following packages to use the new config:
- @eslint/compat
- globals
- @eslint/js
- @eslint/eslintrc
```

Why all those extra packages and why do I need to install them as explicit dependencies? I wonder what the converted config looks like.

```js
import { fixupConfigRules } from "@eslint/compat";
import reactRefresh from "eslint-plugin-react-refresh";
import tsdoc from "eslint-plugin-tsdoc";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/dist", "**/.eslintrc.cjs"],
}, ...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
)), {
    plugins: {
        "react-refresh": reactRefresh,
        tsdoc,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
        },

        parser: tsParser,
    },

    rules: {
        "react-refresh/only-export-components": ["warn", {
            allowConstantExport: true,
        }],

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        }],

        "tsdoc/syntax": "error",
        "react-hooks/exhaustive-deps": "error",
    },
}];
```

## Getting It Working

That's an unholy mess compared with the original, but I can see where all the extra dependencies are being used. I installed them as requested and tried running lint.

```
npm run lint

> @candidstartup/react-virtual-scroll@0.4.0 lint
> eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0

Invalid option '--ext' - perhaps you meant '-c'?
You're using eslint.config.js, some command line flags are no longer available. Please see https://eslint.org/docs/latest/use/command-line-interface for details.
```

I [need to move](https://eslint.org/docs/latest/use/configure/migration-guide#--ext) the list of file types to lint from the command line to the config file. 

```js
{
  files: ["**/*.ts", "**/*.tsx"],
  ignores: ["**/dist", "**/.eslintrc.cjs"]
}, ...
```

This time it runs. It seems to work but for some reason is also running against JavaScript files, like my old `.eslintrc.cjs` and the content of my unit test coverage report. Despite only asking for TypeScript files and explicitly ignoring `.eslintrc.js`. Maybe the converted config is pulling in some defaults that include JavaScript?

The ESLint documentation [says](https://eslint.org/docs/latest/use/configure/configuration-files#specifying-files-and-ignores) that JavaScript files are included by default unless you explicitly ignore them. I added file patterns for JavaScript to the ignore field in the converted config. It didn't make any difference. 

The new format is called "flat" because you return a flat array of configs. Each config object is evaluated independently to see if it should apply to a file. If multiple configs apply they are [merged together](https://eslint.org/docs/latest/use/configure/configuration-files#cascading-configuration-objects). The "recommended" config that follows must be overriding my ignore somehow. 

It turns out there's a special case if you want to [globally ignore](https://eslint.org/docs/latest/use/configure/configuration-files#globally-ignoring-files-with-ignores) something. Put the ignore field in a config of its own without any other keys. Which is where I went wrong. I put the `files` key in the same config as `ignores`. Once I moved them to a separate config object, everything worked as expected.

```js
{ files: ["**/*.ts", "**/*.tsx"] },
{ ignores: ["**/dist", "**/*.js", "**/*.mjs", "**/*.cjs"] },
...
```

## Cleaning Up

Do I really need all that crap in the generated config? Most of it is pulled in by use of `FlatCompat`. This is a utility that [translates](https://eslint.org/docs/latest/use/configure/migration-guide#using-eslintrc-configs-in-flat-config) the old eslintrc format into flat config format. It's only needed if you have shared config files you haven't translated yet, or plugins that provide recommended configs that don't support flat config format yet. 

It looks like the migration tool is being cautious and running everything through `FlatCompat`. I'm pretty sure ESLint's own recommended set supports flat config, as should `typescript-eslint` with the latest version. 

It looks like lots of people are working through this. I found a much [cleaner looking config](https://github.com/facebook/react/issues/28313#issuecomment-2180984628) that uses most of the same plugins I do. Using that, together with the [typescript-eslint documentation](https://typescript-eslint.io/getting-started), I came up with this.

```js
import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from "eslint-plugin-react-refresh";
import tsdoc from "eslint-plugin-tsdoc";

import { fixupPluginRules } from '@eslint/compat';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  reactRecommended,
  { files: ["**/*.ts", "**/*.tsx"] },
  { ignores: ["**/dist", "**/*.js", "**/*.mjs", "**/*.cjs"] },
  {
    languageOptions: {
      globals: { ...globals.browser }
    },
    plugins: {
      "react-hooks": fixupPluginRules(eslintPluginReactHooks),
      "react-refresh": reactRefresh,
      tsdoc,
    },
    rules: {
      "react-refresh/only-export-components": ["warn", {
          allowConstantExport: true,
      }],
      "@typescript-eslint/no-unused-vars": ["error", {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
      }],
      "tsdoc/syntax": "error",
      "react-hooks/exhaustive-deps": "error",
    } 
  }
);
```

For some reason, the Vite template I originally used to setup ESLint didn't include `eslint-plugin-react`, so I added that too. The final result looks much better than the migration tool output. However, I'm not convinced it's an improvement on the old format. 

The exported configs are wrapped in a call to [`tseslint.config`](https://typescript-eslint.io/packages/typescript-eslint#config). It does nothing apart from returning the configs passed in. It's there so that `typescript-eslint` can provide IntelliSense typing support when editing the configs.

Some plugins have entry points that return recommended config objects that can be added to the flat list of configs. You have to know whether the plugin is returning a single config object or an array. Arrays need spread syntax. 

Other plugins need you to write your own config. Usually that just means declaring the plugin. The `react-hooks` plugin hasn't been updated to support the new plugin interface yet, so needs to be wrapped in `fixupPluginRules` from the `compat` package. 

The new config format is just JavaScript that's imported at runtime. It's very easy to screw up and get incomprehensible stack traces when it all blows up.

## Shared Config

I finally got it working. After that it was easy to convert the config for my sample code package using this one as a template. They're almost identical except that I had to turn a couple of rules off so that each sample can be minimal.

All that was left was to move the common parts of the config into a top level file. Each package has a stub config that imports the top level file and adds any per-package config. Here's what the `virtual-scroll-samples` config looks like.

```js
import configs from "../../eslint.config.mjs";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...configs,
  {
    rules: {
      'react-refresh/only-export-components': 'off',
      'react/no-deprecated': 'off',
      'react/display-name': 'off',
    } 
  }
);
```

# Conclusion

That was more complicated than I thought it was going to be. Particularly as I was starting with a generic config generated by Vite that I'd never used. With hindsight it might have been better to start from scratch.
