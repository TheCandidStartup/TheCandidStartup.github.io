---
title:  Spreadsheets are the Future of Data Systems
---

The final chapter of [Martin Kleppmann's](https://martin.kleppmann.com/) wonderful book [Designing Data-Intensive Applications](https://dataintensive.net/) is called "The Future of Data Systems". In this chapter he talks about data integration between different specialized systems using flows of derivative data, unbundling today's complex databases into simpler specialized data storage components and composing them with dataflow processing systems. At one point, almost as a throw away remark, he mentions that spreadsheets already have most of the dataflow programming capabilities that such a system would need. Of course, a spreadsheet is just a spreadsheet. A real data system needs to be durable, scalable and fault tolerant. It needs to integrate with a wide variety of disparate technologies.

What if the real data system of the future could be a spreadsheet?

We've all heard stories of insanely complex spreadsheets that large enterprises are inexplicably using to run their core business processes. Head over to [The Daily WTF](https://thedailywtf.com/) if you haven't [already](https://thedailywtf.com/articles/The-Great-Excel-Spreadsheet) [had](https://thedailywtf.com/articles/another-immovable-spreadsheet) [your](https://thedailywtf.com/articles/The-Revealing-Spreadsheet) [fill](https://thedailywtf.com/articles/The_Excel_Worm). Why do users insist on doing this rather than paying a team of programmers for six months (which ends up being two years with overruns) to build a proper system?

Everyone knows how to use a spreadsheet. In [Spreadsheets are Code](https://youtu.be/TMIBfzSqguQ), [Felienne Hermans](https://www.felienne.com/) looked at how ideas from software engineering can be applied to improve how users work with spreadsheets. She also addressed the question of why spreadsheets are so popular. In 2015 there were about 11 million professional developers in the world. In contrast there were 650 million Excel users. A Dutch government survey of programming skills across the population found that 54% of Dutch citizens knew how to use spreadsheet formulas.

Spreadsheets hit a sweet spot. They are easy to get started with and easy to deploy. Interaction is very direct. You type values into cells. You type formulas right where you want the output of the formula to appear. Spreadsheets are a live environment. Change something and the output immediately updates. No need to save, or compile, or run. You can incrementally adopt more advanced features at your own pace. You can decompose complex problems by adding more intermediate cells, which also improves your understanding by letting you see intermediate results.

Spreadsheet users may not realize it but they're using a [fully fledged functional programming language](https://thenewstack.io/excel-the-functional-programming-tool-you-didnt-know-you-had/). Spreadsheets are even [Turing Complete](https://www.felienne.com/archives/2974). The live environment that gives users confidence to explore is a natural outcome of the side effect free nature of spreadsheet formulas. It's what makes spreadsheet formulas a far better dataflow processing language than something like SQL.

The question isn't why do people use spreadsheets? The real question is why do people stop using spreadsheets? Why do they feel the need to rewrite them as custom applications? Microsoft 365 and Google Sheets are mature products so the problem isn't durability or availability.

The answer is simple enough. They run into scaling problems. It could be due to the size of the data they're managing, the number of users that need to interact with that data or the size and complexity of their application.

# Data Limits

Most spreadsheets have a file based heritage or have inherited a file based mentality. You save your spreadsheet into a file. When you want to use it, you load it into memory in your client. The features exposed and the way they're implemented are based on the assumption that everything is in memory.

What happens when a spreadsheet gets too big? It takes a long time to load and save. It becomes less responsive as you navigate around the data. It hangs for a while whenever you update anything.

Well written applications implement limits to stop their users getting themselves in trouble. The limits for Microsoft Excel and Google Sheets are shown below. 

| Limit     | [Microsoft Excel](https://support.microsoft.com/en-us/office/excel-specifications-and-limits-1672b34d-7043-467e-8e27-269d656771c3) | [Google Sheets](https://workspacetips.io/tips/sheets/google-spreadsheet-limitations/) |
|-----------|-----------------|---------------|
| Rows      | 1,048,576       | -             |
| Columns   | 16,384          | 18,278        |
| Cells     | -               | 10 M          |
| Cell Size | 32 KB           | 50 K          |

For both products there's an effective limit of around a million rows. Anecdotal reports suggest users run into problems once they get to the hundreds of thousands.

# User Management

When spreadsheets were limited to desktop applications, only a single user could edit at a time. Collaboration was based on shared drives or emailing files to each other. Cloud based spreadsheets like Microsoft 365 and Google Sheets support simultaneous editing. However, both have a [hard limit of 100 simultaneous users](https://support.google.com/a/users/answer/9305987?hl=en) with anecdotal reports suggesting that things become [unworkable with more than 10](https://techcommunity.microsoft.com/t5/office-365/limits-to-number-of-co-authors/m-p/184802).

Simultaneous collaborative editing is a bit of a red herring. When you're running your enterprise's core business process on a spreadsheet it's much more important that users don't get in each others way. If you're keeping track of sales in a spreadsheet you want multiple users to be able to add records without blocking or interfering with each other. You know, like a real cloud application.

As the developer and maintainer of a spreadsheet you want to give users the ability to add and edit data without screwing up the structure and formulas you've painstakingly created. You might want to set up granular permissions for who can edit or even see specific rows. You might want to define constraints that ensure data integrity is maintained. 

Permissions in [Excel](https://support.microsoft.com/en-us/office/protection-and-security-in-excel-be0b34db-8cb6-44dd-a673-0b3e3475ac2d) and [Google Sheets](https://support.google.com/docs/answer/1218656?hl=en-GB&co=GENIE.Platform%3DDesktop#zippy=%2Cwho-can-protect-a-range-or-sheet%2Cedit-a-copy-of-a-protected-sheet%2Cprotect-a-range-or-sheet) are limited. Where granular permissions are supported they are limited to controlling write access only. In addition, the permissions are tied to specific cells in the spreadsheet rather than being based on values in the data.

# Implementation Complexity

Your data's not too large. You can keep your users under control. You have a successful spreadsheet based application. Like all applications you tweak, improve, add new features. You become a victim of your success as the spreadsheet becomes unmaintainable.

As Felienne Hermans showed, [Spreadsheets are Code](https://youtu.be/TMIBfzSqguQ). The problem is most spreadsheets are the equivalent of old school Basic. Instead of `goto 10` you're writing formulas that reference `C:7`. Changes are made live in production. The only source code repo is a folder containing old copies of the spreadsheet. 

These are the same challenges as regular software engineering. You can apply the same patterns of abstraction, reuse and modularity to manage the complexity. We can provide tools to support source code management, testing and deployment pipelines. 

# Spreadsheet-Database Hybrids

I'm not the first person to identify the need for a better spreadsheet. There are loads of startup [Spreadsheet-Database](https://www.jotform.com/blog/database-vs-spreadsheet/) hybrids out there: [AirTable](https://www.airtable.com/), [Jotform](https://www.jotform.com/), [SmartSheet](https://www.smartsheet.com/), [Causal](https://www.causal.app/) and [Spendata](https://www.spendata.com/spendata-database-as-spreadsheet.php) to name just a few from the first page of Google search results. 

They provide the rigour of a database with the ease of use of a spreadsheet. They have lots of additional features that address your workflows. What's not to like?

The biggest problem is that they're not spreadsheets. They're another alternative that still requires you to rewrite your spreadsheet.

I've used a few in my time. Usually when someone in the organization thinks that the problems with our processes can be solved by bringing in a new software solution without actually changing the process. They fall into the trap of trying to be [solutions rather than tools]({% link _posts/2023-01-03-tools-vs-solutions.md %}). At best they provide some subset of spreadsheet features and focus all their energy on adding new features on top. 

# My Project    

[Last time]({% link _posts/2023-01-03-tools-vs-solutions.md %}) I revealed that my open source, serverless, customer deployed SaaS product is going to be a spreadsheet. Hopefully, you now understand why I'm interested in building a better spreadsheet. There are also practical advantages. The core spreadsheet UI is simple. It's feasible for me to build the full stack myself. There's no need to research and design a novel tool and hope that it's useful. 

The idea is to start with a spreadsheet and address the limitations. I'm going to follow the [TypeScript](https://www.typescriptlang.org/) model. TypeScript is a superset of JavaScript. Any valid JavaScript is also valid Typescript. You can start with basic JavaScript and incrementally make use of the additional features that TypeScript provides. 

Similarly, you should be able to import a standard Excel or Google Sheets spreadsheet and have it just work. Then provide additional, optional capabilities that you can incrementally enable to go beyond what a standard spreadsheet can do. 

The first step is to address the data limits. This is the cloud. We have infinite[^1] storage and infinite[^1] compute. Let's support billions of rows, millions of columns, terabytes of data per cell. 

That should keep me busy for a while.

We can tame implementation complexity by encouraging use of generic formulas that can be applied to all the cells in an entire column or block. Extending the set of standard functions where needed. Separating storage of the code (formulas, formatting, named definitions) from the data. Allowing advanced users to pull the code out of the spreadsheet and manage it in GitHub. Providing tools for safe testing and deployment of updates. Larger scale applications could be supported using multiple workbooks that can be deployed independently and interact using events.

To scale the number of users we need granular, attribute based permissions. We need data model enhancements that allow many asynchronous users to safely interact with the same spreadsheet. Data integrity constraints, ordering constraints, uniqueness constraints, additional data types, transactions. 

An ordering constraint could be presented as the ability to lock sorted columns so that the order is maintained. A uniqueness constraint is a simple property of a column or set of columns. Combine the two and you have the basic functionality of a database. Use an array formula to copy data to another sheet with a different sort and you have a secondary index. Squint hard enough and this looks like the unbundling of databases that Martin Kleppmann was talking about as the future of data systems.

So, that's the vision. Where do we start? That will have to wait for next time. 

# Footnotes

[^1]: Not actually infinite.