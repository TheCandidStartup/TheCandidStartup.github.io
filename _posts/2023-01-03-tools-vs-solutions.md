---
title: Tools vs Solutions
tags: navisworks autodesk spreadsheets
---

[James Awe](https://www.linkedin.com/in/james-awe-4630a94/) is the first Software Architect I met at Autodesk. He was involved in the acquisition process for [Navisworks](https://en.wikipedia.org/wiki/Navisworks), where I was then CTO. Some years later he shared the story of how he first became aware of Navisworks. 

Jim was visting the team working on the design and engineering of [One World Trade Center](https://en.wikipedia.org/wiki/One_World_Trade_Center) (then known as the Freedom Tower). The Freedom Tower was a super high profile project and it was something of a coup for Autodesk that [they were using Revit](https://aecmag.com/news/bim-and-the-freedom-tower/) to design the building. Jim was there to see how Revit was used in practice on a big project and hopefully come away with a good news story of how Revit had made it all possible. 

As anyone who has worked on a large construction project knows, there is never just a single piece of software involved. Construction practices and processes evolve over time with a process of natural selection and survival of the fittest determining the software used for each task. As Jim continued his tour of the office he counted up over thirty different pieces of software in use on the project. 

"Are you really using all of these?", he asked his host. "We are", came the reply. "And out of all of them there's only two that we like". The first was [Excel](https://en.wikipedia.org/wiki/Microsoft_Excel) and the second was Navisworks.

They liked Excel and Navisworks because they just worked. They each focused on a specific task and did it well. They were easy to fit into the team's existing processes. They integrated well with the other software in use. 

Jim learned what he needed about how Revit was used in practice and as a bonus came away with a new acquisition target for Autodesk's M&A team.

# Tools

Excel and Navisworks are tools. A tool can be used by multiple types of user in multiple industries. A tool has no opinion on how your processes work. A tool doesn't care what other tools you use. A tool is deeply focused on the task it was designed for. 

Excel is used on what seems like every construction project on the planet. Yet no Microsoft product manager or user experience designer has ever spent time figuring out the needs of the construction user and adding construction specific features to their product.

Navisworks was built as a tool out of necessity. I didn't have a clue how the construction industry worked. Nor did anyone else during the early days. We were trying to build a toolkit for large model viewing. I built a demo that would allow users to aggregate multiple CAD design files, visualize the entire model and query the properties of individual objects in the model. We didn't have much luck finding someone to license the toolkit but plenty of people saw the demo and said they'd buy that. So we pivoted. 

Navisworks has no idea what your models mean. As far as it's concerned they're just a collection of objects with geometry, material, transform and properties. However, being able to see all the objects for your project at once, being able to fly and walk through the model, being able to query and search using the properties is an incredibly useful tool. 

It doesn't matter what industry you're in. If you have big 3D models, Navisworks will be useful. When Navisworks was acquired we had roughly equal numbers of customers from the construction and process plant industries. When Autodesk started bundling their products into industry focused suites and collections, Navisworks was included in nearly every one of them. 

A good tool needs to solve a problem that is universal. It needs to be general and abstract and yet at the same time address real needs across multiple personas and industries. You need deep understanding to generalize specific customer needs into a widely usable tool.

# Solutions

Revit is a solution. A solution tries to understand the complete set of needs for a persona or industry and provide a one stop shop that covers everything. A solution tries to understand how your processes work and model them in the software. A solution assumes that you're going to use it for everything. A solution thinks that you won't need any other tools. A solution tries to do everything, so finds it hard to cover all your needs at the same level of depth. 

Revit was first released over 20 years ago. Since then there have been multiple releases a year delivered by a large development team. Revit has features targeted at the full range of design professionals that work on construction projects. It addresses the needs of Architects, Structural, Electrical, Plumbing, HVAC, and
Fabrication engineers. You might think that Revit must be pretty much feature complete by now. However, it seems that [Revit customers are more dissatisfied than ever](https://aecmag.com/bim/the-open-letter-two-years-on/).

That's the problem with solutions. They try to do everything but that's simply not possible. Everybody's needs are different. Some customers will be delighted by the solution they receive. It does everything they need just the way they'd like it to. Most customers, especially the big demanding ones, will find something that is missing or that doesn't work quite the way they need it to. Solutions are set up to over promise and under deliver. 

Most large SaaS vendors try to provide solutions. In a lot of ways its a natural fit with SaaS. SaaS customers have already decided that they're happy to relinquish some control in exchange for a simpler, easy to adopt offering. If integrating tools on the desktop can be difficult for customers, think how much harder it is for the average customer to integrate SaaS tools. 

Solutions match [how large SaaS vendors develop software]({% link _posts/2022-11-28-modern-saas-architecture.md %}). Its hard to throw lots of development teams at a tool to speed up progress. A tool is narrow and deep. In contrast, a solution is wide and usually shallow. You can give each team ownership of a feature with a corresponding micro-service and frontend. Want to throw more teams at it? Start work on some new features. 

A feature team on a solution targets a specific persona working in a specific industry. The user research team interview a set of potential customers to understand their processes. The user experience designer comes up with a user interface that digitizes those processes and the development team builds it. Then they iterate. What they built doesn't quite fit the needs of the next set of potential customers. They extend it and add complexity. No matter how hard they try, they can't seem to make everyone happy. 

# My Project

[Last time]({% link _posts/2022-11-28-modern-saas-architecture.md %}) I got as far as telling you that I intend to build a Serverless SaaS product that can be deployed into a customer's own AWS account. It should come as no surprise that I'm going to build a tool rather than a solution. But which tool? Well, I've already mentioned it above. No, not that one. 

I'm going to build a spreadsheet.

At this point you might very reasonably point out that Google and Microsoft have a bit of a head start when it comes to cloud based spreadsheets. Which is why [next time]({% link _posts/2023-01-09-spreadsheets-future-data-systems.md %}) I'll tell you what will make mine different.