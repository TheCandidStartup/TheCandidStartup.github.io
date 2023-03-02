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

The remaining stages of the pipeline are view dependent. A camera definition defines how 3D coordinates are projected into 2D space. 

Once we've defined a view we can start culling. We want to remove any instances that will not contribute to the final rendered result. This is purely a performance optimization but with large models is necessary to achieve realtime rendering speeds. There are many forms of culling. The most basic is frustum culling where any instance outside the camera's viewing volume can be ignored. Over time, as implementations became more capable, more sophisticated forms of culling were introduced.

### Simplify

Next we move on to simplification. The flattened geometry definitions may be further restructured in a view dependent way. This could include selecting which [level of detail](https://en.wikipedia.org/wiki/Level_of_detail_(computer_graphics)) to use or [tessellating](https://en.wikipedia.org/wiki/Tessellation_(computer_graphics)) a high level surface definition into triangles.

### Vertex Processing

At this point all the geometry has been simplified into simple primitives (e.g. triangles, lines and points) defined by vertices. Vertices are defined using an (X,Y,Z) position together with an a set of application specific vertex attributes. They can include colors, normals, tangents, UV coordinates for texture mapping, object ids, and so on. The vertex processing stage transforms primitives in 3D local coordinates into primitives in 2D device coordinates (X and Y in pixels). Typically this will include transforming vertices into world space, evaluating lighting, projecting vertices into 2D, and clipping against the window boundary. Input vertex attributes are copied and/or transformed into output vertex attributes.

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

Fourth, as hardware becomes more capable and the transfer of data from CPU to GPU becomes more of a bottleneck, increasing amounts of data are maintained on the GPU. Initially all the data needed to render a frame (transforms, geometry, materials) was sent to the GPU every frame. This approach is sometimes called immediate mode graphics. First textures, then entire material definitions were transferred once and then reused for subsequent frames. The trend has continued with geometry, transforms, and even bounding volume hierarchies now seen GPU side.

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

Microsoft being Microsoft decided that they needed control over their own graphics API. They launched Direct3D, initially targeting consumer hardware and games. The initial version of the API covered far less scope than OpenGL and it rapidly evolved during the course of the decade before finally reaching OpenGL parity with Direct3D 7.

### 2001-2005 : Programmable Vertex and Fragment Shaders

{% include candid-image.html src="/assets/images/graphics-pipeline-programmable-shaders.svg" alt="Programmable Vertex and Fragment Shaders" %}

The next major innovation was the introduction of programmable vertex and fragment shaders. The fixed function pipeline was too complex to extend efficiently. There were huge numbers of combinations of options to test, only a small set of which were actually used. It was simpler, more efficient and ultimately higher performance to provide a set of programmable execution units and a simple [SIMD](https://en.wikipedia.org/wiki/Single_instruction,_multiple_data) instruction set. GPUs had two types of execution units specialized for vertex processing and fragment processing respectively. 

Initially, programmers had to work directly with each GPUs instruction set via extensions to OpenGL and Direct3D. OpenGL 1.4 and Direct3D 8 introduced high level [Shader Languages](https://en.wikipedia.org/wiki/High-Level_Shader_Language) which were compiled into GPU instructions by the driver. It would be incredibly inefficient if shaders were recompiled on every use, which drove the move to maintain material definitions (included compiled shaders) on the GPU so that they can be reused.

Hardware of this era had many limits including the number of instructions that could be executed by a shader and the number and form of resources that could be accessed. The hardware still included a complete implementation of the fixed pipeline as the programmable shaders were not capable of replicating the complete set of features.

This era also saw the introduction of the first features to target earlier parts of the pipeline. [Occlusion queries](https://www.khronos.org/opengl/wiki/Query_Object#Occlusion_queries) allow the application to test whether an instance would be visible if rendered. In theory, applications could use this in combination with a [bounding volume hierarchy](https://en.wikipedia.org/wiki/Bounding_volume_hierarchy) in order to cull groups of instances that would not be visible.

In practice, occlusion queries are hard to use efficiently. Hardware implementations are literally pipelines. If you issue an occlusion query and wait for the result, you leave execution units idle that could have been busy rendering. 

### 2006-2010 : Unified Shader Model

{% include candid-image.html src="/assets/images/graphics-pipeline-unified-shader.svg" alt="Unified Shader Model" %}

### 2011-2015 : Tesselation and Compute

{% include candid-image.html src="/assets/images/graphics-pipeline-tesselate-compute.svg" alt="Tesselation, Geometry and Compute Shaders" %}

### 2016-2020 : New APIs for General Purpose GPUs

{% include candid-image.html src="/assets/images/graphics-pipeline-gpgpu.svg" alt="General Purpose GPU Pipeline" %}

### 2021+ : Specialization is Back

{% include candid-image.html src="/assets/images/graphics-pipeline-specialization.svg" alt="New Specialized Hardware added to General Purpose GPU Pipeline" %}