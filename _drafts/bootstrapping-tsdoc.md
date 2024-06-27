---
title: Bootstrapping TSDoc based documentation
tags: frontend
---

wise words

* Used to adding structured comments that can be used to generate documentation
* Have seen them appearing in Intellisense for React core
* First thought is to find a spec
* https://tsdoc.org/
* Strange mix of well supported and not
* Lots of places in Docs where it takes you to an issue thread rather than documenting behavior
* In general the reference docs for the tags (crucially including examples) are good enough to get by
* First step was to add some TSDoc comments for VirtualOuterComponent and see if VS Code would be able to prompt me with how to write a custom outer component when trying to assign to the outerComponent prop.
* To test TSDoc comments are being picked up by Visual Studio Code Intellisense need to restart TS server after making any change
* https://stackoverflow.com/a/55212141

# First try
* Complete doc on definition of VirtualOuterComponent
* Hoped it would show up for any prop with type `VirtualOuterComponent`
* No. I could only get intellisense to show TSDoc comments assigned directly to the thing you're hovering over.
* `outerComponent={}` - gives me type declaration for VirtualListProps.outerComponent plus nicely formatted TSDoc comment attached
* I can see I need something of type `VirtualOuterProps` but no direct way to get intellisense for it
* Need to run "Go to Definition" command on outerComponent which takes me to the source code or `d.ts` file for `VirtualListProps`
* Now I have a `VirtualOuterProps` I can put my cursor over which brings up the full definition
* Tried using `@inheritDoc` to make the information needed directly available on the `outerComponent` prop declaration
* Not supported by VS Code
* Rathole of trying to find out which tags are supported
* By experiment, very little
* The whole TSDoc comment is formatted and displayed
  * @link tags are supported for common cases
    * Type within the module turns into a clickable "Go to Definition" (where module is same source file)
    * Works across all items in a production bundled build. All type declarations in same `.d.ts` file.
    * URL turns into a link to external website
  * If link can't be resolved, the link text is used so don't lose any information
  * I couldn't get link to a react type to work (e.g. `react#ref`) or using explicit module syntax (e.g. `@candidstartup/react-virtual-scroll#VirtualGrid`)
  * Code samples in \` and \`\`\` tags are nicely formatted with syntax highlighting
  * All other tags come through explicitly
  * Tags that you would expect to see enumerated have a `-` inserted between the tag and the rest of the comment

# Lessons

* Adding documentation makes code much more verbose
* Lots of duplication if I want to provide most useful information immediately accessible via Intellisense
* Going to have to rely on developer going an extra layer deeper and using "Go to Definition" or at least clicking on link.
* Put lengthy information in most core location (once), e.g. examples of usage
* Make extensive use of links to signpost where people should look next.

# Bootstrapping ESLint ?

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
