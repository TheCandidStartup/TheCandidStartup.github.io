---
title: The Evolution of Computer Graphics
tags: computer-graphics
---

It seems like a long time since I described the [general areas for my initial projects]({% link _posts/2022-10-24-what-projects.md %}). I've talked a lot about my [cloud based, open source, serverless, customer deployed, scalable spreadsheet project]({% link _topics/spreadsheets.md %}). Today I'm going to switch gears and make a start on Interactive Viewing for Large Geometric Models. That's a bit of a mouthful, so let's call it [Computer Graphics]({% link _topics/computer-graphics.md %}) for short. 

Just like the spreadsheet project, I'm going to take my time and work my way up to the big reveal. First of all, what do I mean by Computer Graphics? How does it work? How has it changed over time?

## 3D Graphics Pipeline

The basic principles used for realtime 3D rendering have stayed pretty much unchanged. Your application has some representation of a 3D scene that it needs to render to a 2D screen. The [graphics pipeline](https://en.wikipedia.org/wiki/Graphics_pipeline) is a conceptual model that describes the steps required to get there. 

**IMAGE HERE**

There are many ways that a scene can be represented depending on the needs of your application. Often this takes the form of a [hierarchical scene graph](https://en.wikipedia.org/wiki/Scene_graph). Your application may support multiple types of geometry and material which can be reused by multiple objects.

The first step in the pipeline is to *Flatten* the rich scene description into independent render-able instances. Each instance has geometry, a material definition and a transform from the geometry's local coordinate system into a common world space. Flattening may result in an alternative representation of the scene better suited for rendering, or may happen on the fly by traversing the scene graph and rendering an instance each time a leaf is reached. Flattening may also include view independent restructuring of geometry and material definitions.

The remaining stages of the pipeline are view dependent. A camera definition defines how 3D coordinates are projected into 2D space. 

Once we've defined a view we can start *Culling*. We want to remove any instances that will not contribute to the final rendered result. This is purely a performance optimization but with large models is necessary to achieve realtime rendering speeds. There are many forms of culling. The most basic is frustum culling where any instance outside the camera's viewing volume (frustum) can be ignored. Over time, more sophisticated forms were introduced, as implementations became more capable. 

Next we move on to *Simplification*. The flattened geometry definitions may be further restructured in a view dependent way. This could include selecting which [level of detail](https://en.wikipedia.org/wiki/Level_of_detail_(computer_graphics)) to use or [tessellating](https://en.wikipedia.org/wiki/Tessellation_(computer_graphics)) a high level surface definition into triangles.

Transform and Lighting (T&L). The user friendly camera definition is converted into a [4x4 homogeneous matrix](https://en.wikipedia.org/wiki/Transformation_matrix).
* Model and Camera transform
* Lighting
* Projection
* Clipping
* Viewport transformation

[Rasterization](https://en.wikipedia.org/wiki/Rasterisation). 

Shading.

## History

