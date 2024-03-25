---
title: >
    Modern React Virtual Scroll Grid 6 : Scroll To
tags: frontend
---

* Refer back to [plan]({% link _posts/2024-01-29-modern-react-virtual-scroll-grid.md %}) with direct link to ScrollTo section
* Last significant piece of functionality to validate with modern React
* Using an imperative handle lets us expose our own methods as well as forwarding standard DOM methods
* Acts as an abstraction layer which means we aren't directly exposing internals
* Equivalent class based react-window control allows you to pass both innerRef and outerRef which bind to the inner and outer divs of the implementation
* With function component and forwardRef you are only allowed a single ref
* Only need a single ref with imperative handle as we can expose methods which apply to either inner or outer div as appropriate
* Was going to try and do proper TDD: write the test, write interface/stub needed to make it "compile", write implementation that will pass test
* Can't get my head round using intellisense backwards. Instead going to write interface/stub, then write test case using intellisense, then implementation.
* 