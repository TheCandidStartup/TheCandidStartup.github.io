---
title: >
  React Virtual Scroll 0.4.0 : Customization
tags: react-virtual-scroll
---

wise  words

# Component Structure

* Outer div -> inner div -> virtualized children
* Only customization is via component you pass in as template for each child

# Outer Div Class Name

# Outer Component

* Examples of use
* Implementation
* Typing frustration
  * Can't specify type that must accept a ref due to JSX/support for legacy types
  * Do get runtime error if you pass simple function component and VirtualList tries to pass a ref to it
  * Also seems to lose type of ref - can specify `forwardRef` to wrong HTML type and it passes type and runtime checks
  * Only solution seems to be to use a rewritten implementation of `forwardRef` that drops legacy component support. Can make that choice at app level, not in a library.

# Inner Component

* Examples of use
