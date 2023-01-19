---
title: The World's Most Boring Spreadsheet
---

What's the best way to get started with a big new project? Something like building an [open source, serverless, customer deployed, scalable spreadsheet]({% link _posts/2023-01-09-spreadsheets-future-data-systems.md %}) from scratch? 

I like to start with a simple motivating example. Something I can get my head round that lets me get a deeper understanding of the problem space. Once I've extracted what I can from that I can make it more complex or look at something in a neighboring space. To that end, let me show you round the world's most boring spreadsheet. 

{% include candid-image.html src="/assets/images/boring-spreadsheet.png" alt="The World's Most Boring Spreadsheet" %}

I built it in Excel 2007 running on Windows 11. No Microsoft, I do not want to take up your kind offer of an upgrade to a Microsoft 365 subscription. Excel 2007 was the version that introduced the Office Open XML format still used today, increased limits to 1,048,576 rows and 16,384 columns and introduced a multi-threaded calculation engine. It will do just fine for our purposes. 

The spreadsheet is used to track sales for a hardware store. Inexplicably, the store seems to only sell nails and always in the same amounts. The total price for each purchase is worked out as
* Cost = Price * Quantity
* Tax = Cost * Tax Rate
* Subtotal = Cost + Tax
* Total = Subtotal + Transaction Fee

The store owner likes to keep track of a running total in each row which now and then they compare with the overall total to make sure that the spreadsheet "isn't cheating". They also calculate count, average, max, min and sums of the other columns.

In all the years the store has been in business, the prices, tax rate and fees have never changed. Perhaps that's why they've been so successful and have just recorded their millionth sale.

That give us a spreadsheet with 1 million rows and 10 million cells. Right at the limits of what Excel and Google Sheets allow. So, how does it perform?

Surprisingly well. I have a reasonable spec Windows desktop: a Ryzen 5600X with 6 dual-threaded cores, 16GB of RAM and a fast M.2 NVMe SSD. The spreadsheet is 60MB on disk using the default .xlsx format or 20MB in the optimized binary .xlsb format. Opening the spreadsheet takes 10 seconds and requires 400MB of RAM. After that, performance is pretty much interactive. A full recalculation of the entire spreadsheet takes about half a second - just enough time for Excel to bring up a progress bar and report that it's calculating using 12 threads.  

I need to be able to match this level of usability with my cloud based solution. If potential customers can bring in their existing spreadsheets and see them working well, I then get the opportunity to show them the scalability and additional features I intend to deliver. Let's do a bit of analysis to understand what's going on here and see if we can pull out some test cases that I can use to benchmark different approaches. Before I do that I want to take you on a brief detour where I figure out how to accurately measure calculation time. 

# Timing

The simplest approach is to do it manually with a stopwatch. Unfortunately, my boring spreadsheet is too fast. I don't want to add pointless busy work to slow things down enough to measure by hand.

What if I could get the spreadsheet to time itself? Excel includes a [`NOW()` function](https://support.microsoft.com/en-us/office/now-function-3337fd29-145a-4347-b2e6-20c904739c46) which returns the current date and time. `NOW` is a [volatile function](https://learn.microsoft.com/en-us/office/dev/add-ins/excel/custom-functions-volatile). Every time its called it will return a different value - the current date and time. Every cell with a formula that includes `NOW()` will be recalculated on any change to the spreadsheet. If I can arrange for `NOW()` to be executed before and after the calculation I want to time, I can determine the time taken in between. 

It works. Kind of. You have to make sure that whichever formula is evaluated first has a dependency on the cell with the start `NOW()` and that the cell with the end `NOW()` depends on the cells that will be evaluated last. The calculation is multi-threaded so you can't give the calculation engine any wiggle room if you want accurate results. In addition, at least with my copy of Excel, `NOW()` only has a resolution of 10ms.

Luckily I found a better way. While trying to understand how the Excel calculation engine works I stumbled across Microsoft documentation on [making workbooks calculate faster](https://learn.microsoft.com/en-us/office/vba/excel/concepts/excel-performance/excel-improving-calculation-performance#making-workbooks-calculate-faster), which includes some handy VBA macros for timing calculation performance including full recalc, incremental recalc and recalc of a specified range of cells. Even better they use the system high-resolution timer for microsecond accuracy.

After all that I can tell you that a full recalculation of the spreadsheet takes 0.57 seconds (there are more decimal places but they vary from run to run) and an incremental recalculation takes 0.33 seconds.

# Analysis

The [Excel calculation engine consists of three parts](https://learn.microsoft.com/en-us/office/vba/excel/concepts/excel-performance/excel-improving-calculation-performance#understanding-calculation-methods-in-excel). First, a system that determines and maintains a dependency graph between cells. Second, a system that uses the dependency graph to determine which formulas need to be calculated in which order (the "calculation chain"). Finally, the system that calculates all the formulas and updates the values in the corresponding cells. 

For now, we're going to treat the first two systems as a black box and focus on the calculation of the formulas. 

Each row has five simple formulas involving two multiplies and three adds. Each depending on two input cells. Overall that makes 10 million reads, 5 million floating point operations and 5 million writes. 

The summary row uses `COUNTA`, `AVERAGE`, `MAX`, `MIN` and five `SUM` over one million data rows. 
* `COUNTA` - One million reads, one million increments, one write.
* `MIN`, `MAX` - One million reads, one million comparisons, one write.
* `SUM` - One million reads, one million additions, one write. 
* `AVERAGE` - One million additions, one million increments, and a divide.

# Test Cases
