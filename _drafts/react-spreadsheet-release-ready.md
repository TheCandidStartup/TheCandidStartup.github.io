---
title: >
  React Spreadsheet: Release Ready
tags: react-spreadsheet
---

wise words

# Constant Propagation

* Still have a few hard coded constants that should really be props
* Height of input bar and column header, width of row header

```ts
export interface VirtualSpreadsheetProps<Snapshot> {
  /** Height of input bar
   * @defaultValue 30
   */
  inputBarHeight?: number,

  /** Height of column header
   * @defaultValue 50
   */
  columnHeaderHeight?: number,

  /** Width of row header
   * @defaultValue 100
   */
  rowHeaderWidth?: number,
}
```

# Width and Height

* Thrown together code passing width and height props through to internal grid
* Now sets size of overall component with grid size calculated based on space left after input bar and headers considered

```ts
const columnTemplate = `${rowHeaderWidth}px 1fr`;
const rowTemplate = `${inputBarHeight}px ${columnHeaderHeight}px 1fr`;
const minWidth = rowHeaderWidth * 2;
const minHeight = inputBarHeight + columnHeaderHeight * 2;
const gridWidth = Math.max(width - rowHeaderWidth, rowHeaderWidth);
const gridHeight = Math.max(height - columnHeaderHeight - inputBarHeight, columnHeaderHeight);
```

* Adjusted spreadsheet size in storybook and samples so no change in overall appearance

# Auto Size

* Now that width and height define the size of the overall component, it's easy to add an `AutoSizer` to get the spreadsheet to fill the space available.
* Added "Full Width" and "Full Screen" stories to demonstrate

{% raw %}

```tsx
export const FullWidth: Story = {
  args: {
    theme: theme,
    data: testData,
    width: 0,
    height: 500,
  },
  argTypes:{
    width: {
      table: {
        disable: true
      },
    },
  },
  render: ( {width, height, ...args} ) => (
    <AutoSizer style={{ width: '100%', height }}>
      {({width}) => (
        <VirtualSpreadsheet width={width} height={height} {...args}/>
      )}
    </AutoSizer>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
```

{% endraw %}

* Disable width arg as width controlled by AutoSizer
* Need to use a Storybook "fullscreen" `layout` to have access to the full width
* Custom render method that wraps `VirtualSpreadsheet` with an `AutoSizer` set up to fill the available width while using a fixed height
* "Full Screen" is the same but with both width and height controlled by the `AutoSizer`
* I switched to using the "Full Width" story for the `react-spreadsheet` landing page

{% include candid-image.html src="/assets/images/infinisheet/storybook-full-width-spreadsheet.png" alt="Storybook with Full Width Spreadsheet" %}

# Read Only

* If I release the `virtual-spreadsheet` package, who would use it? The component is set up for editing, but I haven't implemented and validated that workflow yet. You go through the motions of changing a cell and nothing happens.
* Only useful scenario I can think of is as a viewer of large spreadsheet data
* Need to provide a `readOnly` mode that disables the edit functionality

```ts
export interface VirtualSpreadsheetProps<Snapshot> {
  readOnly?: boolean;
}
```

* Implementation is simple. Mostly replacing calls to `setEditMode(true)` with `setEditMode(!readOnly)`
* Also set `read-only` attribute on formula and focus sink inputs 

# Infinisheet Types

{% include candid-image.html src="/assets/images/infinisheet/module-architecture.svg" alt="InfiniSheet Architecture" %}

If I'm going to achieve the full InfiniSheet vision, I need to extract common types like `SpreadsheetData` and move them into a common interface package. `SpreadsheetData` has a dependency on `ItemOffsetMapping` which is defined in `react-virtual-scroll`. That will need to move too. To keep things simple, I'm going to define a single `infinisheet-types` package for all common interfaces.

If I know I need to do a major refactor of the API surface area, I should do it before I release rather than after.

## ItemOffsetMapping

* Create stub package following same recipe as [react-spreadsheet]({% link _posts/2024-09-09-react-spreadsheet.md %})
* Lot more stub config files now
* Moved `ItemOffsetMapping`, `FixedSizeItemOffsetMapping` and `VariableSizeItemOffsetMapping` there from `react-virtual-scroll`
* Not limiting myself entirely to interfaces. Small bits of support code where they make sense.
* Want to minimize complexity for those using `react-virtual-scroll` stand alone
* Having some real code there also avoids special cases. Same config as any other library package with unit tests and transpiled and bundled output.
* At first I thought I would have to replace `{@link ItemOffsetMapping}` with `{@link @candidstartup/infinisheet-types!ItemOffsetMapping | ItemOffsetMapping}` when referencing `ItemOffsetMapping` in `react-virtual-scroll` TSDoc comments. Clumsy to use. Typedoc and API Extractor handle it correctly, VS Code removes the `{@link}` wrapper but fails to format as clickable link.
* It turns out that both VS Code and Typedoc will handle `{@link ItemOffsetMapping}` as long as it's in a context where the TypeScript compiler can resolve the reference. Which is pretty much all cases apart from package documentation comments in `index.ts`. Annoyingly API Extractor doesn't do the same, and warns about broken links. Typedoc already tells me about links that can't be resolved so I turned the API Extractor warning off. 
* Started out as I mean to go on by ensuring unit tests and TSDoc comments have 100% coverage.

