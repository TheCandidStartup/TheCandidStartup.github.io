---
title: >
  Organizational Anti-Patterns #1: VP Moves
tags: org-anti-patterns aws
---

You work in a large organization. The kind that has VPs and SVPs and lots of C-level types. I'm going to use "VP" as short hand for all these leaders at the top of an organization. What do you want from the VPs? Ideally, they provide a consistent sense of direction with a clear strategy. They model the culture of the organization and provide a sense of belonging. They ensure that all the parts of the organization are aligned so that the overall organization is more than just the sum of its parts. 

{% include organizational-anti-patterns-note.html %}

The higher up an organization you go, the less direct influence you have on what happens at the coal face. At the same time, a stray comment can have all sorts of unintended consequences. You need to have a vision and the ability to inspire others to make that vision a reality. It's hard work reinforcing the message and the culture, making considered course corrections, day by day over many years.

What happens when you want to make a big change? At the VP level there's not many levers you can pull to significantly change the direction of the organization. At this point people usually pull out the supertanker analogy - you need a really large input to get it to change direction. You need a *VP Move*. If you haven't come across this phrase before, you use it like this:
* "I think X is going to make another VP move"
* "Everything is finally running smoothly. Must be time for another VP move".
* "That was totally a VP move".

Occasionally an organization needs a VP Move. Maybe once every five years. The problem is that making moves is addictive. You made something big happen! Its hard to go back to the day to day hard work of keeping the organization ticking. Let's make another move. Unfortunately, the more moves you make, the less impact they have. Organizations develop an immune system to resist the chaos of constant change. Lots of other anti-patterns develop as a response to excessive use of VP moves. 

In my experience there are three main VP Moves. Are you ready to choose your own adventure? Do you ...
1. [Make a big acquisition](#the-acquisition)
2. [Have a reorg](#the-reorg)
3. [Issue a mandate](#the-mandate)

# The Acquisition

Nothing gets the blood pumping like a big acquisition. Hundreds of millions (maybe billions) of dollars at stake. One swoop and you resolve that nagging hole in your product portfolio, or your technology base or your employee skill set. Whatever it is, you can fix it with an acquisition. Pick the right target and you can reduce the competition too. 

Of course an acquisition is hugely disruptive. There's a new organization for the Borg to absorb. There's always complex areas of overlap in product, technology, people, even office space. It takes time and care to integrate an acquisition so that it becomes a cohesive part of the mother ship. Push too hard and you may kill the golden goose. Give them too much slack and you end up with fragmentation and an ongoing them and us situation.

Acquisitions are legally sensitive. A need to know situation restricted to the small team working on it. The logic of an acquisition doesn't get properly stress tested until it's too late and the announcement is made. That announcement is a massive shock for the rest of the organization. Suddenly fierce competitors become your new team mates. The acquisition team can't possibly understand the full implications of what's to come. Often they don't seem to have thought about integration at all. If your organization has a dedicated M&A team they're already off hunting the next big prize. 

What does it look like when an organization tries to solve all their problems with acquisitions? A bewildering product portfolio, with big overlaps in functionality, none of which works together. A fragmented culture where each group that came in with an acquisition does things their own way. A list of failed acquisitions that no one likes to talk about: the game changing product starved of investment that gets killed off a few years later, the abandoned technology that no one could manage to integrate into the existing products, the [*acqui-hire*](https://en.wikipedia.org/wiki/Acqui-hiring) where all the acquired employees left within six months.

# The Reorg

In contrast to acquisitions, a reorg is the low risk way to make a move. Ship going down? Let's rearrange the deck chairs. 

Now, as a full believer in [Conway's law](https://en.wikipedia.org/wiki/Conway%27s_law), I should be in favor of reorgs. Changing the org structure to encourage your desired software architecture is known as the [*Inverse Conway Maneuver*](https://martinfowler.com/bliki/ConwaysLaw.html#footnote-inv). I've seen this work in practice. We had two teams working on very similar functionality within different products (why? fallout from an acquisition). The teams were in separate parts of the organization. After meeting and discussing the situation in depth they were in full agreement that both projects needed to continue separately. It made no technical sense to try and merge them. A couple of months later there was a reorg and the two teams were merged. Almost overnight they decided that maintaining both projects independently was a waste of resources and they needed to be combined.

This is not how a VP does a reorg. The Inverse Conway Maneuver is a carefully targeted micro level reorg far below VP level. A VP level reorg generally involves moving responsibility for big chunks of the organization from one member of the VP's staff to another. There is always an intent to make a positive change in the way the organization operates. However, this is often compromised by the need to keep every member of VP staff happy. I've seen some really contrived explanations for parts of reorgs which made no logical sense. The initial quake is followed by aftershocks as the reorg propagates down the organizational hierarchy. The further down you go the more the original intent becomes diluted, with increasing focus on keeping all the managers happy with their slice of the pie. 

Reorgs can work if they're infrequent and time is taken to follow up, see what isn't working and adjust as needed. You know that reorgs are happening too often if you never reach the point where the organization seems stable. If reorgs happen too often they end up having no effect on the lower levels of the organization. Nobody bothers to change the way they work or who they work with because they know another reorg will be along in a few months, making any change in behavior pointless.

# The Mandate

Time to lay down the law. This is the way it's going to be. There will be no exceptions. You will do as I command. I have issued a *Mandate*.

The best example of a big mandate that paid off is Jeff Bezos's infamous [API mandate](https://konghq.com/blog/api-mandate) that eventually resulted in the creation of AWS. The legend around it grew in part because its existence was revealed when an ex-Amazon employee then at Google accidentally publicly posted an [internal memo](https://gist.github.com/chitchcock/1281611) describing it. Paraphrased, it says 
1. All data and functionality MUST be exposed through APIs. All communication between teams is via those APIs. No back doors. No exceptions.
2. All APIs MUST be designed so that they can be exposed to external developers. No exceptions.
3. Anyone who doesn't do this WILL be fired.

What gets less press is some of the color in the original memo that describes what it took to implement. 
* "*Bezos assigned a couple of Chief Bulldogs to oversee the effort*"
* "*Over the next couple of years, Amazon transformed internally into a service-oriented architecture*"
* "*There are dozens, maybe hundreds of individual learnings like these that Amazon had to discover organically*"
* "*This effort was still underway when I left to join Google*" (three years later) 

Following through on a mandate takes serious effort and commitment. What happens if your VP throws mandates around without the required rigour? People start ignoring them. Obviously, you make all the right noises, make it look like you're doing something, then stall until the eye of Sauron has moved on and forgotten about whatever it was. In the worst case you're landed with a VP that is constantly chasing one shiny ball after another, throwing out mandates that strangely never achieve anything apart from churn and confusion.
