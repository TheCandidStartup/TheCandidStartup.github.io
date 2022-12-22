---
title:  Spreadsheets are the Future of Data Systems
---

The final chapter of [Martin Kleppmann's](https://martin.kleppmann.com/) wonderful book [Designing Data-Intensive Applications](https://dataintensive.net/) is called "The Future of Data Systems". In this chapter he talks about data integration between different specialized systems using flows of derivative data, unbundling todays complex databases into simpler specialized data storage components and composing them with dataflow processing systems. At one point, almost as a throw away remark, he mentions that spreadsheets already have most of the dataflow programming capabilities that such a system would need. Of course, a spreadsheet is just a spreadsheet. A real data system needs to be durable, scalable and fault tolerant. It needs to integrate with a wide variety of disparate technologies.

What if the real data system of the future could just be a spreadsheet? Is that such a crazy idea?

We've all heard stories of insanely complex spreadsheets that large enterprises are inexplicably using to run their core business processes. Head over to [The Daily WTF](https://thedailywtf.com/) if you haven't [already](https://thedailywtf.com/articles/The-Great-Excel-Spreadsheet) [had](https://thedailywtf.com/articles/another-immovable-spreadsheet) [your](https://thedailywtf.com/articles/The-Revealing-Spreadsheet) [fill](https://thedailywtf.com/articles/The_Excel_Worm). Why do users insist on doing this rather than paying a team of programmers for six months (which ends up being two years with overruns) to build a proper system?

Everyone knows how to use a spreadsheet. In [Spreadsheets are Code](https://youtu.be/TMIBfzSqguQ), [Felienne Hermans](https://www.felienne.com/) looked at how ideas from software engineering can be applied to improve how users work with spreadsheets. She also addressed the question of why spreadsheets are so popular. In 2015 there were about 11 million professional developers in the world. In contrast there were 650 million Excel users. A Dutch government survey of programming skills across the population found that 54% of Dutch citizens knew how to use spreadsheet formulas.

Spreadsheets hit a sweet spot. They are easy to get started with and easy to deploy. Interaction is very direct. You type values into cells. You type formulas right where you want the output of the formula to appear. Spreadsheets are a live environment. Change something and the output immediately updates. No need to save, or compile, or run. You can incrementally adopt more advanced features at your own pace. You can decompose complex problems by adding more intermediate cells which also improves your understanding by letting you see intermediate results.

Spreadsheet users may not realize it but they're using a [fully fledged functional programming language](https://thenewstack.io/excel-the-functional-programming-tool-you-didnt-know-you-had/). Spreadsheets are even [Turing Complete](https://www.felienne.com/archives/2974). The live environment that gives users confidence to explore is a natural outcome of the side effect free nature of spreadsheet formulas. It's what makes spreadsheet formulas a far better dataflow processing language than something like SQL.

The question isn't "why do people use spreadsheets?" The real question is why do people stop using spreadsheets and rewrite them as custom applications? What are the barriers they run into?

* Why exactly is that? What limits are there?
    * Scale of data - Excel 365 and Google Sheets limits
    * Scale of users - before cloud limited by collaboration around file. Can now support live collaboration - limit is more subtle. Lack of access control, data integrity constraints.
    * Scale of software complexity. Spreadsheets are code if the code is written in basic. Same challenges as regular software engineering without the tools.
* Spreadsheet-database hybrids. Rigour of a database with the simplicity of a spreadsheet. Biggest problem is that they're not spreadsheets.
* Last time ... hopefully you understand why I'm interested in building a better spreadsheet.
* Practical advantages - simple UI, feasible to build this myself. No need to research and design a novel tool and hope its applicable. 
* Start with a spreadsheet and address the limitations.
* Typescript model. Should be able to import a standard Excel or Google Sheets spreadsheet and it just works. Then provide additional, optional capabilities that you can incrementally enable to go beyond what a standard spreadsheet can do. 
    * Address data limits - billions of rows, millions of columns, TBs in a single cell
    * Cloud basics -  fault tolerant, scalable, durable
    * Access control and data integrity constraints
    * Transactions
    * Data typing
    * Data ordering constraints - persistent sort
    * Add uniqueness constraint and you have equivalent of primary keys (simple and complex)
    * Formulas used for derived data. Add additional formulas to make it easy to create the equivalent of a secondary index on another sheet
    * Manage formulas as source code - pull out to github, deploy pipeline? Promote reuse, generic formulas applied to entire columns, large blocks of cells, separate storage mechanism for formulas compared with data.
    * Workbooks as dataflow module. Internally synchronous transaction model for updates. Ability to connect workbooks (and other systems) asynchronously. Input/output sheets, events on changes.
