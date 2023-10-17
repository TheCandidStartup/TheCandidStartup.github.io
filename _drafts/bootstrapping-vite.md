---
title: Bootstrapping Vite
tags: frontend
---

I'm ready to dive into [front-end development]({% link _posts/2023-10-09-paged-infinite-virtual-scrolling.md %}). First, I need to make some choices. What tooling and frameworks should I use? 

I've already decided to use [TypeScript with NodeJS]({% link _posts/2023-05-15-language-stack.md %}) on the back end. I want to share code between front end and back end, so will need a front-end development environment that will handle transpilation of TypeScript. I also need tooling that will build code into front-end packages that can be statically served by CloudFront/S3 and back-end packages that can be deployed to Lambda with the NodeJS runtime. 

Most teams I previously worked with used React as their front-end framework, so that's something I want to try. I've seen some bloated front ends built with React, so I want to experiment with alternatives too. One team I worked with had good experiences using [Preact](https://preactjs.com/) as a lighter weight alternative to React, so that's on the list. Diving down the internet rabbit hole also threw up [Vue.js](https://vuejs.org/) and [Svelte](https://svelte.dev/) as contenders. Finally, I like to understand how things work behind the scenes, so I may end up building something using a vanilla JavaScript environment. 

My first choice is to use [Vite](https://vitejs.dev/) for my front-end tooling. 

## Why Vite?

* [Vite](https://vitejs.dev/) - what and why

## Installing Dependencies

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

## Scaffolding my First Project

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

## Development Experience

Finally I added the generated project to git and then used GitHub desktop to publish it to [TheCandidStartup/react-virtual-scroll-grid](https://github.com/TheCandidStartup/react-virtual-scroll-grid).

```
git init
git add -all
git commit
```

Now time to make some changes and see how well the HMR works. As instructed, I made some simple changes to `src/App.tsx` using Visual Studio Code. The running web app updated *instantly*. I couldn't perceive any lag at all. Same experience when editing `src/App.css`. 

I'm using to the editing experience with my Jekyll blog where updates are sub-second but with a noticeable lag. Vite is impressively fast. Admittedly, for a trivial example. 

## Building for Production

```
% npm run build

> react-virtual-scroll-grid@0.0.0 build
> tsc && vite build

vite v4.4.11 building for production...
✓ 34 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/react-35ef61ed.svg    4.13 kB │ gzip:  2.14 kB
dist/assets/index-d526a0c5.css    1.42 kB │ gzip:  0.74 kB
dist/assets/index-dd535d49.js   143.44 kB │ gzip: 46.12 kB
✓ built in 409ms
```

* Built package is much smaller than all the dependencies
* Note hash of content included in package assets - cache busting
* `index.html` is fixed entry point, not cached

```
% npm run preview

> react-virtual-scroll-grid@0.0.0 preview
> vite preview

  ➜  Local:   http://localhost:4173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

## Deploying to the Blog

To include as a live example on the blog I need to tell Vite the non-default base path where the package will be deployed. All includes in the built package are absolute. Some head scratching before I figured out the magic runes to pass arguments from npm through to vite. 

```
% npm run build -- --base=/assets/dist/vite-bootstrap/

> react-virtual-scroll-grid@0.0.0 build
> tsc && vite build --base=/assets/dist/vite-bootstrap/

vite v4.4.11 building for production...
✓ 34 modules transformed.
dist/index.html                   0.54 kB │ gzip:  0.31 kB
dist/assets/react-35ef61ed.svg    4.13 kB │ gzip:  2.14 kB
dist/assets/index-d526a0c5.css    1.42 kB │ gzip:  0.74 kB
dist/assets/index-84538aac.js   143.49 kB │ gzip: 46.14 kB
✓ built in 407ms
```

And the same argument if I want to preview the build with it's custom based path

```
% npm run preview -- --base=/assets/dist/vite-bootstrap/

> react-virtual-scroll-grid@0.0.0 preview
> vite preview --base=/assets/dist/vite-bootstrap/

  ➜  Local:   http://localhost:4173/assets/dist/vite-bootstrap/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

{% include candid-iframe.html src="/assets/dist/vite-bootstrap/index.html" width="100%" height="fit-content" %}
