---
title: >
    Modern React Virtual Scroll Grid 7 : Grid
tags: frontend
---

So far I've written six articles in this "Modern React Virtual Scroll Grid" [series]({% link _posts/2024-01-29-modern-react-virtual-scroll-grid.md %}), with a four article detour into [unit testing]({% link _posts/2024-03-11-bootstrapping-vitest.md %}) my work, all without attempting to make a grid. That changes today.

I have the main structure in place for my `VirtualList` control. All the structurally significant features are [done]({% link _posts/2024-04-08-modern-react-virtual-scroll-grid-6.md %}). There's lots of functionality to fill out to get feature parity with [react-window](https://github.com/bvaughn/react-window), but it's all stuff that should work within the existing structure.

The structure was chosen to enable reuse of significant amounts of functionality between List and Grid controls. All the scrolling logic has been factored into utility functions and custom hooks that handle scrolling in one dimension. To build a grid, all I need to do is reuse what I've already implemented by using separate hook instances for vertical and horizontal scrolling. 

That's the theory at least. Now let's see if it holds up in practice. Maybe there's a reason why react-window needed to copy-and-paste so much of it's implementation. However, before I dive in, it makes sense to clean up what I've built so far. 

# TypeScript Interface vs Type

I've been learning TypeScript as I go. Mostly by cribbing examples from other people's code and using what works. I haven't been consistent in my use of TypeScript features. In particular I've used interfaces and types pretty much at random. I want to be more intentional.

There's lots of advice out there which has [changed over the years](https://stackoverflow.com/questions/37233735/interfaces-vs-types-in-typescript) as TypeScript has evolved. Types started out as a way of defining an alias for a more complex type declaration. Like a `#define` in C style languages. Interfaces started out as a way of defining an interface that would be implemented by a class in the normal object oriented way.

[Currently](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces) there are only three significant differences between them:
* Interfaces can only be used to declare the shapes of objects. Types can be used to name any type that TypeScript can define.
* Interface names always appear in error messages when a named interface is used. Type names may appear or you may see the anonymous type that the name is an alias for.
* Interfaces support [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html), types don't. Declaration merging can be useful when working with third party modules where you patch or extend objects defined in the module. You can use declaration merging to update the type signature to match. 

I'm going to follow the heuristic in the TypeScript handbook to use interfaces where possible.

# Common Code

Before copying `VirtualList.tsx` as my starting point for `VirtualGrid.tsx`, I need to take one final pass through. Any code that can be shared with `VirtualGrid.tsx` will be moved into a common `VirtualBase.ts` source file. Currently `VirtualList.tsx` contains three kinds of content:
  * A bunch of TypeScript declarations that define the interface to `VirtualList`
  * Utility functions
  * The VirtualList function component itself which in turn consists of
    * Access to props
    * Hook declarations
    * Calls to utility functions
    * The JSX rendering loop

Single dimension utility functions are obvious candidates for common code, as are single dimension interfaces like `ItemOffsetMapping`. The remaining interfaces, like `VirtualListProps`, contain a variety of properties. Some are component level properties that would be common to both `VirtualList` and `VirtualGrid`. Some are component level properties unique to each component. The remainder are dimensional properties. 

I can break out the common properties as `VirtualBaseProps`, which `VirtualListProps` can extend from. I could use a sub-object for the dimensional properties and include one instance in `VirtualListProps` and two instances in `VirtualGridProps`. However, it would make the interface unwieldy to use for the client. They don't care whether I'm sharing implementation internally. React props are usually flat.

I decided to move just the common component properties to `VirtualBaseProps` and otherwise have separate, flat `VirtualListProps` and `VirtualGridProps`.

# Declarations

Here's the declarations from `VirtualList.tsx` after the refactoring.

```
export interface VirtualListItemProps extends VirtualBaseItemProps {
  index: number,
};

type VirtualListItem = React.ComponentType<VirtualListItemProps>;

export interface VirtualListProps extends VirtualBaseProps {
  children: VirtualListItem,
  itemCount: number,
  itemOffsetMapping: ItemOffsetMapping,
  itemKey?: (index: number, data: any) => any,
};

export interface VirtualListProxy {
  scrollTo(offset: number): void;
  scrollToItem(index: number): void;
};

const defaultItemKey = (index: number, _data: any) => index;
```

There's not much left. I created `VirtualGrid.tsx`, copied in the content of `VirtualList.tsx`, and replaced all instances of `List` with `Grid`. Then I worked through replacing each item specific property and argument with row and column specific ones. I ended up with this.

```
export interface VirtualGridItemProps extends VirtualBaseItemProps {
  rowIndex: number,
  columnIndex: number,
};

type VirtualGridItem = React.ComponentType<VirtualGridItemProps>;

export interface VirtualGridProps extends VirtualBaseProps {
  children: VirtualGridItem,
  rowCount: number,
  rowOffsetMapping: ItemOffsetMapping,
  columnCount: number,
  columnOffsetMapping: ItemOffsetMapping,
  itemKey?: (rowIndex: number, columnIndex: number, data: any) => any,
};

export interface VirtualGridProxy {
  scrollTo(rowOffset: number, columnOffset: number): void;
  scrollToItem(rowIndex: number, columnIndex: number): void;
};

const defaultItemKey = (rowIndex: number, columnIndex: number, _data: any) 
  => `${rowIndex}:${columnIndex}`;
```

