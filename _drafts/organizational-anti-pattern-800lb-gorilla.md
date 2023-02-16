---
title: >
  Organizational Anti-Patterns #6: The 800lb Gorilla
tags: org-anti-patterns autodesk navisworks
---

What do you give an [800-pound gorilla](https://en.wikipedia.org/wiki/800-pound_gorilla)? Whatever it wants. 

Many organizations have an 800lb gorilla. A group that due to size, seniority or connections always seems to get what it wants. Doesn't seem fair, does it?

Startups are usually built around a single product. If the product is a success and the startup grows, there will come a time that the company wants to diversify. Maybe it goes on an acquisition spree or kicks off a load of skunkworks projects. Soon it has lots of products, but the original product is the 800lb gorilla. At Autodesk, for most of its existence, AutoCAD was the 800lb gorilla.

So what's the anti-pattern here? Have you got something against gorillas? 

Actually the opposite. The anti-pattern is when you  *don't* give the gorilla what it wants.

## Standards

[*"Like it or not, the 800-pound gorilla usually sets the standard"*](https://www.merriam-webster.com/dictionary/800-pound%20gorilla).

There was a lot to do technically when Navisworks was acquired by Autodesk. We had to switch to using Autodesk licensing, rewrite our installer and integrate with a host of components. Every year we had to update to the latest versions. Usually multiple times as we iterated through early alphas, to betas and then final release candidates. 

Many of the components were dependent on each other and, because these were the days of desktop software written in C++, they were all dependent on the version of the C++ runtime library and compiler. All the components were developed by different teams in different parts of the company. Naturally, every team wanted to make its own choices about what version of the compiler to use and when they would release alpha, beta, and RC versions of their components.

Sounds like a recipe for chaos, right?

## Jealousy



## The Old New Thing

Where you really need to watch out, is when the 800lb gorilla becomes the [Old New Thing]({% link _posts/2022-11-21-organizational-anti-pattern-old-new-thing.md %}).