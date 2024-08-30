---
title: Introducing React Spreadsheet
tags: react-spreadsheet
thumbnail: /assets/images/infinisheet/react-spreadsheet-architecture.png
---

I seem to have spent the past few weeks repeatedly [finding]({% link _posts/2024-08-19-vitest-monorepo-setup.md %}) [reasons]({% link _posts/2024-08-26-css-react-components.md %}) not to get my `react-spreadsheet` package off the ground. That changes today. First, a quick reminder of the [big picture]({% link _posts/2024-07-29-infinisheet-architecture.md %}). 

{% include candid-image.html src="/assets/images/infinisheet/react-spreadsheet-architecture.svg" alt="React Spreadsheet within the InfiniSheet Architecture" %}

All the Infinisheet frontend apps use `react-spreadsheet` for their main UI. The package needs to implement a React spreadsheet component that implements the classic spreadsheet UI while retrieving the data needed to render the spreadsheet on demand, in a scalable way. 

I have a stub `react-spreadsheet` package which I created when [bootstrapping TypeDoc generated API documentation]({% link _posts/2024-08-05-bootstrapping-typedoc.md %}). I also have [sample code]({% link _posts/2024-07-01-react-virtual-scroll-0-4-0.md %}) for `react-virtual-scroll` which combines my virtual scrolling components into something loosely approximating a spreadsheet. Let's combine the two as the start of a real `react-spreadsheet` package. 

Then iterate.

# Initial Stub