Painless so far. 

# Function Component Setup

On to the body of the function component. It's the same basic process but now I also need to replace item specific custom hooks and calls to utility functions with row and column specific ones. Here's the hook declarations and setup from `VirtualList`, before we get to the JSX.

```
  const outerRef = React.useRef<HTMLDivElement>(null);
  const [{ scrollOffset }, onScrollExtent] = useVirtualScroll();
  const isScrolling = useIsScrollingHook(outerRef); 

  React.useImperativeHandle(ref, () => {
    return {
      scrollTo(offset: number): void {
        outerRef.current?.scrollTo(0, offset);
      },

      scrollToItem(index: number): void {
        this.scrollTo(itemOffsetMapping.itemOffset(index));
      }
    }
  }, [ itemOffsetMapping ]);

  const totalSize = itemOffsetMapping.itemOffset(itemCount);

  function onScroll(event: ScrollEvent) {
    const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
    onScrollExtent(clientHeight, scrollHeight, scrollTop);
  }

  const [startIndex, startOffset, sizes] = getRangeToRender(itemCount, itemOffsetMapping, height, scrollOffset);
```

Here's the equivalent for `VirtualGrid.tsx`.

```
  const outerRef = React.useRef<HTMLDivElement>(null);
  const [{ scrollOffset: scrollRowOffset }, onScrollRow] = useVirtualScroll();
  const [{ scrollOffset: scrollColumnOffset }, onScrollColumn] = useVirtualScroll();
  const isScrolling = useIsScrollingHook(outerRef); 

  React.useImperativeHandle(ref, () => {
    return {
      scrollTo(rowOffset: number, columnOffset: number): void {
        outerRef.current?.scrollTo(columnOffset, rowOffset);
      },

      scrollToItem(rowIndex: number, columnIndex: number): void {
        this.scrollTo(rowOffsetMapping.itemOffset(rowIndex), columnOffsetMapping.itemOffset(columnIndex));
      }
    }
  }, [ rowOffsetMapping, columnOffsetMapping ]);

  const totalRowSize = rowOffsetMapping.itemOffset(rowCount);
  const totalColumnSize = columnOffsetMapping.itemOffset(columnCount);

  function onScroll(event: ScrollEvent) {
    const { clientWidth, clientHeight, scrollWidth, scrollHeight, scrollLeft, scrollTop } = event.currentTarget;
    onScrollRow(clientHeight, scrollHeight, scrollTop);
    onScrollColumn(clientWidth, scrollWidth, scrollLeft);
  }

  const [startRowIndex, startRowOffset, rowSizes] = getRangeToRender(rowCount, rowOffsetMapping, height, scrollRowOffset);
  const [startColumnIndex, startColumnOffset, columnSizes] = getRangeToRender(columnCount, columnOffsetMapping, width, scrollColumnOffset);
```

It was a little more fiddly but still a pretty mechanical process. 

# Function Component JSX

That leaves the meat of the function component - the JSX rendering. For `VirtualList` I wrote some [far too clever code]({% link _posts/2024-02-19-modern-react-virtual-scroll-grid-4.md %}) that involved an iteration over the item sizes array.

{% raw %}

```
    <div onScroll={onScroll} ref={outerRef} style={{ position: "relative", height, width, overflow: "auto", willChange: "transform" }}>
      <div style={{ height: totalSize, width: "100%" }}>
        {sizes.map((size, arrayIndex) => (
          offset = nextOffset,
          nextOffset += size,
          index = startIndex + arrayIndex,
          <ChildVar data={itemData} key={itemKey(index, itemData)} index={index}
                    isScrolling={useIsScrolling ? isScrolling : undefined}
                    style={{ position: "absolute", top: offset, height: size, width: "100%" }}/>
        ))}
      </div>
    </div>
```

{% endraw %}

For `VirtualGrid` I'm going to need nested loops over the rows and then over the columns within each row. Wish me luck. 

I used the same mechanical process to add the nested iteration and replace item references with row and column references. Unfortunately, I was soon staring at row after row of red squiggles in Visual Studio Code, trying to make sense of incomprehensible error messages.

{% include candid-image.html src="/assets/images/frontend/jsx-nested-map-errors.png" alt="JSX nested array map errors" %}

I thought maybe I'd pushed JSX too far. Once again, the internet [came to my rescue](https://stackoverflow.com/questions/47402365/how-to-have-nested-loops-with-map-in-jsx). 

You can't directly nest calls to map. The JSX compiler is expecting the result of the outer map to be a JSX element. However, that result can be a JSX element that has the inner map as a child. At first I thought I would have to render a container div per row to make it work. Then I remembered the [`<Fragment>` element](https://react.dev/reference/react/Fragment). Syntactically, it behaves like a container element but is not present in the resulting DOM. Instead, only its children are output. 

