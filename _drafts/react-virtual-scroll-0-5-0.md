---
title: >
  React Virtual Scroll 0.5.0 : Render Props
tags: react-virtual-scroll
---

The last [0.4.0 release]({% link _posts/2024-07-01-react-virtual-scroll-0-4-0.md %}) of `react-virtual-scroll` focused on customization. Since then, I've learnt a lot from using `VirtualGrid` and `VirtualList` as building blocks for my [`react-spreadsheet`]({% link _topics/react-spreadsheet.md %}) package. In particular, that the custom container components introduced in 0.4.0 weren't a good fit with modern React.

# Nested Components



# Render Props

* Only need to provide your own Outer/Inner component when customizing grid behavior
* There's a `VirtualGrid` specific contract for components to implement, which means you're only going to use it with components created purely for customization
* Anyone doing anything beyond the most trivial will run into the same problem - need to pass context from parent component. Likely to end up creating a stub component that uses a render prop to get actual work done. 
* Rather than adding a generic data prop, change the API so that you customize Outer/Inner by passing render props directly
* Less boilerplate code to write, simpler and more direct. Not really losing anything as you have to write custom render function anyway, just passing it as a regular function rather than a component. 
* Note that the cell component is different. Lot's of cases where you might want to pass off the shelf component or HTML. Makes sense to keep API where you pass in child component with separate `data` prop for context if needed.
* Released in [React Virtual Scroll 0.5.0](https://www.npmjs.com/package/@candidstartup/react-virtual-scroll/v/0.5.0)

# Breaking Change

# More flexible scrollTo and scrollToItem

# VirtualGridProxy clientWidth and clientHeight

# Links

* [Change Log](https://github.com/TheCandidStartup/infinisheet/blob/04aa6249f51b5da933813c7b17a652d4f4e2a646/packages/react-virtual-scroll/CHANGELOG.md)
* [NPM](https://www.npmjs.com/package/@candidstartup/react-virtual-scroll/v/0.5.0)
