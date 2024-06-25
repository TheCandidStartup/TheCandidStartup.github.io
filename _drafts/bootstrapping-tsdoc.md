---
title: Bootstrapping TSDoc based documentation
tags: frontend
---

wise words

* Used to adding structured comments that can be used to generate documentation
* Have seen them appearing in Intellisense for React core
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
    * Need to check what happens with production bundled build. All type declarations in same file, so should be picked up
    * URL turns into a link to external website
  * I couldn't get link to a react type to work (e.g. `react#ref`)
  * Code samples in \` and \`\`\` tags are nicely formatted with syntax highlighting
  * All other tags come through explicitly
  * Tags that you would expect to see enumerated have a `-` inserted between the tag and the rest of the comment

