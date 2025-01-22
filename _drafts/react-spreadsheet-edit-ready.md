---
title: >
  React Spreadsheet: Edit Ready
tags: react-spreadsheet
thumbnail: /assets/images/boring-spreadsheet.png
---

It's been a couple of months since I last worked on features for my scalable React spreadsheet component. I got distracted by adding [Playwright]({% link _posts/2024-12-16-bootstrapping-playwright.md %}) and [Storybook]({% link _posts/2025-01-13-bootstrapping-storybook.md %}) to my arsenal of development tools. The next step is to add all my components to Storybook and publish it as part of my documentation set. 

Before I do that, I want to get my spreadsheet component into a good place. I want it to be *Edit Ready*. 

# Edit Ready

I'm building a scalable spreadsheet frontend component because ultimately I want to build a scalable spreadsheet backend. So far, I have a [data interface]({% link _posts/2024-09-30-react-spreadsheet-data-interface.md %}) and some [fake data]({% link _posts/2024-10-07-react-spreadsheet-data-model.md %}). I'll need a real implementation once I have a frontend that can edit data. 

I've been working towards this point for a while and I'm pretty close. Selection is supported with an input box positioned under the focus cell ready to receive changes. It's mostly a matter of tidying up at this point.

# Data Interface for Cell Size

* Currently cell width/height hardcoded in `VirtualSpreadsheet`
* Correct cell size depends on the data in that cell
* Cell size should eventually be editable
* Should be part of the data interface

```ts
export interface SpreadsheetData<Snapshot> {
  subscribe(onDataChange: () => void): () => void,
  getSnapshot(): Snapshot,

  getRowCount(snapshot: Snapshot): number,
  getRowItemOffsetMapping(snapshot: Snapshot): ItemOffsetMapping,
  getColumnCount(snapshot: Snapshot): number,
  getColumnItemOffsetMapping(snapshot: Snapshot): ItemOffsetMapping,
  getCellValue(snapshot: Snapshot, row: number, column: number): CellValue;
  getCellFormat(snapshot: Snapshot, row: number, column: number): string | undefined;
}
```

* Added two new methods that return an `ItemOffsetMapping` object that describes sizes and offsets in one dimension
* Replaced hardcoded mapping objects created in `VirtualSpreadsheet` with calls to new data interface methods
* Needed to update all implementations of SpreadsheetData to add the new methods
* I have an `EmptySpreadsheetData` implementation which has appropriate defaults for all methods
* I avoided pointless copying for my test implementations of the interface by starting from `TestData extends EmptySpreadsheetData` rather than `TestData implements SpreadsheetData<number>`
* The `ItemOffsetMapping` interface is defined in `react-virtual-scroll` so needed to be imported
* [API Extractor]({% link _posts/2024-07-19-bootstrapping-api-extractor.md %}) reminded me that I needed to re-export it from `react-spreadsheet` to have a complete public API.

```
Error: dist/index.d.ts:24:5 - (ae-forgotten-export)
  The symbol "ItemOffsetMapping" needs to be exported by the entry point index.d.ts
```

* Once I did that I got a load of new errors

```
Warning: react-virtual-scroll/src/VirtualBase.ts:109:1 - (ae-unresolved-link)
  The @link reference could not be resolved: 
  The package "@candidstartup/react-spreadsheet" does not have an export "VirtualList"
Warning: react-virtual-scroll/src/VirtualBase.ts:109:1 - (ae-unresolved-link)
  The @link reference could not be resolved: 
  The package "@candidstartup/react-spreadsheet" does not have an export "VirtualGrid"
Error: react-virtual-scroll/src/VirtualContainer.tsx:1:1 - (ae-wrong-input-file-type)
  Incorrect file type; API Extractor expects to analyze compiler outputs with .d.ts extension
  Troubleshooting tips: https://api-extractor.com/link/dts-error
```

* This took me a while to work out
* Importing and exporting `ItemOffsetMapping` resulted in `import { ItemOffsetMapping } from '@candidstartup/react-virtual-scroll'` being added to the `index.d.ts` file for `react-spreadsheet`. Makes sense.
* The import was being resolved by parsing the source code within `react-virtual-scroll` rather than using its `index.d.ts`.
* Turns out that this is the first time I've used a type defined in one package as part of the API of another. By default API Extractor uses the default `tsconfig.json` which does indeed [resolve inter-package references within the monorepo]({% link _posts/2024-05-13-bootstrapping-npm-package-build.md %}) by reading source code.
* I just needed to add the `tsconfigFilePath: "tsconfig.build.json"` option to `api-extractor.json`

# Data Interface for Cell Edit

* Set value and format
* When typing text into Excel, the input is parsed to try and determine the format. The end result is that both value and format are set for the cell.
* Naive error handling for now - return true/false. Existing implementations of interface return false.

