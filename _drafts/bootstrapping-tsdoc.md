---
title: Bootstrapping TSDoc
tags: frontend
---

[Last time]({% link _posts/2024-07-01-react-virtual-scroll-0-4-0.md %}) I left you with the realization that documentation is a good thing and that I should probably write some. We all know that ["nobody reads documentation"](https://dl.acm.org/doi/pdf/10.1145/105783.105788), so my main focus is on writing documentation that sneaks up on you and jumps out just as you need it.

{% include candid-image.html src="/assets/images/intellisense/tsdoc-logo.png" alt="TSDoc Logo" %}

I'm talking about [IntelliSense](https://code.visualstudio.com/docs/editor/intellisense) of course. Or ["Code Completion"](https://en.wikipedia.org/wiki/Code_completion), if you prefer a more generic, non-Microsoft term. 

I'm familiar with the process of adding structured comments to code that can be used to generate documentation. I've seen such comments appear in Visual Studio Code IntelliSense while writing code that interacts with React core types. 

{% include candid-image.html src="/assets/images/intellisense/react-imperative-handle.png" alt="React Imperative Handle IntelliSense" %}

There's no magic here. No additional tools needed. No additional compilation step. If you use "Go to Definition" you find this.

```
/**
  * `useImperativeHandle` customizes the instance value that is exposed to parent components when using
  * `ref`. As always, imperative code using refs should be avoided in most cases.
  *
  * `useImperativeHandle` should be used with `React.forwardRef`.
  *
  * @version 16.8.0
  * @see {@link https://react.dev/reference/react/useImperativeHandle}
  */
function useImperativeHandle<T, R extends T>(ref: Ref<T> | undefined, init: () => R, deps?: DependencyList): void;
```

VS Code has copied the comment on the definition into the IntelliSense prompt. There is a little bit more going on. The `{@link URL}` markup has been turned into a clickable hyperlink. Which raises the question, what other tricks does VS Code have given the right markup?

# TSDoc

My first thought was to find a spec for the comment markup. The most common markup language for JavaScript is [JSDoc](https://en.wikipedia.org/wiki/JSDoc). The comment above is clearly some form of JSDoc. There are multiple independent implementations that support [different sets of tags](https://stackoverflow.com/questions/11851722/is-there-a-jsdoc-standard). 

Microsoft, [working with others](https://tsdoc.org/#whos-involved) in the TypeScript community, created [TSDoc](https://tsdoc.org/) to formalize the spec for JSDoc style annotations for TypeScript. As well as the spec, there's also an [open source parser](https://www.npmjs.com/package/@microsoft/tsdoc), used by VS Code and other TypeScript tools. 

Which sounds great until you actually look at the [spec](https://tsdoc.org/pages/spec/overview/). 

{% include candid-image.html src="/assets/images/intellisense/tsdoc-spec.png" alt="TSDoc Spec" %}

Still under development. Read through the RFCs. Look in the code. Look here for the "old" syntax, over there for the "new" syntax. 

The RFCs date from 2018-2020. The spec page was last touched [over a year ago](https://github.com/microsoft/rushstack-websites/tree/main/websites/tsdoc.org/docs/pages/spec), and that only to change the documentation generator used. 

VS Code IntelliSense interprets links. Let's see what the spec says about those. 

{% include candid-image.html src="/assets/images/intellisense/tsdoc-link.png" alt="TSDoc Link" %}

Whatever you do, do NOT look at GitHub [issue #9](https://github.com/microsoft/tsdoc/issues/9). Time loses all sense of meaning. I stumbled out, hours later, still with no idea of how declaration references work. 

Clearly, there was a burst of collaborative energy which resulted in the creation of the TSDoc reference parser, at which point everyone involved lost interest in finishing the formal spec. My advice is to ignore all the rabbit holes. The [four introduction pages](https://tsdoc.org/) and the [tag reference examples](https://tsdoc.org/pages/tags/alpha/) are worth looking at. Ignore the rest.

# First Try

I want to make it easy for users of my `react-virtual-scroll` package to understand how to write a custom "outer component". I'm going to try adding some TSDoc comments for my `VirtualOuterComponent` type. Then see if I can get VS Code to prompt me with how to write a custom outer component when trying to assign to the `outerComponent` prop of `VirtualList`. 

```
<VirtualList
  className={'spreadsheetRowHeader'}
  outerComponent=???
```

If you try this process yourself, you may get frustrated. Most of the time IntelliSense will pick up any changes you make to TSDoc comments immediately. Until, for some reason best known to itself, it stops doing so. If this happens, you [need to run](https://stackoverflow.com/a/55212141) the "TypeScript: Restart TS Server" command from the VS Code command palette. For extra frustration, this command is only available if the active editor window has a TypeScript file open. 

Anyway, after looking at the pages for the [@link](https://tsdoc.org/pages/tags/link/) and [@example](https://tsdoc.org/pages/tags/example/) tags I came up with this helpful documentation. 

```
/**
 * Type of outer container in a virtual scrolling component
 *
 * Can be passed to {@link VirtualList} or {@link VirtualGrid} to replace default
 * implementation. Component must render a div and forward {@link VirtualOuterProps}
 * and any `ref` to it. 
 * 
 * @example Minimal compliant implementation
 * ```
 * const Outer = React.forwardRef<HTMLDivElement, VirtualOuterProps >(({...rest}, ref) => (
 *   <div ref={ref} {...rest} />
 * )
 * ```
 */
export type VirtualOuterComponent = React.ComponentType<VirtualOuterProps>;
```

Unfortunately, when I hover over `outerComponent` in my sample code, all I see is this.

{% include candid-image.html src="/assets/images/intellisense/outer-component.png" alt="outerComponent default IntelliSense" %}

I can see that I need something of type `VirtualOuterComponent` but there's no way to directly bring up the IntelliSense for it. I could only get IntelliSense to show TSDoc comments assigned directly to the item you're hovering over. You need to run the "Go to Definition" command on `outerComponent` which takes you to the source code or `d.ts` file for `VirtualListProps`. Once you have a source file with `VirtualOuterComponent` declared, you can move your cursor over it to bring up the full definition.

{% include candid-image.html src="/assets/images/intellisense/virtual-outer-component.png" alt="VirtualOuterComponent IntelliSense" %}

Which is better than nothing but not ideal. Ideally the information you need should be right there on `outerComponent`.

# @inheritDoc

I could make it work by copying the `VirtualOuterComponent` documentation onto `outerComponent` and every other place where `VirtualOuterComponent` is used.  However, that's not a sustainable solution. I'd end up with multiple copies of the same documentation. A maintenance nightmare. 

TSDoc has a useful [@inheritDoc](https://tsdoc.org/pages/tags/inheritdoc/) tag for these situations. All I need to do is add the comment `/** {@inheritDoc VirtualOuterComponent} */` to `outerComponent` to have it pull in the comment from `VirtualOuterComponent`. 

{% include candid-image.html src="/assets/images/intellisense/inherit-doc.png" alt="VS Code does nothing with @inheritDoc tags" %}

Which doesn't work. VS Code does nothing with `@inheritDoc` tags. I went down the rathole of trying to find documentation on which tags VS Code supports. I found nothing. As far as I can tell by experiment, only @link and [Markdown](https://commonmark.org/) formatting have any additional effects. 

# @link

Links are conceptually simple. A [@link](https://tsdoc.org/pages/tags/link/) tag can point to a URL or to an API item. Links can optionally include custom link text: `{@link Button | the Button class}`. You refer to API items using a "declaration reference". Yes, the same declaration references that have no documentation, and two different syntaxes. 

Fortunately, there's no need to understand how to write complex declaration references as only the simplest forms work in VS Code. 
* Types within the same module, e.g. `{@link VirtualOuterProps}`
* Properties of a class or interface within the same module, e.g. `{@link VirtualBaseItemProps.style}`

Here, same module means same source file. Which means for me, links from `VirtualList.tsx` to `VirtualBase.ts` don't work. However, if you're consuming a production build, all the types are declared in `index.d.ts` and all the links work. Clicking on a link is equivalent to running the "Go to Definition" command on that type. 

I couldn't get links to types in other packages to work. For example, `react#ref` and `@candidstartup/react-virtual-scroll#VirtualGrid` are both ignored. Links that aren't supported are preserved in the IntelliSense prompt so the information is still there for the reader to parse. Finally, custom link text works with URL links but not with API item links. 

# Production Builds

Fortunately, production builds just work. All the type declarations together with their TSDoc comments are copied into `index.d.ts` when building a package for release. Nothing else needed.

# Lessons

I went through and documented `react-virtual-scroll` as best as I could. I was surprised at just how much more verbose the code became once I added documentation. There would be lots of duplication if I wanted the most useful information to be immediately accessible via Intellisense. I can't afford to do that.

The approach I settled on was to include lengthy information once in the most common location and to make extensive use of links to signpost where people should look for more information. 

{% include candid-image.html src="/assets/images/intellisense/outer-component-documented.png" alt="outerComponent final IntelliSense with links" %}

Here's the final version of the documentation for `outerComponent`. One click on `VirtualOuterComponent` takes you straight to the definition, where you can read the TSDoc comment in the source code or bring up the IntelliSense to see the same comment formatted for you.

{% include candid-image.html src="/assets/images/intellisense/virtual-outer-component-definition.png" alt="VirtualOuterComponent final IntelliSense" %}

# Next Time

Once you have TSDoc comments, there's [lots more](https://tsdoc.org/pages/intro/using_tsdoc/) you can do with them. There's two tools I want to try. First up is a linting plugin to help me avoid syntax errors in my TSDoc comments. Then there's the API Extractor tool that can generate reference documentation and check for breaking changes in your API from one version of your package to the next. 