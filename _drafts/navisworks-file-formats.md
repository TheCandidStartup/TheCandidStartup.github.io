---
title: Navisworks File Formats
tags: navisworks computer-graphics
---

Recently, I've become aware of just how many different CAD/BIM design review file formats are out there. Autodesk has [Navisworks](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/NavisWorks-JetStream-file-formats-NWC-NWF-NWD-and-NWP.html) and [SVF](https://aps.autodesk.com/blog/svfsvf2-survey), and before that [DWF](https://help.autodesk.com/view/ACD/2022/ENU/?guid=GUID-DFC086F4-E98C-4FF7-A55E-67FC35007DE5). Bentley has [iModels](https://www.bentley.com/software/imodels/). There are lots of smaller third parties with their own formats. I'm thinking of things like [dotbim](https://dotbim.net/), [VIM](https://github.com/vimaec/vim-format), [Speckle](https://speckle.systems/) and [Resolve](https://blog.resolvebim.com/resolves-new-bim-engine-for-construction-vr/). And now, there's [lots of noise](https://adsknews.autodesk.com/en-gb/news/openusd/) around [OpenUSD](https://openusd.org/release/index.html) as the new do everything format for large scale 3D models.

I thought it might be interesting to have a look at a few of these formats in more detail. What makes them suitable for design review? Why do we need special formats at all? What's wrong with the native formats used to create the data in the first place? Why aren't we all using the [OpenBIM](https://www.buildingsmart.org/about/openbim/openbim-definition/) family of vendor neutral formats?

I created the Navisworks file formats, so it seems as good a place as any to start.

## Design Goals

{% capture bc_url %}{% link _posts/2023-05-08-business-cards.md %}{% endcapture %}
Before diving into the details of the file format, it's worth understanding the design goals for Navisworks. The original design goal was simple. I was working as a research associate at the [Cambridge University Martin Centre]({{ bc_url | append: "#the-martin-centre-1991-1997" }}) back in the 90s. A couple of visiting architects had brought us a huge (for the time) 3D model, made for photorealistic rendering. We had an SGI workstation and they wanted to know if we could use the model for interactive walkthroughs. 

The model was clearly far too big. So, goal one was to find some way that you could interact with a model that was too big to render in real time. Once we solved that, our next challenge was to interact with models that were too big to fit in memory. At the tail end of the 32 bit operating system era, we had to deal with models that were too big to fit into the available [virtual address space](https://en.wikipedia.org/wiki/Virtual_address_space). 

{% capture ngp_url %}{% link _posts/2023-03-27-navisworks-graphics-pipeline.md %}{% endcapture %}
The solution I came up with, was to [break down]({{ ngp_url | append: "#prepare" }}) the model into small, self contained, renderable instances. Instances are rendered, and loaded, in [priority order]({{ ngp_url | append: "#cull" }}), most important objects first. Detail drops out while you interact with the model, then fills in when you stop interacting.

This immediately rules out using existing CAD formats or vendor neutral formats (not that they existed back then). I needed a format that stored self contained instances that could be loaded on demand and rendered in any order. 

The other design goal was to make something usable for design review workflows. Most graphics engines at the time were built for the workflow you'd use for a 3D game. Build content that looks great and gives acceptable performance on target hardware. Try it out and adjust the content until it works. The resulting interactive experience is the whole point of the exercise. 

In design review, the point of the exercise is getting the design right and eventually building whatever you’ve designed. The interactive experience is a tool to help improve the design. You can’t adjust the design to make the experience work. The design is changing all the time. There’s no time to tweak the model to get acceptable performance. The content is not built with the interactive experience in mind. 

Whatever we do to prepare the data has to be completely automatic, with no user intervention. We have to support all the different types of source CAD format that our users work with. We have to support a workflow where the source models are changing frequently. That means minimizing the turn around time to update to the latest models. We need to make sure that any additional metadata the user creates to support the design review process, still makes sense as the underlying models change.

## Three Navisworks File Formats

That's why Navisworks ended up with three separate file formats. As we'll see, all the formats are built from common elements, but each is optimized for a separate purpose. 

{% include candid-image.html src="/assets/images/file-formats/navis-file-format-workflow.svg" alt="Navisworks File Formats and the Design Review Workflow" %}

Navisworks was created as a single user desktop product. As such, workflows revolve around files. The overall project is represented by a set of design files. Anything beyond the most simple project will have more than one design file. Large projects typically have hundreds. The project is broken down into separate design files by discipline, the capacity limits of the design tools and the need for multiple designers to work independently. 

The first step in the workflow is to convert each design file into the optimized Navisworks format. The output is stored in an NWC file (NavisWorks Cache). For file formats that Navisworks can open directly, the conversion to NWC happens in the background. To the end user, it looks like they've opened the design files directly.

In order to perform whole project reviews, the design files need to be aggregated together. The end user opens a set of design files and Navisworks reads the corresponding NWC files (reconverting if they're out of date) and then merges the individual models into a single common model. References to the files that make up the project, together with any metadata created during the Navisworks session, are stored in an NWF file (NavisWorks Fileset). 

Any issues found during the design review session will ultimately need to be fixed by updating some or all of the design files. The user then reloads the NWF (or refreshes the Navisworks session). Navisworks uses the saved set of file references to reload the project, reconverting the updated design files and reusing the existing NWCs for design files that haven't changed. Any metadata stored in the NWF that references objects in the model is updated to match. 

The user may want to share the aggregated project model more widely. They can publish the model as a self contained NWD file (Navisworks Data) that contains the complete model and metadata. Combining into a single file makes the project more convenient to share and faster to load. The NWD file is a snapshot at a particular point in time. To update the model you have to go back to the NWF and publish a new NWD. 

Autodesk's cloud based construction applications provide a similar workflow. Initially, with [BIM 360 Glue](https://help.autodesk.com/view/BIM360/ENU/?guid=GUID-E0F4D156-F9B1-428D-B32E-C0BE0805C86F), the workflow was exactly the same, just with files stored in the cloud and the process automated. Now, with [Autodesk BIM Collaborate](https://construction.autodesk.co.uk/products/autodesk-bim-collaborate/), the workflow is similar but the data is managed in a more granular way.

## Serialization

Navisworks was written in, at the time cutting edge, now old school, object oriented C++. You can think of the state of an application as an arbitrary graph of objects in memory connected by references (C++ pointers). An arbitrary graph can include multiple references to the same object and cycles.

{% include candid-image.html src="/assets/images/file-formats/object-graph.svg" alt="Arbitrary graph includes multiple paths and cycles" %}

Navisworks uses a fairly standard one pass [serialization](https://isocpp.org/wiki/faq/serialization) algorithm. You start at the root and ask the object to serialize itself, passing in the output stream and a dictionary that maps objects to an incrementing integer id. Each object checks whether it already exists in the dictionary and if so writes out a reference to the corresponding id. Otherwise, it adds itself to the dictionary with the next available id, then writes out its type and contents, including asking any referenced objects to serialize themselves, thus recursing over the entire graph. 

Deserialization follows the same recursive pattern, passing in the input stream and dictionary. If the stream contains a reference to an object, return the corresponding object in the dictionary. Otherwise, read in the object type, create a default instance of that type and add it to to the dictionary with the next available id. Then ask the object to read its contents, including deserializing any referenced objects.

You may be wondering why I'm talking about the serialization algorithm rather than describing the file format spec. That's because there is no spec. The file format is whatever the Navisworks code writes out. 

There is some underlying structure. The input and output stream classes support versioning, binary or text output, compressed or uncompressed. We used a rigorous versioning policy where every change in the format, no matter how small, resulted in a new file version with code that could read and write both the new and previous versions. Navisworks can, in theory, still read files created by the first versions of Navisworks. 

## Model Representation

## Container

## Geometry

## Properties

## Metadata

## NWD

## NWC

## NWF
