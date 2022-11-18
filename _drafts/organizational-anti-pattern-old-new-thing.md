---
title: >
  Organizational Anti-Patterns #2: The Old New Thing
---

At some point in your career all the stars will align. You're working on an exciting, groundbreaking new project. Even better everyone else in your organization thinks the same. They're falling over themselves to help out, remove blockers, get stuff done for you. The CEO calls out your project in the company all hands. It may just be the future of the organization.

{% include organizational-anti-patterns-note.html %}

Enjoy it. Make the most of it. It won't last. 

Maybe there was a reorg, an acquisition or a mandate that changed the environment. Maybe your project is taking a while to deliver results. Doesn't matter - for whatever reason the new hotness is here. And your project is now the *Old New Thing*. 

Becoming the Old New Thing is not an anti-pattern in and of itself. That's human nature. This is just the [Gartner Hype Cycle](https://en.wikipedia.org/wiki/Gartner_hype_cycle) playing out within your organization.

{% include candid-image.html src="/assets/images/Gartner_Hype_Cycle.svg" alt="Gartner Hype Cycle" attrib="Jeremykemp at English Wikipedia, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0), via Wikimedia Commons" %}

The anti-pattern is in how the organization reacts. What will prevent your project eventually reaching the *Plateau of Productivity* after it passes over the *Peak of Inflated Expectations*?

# Crash and Burn

If your project really is exciting and groundbreaking then the most likely outcome is that it will crash and burn well before reaching the *Trough of Disillusionment*. All those things that inflated expectations quickly go into reverse. Your project is now too risky, unlikely to work, a luxury that can be cut. Even more so if its an early stage project that doesn't have customers yet.

Many large companies exist on the back of their original, highly successful product. They often find it hard to create new successful products. This is one of the reasons why. They don't *need* to make your project work. It's easier not to make the commitment. Look, there's a new bandwagon to jump on that will be even better. 

# Zombie Product

The *Trough of Disillusionment* is where Zombie Products live. They limp along supporting a small number of customers but never really take off. No VP wants to put in the effort and investment needed to crawl up the *Slope of Enlightenment*. After all, there's a new shiny ball to chase after. No one even wants to talk about them. At the same time, its too much effort to kill them off. There's always at least one important customer that needs to be kept happy.

Working on a Zombie Product is a thankless task. Your small team (its always a small team) does its best to keep the product alive. People leave and are never replaced. The technology base ages. There's no budget to keep things up to date. 

Zombie Products are often the result of acquisitions that don't work out. When I joined Autodesk with the [Navisworks acquisition](https://investors.autodesk.com/news-releases/news-release-details/autodesk-completes-acquisition-navisworks) in 2007, I thought we were the only construction focused product that Autodesk had. In reality, another group within Autodesk had [acquired Constructware](https://investors.autodesk.com/news-releases/news-release-details/autodesk-completes-acquisition-demand-software-provider) a year earlier. Constructware was a great product. It was highly sticky. Once customers adopted it, it became central to their processes. It was a cloud product before Autodesk went all in on the cloud. Autodesk could have built a cloud construction business around Constructware.

Instead, by the time I joined, Constructware was already the Old New Thing. When the Navisworks team found out about it we were excited about integrating with it. Navisworks is a desktop single user collaboration tool. A cloud collaboration platform was a perfect fit. We were gently steered away. Nothing was explicitly said but everyone knew that Constructware was the Old New Thing and should be avoided.

How long can a Zombie Product survive? Constructware was finally shut down this year, fifteen years after becoming the Old New Thing.

# Competition

Competition is good, right? Well, not if you're the Old New Thing. If there's a fresh, new  project in the same or an overlapping space it's easy for people to see it as the natural successor to your presumably stale, failing project. 

The textbook example is when a VP makes a move and acquires another product. This happened to Constructware when [Autodesk acquired Vela](https://investors.autodesk.com/news-releases/news-release-details/autodesk-positioned-transform-construction-industry-through-vela) which then became BIM 360 Field. As usual there was only partial overlap so Vela couldn't replace Constructware. However, there was enough overlap to reinforce Constructware's position as the now very old new thing and confirm its status as a zombie product.

The other common play is for another group in the organization to develop an overlapping project (usually without knowing about your project or one of the other five similar projects). The new project gets the hype and the momentum. Once their VP becomes aware of the other projects they express sadness and regret at the pointless duplication and suggest that everyone else abandons their clearly inferior projects. 

# Rewrite and Reimagine

Your project has somehow made it through the *Trough of Disillusionment* and is slowly climbing the *Slope of Enlightenment*. There is still a chance to snatch defeat from the jaws of victory.

It's hard going. You have demanding customers. The code base is in a bit of a mess. The UX designers don't like some of the choices they made in the early stages that are now baked firmly into the product. Progress is slowing down. There are exciting new technologies that weren't available when you started out. There are fashionable new architectural patterns that all the cool kids are using. The engineers suggest that it might be time to rewrite the code. The UX designers are keen to reimagine how the product works. Everyone agrees that you will be able to do it better if you start over.

Do I need to convince you that rewriting from scratch is a terrible idea? Luckily, I don't have to. Go and read [Thinks you Should Never Do, Part 1](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/) by [Joel Spolsky](https://www.joelonsoftware.com/about-me/) and then come back. 

Reimagining the product when you rewrite it makes things worse. The designers may have come up with a new more intuitive way of doing things but it doesn't cover all the edge cases. You no longer have a replacement for the original product, you have an overlapping product. Rebuilding the product takes longer than you thought. You're forced to launch with only a subset of the original features. The new product only meets the needs of a few of your existing customers. They don't like that they have to retrain their users to do things a different way. Someone has the bright idea to find new customers unconstrained by the old ways of doing things. The new customers push for additional features that further diverge the new product from the old one. 

The end result is that the old product falls back into the *Trough of Disillusionment* to join the other zombie products. The new product starts over from the beginning of the hype cycle. 

Remember BIM 360 Field? It did well. Customers liked it. Autodesk bought and built complementary products. There was BIM 360 Glue, BIM 360 Plan and BIM 360 Docs. As you might expect they didn't work well with each other. Efforts were made to integrate. It was hard going. The developers thought the code base was a mess, all the cool kids were into micro-services rather than boring old monoliths. And so BIM 360 Next Gen was born.

Unsurprisingly, Next Gen Field didn't have all the features that Field Classic had. Similarly for Glue. They still don't. The classic products continue as zombies with customers waiting for feature parity before moving over to Next Gen. That feature parity well never come. [Autodesk acquired PlanGrid](https://adsknews.autodesk.com/pressrelease/autodesk-to-acquire-plangrid) and then rewrote and reimagined PlanGrid and BIM 360 Next Gen to create Autodesk Construction Cloud. Next Gen joins the other zombies. The classic customers are now waiting for ACC to achieve feature parity.  

What next? ACC will make it to the *Plateau of Productivity*, won't it? 

At Autodesk University this year, Autodesk announced Forma. Forma is the "industry cloud for architecture, engineering, construction, and operations". Will Forma be a rebranded and extended ACC? Or has ACC just become the Old New Thing? 



