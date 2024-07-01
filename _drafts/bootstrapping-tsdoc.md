---
title: Bootstrapping TSDoc Based Documentation
tags: frontend
---

[Last time]({% link _posts/2024-07-01-react-virtual-scroll-0-4-0.md %}) I left you with the realization that documentation is a good thing and that I should probably write some. We all know that ["nobody reads documentation"](https://dl.acm.org/doi/pdf/10.1145/105783.105788), so my main focus is on writing documentation that sneaks up on you and jumps out just as you need it.

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

