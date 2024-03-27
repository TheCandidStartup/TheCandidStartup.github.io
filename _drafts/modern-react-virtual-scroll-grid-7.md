---
title: >
    Modern React Virtual Scroll Grid 7 : Grid
tags: frontend
---

* Got structure in place for `VirtualList` control.  all structurally significant features done. 
* Lots of functionality to fill out to get feature parity with react-window but all stuff that should work within existing structure
* Structure was chosen to enable reuse of significant amounts of functionality between List and Grid controls. Contrast with react-window where there's lots of copy and paste.
* Now time to see if the theory holds up in practice.

# Preparation

* Makes sense to clean house before going further
* Be more intentional about using Typescript interface vs type
* Follow guidance to prefer interface for objects, use type as aliases for more primitive type declarations like unions
* Identify code in `VirtualList.tsx` that can be shared with `VirtualGrid.tsx` and move it into a common `VirtualBase.ts` source file

