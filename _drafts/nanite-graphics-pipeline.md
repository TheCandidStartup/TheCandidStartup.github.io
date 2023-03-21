---
title: From Navisworks to Nanite
tags: computer-graphics navisworks
---

The [Navisworks Graphics Pipeline]({% link _drafts/navisworks-graphics-pipeline.md %}) last got a serious overhaul more then ten years ago. I want to find out how you could implement something like Navisworks with a modern pipeline. As a starting point, I've decided to have a look at the [Nanite](https://docs.unrealengine.com/5.1/en-US/nanite-virtualized-geometry-in-unreal-engine/) pipeline introduced with [Unreal Engine 5](https://docs.unrealengine.com/5.1/en-US/).

{% capture pipelines_url %}
{% link _posts/2023-03-13-trip-graphics-pipeline.md %}
{% endcapture %}

Unreal is a mainstream games engine with a [long history](https://en.wikipedia.org/wiki/Unreal_Engine). It has been through the evolution from [Fixed Function Pipelines]({{pipelines_url | strip | append: "#1991-2000--the-fixed-function-pipeline"}}), through [Programmable Shaders]({{pipelines_url | strip | append: "#2001-2005--programmable-vertex-and-fragment-shaders"}}), onto [Deferred Shading]({{pipelines_url | strip | append: "#2006-2010--unified-shader-model"}}) and now to [GPU Driven Rendering]({{pipelines_url | strip | append: "#2016-2020--new-apis-for-general-purpose-gpus"}}). 

Nanite is particularly interesting because it's the first time I've seen a games engine with a similar philosophy to Navisworks. Brian Karis, engineering fellow at Epic Games, describes their thinking in his [SIGGRAPH Presentation](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf) from 2021. 

> Many years ago I got to see the impact that a virtual texturing system could have on an art team.
> How freeing it was for the artists to use giant textures wherever they wanted and not to have to worry about memory budgets.
> Ever since I’ve dreamt of the day where we could do the same for geometry.
> The impact could be even greater.
> No more budgets for geometry would mean no more concern over polycounts, draw calls, or memory.
> Without those limitations artists could directly use film quality assets without wasting any time manually optimizing for use in real-time.
> It’s ridiculous how much time is wasted in optimizing art content to hit framerate.

The engine source code is [easily accessible](https://www.unrealengine.com/en-US/ue-on-github). While not Open Source, the [license](https://www.unrealengine.com/en-US/eula/unreal) allows you to read, build and modify the source for your own purposes. You can freely distribute any product you build using the engine (as long as any revenue you receive is below $1,000,000). In theory, this gives me a state of the art GPU rendering pipeline to experiment with.  

## The Nanite Pipeline

{% include candid-image.html src="/assets/images/nanite-graphics-pipeline.svg" alt="Nanite Graphics Pipeline" %}

How does Nanite achieve its aim of handling whatever geometry you can throw at it? There's nothing like the Navisworks prioritized traversal to ensure that you hit a desired framerate. 

Nanite starts from the basis that there's a fixed number of pixels on the screen, so if you're perfectly efficient, rendering cost would be fixed for a given resolution. As far as possible, Nanite tries to ensure that you only rasterize triangles that will be visible and that you only shade fragments that will contribute to the final result. 

There are three things that Nanite needs to make this work. First, using deferred shading so that only pixels in the G-Buffer need to be shaded during Post Processing. Second, using a dynamic LOD structure to ensure that all triangles drawn are at least pixel size. Finally, using occlusion culling to avoid drawing triangles that are hidden.

All instances including transforms, materials and at least the root of the per mesh LOD structure need to fit in GPU memory. All instances are processed by the GPU driven pipeline each frame. Which means there is a limit on the number of instances that can be used in a scene. The Nanite SIGGRAPH presentation mentions that Nanite can comfortably handle a million instances (assuming reasonable hardware). I've seen [stress tests](https://youtu.be/v9kynURWW_I) that get close to 10 million instances before running out of memory (32GB RAM, 11GB VRAM), while still maintaining 30 fps.

There are no limits on the size of meshes (apart from disk space to store them). Different LOD levels are streamed into memory and paged out when no longer needed. The stress test meshes have 120 thousand triangles each, for a total of around one trillion triangles. 

### Prepare

Unreal has a rich collection of utilities for scene preparation, centered around the Unreal Editor. Models can be imported from a variety of sources. Like Navisworks, complex geometry is tessellated into triangle meshes. The meshes are then further subdivided into clusters of 128 triangles or less. 

Clusters are the basis for Nanite's LOD generation algorithm. At each LOD level, clusters are arranged into groups of 8 to 32 clusters. Each group is decimated to half the number of triangles and then split into 4 to 16 new clusters. The boundary of each group is left unchanged so that there will be no cracks when rendering adjacent clusters at LOD level *L* and *L-1*. The process repeats at the next level up with the key difference that a different set of groups with different boundaries is used. This ensures that all boundaries will eventually be decimated. The resulting clusters are organized using a bounding volume hierarchy per mesh. 

LOD generation doubles the total number of triangles stored, so it is important to be as space efficient as possible. Similarly to Navisworks, everything is serialized to a compressed on disk format designed so that geometry can be streamed in and decompressed on the fly. 

### Load

Nanite loads the scene graph, list of instances and the cluster bounding volume hierarchy for each mesh up front. Triangle clusters are loaded on demand, a group at a time, depending on the required LOD for that part of the mesh.

The on disk format is designed so that it can be efficiently decompressed using the GPU. For example, using DirectStorage on PC.

### Flatten

Like all GPU Driven pipelines, Unreal maintains the entire scene (from instance list down) on the GPU. As the application modifies the scene graph, Unreal updates the GPU scene to match.

As well as having a compressed disk format, Nanite has a separate compressed in-memory format. The in-memory format is used directly for rendering so needs to have near instant decode time. Vertex attributes are quantized and bit packed. The disk representation is transcoded into the in-memory format as it is read in. 

Geometry is managed within a GPU page buffer. Clusters are allocated to 128KB pages based on spatial locality and level in the LOD structure. The first page contains the top level(s) of the LOD structure and is always resident, so there is always something to render. The resident set is updated based on feedback from the Cull stage.

### Cull

Nanite performs frustum culling and occlusion culling. Occlusion culling uses a [hierarchical depth buffer](https://miketuritzin.com/post/hierarchical-depth-buffers/) (HZB) with a two pass algorithm. In the first pass instances and then clusters (if the parent instance is visible) are tested against the HZB from the previous frame (using the previous frame's transforms). The assumption is that objects that would have been visible in the last frame are highly likely to be visible in this frame. Visible instances and clusters are rasterized. The HZB for the current frame is built based on what was just rasterized. 

In the second pass, all the instances and clusters found to be occluded based on the previous HZB are retested with the current HZB and those that are now visible are rasterized. Finally, the HZB is built again ready for the next frame. In normal circumstances (camera navigating smoothly through the scene), the second pass is a small fraction of the main pass, just rasterizing those objects that became visible in the current frame. 

### Simplify

The output from the preparation phase is a set of clusters at different LOD levels. At runtime Nanite needs to select which LOD level to use for each part of each mesh. Nanite uses an error function which calculates how many pixels of error would result if a cluster is rendered. The error function is setup so that the error for any parent cluster (lower LOD) is higher than any of its children. This property ensures that LOD selection can be determined locally and independently (and in parallel if desired) for each cluster. A cluster should be rendered if its parent's error is larger than a pixel and its own error is smaller than a pixel.

For efficiency there is a combined implementation for the cluster Cull and Simplify stages. The cluster BVH is traversed and at each node the HZB is tested for visibility and the LOD error function evaluated to determine whether traversal needs to continue to a more detailed LOD. Identifiers for the selected LODs are also written into an output buffer which is used by the Load stage for the next frame. 

Recursively traversing a tree structure using the highly parallel set of execution units provided by the GPU is an interesting problem. Nanite's solution is to implement its own job scheduling system. It manages a GPU buffer as a queue, seeded with the root cluster for each instance. Each execution unit repeatedly reads a node from the queue, performs an occlusion and LOD selection test and then either culls the node, adds the children back into the queue or adds the clusters to a buffer of clusters to be rendered.  

What happens when there are many small instances? You could end up drawing lots of sub-pixel triangles. This is a known limitation for Nanite. The root LOD is 128 triangles (or all the triangles in the mesh for small meshes). 

The current partial solution is to use [imposters](https://www.gamedeveloper.com/programming/imposters). It's a partial solution because it only offers a constant factor improvement. Instead of drawing the 128 triangles of the root LOD, you draw a single textured quad. Nanite's imposters consist of a texture atlas with 12x12 images (rendered from different directions) each of 12x12 pixels storing depth and triangle id. A total of 40KB per mesh, which is kept resident in GPU memory. This only makes sense for large meshes and/or meshes that are frequently used. 

A 128 triangle cluster, where each triangle is just under pixel sized, could easily cover a 10x10 pixel square on screen. If an imposter is used, it gets rendered into the target buffer directly, bypassing vertex processing and rasterization. The appropriate image is selected depending on viewing angle, and copied into the projected rectangle in screen space, scaling and skewing the image as required. 

### Vertex Processing

### Rasterize

### Fragment Processing

### Post Processing

## Shadows and Multi-view Rendering
