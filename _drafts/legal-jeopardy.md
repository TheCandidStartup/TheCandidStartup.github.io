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

There's a vague list of things that they asset are not *public information*. There's a statement that these things are either *confidential* or *trade secrets*. And a final statement that I am under an obligation not to disclose *trade secrets*.

I had two takeaways. First, I need to understand what *public*, *confidential* and *trade secret* actually mean. Second, I only have to worry about things that are *trade secrets*.

## I am not a Lawyer

I'm not a lawyer, but my understanding is that I can use knowledge "in my head" after leaving Autodesk. 


## My Writing Process

It would be helpful if you can point out which sections of the post you have problems with. From your description I'm guessing it's Serialization, Geometry and  File Format Details. Is that right?

Serialization describes a standard object serialization algorithm. This is how pretty much everyone does serialization, see the linked wikipedia article. It doesn't say anything about specific objects. There's no trade secrets here. 

The Geometry section mentions the types of geometry stored in a Navisworks file but that's all. There's no detail about the geometry definitions or how they're serialized. The types of geometry supported by  Navisworks are public knowledge - it's in the product documentation. 

The File Format details section for NWC and NWD is very high level. I don't think it says any more than you could infer from public knowledge of what the product does. 

The NWF section does have quite a lot of detail on how object matching works and the properties used for matching. If you have a problem with this, I can remove the detailed lists and use a more general description.

## Autodesk Confidential Serialization
 
* We understand your point that the information about serialization is not a trade secret.
* The information is not explicitly shared publicly, which makes it confidential information.
* It doesn't have to be a trade secret to be confidential.
* We would still like it removed.

