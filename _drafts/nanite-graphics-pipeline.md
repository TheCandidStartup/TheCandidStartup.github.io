---
title: From Navisworks to Nanite
tags: computer-graphics navisworks
---

The [Navisworks Graphics Pipeline]({% link _drafts/navisworks-graphics-pipeline.md %}) last got a serious overhaul more then ten years ago. I want to find out how you could implement something like Navisworks with a modern pipeline. As a starting point, I've decided to have a look at the [Nanite](https://docs.unrealengine.com/5.1/en-US/nanite-virtualized-geometry-in-unreal-engine/) pipeline introduced with [Unreal Engine 5](https://docs.unrealengine.com/5.1/en-US/).

{% capture pipelines_url %}
{% link _drafts/evolution-computer-graphics.md  %}
{% endcapture %}

Unreal is a mainstream games engine with a [long history](https://en.wikipedia.org/wiki/Unreal_Engine). It has been through the evolution from [Fixed Function Pipelines]({{pipelines_url | strip | append: "#1991-2000--the-fixed-function-pipeline"}}), through [Programmable Shaders]({{pipelines_url | strip | append: "#2001-2005--programmable-vertex-and-fragment-shaders"}}), onto [Deferred Shading]({{pipelines_url | strip | append: "#2006-2010--unified-shader-model"}}) and now to [GPU Driven Rendering]({{pipelines_url | strip | append: "#2016-2020--new-apis-for-general-purpose-gpus"}}). 

Nanite is particularly interesting because it's the first time I've seen a games engine with a similar philosophy to Navisworks. Brian Karis, engineering fellow at Epic Games, describes their thinking in his [Siggraph Presentation](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf) from 2021. 

> Many years ago I got to see the impact that a virtual texturing system could have on an art team.
> How freeing it was for the artists to use giant textures wherever they wanted and not to have to worry about memory budgets.
> Ever since I’ve dreamt of the day where we could do the same for geometry.
> The impact could be even greater.
> No more budgets for geometry would mean no more concern over polycounts, draw calls, or memory.
> Without those limitations artists could directly use film quality assets without wasting any time manually optimizing for use in real-time.
> It’s ridiculous how much time is wasted in optimizing art content to hit framerate.

The engine source code is [easily accessible](https://www.unrealengine.com/en-US/ue-on-github). While not Open Source, the license allows you to read, build and modify the source for your own purposes. You can freely distribute any product you build using the engine (as long as any revenue you receive is below $1,000,000). In theory, this gives me a state of the art GPU rendering pipeline to experiment with.  

{% include candid-image.html src="/assets/images/nanite-graphics-pipeline.svg" alt="Nanite Graphics Pipeline" %}