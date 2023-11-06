---
title: >
    React Virtual Scroll Grid 3 : Binary Chop
tags: frontend
---

* add react-window to package.json

```
% npm install

added 4 packages, and audited 158 packages in 2s

37 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

```
Could not find a declaration file for module 'react-window'. '/Users/tim/GitHub/react-virtual-scroll-grid/node_modules/react-window/dist/index.cjs.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/react-window` if it exists or add a new declaration (.d.ts) file containing `declare module 'react-window';`ts(7016)
```

* Trawled through release notes for React 18 to see if this is a known issue that has already been fixed. No joy.
* Started looking through the 1000 open issues in GitHub and to my surprise found my exact issue reported with the 20th issue I looked at.
* [Bug: performance deteriorates when using ReactDOM.createRoot instead of ReactDom.render for virtual-table](https://github.com/facebook/react/issues/27524)
* Surprisingly to me, despite React 18 being released over 18 months ago, this bug has only just been noticed.