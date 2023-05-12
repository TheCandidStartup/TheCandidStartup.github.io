---
title: Choosing a Language Stack
tags: cloud-architecture aws cambridge navisworks autodesk
---

First off, let's get our terms straight. What do I mean by [Language Stack](https://medium.com/omio-engineering/why-we-develop-and-use-language-stacks-not-languages-e83fd85c7f05)? Is that the same as a [Tech Stack](https://www.mongodb.com/basics/technology-stack), or is it more like a [Software Stack](https://www.sumologic.com/glossary/software-stack/)? Then again, what's the difference between a Tech Stack and a Software Stack?

## Full Stack

A stack is a handy metaphor for the way in which we build platforms and applications in layers, with each layer building on abstracted functionality exposed by the layer below and providing abstracted functionality for the layer above. A [full stack](https://www.mongodb.com/languages/full-stack-development) web application looks something like this.

{% include candid-image.html src="/assets/images/full-stack.svg" alt="Front End, Back End, Language Stack, Software Stack, Tech Stack" %}

You have front end clients that work with back end services. Each is implemented using a stack of technology starting with physical hardware in the base layers, possibly with abstractions of the hardware as VMs or Containers. 

On top of the hardware we have layers of general software, such as databases and operating systems, that we almost always run off the shelf. 

Finally, we get to our software. There will be some kind of hosting app that runs as a process on the operating system. We could write this ourselves but in most cases we'll use something off the shelf, like a web server in the backend or a web browser in the front end. The hosting app includes the runtime for the programming language(s) we write our software in. We could write the whole thing ourselves, but in most cases we'll use common libraries and frameworks to make our life easier. Finally, at the top of the stack is the code we actually write in the programming language determined by the hosting app and frameworks we're using.

The way I think of this is that the Tech Stack is the whole thing (hardware included), the Software Stack is all the software layers and finally the Language Stack is the programming language dependent layers.

As I've [discussed previously]({% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}), when using a [truly serverless]({% link _posts/2022-12-05-serverless-or-not.md %}) back end, the only meaningful choices you have to make are what Language Stack to use. 

## My History with Language Stacks

I first started programming as a kid, in [Basic](https://en.wikipedia.org/wiki/BASIC) on a [ZX81](https://en.wikipedia.org/wiki/ZX81), soon followed by a [BBC Micro](https://en.wikipedia.org/wiki/BBC_Micro). I moved on to trying to write games for the BBC Micro in [6502](https://en.wikipedia.org/wiki/MOS_Technology_6502) assembly. The BBC micro was followed by an [Atari ST](https://en.wikipedia.org/wiki/Atari_ST). For some reason I don't remember, I had a [Modula-2](https://en.wikipedia.org/wiki/Modula-2) development environment for it, as well as trying to write a 3D graphics engine in [Motorola 68000](https://en.wikipedia.org/wiki/Motorola_68000) assembly.

{% capture bc_url %}
{% link _posts/2023-05-08-business-cards.md %}
{% endcapture %}

During my computer science degree at [Cambridge]({{ bc_url | append: "#cambridge-university-1985-1991" }}) I was introduced to a weird and wonderful array of languages. In some cases languages that the lecturer or their predecessor had created. I remember attending a lecture by the [man who invented the subroutine](https://en.wikipedia.org/wiki/David_Wheeler_(computer_scientist)). I was briefly exposed to [ML](https://en.wikipedia.org/wiki/ML_(programming_language)), [Scheme](https://en.wikipedia.org/wiki/Scheme_(programming_language)), [BCPL](https://en.wikipedia.org/wiki/BCPL), [Fortran](https://en.wikipedia.org/wiki/Fortran), [Prolog](https://en.wikipedia.org/wiki/Prolog) and [C](https://en.wikipedia.org/wiki/C_(programming_language)).

My first encounter with the real world was a summer vacation job writing compression routines for [IBM System 360](https://en.wikipedia.org/wiki/IBM_System/360) mainframes in [IBM Basic Assembly Language](https://en.wikipedia.org/wiki/IBM_Basic_Assembly_Language_and_successors). Throughout my postgraduate work in computer graphics I used [C](https://en.wikipedia.org/wiki/C_(programming_language)). 

When I moved to the [Martin Centre]({{ bc_url | append: "#the-martin-centre-1991-1997" }}), I started using the newly fashionable [C++](https://en.wikipedia.org/wiki/C%2B%2B). During one of my early projects, I added support for a high level scripting language to an interactive solid modeller that I'd developed. At the time there were two open source scripting languages suitable for embedding into a C++ application: [TCL](https://en.wikipedia.org/wiki/Tcl) and [Python](https://en.wikipedia.org/wiki/Python_(programming_language)). 

After careful consideration, I decided that TCL was the clear winner. Python's weird significant indentation syntax would never catch on. At the time of writing, 20 years later, Python is the world's [most popular language](https://www.tiobe.com/tiobe-index/). TCL is ... not. 

[Navisworks]({% link _topics/navisworks.md %}) was originally built entirely in C++ using the [MFC](https://en.wikipedia.org/wiki/Microsoft_Foundation_Class_Library) UI framework. Later on, we exposed the Navisworks core to [Microsoft .Net](https://en.wikipedia.org/wiki/.NET_Framework) using [C++/CLI](https://en.wikipedia.org/wiki/C%2B%2B/CLI) and implemented newer application features using [C#](https://en.wikipedia.org/wiki/C_Sharp_(programming_language)), first with the [WinForms](https://en.wikipedia.org/wiki/Windows_Forms) framework and then later with [WPF](https://en.wikipedia.org/wiki/Windows_Presentation_Foundation). 

## Language Stacks for the Cloud

I first got involved with language stacks for the cloud when Autodesk acquired Horizontal Glue (rebranded as BIM 360 Glue) and Vela (rebranded as BIM 360 Field). Glue was built on a .Net stack while Field used a Ruby on Rails stack. Rails was very much the exciting new technology that all the cool kids were using. The VP that ended up running the BIM 360 group was part of the Vela acquisition, so naturally there was a drive to standardize on Rails. Meanwhile the rest of Autodesk was gravitating around a [JVM](https://en.wikipedia.org/wiki/Java_virtual_machine) stack (mostly [Java](https://en.wikipedia.org/wiki/Java_(programming_language)) but with some teams using cooler JVM languages like [Scala](https://en.wikipedia.org/wiki/Scala_(programming_language))). Other acquisitions, reorgs and skunkworks projects added [Python](https://en.wikipedia.org/wiki/Python_(programming_language)) and [NodeJS](https://nodejs.org/en/about) to the mix.

As BIM 360 Chief Architect, I was asked to come up with one or two recommended stacks to consolidate future development around. I decided that two stacks was the minimum number we could get away with. 

First, .Net. A statically typed, high performance, do anything, swiss army knife of a stack. All our desktop technology was either written directly in .Net or in C++ exposed to .Net. Supporting .Net as a cloud stack would make it easy to repurpose existing technology and development teams for use in the cloud. It was also a great fallback for anything that couldn't be implemented using our second stack. The downside is that development with .Net can be slow. Complex tooling, verbose code, heavyweight runtime, multiple choices to make at every step. 

The second stack was NodeJS. A cloud native, dynamically typed, low ceremony, fast development stack. I could have gone for any of Rails, Python or NodeJS. All were already in use, all addressed the same niche. The clear differentiator for me is that NodeJS uses an asynchronous IO, event-driven programming model from the ground up. Idiomatic NodeJS code scales surprisingly well without additional effort. A simple NodeJS server can handle many thousands of simultaneous requests. Using NodeJS also makes it easy to share code between front end and back end. 

In contrast, Rails and Python both come from a single threaded, synchronous blocking IO heritage. Idiomatic Rails and Python code can handle one request at a time. More recent releases have added support for multi-threading and asynchronous IO but it's off the easy path. It takes care and effort to get decent performance. It's also surprisingly easy to fall off the fast path. Are you sure that there's no blocking IO calls in any of the third party components you use?

## The Choice

The [project]({% link _topics/spreadsheets.md %}) I'm working on will have a serverless backend with a thick front end client. The initial front end target is a web browser. It's highly likely that I'll want to share code between the front end and back end. 

There's only me working on this. I expect I will be iterating rapidly with multiple prototypes, so I want a stack focused on rapid development. 

I recommended NodeJS as the BIM 360 preferred dynamic stack. However, I've never written a line of JavaScript that made it into production. By the time I became Chief Architect, I had little time to write code myself. The little time I had was spent where it would be most productive, in the Navisworks code base. It's high time to eat my own dog food and follow my recommendation. 

I'm old school. I like to fully understand each layer of a stack before using abstractions built on top. JavaScript is the native language for web development. I want to experience that directly before considering some higher level cross-platform thing that compiles down to JavaScript (like [Flutter](https://flutter.dev/) or [Kotlin](https://kotlinlang.org/)).

I do want some additional control over the potential chaos, so I'll be using [TypeScript](https://www.typescriptlang.org/) rather than vanilla JavaScript. After 30 years writing in C++ and C#, I've come to like and depend on static typing. TypeScript is the lowest impact way of adding types to JavaScript. TypeScript still looks and feels like JavaScript, with types added as optional annotations.

Of course, choosing NodeJS/TypeScript is just the starting point. There's a huge selection of frameworks available for both front end and back end. That discussion will have to wait for another day.
