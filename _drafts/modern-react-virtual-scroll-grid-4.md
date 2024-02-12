---
title: >
    Modern React Virtual Scroll Grid 4 : JSX
tags: frontend
---

Last time I implemented a scalable binding interface and demonstrated an implementation for variable sized items. I was seemingly poised to complete the basic functionality for my list control and move onto grids. Then I got distracted. 

I was still bothered by the way I'd opted out of using JSX to render the items in my list control. My `renderItems` function was now rendering the items by iterating over an array. Iterating over an array using `map` is the standard way of [rendering a list](https://react.dev/learn/rendering-lists) of items using JSX.

It should only take me a few minutes to clean this up, right?

# Starting Point

Here's the core of the code. We iterate over the array of item sizes, calling `React.createElement` for each item, building up an array of JSX elements that eventually get inserted into the JSX in the main component function.

```
  const items: JSX.Element[] = [];
  var offset = startOffset;
  sizes.forEach((size, arrayIndex) => {
    const index = startIndex + arrayIndex;
    items.push(
      React.createElement(children, {
        data: itemData,
        key: itemKey(index, itemData),
        index: index,
        style: { position: "absolute", top: offset, height: size, width: "100%" }
      })
    );
    offset += size;
  });
  return items;
```

# Choosing the JSX Type at Runtime

The first step is to replace the direct call to `React.createElement` with the equivalent JSX. Which immediately throws up a problem. What type do we put in the JSX angle brackets? The type is represented by an instance of `React.ComponentType` in the children variable. 

My first thought was that I somehow needed to extract a string literal containing the type name. The answer is actually much simpler. The React transpiler converts JSX with HTML element names, like `<div ...>`, into `React.createElement("div", ...)`. It converts JSX with React component names, like `<Cell ...>` into `React.createElement(Cell, ...)`. You directly pass in the corresponding component class or function. No strings involved. 

How does the React transpiler know whether your JSX refers to an html element or a React component? It doesn't. It relies on the developer following the convention that [component names are capitalized](https://legacy.reactjs.org/docs/jsx-in-depth.html#user-defined-components-must-be-capitalized) while html elements are all lowercase. 

