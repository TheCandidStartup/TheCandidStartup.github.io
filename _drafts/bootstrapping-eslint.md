---
title: Bootstrapping ESLint
tags: frontend
---

wise words

* Already setup by Vite
* Just never got round to running it before
* 50 or so errors in current code

```
✖ 57 problems (55 errors, 2 warnings)
  27 errors and 0 warnings potentially fixable with the `--fix` option.
```

* Some potentially significant: 
  * `react-hooks/exhaustive-deps`: Another missing entry from a React hook dependency array
  * `no-prototype-builtins`: Assuming that `thing.hasOwnProperty()` will end up calling `Object.prototype.hasOwnProperty`. In unit test utility that mocks property on arbitrary objects. Objects can shadow prototype. Best to explicitly call method you're after with `Object.prototype.hasOwnProperty.call()`. 
  * `react-refresh/only-export-components`: Code is structured in a way which disables HMR for certain changes during development.
* Some better style:
  * `@typescript-eslint/no-explicit-any`: Prefer explicit type or unknown to any
  * `no-var`: Should use `let` or `const` for new code
* Some pointless: 
  * `no-extra-semi`: "Unnecessary semicolon".
  * `@typescript-eslint/no-unused-vars`: Reported for variables starting with "_" which is the TypeScript convention for intentionally unused variables.