At some point I should create a [template](https://vitejs.dev/guide/#community-templates) or [initializer](https://docs.npmjs.com/cli/v10/commands/npm-init) package. That seems a little premature for my second package. For now, I'll just keep a record of the manual steps involved.

1. Create an empty package using `npm init -y -w packages/name`
2. Copy stub config files from an existing package: `api-extractor.json`, `eslint.config.mjs`, `tsconfig.build.json`, `tsconfig.json`, `tsdoc.json`, `vite.config.ts`
3. Create or copy README.md
4. Copy `package.json` from an existing package over the npm generated `package.json`
  * Replace the copied package name with the new package's name
  * Set `private` to `true` until ready to publish to npm
  * Update `keywords`, `dependencies` and `peerDependencies` as needed
5. Create a `src` folder
6. Copy `src/index.ts` from an existing package and remove everything except the initial `@packageDocumentation` comment

This is *almost* enough to pass my automated "Build CI" workflow. Unfortunately, Vitest fails if it can't find any tests for a package. This time, I temporarily renamed the `test` script in `package.json` so [Lerna]({% link _posts/2024-05-06-bootstrapping-lerna-monorepo.md %}) wouldn't find it. I can rename it back once I have the initial code and test written. Next time I'll try running unit tests using [Vitest workspace mode]({% link _posts/2024-08-19-vitest-monorepo-setup.md %}). Hopefully, it will succeed if it finds some tests in the repo, even if they're all in other packages.

# Virtual Spreadsheet Component

I took my sample code and copied it into `VirtualSpreadsheet.tsx`. The first step was to refactor the code so that hard coded values are replaced with props.

```ts
export interface VirtualSpreadsheetProps {
  className?: string,
  theme?: VirtualSpreadsheetTheme | Record<string, string>,

  height: number,
  width: number,

  minRowCount: number,
  minColumnCount: number,

  maxCssSize?: number,
  minNumPages?: number
}
```

The required props are component `width` and `height`, along with `minRowCount` and `minColumnCount`, the minimum number of rows and columns to display. 

```tsx
<VirtualSpreadsheet
  height={240}
  width={600}
  minRowCount={100}
  minColumnCount={26}>
</VirtualSpreadsheet>
```

The `maxCssSize` and `minNumPages` props are passed through to the internal virtual scrolling components. You'll probably never need to change the defaults. *TODO implement this!*.

Finally, we get to styling. The `className` prop does exactly what you'd expect it to. However, `theme` gets a section to itself.

# Theme

A `theme` is an abstraction that separates styling and class names from the component itself. The [idea]({% link _posts/2024-08-26-css-react-components.md %}) is to leave the app consuming the component to decide how it wants to manage its style sheets. Rather than hard coding the class names applied to each element within the component, we look them up in the theme object. 

Internally, I use a [BEM](https://getbem.com/) style naming system for components and elements. These names are the properties of the theme, with the corresponding values being the actual class names used. 

```ts
export interface VirtualSpreadsheetTheme {
  VirtualSpreadsheet: string,
  VirtualSpreadsheet_Name: string,
  VirtualSpreadsheet_Formula: string,
  VirtualSpreadsheet_Grid: string,
  VirtualSpreadsheet_ColumnHeader: string,
  VirtualSpreadsheet_Column: string,
  VirtualSpreadsheet_RowHeader: string,
  VirtualSpreadsheet_Row: string,
  VirtualSpreadsheet_Cell: string
}
```

I use a variation of [React style](https://en.bem.info/methodology/naming-convention/#react-style) naming which takes the form `ComponentName_ElementName__modifierName_modifierValue`. I don't use the more usual `-` separator characters because they're not valid in JavaScript properties. 

# Default Theme and CSS

The component comes with a default theme and corresponding `VirtualSpreadsheet.css` file. 

```ts
export const VirtualSpreadsheetDefaultTheme: VirtualSpreadsheetTheme = {
  VirtualSpreadsheet: "VirtualSpreadsheet",
  VirtualSpreadsheet_Name: "VirtualSpreadsheet_Name",
  VirtualSpreadsheet_Formula: "VirtualSpreadsheet_Formula",
  VirtualSpreadsheet_Grid: "VirtualSpreadsheet_Grid",
  VirtualSpreadsheet_ColumnHeader: "VirtualSpreadsheet_ColumnHeader",
  VirtualSpreadsheet_Column: "VirtualSpreadsheet_Column",
  VirtualSpreadsheet_RowHeader: "VirtualSpreadsheet_RowHeader",
  VirtualSpreadsheet_Row: "VirtualSpreadsheet_Row",
  VirtualSpreadsheet_Cell: "VirtualSpreadsheet_Cell",
}
```

Not much CSS yet but enough to get the idea of how it works.

```css
.VirtualSpreadsheet_ColumnHeader {
  border: 1px solid lightgrey;
}

.VirtualSpreadsheet_RowHeader {
  border: 1px solid lightgrey;
}

.VirtualSpreadsheet_Grid {
  border: 1px solid lightgrey;
}
```

What if you don't want my crappy CSS corrupting your global namespace? I've also provided `VirtualSpreadsheet.module.css` if your tooling supports CSS modules. If neither of those work, you can provide your own theme, referencing your own CSS.

# Implementation

* Had to split theme type and default declaration into separate source file for Vite fast reload
* Need to explicitly declare css files as exports so they can be resolved via module import
* Need to include in files so they get copied into package
* On import side need declaration file to tell TypeScript compiler how CSS module imports work
* Ended up giving client choice of using explicit type for theme (e.g. if handwriting) or more generic `Record<string, string>` if importing from CSS module
* In theory could use a plugin to auto-generate the declaration file with the exact types used by the CSS module. However, seems like more trouble than it's worth for my purposes. Point of my approach is to leave it up to app to decide what they want to do. 

# Alternatives

* Avoid use of `-` as  isn't valid JavaScript. Would have to write 
* Tried to make theme props more developer friendly but has lots of problems
  *  Would need two different stylesheets
    * VirtualSpreadsheet.css with BEM global class names
    * VirtualSpreadsheet.module.css with local class names for use with CSS Modules
  * Theme props aren't the same as class names in global style sheet
  * Need a special prop name for component's own class name
  * Doesn't extend to multiple components sharing a common theme

# Unit Tests

# Sample App

* Sample that demonstrates both ways
* Using the global stylesheet
* Using CSS module

# Next Time

