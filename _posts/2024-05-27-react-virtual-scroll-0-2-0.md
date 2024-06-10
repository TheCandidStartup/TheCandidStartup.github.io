---
title: >
  React Virtual Scroll 0.2.0 : Horizontal List
tags: react-virtual-scroll blog
---

{% capture mrvs2_url %}{% link _posts/2024-02-05-modern-react-virtual-scroll-grid-2.md %}{% endcapture %}
Exciting news! React-Virtual-Scroll 0.2.0 is [out](https://www.npmjs.com/package/@candidstartup/react-virtual-scroll/v/0.2.0), including the [long anticipated]({{ mrvs2_url | append: "#coming-up" }}) `VirtualList` horizontal layout feature. 

{% include candid-image.html src="/assets/images/react-virtual-scroll/horizontal-list.png" alt="VirtualList with horizontal layout" %}

I'm sure releasing new versions of packages will soon become a chore. However, right now, it still feels fresh and exciting.

[Last time]({% link _posts/2024-05-21-bootstrapping-npm-publish.md %}), I'd finally got all the tooling and processes in place and had published an initial release of `react-virtual-scroll`. How did my first routine development cycle go?

# Tidying Up

I did say that I would stop messing around with my development environment but I couldn't resist a bit of tidying up. I finally added a top level [README](https://github.com/TheCandidStartup/infinisheet/blob/main/README.md) for the infinisheet repo. After discovering [shields.io](https://shields.io/), I couldn't resist plastering both READMEs with badges.

{% include candid-image.html src="/assets/images/react-virtual-scroll/tool-badges.png" alt="Tooling Badges from infinisheet README" %}

The [examples](https://github.com/TheCandidStartup/infinisheet/tree/main/packages/react-virtual-scroll#virtuallist-example) in the `react-virtual-scroll` README are now teaser excerpts with links to the full sandbox source code and the running example on CodeSandbox.

It's interesting what you see when you come to something with fresh eyes, looking at it as other people would. Until now I hadn't noticed that the copyright date in my [LICENSE](https://github.com/TheCandidStartup/infinisheet/blob/main/LICENSE) was two years out of date.

# Splitting "Front End"

With my focus on front-end development over the last few months, the [Front End]({% link _topics/frontend.md %}) blog topic has become dominant with 25 posts and counting. I split the topic into two as the number of [React Virtual Scroll]({% link _topics/react-virtual-scroll.md %}) posts was starting to overwhelm the more general content.

This also means that I can now [link](https://github.com/TheCandidStartup/infinisheet/blob/main/packages/react-virtual-scroll/README.md#more) the `react-virtual-scroll` README direct to all the React Virtual Scroll posts on the blog.

# Multi-Page Sample App

After [creating the infinisheet monorepo]({% link _posts/2024-05-06-bootstrapping-lerna-monorepo.md %}), all my ad hoc sample code for manual testing ended up in `app/virtual-scroll-samples`. Previously, I would edit the sample to match whatever I wanted to test, then throw it away. I want to keep track of all the different samples so I can easily run through them rather than having to recreate them when needed.

I saw a discussion in the Vite documentation on building a [Multi Page App](https://vitejs.dev/guide/build.html#multi-page-app). For development, it just works. Have a subdirectory for each sample with its own `index.html` and navigate to it in the browser. For production, it's a little more complex as you have to tell the bundler about each entry point.

I wanted to include the Sandbox samples so that I didn't have to test them separately. I ended up going down a rathole by trying to reuse the source code as is. 

Last time, I worked out how to use the Vite development server with the standalone Sandbox samples. I used a `vite.config` file that forced Vite to load `.js` files as if they were JSX. All I had to do was move the Sandbox samples into `app/virtual-scroll-samples` and merge the `vite.config` magic with the existing app config. 

```
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths()
  ],
  build: {
    sourcemap: true,
    rollupOptions:  {
      plugins: [sourcemaps()],
    }
  }
  esbuild: {
  include: /\.[jt]sx?$/,
  exclude: [],
  loader: 'jsx',
},
})
```

It simply wouldn't work. Whenever I ran the app server it would complain about finding JSX in `index.js`.

Finally, I resorted to binary chop debugging, and systematically commented out bits of the merged config to see if one of the other options was interfering. This resulted in another facepalm moment. That `react()` plugin actually enables use of the SWC transpiler during development. Esbuild isn't used. 

I found the equivalent [SWC options](https://github.com/vitejs/vite-plugin-react-swc?tab=readme-ov-file#parserconfig). Including a very stern warning not to abuse this power to load JSX from `.js` files. I did it anyway. The syntax is wordier than esbuild but more understandable.

```
react({
  parserConfig(id) {
    if (id.endsWith(".js")) return { syntax: "ecmascript", jsx: true };
    if (id.endsWith(".jsx")) return { syntax: "typescript", tsx: false };
    if (id.endsWith(".ts")) return { syntax: "typescript", tsx: false };
    if (id.endsWith(".tsx")) return { syntax: "typescript", tsx: true };
  },
});
```

This time it worked, at least during development. However, unlike the Sandbox samples, I also need production builds of the sample app. Of course it failed when I tried it because Vite uses Rollup for production builds. There weren't any obvious workarounds in the Rollup documentation and I was getting fed up with trying to abuse the system. 

I had one last throw of the dice. Instead of moving the Sandbox samples, I could leave the source code where it was and create symbolic links to the files. In particular I could link `index.jsx` in the sample app to `index.js` in the Sandbox sample. Git [handles symbolic links correctly](https://mokacoding.com/blog/symliks-in-git/), as long as they're relative links to other files in the same repo. 

Another failure. The transpilers resolve the symbolic link, but then use the extension of the target file rather than that of the symbolic link. Back to errors about JSX in `index.js`. 

I told you it was a rathole. In the end I gave up and just copied the files, renaming .js to .jsx. For now, I'll take the maintainability hit. If I change the Sandbox samples in future, I'll need to remember to update the equivalent sample here. If that's too painful, I can come up with a script to sync any changes over. 

There is an upside. Copying the source code over means that I can rationalize the samples. Instead of having a CSS file in each sample, I can use common CSS across all of them. Creating a new sample is super simple. There's only two files - `index.html` and `index.tsx`. The `index.html` file is a minimal stub that I shouldn't need to change. It's identical across all the samples but has to exist in each sample directory to act as Vite's entry point. 

The one bit of redundant effort is updating the list of bundler entry points in `vite.config`.

```
  build: {
    sourcemap: true,
    rollupOptions:  {
      plugins: [sourcemaps()],
      input: {
        main: resolve(__dirname, 'index.html'),
        "list-and-grid": resolve(__dirname, 'samples/list-and-grid/index.html'),
        "trillion-row-list": resolve(__dirname, 'samples/trillion-row-list/index.html'),
        "trillion-square-grid": resolve(__dirname, 'samples/trillion-square-grid/index.html'),
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
```

The first time I did a production build I was disappointed that each sample was built as a standalone bundle with it's own embedded copy of React. Fortunately, it was easy to find how to share common code in the [Rollup documentation](https://rollupjs.org/configuration-options/#output-manualchunks). I copied their example which puts all dependencies from `node_modules` into a shared "vendor" chunk. Each sample ends up being a few KB in size plus an import of the common 142KB vendor chunk. 


# Horizontal Layout List

The new feature for this release is support for horizontal layout in `VirtualList`. This is exposed via a new `layout` prop with a choice of `vertical` (the default) or `horizontal` layout. Do you want virtual scrolling down your very long list, or do you want virtual scrolling across your very wide list?

## Implementation

All the logic for virtual scrolling in a single dimension is in the `useVirtualScroll` custom hook. All that `VirtualList` has to do is connect the hook to either the horizontal or vertical scrolling properties. Oh, and decide whether to render the list down or across. The changes I made turned out to be more verbose than I hoped.

It started well enough. I needed to change a one-liner in the `scrollTo` proxy method to work with either layout. The simplest approach was to choose between two different versions based on the layout direction.

```
scrollTo(offset: number): void {
  const outer = outerRef.current;
  if (outer) {
    if (isVertical)
      outer.scrollTo(0, doScrollTo(offset, outer.clientHeight));
    else
      outer.scrollTo(doScrollTo(offset, outer.clientWidth), 0);
  }
}
```

The `OnScroll` event handler is four lines of layout dependent code. I tried to come up with ways of making the core logic layout independent but each approach resulted in more lines of code and more complexity than just having two separate versions again.

```
function onScroll(event: ScrollEvent) {
  if (isVertical) {
    const { clientHeight, scrollHeight, scrollTop, scrollLeft } = event.currentTarget;
    const newScrollTop = onScrollExtent(clientHeight, scrollHeight, scrollTop);
    if (newScrollTop != scrollTop && outerRef.current)
      outerRef.current.scrollTo(scrollLeft, newScrollTop);
  } else {
    const { clientWidth, scrollWidth, scrollTop, scrollLeft } = event.currentTarget;
    const newScrollLeft = onScrollExtent(clientWidth, scrollWidth, scrollLeft);
    if (newScrollLeft != scrollLeft && outerRef.current)
      outerRef.current.scrollTo(newScrollLeft, scrollTop);
  }
}
```

The rendering code is too long to maintain two separate versions. I ended up making heavy use of conditionals. 

{% raw %}


```
<div onScroll={onScroll} ref={outerRef} style={{ position: "relative", height, width, overflow: "auto", willChange: "transform" }}>
  <div style={{ height: isVertical ? renderSize : "100%", width: isVertical ? "100%" : renderSize }}>
    {sizes.map((size, arrayIndex) => (
      offset = nextOffset,
      nextOffset += size,
      index = startIndex + arrayIndex,
      <ChildVar data={itemData} key={itemKey(index, itemData)} index={index}
        isScrolling={useIsScrolling ? isScrolling : undefined}
        style={{ 
          position: "absolute", 
          top: isVertical ? offset : undefined, 
          left: isVertical ? undefined : offset,
          height: isVertical ? size : "100%", 
          width: isVertical ? "100%" : size, 
        }}/>
    ))}
  </div>
</div>
```

{% endraw %}

I don't like either of the approaches I used. I keep thinking there must be a better way but I can't see it. Oh well, let's see if it works. 

## Testing

I was able to put a [sample](https://github.com/TheCandidStartup/infinisheet/blob/d0f2ac167752dbd781d79525897e13c66626db4a/apps/virtual-scroll-samples/samples/horizontal-list/index.tsx) together very quickly.

```
<VirtualList
  ref={ref}
  height={50}
  itemCount={100}
  itemOffsetMapping={mapping}
  layout={'horizontal'}
  width={600}>
  {Row}
</VirtualList>
```

[Unit](https://github.com/TheCandidStartup/infinisheet/blob/d0f2ac167752dbd781d79525897e13c66626db4a/packages/react-virtual-scroll/src/VirtualList.test.tsx#L134) [tests](https://github.com/TheCandidStartup/infinisheet/blob/d0f2ac167752dbd781d79525897e13c66626db4a/packages/react-virtual-scroll/src/VirtualList.test.tsx#L454) took longer to update. Unfortunately, there was lots of copy-and-paste involved. I did get back to 100% coverage though.

## Try It!

The horizontal list sample is embedded below or you can [explore the full set of samples](/assets/dist/react-virtual-scroll-0-2-0/index.html).

{% include candid-iframe.html src="/assets/dist/react-virtual-scroll-0-2-0/samples/horizontal-list/index.html" width="100%" height="fit-content" %}

# Publishing

Final build, version and publish went really smoothly. It took at most five minutes before I was admiring the latest release (together with its enticing new README) on [NPM](https://www.npmjs.com/package/@candidstartup/react-virtual-scroll/v/0.2.0). 


# Next Time

Let's see if I can be even more productive and get two features into the [next release]({% link _posts/2024-06-10-react-virtual-scroll-0-3-0.md %}).
