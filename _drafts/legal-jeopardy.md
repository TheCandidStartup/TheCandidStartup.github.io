---
title: Legal Jeopardy
tags: blog
---

A few weeks ago I received a LinkedIn message from a former colleague at Autodesk. Nothing unusual about that. It's always a pleasure to reconnect with old acquaintances and catch up with their news. 

Not this time. The old acquaintance in question is part of the legal department at Autodesk. My post on [Navisworks File Formats](/_posts/2023-10-30-navisworks-file-formats.md) had come across legal's radar. The post "contains Autodesk confidential information, can you please remove it?".

## Good Intentions

For the avoidance of doubt, it's not my intention to harm Autodesk with anything I write here. I still own a substantial amount of Autodesk stock and, if nothing else, don't want to see the share price tank. 

I wrote the Navisworks file formats post to establish a baseline for the kinds of features needed in a BIM design review format. The plan is to follow up with other file formats and see how they compare. My intention was to talk only about high level principles which are either already public knowledge, easy enough to figure out, or common practice in the industry. 

I stayed clear, or so I thought, of any previously undisclosed details that give Navisworks a competitive advantage. For example, there's not enough in the post to enable you to read or write Navisworks files. 

My first step was to reply and ask which parts of the post they thought contained confidential information?

## Public Information, Confidential Information and Trade Secrets

It took me a few passes to make sense of their response. I've paraphrased it and broken it out into bullets in an attempt to understand it. 

* Describing how Navisworks serializes objects, the detailed file format overview and geometry definitions are not *public information*.
* Information like this is considered Autodesk *confidential* and/or *trade secret* and should not be shared outside of Autodesk.
* This obligation extends beyond your employment, for as long as the information is *trade secret*.

There's a vague list of things that they assert are not *public information*. There's a statement that these things are either *confidential* or *trade secrets*. And a final statement that I am under an obligation not to disclose *trade secrets*.

I had two takeaways. First, I need to understand what *public*, *confidential* and *trade secret* actually mean. Second, I only have to worry about things that are *trade secrets*.

## I Am Not A Lawyer

Before this adventure, I hadn't done any research into the legal implications of writing this blog. I had a vague understanding that I can use whatever knowledge is left "in my head", after leaving Autodesk. 

All I remember of my trade secrets training, is that information is only a trade secret if you (a) tell everyone in the company that it's a trade secret, (b) identify the subset of employees that need to know and (c) put systems in place to restrict access to those that need to know. 

These posts are written based on my somewhat unreliable memory, combined with whatever I can turn up with a bit of frantic googling. Nothing I worked on, as far as I'm aware, was ever declared to be a trade secret. So, I assumed I was in the clear.

What does the law actually say? I'm based in the UK and was employed by Autodesk UK. I assume UK law applies. I found plenty of UK law firms with websites that [explain](https://www.gannons.co.uk/insights/duty-confidentiality-employment/) [just](https://www.cooley.com/news/insight/2023/2023-07-05-what-employers-should-know-about-protecting-confidential-information-in-england) [enough](https://www.womblebonddickinson.com/uk/insights/articles-and-briefings/can-former-employees-take-your-confidential-information-their-new) that I can shoot myself in the foot.

The consensus seems to be
* There are three types of information: public, confidential and trade secret
* There is no duty of confidentiality for public information
* There is a clear ongoing duty of confidentiality for trade secrets
* In between there's a grey area up to interpretation by judges
    * It can be hard to tell what is "merely confidential" and what is a trade secret. 
    * In almost all cases, you're OK to use information which remains in your head and becomes part of your experience and skills.
    * In most cases, judges find against employees who take away confidential information in written or electronic form. 
    * Employers can attempt to better protect confidential information with explicit confidentiality clauses in employment contracts. This is difficult to get right. Courts may reject provisions that are overly broad. Conversely, it's hard to write specific clauses that cover everything.

