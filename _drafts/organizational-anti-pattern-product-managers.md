---
title: >
  Organizational Anti-Patterns #7: Product Managers
tags: org-anti-patterns
---

Obviously, I'm not suggesting that the entire role of Product Manager is an anti-pattern. Somebody has to [identify customer needs, understand business objectives and articulate what success looks like](https://www.atlassian.com/agile/product-management/product-manager). The [Harvard Business Review says](https://hbr.org/2017/12/what-it-takes-to-become-a-great-product-manager) that great product managers need highly developed emotional intelligence to forge connections with internal and external stakeholders, and to sway them to their point of view. Not usually a core competency for more engineering focused roles.

However, with great emotional intelligence, comes great responsibility. Product Manager is such a critical role that any imbalance in the PM's skills or division of responsibilities with other roles can give rise to a wide selection of entertaining anti-patterns.

{% include organizational-anti-patterns-note.html %}

## The Non-technical Product Manager

"Hi! I'm Robin[^1], the new Product Manager. I expect we'll be working closely together. I'm not technical".

[^1]: Not their real name.

My heart sank. I worked for a technology company. Our product used cutting edge technology. We had a wide range of users, but our power users were amongst the most technical in their industry. Robin might as well have introduced themselves by saying, "Hi! I'm incompetent!"

### Yeah but No but Yeah

Non-technical PMs have no understanding of how things work under the hood. In turn, they have no idea of what might be hard or easy to implement. They have no conception of whether what they're proposing is brilliant or bonkers. When you work with a non-technical PM you'll spend a lot of time responding to proposals for product features that make no sense technically. It's critical that you learn how to respond correctly.

Typically, software architects and engineers are problem solvers. We like to find solutions. You will naturally find yourself responding, "Yes, we could do that but here's a long list of technical reasons why that isn't such a good idea".

"Great! Let's do it", says the PM.

You're left spluttering as they stride off, mission accomplished. Didn't they hear what you said? 

What they actually heard was, "Yes ... blah blah ... techno-babble ... blah blah blah".

The one stupid trick you need to learn is to respond, "No, we can't do that and here's a long list of technical reasons why we can't".

### Where's the button?

Non-technical PMs have no understanding of how things work under the hood. The corollary being that any work done under the hood seems pointless to them. Building out APIs, upgrading old components, addressing technical debt? All useless engineering gold plating. 

Be prepared for endless battles about prioritization of any work that doesn't result in some clear and obvious change to the UI. 

## Product Manager Drives Engineering

