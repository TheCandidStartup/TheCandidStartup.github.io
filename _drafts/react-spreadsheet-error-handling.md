---
title: >
  React Spreadsheet: Error Handling
tags: react-spreadsheet
thumbnail: /assets/images/react-spreadsheet/data-error-state.png
---

[Last time]({% link _posts/2025-04-22-infinisheet-error-handling.md %}), we integrated [NeverThrow](https://github.com/supermacro/neverthrow) into [InfiniSheet]({% link _topics/infinisheet.md %}) to add `Result<T,E>` types for Rust style error handling. 

I used the `SpreadsheetData` method `setCellValueAndFormat` as a test case. Now we're going to use it for real in the InfiniSheet `react-spreadsheet` component.

# Spreadsheet Data Error

The first step is to replace the placeholder `string` error return with a proper error type.

```ts
export interface ValidationError {
  type: 'ValidationError',
  message: string,
};

export function validationError(message: string): ValidationError {
  return { type: 'ValidationError', message };
}

export interface StorageError {
  type: 'StorageError',
  message: string,
  statusCode?: number | undefined,
};

export function storageError(message: string, statusCode?: number): StorageError {
  return { type: 'StorageError', message, statusCode };
}

export type SpreadsheetDataError = ValidationError | StorageError;
```

This isn't complete. The aim here is to put a framework in place. Ultimately there will be a family of error types defined as a discriminated union. For now, we have a couple of starter types. Each one has a `type` field for the discriminated union and a `message` field that can be shown to the end user.

Use `ValidationError` for cases where the data source restricts values that can be stored to specific types or ranges. For now, `StorageError` covers all the other cases where there are problems storing and persisting the values. 

`StorageError` includes an optional http style `statusCode` that can be used to further classify the error. These codes should be in the `4XX` and `5XX` ranges. 

My main production implementation will have an http backend. Errors for other implementations can often be summarized with an http code too. Leaning on the http classification saves me from having to think too deeply about different error classes at this stage.

# Set and Is Valid

I changed `setCellValueAndFormat` to use `Result<void,SpreadsheetDataError>`. I also added an `isValidCellValueAndFormat` method that lets you check whether a value is valid to use without trying to modify the data source. You'll see why it's needed later.

```ts
export class EmptySpreadsheetData implements SpreadsheetData<number> {
  setCellValueAndFormat(_row: number, _column: number, _value: CellValue, 
    _format: string | undefined): Result<void,SpreadsheetDataError> 
  { return err(storageError("Not implemented", 501)); }

  isValidCellValueAndFormat(_row: number, _column: number, _value: CellValue, 
    _format: string | undefined): Result<void,ValidationError> 
  { return ok(); }
}
```

This is the implementation for my simple empty data source.

# Layered Data

 The first use for `isValidCellValueAndFormat` is my layered data source. This allows you to layer an editable data source on top of a base reference data source. Whatever overriding value is stored in the edit layer needs to be compatible with the base layer.

```ts
export class LayeredSpreadsheetData<...> implements SpreadsheetData<...> {
  setCellValueAndFormat(row: number, column: number, value: CellValue, 
        format: string | undefined): Result<void,SpreadsheetDataError> {
    const res = this.#base.isValidCellValueAndFormat(row, column, value, format);
    return res.andThen(() => this.#edit.setCellValueAndFormat(row, column, value, format));
  }

  isValidCellValueAndFormat(row: number, column: number, value: CellValue, 
        format: string | undefined): Result<void,ValidationError> {
    const res = this.#base.isValidCellValueAndFormat(row, column, value, format);
    return res.andThen(() => this.#edit.isValidCellValueAndFormat(row,column,value,format));
  }
}
```

I could have used an early out if the base call returns an error but decided to try one of the `neverthrow` utility methods instead. If the result of the first call is `ok`, `andThen` will execute the second call and return its result, otherwise it just returns the initial error.

I'm not yet convinced that the functional style is simpler and more readable than the imperative alternative.

# Boring Data

I've [previously introduced you]({% link _posts/2024-10-07-react-spreadsheet-data-model.md %}) to the world's most boring spreadsheet data set. I've made it more interesting by adding some validation.

```ts
export class BoringData extends EmptySpreadsheetData {
  isValidCellValueAndFormat(row: number, column: number, value: CellValue, 
      format: string | undefined): Result<void,ValidationError> {
    if (row == 0)
      return ok();

    if (column == 0 || column == 1) {
      return (typeof(value) === 'number' && format && isDateFormat(format))
       ? ok() : err(validationError("Expected a date or time"))
    } 
    
    if (column >= 3 && column <= 11) {
      return (typeof(value) === 'number' ) ? ok() : err(validationError("Expected a number"))
    }

    return ok();
  }
}
```

The first two columns need to contain dates and times, while most of the other columns are restricted to numbers.

# Data Error State

Now on to my `VirtualSpreadsheet` component. I want the component to feel like a modern editor. Errors are highlighted but you're able to keep working normally. No modal pop ups. 

{% include candid-image.html src="/assets/images/react-spreadsheet/data-error-state.png" alt="Spreadsheet Data Error State" %}

I started by adding React state to represent an error state

```ts
  const [dataError, setDataError] = React.useState<SpreadsheetDataError|null>(null);
```

Next, I added new CSS classes that are used when the component is in an error state.

```ts
export interface VirtualSpreadsheetTheme {
  /** Modifier class applied to the Formula input when the user has entered invalid data */
  VirtualSpreadsheet_Formula__DataError: string,

  /** Modifier class applied to a cell when the user has entered invalid data */
  VirtualSpreadsheet_Cell__DataError: string,

  /** Class applied to an in grid error tag */
  VirtualSpreadsheet_ErrorTag: string,
}
```

Here's the default CSS.

```css
.VirtualSpreadsheet_Cell__DataError {
  background-color: lightpink;
}

.VirtualSpreadsheet_Formula__DataError {
  background-color: lightpink;
}

.VirtualSpreadsheet_ErrorTag {
  background-color: lightsalmon;
  border: 2px solid black;
  padding: 5px;
  margin: 10px;
}
```

You can see where this is going. When a user enters invalid data the focus cell and formula input bar are highlighted with a pink background. The error message is displayed in a tag that floats over the spreadsheet grid, carefully positioned so that it doesn't cover the focus cell.

The `DataError` modifier classes are conditionally added in JSX

```tsx
  <input className={join(theme?.VirtualSpreadsheet_Cell, 
    theme?.VirtualSpreadsheet_Cell__Focus, 
    ifdef(dataError, theme?.VirtualSpreadsheet_Cell__DataError))}>

  <input className={join(theme?.VirtualSpreadsheet_Formula, 
    ifdef(dataError, theme?.VirtualSpreadsheet_Formula__DataError))}>
```

# Making a Change

Changes are applied using the `commitFormulaChange` method. I updated it to check the result and set the error state appropriately.

```ts
function commitFormulaChange(rowIndex: number, colIndex: number): boolean {
  const [value, format] = parseFormula(formula);
  const result = data.setCellValueAndFormat(rowIndex, colIndex, value, format);
  setDataError(result.isOk() ? null : result.error);
  return result.isOk();
}
```

Events which apply changes, like hitting `Enter` on the keyboard, now check whether the commit succeeded. Remember that changes to React state only become visible at the next render, so I need to rely on an explicit return value from `commitFormulaChange`.

```ts
  case "Enter": { 
    if (commitFormulaChange(row, col)) {
      updateFormula(row, col, false); 
      setEditMode(false);
      nextCell(row,col,true,event.shiftKey);
    }
  } 
```

If the commit fails we leave the invalid data in place for the user to correct and don't move to the next cell. The same happens with `Tab`.

The user can revert the changes using `Escape` or by explicitly selecting a different cell.

# Continuous Feedback

I also used `isValidCellValueAndFormat` to add continuous feedback as you type. Whenever the cell or formula value changes, we validate and display error feedback if appropriate. This is passive feedback. Everything else works as normal.

```tsx
function validateFocusFormula(formula: string) {
  if (!focusCell)
    return;

  const row = focusCell[0];
  const col = focusCell[1];

  const [value, format] = parseFormula(formula);
  const result = data.isValidCellValueAndFormat(row, col, value, format);
  setDataError(result.isOk() ? null : result.error);
  return result.isOk();
}

<input onChange={(event) => {
  const value = event.target?.value;
  setCellValue(value);
  setEditMode(!readOnly);
  setFormula(value);
  validateFocusFormula(value);
}}>
```

# Displaying the Error Tag

It took a couple of attempts before I was happy with the display of the error tag. 

I started by using absolute positioning and trying to calculate the best place to put the tag relative to the focus cell. There were all kinds of problems when the cell scrolled off the screen or was close to the edge. Doing it properly would involve knowing the size of the tag, which depends on the length of the text, which would mean using an effect.

I decided to let the browser do the layout by making the grid container a flex box. There's no impact on the other elements that make up the grid as they all use absolute positioning.

{% raw %}

```tsx
const outerGridRender: VirtualContainerRender = ({children, style, ...rest}, ref) => {
  let focusSink, errorTag, errorTagAlign;
  if (focusCell) {
    ...
    if (dataError) {
      errorTagAlign = (focusTop > height/2) ? "start" : "end";
      errorTag = <div className={theme?.VirtualSpreadsheet_ErrorTag} style={{ zIndex: 2 }}>
        {dataError.message}
      </div>
    }
  }
  return <div ref={ref}
    style={{...style, display: "flex", alignItems: errorTagAlign, justifyContent: "center"}}
    {...rest}>
    {children}
    {focusSink}
    {errorTag}
  </div>
}
```

{% endraw %}

The error tag floats over the grid (due to the `zIndex: 2` style) and is horizontally centered using `justifyContent: "center"`. The `alignItems` property is set dynamically to position the tag at the `start` or `end` of the grid depending on the position of the focus cell. This ensures that the tag is never positioned over the cell the user is trying to edit.

# Testing

I updated the `VirtualSpreadsheet` unit tests. The test data source now has some cells that fail when you try to change them. I added a new set of test cases for failed edits, checking that the component enters and leaves the data error state correctly.

I also added test cases for a few edge cases I previously missed. We now have coverage of all non-layout dependent functionality.

Finally, I added a "Data Error" story to StoryBook.

```ts
export const DataError: Story = {
  args: {
    data: boringData,
  },
  tags: ['!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = canvas.getByTitle("Name");
    await userEvent.type(name, "A2");
    await userEvent.keyboard("{Enter}{Enter}9");

    const tag = canvas.getByText("Expected a date or time");
    await expect(tag).toBeInTheDocument();
  }
};
```

I had to exclude the story from Auto Docs as it doesn't play nicely with other stories. To be in the error state the the focus cell must be in edit mode with some incorrect text entered. When in edit mode it has the focus which means the browser scrolls the *Docs* page down past the main documentation so that the focus cell is in view. 

I use the keyboard event to modify the cell value. On the Docs page multiple stories are being rendered in parallel which means it's possible for the focus to change to another story between selecting the cell and sending the keyboard event.

# Try It!

Visit the [Data Error](https://www.thecandidstartup.org/infinisheet/storybook/?path=/story/react-spreadsheet-virtualspreadsheet--data-error) Virtual Spreadsheet story. Or create your own error condition right here.

{% include candid-iframe.html src="https://thecandidstartup.org/infinisheet/storybook/iframe?id=react-spreadsheet-virtualspreadsheet--boring-data" width="100%" height="420px" %}

Select one of the cells containing a date or number. Double-click or hit `Enter` to start editing. See how the component enters and leaves the data error state as you type. Press `Enter` again to try and commit your change. Correct your mistake and try again, or hit `Escape` to revert your changes.

The latest [react-spreadsheet](https://www.npmjs.com/package/@candidstartup/react-spreadsheet), [react-virtual-scroll](https://www.npmjs.com/package/@candidstartup/react-virtual-scroll), [simple-spreadsheet-data](https://www.npmjs.com/package/@candidstartup/simple-spreadsheet-data) and [infinisheet-types](https://www.npmjs.com/package/@candidstartup/infinisheet-types) packages are available on [npm](https://www.npmjs.com/).

Check the [Change Log](https://github.com/TheCandidStartup/infinisheet/blob/main/CHANGELOG.md) for all the details.