```ts
export interface SpreadsheetData<Snapshot> {
  ...
  setCellValueAndFormat(row: number, column: number, value: CellValue, 
    format: string | undefined): boolean;
}
```

# Content Alignment

* Excel and Google Sheets align content in cell based on type
  * Numbers (including dates) align right in each cell
  * Text aligns left
  * Logicals and errors align in the center
* Seems like a minor feature but adds a lot of power
* Implement by adding modifier classnames to each cell based on type
* Now you can do all kinds of interesting presentational things based on type - alignment just tip of the iceberg

```ts
export interface VirtualSpreadsheetTheme {
  ...
  VirtualSpreadsheet_Cell__Type_string: string,
  VirtualSpreadsheet_Cell__Type_number: string,
  VirtualSpreadsheet_Cell__Type_boolean: string,
  VirtualSpreadsheet_Cell__Type_null: string,
  VirtualSpreadsheet_Cell__Type_undefined: string,
  VirtualSpreadsheet_Cell__Type_CellError: string,
}
```

* Added the new class names to the spreadsheet theme object and updated `VirtualSpreadsheet.css`

```css
.VirtualSpreadsheet_Cell__Type_string {
  text-align: left;
  padding-left: 2px;
}

.VirtualSpreadsheet_Cell__Type_number {
  text-align: right;
  padding-right: 2px;
}

.VirtualSpreadsheet_Cell__Type_boolean {
  text-align: center;
}

.VirtualSpreadsheet_Cell__Type_null {
  text-align: center;
}

.VirtualSpreadsheet_Cell__Type_undefined {
  text-align: center;
  background-color: whitesmoke;
}

.VirtualSpreadsheet_Cell__Type_CellError {
  text-align: center;
}
```

# Name and Formula Bar

* A proper spreadsheet has a formula input field at the top
* Laid out Name and Formula input fields as you'd expect to see them - as an input bar across the top of the spreadsheet
* Get rid of Scroll To prompt
* Name positioned to left of formula bar
* Formula displays same text as cell with focus

{% include candid-image.html src="/assets/images/react-spreadsheet/name-formula-layout.png" alt="Name Formula Bar Layout" %}

* Can edit the text
* Real implementation has all kinds of complex and subtle behavior where formatting in formula field may not be same as cell to ensure value can be reliably round tripped, existing format retained unless edited value no longer compatible.
* Not going to explore all of that now, just simplest thing to be edit ready
* Formula field shows value as formatted in cell, when you edit use `parseValue` to determine value and format from scratch

```ts
function CommitFormulaChange(rowIndex: number, colIndex: number) {
  let value: CellValue = undefined;
  let format: string | undefined = undefined;
  const parseData =  numfmt.parseValue(formula);
  if (parseData) {
    // number or boolean
    value = parseData.v;
    format = parseData.z;
  } else {
    // string
    value = formula;
  }

  data.setCellValueAndFormat(rowIndex, colIndex, value, format);
}
```

* Deal with error handling and round tripping another time

# Cell Edit Mode

* Once cell has focus, any text you type overwrites existing cell content, caret appears and cell gets additional outer outline in light blue (outside boundaries of cell)
* Text saved when you move to another cell
* Escape removes caret/light blue outline and goes back to basic selection
* Double click on cell -> edit mode
  * Cell outlined with both dark blue and light blue highlights immediately, caret appears
  * arrow keys move within text, all other keys work the same way as selected mode
* Added `cellValue` and `editMode` state

```ts
const [cellValue, setCellValue] = React.useState("");
const [editMode, setEditMode] = React.useState(false);
```

* Edit mode controls whether focus sink input is hidden below cell or placed on top for in place editing of content
* Added opaque background to cells as seeing text caret underneath cell contents when not in edit mode got confusing
* Cell value is the string in the focus sink input
* Value is empty string when not in edit mode, same as formula when in edit mode

```ts
function updateFormula(rowIndex: number, colIndex: number, editMode: boolean) {
  if (rowIndex < dataRowCount && colIndex < dataColumnCount) {
    const dataValue = data.getCellValue(snapshot, rowIndex, colIndex);
    const format = data.getCellFormat(snapshot, rowIndex, colIndex);
    const value = formatContent(dataValue, format);
    setFormula(value);
    setCellValue(editMode ? value : "");
  } else {
    setFormula("");
    setCellValue("");
  }
}
```

* Existing spreadsheets, like Google Sheets, flip a cell into edit mode when you start typing, overwriting existing content
* Having cell empty to start means we can use changed event as trigger for edit mode and naturally get overwrite behavior

{% raw %}

```tsx
focusSink = <input
  value={cellValue}
  onChange={(event) => {
    setCellValue(event.target?.value);
    setEditMode(true);
    setFormula(event.target?.value);
  }}
  style={{ zIndex: editMode ? 1 : -1, {...position} }}
  onKeyDown={onEditValueKeyDown}
  {...rest}
/>
```

{% endraw %}

