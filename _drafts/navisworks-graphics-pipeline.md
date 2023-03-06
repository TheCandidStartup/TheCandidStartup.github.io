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

### Amusing Anecdote

I made my first trip to Autodesk headquarters in San Francisco shortly after we'd first got the OGS integration working. I wangled a meeting with Autodesk's CTO, Jeff Kowalski, by offering to answer any questions he might have about Navisworks. He welcomed me to his office and asked his first question.

"Why are the graphics in Navisworks so crappy?"

I tried to explain that Navisworks was a working tool, not a Media & Entertainment product. It's more valuable for customer's to color code objects so they can understand what role they play in the building, rather than to have things look pretty. 

He wasn't buying it. Luckily, I had a demo of the OGS integration with me and was able to show him the OGS SSAO post-processing effect. [SSAO](https://en.wikipedia.org/wiki/Screen_space_ambient_occlusion) gives an impression of diffuse lighting by darkening creases, holes and surfaces that are close to each other. To my mind it just makes the model look grubby, but it seemed to make Jeff happy.

Coincidentally, there was a Navisworks user's group meeting that same week. I attended and showed a few of the upcoming features planned for Navisworks. I had high hopes for the SSAO demo given Jeff's reaction. 

Tumbleweeds. Total silence. People turning to each other and shrugging, bewildered. "I guess it looks nice, but what use is it?".

I swiftly moved on to what I thought was a minor feature. Navisworks had the ability to reload the overall model if any of the individual models aggregated together had changed. The new feature was that now only the individual model that changed would be reloaded, speeding up the time to update the overall model. 

Pandemonium. Whooping and cheering. People high-fiving each other. Which is how I learned that VPs don't always know what customers want.

## Details

### Prepare