* Running the fix option successfully removed all the unnecessary semicolons and changed most of the `vars`. The remaining two were for the same variable in the same block of code. Easy to change the first to `let` and the second to a simple assignment. 
* Easy to [configure](https://github.com/typescript-eslint/typescript-eslint/issues/8464) the `no-unused-vars` rule to ignore unused vars that follow the TypeScript convention

```
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
    ]
  }
```

Apart from lots of `no-explicit-any` errors had three significant errors left.

First was a warning about fast refresh not working in my unit test setup code which does some fancy wrapping and re-exporting. There's no need for fast
refresh of React components in unit tests so I used an eslint comment to disable the warning for that file. 

```
/* eslint-disable react-refresh/only-export-components */
```

* Missing dependency from hook array was an easy fix
* It's a warning by default. I updated config to make it an error. So easy to miss and so important that you don't.

* After that it was very quick to sort out `virtual-scroll-samples`. Only two errors - `no-var` and `react-refresh/only-export-components`. Running `--fix` took care of the `vars`.
* Disabled the `only-export-components` rule for the whole app. Samples are intentionally minimal. Breaking each little component into a separate source file would be verbose and have very little impact. 

# ESLint plugin

```
% npm install --save-dev eslint-plugin-tsdoc

added 7 packages, and audited 983 packages in 3s
```

Then configure `.eslintrc.cjs`. Need to add the plugin and for some reason explicitly say that you want TSDoc syntax errors to be reported.

```
  plugins: [..., 'eslint-plugin-tsdoc'],
  rules: {
    ...,
    'tsdoc/syntax': "error"
  }
```

How did my first attempt at writing TSDoc comments go? Not too bad.

```
  66:6   error  tsdoc-param-tag-missing-hyphen: The @param block should be followed by a parameter name and then a hyphen  tsdoc/syntax
  67:6   error  tsdoc-param-tag-missing-hyphen: The @param block should be followed by a parameter name and then a hyphen  tsdoc/syntax
  86:6   error  tsdoc-param-tag-missing-hyphen: The @param block should be followed by a parameter name and then a hyphen  tsdoc/syntax
  92:6   error  tsdoc-param-tag-missing-hyphen: The @param block should be followed by a parameter name and then a hyphen  tsdoc/syntax
```

# Build Workflows

* Added linting to Build CI and Publish workflows to make sure I keep up with linting

# Monorepo Setup

* Want to setup my ESLint configuration so that as much as possible is shared
* Reading the [ESLint Docs](https://eslint.org/docs/latest/use/configure/configuration-files) confirms that I certainly can split the configuration across multiple config files. It also reveals the the ESLint configuration format is being changed. ESLint 8, which is the version I'm on, supports both the [old](https://eslint.org/docs/latest/use/configure/configuration-files-deprecated) `.eslintrc.cjs` format and the new "flat" `eslint.config.js` format. In ESLint 9 the old format has already been deprecated. It makes sense to switch to the new format before doing any major surgery.
* 

# Upgrading

* Noticed that my `typescript-eslint` is a major version behind. Breaking change is requiring more recent versions of dependencies, all of which I'm already on. The other change for 7.0 is full support for flat config files. So makes sense to update that first.
* Updated and reran linting (with existing old style config). Worked fine. 

* Now convert config files for `react-virtual-scroll` and `virtual-scroll-samples`
* There's a migration tool suitable for simple config files (no JavaScript functions). I think mine qualify

```
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
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'off'
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

Why all those extra packages and why do I need to install them as explicit dependencies? Wonder what the converted config looks like.

```
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

Which is an unholy mess compared with the original. Maybe the extra dependencies are already installed. I wonder what will happen if I just run lint.

```
npm run lint

> @candidstartup/react-virtual-scroll@0.4.0 lint
> eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0

Invalid option '--ext' - perhaps you meant '-c'?
You're using eslint.config.js, some command line flags are no longer available. Please see https://eslint.org/docs/latest/use/command-line-interface for details.
```

* I [need to move](https://eslint.org/docs/latest/use/configure/migration-guide#--ext) the list of file types to lint from the command line to the config file. 
* This time it runs. It seems to work but for some reason is also running against JavaScript files like my old `.eslintrc.cjs` and the content of my unit test coverage report. Despite only asking for TypeScript files. Maybe the converted config is pulling in some defaults that include JavaScript?
* The ESLint documentation [says](https://eslint.org/docs/latest/use/configure/configuration-files#specifying-files-and-ignores) that JavaScript files are included by default unless you explicitly ignore them. Another change in behavior with the new config system?
* I added file patterns for JavaScript to the ignore field in the converted config. Didn't make any difference. 
* The new format is called "flat" because you return a flat array of configs. Each config object is evaluated independently to see if it should apply to a file. If multiple configs apply they are [merged together](https://eslint.org/docs/latest/use/configure/configuration-files#cascading-configuration-objects). The "recommended" config that follows must be overriding my ignore somehow. 
* There's a special case if you want to [globally ignore](https://eslint.org/docs/latest/use/configure/configuration-files#globally-ignoring-files-with-ignores) something. Put the ignore field in a config of it's own without any other keys. 
* That worked. I think its working now.
* Do I really need all that crap in the generated config? 
* Most of the crap is pulled in by use of `FlatCompat`. This is a utility that [translates](https://eslint.org/docs/latest/use/configure/migration-guide#using-eslintrc-configs-in-flat-config) the old eslintrc format into flat config format. It's only needed if you have shared config files you haven't translated yet, or plugins that provide recommended configs that don't support flat config format yet. 
* It looks like the migration tool is being cautious and running everything through `FlatCompat`. I'm pretty sure ESLint's own recommended set supports FlatConfig, as should `typescript-eslint` with the latest version. 
* Looks like lots of people are working through this. I found a much [cleaner looking config](https://github.com/facebook/react/issues/28313#issuecomment-2180984628) that uses most of the same plugins I do. Using that, together with the [typescript-eslint documentation](https://typescript-eslint.io/getting-started), I came up with this.

```
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

* For some reason the Vite template didn't include `eslint-plugin-react` so I added that too.
* Doesn't look any cleaner than the old format. Points to note.
  * tseslint.config [wrapper function](https://typescript-eslint.io/packages/typescript-eslint#config) is only there to add typing support when editing the config file
  * Some plugins have entry points that return recommended config objects that can be added to the flat list of configs
  * Others need you to write your own config - usually just needs you to declare the plugin, maybe with some simple parameters
  * Very easy to screw up and get incomprehensible stack traces when it all blows up at runtime when the config is executed
