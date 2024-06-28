---
title: Bootstrapping TSDoc Based Documentation
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