The Harvard Business Review [describes]((https://hbr.org/2017/12/what-it-takes-to-become-a-great-product-manager)) three ways that a PM can fit into a product development process. These basically boil down to who's in charge. Does the PM call the shots, or the engineering manager, or is there more of a partnership? The HBR prefers the partnership model, and having seen all three in action, I agree. 

How do you make a partnership model work? After all, somebody has to be in charge. One organization I worked for believed in partnership so strongly that all management roles were in triplicate. At each level there was a PM, an engineering manager and a UX manager. I think that's taking things too far. 

The model that I saw work best in practice was where engineering, PM and UX on a product all reported to a strong, impartial leader. It's important that the organization isn't too large, so that the leader has good visibility. And, of course, it only works with the right person in charge.

What can happen when you have a PM running the show?

### Trade Show Driven Development

{% include candid-image.html src="/assets/images/Project-triangle-en.svg" alt="The Project Management Triangle" %}

The [project management triangle](https://en.wikipedia.org/wiki/Project_management_triangle) describes the constraints of project management. The idea is that any change in one constraint (scope, cost, time) will need a corresponding change in the other constraints, otherwise quality will suffer. Given that no one has worked out how to accurately estimate the cost of a software project, you end up having to trade off scope against time. That's assuming we've all learnt the lesson of [The Mythical Man Month](https://en.wikipedia.org/wiki/The_Mythical_Man-Month) and aren't going to make the mistake of throwing extra resources at an overrunning project. Not that there's any realistic prospect of there being extra resources to spare.

This dilemma is often summarized as Quality - Scope - Time, pick two. With the assumption that one of your picks is always going to be quality.

Enter the ambitious Product Manager. They may say that quality is important, but it's one of those hard to quantify things that engineers keep going on about when they want to inflate their estimates. The PM has already promised customers that all the expected features will be included in the next release. The next release has to go out in time for the big trade show, or the company's annual marketing event, or before our competitor's next release[^2].

[^2]: Delete as applicable.

"This is a critical moment in our product's history. Our ability to deliver the agreed scope on time will make or break us. Isn't there something engineering can do to help us out?".

You're a problem solver. You suggest some ways that corners could be cut. You sternly point out that the product will be incurring technical debt that will have to be repaid. The PM gratefully agrees and promises that if we just get through this crunch, engineering will get the time they need to clean things up. 

I'm going to let you in on a secret. Actually, two secrets.
1. This is not a critical moment in the product's history.
2. Engineering will never get the time they need to clean things up. 

### Competitive Estimates

Once you've lived through a few cycles of trade show driven development one of two things happen.

{% capture ont_url %}
{% link _posts/2022-11-21-organizational-anti-pattern-old-new-thing.md %}
{% endcapture %}

You may lose all hope. Become beaten down. Go through the motions as development velocity inevitably slows down. Spend far too much time firefighting increasing numbers of bugs. Pin all your hopes on being able to [rewrite and reimagine]({{ ont_url | append: "#rewrite-and-reimagine" }}) the product when everyone becomes fed up with the lack of progress. Sit there and take it as the PMs declare that they are shocked, yes shocked, at the lack of quality. 

Or you can develop a backbone. Have some pride in your work. Decide that there are certain standards that are non-negotiable. After all, where does the power in software development really lie? Is the PM going to build the product themselves?

No, but they will try and find someone else to do it. If you work for a large multi-national you probably have engineering teams all round the world. Teams with different cultures, different standards, different levels of seniority, different levels of pay. If the PM tries hard enough, they'll find a team willing to cut corners, willing to be the heroes.

Even worse they may decide to get some [contractors](https://thedailywtf.com/articles/a-date-with-a-consultant) to do the work. Large companies often have "end of quarter" dollars burning a hole in a VP's pocket. Money that was budgeted but never used. Money that will be reclaimed by the finance department unless something is found to spend it on. 

You may not be able to stop this from happening. However, you can make sure that you're not responsible for the consequences. The PM wants another team to do the work? OK, they own that component from now on. They fix the bugs. They live with the technical debt.

The PM wants to use contractors for the new feature? Ring fence the code. Use a plugin model. Isolate the rest of the system. Problems with the new feature? The PM can find some more end of quarter dollars and get the contractors back in. 

## The CEO of the Product

Ben Horowitz, co-founder of the quintessential Silicon Valley venture capital company [Andreessen Horowitz](https://en.wikipedia.org/wiki/Andreessen_Horowitz), came up with the idea that a [good Product Manager is the CEO of the product](https://a16z.com/2012/06/15/good-product-managerbad-product-manager/). He has a lot to answer for.

The product manager as CEO of the product [sounds powerful and strategic](https://www.pragmaticinstitute.com/resources/articles/product/is-the-product-manager-ceo-of-the-product/). PMs that buy into the trope can end up believing that they have all the answers, that they should [act like an authoritarian CEO](https://www.mindtheproduct.com/product-managers-not-ceo-anything/), that their teams should do what they're told. 

### Making it happen

I'm reminded of the story of an organization that hired a PM with a chequered reputation. Their VP at the time was looking for a "change agent" and that's certainly what they got. 

The new PM behaved very like the CEO of an early stage startup. Ready to do whatever was needed to make their dream a reality. They had no mandate to build a new product. They had no development team. They did it anyway. 

Their expense account was legendary. They toured the world, visiting all the company offices. They told teams whatever they needed to hear, whatever was needed to sway them into working on the new product. Their top secret new product that would change the world. 

Needless to say, the result was chaos. Teams were mysteriously running behind with the features they were supposed to be working on. The platform group had changed their priorities and no one could understand why. 

### Pitch to win

Our rogue PM understood the power of a good story and a smoke and mirrors demo. When they were finally unmasked, they had their pitch ready. Our charismatic CEO PM had managed what no one else in the company could have done. They'd conceived of and built the perfect product for their target market. With the company's backing they would be ready to launch after the big annual marketing event. Just look at the demo. 

The VP bought it. The product was announced to huge fanfare at the marketing event. Strangely enough, the product didn't ship on time. Turns out there's a lot more work than you might think in turning a smoke and mirrors demo into a real product. 

One of the downsides of working for a large organization is that you are beholden to the rules of financial accounting. In particular, the mysteries of [Revenue Recognition](https://en.wikipedia.org/wiki/Revenue_recognition). If you publicly announce the release of a new product, customers may make buying decisions based on that knowledge. You can't recognize revenue until you've followed through on your commitment. The accountants don't like it when revenue can't be recognized. The accountants say you damn well better release your product within six months of the announcement. 

Everything else was put on hold. Everyone pitched in. The product was released exactly six months after the announcement. It was utter garbage. Features had been scoped back to the bone. It was riddled with bugs. 

It was also now too big to fail. The VP's credibility was on the line. There was no option but to double down. It took years of effort to win back credibility with their target market. Other products had to be starved of investment. 

To make matters worse, the new product had a lot of overlap with existing products both in their organization and other parts of the company. It wasn't long before they were [rewriting and reimaging](({{ ont_url | append: "#rewrite-and-reimagine" }})) the product portfolio to try and merge everything back together. More years of effort followed.

## The moral of this story ...

With great emotional intelligence, comes great responsibility. Product Manager is a critical role. Make sure you hire someone that wants to work in partneship with engineering and UX. Someone that understands there need to be boundaries. 

And it would be great if they had a basic technical understanding of what they're working on. 

## Footnotes
