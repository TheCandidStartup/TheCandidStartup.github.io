---
title: >
  Organizational Anti-Patterns #6: The 800lb Gorilla
tags: org-anti-patterns autodesk navisworks
---

What do you give an [800-pound gorilla](https://en.wikipedia.org/wiki/800-pound_gorilla)? Whatever it wants. 

Many organizations have an 800lb gorilla. A group that due to size, seniority or connections always seems to get what it wants. Doesn't seem fair, does it?

Startups are usually built around a single product. If the product is a success and the startup grows, there will come a time that the company wants to diversify. Maybe it goes on an acquisition spree or kicks off a load of skunkworks projects. Soon it has lots of products, but the original product is the 800lb gorilla. At Autodesk, for most of its existence, AutoCAD was the 800lb gorilla.

So, what's the anti-pattern here? Have you got something against gorillas? 

Actually the opposite. The anti-pattern is when you  *don't* give the gorilla what it wants.

## Standards

[*"Like it or not, the 800-pound gorilla usually sets the standard"*](https://www.merriam-webster.com/dictionary/800-pound%20gorilla).

There was a lot to do technically when Navisworks was acquired by Autodesk. We had to switch to using Autodesk licensing, rewrite our installer and integrate with a host of components. Every year we had to update to the latest versions. Usually multiple times as we iterated through early alphas, to betas and then final release candidates. 

Many of the components were dependent on each other and, because these were the days of desktop software written in C++, they were all dependent on the version of the C++ runtime library and compiler. All the components were developed by different teams in different parts of the company. Naturally, every team wanted to make its own choices about what version of the compiler to use and when they would release alpha, beta, and RC versions of their components.

Sounds like a recipe for chaos, right?

Here's what happened in practice. Every year, the AutoCAD team would announce what version of the C++ runtime and compiler they would be using. They published a schedule of when they would drop alpha, beta and RC versions of the components they produced and the same for AutoCAD itself. AutoCAD was the most important consumer of the common components that all products used, so they aligned themselves with the AutoCAD calendar and standards. Most other products used the AutoCAD DWG reader component, so they did the same. 

No fuss, no never ending arguments, maybe a little resentment, but like magic everyone ended up following a common standard. Sometimes a newly acquired product would try to do things their own way but invariably they would learn their lesson and the following year would give the gorilla what it wants.

## Chaos

[*"Let a hundred flowers bloom"*](https://en.wikipedia.org/wiki/Hundred_Flowers_Campaign)

In 2012, Autodesk's pivot to the cloud was well underway. In the construction space, Autodesk [acquired Vela](https://investors.autodesk.com/news-releases/news-release-details/autodesk-positioned-transform-construction-industry-through-vela) (which became the original BIM 360 Field) and was still digesting the previous year's [acquisition of Horizontal Systems](https://investors.autodesk.com/news-releases/news-release-details/autodesk-agrees-acquire-horizontal-systems) (which became BIM 360 Glue).

{% capture vp_url %}
{% link _posts/2022-10-31-organizational-anti-pattern-vp-moves.md %}
{% endcapture %}

Cloud fever was all the rage internally. In an attempt to kickstart the cloud revolution, a [VP Mandate]({{ vp_url | append: "#the-mandate" }}) had been issued. Paraphrased, it said that Autodesk was going to become a cloud company and anyone not working on the cloud wouldn't have much of a future. 

Naturally, everyone was scrambling to jump on the cloud bandwagon. Desktop products were clearly the [Old New Thing](({% link _posts/2022-11-21-organizational-anti-pattern-old-new-thing.md %})). Groups were racing to acquire cloud companies and bootstrap services. Nobody really knew how you should go about building and managing services. It also wasn't entirely clear who would use those services or how they would work together. 

This is the kind of situation where you really need an 800lb gorilla to set some standards and drive alignment. Unfortunately, Autodesk didn't have a cloud gorilla. AutoCAD was the Old New Thing and didn't have an obvious route to cloud leadership. The newly acquired cloud products were too small and fragmented. AWS was not yet the 800lb gorilla cloud provider that it is today, so the cloud products all handled infrastructure in different ways. They were built on different stacks where the only thing they had in common was that they were incompatible with all the existing technology embedded in the desktop products.

Roll forward a couple of years and I was giving a presentation, on the soon to be public Autodesk Forge Cloud APIs, to an internal audience of technical leaders. I'd been roped into doing it because I worked on the design of one of the APIs, which gave access to data in BIM 360. I knew almost nothing about the other APIs, which were all developed by different teams, each giving access to their own services. I decided to take on the persona of one of our customers and use each API's documentation to figure out what they did and how they could be used together. 

If you've been following along with this series, it should come as no surprise to find out that I didn't have much success. Every API used a different style, as if they'd been created by different companies. Some APIs were standalone while others required you to use a specific cloud product. Some used 2LO authentication, while others used 3LO. APIs that gave access to the same underlying data would use different terminology for the same thing. Even worse, they would often encode identifiers differently, leaving the customer to figure out how to transform values from one format to another when attempting to use the APIs together.

The short term outcome was a heroic effort to provide documentation and examples for the workflows that could be made to work. Longer term, we put a lot of effort into writing an API standard, countless hours trying to get everyone to agree on a common approach, years of evolving the first APIs to bring them into line. All for the want of an 800lb gorilla. 

What could we have done differently? If you're going to pivot into a whole new technology or market area, find yourself a gorilla to lead the way. If you're going down the acquisition route, do one really big acquisition rather than lots of little ones. Say "strategic" a lot. Spend so much money that you can't afford to fail. Buy someone with the expertise and experience you're missing. Congratulations, you've acquired an 800lb gorilla. Now do what it wants.

If you're building out the new capability internally, start with your existing 800lb gorilla and give them new responsibilities. You didn't really think that 30 years of desktop product development would be replaced by new cloud products overnight, did you? For Autodesk, a great place to start would have been figuring out how the existing desktop products could have been improved by cloud connectivity. Now its more natural for AutoCAD to throw it's weight around and set some standards.

## Resentment

[*"The Tyranny of Choice"*](https://bschwartz.domains.swarthmore.edu/Sci.Amer.pdf)

Is there already an 800lb gorilla in your life? Are you unhappy about it? Do you resent the way that your freedom and creativity is being stifled?

It's natural to feel some resentment. Why do they always get what they want? 

I thought the same way when I first joined Autodesk. Now I've come to appreciate the times when there was an 800lb gorilla in my life. Ironically, those things that people feel most strongly about, that we find hardest to align on, are usually those that matter least. It's not important which one we choose, just that we all choose the same one. Whether its API standards, or compiler version, which one we pick makes very little difference in the long term.

So, when the gorilla decides what it wants, be grateful that you've been saved from having to make a choice.