* You can get into edit mode without overwriting the cell contents by double clicking on the cell.
* The other main trigger for entering edit mode is giving focus to or changing the value in the formula bar. Any changes made there are echoed to the cell value.

{% raw %}

```tsx
<input className={theme?.VirtualSpreadsheet_Formula}
  value={formula}
  onChange={(event) => {
    setFormula(event.target?.value);
    setEditMode(true);
    if (focusCell)
      setCellValue(event.target?.value);
  }}
  onFocus={() => {
      if (focusCell) {
        setCellValue(formula);
        setEditMode(true);
      }
  }}
  onKeyDown={onEditValueKeyDown}
  {...rest}
/>
```

{% endraw %}

# Key Down Handler

* Key down handling is what makes this component feel like a spreadsheet rather than a grid in fancy dress
* There's lots of subtle behavior changes depending on whether the component is in edit mode, or whether a cell, row or column is selected
* Once you're in edit mode there's no difference in behavior between the formula and cell edit inputs
* I use the same input handler for both

```ts
function onEditValueKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
  if (!focusCell)
    return;

  const row = focusCell[0];
  const col = focusCell[1];

  if (editMode) {
    switch (event.key) {
      case "Escape": { 
        updateFormula(row, col, false); 
        setEditMode(false); 
        setFocusCell([row, col]); 
      } 
      break;

      case "Enter": { 
        CommitFormulaChange(row, col); 
        updateFormula(row, col, false); 
        setEditMode(false);
        nextCell(row,col,true,event.shiftKey);
      } 
      break;

      case "Tab": { 
        CommitFormulaChange(row, col); 
        updateFormula(row, col, false); 
        setEditMode(false);
        nextCell(row,col,false,event.shiftKey);
        event.preventDefault();
      } 
      break;
    }
  } else {
    switch (event.key) {
      case "ArrowDown": { selectItem(row+1,col); event.preventDefault(); } break;
      case "ArrowUp": { selectItem(row-1,col); event.preventDefault(); } break;
      case "ArrowLeft": { selectItem(row,col-1); event.preventDefault(); } break;
      case "ArrowRight": { selectItem(row,col+1); event.preventDefault(); } break;
      case "Tab": { nextCell(row,col,false,event.shiftKey); event.preventDefault(); } break;
      case "Enter": { 
        if (isInSelection(row,col)) {
          nextCell(row,col,true,event.shiftKey);
        } else {
          updateFormula(row, col, true); 
          setEditMode(true);
        }
      } 
      break;
    }
  }
}
```

* Reset formula to stored value when switching to new cell or using `Escape` key
* Use default behavior for arrow keys in edit mode to move within the cell value being edited

Looking in detail at Google Sheets behavior
* If no row/column selected
  * Return puts cell into edit mode with caret at end of existing content, second return commits and moves down a cell
  * Tab moves right a cell (no change in edit mode)
  * Shift + Tab/Return does the same thing except moving in opposite direction
  * Arrow keys move focus as expected
* If row or column selected
  * Arrow keys move focus and select cell
  * Tab/Return move within the selection
    * return moves across if row selected, no change in edit mode
    * Tab moves down if column selected

* Added `isInSelection` utility function to determine whether cell is within a selected row or column
* Added `nextCell` utility function to determine appropriate cell to move to for `Tab` or `Return` and whether selection or just focus cell needs to change

```ts
  function nextCell(row: number, col: number, isVertical: boolean, isBackwards: boolean) {
    if (selection[0] === undefined && selection[1] === undefined)
      return;

    const offset = isBackwards ? -1 : 1;

    if (selection[0] === undefined) {
      // Column selected - move vertically within existing selection
      selectItem(row+offset, col, true);
    } else if (selection[1] === undefined) {
      // Row selected - move horizontally within existing selection
      selectItem(row, col+offset, true);
    } else {
      // Cell selected
      if (isVertical)
        selectItem(row+offset,col);
      else
        selectItem(row,col+offset);
    }
  }
  ```

# Focus

* Surprisingly complex to make repeated click on same cell work properly. Don't want to reset in progress edited value but do need to change some state as a trigger for effect that gives the input box focus. 

# Try It!

Start by selecting something and then moving around the grid using arrow keys, tab, shift-tab, return and shift-return. See how things change depending on whether you select a cell, row or column to start. 

Use one of the three different ways to go into edit mode and try to make some changes. Do you use the formula bar or the in-cell input?

{% include candid-iframe.html src="/assets/dist/react-spreadsheet-edit-ready/index.html" width="100%" height="fit-content" %}

# Next Time

`VirtualSpreadsheet` is edit ready but changes don't stick. Before I address that, I'm going to go back and build out a [Storybook]({% link _posts/2025-01-13-bootstrapping-storybook.md %}) containing `VirtualSpreadsheet` and all the other [Infinisheet]({% link _topics/infinisheet.md %}) components.