How does that help us with our variable containing a `React.ComponentType`? First, `React.ComponentType` is defined as `React.ComponentClass | React.FunctionClass` which the IDE helpfully tells me is what `React.createElement` expects. As long as the variable name is capitalized, we can use it [directly in JSX](https://legacy.reactjs.org/docs/jsx-in-depth.html#choosing-the-type-at-runtime). 

{% raw %}

```
  const items: JSX.Element[] = [];
  var offset = startOffset;
  const ChildVar = children;
  sizes.forEach((size, arrayIndex) => {
    const index = startIndex + arrayIndex;
    items.push(
      <ChildVar data={itemData} key={itemKey(index, itemData)} index={index}
                style={{ position: "absolute", top: offset, height: size, width: "100%" }}
      </ChildVar>
    );
    offset += size;
  });
  return items;
```

{% endraw %}

Converting the style definition to JSX took a little bit of figuring out. Curly braces insert the output of a JavaScript expression. So, to pass an object you need to use [double curlies](https://react.dev/learn/javascript-in-jsx-with-curly-braces#using-double-curlies-css-and-other-objects-in-jsx). I initially assumed this was some kind of escape sequence, so that I would still be in JSX land inside the curlies. It's actually much simpler. The first curly puts me in Javascript land and the second curly is just the start of a JavaScript object. 

# Incomprehensible TypeScript Error

I didn't realize it at the time but I'd just made a significant error. When I saved the changes in Visual Studio Code and Vite hot reloaded my test app, everything looked fine. However, when I later tried to do a full build using `npm run build`, I got an incomprehensible TypeScript error.

```
error TS2322: Type '{ children: never[]; data: any; key: any; index: number; style: { position: string; top: number; height: number; width: string; }; }' is not assignable to type 'IntrinsicAttributes & RenderComponentProps'.
  Property 'children' does not exist on type 'IntrinsicAttributes & RenderComponentProps'.

107           <ChildVar data={itemData} key={itemKey(index, itemData)} index={index}
               ~~~~~~~~

```

This is the first time TypeScript got in my way and slowed me down. My first thought was that there was a problem with the child variable trick. I went as far as copying in the `Cell` function component from the sample app and using it directly. Same problem. I fiddled around with the type declarations and got nowhere. 

Luckily the internet was there to help me out. A search for "react TS2322 children never" took me straight to the [answer](https://stackoverflow.com/questions/63252161/ts2322-property-children-does-not-exist-on-type-intrinsic-attributes-and-prop). JSX helpfully converts any text between a component's open and closing tag into a child html element. It may look like `<ChildVar>` has no children but it actually has a newline text element as a child. The answer is to make the JSX tag self-closing for any component that shouldn't have any children. 

{% raw %}

```
  const items: JSX.Element[] = [];
  var offset = startOffset;
  const ChildVar = children;
  sizes.forEach((size, arrayIndex) => {
    const index = startIndex + arrayIndex;
    items.push(
      <ChildVar data={itemData} key={itemKey(index, itemData)} index={index}
                style={{ position: "absolute", top: offset, height: size, width: "100%" }}/>
    );
    offset += size;
  });
  return items;
```

{% endraw %}

# Iterating over an array in JSX

There's no special support for iteration in JSX. You just need to find a JavaScript expression to insert that does the job for you. The [usual idiom](https://react.dev/learn/rendering-lists) is to use [`Array.map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) to insert a snippet of JSX for each element in the array. Something like

{% raw %}

```
  return sizes.map((size) => (
    <ChildVar data={itemData} key={itemKey(index, itemData)} index={index
              style={{ position: "absolute", top: offset, height: size, width: "100%" }}/>
  ));
```

{% endraw %}

Unfortunately, it's not that simple. My iteration is more complex. I need access to the array index and I need to update `offset` as I go. Accessing the array index is easy via the optional second argument to the map function. If I want to include multiple statements in the body of the iteration, I need to use a [block body](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions#function_body), which also means adding an explicit return.

{% raw %}

```
  var offset = startOffset;
  const ChildVar = children;
  return sizes.map((size, arrayIndex) => {
    const index = startIndex + arrayIndex;
    const item = <ChildVar data={itemData} key={itemKey(index, itemData)} index={index}
        style={{ position: "absolute", top: offset, height: size, width: "100%" }}/>
    offset += size;
    return item;
  });
```

{% endraw %}

I don't know about you, but I'm starting to find this code hard to read. I do a double take every time I see the combination of inner and outer return statements. 

# Being Far Too Clever

If we could write the iteration in the form of an expression, we could get rid of the inner return. The comma operator allows you to include multiple statements in an expression. It evaluates each statement and returns the value of the last one. We'll need to reorder the iteration so it finishes with the item definition. Expressions can't include variable declarations, so we'll have to hoist those out of the JSX too. 

{% raw %}

```
  let nextOffset = startOffset;
  let index, offset;
  const ChildVar = children;
  return sizes.map((size, arrayIndex) => (
    offset = nextOffset,
    nextOffset += size,
    index = startIndex + arrayIndex,
    <ChildVar data={itemData} key={itemKey(index, itemData)} index={index}
        style={{ position: "absolute", top: offset, height: size, width: "100%" }}/>
  ));
```

{% endraw %}

Now I'm even more unsure whether this is worth doing. What's the point of JSX anyway? 

# Composition

JSX is markup. It's declarative rather than imperative. It lets you see and easily understand the structure of the UI. To see whether it works in this case we need to get rid of the separate `renderItems` function and compose all the JSX together in the component function. 

{% raw %}

```
 <div onScroll={onScroll} style={{ position: "relative", height, width,
                                   overflow: "auto", willChange: "transform" }}>
  <div style={{ height: totalSize, width: "100%" }}>
    {sizes.map((size, arrayIndex) => (
      offset = nextOffset,
      nextOffset += size,
      index = startIndex + arrayIndex,
      <ChildVar data={itemData} key={itemKey(index, itemData)} index={index}
                style={{ position: "absolute", top: offset, height: size, width: "100%" }}/>
    ))}
  </div>
</div>
```

{% endraw %}

It is far [too clever](https://www.joshwcomeau.com/career/clever-code-considered-harmful/) but I kind of like it. For now, I'm keeping it.

# Next Time

Next time, I really will add more core functionality. Let's see how much the JSX will take before it becomes completely unintelligible. 


