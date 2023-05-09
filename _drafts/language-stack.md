---
title: Choosing a Language Stack
tags: cloud-architecture aws
---

First off, let's get our terms straight. What do I mean by [Language Stack](https://medium.com/omio-engineering/why-we-develop-and-use-language-stacks-not-languages-e83fd85c7f05)? Is that the same as a [Tech Stack](https://www.mongodb.com/basics/technology-stack), or is it more like a [Software Stack](https://www.sumologic.com/glossary/software-stack/)? Then again, what's the difference between a Tech Stack and a Software Stack?

## Full Stack

A stack is a handy metaphor for the way in which we build platforms and applications in layers, with each layer building on abstracted functionality exposed by the layer below and providing abstracted functionality for the layer above. A [full stack](https://www.mongodb.com/languages/full-stack-development) web application looks something like this.

{% include candid-image.html src="/assets/images/full-stack.svg" alt="Front End, Back End, Language Stack, Software Stack, Tech Stack" %}

You have front end clients that work with back end services. Each is implemented using a stack of technology starting with physical hardware in the base layers, possibly with abstractions of the hardware as VMs or Containers. 

On top of the hardware we have layers of general software such as databases and operating systems that we almost always run off the shelf. 

Finally, we get to our software. There will be some kind of hosting app that runs as a process on the operating system. We could write this ourselves but in most cases we'll use something off the shelf, like a web server in the backend or a web browser in the front end. The hosting app includes the runtime for the programming language we write our software in. We could write the whole thing ourselves, but in most cases we'll use common libraries and frameworks to make our life easier. Finally, at the top of the stack is the code we actually write in the programming language determined by the hosting app and frameworks we're using.

The way I think of this is that the Tech Stack is the whole thing (hardware included), the Software Stack is all the software layers and finally the Language Stack is the programming language dependent layers.

As I've [discussed previously]({% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}), when using a [truly serverless]({% link _posts/2022-12-05-serverless-or-not.md %}) back end, the only meaningful choices you have to make are what Language Stack to use. 

## My History with Language Stacks

## The Choice

* Project has thick client, likely to share code between front end / back end. Initial frontend target is browser.
* Typescript / NodeJS
    * Time to eat my own dog food
    * Should be good for quick prototyping and rapid evolution
    * Only NodeJS and Python are supported by both Lambda and Lambda@edge. 
    * I'm old school - like to fully understand each layer of a stack before using abstractions built on top. JS is native language for web development.
    * Want to experience that before considering some higher level cross-platform thing that compiles to JS. e.g. flutter, Xamarin, Kotlin.
    * I like static typing, typescript is the lowest impact way of adding types to JS

* Front end framework
    * Want something minimal. Client will be memory constrained, loading data incrementally and paging out, showing only a small window onto a vast grid. Want total control.
    * Seen too many bloated monstrosities built by teams using super abstract, high level frameworks without any idea of what's happening underneath.
    * 