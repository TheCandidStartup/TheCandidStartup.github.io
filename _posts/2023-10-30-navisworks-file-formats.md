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

Whatever we do to prepare the data has to be completely automatic, with no user intervention. We have to support all the different types of source CAD format that our users work with. We have to support a workflow where the source models are changing frequently. That means minimizing the turn around time to update to the latest models. We need to make sure that any additional metadata the user creates, to support the design review process, still makes sense as the underlying models change.

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

Serialization is the process of turning that graph of objects in memory into a stream of bytes that can be written out as a file. Deserialization is the reverse process of reading from a stream of bytes and using that to reconstruct an equivalent graph of objects in memory. This is a well solved problem with lots of [standard algorithms](https://isocpp.org/wiki/faq/serialization). 

You may be wondering why I'm talking about serialization algorithms rather than describing the file format spec. That's because there is no spec. The file format is whatever the Navisworks code writes out. 

There is some underlying structure. The input and output stream classes support versioning, binary or text output, compressed (using [zlib](https://www.zlib.net/)) or uncompressed. We used a rigorous versioning policy where every change in the format, no matter how small, resulted in a new file version with code that could read and write both the new and previous versions. Navisworks can, in theory, still read files created by the first versions of Navisworks. 

## Model Representation

The heart of Navisworks is its model representation. It consists of three linked data structures: the logical scene graph, instance tree and spatial graph. 

{% include candid-image.html src="/assets/images/file-formats/navis-model-representation.svg" alt="Navisworks Model Representation" %}

The scene graph is a logical representation of the source design model. It's meant to match the user's mental model of their design file. An AutoCAD user thinks in terms of layers, groups, inserts, blocks and primitives. A Revit user thinks in terms of categories, systems, families, components, types, instances and elements. 

The Navisworks scene graph is a [DAG (Directed Acyclic Graph)](https://en.wikipedia.org/wiki/Directed_acyclic_graph) with three types of nodes. A root node corresponding to a design file, internal groups and geometry at the leaves. Each node has a user name, a class name and a source id. 

The user name is whatever the user named the object (could be blank). The class name is the thing in the original design file that the node represents. The groups and geometries in the diagram might be Inserts and Meshes in a DWG file, or Instances and Walls in an RVT file. The source id is whatever identifier the source design file uses. It might be an entity handle for a DWG, or an element id from an RVT.

Each node has a set of attributes. Similar to nodes, each attribute also has a name and class name. There are a few different types of attribute which fall into three categories. First, attributes that represent transforms used to position objects in 3D space. Second, materials that determine the appearance of objects. Finally, there are property attributes. Each property attribute contains a list of (name,value) pairs. Nodes can have multiple property attributes, with each attribute representing a different category of properties. The properties are whatever the Navisworks file converters can extract from the source design file. 

The logical scene graph is used to populate the [Selection Tree Window](https://help.autodesk.com/view/NAV/2023/ENU/?guid=GUID-AF4CFA5C-1455-4444-982A-34FBA2AE4608) in Navisworks. The attributes are used to populate the [Properties Window](https://help.autodesk.com/view/NAV/2023/ENU/?guid=GUID-DE27B147-B234-4AFE-8E2C-ACA82120A253). Each attribute is a separate tab.

The instance tree is the scene graph DAG expanded into a tree. It's an extremely lightweight structure used to tie the logical scene graph and spatial graph together. Each node in the instance tree represents a logical instance defined by a path through the DAG. Selections in Navisworks are represented by a list of pointers to instance tree nodes. As the instance tree can be easily regenerated from the logical scene graph, it's not serialized into the Navisworks file format. 

The spatial graph is used for all spatially oriented operations such as rendering, picking, collision detection and clash detection. The leaves are self-contained instances consisting of a bounding box, transform, material and geometry definition. All are stored in a form optimized for rendering. Geometry and materials are shared between instances. Large logical geometric objects are [split into multiple instances]({{ ngp_url | append: "#prepare" }}) in the spatial graph to ensure efficiency of spatial operations. Each leaf node in the instance tree has a list of corresponding instances in the spatial graph.

Navisworks uses a spatial bounding box hierarchy to support efficient spatial queries. The hierarchy is an [R-tree](https://en.wikipedia.org/wiki/R-tree) variant.

Originally, design file conversion required file converters to build a complete representation of the model using the logical scene graph. Navisworks would then traverse the scene graph, accumulating transform and material attributes along each path and generating spatial graph instances whenever it reached a leaf node. The accumulated transform and material attributes would be combined and converted into rendering optimized transform and material representations. 

File converters would often struggle to create a scene graph structure that makes logical sense to users, while also defining instances with the correct transforms and materials. Over the years we had real difficulty with AutoCAD and its complex rules for assigning materials based on layers, blocks and xrefs. More recently, we made the logical and spatial graphs completely independent. Although most converters still work the old way, it's now possible to create models where the spatial graph transforms and materials can be anything you like, regardless of what logical scene graph structure and attributes you have. 

## Container

The file formats for the early versions of Navisworks were simply the result of serializing the model representation and session metadata. The file started with a header that defined the file version and whether the content was binary or text, compressed or uncompressed. The rest of the file was a single serialized stream of data.

With the Navisworks 4 "JetStream" release, we added the ability to work with models that were too large to fit in memory. That meant being able to load parts of the model from file and page data in and out. In order to do that, you need to switch to some form of container format that can store multiple streams and let you read each stream independently.

The most common container format is the [ZIP](https://en.wikipedia.org/wiki/ZIP_(file_format)) file. However, rather than simply adopting ZIP, I created my own. There was an element of [Not Invented Here](https://en.wikipedia.org/wiki/Not_invented_here) to that decision, but we felt that our file format was something we should have total control over. The details don't matter. Just think of it as equivalent to a ZIP file: a header, multiple compressed streams and a directory telling you where to find the stream you're looking for.  

{% include candid-image.html src="/assets/images/file-formats/ZIP-64-layout.svg" alt="ZIP-64 Internal Layout" attrib="Niklaus Aeschbache, Public domain, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:ZIP-64_Internal_Layout.svg)" %}

The main parts of the Navisworks data model are written out as separate streams, in the order that they are usually read. There are separate streams for the logical scene graph, the spatial hierarchy and the set of instances. Each feature with its own metadata (clash tests, saved viewpoints, selection sets, etc.) also uses a separate stream.

As well as allowing data to be loaded on demand, serializing data from different features in separate streams allowed us to add new features without having to change the file format. Older versions of Navisworks would just ignore streams they didn't recognize. 

Unfortunately, using separate streams for high level features doesn't make much of a dent into our aim of supporting models larger than will fit in memory. In a typical Navisworks model, 45% is geometry, 45% is property attributes and everything else is just 10%. We needed a more granular approach for geometry and properties.

## Geometry

Navisworks uses simple tesselated geometry, optimized for rendering. There are six types of geometry. 
* Indexed Triangle Strip Sets
* Line Sets
* Point Sets
* Parametric Cylinders
* Recap Point Cubes
* Text

Indexed triangle strip sets are by far the most common. The detailed representations aren't important. They're basically what you could feed to OpenGL most efficiently back in the day. There's [more]({{ ngp_url | append: "#prepare" }}) [information]({{ ngp_url | append: "#simplify" }}) in my post on the [Navisworks Graphics Pipeline]({{ ngp_url }}), if you're interested. 

All geometry definitions are stored in a special chunked stream. Each definition is written as a separate chunk which can be independently loaded. Just like the overall container, the stream includes a directory of chunks. However, unlike the overall container, chunks are not separately compressed. Individual geometry chunks are too small for effective compression. Instead the output stream of chunks is divided into fixed size 64KB segments for compression. Zlib compression operates on 64KB of data at a time, so this scheme gives us compression nearly as good as compressing the whole stream. A segment directory is used to keep track of the segment boundaries. 

{% include candid-image.html src="/assets/images/file-formats/segment-chunk-stream.svg" alt="Segmented Chunked Geometry Stream" %}

When loading geometry chunks, the compressed segments are decompressed on demand into a temporary file. The geometry chunks are serialized in priority order based on the default view for the model. This ensures that during the initial load, geometry is largely read sequentially. 

To help manage geometry life time as it is paged in and out, we split the in-memory geometry objects into two. Instances refer to a "Geom Ref" stub object that always remains in memory. Geometry is shared between instances where possible, so multiple instances may reference the same Geom Ref. The Geom Ref stores the file and chunk id for the corresponding geometry definition and triggers the load on demand process when the geometry is needed.

## Properties

The original idea was to handle property paging in the same way as geometry paging. However, property attributes are typically much smaller than geometry definitions and more numerous. Adding "Attribute Ref" objects, each with file and chunk ids, would add too much overhead. We were also constrained by the need to minimize changes to the existing code base in order to release in a timely fashion.

Luckily, property access is not as time critical as geometry access. There tend to be two types of access. Either properties are being accessed for a single logical instance (an object has been selected), or properties for all objects are being accessed in traversal order (searching). We explicitly serialize attributes from multiple nodes into each chunk by traversing over the logical scene graph and writing them to the same stream. Once we have more than 64KB in the output, we start a new chunk. A directory in the root node keeps track of which range of nodes corresponds to each chunk. 

Attributes can be shared between multiple nodes. At the time, Material and Transform nodes were involved in maintenance of the spatial graph. To keep things simple, only unshared Property attributes are serialized into the chunked property stream and loaded on demand. The remaining attributes are serialized with the rest of the logical scene graph. 

Each node has a vector of attached attributes. A NULL pointer is used to mark unloaded attributes. When an attribute is required, the node follows the chain of parent pointers to the root node where it can use the property directory to determine which property chunk to load. When a property chunk is loaded, all of the attributes contained are loaded. For single object access, the additional overhead doesn't matter. For a traversal across all objects, it's exactly what you want, as the attributes are stored in traversal order.

## Sheets

The next big change to the Navisworks file format was the result of a [VP mandate]({% link _posts/2022-10-31-organizational-anti-pattern-vp-moves.md %}). Autodesk had too many viewers. We needed to merge the functionality of [Autodesk Design Review](https://www.autodesk.co.uk/products/design-review/overview) into Navisworks. ADR is essentially a DWF viewer. [DWF](https://en.wikipedia.org/wiki/Design_Web_Format) was Autodesk's attempt at taking on PDF. The primary focus was 2D drawings, but DWF could also include 3D models.

Navisworks already had support for 3D DWF. However, a DWF file can contain multiple sheets, where each sheet is either a 3D model or a 2D drawing. Navisworks would only load the default 3D sheet. The Navisworks file formats could only store a single 3D model. 

The first job was to add support for multiple sheets. We already had a multi-stream container format. So, all we had to do was add more streams for each additional sheet plus a stream that stored a list of sheets and the ids of the corresponding streams for each sheet. 

Navisworks ignores the additional streams when first loading the file. If the user opens the sheets browser, Navisworks loads the list of sheets from the sheets stream. If the user selects another sheet to display, Navisworks loads the model from the corresponding streams and switches the currently active model to the new one. Previously loaded sheets are kept in memory, unless memory is running low and space needs to be reclaimed. 

## 2D

We also had to add an entire 2D subsystem to Navisworks. I had naively assumed that 2D was a simpler subset of 3D. I was very mistaken. 2D rendering is full of arcane rules with demanding customers that expect pixel perfect accuracy. I'm talking viewports, hatch patterns, model vs paper space, end caps, endless options for what should be displayed when one primitive crosses another, transparency, strict expectations for render order, and more. 

In the end we took the easy way out. We embedded a copy of Heidi, AutoCAD's original rendering engine. We ask Heidi to render the drawing and capture the "grass clippings" that would normally be sent direct to the system graphics API. The grass clippings take the form of triangles, lines, points and fragments of text which we already know how to deal with. We combine them into Navisworks geometry definitions and instances.

We handled the strict render ordering requirement by using the Z coordinate to specify the required order. With the view locked down to an orthographic camera looking down the Z axis, we can let Navisworks do its prioritized rendering thing, with the depth buffer ensuring the rendered order looks correct. 

## UUIDs

DWF files can contain sheets which are entirely unrelated, or more commonly, represent different views of the same model. Navisworks aggregation lets you combine an arbitrary set of sheets into a single file. 

A common workflow in ADR is to select an object in one sheet and then zoom into the same object on another sheet. To do that, you need identifiers which are unique across multiple sheets in a file, and ideally [universally unique]({% link _posts/2023-09-24-unique-ids.md %}). DWF used UUIDs for that purpose. 

Navisworks didn't have a standardized object id system of its own. It used the source CAD system's own identifiers. In most cases these identifiers were only unique in the context of a single model. They were also different lengths and formats which made it hard to work with them in a consistent way. The time was right to add first class support for UUIDs as the standard Navisworks object identifier.

We used type 5 hash UUIDs for file formats, like DWG, which don't have native UUID identifiers. This type of UUID is deterministically created using a hash of some arbitrary input values. In our case we combine a native file specific object id (e.g. the entity handle) with a unique file id. 

The UUIDs are serialized in an unusual way. All the UUIDs used by a sheet are serialized into a dedicated stream, in sorted order. The nodes in the logical scene graph use an integer index to specify a UUID. This has three advantages. First, it uses less memory in the common case of nodes that don't have a UUID. Second, serializing all the UUIDs together in order makes for better compression. Finally, and most importantly, it makes it easy to implement the cross-sheet ADR workflow without having to load all the sheets in advance. To work out which other sheets contain an object, you only have to load the UUID stream for each sheet. As the UUIDs are sorted, you can use binary chop to see if the UUID you're interested in is there. 

## Metadata

Navisworks is a design review format. Data converted from the source design files, like the model representation, is read only. It can't be edited in Navisworks. However, you can create and edit metadata during your design review session. Metadata includes things like saved viewpoints, selection sets, search sets, overridden materials, clash tests and results. 

In many cases, metadata is related to instances in the model. For example, a clash result includes the two instances that are clashing. In memory, each instance is represented by a pointer to an instance tree node. When serialized, the instance is represented by an integer id. During serialization of the logical scene graph, Navisworks assigns an incrementing integer id for each instance tree node in traversal order. The metadata streams have access to that mapping, so as metadata is serialized, the corresponding integer id for each instance can be written out. 

The equivalent process happens during deserialization. When Navisworks reads in the logical scene graph, it rebuilds the instance tree in the same order, creating a mapping from integer id to newly created instance tree nodes. When metadata streams are deserialized, they can map the saved integer id to the corresponding in-memory instance tree node.

## File Format Details

Finally, we've come full circle back to the three Navisworks File formats. Hopefully, you now have enough context to understand how each format works. All the formats use the same container format and serialization system. They differ in what streams are included.

### NWC

Let's start with the simplest format. An NWC simply contains the data from a source design file converted to the Navisworks data model. It contains all the sheet and model representation streams needed to represent the content of the original file. It may also have some metadata streams, like saved viewpoints, if the source design file has equivalent content. 

It has one special case stream. An NWC acts as a cache. If the source design file is unchanged, Navisworks will load from the NWC, rather than reconverting the design file. How does Navisworks know whether the design file has changed? It looks at the cache validity stream in the NWC.

The cache validity stream contains information about the design file when it was converted. This includes size, modification date and other easily calculated metrics. If any of these fail to match the current design file, the cache is invalid.

Some design files support external references. In that case, the cache will also be invalid if any of the externally referenced files have changed. The cache validity stream also contains information about any dependent files. 

### NWD

An NWD is also simple. The format is almost the same as an NWC. It's not a cache, so doesn't include the cache validity stream. It includes all the sheet and model representation streams needed to represent the content of all the files aggregated into the current Navisworks session. 

There are two types of aggregation supported by Navisworks. The simplest is just to add all the sheets from the file being aggregated to the current set of sheets. The other is to combine the model representation from one sheet into the currently active model representation in the session. The in-memory representations of each type of stream are merged together. 

The NWD also includes metadata streams for all the metadata converted from the source design files and created or edited during the Navisworks session. 

### NWF

NWF is the most complex format. The NWF has a special case stream which stores a list of the design files that have been aggregated into the Navisworks session. When you load an NWF, the design files on the list are loaded (using NWCs if valid) and aggregated together. The NWF doesn't contain any model representation streams. 

The metadata is where it gets complex. The NWF stores only metadata that has been created or edited in Navisworks. Some metadata, liked saved viewpoints, can be created in the source design file or Navisworks. In this case, Navisworks keeps track of which metadata items came from the design file. The NWF stores just the changes that need to be applied to the metadata from the design files, in order to recreate the Navisworks session state. 

It gets really complex when you consider that the design files may have been changed since the NWF was saved. Navisworks does the best it can to apply the saved changes in a way that makes sense. 

Metadata may reference instances in the model. How does that work if the logical scene graph can be completely different when the NWF is reloaded? Navisworks handles this by storing a special subset of the model representation in the NWF. The subset includes just properties that can help identify instances and only includes that information for instances which are referenced by metadata. It includes
* Node class name
* Node name
* Node UUID
* Node source id
* Node Parent-Child relationships
* Geometry Checksum
* Instance bounding box
* Instance id

When the NWF is loaded, the referenced design files are aggregated together, then the model data in the model representation subset is used to try and match instances saved in the NWF to the corresponding instance in the updated model. Navisworks uses multiple different approaches to try and find a unique match.
* Match on UUIDs (if defined)
* Match on source ids (if defined) 
* Use parent-child relationships and node name/class name to find an equivalent logical path
* Use geometry checksum and instance bounding box to find an instance with the same geometry in the same place

If there is no match or multiple possible matches, Navisworks behaves as if the instance was deleted in the updated design file. A common symptom of a failure to match instances can be seen in Clash Detective. You load an NWF and see lots of existing clashes have been marked as resolved (because one or both of the objects apparently no longer exist). Then an identical set of "new" clashes appear when you rerun the clash test. 

There are lots of reasons why matching might fail.
* You're using a design file format that doesn't have meaningful ids. That can lead to lots of ambiguous matches.
* You're using a design file format that doesn't have stable ids. For example, some CAD applications create a completely new set of UUIDs each time they publish a model as a DWF or IFC.
* Third party extensions that delete and recreate CAD system objects on each edit, resulting in new ids. Particularly common in the AutoCAD ecosystem.
* User inadvertently creates duplicate objects all with the same position, properties and geometry. 

If you create a lot of metadata that references a lot of object instances, the model representation subset stored in the NWF can become very large. That can lead to lengthy loading times when opening the NWF, as Navisworks tries to match all the instances. A common mistake is to create lots of viewpoints where each viewpoint includes overridden materials for every instance in the model. 

## Next Time

Next time we'll take a look at the Autodesk viewer's SVF format, see what ideas it takes from the Navisworks format, and how it remixes them to work in the browser.