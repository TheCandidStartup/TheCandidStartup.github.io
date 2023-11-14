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

And yet, the viewer worked, for big models too. It only supported InfraWorks models, but it clearly had a lot of promise. It was written in JavaScript, so the team were able to optimize directly for performance and memory usage in the JavaScript runtime environment.

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

We agreed to use a SQLite database as the property representation in SVF. The schema was based on an Entity-Attribute-Value [triple store](https://en.wikipedia.org/wiki/Triplestore). Each instance is assigned an incrementing integer entity id when the SVF is created. The same entity ids are used when serializing the model representation, thus tying everything together. The database has a table of property attributes which defines each type of property and specifies property name, units, etc. A table of values defines each unique value. Finally, an EAV table defines triples which specify that an entity E has a property attribute A with value V.

This turns out to be a surprisingly compact representation. Most models have no more than a few hundred different property attributes, regardless of size. There are many common values across all the objects in a model, so the value table is a lot smaller than you might think. Finally, the EAV table just contains triples of integer indexes which compress really well. 

During implementation, the viewer team suggested an alternative representation. The property database representation was so compact that SQLite's ability to page data in and out wasn't needed. The property data is read only within the viewer so you don't need the ability to edit it either. You could store the whole thing as a set of compressed JSON arrays. The big arrays only contain integers, so you can use a JavaScript [typed array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays) in memory. Most browsers store typed arrays outside the limited size JavaScript heap, making it practical to load all the property data into memory.

SVF is, unfortunately, an Autodesk proprietary format. AFAIK the spec has never been made public. I suspect no one in Autodesk has looked at it in years. As we'll see later on, significant parts of what is now considered to be SVF, were added organically. The original spec helped to bootstrap the ecosystem, but after that SVF ended up being defined by what the code in the Autodesk Viewer would read. 

## Model Derivative Service

The final player in the SVF ecosystem is the Model Derivative service. The Model Derivative service converts design files stored in Autodesk cloud apps into SVF, as well as a variety of other formats. The service creates and manages "derivatives" of your design files. Behind the scenes is a big S3 bucket and a fleet of servers with a variety of desktop applications installed. Model derivative service looks at the type of your input design file and the desired output format, then runs the appropriate converter. 

Converters are typically implemented as SVF export plugins that run within a standard desktop application. One of the SVF teams built a C++ library for reading and writing SVF files. The application teams were then responsible for using the library to write their plugin. In the early days of SVF, most conversions used Navisworks. Navisworks could read most formats, so all it took was implementing a Navisworks SVF export plugin to add Model Derivative support for twenty formats. 

Model Derivative service expects all converters to output a JSON manifest in a standard format, together with a set of files described by the manifest. If you ask Model Derivative service to produce multiple different types of derivative, it merges the JSON manifests from each converter together to describe a combined "bubble" of derivatives. When querying the Model Derivative service, you need to be aware that the manifest returned can contain data from other conversions that you might not be expecting. 

In theory SVF is an extendable format. The initial spec was based on the Navisworks representation. As application teams started writing their own converters, they found things that Navisworks and hence SVF didn't support. Extending SVF would mean getting the spec and C++ library updated, which would mean coordinating with multiple teams, all with different priorities. Alternatively, the application team could throw whatever extra data they wanted into their converter's Model Derivative manifest. All they had to do then was persuade the viewer team to add support for it. 

## SVF Format

Enough back story, let's get into the details of the format. I'm going to describe the format in terms of the set of files that an SVF converter writes out. If you use the developer tools in your browser, you can see the Autodesk viewer retrieving each of these files from the Model Derivative service. 

I'm going to start with the original SVF format, then go through what changed for SVF2.

### Model Derivative Manifest

The Model Derivative manifest is structured as a tree. Each node of the tree is represented by a JSON object.

```
{
    "guid": "aa85aad6-c480-4a35-9cbf-4cf5994a25ba",
    "role": "viewable",
    "type": "folder",
    "name": "rac_basic_sample_project.rvt",
    "children": []
}
```

Every node has a `guid` identifier and `type`. If it's an internal node in the tree, it will have an array of `children`. Many nodes will have a human readable `name`.  Some types are categorized further with a `role` property. Each type of node will have additional type specific properties (not shown here).

The manifest can be verbose. Complex design files can contain multiple models and views in both 2D and 3D. Each model and view is represented as a sub-tree containing thumbnails, 3D SVF, 2D DWF and F2D, viewpoints, thumbnails, additional design file specific metadata, object property databases, etc. There isn't any fixed structure. Consumers need to iterate over the the tree looking for types and roles they're interested in. 

The `guid` identifiers don't have any specific meaning. They're used when merging manifests. The Model Derivative service recurses down the tree structure of each manifest, merging nodes with the same `guid`.

Downloadable content is represented by nodes with the "resource" `type`. Resource nodes have an *urn* property which can be used to download the corresponding content from Model Derivative service. SVF files have the "graphics" `role` and a `mime` type of "application/autodesk-svf". 

```
{
    "urn": "urn:adsk.viewing:fs.file:.../output/Resource/3D View/{3D} 960621/{3D}.svf",
    "role": "graphics",
    "size": 5242199,
    "mime": "application/autodesk-svf",
    "guid": "6bfb4886-f2ee-9ccb-8db0-c5c170220c40",
    "type": "resource"
}
```

SVF resources usually occur as a child of a "geometry" `type` node that has additional metadata such as a `name` and `viewableId`. The geometry node can contain other children such as saved views. 

```
{
    "guid": "250a6ce5-ee70-fdca-bfc9-4111f54e9baa",
    "type": "geometry",
    "role": "3d",
    "name": "{3D}",
    "viewableID": "44745acb-ebea-4fb9-a091-88d28bd746c7-000ea86d",
    "children": []
}
```

### Multiple Versions of Design Files

Each version of a design file managed in the cloud will have its own derivatives described by a Model Derivative manifest. If you want to understand how a design file has changed over time, you will need to identify the corresponding geometry resources across multiple manifests. Remember that each design file can contain multiple sheets and models. 

You might think that's what the `guid` property is for. However, some converters generate new guids every time they export, so you can't rely on guids being stable across versions. The `viewableId` property is an identifier that should be meaningful to the source design application. You can rely on it being stable if it's present, but not all converters output one. The `name` property is the last resort. It's usually a human editable name so may occasionally change from version to version. 

The heuristic most consumers end up using is to try matching up resources on each property in turn: `guid`, then `viewableId`, then `name`. Stop when you find a match. 

### SVF container

You've parsed the Model Derivative manifest, identified an SVF resource and downloaded the corresponding content. What have you got?

The top level SVF container is a ZIP file. Change the extension from `.svf` to `.zip` and open it up to see what's inside. Typically, all you'll find is two JSON files: manifest.json and metadata.json. 

When designing the SVF format, we wanted to have the flexibility to use it as a multi-part web format or an all-in-one desktop format. Each part can be stored in the `.svf` ZIP file, or as a separate external file. The manifest.json file lists all the parts and tells you whether they're embedded in the ZIP file or referenced externally.

```
    "assets": [
        {
            "id": "objects_attrs.json",
            "type": "Autodesk.CloudPlatform.PropertyAttributes",
            "URI": "../../objects_attrs.json.gz",
            "size": 0,
            "usize": 0
        },
        {
            "id": "CameraDefinitions.bin",
            "type": "Autodesk.CloudPlatform.PackFile",
            "typeset": "0",
            "URI": "CameraDefinitions.bin",
            "size": 140,
            "usize": 177
        },
        {
            "id": "metadata.json",
            "type": "Autodesk.CloudPlatform.ViewingMetadata",
            "URI": "embed:/metadata.json",
            "size": 491,
            "usize": 975 
        },
        ...
    ]
```

The manifest has a top level `assets` property which lists all the parts of the SVF. Each asset has a `URI` property which tells you were the content is stored. If the URI starts with `embed:`, it's stored in the ZIP with the filename given by the rest of the URI. Otherwise, the URI is a relative path to an external resource. Most of the time, the external resource is in the same directory. However, it is possible for the resource to be stored in a sub-directory, or as shown here, higher up in the directory hierarchy. 

There are `size` and `usize` properties which tell you the compressed and uncompressed sizes of the content. In some cases, the implementers were lazy and just wrote out 0. It's safest to ignore the stored sizes and use the actual size of whatever content you've downloaded.

The `id` property is a unique identifier within the list of assets. It's usually just a truncated version of the URI. 

Finally, there's a `type` property which tells you what kind of asset you're looking at. The type specifies the format of the content. Some types, like  "Autodesk.CloudPlatform.PackFile", are containers. An additional `typeset` property provides information about the types of object stored in the container.

```
    "typesets": [{
        "id": "0",
        "types": [{
            "class": "Autodesk.CloudPlatform.Camera",
            "type": "Autodesk.CloudPlatform.CameraDefinition",
            "version": 2
        }]
    },{
        "id": "1",
        "types": [{
            "class": "Autodesk.CloudPlatform.Light",
            "type": "Autodesk.CloudPlatform.LightDefinition",
            "version": 1
        }]
    },{
        "id": "2",
        "types": [{
            "class": "Autodesk.CloudPlatform.Geometry",
            "type": "Autodesk.CloudPlatform.OpenCTM",
            "version":  1
        }]
    },{
        "id": "3",
        "types": [{
            "class": "Autodesk.CloudPlatform.Geometry",
            "type": "Autodesk.CloudPlatform.OpenCTM",
            "version": 1
        },{
            "class": "Autodesk.CloudPlatform.Geometry",
            "type": "Autodesk.CloudPlatform.Lines",
            "version": 2
        }]
    },
    ...
    ]
```

Each typeset has an `id`, referenced by the container asset, and an array of types. Most containers store a single type of object, but some, like geometry containers, can store multiple types. The `version` property tells you which version of the serialization format was used for objects of that type.

### Serialization

### Viewing Metadata

### Model Representation

### Geometry Pack Files

### Object Properties

## SVF2 Format

