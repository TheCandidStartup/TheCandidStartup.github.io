---
title: Building the Infinisheet Storybook
tags: frontend infinisheet
---

wise words
* Now that Storybook bootstrapped, going through all components creating stories.
* Mostly straightforward to implement and dull to read about
* Instead of detailing everything, calling out the cases where new Storybook features were needed

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

{% include candid-image.html src="/assets/images/infinisheet/virtual-list-stories.png" alt="VirtualList Stories" %}

# Full Screen

* `AutoSizer` Component that expands to fill available width and height
* Only works if parent component allows child to expand
* With default Storybook settings `AutoSizer` gets squashed.
* Helpful discussion in Storybook [issue](https://github.com/storybookjs/storybook/issues/2264)
* Needs two things. First, override the layout parameter to `fullscreen` to allow component to use full width. Next, add a [decorator](https://storybook.js.org/docs/writing-stories/decorators) which wraps the component in a `div` with a height set to 100% of the viewport height.

{% raw %}

```ts
const meta: Meta<AutoSizerProps> = {
  decorators: 
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story/>
      </div>
    )
  ],
  parameters: {
    layout: 'fullscreen'
  }
};
```

{% endraw %}

* Storybook auto-generates code from the rendered JSX. Most of the time this gives a good impression of how to use the component.
* Not useful for `AutoSizer` as it expects a render function as a child. Need to override displayed code to be more useful.

```ts
const displayCode = `
<AutoSizer style={{ width: '100%', height: '100%', minWidth: 100, minHeight: 100 }}>
  {({width, height}) => (
    <div style={{ width: width, height: height }}>
      width: {width} <br/>
      height: {height} <br/>
    </div>
  )}
</AutoSizer>`

const meta: Meta<AutoSizerProps> = {
  parameters: {
    docs: {
      source: {
        type: 'code',
        code: displayCode
      }
    }
  }
};
```

# HMR

* As you incrementally add new components and stories often find that the HMR doesn't work correctly. New component/story appears in the menu but when selected displays an incomprehensible error message.
* Restarting the server sorts it out

# Custom Args

* VirtualSpreadsheet auto size

# Interactions

* Interacting with Spreadsheet to get it into a particular visual state
