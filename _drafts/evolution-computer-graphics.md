---
title: The Evolution of Computer Graphics
tags: computer-graphics
---

It seems like a long time since I described the [general areas for my initial projects]({% link _posts/2022-10-24-what-projects.md %}). I've talked a lot about my [cloud based, open source, serverless, customer deployed, scalable spreadsheet project]({% link _topics/spreadsheets.md %}). Today I'm going to switch gears and make a start on Interactive Viewing for Large Geometric Models. That's a bit of a mouthful, so let's call it [Computer Graphics]({% link _topics/computer-graphics.md %}) for short. 

Just like the spreadsheet project, I'm going to take my time and work my way up to the big reveal. First of all, what do I mean by Computer Graphics? How does it work? How has it changed over time?

## 3D Graphics Pipeline

The basic principles used for realtime 3D rendering have stayed pretty much unchanged. Your application has some representation of a 3D scene that it needs to render to a 2D screen. The [graphics pipeline](https://en.wikipedia.org/wiki/Graphics_pipeline) is a conceptual model that describes the steps required to get there. Everyone has their own version of the graphics pipeline, this is mine. 

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

Once we've defined a view we can start culling. We want to remove any instances that will not contribute to the final rendered result. This is purely a performance optimization but with large models is necessary to achieve realtime rendering speeds. There are many forms of culling. The most basic is frustum culling where any instance outside the camera's viewing volume (frustum) can be ignored. Over time, as implementations became more capable, more sophisticated forms of culling were introduced.

### Simplify

Next we move on to simplification. The flattened geometry definitions may be further restructured in a view dependent way. This could include selecting which [level of detail](https://en.wikipedia.org/wiki/Level_of_detail_(computer_graphics)) to use or [tessellating](https://en.wikipedia.org/wiki/Tessellation_(computer_graphics)) a high level surface definition into triangles.

### Vertex Processing

At this point all the geometry has been simplified into simple primitives (e.g. triangles, lines and points) defined by vertices. Vertices are defined using an (X,Y,Z) position together with an a set of application specific vertex attributes. They can include colors, normals, tangents, UV coordinates for texture mapping, object ids, and so on. The vertex processing stage transforms primitives in 3D local coordinates into primitives in 2D device coordinates (X and Y in pixels). Typically this will include transforming vertices into world space, evaluating lighting, projecting vertices into 2D, and clipping against the window boundary. Input vertex attributes are copied and/or transformed into output vertex attributes.

The user friendly camera definition is converted into a [4x4 homogeneous matrix](https://en.wikipedia.org/wiki/Transformation_matrix). This means that the full vertex transformation from local coordinates to 2D device coordinates can be implemented as a matrix multiplication. 

### Rasterize

Many different algorithms for rendering a 3D scene to a 2D image have been proposed over the years. However, for realtime 3D rendering, the heart of the graphics pipeline continuous to be [rasterization](https://en.wikipedia.org/wiki/Rasterisation) of triangles. The rasterization process identifies which pixels in the output image are covered by the triangle and may need to be updated. Rasterization generates a fragment for each pixel covered with a set of attributes for each. Most attributes are generated by [interpolating](http://courses.cms.caltech.edu/cs171/assignments/hw2/hw2-notes/notes-hw2.html) the triangle's vertex attributes across the face of the triangle. 

### Pixel Processing

The final stage is pixel processing. Input fragments are evaluated and used to update the output image buffer. Most commonly, the output buffer has depth and color per pixel. Depth in the incoming fragment is compared with the stored depth in the buffer which is updated if the fragment is closer than the existing pixel. 

Many other forms of processing are possible. For example, the fragments could include an alpha value for transparency which is used to blend together the existing and incoming color. 

## Change Agents

While the overall concept of the graphics pipeline has stayed the same, there have been significant changes in the implementation. There have been three main drivers of change.

First, the use of dedicated hardware for graphics. The main trend over time has been how the use of dedicated hardware has spread from right to left through the pipeline. 

Second, the evolution of graphics hardware from hard coded fixed functions to more generalized, programmable execution units. As we shift left in the pipeline we get more and more into the domain of the application. One size does not fit all, so some level of programmability is crucial to doing more with graphics hardware.

Finally, the evolution of graphics APIs. Applications don't access graphics hardware directly. They use an API. It doesn't matter if a capability exists in the hardware if the API doesn't let you make use of it. 

## History

{% include candid-image.html src="/assets/images/compact-graphics-pipeline.svg" alt="Graphics Pipeline Key" %}

Let's scrunch up my version of the graphics pipeline to make it more manageable. I will use variations of this diagram to illustrate how implementations have evolved over time. Stages will be color coded blue for fixed function hardware, orange for programmable hardware and green for software. A vertical dashed line will shown the boundary between application code and graphics API.

### 1991-2000 : The Fixed Function Pipeline 

{% include candid-image.html src="/assets/images/opengl-graphics-pipeline.svg" alt="Graphics Pipeline Key" %}

### 2001-2005 : Dedicated Vertex and Pixel Shaders

### 2006-2010 : Unified Shader Model

### 2011-2015 : Tesselation and Compute Shaders

### 2016-2020 : New APIs for General Purpose GPUs

### 2021+ : Ray Tracing and Machine Learning
