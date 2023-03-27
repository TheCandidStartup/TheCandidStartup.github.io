---
title: The Navisworks Graphics Pipeline
tags: navisworks computer-graphics autodesk
---

[Last time]({% link _posts/2023-03-13-trip-graphics-pipeline.md %}) we looked at the evolution of the graphics pipeline over the last 30 years or so. Given that framework, what does the [Navisworks]({% link _topics/navisworks.md %}) graphics pipeline look like?

{% include candid-image.html src="/assets/images/navisworks-graphics-pipeline.svg" alt="Navisworks Graphics Pipeline" %}

{% capture pipelines_url %}
{% link _posts/2023-03-13-trip-graphics-pipeline.md  %}
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

The idea behind Navisworks is to handle any model, no matter how big, without having to change it to make it work. In construction, models are changing all the time. There's no time to optimize a model for viewing. By the time you were done, it would be out of date. 

Navisworks lets you set a desired frame rate. Navisworks renders models in priority order, most important objects first, and stops rendering for that frame when it runs out of time. Detail drops out while you interact with the model, then fills in when you stop interacting.

### Prepare

A lot happens during the Prepare stage. All automatic. The end user experience is that they open a CAD model (in one of many supported formats), then append another, then another, building up an aggregated model of their entire project. Behind the scenes, Navisworks is hard at work. 

The CAD model is converted into the optimized Navisworks format. The logical structure of the model is represented using a scene graph. Any complex geometry (solid models, NURBS surfaces, ...) is tessellated into triangle meshes. These meshes, together with any meshes directly represented in the CAD model, are next conditioned ready for rendering. 

