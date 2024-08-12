---
title: CSS and React Components
tags: frontend
---

I had just started turning my stub `react-spreadsheet` package into a real one, when I ran into a dilemma. What was I going to do about styling my new spreadsheet component?

Styling wasn't really an issue for my [`react-virtual-scroll`]({% link _topics/react-virtual-scroll.md %}) components. I followed the same approach as [`react-window`](https://github.com/bvaughn/react-window). Everything needed for the components to function correctly, mostly concerning positioning and layout, was implemented as [inline styles](https://legacy.reactjs.org/docs/dom-elements.html#style). 

Everything related to the look of the controls was left for the consumer to do whatever they wanted. There are [props](https://www.thecandidstartup.org/infinisheet/interfaces/_candidstartup_react_virtual_scroll.VirtualGridProps.html#className) you can use to specify class names for the HTML elements used but that's about it. 

Styling for a component that provides a complete spreadsheet frontend will be more significant. There will be more rules to manage and many of them will be concerned with the look of the component.

# Inline Styles

# Cascading Style Sheets

https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade

* Layers
* Scope
* Inline vs CSS

# Specificity

From [MDN CSS Documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity#the_where_exception).

> It enables making CSS selectors very specific in what element is targeted without any increase to specificity

* Important
* Duplicate selector in frantic war of overrides
* Rules directly targeted at elements always take precedence over styles inherited from parents, regardless of specificity 
* Order of declaration if rules have same specificity

# CSS Conventions

* CSS global scope
  * Layers
  * Class names
  * Rules
* Rules for how multiple developers can operate within the global namespace while avoiding conflicts
* Common selector pattern to keep specificity low and consistent
* System for creating and assigning class names to elements which enables common selector pattern to work
* Use of layers (explicit or by convention)
* Works for building a site but how do you enforce your conventions on third party components?

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

* Convention with support in lots of frameworks, including Vite
* Put the CSS for `component.tsx` in `component.module.css`
* Build process replaces class names in CSS with unique ones using a hashing algorithm and outputs ICSS
* The build process converts an import of a CSS module into an import of the ICSS file and the definition of a Javascript object containing the mapping.
* Solves the problem of class name clashes
* Still relies on convention of writing class name based selectors
* Hard to do BEM style mixins or any other way of overriding style in app level CSS file. Class names are dynamically generated. Most [common solution](https://github.com/react-toolbox/react-toolbox?tab=readme-ov-file#customizing-components) is to apply your own class name to the component rather than the one that the CSS module wants you to use. Or apply both the CSS module class name and your own override class name. Of course you have to make sure that your override rules have the same or higher specificity than the module ones ...

# My Approach

* First rule of components - don't mess with global state. Apps owns global state, it makes decisions.
* Want app to be free to decide how it manages stylesheets
* Define a theme prop which consumer can use to pass in mapping which assigns list of class names to each element in component
* Demo app has stylesheet which you can copy and reuse if you want
* Use CSS module to include in app for optional use??