{% raw %}

```
    <div onScroll={onScroll} ref={outerRef} style={{ position: "relative", height, width, overflow: "auto", willChange: "transform" }}>
      <div style={{ height: totalRowSize, width: totalColumnSize }}>
        {rowSizes.map((rowSize, rowArrayIndex) => (
          rowOffset = nextRowOffset,
          nextRowOffset += rowSize,
          rowIndex = startRowIndex + rowArrayIndex,
          nextColumnOffset = startColumnOffset,
          <Fragment>
          {columnSizes.map((columnSize, columnArrayIndex) => (
            columnOffset = nextColumnOffset,
            nextColumnOffset += columnSize,
            columnIndex = startColumnIndex + columnArrayIndex,
            <ChildVar data={itemData} key={itemKey(rowIndex, columnIndex, itemData)}
                      rowIndex={rowIndex} columnIndex={columnIndex}
                      isScrolling={useIsScrolling ? isScrolling : undefined}
                      style={{ position: "absolute", top: rowOffset, height: rowSize, left: columnOffset, width: columnSize }}/>
          ))}
          </Fragment>
        ))}
      </div>
    </div>
```

{% endraw %}

The critical extra ingredient is the `<Fragment>` and `</Fragment>` tags around the inner map. As if by magic, all the red squiggles and mad error messages disappeared. 

# Testing

I should have followed the same process to create unit tests for `VirtualGrid`. However, I couldn't resist hacking together a sample app and taking it for a spin.

```
const Cell = ({ rowIndex, columnIndex, style }) => (
  <div className={ rowIndex == 0 ? "header" : "cell" } style={style}>
    { (rowIndex == 0) ? `${columnIndex}` : `${rowIndex}:${columnIndex}` }
  </div>
);

function App() {
  var rowMapping = useVariableSizeItemOffsetMapping(30, [50]);
  var columnMapping = useFixedSizeItemOffsetMapping(100);

  return (
    <div className="app-container">
      <VirtualGrid
        height={240}
        rowCount={100}
        rowOffsetMapping={rowMapping}
        columnCount={100}
        columnOffsetMapping={columnMapping}
        width={600}>
        {Cell}
      </VirtualGrid>
    </div>
  )
}
```

I fully expected the app to collapse into a horrible mess at runtime, kicking off a lengthy debugging process as I dived through the DOM elements in the browser's debugging tools. To my amazement it worked first time. 

I love it when a plan comes together. 

# Try it!

If you don't believe me, [try it](/assets/dist/modern-react-scroll-grid-7/index.html) for yourself. 

{% include candid-iframe.html src="/assets/dist/modern-react-scroll-grid-7/index.html" width="100%" height="fit-content" %}

# Unique key warning

After my euphoria calmed down, I noticed a React warning in the browser console.

```
Warning: Each child in a list should have a unique "key" prop.

Check the render method of `ForwardRef`. See https://reactjs.org/link/warning-keys for more information.
    at http://localhost:5173/src/VirtualGrid.tsx:19:13
    at div
    at App
printWarning	@	react-jsx-dev-runtime.development.js:87
error	@	react-jsx-dev-runtime.development.js:61
validateExplicitKey	@	react-jsx-dev-runtim…development.js:1078
validateChildKeys	@	react-jsx-dev-runtim…development.js:1105
jsxWithValidation	@	react-jsx-dev-runtim…development.js:1276
(anonymous)	@	VirtualGrid.tsx:77
```

The [warning-keys url](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key) explains that each element generated by an array map needs to have a key so that React can correctly update the DOM. 

That's weird, I thought. Each cell in the grid *does* have a unique key. The `Fragment` element isn't included in the DOM output, so as far as the reconciler is concerned it looks like one big flat array. I used the browser's debug tools to confirm that the DOM did indeed have all the cells as direct children of the inner div. The React developer tools confirmed that the React component structure is also flat. 

On a whim, I tried adding a key to the fragment element. The warning went away. The DOM structure was the same as before. However, the React component structure (represented by React's fiber tree) had changed. It now has a two level structure with a `Fragment` for each row. 

{% include candid-image.html src="/assets/images/frontend/fragment-cell-component-structure.png" alt="Two level component structure after defining keys for fragments" %}

I decided to leave the key in place for now. I don't like leaving unresolved warnings and, who knows, the more structured fiber tree might make reconciliation faster. I don't want to expose these internal details to my clients, so I reused the per cell key function for the rows. 

```
          <Fragment key={itemKey(rowIndex, 0, itemData)}>
```

# Tidying Up

Yes, I did go back and add unit tests for `VirtualGrid`. I started with a copy-paste-rename of the `VirtualList` unit tests. I had to add additional lines to each test case to check the additional columns. However, I could remove test cases that only checked functionality in common components, as they were already covered by `VirtualList`. Overall, I needed fewer lines than the original to get back to 100% coverage.

{% include candid-image.html src="/assets/images/coverage/virtual-grid.png" alt="Back to 100% coverage after adding VirtualGrid unit tests" %}