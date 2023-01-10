---
title: >
  Organizational Anti-Patterns #4: Throwing it over the wall
---

[Throwing it over the wall](https://wordspy.com/index.php?word=throw-it-over-the-wall) is a common business idiom for "passing a project or problem to another person without consulting with them or coordinating the transfer". It's commonly considered to be a bad thing.

{% include organizational-anti-patterns-note.html %}

I'm going to focus on two examples of throwing it over the wall that I've lived through and that are particularly relevant for Software Development and SaaS in particular.

# Functional Organization

You're more likely to throw things over the wall where communication structures are already weak. It's less likely to happen with people you have a personal connection with and that you interact with on a daily basis. Where are communication structures weak? Between parts of the organization that are a long way apart in the org structure.

I've heard it said that there's no right or wrong org structure. That it depends on the current situation and [what you want to optimize for](https://hbr.org/1968/11/organizational-choice-product-vs-function). Do you want to optimize for common practices and knowledge sharing within each functional area with a [functional structure](https://www.indeed.com/career-advice/career-development/functional-structure)? Or do you want the increased autonomy and improved time to market of a [product-oriented structure](https://www.capgemini.com/no-no/insights/expert-perspectives/you-build-it-you-run-it-how-to-become-a-product-oriented-organization/)?

You also need to think about what communication is required between the different branches of the organization. What impact will it have if things are thrown over the wall between teams that rarely interact? For a product oriented organization there is little impact. Individual products can be successfully created and released. Any impact is related to areas of overlap and connectivity between products. However, those don't need ongoing tightly coupled communication to solve.

A functional organization, on the other hand, can end up in all sorts of trouble. The sales and marketing departments throw their insights and market analysis over the wall to the product management department. The product management department prepare a long and detailed product requirements document which they throw over the wall to the engineering department. The engineering department build ... something.

When I first joined Autodesk, the division I was part of was organized along functional lines. Navisworks was left alone as a product oriented island for a couple of years. Eventually we were deemed ready to be fully integrated. After a small reorg I ended up in the engineering department with a new boss. 

I was surprised by the number of customer visits I was asked to take part in. The engineering managers seemed to spend a lot of their time understanding customer needs and coming up with product requirements. I naively asked why we were doing this when there was an entire dedicated product management department. In fact, I had just read their annual product requirements document. Don't we already know what we need to do? 

"Oh, we don't pay any attention to that. It's better to talk to customers directly". 

When information is thrown over the wall to you, your instinctive reaction is not to trust it. If you don't really know the people its coming from, its easy to dismiss it out of hand. What a waste.

# The Old New Thing

I've written previously about how every hot new project eventually becomes the [Old New Thing]({% link _posts/2022-11-21-organizational-anti-pattern-old-new-thing.md %}). You're an ambitious up and coming leader. You don't want to be stuck nursing a zombie product. What can you do?

{% capture vp_url %}
{% link _posts/2022-10-31-organizational-anti-pattern-vp-moves.md %}
{% endcapture %}

The classic move is to wait for a [reorg]({{ vp_url | append: "#the-reorg" }}) to come along. Clearly, the Old New Thing doesn't fit in the new organization. It would make much more sense over there. If you do this one small thing for me, I'll fully support the rest of the reorg plans. 

So far, so normal. What's the problem if the  Old New Thing team get a new boss? 

You haven't fully understood the diabolic genius at work here. The Old New Thing project and code base are moving to the new organization. The team are staying here. After all, culturally they're a better fit here. And I have a hot new project they can work on ...

{% capture ont_url %}
{% link _posts/2022-11-21-organizational-anti-pattern-old-new-thing.md %}
{% endcapture %}

The entire project is thrown over the wall to a new team who have no chance at success. The code base is a mess and makes no sense. Every code base someone else wrote is a mess and makes no sense. Doubly so if it was thrown over the wall to you. Either the new team try to work with it and end up creating more bugs than they fix, or they try to [rewrite the whole thing]({{ ont_url | append: "#rewrite-and-reimagine" }}).

In the SaaS world the project is usually an entire microservice. Remember the agile DevOps mantra of ["You build it, you run it"](https://aws.amazon.com/blogs/enterprise-strategy/enterprise-devops-why-you-should-run-what-you-build/)? Surprisingly often, it turns out to be "You build it, you throw it over the wall".

You might think these are exceptional cases. I've seen organizations that have turned it into standard practice. You have a hot new project that needs to build a new service. You turn to your favorite development team which. They get something up and running quickly. Keeping it running turns out to be a bit of a drag for them. You have another hot new project and your favorite team is so good at getting things done. How do you get out of your dilemma?

Simple, you throw the now Old New Thing over the wall to another, less favored, team. One that's cheaper, perhaps based in India or China.

Unsurprisingly, this doesn't work out well. You have one team incentivized to quickly create unmaintainable services and other teams with no chance of running those services effectively. None of your teams have a sense of ownership or responsibility.
