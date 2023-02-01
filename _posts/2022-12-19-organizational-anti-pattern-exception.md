---
title: >
  Organizational Anti-Patterns #3: Exceptions
tags: org-anti-patterns autodesk
---

There's a [VP move]({% link _posts/2022-10-31-organizational-anti-pattern-vp-moves.md %}) under way. A company wide mandate has been issued. Big changes are coming. What's your immediate reaction? Are you excited? Ready for the challenge? Or is your first thought to wonder how you can get an exception?

{% include organizational-anti-patterns-note.html %}

Exceptions are a common antibody against excessive use of VP mandates. The usual form of exception is to defer something with a deadline to a later date. Perhaps you have a customer commitment that you need to meet first, or maybe most of the team are out on vacation at the same time. Where's the harm in a short, pragmatic extension of the deadline?

No harm at all, perfectly reasonable. Unfortunately,  when the new deadline comes around there's another perfectly valid reason why you need to extend again. Somehow, whatever it was keeps being put off until the VP responsible has got bored and moved onto something else. 

My first encounter with exceptions came early in my career. I had just joined a new organization and was finding my feet. A mandate came down from on high and keen to show willing I jumped on it. The mandate involved integration of a new common component. It wasn't easy. The documentation wasn't great and it was slow going getting the thing to work. Was nobody else having similar problems? I was based in a small satellite office and didn't know anyone else working on the same thing. I put it down to my inexperience in the new org. 

A few months later I traveled to my first internal technical meeting with architects from other parts of the organization. I asked the people there about their experience of integrating the component. They all had pretty much the same answer. "That thing? Oh, we got an exception". 

To make matters worse, the new component was soon [the Old New Thing]({% link _posts/2022-11-21-organizational-anti-pattern-old-new-thing.md %}). And I was left facing a new mandate to replace the work it seemed that only I had bothered to do. 

This kind of thing is corrosive for the culture of your organization. I felt like a fool for going along with the mandate. Eventually you end up in a world where nothing can be taken at face value. You have to rely on scuttlebutt and reading the political weather to try and figure out which initiatives are really going to happen. Over time you realize the only sane strategy is to become a [Fast Follower](https://hbr.org/2012/06/first-mover-or-fast-follower). Wait for some other sucker to make the first move (after all, it's easy enough to get an exception) and see if there's any wider momentum before committing. Of course, if everyone is a fast follower, nothing ever happens. 

In a full blown exception culture, everyone's first reaction to any mandate is "How do I get an exception?". By this point your organization has probably put in place some processes to try and slow down and manage the flood of exceptions. What could be more soul destroying than going through the form filling exercise of logging and extending exceptions for things that everyone knows will never happen? VP effectiveness is now a function of how good they are at getting exceptions for mandates sponsored by other VPs compared with how well they resist other VPs getting exceptions to their mandates.

Once asking for exceptions is normalized, it becomes the knee jerk reaction to any ask. Even things that should be clear to everyone really need to be done. More than once I've had to convince a product manager that getting an exception is not a reasonable response to a critical security vulnerability. Eventually the expectation around exceptions is so ingrained that you stop bothering with the paperwork. Just ignore any mandate you don't like. 

It should be no surprise that Autodesk had something of an exception culture back in the day. There's a story from that time (possibly apocryphal) that Jeff Kowalski, then CTO, asked for some advice on a visit to Apple. "What would happen at Apple if someone ignored a mandate to integrate a common component?", he asked his counterpart. They looked at him with surprise and eventually replied, "We'd fire them, of course". Which in turn surprised Jeff and got him thinking. What would you have to do to get fired at Autodesk?

*Wide spread use of exceptions leads to a lack of consequences for ignoring mandates or violating company policies.*

If your organization is in this mess, how do you get out? Nobody believes you will follow through on any mandate you make. Everyone can see that there are no bad consequences for ignoring a mandate. 

First, you need to reduce the number of mandates being thrown around. Pick something that should be a no-brainer. Something that everyone can agree makes sense in principle. Something that you are prepared to follow up on repeatedly and not drop six months down the line. Make it clear that this **one** thing is your priority, that things are going to be different around here and that there will be no exceptions. 

{% capture mandate_url %}
{% link _posts/2022-10-31-organizational-anti-pattern-vp-moves.md %}
{% endcapture %}

I've [mentioned]({{ mandate_url | append: "#the-mandate" }}) the Jeff Bezos [API Mandate](https://gist.github.com/chitchcock/1281611) before. Looking at it again, I'm struck by how much time it spends anticipating how people will try to work around it, making it clear there will be no exceptions and spelling out the consequences for non-compliance.

Hopefully you've made your first mandate stick. Now rinse and repeat. Over time your mandates can become more contentious, maybe you can have more than one active at a time. Just make sure you always follow through, that there are consequences. And, of course, no exceptions. 