---
title: Autodesk Viewer SVF File Format
tags: autodesk navisworks computer-graphics
---

SVF is the native format for the [Autodesk Viewer](https://viewer.autodesk.com/). As well as the standalone web app, the viewer is embedded in other Autodesk web apps like [Construction Cloud](https://construction.autodesk.co.uk/), desktop products with components that use web technology like [Fusion](https://www.autodesk.co.uk/products/fusion-360/overview), and available as an [SDK](https://aps.autodesk.com/viewer-sdk) for third parties to integrate into their web apps.

{% include candid-image.html src="/assets/images/frontend/autodesk-viewer.png" alt="Autodesk Viewer" %}

## History

SVF is a format designed by committee. It was born when Autodesk made another of its repeated attempts to rationalize the number of different viewers in the company. 

The focus this time was on web viewers. It was a couple of years after Autodesk's pivot to the cloud. Many of the early cloud applications were essentially desktop products repurposed as frontend clients for some cloud hosted features. Product Management were feeling the pressure from startup competitors that boasted of their web native, zero install clients. 

{% capture nw_url %}{% link _posts/2023-10-30-navisworks-file-formats.md %}{% endcapture %}
There were three contenders for the crown. The official champion was a viewer based on the [acquisition](https://venturebeat.com/games/autodesk-buys-wild-pockets-game-design-platform-exclusive/) of the Wild Pockets game design platform. Their viewer had a couple of significant challenges. First, it had been build with a [games mindset]({{ nw_url | append: "#design-goals" }}) which made it hard to adapt to viewing large design files. Second, it was written in C++ and used tools like [emscripten](https://emscripten.org/) to compile to JavaScript. Performance and memory usage was a black box, making it hard to scale to larger models.

Next into the ring was [Navisworks]({% link _topics/navisworks.md %}). Navisworks provided the "web" viewer for [BIM 360 Glue](https://help.autodesk.com/view/BIM360/ENU/?guid=GUID-E0F4D156-F9B1-428D-B32E-C0BE0805C86F). The Navisworks viewer was the core of the Navisworks product, compiled as a browser plugin. At the time, all the major browsers supported native code plugins, either as an [ActiveX control](https://en.wikipedia.org/wiki/ActiveX) for Internet Explorer, or a [Netscape plugin](https://en.wikipedia.org/wiki/NPAPI) for Chrome and Firefox. 

The Navisworks viewer handled large models well, but had other problems. Navisworks was a Windows only product, so the Navisworks viewer browser plugin was only available for Windows. The plugin needed to be installed on each end user's machine and browsers were making the process increasingly complex and temperamental for security reasons. The writing was on the wall for native code plugins and most browsers dropped support when [HTML5](https://en.wikipedia.org/wiki/HTML5) adoption became widespread.

The third contender was the [InfraWorks](https://www.autodesk.co.uk/products/infraworks-family/overview) team. InfraWorks was another desktop application. However, the team had taken the radical approach of building a JavaScript web viewer from scratch, rather than trying to reuse their existing desktop implementation. At the time, it seemed like heresy. Throw away your mature, battle tested code base, and try to reproduce the functionality in JavaScript?

And yet, the viewer worked, for big models too. It only supported InfraWorks models, but it clearly had a lot of promise. It was directly written in JavaScript, so the team were able to optimize directly for performance and memory usage in the JavaScript runtime environment.

## The Committee

Key members from each team formed a committee to decide the path forward. I represented Navisworks. We all felt that the emscripten like approaches were a dead end. The tooling wasn't mature enough and we had no idea when, if ever, it would be viable. We would use the InfraWorks JavaScript viewer as a starting point. However, we needed a more general file format.

Navisworks was the obvious starting point. It was a neutral file format, with existing converters from every significant CAD file format. However, porting the existing parsing code to JavaScript seemed like a non-starter to me. There was [no spec]({{ nw_url | append: "#serialization" }}) and the code had all the warts you would expect from ten years of evolution with backwards compatibility. 

There was also the problem that Navisworks was an all-in-one format. That might seem like it should be an advantage, but it didn't fit the way browsers worked. To get good performance from a web viewer for large models, you need to cache the model locally. As well as helping speed things up when you reload the same model, it's critical if you need to page parts of the model in and out of memory. At the time, JavaScript had very limited access to local storage. The only practical way of caching data locally, was to let the browser do it. 

The Navisworks format is designed so that you can load parts of the model on demand. You can do the same thing from JavaScript in a browser, by making [range GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests) requests for parts of a file stored on a server. The Navisworks web plugin already worked this way but implemented its own on disk caching. The problem is that the browsers would only cache complete requests. Any range request would work but would not be cached. The model needed to be broken into separate physical parts that could be retrieved using normal GET requests.

We decided that we needed a new format based on the Navisworks [model representation]({{ nw_url | append: "#model-representation" }}), with all the legacy cruft removed, that could be naturally broken up into separate parts.

## The Spec

The first job was to come up with a formal spec. There would be multiple teams working on reading and writing SVF in at least two different languages (C++ and JavaScript). Using "the code" as the spec wouldn't work.

I was a co-author of the final spec. It was a pretty straight forward transliteration of the Navisworks file structure. It covered the model representation, geometry and viewing related meta-data. The [object property representation]({{ nw_url | append: "#properties" }}) in Navisworks had always been something of a compromise, so we reworked it significantly for SVF. 

For the BIM 360 Glue backend we had implemented a system where properties were extracted from Navisworks files and stored in [SQLite](https://www.sqlite.org/index.html) database files, one per model. The files were easy to manage, efficient to query and the SQLite engine is built to page data in and out of memory as needed. SQLite is widely used. Most browsers implement their local storage databases using SQLite. 

SVF is, unfortunately, an Autodesk proprietary format. AFAIK the spec has never been made public. I suspect no one in Autodesk has looked at it in years. As we'll see later on, significant parts of what is now considered to be SVF, were added organically. The original spec helped to bootstrap the ecosystem, but after that SVF ended up being defined by what the code in the Autodesk Viewer would read. 

## Model Derivative Service

## SVF Format

### Model Derivative Manifest

### SVF container

### Serialization

### Viewing Metadata

### Model Representation

### Geometry Pack Files

### Object Properties

## SVF2 Format

