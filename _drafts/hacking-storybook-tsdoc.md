---
title: Hacking TSDoc support into Storybook
tags: frontend
---

wise words

* Storybook has an [Autodocs](https://storybook.js.org/docs/writing-docs/autodocs) feature that generates interactive reference documentation for your components
* It uses reflection to determine the arguments for each component and extracts comments from the source code

{% include candid-image.html src="/assets/images/frontend/storybook-autodocs.png" alt="Storybook Autodocs" %}

* This is great except that Storybook doesn't understand the TSDoc markup I use in my comments. 
* Some tags are supported, including the `@param` tag used to document the arguments to the `onScroll` callback handler
* Some tags, like `@defaultValue`, are understood then stripped out and ignored. This is particularly annoying as the UI has a column for *Default* that is left unpopulated. 
* Some, including the `@link` and `@group` tags, aren't understood at all and come through as is.
* Surely there must be some addon or customization that fixes this
* Tried a few internet searches and found nothing
* The documentation [mentions JSDoc](https://storybook.js.org/docs/api/doc-blocks/doc-block-description) comments in passing in a few places but no details of what's supported
* The generated documentation is created from a set of [Doc blocks](https://storybook.js.org/docs/writing-docs/doc-blocks) using a [template](https://storybook.js.org/docs/writing-docs/autodocs#write-a-custom-template) which you can customize
* The [Description](https://storybook.js.org/docs/writing-docs/doc-blocks#description) and [Controls](https://storybook.js.org/docs/writing-docs/doc-blocks#controls) Doc blocks display descriptions extracted from my TSDoc comments.
* You can [customize doc blocks](https://storybook.js.org/docs/writing-docs/doc-blocks#customizing-doc-blocks) using the Storybook [parameters](https://storybook.js.org/docs/writing-stories/parameters) mechanism. Unfortunately, nothing that would let me hook in and handle the TSDoc tags myself.
* You can [write your own Doc blocks](https://storybook.js.org/docs/api/doc-blocks/doc-block-useof) which have access to the annotated component data including args and description. Seems like overkill to reimplement the `Controls` block just to manipulate the extracted descriptions first.
* Decided to have a look at the source code to see how they work
* The `Controls` block [uses](https://github.com/storybookjs/storybook/blob/next/code/lib/blocks/src/blocks/Controls.tsx) an `ArgTypesExtractor` function to extract metadata for each argument. Interestingly, the extractor is passed to it via a `docs.extractArgTypes` parameter.
* The  `Description` block works in a [similar way](https://github.com/storybookjs/storybook/blob/next/code/lib/blocks/src/blocks/Description.tsx), using a function passed in via a `docs.extractComponentDescription` function. 
* It looks like `null` is an acceptable return type for each function so I can do a quick test to see if I can override them in the `preview.ts` config file.

```ts
const preview: Preview = {
  parameters: {
    docs: {
      extractComponentDescription: () => { return null },
      extractArgTypes: () => { return null }
    }
  }
};
```

* On saving, HMR kicks in and Storybook updates itself

{% include candid-image.html src="/assets/images/frontend/storybook-autodocs-hooked.png" alt="Storybook Autodocs Hooked" %}

* It works. We have a way in.
* Now that I know what I'm looking for I found a [couple](https://github.com/storybookjs/storybook/discussions/28974) [of](https://github.com/storybookjs/storybook/issues/18376) [mentions](https://github.com/storybookjs/storybook/blob/4c298be2cfefea3a117d2924618f7da746d0b204/code/addons/docs/docs/recipes.md#migrating-from-notesinfo-addons) that suggest this is a somewhat supported approach.
* Some more searching through source code suggests the following type signatures for the functions

```ts
type ArgTypesExtractor = (component: Component) => StrictArgTypes | null;
type ExtractComponentDescription = (component: Component) => string || null;
```

* I updated my hooks and logged the `component` object to the console. Here's the relevant parts.

```json
{
  "__docgenInfo": {
    "description": "Virtual Scrolling List\n\nAccepts props defined by {@link VirtualListProps}. \nRefs are forwarded to {@link VirtualListProxy}. \nYou must pass a single instance of {@link DisplayListItem} as a child.\n@group Components",
    "displayName": "VirtualList",
    "props": {
      "className": {
        "required": false,
        "tsType": {
          "name": "string"
        },
        "description": "The `className` applied to the outer container element. Use when styling the entire component."
      },
      "children": {
        "required": true,
        "tsType": {
          "name": "ReactComponentType",
          "raw": "React.ComponentType<DisplayListItemProps>",
        },
        "description": "Component used as a template to render items in the list. Must implement {@link DisplayListItem} interface."
      },
      "itemCount": {
        "required": true,
        "tsType": {
          "name": "number"
        },
        "description": "Number of items in the list"
      },
      "itemOffsetMapping": {
        "required": true,
        "tsType": {
          "name": "ItemOffsetMapping"
        },
        "description": "Implementation of {@link ItemOffsetMapping} interface that defines size and offset to each item in the list\n\nUse {@link useFixedSizeItemOffsetMapping} or {@link useVariableSizeItemOffsetMapping} to create implementations\nfor common cases."
      },
      "onScroll": {
        "required": false,
        "tsType": {
          "name": "signature",
          "type": "function",
          "raw": "(offset: number, newScrollState: ScrollState) => void",
        },
        "description": "Callback after a scroll event has been processed and state updated but before rendering\n@param offset - Resulting overall offset. Can be passed to {@link ItemOffsetMapping} to determine top item.\n@param newScrollState - New {@link ScrollState} that will be used for rendering."
      },
    }
  }
}
```
* Looks like everything needed to populate the UI after I've handled the TSDoc tags
* Took a while to find a definition of the `StrictArgTypes` return value. Defined in the separate [ComponentDriven/csf](https://github.com/ComponentDriven/csf) repo.
* Basically, `StrictArgTypes` is the same as Storybook's [ArgTypes](https://storybook.js.org/docs/api/arg-types).
* How much of existing conversion code can we reuse rather than writing from scratch
* Implementation of `extractArgTypes` that I'm overriding is defined [deep inside](https://github.com/storybookjs/storybook/blob/next/code/renderers/react/src/docs/extractArgTypes.ts) React framework support and not exported
* Most framework support, including React, makes use of common [docs-tools](https://github.com/storybookjs/storybook/blob/next/code/core/src/docs-tools/README.md) library which is exported
* Weird stuff with `jsDocTags` - passed through as side channel?
