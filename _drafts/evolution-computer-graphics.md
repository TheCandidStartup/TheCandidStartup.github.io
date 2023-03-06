---
title: A Trip Down The Graphics Pipeline
tags: computer-graphics
---

It seems like a long time since I described the [general areas for my initial projects]({% link _posts/2022-10-24-what-projects.md %}). I've talked a lot about my [cloud based, open source, serverless, customer deployed, scalable spreadsheet project]({% link _topics/spreadsheets.md %}). Today I'm going to switch gears and make a start on Interactive Viewing for Large Geometric Models. That's a bit of a mouthful, so let's call it [Computer Graphics]({% link _topics/computer-graphics.md %}) for short. 

Just like the spreadsheet project, I'm going to take my time and work my way up to the big reveal. First of all, what do I mean by Computer Graphics? How does it work? How has it changed over time?

## 3D Graphics Pipeline

The basic principles used for realtime 3D rendering have stayed pretty much unchanged. Your application has some representation of a 3D scene that it needs to render to a 2D screen. The [graphics pipeline](https://en.wikipedia.org/wiki/Graphics_pipeline) is a conceptual model that describes the steps required to get there. Everyone has their own version of the graphics pipeline. This is mine. 

{% include candid-image.html src="/assets/images/Graphics-Pipeline.svg" alt="Graphics Pipeline" %}

### Prepare

My version of the pipeline starts earlier than most people's. Whatever makes up your scene has to come from somewhere. Let's call these inputs assets. Whatever your application does, there is usually some preparation process to get the assets into a form that your application can use. In almost all cases there is format conversion and some sort of restructuring into your application's 3D scene representation. In games, much time is spent optimizing the geometry that artists have created so that it can be rendered fast enough. 

There are many ways that a 3D scene can be represented depending on the needs of your application. Often this takes the form of a [hierarchical scene graph](https://en.wikipedia.org/wiki/Scene_graph). Your application may support multiple types of geometry and material which can be reused by multiple objects.

### Load

The prepared 3D scene is serialized into persistent storage. The next stage is to load the scene into memory so that your application can use it. The application may load the entire scene up front (the simplest approach), or if memory is an issue, load parts of the scene incrementally on demand.

### Flatten

The in memory 3D scene is in a form that is convenient for your application to work with. It's typically not in a form that is optimal for rendering. We need to flatten the rich scene description into independent render-able instances. Each instance has geometry, a material definition and a transform from the geometry's local coordinate system into a common world space. Flattening may transform the complete 3D scene into an alternative representation of the scene better suited for rendering, or it may happen on the fly during rendering by traversing the scene graph and rendering an instance each time a leaf is reached. 

Flattening may also include view independent restructuring of geometry and material definitions.

### Cull

The remaining stages of the pipeline are view dependent. A camera definition describes how 3D coordinates are projected into 2D space. 

Once we've defined a view we can start culling. We want to remove any instances that will not contribute to the final rendered result. This is purely a performance optimization but with large models is necessary to achieve realtime rendering speeds. There are many forms of culling. The most basic is frustum culling where any instance outside the camera's viewing volume can be ignored. Over time, as implementations became more capable, more sophisticated forms of culling were introduced.

### Simplify

Next we move on to simplification. The flattened geometry definitions may be further restructured in a view dependent way. This could include selecting which [level of detail](https://en.wikipedia.org/wiki/Level_of_detail_(computer_graphics)) to use or [tessellating](https://en.wikipedia.org/wiki/Tessellation_(computer_graphics)) a high level surface definition into triangles.

### Vertex Processing

At this point all the geometry has been simplified into simple primitives (e.g. triangles, lines and points) defined by vertices. Vertices are defined using an (X,Y,Z) position together with a set of application specific vertex attributes. They can include colors, normals, tangents, UV coordinates for texture mapping, object ids, and so on. The vertex processing stage transforms primitives in 3D local coordinates into primitives in 2D device coordinates (X and Y in pixels). Typically this will include transforming vertices into world space, evaluating lighting, projecting vertices into 2D, and clipping against the window boundary. Input vertex attributes are copied and/or transformed into output vertex attributes.

The user friendly camera definition is converted into a [4x4 homogeneous matrix](https://en.wikipedia.org/wiki/Transformation_matrix). This means that the full vertex transformation from local coordinates to 2D device coordinates can be implemented as a matrix multiplication. 

### Rasterize

Many different algorithms for rendering a 3D scene to a 2D image have been proposed over the years. However, for realtime 3D rendering, the heart of the graphics pipeline continues to be [rasterization](https://en.wikipedia.org/wiki/Rasterisation) of triangles. The rasterization process identifies which pixels in the output image are covered by the triangle and may need to be updated. Rasterization generates a fragment for each pixel covered, with a set of attributes for each. Most attributes are generated by [interpolating](http://courses.cms.caltech.edu/cs171/assignments/hw2/hw2-notes/notes-hw2.html) the triangle's vertex attributes across the face of the triangle. 

### Fragment Processing

Input fragments are evaluated and used to update the output render target. Most commonly, the target is a buffer with depth and color per pixel. Depth in the incoming fragment is compared with the stored depth in the buffer which is updated if the fragment is closer than the existing pixel. 

Many other forms of processing are possible. For example, the fragments could include an alpha value for transparency which is used to blend together the existing and incoming color.

### Post Processing

The final stage is post processing. The previous render target is read, updated and written out. Initially, post processing was restricted to straight forward image space operations such as anti-aliasing, gamma correction and image filters.

## Change Agents

While the overall concept of the graphics pipeline has stayed the same, there have been significant changes in the implementation. I see five main drivers of change.

First, the use of dedicated hardware for graphics. The main trend over time has been how the use of dedicated hardware has spread from right to left through the pipeline. 

Second, the evolution of graphics hardware from hard coded fixed functions to more generalized, programmable execution units. Accompanying that is greater flexibility in input and output formats. As we shift left in the pipeline we get more and more into the domain of the application. One size does not fit all, so some level of programmability is crucial to doing more with graphics hardware.

Third, as hardware becomes more generalized, computation moves further right in the pipeline. There are multiple reasons for this trend. It allows for higher quality rendering (e.g. evaluating lighting per fragment rather than per vertex), it can make better use of highly parallel hardware and it can be more efficient to delay expensive computation until we know the results are going to be used (e.g. only shade visible fragments).

Fourth, as hardware becomes more capable and the transfer of data from CPU to GPU becomes more of a bottleneck, increasing amounts of data are maintained on the GPU. Initially all the data needed to render a frame (transforms, geometry, materials) was sent to the GPU every frame. This approach is sometimes called immediate mode graphics. First textures, then entire material definitions, were transferred once and then reused for subsequent frames. The trend has continued with geometry, transforms, and even bounding volume hierarchies now seen GPU side.

Finally, the evolution of graphics APIs. Applications don't access graphics hardware directly. They use an API. It doesn't matter if a capability exists in the hardware if the API doesn't let you make use of it.

## History

{% include candid-image.html src="/assets/images/compact-graphics-pipeline.svg" alt="Graphics Pipeline Key" %}

Let's scrunch up my version of the graphics pipeline to make it more manageable. I will use variations of this diagram to illustrate how implementations have evolved over time. Stages will be color coded blue for fixed function hardware, orange for programmable hardware and green for software. A vertical dashed line will shown the boundary between application code and graphics API.

### 1991-2000 : The Fixed Function Pipeline 

{% include candid-image.html src="/assets/images/opengl-graphics-pipeline.svg" alt="Fixed Function Graphics Pipeline" %}

My first encounter with realtime 3D graphics was in 1991, using [Silicon Graphics](https://en.wikipedia.org/wiki/Silicon_Graphics) unix workstations with their proprietary [IRIS GL](https://en.wikipedia.org/wiki/IRIS_GL) API. It seemed like every manufacturer had their own API coupled to the details of whatever graphics hardware they had.

A year later SGI released [OpenGL](https://en.wikipedia.org/wiki/OpenGL), a cross platform rework of IrisGL. OpenGL was quickly adopted by other unix workstation manufacturers, soon followed by Microsoft and Apple. OpenGL abstracted away the details of the hardware and provided an API that covered Vertex Processing, Rasterization, Fragment Processing and Post Processing. The API covered the feature set of the then top of the line Silicon Graphics workstations. 

The OpenGL driver was required to provide a software implementation of any missing hardware features. Applications using OpenGL could be confident that their application would run against a wide range of hardware, or even without any dedicated hardware. Even better, as hardware improved over time, applications would continue to be compatible while seeing improved performance. The downside was that the driver was heavyweight, having to handle the backend of the Simplify stage in order to map the common interface exposed by the API to the vagaries of the hardware. 

SGI provided a complete software implementation which was actually usable in production rather than being just a reference implementation or toy. In the PC space, machines varied from having no dedicated graphics hardware, to rasterization and basic fragment processing and eventually, by the end of the decade, complete hardware implementations. 

The OpenGL pipeline was fixed function (although with a wide range of features and options that could be enabled and disabled) with corresponding hardware implementations. Vertex Processing included transform and project using 4x4 homogenous matrices, per vertex lighting and clipping to the window bounds. Rasterization supported triangle, line and point primitives. Fragments had color and depth with Fragment Processing supporting depth and stencil tests, texture mapping and blending. Post processing included anti-aliasing, an accumulation buffer for combining multiple renders and with OpenGL 1.2 a set of image processing features. 

Microsoft (being Microsoft) decided that they needed control over their own graphics API. They launched Direct3D, initially targeting consumer hardware and games. The initial version of the API covered far less scope than OpenGL and it rapidly evolved during the course of the decade before finally reaching OpenGL parity with Direct3D 7.

### 2001-2005 : Programmable Vertex and Fragment Shaders

{% include candid-image.html src="/assets/images/graphics-pipeline-programmable-shaders.svg" alt="Programmable Vertex and Fragment Shaders" %}

The next major innovation was the introduction of programmable vertex and fragment shaders. The fixed function pipeline was too complex to extend efficiently. There were huge numbers of combinations of options to test, only a small set of which were actually used. It was simpler, more efficient and ultimately higher performance to provide a set of programmable execution units and a simple [SIMD](https://en.wikipedia.org/wiki/Single_instruction,_multiple_data) instruction set. GPUs had two types of execution units specialized for vertex processing and fragment processing respectively. 

Initially, programmers had to work directly with each GPU's instruction set via extensions to OpenGL and Direct3D. OpenGL 1.4 and Direct3D 8 introduced high level [Shader Languages](https://en.wikipedia.org/wiki/High-Level_Shader_Language) which were compiled into GPU instructions by the driver. It would be incredibly inefficient if shaders were recompiled on every use, which drove the move to maintain material definitions (including compiled shaders) on the GPU, so that they can be reused.

Applications used the new capabilities to implement more sophisticated and specialized lighting models. Increasingly, lighting models were evaluated in the fragment shader so that lighting was calculated per pixel, rather than per vertex and then interpolated. Applications also started to use multiple rendering passes per frame. For example, rendering a shadow map for each light, and then using the shadow maps as input textures during the final render pass.

Hardware of this era had many limits, including the number of instructions that could be executed by a shader and the number and form of resources that could be accessed. The hardware still included a complete implementation of the fixed pipeline for backwards compatibility, as the programmable shaders were not capable of replicating the complete set of features.

This era also saw the introduction of the first features to target earlier parts of the pipeline. [Occlusion queries](https://www.khronos.org/opengl/wiki/Query_Object#Occlusion_queries) allow the application to test whether an instance would be visible if rendered. In theory, applications could use this in combination with a [bounding volume hierarchy](https://en.wikipedia.org/wiki/Bounding_volume_hierarchy) in order to cull groups of instances that would not be visible.

In practice, occlusion queries are hard to use efficiently. Hardware implementations are literally pipelines. If you issue an occlusion query and wait for the result, you leave execution units idle that could have been busy rendering. 

### 2006-2010 : Unified Shader Model

{% include candid-image.html src="/assets/images/graphics-pipeline-unified-shader.svg" alt="Unified Shader Model" %}

Successive generations of hardware added new instructions and removed limits, which also reduced the differences between vertex and fragment execution units. Having separate types of execution unit is inefficient. Vertex heavy processing would leave the fragment processors under utilized, fragment heavy processing would leave the vertex processors under utilized. The solution was to move to a unified shader model architecture with only one type of execution unit. Vertex and fragment processing are dynamically allocated to execution units with a scheduler that tries to keep all the execution units busy.

The fixed function pipeline was largely removed once the programmable execution units were capable of exactly replicating the old behavior. Only rasterization and post processing blend operations remained as fixed function hardware.

While the hardware changed radically, there were only incremental changes to the APIs. They maintained the model of distinct types of shader that interacted in prescribed ways. Innovation took the form of new types of shader that could be optionally configured into the shader pipeline. Behind the scenes it all gets compiled to SIMD instructions running on 100s or 1000s of identical execution units. 

OpenGL 3 and Direct3D 10 added Geometry shaders to the vertex processing stage. Geometry shaders have a complete primitive (triangle, line or point) as input with the ability to output a different primitive or set of primitives.

Applications started to move computation into the post processing stage. [Deferred shading](https://en.wikipedia.org/wiki/Deferred_shading) became mainstream. As lighting models became more complex, an increasing amount of time was spent in fragment shading. That work is wasted if the fragment ends up not being visible, which is common in complex scenes. In deferred shading, the fragment shader writes fragment attributes such as normal and material id to the render target in addition to color and depth. This "G-Buffer" is then used as the input for post-processing, where lighting can be calculated per visible pixel.

### 2011-2015 : Tesselation and Compute

{% include candid-image.html src="/assets/images/graphics-pipeline-tesselate-compute.svg" alt="Tesselation and Compute Shaders" %}

The pattern for hardware is now well established. Fix some minor blockers from the previous generation and then focus most of your attention on cramming in more execution units. APIs also continued with the evolutionary approach, adding support for Tesselation and Compute shaders.

As GPUs became ever faster, it got harder and harder to keep them fed. Tesselation adds a set of shaders that take coarse grained geometry as input and generate much finer grained geometry. In principle this expands hardware support further left in the graphics pipeline into the Simplify stage. In practice, to make use of tesselation you need to change the way that content is created so that it matches the expected inputs for tesselation. You need to take extra care where separately tessellated objects meet to ensure that they are tessellated the same way and there are no cracks. For most purposes, tesselation was too difficult to make use of.

Historically APIs had been single threaded. Only a single CPU core could be used to interact with the graphics API. That core spent most of its time at 100% utilization. This generation of APIs added limited support for multi-threading. While only one thread could communicate with the GPU, other threads could be used to fill command and vertex buffers ready to be transferred over.

Finally, the APIs added support for compute shaders. These provide the ability to use the GPU's parallel execution units for arbitrary non-graphical computation. For realtime 3D that could include things like physics and simulation engines. Each frame, the CPU had to invoke the compute shader, get the results, use them to update the 3D scene and then coordinate the rest of the graphics pipeline to render the new scene.

### 2016-2020 : New APIs for General Purpose GPUs

{% include candid-image.html src="/assets/images/graphics-pipeline-gpgpu.svg" alt="General Purpose GPU Pipeline" %}

The established APIs with their high level abstraction of the hardware were showing their age. The rigid boundary drawn across the graphics pipeline was easy to understand and easy to use but was too rigid and inefficient. The new APIs give applications much greater control at the cost of additional complexity. Direct3D 12 is an entirely new API compared to Direct3D 11. The next generation of OpenGL got a new name, Vulkan, to emphasize the magnitude of the change. 

Applications now directly assemble long lists of commands for the GPU to execute. Applications manage the synchronization of access to memory shared by CPU and GPU. The commands access data from buffers that the application has directly filled using formats it controls. Outputs are written to additional application controlled buffers which can be used as input for further computation.

Crucially, it was now practical for compute shaders to generate inputs for rendering without having to transfer data via the CPU. This opens the door for [GPU Driven Rendering](https://vkguide.dev/docs/gpudriven/gpu_driven_engines/). There's now no sensible place to draw an API boundary across the graphics pipeline. Each stage of the pipeline can use the GPU for intensive data parallel work and the CPU for orchestration. The flattened representation of the 3D scene can be managed entirely on the GPU. Data is only transferred between CPU and GPU when the scene is initially loaded and when it is updated.

GPU driven pipelines have the potential to remove almost the entire burden of rendering from the CPU, leaving it free to concentrate on whatever the application does beyond rendering. 

### 2021+ : Specialized Hardware is Back

{% include candid-image.html src="/assets/images/graphics-pipeline-specialization.svg" alt="New Specialized Hardware added to General Purpose GPU Pipeline" %}

Most recently, innovation has been happening in the hardware space. Mainstream applications are still catching up with the new APIs introduced in the previous generation. GPU manufacturers were finding it hard to differentiate themselves by simply adding more execution units at higher clock speeds. They have instead added two new types of specialized execution units. 

RTX cores are used to accelerate [ray tracing](https://en.wikipedia.org/wiki/Ray_tracing_(graphics)). Ray tracing has been around as long as rasterization. Ray tracing can provide much higher quality rendering than rasterization but has always been too expensive for realtime 3D. Classical ray tracing fires a ray from the camera position through each pixel on the screen and works out what the ray would first intersect with in the scene. Further rays can then be fired towards lights to determine shadows and in other directions to handle reflections and transparency. Efficient ray tracing depends on acceleration structures (such as bounding volume hierarchies) to reduce the number of ray-triangle intersection tests needed.

RTX cores use GPU specific acceleration structures to implement efficient ray-scene intersection. The geometry that defines the scene must be managed by the GPU. This works well with a GPU driven pipeline. The graphics driver is responsible for creating and managing acceleration structures for the geometry. This will be in addition to whatever bounding volume hierarchy the application chooses to maintain for its own purposes. Typically, RTX is used as an optional extra, enabled only by those that have the most expensive graphics cards.

In theory, a scene can be rendered entirely using ray tracing. In practice that's still too slow for realtime 3D with large scenes. Most applications use a [hybrid approach](http://intro-to-dxr.cwyman.org/presentations/IntroDXR_Full_Rays_Ahead.pdf) that uses rasterization to determine visibility. They then use a carefully controlled amount of ray casting in their lighting model, by firing rays during fragment or post processing. An exhaustively evaluated global illumination lighting model would require hundreds of rays to be fired in all directions from each visible fragment. For realtime 3D you have to use a small number of sample rays, chosen to given the biggest bang for the buck. This leads to noisy looking images which need post processing tricks to clean up. 

Which brings us neatly to the second type of new execution unit, the AI core. AI cores execute a pre-trained [machine learning inference model](https://learn.microsoft.com/en-us/windows/ai/directml/dml-intro). You can use this for a wide variety of non-graphics machine learning requirements. Within the graphics pipeline, AI cores are most commonly used for post processing tasks such as de-noising ray traced images, anti-aliasing, upscaling and even [generating entire intermediate frames](https://www.nvidia.com/en-gb/geforce/technologies/dlss/) to boost perceived frame rate.

Finally, GPU usage has made it all the way to the Load stage of the pipeline with [DirectStorage](https://github.com/microsoft/DirectStorage). DirectStorage allows data to be loaded into the GPU at high speeds from SSD storage, with minimal CPU involvement. This includes the ability to decompress data in the GPU.

## Conclusion

We've come a long way from the days of the fixed function pipeline. Hardware is fully programmable, new APIs give greater control and its feasible to maintain all your graphics related data on the GPU. I'm excited to explore what's now possible.