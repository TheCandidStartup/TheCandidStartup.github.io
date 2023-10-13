---
title: Bootstrapping Vite
tags: frontend
---

* [Vite](https://vitejs.dev/) - what and why
* Understandably, NodeJS is a dependency so I need to get that setup first
* [Setting up my Mac]({% link _posts/2022-09-21-mac-local-blog-dev.md %})
* Used [asdf](https://asdf-vm.com/) install manager as supposedly can also handle NodeJS/npm
* asdf uses a plugin model for each tool that it supports
* Handily the asdf Getting Started guide has NodeJs as its example for [installing a plugin](https://asdf-vm.com/guide/getting-started.html#_4-install-a-plugin)

```
 % asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
```

* Now I can install the latest version of nodejs

```
asdf install nodejs latest

Installed node-v20.8.0-darwin-arm64 to /Users/tim/.asdf/installs/nodejs/20.8.0
```

* Is NodeJS at version 20 already?
* I wonder how close that is to the bleeding edge?
* The Github readme for [asdf-nodejs](https://github.com/asdf-vm/asdf-nodejs) has some more details about the plugin.
* There's a handy command that can query the most recent LTS (long-term support) version of NodeJS

```
% asdf nodejs resolve lts --latest-available

18.18.1
```

* That's OK, asdf is a tool version manager. I can install 18.18.1 as well and switch between them on a per project basis if needed.

```
% asdf install nodejs 18.18.1

Installed node-v18.18.1-darwin-arm64 to /Users/tim/.asdf/installs/nodejs/18.18.1
```

Now  I just need to tell asdf which version to default to

```
% asdf global nodejs 18.18.1
```

Next a quick check to see if npm is there

```
npm -v

9.8.1
```

* Back to the Vite getting started guide
* Vite will scaffold a project for me, using a standard template
* I'm going to start with React, and of course I'm [using Typescript]({% link _posts/2023-05-15-language-stack.md %}), so I'll need the react-ts template.

```
 % npm create vite@latest

Need to install the following packages:
create-vite@4.4.1
Ok to proceed? (y) y
✔ Project name: … react-virtual-scroll-grid
✔ Select a framework: › React
✔ Select a variant: › TypeScript + SWC

Scaffolding project in /Users/tim/GitHub/react-virtual-scroll-grid...

Done. Now run:

  cd react-virtual-scroll-grid
  npm install
  npm run dev
```

* What was that choice of Typescript vs  TypeScript + SWC about?
* Not mentioned in documentation, but SWC is a drop in replacement for the TypeScript transpiler which is "up to 20 times faster". Used during development rather than final build

```
% cd react-virtual-scroll-grid
% npm install

added 153 packages, and audited 154 packages in 32s

37 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

```
% npm run dev

  VITE v4.4.11  ready in 213 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

{% include candid-image.html src="/assets/images/frontend/vite-scaffold-react-ts.png" alt="Vite React+TypeScript Scaffolded Project" %}

Finally I added the generated project to git and then used GitHub desktop to publish it to [TheCandidStartup/react-virtual-scroll-grid](https://github.com/TheCandidStartup/react-virtual-scroll-grid).

```
git init
git add -all
git commit
```
