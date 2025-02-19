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

{% include candid-image.html src="/assets/images/infinisheet/storybook-full-width-spreadsheet.png" alt="Storybook with Full Width Spreadsheet" %}

# Read Only

* If I release the `virtual-spreadsheet` package, who would use it? The component is set up for editing, but I haven't implemented and validated that workflow yet. You go through the motions of changing a cell and nothing happens.
* Only useful scenario I can think of is as a viewer of large spreadsheet data
* Need to provide a `readOnly` mode that disables the edit functionality

# Infinisheet Types

# Documentation

# Unit Tests

# Component Tests

# Publish

# Try It!

# Next Time
