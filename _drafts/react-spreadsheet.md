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
  theme?: VirtualSpreadsheetTheme | Record<string,string>,

  height: number,
  width: number,

  minRowCount: number,
  minColumnCount: number,

  maxCssSize?: number,
  minNumPages?: number
}
```

The required props are component `width` and `height`, along with `minRowCount` and `minColumnCount`, the minimum number of rows and columns to display. Here's a minimal example of using the component.

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

Internally, I use a [BEM](https://getbem.com/) style naming system for components and elements. These names are the properties of the theme, with the corresponding values being the actual class names used. I had to put the theme related code into a separate source file, `VirtualSpreadsheetTheme.ts`, in order for `VirtualSpreadsheet` to support [Vite HMR](https://vitejs.dev/guide/features#hot-module-replacement).

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

I include a default theme and corresponding `VirtualSpreadsheet.css` file. No obligation to use either. Consumers can use their own CSS and theme.

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

# CSS Modules

What if you don't want my crappy CSS corrupting your global namespace? I've also provided `VirtualSpreadsheet.module.css` if your tooling supports CSS modules. The implementation is surprisingly simple.

```css
/* Wrapper that exposes global stylesheet as a CSS module */
@import './VirtualSpreadsheet.css'
```

You may be wondering why I've typed `theme` in `VirtualSpreadsheetProps` as `VirtualSpreadsheetTheme | Record<string,string>`. Surely you want typing to be as explicit as possible? 

The `VirtualSpreadsheetTheme` type works perfectly if you're writing your own theme by hand. Declare a theme object with that type and TypeScript tells you if you've messed up any of the properties.

The problem comes when using CSS Modules. The CSS Modules tooling automatically generates a JavaScript object with a key for each class name in the module. All you know is that you're getting an object with string keys and values, a `Record<string,string>` type.

TypeScript doesn't have out of the box support for CSS Modules. The simplest solution is for the consuming app to include a `cssmodule.d.ts` source file. This tells TypeScript that importing any `*.module.css` file will return a `Record<string,string>` type.

```ts
declare module '*.module.css' {
  const content: Record<string,string>;
  export default content;
}
```

Some CSS Modules tooling can be extended to generate a `.d.ts` file with an explicit type for each CSS module. However, if the CSS file targets a subset of classes (like my default CSS), the resulting type won't be compatible with `VirtualSpreadsheetTheme`. I also don't want to restrict the choice of CSS Modules tooling that app consumers have to use. The simplest solution is to accept either `VirtualSpreadsheetTheme` or `Record<string,string>`.

# Build

I needed some config changes to get the package to build as I wanted. I have two CSS files to include in the package. However, I don't want them to be bundled during the build process. They should be included as is, so that package consumers can choose which one to consume or just use them as a reference when writing their own CSS. 

The required magic involves changes to two properties in `package.json`. The CSS files have to be added to the `files` key so that they're included in the package. They also need to be added to the `exports` key so that consuming apps can import them from the package.

```json
{
  "files": [
    "dist",
    "src/VirtualSpreadsheet.css",
    "src/VirtualSpreadsheet.module.css"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./VirtualSpreadsheet.css": "./src/VirtualSpreadsheet.css",
    "./VirtualSpreadsheet.module.css": "./src/VirtualSpreadsheet.module.css"
  }
}
```

# Alternative Theme

What was your initial reaction when you saw the `VirtualSpreadsheetTheme` type? My first thought was how ugly and verbose the property names are.

I tried an alternative with more JavaScript friendly property names.

```ts
{
  name: string,
  formula: string,
  grid: string,
  columnHeader: string,
  column: string,
  rowHeader: string,
  row: string,
  cell: string
}
```

Doesn't that look better? However, there are lots of problems. First, my `VirtualSpreadsheet.module.css` would need to contain classes with the same names as the properties. That means I can't reuse `VirtualSpreadsheet.css` to implement it. I'll need to maintain two separate CSS files, or write custom tooling to transform one into the other.

In the example above I left out the class name for the component as a whole. There's no obvious simple choice. I guess you just pick something like `className` or `root`. 

The real kicker comes if you add more components to the package. You probably want to be able to defined a common theme usable by all components. Now you need to distinguish between classes for each component. The natural solution is to include the component name as a prefix, at which point you're pretty much back to where we started.

Eventually, I came to like the ugly and verbose theme property names. They look just like what they are: names that correspond to class names in a CSS file.

# Unit Tests

I added some basic tests to `VirtualSpreadsheet.test.tsx`. Just enough to satisfy myself that the theming mechanism was working and to be able to enable Vitest runs in the build.

```tsx
  render(
    <VirtualSpreadsheet
      className={"Testy"}
      theme={VirtualSpreadsheetDefaultTheme}
      height={240}
      minRowCount={100}
      minColumnCount={26}
      width={600}>
    </VirtualSpreadsheet>
  )
  const spreadsheet = document.querySelector("div div");
  expect(spreadsheet).toHaveProperty("className", "Testy VirtualSpreadsheet");
```

Notice how specifying both a `className` and a `theme` results in two classes being assigned to the component's root element.

# Sample App

The final step was to create a `spreadsheet-sample` app. I verified that both global CSS and CSS Modules imports worked.

```tsx
import { VirtualSpreadsheet, VirtualSpreadsheetDefaultTheme as theme } from '@candidstartup/react-spreadsheet';
import '@candidstartup/react-spreadsheet/VirtualSpreadsheet.css';

export function App() {
  return (
    <VirtualSpreadsheet
    ...
    theme={theme}>
  </VirtualSpreadsheet>
  )
}
```

```tsx
import { VirtualSpreadsheet } from '@candidstartup/react-spreadsheet';
import theme from '@candidstartup/react-spreadsheet/VirtualSpreadsheet.module.css';

export function App() {
  return (
    <VirtualSpreadsheet
    ...
    theme={theme}>
  </VirtualSpreadsheet>
  )
}
```

# Try It!

{% include candid-iframe.html src="/assets/dist/react-spreadsheet/index.html" width="100%" height="fit-content" %}

Well, it's a starting point. 

# Next Time

Where to start? Take your pick from proper spreadsheet column names, scroll to cell, auto-fit the available space, auto-grow the spreadsheet when you scroll or jump beyond the starting size, better styling, real content, ...