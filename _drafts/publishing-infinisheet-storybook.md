---
title: Publishing the Infinisheet Storybook
tags: frontend infinisheet
---

wise words

# CSS

* Want it to look acceptable
* Don't have CSS for virtual-scroll, assume clients will want to use their own
* Use react-spreadsheet CSS for whole thing
* https://storybook.js.org/docs/configure/styling-and-css
* Simplest to add `import '@candidstartup/react-spreadsheet/VirtualSpreadsheet.css'` to the `preview.ts` Storybook config file. This one controls how a story is rendered.
* Also moved `autodocs` and `layout: 'centered'` config here to avoid having to repeat in each stories file

# Args

* Want user to be able to reach same state as any Story by starting with default component and changing props/interacting
* Need to expose complex props in a meaningful way
* Handle cases where complex prop is dependent on values of other props

# Arg Mapping

* https://storybook.js.org/docs/writing-stories/args#mapping-to-complex-arg-values

```ts
const mappingVariableVertical = useVariableSizeItemOffsetMapping(30, [50]);
const mappingFixedVertical = useFixedSizeItemOffsetMapping(30);

const meta = {
  title: 'react-virtual-scroll/VirtualList',
  component: VirtualList,
  argTypes: {
    itemOffsetMapping: {
      options: ['Fixed', 'Variable'],
      mapping: {
        Fixed: mappingFixedVertical,
        Variable: mappingVariableVertical
      }
    }
  }
} satisfies Meta<typeof VirtualList>;
```

# Rewriting Args

* https://storybook.js.org/docs/writing-stories/args#args-can-modify-any-aspect-of-your-component
* Need larger spacing between items in list with horizontal layout
* With custom render function you can rewrite args before passing them as props to your component
* Can also add custom args if needed

```tsx
function rewriteMapping(mapping: ItemOffsetMapping, layout: ScrollLayout = 'vertical'): ItemOffsetMapping {
  if (layout === 'vertical')
    return mapping;

  return (mapping == mappingVariableVertical) ? mappingVariableHorizontal : mappingFixedHorizontal;
}

const meta = {
  title: 'react-virtual-scroll/VirtualList',
  component: VirtualList,
  render: ( {layout, itemOffsetMapping, ...args}) => (
    <VirtualList 
      layout={layout} 
      itemOffsetMapping={rewriteMapping(itemOffsetMapping, layout)}
      {...args}
    />
  )
} satisfies Meta<typeof VirtualList>;
```

* Got in a mess with types when I tried to rewrite the `children` argument. The magic `Meta<typeof VirtualList>` type inference wasn't quite up to the job. Had to be more explicit about the props to get it to work.

```tsx
const meta: Meta<VirtualListProps> = {
  title: 'react-virtual-scroll/VirtualList',
  component: VirtualList,
  render: ( {layout, children: _children, itemOffsetMapping, ...args}) => (
    <VirtualList
      layout={layout} 
      itemOffsetMapping={rewriteMapping(itemOffsetMapping, layout)}
      {...args}>
      {layout === 'horizontal' ? Column : Row}
    </VirtualList>
  )
};
```

# Three Stories

* Rewrote `VirtualList` to expose three stories which cover same range of `VirtualList` behavior as `virtual-scroll-samples`

```ts
export const Vertical: Story = {
  args: {
    className: 'VirtualSpreadsheet_CornerHeader',
    children: Row,
    itemCount: 100,
    itemOffsetMapping: mappingVariableVertical,
    width: 600,
    height: 240,
  },
};

export const Horizontal: Story = {
  args: {
    className: 'VirtualSpreadsheet_CornerHeader',
    layout: 'horizontal',
    children: Column,
    itemCount: 100,
    itemOffsetMapping: mappingVariableHorizontal,
    width: 600,
    height: 50,
  },
};

export const TrillionRows: Story = {
  args: {
    className: 'VirtualSpreadsheet_CornerHeader',
    children: Row,
    itemCount: 1000000000,
    itemOffsetMapping: mappingVariableVertical,
    width: 600,
    height: 240,
  },
};
```

* Notice that the "TrillionRows" story is displayed as "Trillion Rows"

{% include candid-image.html src="/assets/images/infinisheet/virtual-list-stories.png" alt="Name Formula Bar Layout" %}

# Custom Args

* VirtualSpreadsheet auto size

# Interactions

* Interacting with Spreadsheet to get it into a particular visual state
