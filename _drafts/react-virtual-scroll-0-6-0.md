---
title: >
  React Virtual Scroll 0.6.0 : Scroll To Item Options
tags: react-virtual-scroll
---

* Requirement from `react-spreadsheet`
* Want grid to scroll whenever you change focus cell to ensure it's visible
* Should apply the minimal scroll needed to bring cell entirely into view
* If you're using arrow keys to move focus cell to right, should scroll only when you move it out of the viewport and then only to scroll by the single column needed to bring back into view.
