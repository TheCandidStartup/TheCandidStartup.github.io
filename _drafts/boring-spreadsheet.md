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