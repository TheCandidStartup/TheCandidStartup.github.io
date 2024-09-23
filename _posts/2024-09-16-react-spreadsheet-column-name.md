---
title: Spreadsheet Column Naming
tags: react-spreadsheet spreadsheets
---

[Last time]({% link _posts/2024-09-09-react-spreadsheet.md %}), I ported some spreadsheet-ish sample code into my new stub `react-spreadsheet` package, and called it a spreadsheet. Unsurprisingly, it's not very good. Time to start iterating. 

I have to start somewhere, and what says spreadsheet more than columns named A, B, C rather than 0, 1, 2?

# Column Naming

This should be easy. I just need to format the column index in base-26 using characters A-Z, rather than in base-10 using characters 0-9. Except, if that was the case, the next column after Z would be BA not AA.

{% include candid-image.html src="/assets/images/react-spreadsheet/spreadsheet-column-names.png" alt="Spreadsheet Column Names" %}

Rows start from one. Maybe I should think of A representing 1 rather than 0. But then, what represents 0? A-Z are 1-26. 

Clearly, there is no 0 as the next column after Z is AA. It's as if the next row after 9 was 11. 

As ever, when stuck, I turned to the internet. It seems like nobody else is suffering an existential crisis on this topic. Stack overflow has [loads of code snippets](https://stackoverflow.com/questions/9905533/convert-excel-column-alphabet-e-g-aa-to-number-e-g-25) for converting column names to numbers. At first glance, the code looks like I'd expect for parsing base-26 formatted numbers. How can that work?

# Base-10 Numbers Without Zero

Then I realized. A-Z represent 26 non-zero "digits" in a base-26 number system. That's one digit too many. It's like getting rid of zero in base-10 and replacing it with another digit that represents 10. 

Let's play with that idea. I'll use "X" as my additional digit. Now the next number after 9 is X followed by 11. Here's some more examples of my No-Zero number system. 

| Base-10 | No-Zero&#8482; |
| - | - |
| 0 | |
| 1 | 1 |
| 9 | 9 |
| 10 | X |
| 11 | 11 |
| 19 | 19 |
| 20 | 1X |
| 21 | 21 |
| 99 | 99 |
| 100 | 9X |
| 101 | X1 | 
| 109 | X9 |
| 110 | XX |
| 111 | 111 |

It all works out. You can have a decimal [positional](https://en.wikipedia.org/wiki/Positional_notation) number system for natural numbers without any need for a zero. Which blows my mind a bit. I'd always thought that zero was a foundational concept needed to move from [Roman style](https://en.wikipedia.org/wiki/Roman_numerals) [additive](https://en.wikipedia.org/wiki/Sign-value_notation#Additive_notation) numbers to [Arabic style](https://en.wikipedia.org/wiki/Arabic_numerals) positional numbers. 

Parsing these No-Zero numbers works the same way as a regular number. You have units, tens, hundreds, etc. The only difference is that each digit represents 1-10 of those things rather than 0-9. 

# Parsing Base-26 No-Zero Numbers

That's why the parsing code for spreadsheet column names is basically stock base-26 parsing. Here's my version.

```ts
/**  Classic Spreadsheet reference to Column (e.g "A") */
export type ColRef = string;

/** Converts a {@link ColRef} to the 0-based index of the column */
export function colRefToIndex(col: ColRef): number {
  let n = 0;
  for (let i = 0; i < col.length; i ++) {
    n = col.charCodeAt(i) - 64 + n * 26;
  }
  return n-1;
}
```

There are two magic numbers. First, we're dealing with base 26 numbers. Second, the ASCII/Unicode character code for "A" is 65. In this number system "A" represents 1, so we need to subtract 64 to convert A-Z to 1-26. 

The rest of my code, like most things written in JavaScript, works with zero-based indices. I subtract one at the end to convert from the one-based natural numbers encoded in the column names.

# Formatting No-Zero Numbers

Going the other way and formatting No-Zero numbers is trickier. The approach for normal zero based formatting is to work out how many units you have, output the corresponding digit, shift the number right and then repeat. With No-Zero numbers you can't output a zero. You have to "borrow" a ten from the remaining number and output that instead.

There's a neat trick that removes the need for conditionals and explicit borrowing logic. Start each step of the loop by subtracting 1 from the number. This does two things. First, if there are zero units, it effectively borrows 10 (e.g. 20 becomes 19). Second, it shifts the range of possible units from 1-10 to 0-9. Instead of outputting the corresponding digit based on a range from 1-10, do it based on 0-9.

The same trick works in base 26, resulting in this implementation. 

```ts
/** Converts a 0-based column index to a {@link ColRef} */
export function indexToColRef(index: number): ColRef {
  let ret = "";
  index ++;
  while (index > 0) {
    index --;
    const remainder = index % 26;
    index = Math.floor(index / 26);
    ret = String.fromCharCode(65+remainder) + ret;
  }
  return ret;
}
```

Start by adding 1 to turn the zero-based index into a one-based natural number. Each step of the loop determines a digit in the output. First, the magic subtract 1. Next, divide by 26 to shift the number right, keeping track of the remainder. Finally, map the remainder (with range 0-25) to the "digits" A-Z. 

# Implementation

I put the conversion functions into a new source file, `RowColRef.ts`. Eventually, this code will end up in a shared utility package, so I want to keep it separate from the rest of `react-spreadsheet`. As the name suggests, I also implemented utilities for general row, column and cell references using [A1 notation](https://bettersolutions.com/excel/formulas/cell-references-a1-r1c1-notation.htm). 

That allowed me to enhance the "scroll to row" input field in `VirtualSpreadsheet` to also support scroll to column (e.g. "A") and scroll to cell (e.g. "A1"). The jumping around as you type got annoying, so I changed it to scroll on pressing enter.

Naturally there are also plenty of unit tests in `RowColRef.test.ts`.

# Try It!

{% include candid-iframe.html src="/assets/dist/react-spreadsheet-column-name/index.html" width="100%" height="fit-content" %}

# Next Time

What's that you say? The demo only has 26 columns, making the fancy formatting code pointless? 

Good point. [Next time]({% link _posts/2024-09-16-react-spreadsheet-infinite-scrolling.md %}) we'll look at dynamically extending the size of the spreadsheet to whatever the user wants. 