I checked my employment contract and there are two provisions regarding confidential information. First, there's a very broad clause that says I can't disclose any confidential information for three years after leaving. No idea how enforceable that is. Second, I need to return all confidential information in my possession on leaving. I complied with that when I handed my laptop back.

## Further Clarification

As I might have expected, that didn't help much. Clear as mud. Time to ask for further clarification.

I wasn't sure what "serializing objects" refers to. I have a section that talks about serialization techniques in general and outlines the algorithm used by Navisworks. However, it doesn't give any details about how specific object types like geometry are serialized. The algorithm that Navisworks uses is pretty standard. There's no trade secrets or unique competitive advantage here.

I do list the types of geometry that Navisworks supports but that's public knowledge. It's in the product documentation.

Finally, I have no idea what the "detailed file format overview" refers to.

## Autodesk Confidential Serialization
 
We got there in the end. It turns out that there were five paragraphs that Autodesk legal had concerns about. Two were in the Serialization section, and the other three were in the Container section. 

They also restated their position, once again summarized in bullet point form.
* We understand your point that the information about serialization is not a trade secret.
* The information is not explicitly shared publicly, which makes it confidential information.
* It doesn't have to be a trade secret to be confidential.
* We would still like it removed.

What was it about those five paragraphs that legal didn't like?

## My Writing Process

A quick detour. When I start writing a post, I have an idea in mind for what I want to achieve. In this case it was defining a baseline for what a BIM design review format needs. 

For most posts I also have a couple of secondary objectives. I want to capture my thought process and reasoning. So when I come back in six months time, after chopping and changing between projects, I can get back up to speed quickly. If I'm talking about something historical, I want to document as much as possible, while I still remember it.

Once I get going, posts take on a life of their own, heading off in unexpected directions. I clarify what I'm thinking by writing it down, which sparks off a load of new ideas. I jot down something I half remember. That nudges long dormant synapses back to life, and I remember more. Rinse and repeat. 

Sometimes I remember some tantalizing fact but can't remember why it worked that way. Which irritates me enough that I try and figure it out again from scratch. 

The Serialization section was the result of that process. I looked at a discussion of serialization algorithms on the ISO C++ website. It seemed different from what I remember doing but I couldn't remember exactly what I did. This is all ancient history. The Navisworks serialization code was written ten years before Navisworks was acquired by Autodesk. So I worked it out again. I was so pleased with myself, that I had to write it down.

From Autodesk legal's point of view, I had provided a step by step description of something that was clearly an internal Navisworks implementation detail. That it was all ancient history, provides no competitive advantage to anyone, and could be replaced with any other standard serialization algorithm is irrelevant.

The Container section was similar. I knew that Navisworks didn't use ZIP as a container format. I remembered one of the differences but only half remembered why. So I wrote down what I remembered, which sparked some more memories and then I worked out the rest from there. 

To Autodesk legal, this looks like a description of something internal that provides Navisworks with a competitive advantage. I think I went into such detail because I was embarrassed that I didn't just use ZIP. I was trying to justify what I'd done. In the end, ZIP or any other standard container format would have worked just as well. 

## Conclusion

I do this for fun. I suspect that picking a fight with Autodesk legal won't be fun. So what did I do?

I rewrote the Serialization and Container sections. The Serialization section describes what serialization is and refers you to a discussion of serialization algorithms on the ISO C++ website. I removed the step by step description of Navisworks serialization. The details really don't matter for the point I'm trying to make in the post.

I removed the overview of how the Navisworks container format differs from ZIP. Again, the details don't matter and arguably distract from the overall point. There's a container format, it's functionally equivalent to a ZIP file. 

I made the change a couple of weeks ago and let my contact know. I haven't heard from them since. I guess that means we're good?

Now that I know what pushes Autodesk legal's buttons, I'll be more careful in future. I have a post on the Autodesk SVF format coming up. That should be a good test case.

