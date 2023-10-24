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

Deserialization follows the same recursive pattern, passing in the input stream and a dictionary. If the stream contains a reference to an object, return the corresponding object in the dictionary. Otherwise, read in the object type, create a default instance of that type and add it to to the dictionary with the next available id. Then ask the object to read its contents, including deserializing any referenced objects.

You may be wondering why I'm talking about the serialization algorithm rather than describing the file format spec. That's because there is no spec. The file format is whatever the Navisworks code writes out. 

There is some underlying structure. The input and output stream classes support versioning, binary or text output, compressed (using [zlib](https://www.zlib.net/)) or uncompressed. We used a rigorous versioning policy where every change in the format, no matter how small, resulted in a new file version with code that could read and write both the new and previous versions. Navisworks can, in theory, still read files created by the first versions of Navisworks. 

## Model Representation

The heart of Navisworks is its model representation. It consists of three linked data structures: the logical scene graph, instance tree and spatial graph. 

{% include candid-image.html src="/assets/images/file-formats/navis-model-representation.svg" alt="Navisworks Model Representation" %}

The scene graph is a logical representation of the source design model. It's meant to match the user's mental model of their design file. An AutoCAD user thinks in terms of layers, groups, inserts, blocks and primitives. A Revit user thinks in terms of categories, systems, families, components, types, instances and elements. 

The Navisworks scene graph is a [DAG (Directed Acyclic Graph)](https://en.wikipedia.org/wiki/Directed_acyclic_graph) with three types of nodes. A root node corresponding to a design file, internal groups and geometry at the leaves. Each node has a user name, a class name and a source id. 

The user name is whatever the user named the object (could be blank). The class name is the thing in the original design file that the node represents. The groups and geometries in the diagram might be Inserts and Meshes in a DWG file, or Instances and Walls in an RVT file. The source id is whatever identifier the source design file uses. It might be an entity handle for a DWG, or an element id from an RVT.

Each node has a set of attributes. Similar to nodes, each attribute also has a name and class name. There are a few different types of attribute which fall into three categories. First, attributes that represent transforms used to position objects in 3D space. Second, materials that determine the appearance of objects. Finally, there are property attributes. Each property attribute contains a list of (name,class name,value) pairs. Nodes can have multiple property attributes, with each attribute representing a different category of properties. The properties are whatever the Navisworks file converters can extract from the source design file. 

The logical scene graph is used to populate the [Selection Tree Window](https://help.autodesk.com/view/NAV/2023/ENU/?guid=GUID-AF4CFA5C-1455-4444-982A-34FBA2AE4608) in Navisworks. The attributes are used to populate the [Properties Window](https://help.autodesk.com/view/NAV/2023/ENU/?guid=GUID-DE27B147-B234-4AFE-8E2C-ACA82120A253). Each attribute is a separate tab.

The instance tree is the scene graph DAG expanded into a tree structure. It's an extremely lightweight structure used to tie the logical scene graph and rendering graph together. Each node in the instance tree represents a logical instance defined by a path through the DAG. Selections in Navisworks are represented by a list of pointers to instance tree nodes. As the instance tree can be easily regenerated from the logical scene graph, it's not serialized into the Navisworks file format. 

The spatial graph is used for all spatially oriented operations such as rendering, picking, collision detection and clash detection. The leaves are self-contained instances consisting of a bounding box, transform, material and geometry definition. All are stored in a form optimized for rendering. Geometry and materials are shared between instances. Large geometric objects are [split into multiple instances]({{ ngp_url | append: "#prepare" }}) in the spatial graph to ensure efficiency of spatial operations. Each leaf node in the instance tree has a list of corresponding instances in the spatial graph.

Navisworks uses a spatial bounding box hierarchy to support efficient spatial queries. The hierarchy is an [R-tree](https://en.wikipedia.org/wiki/R-tree) variant.

Originally, design file conversion required file converters to build a complete representation of the model using the logical scene graph. Navisworks would then traverse the scene graph, accumulating transform and material attributes along each path and generating spatial graph instances whenever it reached a leaf node. The accumulated transform and material attributes would be combined and converted into rendering optimized transform and material representations. 

File converters would often struggle to create a scene graph structure that makes logical sense to users, while also defining instances with the correct transforms and materials. Over the years we had real difficulty with AutoCAD and its complex rules for assigning materials based on layers, blocks and xrefs. More recently, we made the logical and spatial graphs completely independent. Although most converters still work the old way, it's now possible to create models where the instance transforms and materials can be anything you like, regardless of what logical scene graph structure and attributes you have. 

## Container

The file formats for the early versions of Navisworks were simply the result of serializing the model representation and session metadata. The file started with a header that defined the file version and whether the content was binary or text, compressed or uncompressed. The rest of the file was a single serialized stream of data.

With the Navisworks 4 "JetStream" release we added the ability to work with models that were too large to fit in memory. That meant being able to load parts of the model from file and page data in and out. 

The first step was to change the overall format from a single stream to a container that could store multiple streams. Yes, just like a [ZIP](https://en.wikipedia.org/wiki/ZIP_(file_format)) file. However, rather than simply adopting ZIP, I created my own. There was an element of [Not Invented Here](https://en.wikipedia.org/wiki/Not_invented_here) to that decision, but we felt that our file format was something we should have total control over. I also didn't like one of the design decisions made by ZIP. 

The ZIP format is designed so that it can be created in a streaming fashion. You can start writing the ZIP archive without having to know in advance how many files you're going to add. You can even create a ZIP archive on the fly in response to an http request. A ZIP file consists of a set of files concatenated together, each optionally compressed, followed by a directory which tells you where each file starts, and ending with a record which tells you where the directory starts. 

To read a ZIP file you have to start at the end, first reading the final record, then using that to read the directory and then finally being able to start reading files. To me it seemed like ZIP files were optimized for ease of writing by making them less efficient to read. I wanted Navisworks files to be readable largely sequentially from the front. 

{% include candid-image.html src="/assets/images/file-formats/navis-container-format.svg" alt="Navisworks Container Format" %}

They start with the standard Navisworks header. This helps support backwards compatibility. Earlier versions of Navisworks can recognize that this is a later version of a Navisworks file. The header defines the version and encoding of each of the streams in the container. Unlike ZIP, the directory follows immediately after the header, and then the individual streams concatenated together. When writing a Navisworks file, you have to know how many streams it will include in advance, so you can write out the right amount of padding space for the directory. Once you've written all the streams you can come back and overwrite the padding with the actual directory entries.

The main parts of the Navisworks data model are written out as separate streams, in the order that they are usually read. There are separate streams for the logical scene graph, the spatial hierarchy and the set of instances. Each feature with its own metadata (clash tests, saved viewpoints, selection sets, etc.) also uses a separate stream.

As well as allowing data to be loaded on demand, serializing data from different features in separate streams allowed us to add new features without having to change the file format. Older versions of Navisworks would just ignore streams they didn't recognize. 

Unfortunately, using separate streams for high level features doesn't make much of a dent into our aim of supporting models larger than will fit in memory. In a typical Navisworks model, 45% is geometry, 45% is property attributes and everything else is just 10%. We needed a more granular approach for geometry and properties.

## Geometry

Navisworks uses simple tesselated geometry, optimized for rendering. There are five types of geometry. 
* Indexed Triangle Strip Sets
* Line Sets
* Point Sets
* Parametric Cylinders
* Recap Point Cubes

Indexed triangle strip sets are by far the most common. The detailed representations aren't important. They're basically what you could feed to OpenGL most efficiently back in the day. There's [more]({{ ngp_url | append: "#prepare" }}) [information]({{ ngp_url | append: "#simplify" }}) in my post on the [Navisworks Graphics Pipeline]({{ ngp_url }}), if you're interested. 

All geometry definitions are stored in a special chunked stream. Each definition is written as a separate chunk which can be independently loaded. Just like the overall container, the stream includes a directory of chunks. However, unlike the overall container, chunks are not separately compressed. Individual geometry chunks are too small for effective compression. Instead the output stream of chunks is divided into fixed size 64KB segments for compression. Zlib compression operates on 64KB of data at a time, so this scheme gives us compression nearly as good as compressing the whole stream. A segment directory is used to keep track of the segment boundaries. 

## Properties

## Metadata

## NWD

## NWC

## NWF
