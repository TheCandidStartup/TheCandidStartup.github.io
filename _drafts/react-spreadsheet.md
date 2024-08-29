---
title: Introducing React Spreadsheet
tags: react-spreadsheet
---

wise words

* Have a stub react-spreadsheet package and a spreadsheet sample in react-virtual-scroll. Let's combine the two to start off a real react-spreadsheet package.

# Theme

* Ref previous post
* Abstraction that separates styling and class names from the component itself
* BEM style class names for internal class names, theme props and default CSS
* Using the [React style](https://en.bem.info/methodology/naming-convention/#react-style) BEM naming system
* `ComponentName-ElementName_modifierName_modifierValue`

* VirtualSpreadsheet.css with BEM global class names
* VirtualSpreadsheet.module.css with local class names for use with CSS Modules
* Sample that demonstrates both ways
* Had to split theme type and default declaration into separate source file for Vite fast reload
* Need to explicitly declare css files as exports so they can be resolved via module import
* Need to include in files so they get copied into package
* On import side need declaration file to tell TypeScript compiler how CSS module imports work
* Ended up giving client choice of using explicit type for theme (e.g. if handwriting) or more generic `Record<string, string>` if importing from CSS module
* In theory could use a plugin to auto-generate the declaration file with the exact types used by the CSS module. However, seems like more trouble than it's worth for my purposes. Point of my approach is to leave it up to app to decide what they want to do. 