## SpreadsheetData

* Moved `SpreadsheetData` and `EmptySpreadsheetData` from `react-spreadsheet` to `infinisheet-types`
* 100% unit test and documentation coverage

# Documentation

* Was mostly there already. Took 10 minutes to complete documentation for what's left in `react-spreadsheet`

# Unit Tests

* Only have stub unit tests in `react-spreadsheet`
* Render a spreadsheet with test data and check that expected values appear
* No interaction of any sort
* Miserable 20% code coverage
* Have improved things slightly by getting to 100% coverage on code moved to `infinisheet-types`
* Suspect I'm not going to get to 100% coverage in a hurry but will hit the low hanging fruit
* Invested a couple of hours and got up to 85% statement coverage, 75% branch coverage
* Straightforward to cover logical behavior on click to select, use of keyboard navigation and modifying inputs

```ts
    // Got to cell A2 by changing the Name input
    const name = screen.getByTitle("Name");
    const formula = screen.getByTitle("Formula");
    {act(() => {
      fireEvent.change(name, { target: { value: "A2" }})
      fireEvent.keyUp(name, { key: 'Enter'})
    })}

    // Cell content should be reflected in Formula input
    expect(formula).toHaveProperty("value", "A2");

    // Send cursor down event to focus sink to move to cell A3
    const focusSink = screen.getByTitle("Edit");
    {act(() => { fireEvent.keyDown(focusSink, { key: 'ArrowDown' }) })}
    expect(focusSink).toHaveProperty("value", "");
    expect(name).toHaveProperty("value", "A3");
    expect(formula).toHaveProperty("value", "A3");

    // Go into edit mode by hitting enter on focus cell
    const focusSink = screen.getByTitle("Edit");
    {act(() => { fireEvent.keyDown(focusSink, { key: 'Enter' }) })}
    expect(focusSink).toHaveProperty("value", "A3");
```

* White box testing because I know which events code listens too and don't have to simulate full sequence of events from real user input
* Testing logic triggered by events rather than full browser interaction
* Remaining code becomes increasingly impractical to test because it relies on layout. Could mock that for `react-virtual-scroll` components but too much effort for a complex component like `VirtualSpreadsheet` for too little return.
* Cover those cases with component tests

# Component Tests

* Last time set things up ready for component testing. Two production builds - one fully functional but built against component source code rather than released packages, one built against released packages but with a stripped down set of features.
* Start off by adding a set of smoke tests, checking that each story loads and renders correctly. Can then extend to cover the cases not addressed by unit tests.
* Started by putting together some utility functions to hide the details of Storybook URLs and test vs full build.

```ts
export function storyUrl(iframe: boolean, packageName: string, component: string, story: string): string {
  const base = packageName + "-" + component.toLowerCase() + "--" + pascalCaseToStorybookUrl(story);
  return (iframe ? "/iframe.html?id=" : "/?path=/story/") + base;
}

export function testUrl(url: string): string {
  return (process.env.CI || process.env.PROD) ? "/test" + url : url;
}
```

* The `storyUrl` function handles the details of creating the URL for a component story, depending on whether you want the full Storybook functionality or just the content of the iframe that renders the component.
* The `testUrl` function converts a URL for the full build into one for the test build if the test build is available. That allows me to write tests that will work in both test and dev environments.
* Each component gets its own Playwright `spec` test file. Each has a local function that defines smoke test URLs.

```ts
function smoke(story: string) {
  return testUrl(storyUrl(true, "react-spreadsheet", "VirtualSpreadsheet", story));
}
```

* The smoke tests are really simple.

```ts
test('CellSelected Loads', async ({ page }) => {
  await page.goto(smoke("CellSelected"));
  await expect(page.getByText('A3', { exact: true })).toBeInViewport();
  const cell = page.locator('div.VirtualSpreadsheet_Cell__Focus');
  await expect(cell).toHaveText("1899-12-22");
  await expect(page.getByTitle("Name")).toHaveValue("C3");
  await expect(page.getByTitle("Formula")).toHaveValue("1899-12-22");
});
```

# Publish

* With that I think I have the bare minimum in place to publish `react-spreadsheet`, `react-virtual-scroll`, and `infinisheet-types` to npm. 
* Made sure all three packages have `private: false` flag
* Cross fingers and run my publishing pipeline
* Update blog to add npm links
* Decided not worth adding a separate project page for `infinisheet-types`

# Try It!

* Packages on NPM
* Updated Storybook
* Embed auto-size VirtualSpreadsheet story?

{% include candid-iframe.html src="https://thecandidstartup.org/infinisheet/storybook/iframe?id=react-spreadsheet-virtualspreadsheet--empty" width="100%" height="420px" %}

# Next Time
