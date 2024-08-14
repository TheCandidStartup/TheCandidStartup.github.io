---
title: CSS and React Components
tags: frontend
---

I had just started turning my stub `react-spreadsheet` package into a real one, when I ran into a dilemma. What was I going to do about styling my new spreadsheet component?

Styling wasn't really an issue for my [`react-virtual-scroll`]({% link _topics/react-virtual-scroll.md %}) components. I followed the same approach as [`react-window`](https://github.com/bvaughn/react-window). Everything needed for the components to function correctly, mostly concerning positioning and layout, was implemented as [inline styles](https://legacy.reactjs.org/docs/dom-elements.html#style). 

Everything related to the look of the controls was left for the consumer to do whatever they wanted. There are [props](https://www.thecandidstartup.org/infinisheet/interfaces/_candidstartup_react_virtual_scroll.VirtualGridProps.html#className) you can use to specify class names for the HTML elements used but that's about it. 

Styling for a component that provides a complete spreadsheet frontend will be more significant. There will be more rules to manage and many of them will be concerned with the look of the component.

# Inline Styles

The simplest approach would be to use inline styles for everything. Then I, as component author, have complete control over styling my component without any risk of those styles interfering with other components or the rest of the app. 

Unfortunately, there are many downsides. Inline styles have higher precedence than any normal stylesheet rules. That makes it difficult for the component's consumer to adjust the styling to their needs.

The component author ends up with verbose, cluttered JSX which makes it harder to understand and maintain. Styles are tied to individual elements making it hard to share common styles across a family of components. 

Finally, extensive use of inline styles tends to lead to lower performance, particularly in React apps. The entire style has to go through the React rendering and reconciliation process. This is particularly wasteful for static styles that the browser could otherwise pre-process and cache.

A good rule of thumb is to only use inline styles for structural properties that are dynamically updated, usually in response to React props changing.

# Cascading Style Sheets

{% include candid-image.html src="/assets/images/frontend/css3-logo.png" alt="CSS 3 Logo" attrib="Creative Commons, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/deed.en), via Wikimedia Commons" %}

If I'm going to be writing CSS I should start by understanding more about it. Of course I know the basics. CSS lets you write rules that apply styles to HTML. Styles are defined using sets of property:value pairs. Each rule starts with a *selector* which via some weird and mysterious syntax somehow decides which HTML elements the rule's properties will be applied to. 

I have a vague understanding of how selectors work, gleaned from copy/paste/hack of existing stylesheets. Time to get more scientific.

# Cascade

Let's start with the [cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade). Style Sheet seems clear enough, but what is "Cascading" all about?

The cascade decides which property value the browser will apply to an HTML element if it's targeted by more than one rule. The first step is to order the rules based on origin. 

Rules from style sheets are lower priority than inline styles. Properties tagged with `!important` are higher priority than anything else. Rules can optionally be imported into named *layers*. Layers have a priority defined by the order in which they were declared.

| Order (low to high) | Origin | Importance |
|---------------------|--------|------------|
| 1 | First layer | normal |
| 2 | Second layer | normal |
| 3 | Last layer | normal |
| 4 | All unlayered styes | normal |
| 5 | Inline styles | normal |
| 6 | All unlayered styles | `!important` |
| 7 | Last layer | `!important` |
| 8 | Second layer | `!important` |
| 9 | First layer | `!important` |
| 10 | Inline style | `!important` |

Just to make things more fun, the layer order is reversed when tagged with `!important`. There's a new `@scope` feature in CSS which adds an additional level of complexity. I'm going to ignore it for now as it's not yet been universally adopted. 

# Specificity

What happens if you have multiple rules from the same origin targeting an element? The next step is to rank the rules by [specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity). A rule that targets an id is higher priority than one that targets a class name which is higher priority than one that targets a type of HTML element. 

Selectors can be arbitrarily complex, using expressions that involve multiple ids, class names and types. To determine the overall specificity you need to count the number of selector components in each [category](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity#selector_weight_categories) resulting in a three-column value in the form ID-CLASS-TYPE. For, example a simple selector like `.myClass` has a specificity of 0-1-0. You compare specificities by comparing column values from left to right. For example, 1-0-0 has higher priority than 0-2-3 which has a higher priority than 0-2-0. 

There are lots of [exceptions](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity#the_is_not_has_and_css_nesting_exceptions) and [special cases](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity#the_where_exception) on top of the basic rules. As you can imagine, it's easy to end up in a mess where you want to override a style but the most natural selector ends up with a specificity that's too low. 

The natural temptation is to make the situation worse by implementing whatever quick fix you can. You might start throwing `!important` around as a one off trump card. Which is fine until everyone starts doing it. Alternatively, you could make your selectors more complex to increase their score. If you ever see `.myClass.myClass.myClass.myClass` as a selector in a stylesheet, you now know why. 

The [`:where` operator](https://developer.mozilla.org/en-US/docs/Web/CSS/:where) allows you to artificially lower the specificity of a selector. Which gives rise to this gem from the [MDN CSS Documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity#the_where_exception).

> It enables making CSS selectors very specific in what element is targeted without any increase to specificity

If after all that, rules have the same specificity, the order of declaration is used to decide. Rules declared later override ones declared earlier. Finally, rules that directly target an element always take priority over properties inherited from a parent, regardless of specificity.  

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

# Atomic CSS

# CSS Modules

* 2015
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

# CSS in JS

# React 19

# Principles

* First rule of components - don't mess with global state. Apps owns global state, it makes decisions.
* MUST Want app to be free to decide how it manages stylesheets
* MUST Nothing placed in global scope unless app opts in
* SHOULD provide default styling so component is useful out of the box
* SHOULD allow individual props in default style to be overridden
* SHOULD allow default style to be removed or replaced completely

# My Approach

* Define a theme prop which consumer can use to pass in mapping which assigns list of class names to each element in component
* Demo app has stylesheet which you can copy and reuse if you want
* Include CSS in package for optional use??
* Can you provide CSS in such a way that you can import it in boring old global way or by wrapping it in a CSS module?