The conditioning process first cleans up the meshes. Duplicate and degenerate triangles are removed. Triangles are oriented consistently and normals are generated if missing. Any large meshes (more than a few thousand triangles) are split into smaller pieces. Many features in Navisworks (e.g. prioritized traversal, clash detection) depend on reasonable size geometry for good performance. Meshes are first split into separate [manifold](https://knowledge.autodesk.com/search-result/caas/CloudHelp/cloudhelp/2019/ENU/MSHMXR/files/GUID-7B6A26A2-1E8A-4352-99A5-6C4026D5B89D-htm.html) connected pieces. If still too large, a spatial subdivision is used. 

There are two special cases. First, there are some shapes which appear repeatedly. Cylinders are the most common example, frequently used in piping models. Cylinders need to be finely tessellated to look perfectly smooth when up close. Navisworks represents shapes like these using parametric geometry. A cylinder can be represented using two points and a radius. There is corresponding code in the Simplify stage to handle parametric geometry.

The other special case is point clouds imported from [ReCap](https://www.autodesk.com/products/recap/overview). ReCap files are truly massive. ReCap has its own point cloud specific support for incremental load and render of point clouds. Each point cloud is spatially divided into cubes. The points in each cube can be independently loaded at an appropriate level of detail. Navisworks creates a dedicated instance for each cube, again with corresponding code in the Simplify stage.

The scene is flattened in advance. The scene graph is traversed to create a list of instances and then a bounding volume hierarchy is built for the instances. 

Finally, everything is serialized to a compressed on disk format (the Navisworks NWC or NWD file). The files are structured so that geometry (and properties) can be streamed in and decompressed on the fly.

### Load

Navisworks can load NWC/NWD files from disk or directly from a network location (e.g. from a web server using http). Navisworks loads everything apart from geometry and object properties up front. Typically that's about 10% of the file, with geometry and properties each taking about 45%. Geometry and properties are loaded on demand. Geometry is streamed in. In most circumstances, Navisworks knows what geometry will be needed in advance. When rendering, it knows what order the instances will be traversed in, so can make IO requests early enough that the data will be loaded by the time it's needed.

### Flatten

Navisworks only maintains material definitions on the GPU. The rest of the flattened scene is created during Prepare and Loaded from the file. The only required Flattening operation is to create GPU materials (which includes compiling shaders) using the OGS library.

When modifications are made to the scene (moving an object, overriding a material or reloading one of the models in the aggregate), the flattened representation is updated to match and the BVH updated.

### Cull

The heart of Navisworks is the prioritized traversal algorithm. The bounding volume hierarchy is traversed in such a way that instances are visited in priority order. Priority is view dependent. Objects nearer the camera are higher priority than those further away. Objects that appear large on the screen are higher priority than those that only cover a few pixels. If Navisworks runs out of time, the remaining unvisited low priority instances are culled. 

The BVH traversal includes standard view frustum culling too.

The most recent change to the Navisworks pipeline was the introduction of a software occlusion buffer. I had previously implemented various forms of hardware occlusion culling. Unfortunately, there were always scenes where the extra overhead of issuing occlusion queries cost more than rendering the geometry that was culled. Hardware occlusion ended up as one of those features hidden behind a global option that most people never turn on. 

Over the same time, mainstream CPUs went from having a single core, to dual cores, then quad cores or more. The Navisworks pipeline could only make use of two cores. One that implemented the traversal algorithm and another that handled feeding the selected instances to the graphics API. On most machines there were at least two spare cores not doing anything. Coincidentally, Intel had released [sample code](https://www.intel.com/content/www/us/en/developer/articles/technical/software-occlusion-culling.html) for software occlusion culling using streaming SIMD extensions (SSE). 

I used the sample as the basis for adding software occlusion culling to Navisworks. In Navisworks, the occlusion culler runs on a dedicated core. There is a small fixed length queue of occluders to render and occlusion tests to perform. Of course, the software renderer can't keep up with the GPU and the queue is often full. When that happens, Navisworks bypasses the occlusion culler and sends the instance straight to the GPU for rendering. This ensures that the GPU always stays busy. 

There's no downside to running the occlusion culler so it can be enabled by default. What's surprising is how well it works on most scenes.  The initial instances chosen by the prioritized traversal tend to be the most significant occluders. The end result is up to three times reduction in the time required to render.

### Simplify

The output of the cull phase is a stream of instances to be rendered. The vast majority of these instances have triangle mesh geometry. It's important to minimize the number of draw calls to the graphics API due to the significant overhead of the graphics driver. Most Navisworks models have huge numbers of small instances. 

Geometry is dynamically consolidated into [Vertex Buffer Objects](https://www.khronos.org/opengl/wiki/Vertex_Specification#Vertex_Buffer_Object) (VBO). Navisworks maintains a pool of fixed size VBOs. Geometry from multiple incoming instances can be accumulated into the same VBO and only sent to the GPU when the buffer is full. Instances can only be consolidated if they use the same material and rendering state. 

Shaded materials are implemented using a single GPU material with per vertex colors. Color is copied from the instance's material when the geometry is written into the VBO. Similarly, simple transforms (translate and scale) are applied as vertices are copied so that they end up in a common coordinate space. The end result is that most instances in a typical model can be consolidated together.

Navisworks tessellates parametric objects to a view dependent LOD, writing the generated triangles into the VBO. With a more modern pipeline it would be possible to use tesselation shaders or generate a buffer of instances. Unfortunately, it turns out that parametric objects are rarer than we thought. For most input formats it's too difficult to identify geometry that could be parametric. Further optimization isn't worth it.

For instances that correspond to ReCap point cubes, Navisworks uses the ReCap library to determine the appropriate LOD and then copies the points into a dedicated points VBO.

### Vertex Processing

The Vertex Processing stage is simple. The vertex shader is generated by the OGS library based on the material in use. For simple shaded materials it just transforms, projects and clips the vertices. For more complex materials it might generate additional vertex properties such as texture coordinates (UVs) and tangents.

### Rasterize

Nothing special to see here. Good old fixed function hardware.

### Fragment Processing

The fragment shader is also generated by the OGS library based on the material and lighting model in use. Most instances will use simple shaded materials. More complex materials (applied using Presenter or imported from CAD formats that support advanced materials) use special purpose shaders from the OGS library. 

OGS supports shadow casting lights. If enabled in the 3D scene, the generated shader will sample shadow maps to determine whether the fragment is visible from the corresponding light. As most geometry in Navisworks is static, shadow maps are updated when the model changes and then cached. 

### Post Processing

Finally, any post processing effects the user may have enabled are applied. These could include antialiasing, SSAO, tone mapping or any other effect in the OGS library.
