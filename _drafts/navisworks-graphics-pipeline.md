---
title: The Navisworks Graphics Pipeline
tags: navisworks computer-graphics autodesk
---

[Last time]({% link _drafts/evolution-computer-graphics.md %}) we looked at the evolution of the graphics pipeline over the last 30 years or so. Given that framework, what does the [Navisworks]({% link _topics/navisworks.md %}) graphics pipeline look like?

{% include candid-image.html src="/assets/images/navisworks-graphics-pipeline.svg" alt="Navisworks Graphics Pipeline" %}

{% capture pipelines_url %}
{% link _drafts/evolution-computer-graphics.md  %}
{% endcapture %}

It should look familiar. It's basically a [Unified Shader Model]({{pipelines_url | strip | append: "#2006-2010--unified-shader-model"}}) pipeline. Standard stuff from the graphics API boundary onwards. All the magic happens on the application side.

## History

Navisworks didn't always have a unified shader model pipeline. Work on the rendering engine that eventually became Navisworks started in 1994, firmly in the [Fixed Function Pipeline]({{pipelines_url | strip | append: "#1991-2000--the-fixed-function-pipeline"}}) era. The initial implementation ran on Silicon Graphics workstations using OpenGL 1.0 and was ported to Windows in 1997. Only basic shaded materials were supported. Later, the "Presenter" module added support for texture based materials using a library from Navisworks' sister company, [Lightwork Design](https://en.wikipedia.org/wiki/Lightwork_Design_Ltd.). 

{% capture vp_url %}
{% link _posts/2022-10-31-organizational-anti-pattern-vp-moves.md %}
{% endcapture %}

The next significant change came after Navisworks was acquired by Autodesk. There was a [VP mandate]({{vp_url | strip | append: "#the-mandate"}}) that all applications needed to use a common graphics engine (known internally as OGS - One Graphics System) and a common UI (which introduced the ribbon and the ViewCube).

OGS had a layered design. At the lowest level it provided a device abstraction layer for a generic unified shader model pipeline. It came with an extensive material and post processing effects library, with shader implementations for both OpenGL and multiple flavors of Direct3D. The idea was to ensure that models and materials could be moved between Autodesk applications and render the same way in each application. 

Above the device abstraction layer, OGS provided a complete scene graph implementation, covering the Load-Flatten-Cull-Simplify parts of the pipeline. As I'll explain later, this part of the pipeline is where Navisworks' secret sauce is implemented. OGS had a more standard implementation. We integrated with OGS at the device abstraction layer. That gave us access to the material and effects library and achieved the company objective of common materials. 

And that's about it. We've added a couple more features since then (Point Cloud support and a software occlusion buffer) which I'll cover when I go through the pipeline in detail. However, the main structure hasn't changed for over ten years.

### If you're going to San Francisco ...

I made my first trip to Autodesk headquarters in San Francisco shortly after we'd got the OGS integration working. I wangled a meeting with Autodesk's CTO, Jeff Kowalski, by offering to answer any questions he might have about Navisworks. He welcomed me to his office and asked his first question.

"Why are the graphics in Navisworks so crappy?"

I tried to explain that Navisworks was a working tool, not a Media & Entertainment product. It's more valuable for customers to color code objects so they can understand what role they play in the building, rather than to have things look pretty. 

He wasn't buying it. Luckily, I had a demo of the OGS integration with me and was able to show him the OGS SSAO post-processing effect. [SSAO](https://en.wikipedia.org/wiki/Screen_space_ambient_occlusion) gives an impression of diffuse lighting by darkening creases, holes and surfaces that are close to each other. To my mind it just makes the model look grubby, but it seemed to make Jeff happy.

Coincidentally, there was a Navisworks user's group meeting that same week. I attended and showed a few of the upcoming features planned for Navisworks. I had high hopes for the SSAO demo given Jeff's reaction. 

Tumbleweeds. Total silence. People turning to each other and shrugging, bewildered. "I guess it looks nice, but what use is it?".

I swiftly moved on to what I thought was a minor feature. Navisworks had the ability to reload the overall model if any of the individual models aggregated together had changed. The new feature was that now only the individual model that changed would be reloaded, speeding up the time to update the overall model. 

Pandemonium. Whooping and cheering. People high-fiving each other. Which is how I learned that VPs don't always know what customers want.

## Details

There's an overriding philosophy behind  Navisworks that is different from most graphics engines. Most engines, particularly those used for games, take a 3D scene and try to render it as fast as possible. If the model is too big, frame rates are low. If that happens, you go back to the Prepare stage and change the model to make it less complex. 

The idea behind Navisworks is to handle any model, no matter how big, without having to change it to make it work. In construction models are changing all the time. There's no time to optimize a model for viewing. By the time you were done, it would be out of date. Navisworks lets you set a desired frame rate. Navisworks renders models in priority order, most important objects first, and stops rendering for that frame when it runs out of time. Detail drops out while you interact with the model, then fills in when you stop interacting.

### Prepare

A lot happens during the Prepare stage. All automatic. The end user experience is that they open a CAD model (in one of many supported formats), then append another, then another, building up an aggregated model of their entire project. Behind the scenes, Navisworks is hard at work. 

The CAD model is converted into the optimized Navisworks format. The logical structure of the model is represented using a scene graph. Any complex geometry (solid models, NURBS surfaces, ...) is tessellated into triangle meshes. These meshes, together with any meshes directly represented in the CAD model, are next conditioned ready for rendering. 

The conditioning process first cleans up the meshes. Duplicate and degenerate triangles are removed. Triangles are oriented consistently and normals are generated if missing. Any large meshes (more than a few thousand triangles) are split into smaller pieces. Many features in Navisworks (e.g. prioritized traversal, clash detection) depend on reasonable size geometry for good performance. Meshes are first split into separate [manifold](https://knowledge.autodesk.com/search-result/caas/CloudHelp/cloudhelp/2019/ENU/MSHMXR/files/GUID-7B6A26A2-1E8A-4352-99A5-6C4026D5B89D-htm.html) connected pieces. If still too large, a spatial subdivision is used. 

The scene is flattened in advance. The scene graph is traversed to create a list of instances and then a bounding volume hierarchy is built for the instances. 

Finally, everything is serialized to a compressed on disk format (the Navisworks NWC or NWD file). The files are structured to that geometry (and properties) can be streamed in and decompressed on the fly.

### Load

Navisworks can load NWC/NWD files from disk or directly from a network location (e.g. from a web server using http). Navisworks loads everything apart from geometry and object properties up front. Typically that's about 10% of the file, with geometry and properties each taking about 45%. Geometry and properties are loaded on demand. Geometry is streamed in. In most circumstances, Navisworks knows what geometry will be needed in advance. When rendering, it knows what order the instances will be traversed in, so can make IO requests early enough that the data will be loaded by the time it's needed.

### Flatten

Navisworks only maintains material definitions on the GPU. The rest of the flattened scene is created during Prepare and Loaded from the file. The only required Flattening operation is to create GPU materials (which includes compiling shaders) using the OGS library.

When modifications are made to the scene (moving an object, overriding a material or reloading one of the models in the aggregate), the flattened representation is updated to match and the BVH updated.

### Cull

### Simplify

### Vertex Processing

### Rasterize

### Fragment Processing

### Post Processing
