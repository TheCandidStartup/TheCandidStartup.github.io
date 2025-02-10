---
title: Hacking TSDoc support into Storybook
tags: frontend
---

wise words

* Storybook has an [Autodocs](https://storybook.js.org/docs/writing-docs/autodocs) feature that generates interactive reference documentation for your components
* It uses reflection to determine the arguments for each component and extracts comments from the source code

{% include candid-image.html src="/assets/images/frontend/storybook-autodocs.png" alt="Storybook Autodocs" %}

# TSDoc Markup

* This is great except that Storybook doesn't understand the TSDoc markup I use in my comments. 
* Some tags are supported, including the `@param` tag used to document the arguments to the `onScroll` callback handler
* Some tags, like `@defaultValue`, are understood then stripped out and ignored. This is particularly annoying as the UI has a column for *Default* that is left unpopulated. 
* Some, including the `@link` and `@group` tags, aren't understood at all and come through as is.
* There's also some odd choices when describing the types of props. The `onScroll` handler is given the accurate and detailed `(offset: number, newScrollState: ScrollState) => void` followed by descriptions of each parameter, but the `layout` enum is simply described as `union` rather than the more useful `'horizontal'|'vertical'`.

# Addons and Customization

* Surely there must be some addon or customization that fixes this
* Tried a few internet searches and found nothing
* The documentation [mentions JSDoc](https://storybook.js.org/docs/api/doc-blocks/doc-block-description) comments in passing in a few places but no details of what's supported
* The generated documentation is created from a set of [Doc blocks](https://storybook.js.org/docs/writing-docs/doc-blocks) using a [template](https://storybook.js.org/docs/writing-docs/autodocs#write-a-custom-template) which you can customize
* The [Description](https://storybook.js.org/docs/writing-docs/doc-blocks#description) and [Controls](https://storybook.js.org/docs/writing-docs/doc-blocks#controls) Doc blocks display descriptions extracted from my TSDoc comments.
* You can [customize doc blocks](https://storybook.js.org/docs/writing-docs/doc-blocks#customizing-doc-blocks) using the Storybook [parameters](https://storybook.js.org/docs/writing-stories/parameters) mechanism. Unfortunately, nothing that would let me hook in and handle the TSDoc tags myself.
* You can [write your own Doc blocks](https://storybook.js.org/docs/api/doc-blocks/doc-block-useof) which have access to the annotated component data including args and description. Seems like overkill to reimplement the `Controls` block just to manipulate the extracted descriptions first.

# Storybook Source Code

* Decided to have a look at the source code to see how they work
* The `Controls` block [uses](https://github.com/storybookjs/storybook/blob/next/code/lib/blocks/src/blocks/Controls.tsx) an `ArgTypesExtractor` function to extract metadata for each argument. Interestingly, the extractor is passed to it via a `docs.extractArgTypes` parameter.
* The  `Description` block works in a [similar way](https://github.com/storybookjs/storybook/blob/next/code/lib/blocks/src/blocks/Description.tsx), using a function passed in via a `docs.extractComponentDescription` parameter. 

# Hooking Extraction Functions

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

* It works. We have a way in
* Now that I know what I'm looking for I found a [couple](https://github.com/storybookjs/storybook/discussions/28974) [of](https://github.com/storybookjs/storybook/issues/18376) [mentions](https://github.com/storybookjs/storybook/blob/4c298be2cfefea3a117d2924618f7da746d0b204/code/addons/docs/docs/recipes.md#migrating-from-notesinfo-addons) that suggest this is a somewhat supported approach.
* Some more searching through source code suggests the following type signatures for the functions

```ts
type ArgTypesExtractor = (component: Component) => StrictArgTypes | null;
type ExtractComponentDescription = (component: Component) => string || null;
```

# Logging Function Arguments

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

# Returning Fake Data

* Took a while to find a definition of the `StrictArgTypes` return value. Defined in the separate [ComponentDriven/csf](https://github.com/ComponentDriven/csf) repo.
* Basically, `StrictArgTypes` is the same as Storybook's [ArgTypes](https://storybook.js.org/docs/api/arg-types).
* Let's try returning some fake data. Descriptions seem to support Markdown, so let's test that.

```ts
const preview: Preview = {
  parameters: {
    docs: {
      extractComponentDescription: (component) => { 
        console.log("extractComponentDescription ", component); 
        return "This is a *description* including `Markdown` syntax with [link](https://www.thecandidstartup.org/)" 
      },
      extractArgTypes: (component) => { 
        console.log("extractArgTypes ", component); 
        return {
          onScroll: {
            description: "It may look like an event handler but I'm claiming it's a magic number instead.",
            table: {
              defaultValue: {
                summary: "42"
              },
              type: {
                summary: "Magic Number"
              }
            }
          }
        }
      }
    }
  }
}
```

* Now Storybook looks like this

{% include candid-image.html src="/assets/images/frontend/storybook-autodocs-overridden.png" alt="Storybook Autodocs Overridden" %}

# Reusing Existing Conversion Code

* How much of existing conversion code can we reuse rather than writing from scratch?
* Implementation of `extractArgTypes` that I'm overriding is defined [deep inside](https://github.com/storybookjs/storybook/blob/next/code/renderers/react/src/docs/extractArgTypes.ts) React framework support and not exported
* Most framework support, including React, makes use of a common [docs-tools](https://github.com/storybookjs/storybook/blob/next/code/core/src/docs-tools/README.md) library which is exported.
* The code calls `extractComponentProps` from `docs-tools`, performs some React specific "enhancements" and then reformats the data as `StrictArgTypes`.
* The first and last steps are simple enough to replicate. The enhancement process involves a lot of very verbose code spread over multiple modules which, ironically, is dedicated to nicely formatting default values that `docs-tools` has failed to extract. 
* I won't need any of that as I can just use the `@defaultValue` tag from my TSDoc comments.

# Logging Data Extracted by Docs-Tools

* I logged the returned values from `extractComponentProps` to the console. The format is extremely verbose so I'll restrict myself to a few informative snippets.
* The format is an array of objects, one for each prop. Each object includes a number of keys of which two are relevant to me. The `propDef` key is another object which includes all the processed data in a form that's compatible with `StrictArgDefs`. The `docgenInfo` key includes the original data from the `component` object.
* Here's what it looks like for the `layout` prop.

```json
  {
    "propDef": {
      "name": "layout",
      "type": {
        "summary": "union"
      },
      "required": false,
      "description": "Choice of 'vertical' or 'horizontal' layouts",
      "defaultValue": null,
      "sbType": {
        "raw": "\"horizontal\" | \"vertical\"",
        "name": "enum",
        "value": [
            "horizontal",
            "vertical"
        ]
      }
    },
    "docgenInfo": {
      "required": false,
      "tsType": {
        "name": "union",
        "raw": "\"horizontal\" | \"vertical\"",
      },
      "description": "Choice of 'vertical' or 'horizontal' layouts\n@defaultValue 'vertical'"
    }
  }
```

* Two points to notice. First, the original docgen description includes a `@defaultValue` tag which has been stripped out and ignored. Second, `docs-tools` has recognized that this is an `enum`, extracted the allowed values and still decided to summarize the type as `union`. 
* Let's look at something more complex. Here's the `onScroll` handler.

```json
  {
    "propDef": {
      "name": "onScroll",
      "type": {
          "summary": "(offset: number, newScrollState: ScrollState) => void"
      },
      "required": false,
      "description": "Callback after a scroll event has been processed and state updated but before rendering",
      "defaultValue": null,
      "sbType": {
          "raw": "(offset: number, newScrollState: ScrollState) => void",
          "name": "function"
      },
      "jsDocTags": {
        "params": [
          {
            "name": "offset",
            "description": "Resulting overall offset. Can be passed to {@link ItemOffsetMapping} to determine top item."
          },
          {
            "name": "newScrollState",
            "description": "New {@link ScrollState} that will be used for rendering."
          }
        ],
        "deprecated": null,
        "returns": null,
        "ignore": false
      }
    },
    "docgenInfo": {
      "required": false,
      "tsType": {
        "name": "signature",
        "type": "function",
        "raw": "(offset: number, newScrollState: ScrollState) => void",
      },
      "description": "Callback after a scroll event has been processed and state updated but before rendering\n@param offset - Resulting overall offset. Can be passed to {@link ItemOffsetMapping} to determine top item.\n@param newScrollState - New {@link ScrollState} that will be used for rendering."
    },
    "typeSystem": "TypeScript"
  }
]
```

* In this case `docs-tools` has summarized the type using the `raw` type signature, the opposite approach to what it did with `layout`.
* The TSDoc `param` tags from the original description have been extracted and returned in a `jsDocTags` object. This isn't mentioned in the public ArgTypes documentation. 

# Returning Extracted Component Props

* Starting point is to return the `docs-tools` extracted data without any enhancements. Can then incrementally improve.
* Condensing the existing code and removing the React specific enhancements leaves me with this.

```ts
import type { StrictArgTypes } from 'storybook/internal/types';
import type { ArgTypesExtractor, Component } from 'storybook/internal/docs-tools';
import { extractComponentProps, extractComponentDescription as baseExtractComponentDescription} from 'storybook/internal/docs-tools';

export const extractComponentDescription = (component: Component) => { 
  const description = baseExtractComponentDescription(component);
  return description;
};

export const extractArgTypes: ArgTypesExtractor = (component) => {
  const props = extractComponentProps(component, 'props');
  if (!props)
    return null;

  return props.reduce((acc: StrictArgTypes, prop) => {
    let { name, description, type, sbType, defaultValue: defaultSummary, jsDocTags, required } = prop.propDef;

    acc[name] = { name, description, 
      type: { required, ...sbType },
      table: { 
        type: type ?? undefined,
        jsDocTags,
        defaultValue: defaultSummary ?? undefined,
      }
    }
    return acc;
  }, {});
};
```

Which gets us back to where we started. 

{% include candid-image.html src="/assets/images/frontend/storybook-autodocs.png" alt="Storybook Autodocs without React enhancements" %}

However, now we can start changing things.

# Enhanced Types

* Start with something simple. Let's provide more detail for `enum` and `union` types.

```ts
  if (sbType.name === 'enum' || sbType.name === 'union')
    type = { summary: sbType.name, detail: sbType.raw };
```

* My first attempt at this put the raw type data in the summary. Annoyingly the Markdown pipeline in Storybook filters out `|` characters when formatted in the code style used for types. I tried a few ways of escaping them but nothing worked.
* Weirdly, putting the raw type data in the detail does work. I convinced myself that this was an overall improvement as large enums would work better in a pop up.

{% include candid-image.html src="/assets/images/frontend/storybook-autodocs-enhanced-enum.png" alt="Storybook Autodocs with enhanced enum" %}

# The Right Way

* Use the TSDoc parsing library to parse the description
* TSDoc comments can use the full power of Markdown and Markdown isn't a regular language, regular expressions won't cut it
* Seems like overkill for my simple comments
* Need to reformat description so that it looks like a source code comment (wrapped in "/**" and "*/" with "*" prefix on each line)
* Configure the parser to understand the Typedoc custom tags I'm using
* Run the parser which produces an incredibly verbose output structure
* Apply transforms to manipulate the structure
* Stringify the structure to reassemble everything.
* `docs-tools` has already done the equivalent using the `comment-parser` JSDoc parser
* This also explains why `@defaultValue` tags are removed. `comment-parser` extracts all the tags it supports. `docs-tools` doesn't do anything with `@defaultValue`.
* I'm just fixing a few things up, surely a few quick regular expressions can't hurt?

# Default Values

* Simplest case as tag has already been removed from description by docs-tools. All I have to do is fish any default value out of the original description in docgenInfo.
* Default value is a [block tag](https://tsdoc.org/pages/spec/tag_kinds/#block-tags) and usually gets a line to itself.

```ts
  const result = prop.docgenInfo.description.match(/\n\s*@defaultValue\s+`*([^\n`]+)`*(\n|$)/);
  console.log("Result", result);
  if (result)
    defaultValue = { summary: result[1] }
```

* The regexp looks for a newline followed by optional white space then the `@defaultValue` tag. There's more white space, then we capture the value until we hit another newline or the end of the string. 
* Typedoc formats default values using the normal Markdown rules. If you want to use a code style, you have to use the relevant markup. I do this for function defaults. 
* Storybook appears to always format default values using code styles. If you include the backtick markup it comes through as a literal character. 
* I fixed this in the regular expression by ignoring any backticks that wrap the value.

{% include candid-image.html src="/assets/images/frontend/storybook-autodocs-overridden-defaults.png" alt="Storybook Autodocs with default values" %}

* Unfortunately, I'd forgotten about this more complex case

```ts
/**
 * Function that defines the key to use for each item given row and column index and value of {@link DisplayBaseProps.itemData}.
 * @defaultValue
 * ```ts
 * (rowIndex, columnIndex, _data) => `${rowIndex}:${columnIndex}`
 * ```
 */
itemKey?: (rowIndex: number, columnIndex: number, data: unknown) => React.Key
```

* Default value is a block tag so includes everything until the start of the next tag or the end of the comment. You can have multiline default values. I had to do it this way because the function definition makes use of backticks and this was the only way of escaping them that worked with Typedoc.
* I considered going back to the right way for all of 30 seconds, then changed the definition.

```ts
 /**
  * @defaultValue `(rowIndex, columnIndex, _data) => '${rowIndex}:${columnIndex}'`
```

* This code isn't literally correct but still does its job of explaining what the default `itemKey` function does.
* It turns out that squashing a function definition into the limited space provided for the "Default" column isn't very readable. If the value string is longer than 10 characters I return it as detail and use `sbType.name` as the summary.

{% include candid-image.html src="/assets/images/frontend/storybook-autodocs-default-detail.png" alt="Storybook Autodocs large default as detail" %}

# Group Tag

* Custom tag used by TypeDoc to group component docs together
* No equivalent in Storybook plus everything is a component. 
* Just need to strip it out

```ts
  const noGroup = description.replace(/\n\s*@group\s+([^\n`]+)(\n|$)/, "");
```

* No drama. This one just worked. 

# Links

* Most links in the docs are to interfaces and properties of interfaces.
* Most appropriate default is to format as code.
* Can look at putting actual Markdown links when I add Storybook to published documentation. Could try and cross-link to the Typedoc API docs.

```ts
function replaceLinks(description: string): string {
  return description.replaceAll(/{@link\s+([^}]+)}/g, (_substring, p1) => {
    const value = p1 as string;
    return "`" + value + "`";
  })
}
```

* Call `replaceLinks` on component, arg and param descriptions.
* Param descriptions are treated as simple text rather than Markdown so the backtick markup comes through. Looks reasonable enough if I can't use code style.

{% include candid-image.html src="/assets/images/frontend/storybook-autodocs-overridden-links.png" alt="Storybook Autodocs Overridden Links" %}

# Next Time

* Publishing!
