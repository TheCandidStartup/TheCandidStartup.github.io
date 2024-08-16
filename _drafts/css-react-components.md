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

The component author ends up with verbose, cluttered JSX which makes it harder to understand and maintain. Styles are tied to individual elements making it hard to share common styles across a family of components. Some features of CSS simply aren't available with inline styles.

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

Everything in CSS lives in the same global scope. That includes layers, class names and rules. CSS conventions like [BEM](https://getbem.com/), [OOCSS](https://en.wikipedia.org/wiki/OOCSS), [SUIT](https://suitcss.github.io/) and [SMACSS](https://smacss.com/) were created to allow multiple developers to operate in the same space while avoiding conflicts. 

Most conventions use the same underlying principles. They impose some structure by separating styles into different sets. The number of sets and their definitions vary from convention to convention but might include
* Base: Defaults that apply to all elements
* Page: Defaults that apply to all elements on a specific page
* Layout: Overall layout including grids, columns and spacing
* Module: Styles for specific UI components
* State: Appearance changes based on state like hover and focus
* Theme: Colors, typography, branding, "skin".

The convention ensures that styles in different sets override each other in a predictable array. That might be done by using layers, or having rules for which selectors can be used in each set. Restricting the types of selectors that can be used is common in order to ensure that selector specificity is kept low and consistent. This is usually coupled with a system for creating and assigning class names to elements which enables the common selector pattern to work.

As these are simply conventions without any required tooling, they're easy to adapt to your own needs and preferences. This worked well in a world where you have a team building a site from top to bottom. Things get more difficult if you need to integrate third party components. The chances that a component uses your version of a convention are close to zero. You always need to adapt to the way the component works. 

# Atomic CSS

The conventions we've looked at so far have all been variations on traditional [semantic CSS](https://adamwathan.me/css-utility-classes-and-separation-of-concerns/). You give your HTML elements "meaningful" class names which have nothing to do with styling. Styling is a separate concern that CSS deals with. Your write CSS rules that depend on the structure and class names used in the HTML. The HTML is independent of the styling. You can change style without having to touch the HTML.

```html
<div class="chat-notification">
  <div class="chat-notification-logo-wrapper">
    <img class="chat-notification-logo" src="/img/logo.svg" alt="ChitChat Logo">
  </div>
  <div class="chat-notification-content">
    <h4 class="chat-notification-title">ChitChat</h4>
    <p class="chat-notification-message">You have a new message!</p>
  </div>
</div>
```

[Atomic CSS](https://css-tricks.com/growing-popularity-atomic-css/), also known as [functional CSS](https://github.com/tachyons-css/tachyons) or [utility CSS](https://tailwindcss.com/docs/utility-first), turns everything on its head. You have a fixed stylesheet that contains a set of immutable atomic rules. You style the HTML by applying the appropriate combination of atom class names. Now, the HTML depends on the CSS, while the CSS is independent of the HTML. 

```html
<div class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center space-x-4">
  <div class="shrink-0">
    <img class="size-12" src="/img/logo.svg" alt="ChitChat Logo">
  </div>
  <div>
    <div class="text-xl font-medium text-black">ChitChat</div>
    <p class="text-slate-500">You have a new message!</p>
  </div>
</div>
```

You can treat the CSS as a library and reuse it for multiple apps. You can provide tooling that [generates CSS based on app specific config](https://tailwindcss.com/docs/configuration). Your choice of atoms enforces a consistent style. Instead of allowing any text size and any text color, you provide a choice of five of each. You can use an atomic CSS library as a contract between apps and components, building up an [ecosystem](https://tachyons.io/components/) around [each library](https://tailwindui.com/components).

On the downside, you're now locked into the design system your library provides. Any change you want to make, beyond the most superficial customization, will involve changing the class names assigned in the HTML. Usually in multiple locations. 

Each library forms a separate ecosystem. It's very hard to use a [Tailwind CSS](https://tailwindui.com/components) component with a project that uses a different atomic CSS library or a semantic CSS convention. 

# CSS Modules

Class names are in global scope. CSS files need to be included in the `head` section of the HTML page. It's hard for components to define their own stylesheets without putting extra work on the consumer. 

[CSS Modules](https://github.com/css-modules/css-modules) is a specification for declaring module specific CSS which can be directly imported by a component. Everything is locally scoped to the module. You put the CSS for `Component.tsx` in `Component.module.css` and consume it like this:

```tsx
import React from 'react';
import styles from './Component.module.css';

function Component() {
  return (
    <div className={styles.component}>
      <h1 className={styles.title}>Hello, world!</h1>
    </div>
  );
}
```

CSS Modules requires the component author and consumer to use [tooling that supports the CSS Modules specification](https://github.com/css-modules/css-modules/blob/master/docs/get-started.md). A compilation process renames all the entities in the module CSS to include a globally unique hash. It outputs [ICSS](https://github.com/css-modules/icss), an extension to the CSS format, that includes a dictionary mapping local class names to the hashed versions. 

The `import styles` statement returns the ICSS dictionary as a JavaScript object. You can then use the dictionary to assign the hashed class names to the elements used by your component. The tooling is responsible for ensuring that all the ICSS files are included in the HTML page's `head` section. Your bundler would handle this for production builds. 

There are still ways to shoot yourself in the foot. You need to make sure all selectors in your module CSS are class based to avoid leaking effects into the global scope. You still need to use a sensible convention to manage the CSS for each module. 

CSS Modules aren't part of the CSS spec. They're a convention that a lot of tooling has agreed to support. If you use CSS Modules when writing components then you require that your consumers use compatible tooling. Some random googling throws up lots of issues caused by incomplete tooling or slightly different interpretations of the spec. For example, I use Vite. Vite supports CSS modules but there seem to be a lot of issues with [ongoing work](https://github.com/vitejs/vite/pull/16018) to rebuild the implementation. There seems to be a general theme across CSS module implementations of problems caused by CSS fragments being [included in the wrong order](https://github.com/vitejs/vite/pull/16018).

From a consumer's point of view, components that use CSS Modules can be a black box when it comes to styling. The built in styles are hard to override. You can't simply add rules to the app's stylesheet because the class names are dynamically generated. The most [common solution](https://github.com/react-toolbox/react-toolbox?tab=readme-ov-file#customizing-components) is to apply your own class name to the component rather than the one that the CSS module wants you to use. Or apply both the CSS module class name and your own override class name. Then you also have to make sure that your override rules have the same or higher specificity than the module's rules.

# CSS in JS

[CSS in JS](https://levelup.gitconnected.com/a-brief-history-of-css-in-js-how-we-got-here-and-where-were-going-ea6261c19f04) addresses the same problems as CSS Modules but takes a radically different approach. The basic idea is simple. Include whatever CSS your component needs directly in your component's JavaScript using the JavaScript [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) feature. A JavaScript utility library can do the heavy lifting of parsing the embedded CSS and using the DOM to dynamically add the CSS to the current document's `head` section. 

The utility library removes the need for CSS Modules custom tooling. It can generate unique class names and trivially return them to JavaScript. No magic needed, just JavaScript. Because it's just JavaScript, it can do much more. CSS-in-JS libraries like [Styled Components](https://styled-components.com/docs/basics) and [Emotion](https://emotion.sh/docs/introduction) directly integrate with React, inject only the CSS needed for the current page, and provide mechanisms for CSS composition, theming and customization. 

Styled Components uses an API that creates React wrapper components with styling attached. 

```tsx
import React from 'react';
import styled from 'styled-components'

const Wrapper = styled div`
  padding: 4em;
`

const Title = styled h1`
  font-size: 1.5em;
  text-align: center;
`

function Component() {
  return (
    <Wrapper>
      <Title>Hello, world!</Title>
    </Wrapper>
  );
}
```

The `styled` function passes a `className` prop for the generated CSS to the HTML element or React component that it's wrapping. It can be used with any component that accepts `className`. Emotion supports the same API, as well as allowing elements and components to be styled directly. Both libraries allow CSS to be declared using string literals or [JavaScript objects](https://emotion.sh/docs/object-styles).

```tsx
import React from 'react';
import { css } from '@emotion/react'

function Component() {
  return (
    <div css={{
        padding: '4em'
    }}>
      <h1 css={{
        fontSize: '1.5em',
        textAlign: 'center'
      }}>Hello, world!</h1>
    </div>
  );
}
```

As with Atomic CSS, there's an ecosystem around each CSS-in-JS library. Building on Styled Components means that any app using your component needs to add a dependency on Styled Components. In principle you could use a set of components build on different CSS in JS and CSS Modules implementations but in practice you'll keep it simple and pick one ecosystem.

These solutions try to workaround the global nature of CSS but in the end they all end up manipulating global state in the DOM. As we've seen, order of declaration is critical. It's safest to ensure there's only one gatekeeper messing around with you app's CSS.

# React 19

So far, React itself has steered clear of CSS management. That's about to change with the [imminent release of React 19](https://react.dev/blog/2024/04/25/react-19#support-for-stylesheets). React now supports references to stylesheets from React components, with a precedence system that inserts CSS into the DOM in a deterministic order. 

So far, I haven't seen any reaction to this in the CSS Modules and CSS in JS worlds. The description of the feature suggests that React intends to become the single gatekeeper that manages your app's CSS.

> Style libraries and style integrations with bundlers can also adopt this new capability so even if you don’t directly render your own stylesheets, you can still benefit as your tools are upgraded to use this feature.

# Conclusion

When I started looking at CSS and React Components I assumed there would be a standard approach that everyone used. All I needed to do was find some best practice guidelines to follow. 

Instead, I found a fractured landscape with multiple competing approaches. There's no clear winner. The arrival of React 19 is likely to stir the pot further.

# Principles

One of the most important lessons I learnt over the course of my career is that only the app can mess with global state. Global state is, well, global. Individual components, libraries and packages can only modify global state under the control of the app. The app owns global state, it makes the decisions. 

CSS is inherently global, which means the app has to be in charge. Which leads me to the following principles.
* The app MUST be free to decide how it wants to manage stylesheets.
* A component MUST NOT place anything in CSS global scope unless the app explicitly opts in
* A component SHOULD provide default styling so that it's useful out of the box
* A component SHOULD allow individual props in the default styling to be overridden
* A component SHOULD allow the default style to be removed or replaced completely

# My Approach

I don't want to tie myself to any particular system for managing CSS. Whatever I pick will narrow down potential adopters to those apps that have made the same choice. Fortunately, I don't have to. 

My components will support a `theme` prop. A `theme` is an object that maps from the component's local class names to whatever class names the app would like to use. I got the idea from looking at [React Toolbox](https://github.com/react-toolbox/react-toolbox?tab=readme-ov-file#customizing-components), an early CSS Modules based toolkit. 

```tsx
import React from 'react';

function Component(props) {
  { theme } = props.theme;
  return (
    <div className={theme.component}>
      <h1 className={theme.title}>Hello, world!</h1>
    </div>
  );
}
```

It doesn't matter whether the app directly manages it's own stylesheet using a CSS convention, relies on Atomic CSS, CSS Modules or CSS in JS. They all depend on the app being able to control the class names used by components. 

```tsx
// App uses BEM convention
import Component from 'component';

const theme={
  component: "component",
  title: "component__title"
}

function App() {
  return (
    <Component theme={theme}></Component>
  )
}
```

```tsx
// App uses Atomic CSS
import Component from 'component';

const theme={
  component: "p-6 max-w-sm mx-auto bg-white rounded-xl flex items-center space-x-4",
  title: "text-xl font-medium text-black"
}

function App() {
  return (
    <Component theme={theme}></Component>
  )
}
```

```tsx
// App uses CSS Modules
import Component from 'component';
import theme from './Component.module.css';

function App() {
  return (
    <Component theme={theme}></Component>
  )
}
```

```tsx
// App uses CSS in JS
import Component from 'component';
import { css } from '@emotion/css'

const theme={
  component: css`
    padding: 4em;
  `,
  title: css`
    font-size: 1.5em;
    text-align: center;
  `
}

function App() {
  return (
    <Component theme={theme}></Component>
  )
}
```

My components will also support a `className` prop for simple use cases where the app only needs to apply to a style to the root element of the component. This also makes them compatible with the CSS in JS `styled` API. 

If you provide both `className` and `theme` the class names for the root element will be concatenated. This makes it easy to implement [BEM style mixes](https://en.bem.info/methodology/block-modification/#placing-a-block-inside-another-block) where you want to override component styles depending on the context where the component is used. 

Each component will have a default theme and a matching CSS style sheet using the [BEM](https://getbem.com/) convention. BEM uses a component specific prefix for each class name which reduces the chance of collisions. It's up to the app to decide whether they want to use the default as is, use it and override parts of it or replace it completely. I'm also going to experiment with supplying the default in the form of a `module.css` file. Again, it's entirely up to the app to decide which, if any, of the supplied CSS files it uses. 

# Next Time

Next time, I'll let you know how the grand plan worked out when I try to implement it for `react-spreadsheet`. 
