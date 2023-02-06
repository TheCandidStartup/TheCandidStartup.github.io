---
title: Implementing Pagination and Tagging with Jekyll
tags: blog
---

I previously gave you a guided tour of all the recent changes to the blog. I moved the full list of posts from the home page into a separate paginated *Posts* area and organized them into *Topics*. But how was it implemented?

The old home page came as standard with the [Cayman Blog](https://github.com/lorepirri/cayman-blog) Jekyll theme for [GitHub Pages](https://pages.github.com/). [Jekyll](https://github.com/jekyll/jekyll) has built in support for [Pagination](https://jekyllrb.com/docs/pagination/) and [Tags](https://jekyllrb.com/docs/posts/#tags-and-categories), so that was the obvious starting point. 

# Jekyll Primer

Jekyll is a great example of a tool that builds on other tools while making itself open to extension by means of a plugin mechanism. Jekyll sites are defined using a set of input files which are read, optionally transformed and written out as static web content. Transforms are supported for Markdown, HTML, Sass/Scss and CoffeeScript files. Sass/Scss source is compiled into a CSS stylesheet. CoffeeScript is converted to JavaScript. Where it gets interesting is the [rendering process](https://jekyllrb.com/docs/rendering-process/) for Markdown and HTML.

Each source file starts with a YAML front matter section which can be used to define page specific variables and configuration. These are accessible to the next stage which interprets Liquid expressions in the file. [Liquid](https://shopify.github.io/liquid/) is a templating language developed by Shopify. Liquid expressions use `{{ "{{ " }}}}` tags to insert content and `{{ "{% " }}%}` tags for logic and control flow. The language supports number, string, object and array variables with a decent selection of iteration and filtering constructs.

Additional variables are defined at the site level, including arrays of `post` objects. The latest posts section of the home page is defined using liquid expressions which iterate over the `site.posts` array, extracting and rendering page meta-data for each post. 

If the input file is in [Markdown](https://www.markdownguide.org/) format, it is now converted into html. 

The front matter for each source file can optionally define a layout property. This is an html file that can be used to define common content for a family of related pages. If a layout is defined, the rendering process is applied to the layout file with the output of the previous stage available as a `content` variable. The layout html file is defined like any other source file with a YAML front matter section. If that section includes a layout definition too, the process repeats again, allowing you to define hierarchies of layouts.

Typically you will organize your project so that your content is defined in markdown files with all the liquid magic used to generate custom html in your layouts.

# Cayman Blog Structure

The Cayman Blog theme comes with a set of scss files that define the stylesheet for the blog, together with four layouts. Most of the source is in the base `default` layout. It includes all the standard per page boiler plate, together with the site menu, header and footer. It inserts the input `content` between the header and footer.

The other three layouts are `page`, `post` and `home`. They're basically place holders that wrap some minimal html tags around their input `content`, which is then passed to the `default` layout. Posts use the `post` layout, the home page uses `home` and the *About*, *Contact* and *Now* pages use `page`.

Here's the `page` layout in full.

{% raw %}
```
---
layout: default
---
<article>

  <div>
    {{ content }}
  </div>

</article>
```
{% endraw %}

Hold on, doesn't the site header look different for home, posts and pages? How is that done? 

I'm glad you asked as I was wondering that too. If you look more closely at `default.html`, you'll see lots of conditional content like {% raw %}`{% if page.layout == 'home' %}`{% endraw %}.

# Pagination

The first change I made was to enable pagination. The [standard pagination plugin](https://jekyllrb.com/docs/pagination/) included with Jekyll has some limitations. For a start it only works with html source files. It works by repeatedly processing the source file for each page, setting up a `paginator` liquid object with metadata for the current page. It is hardcoded to paginate posts - you can't use it to paginate any other collections of pages you may define. There is a more recent [jekyll-paginate-v2](https://github.com/sverrirs/jekyll-paginate-v2) plugin with more features, but it isn't supported by GitHub pages. 

My home page is defined using Markdown and includes introductory content that makes no sense to duplicate on each page of posts. Clearly, I needed to define a separate area for my paginated list of posts. I created a new html source page using the `page` layout and added the front matter needed to add it to the site menu.

{% raw %}
```
---
layout: page
title: Posts
tagline: Every post from The Candid Startup
ref: blog
---

<ul class="post-list">
{% for post in paginator.posts %}
<li>
   ...
</li>
{% endfor %}
```
{% endraw %}

After some fiddling with the site config file needed to enable the paginator it worked. Jekyll generated two pages with 10 posts per page. With the unfortunate side effect that *each page* was added to the site menu.

# Site Menu

# Navigation Controls

# Tags

# Topic Cloud
