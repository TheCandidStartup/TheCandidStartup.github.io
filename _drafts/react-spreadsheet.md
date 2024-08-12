---
title: Introducing React Spreadsheet
tags: react-spreadsheet
---

wise words

* Have a stub react-spreadsheet package and a spreadsheet sample in react-virtual-scroll. Let's combine the two to start off a real react-spreadsheet package.
* Need to think about CSS. More complex than simple `react-virtual-scroll` components with more hard lifting done by CSS.
* For `react-virtual-scroll` just copied what `react-window` did.
* Time for some research into best practices.

# CSS Modules

* All CSS entities exist within the same global scope. Makes it hard for components to have their own local stylesheets
* https://github.com/css-modules/css-modules
* Convention for declaring module specific CSS which is then compiled and bundled
* Compilation process renames module scope stylenames to include a hash that makes them unique
* More tooling to setup
* Vite supports CSS modules but there seem to be a lot of issues with [ongoing work](https://github.com/vitejs/vite/pull/16018) to rebuild the implementation
* Seems to be a general theme with CSS module implementations of problems caused by CSS fragments being [included in the wrong order](https://github.com/vitejs/vite/pull/16018)
* The imminent release of React 19 includes a [new feature](https://react.dev/blog/2024/04/25/react-19#support-for-stylesheets) aimed at stylesheet management for components
* Landscape is complex and in flux. Also over the top for my needs

# Minimal Styling

* Stick with approach used in `react-virtual-scroll` and `react-window`. Separate structure and skin. Use inline styles for structure fundamental for correct operation. Need inline styles for any case where style is dependent on component props. Think width, height, general layout.

For presentation level stuff, aka "skin", rely on the component consumer to provide their own stylesheet. Component supports a `className` property so consumer can ensure there's no conflicts with whatever else is being used in the application. 

# CSS Naming Conventions

* Harder to do for something like `react-spreadsheet`.  It's composed of multiple internal components. Becomes unmanageable if you have props that let you set class name of every element.
* If you just want to avoid name clashes can have a prop for a base name that you use as a prefix to generate all the internal class names. 
* Means consumer has to understand naming convention used.
* What if naming convention conflicts in some way with what consumer wants to do?
* Need to see if there's any consensus around naming conventions
* As usual the great thing about standards is that there are [so many](https://www.frontendmentor.io/articles/understanding-css-naming-conventions-bem-oocss-smacss-and-suit-css-V6ZZUYs1xz) to choose from
* Seems to be a common best practice for elements within a component to use class names with the component class name as a prefix, so thinking seems to be along the right lines
* Can think of CSS Modules as automation for this approach
* I'm going to use [BEM](https://en.bem.info/methodology/quick-start/) for the class names I generate. Doesn't really matter which syntax I pick. This one seems popular and long lived. I like the [rigorous thinking](https://getbem.com/faq/) behind it. 
* BEM is designed to avoid problems with composition. Even if consumers don't like the naming convention, it should be easy for them to work with.

