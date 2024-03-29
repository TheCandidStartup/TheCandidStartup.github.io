---
title: Implementing Pagination and Tagging with Jekyll
tags: blog
---

I previously gave you a [guided tour of all the recent changes to the blog]({% link _posts/2023-02-06-blog-posts-topics.md %}). I moved the full list of posts from the home page into a separate paginated *Posts* area and organized them into *Topics*. But how was it implemented?

The old home page came as standard with the [Cayman Blog](https://github.com/lorepirri/cayman-blog) Jekyll theme for [GitHub Pages](https://pages.github.com/). [Jekyll](https://github.com/jekyll/jekyll) has built in support for [Pagination](https://jekyllrb.com/docs/pagination/) and [Tags](https://jekyllrb.com/docs/posts/#tags-and-categories), so that was the obvious starting point.

## Jekyll Primer

Jekyll is a great example of a tool that builds on other tools while making itself open to extension by means of a plugin mechanism. Jekyll sites are defined using a set of input files which are read, optionally transformed and written out as static web content. Transforms are supported for Markdown, HTML, Sass/Scss and CoffeeScript files. Sass/Scss source is compiled into a CSS stylesheet. CoffeeScript is converted to JavaScript. The [rendering process](https://jekyllrb.com/docs/rendering-process/) for Markdown and HTML is where it gets interesting.

Each source file starts with a YAML front matter section which can be used to define page specific variables and configuration. These are accessible to the next stage which interprets Liquid expressions in the file. [Liquid](https://shopify.github.io/liquid/) is a templating language developed by Shopify. Liquid expressions use `{{ "{{ " }}}}` tags to insert content and `{{ "{% " }}%}` tags for logic and control flow. The language supports number, string, object and array variables with a decent selection of iteration and filtering constructs.

Additional variables are defined at the site level, including arrays of `post` objects. For example, the latest posts section of the home page is defined using liquid expressions which iterate over the `site.posts` array, extracting and rendering page meta-data for each post.

If the input file is in [Markdown](https://www.markdownguide.org/) format, it is now converted into html.

The front matter for each source file can optionally define a layout property. This is an html file that can be used to define common content for a family of related pages. If a layout is defined, the rendering process is applied to the layout file with the output of the previous stage provided to it as a `content` variable. The layout html file is defined like any other source file with a YAML front matter section. If that section includes a layout definition too, the process repeats again, allowing you to define hierarchies of layouts.

Typically you will organize your project so that your content is defined in simple markdown files with all the liquid magic used to generate custom html in your layouts.

## GitHub Pages

[GitHub Pages](https://pages.github.com/) is an integrated [CI/CD system](https://en.wikipedia.org/wiki/CI/CD) for GitHub repos which generates static websites from source in the repo. GitHub pages has [built in support for Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll) and a [basic set of themes and plugins](https://pages.github.com/versions/).

I like the idea of being able to make a change to the blog from anywhere and having the site automatically built and deployed. So, I will be sticking to features supported by GitHub pages.

## Cayman Blog Structure

Themes are normally managed and installed as Gems which keep your content and that supplied by the theme separate. GitHub pages doesn't have direct support for the Cayman Blog theme so you need to "install" it by copying files into your repo. I'm trying to keep my content separate from the copied theme files. If I do have to modify the theme files, I try to minimize the changes to make it easier to merge in upstream updates in future. If possible, I try to make generic changes that can be contributed back.

The Cayman Blog theme comes with a set of scss files that define the stylesheet for the blog, together with four layouts. Most of the logic is in the base `default` layout. It includes all the standard per page boiler plate, together with the site menu, header and footer. It inserts the input `content` between the header and footer.

The other three layouts are `page`, `post` and `home`. They're basically place holders that wrap some minimal html tags around their input `content`, which is then passed to the `default` layout. Posts use the `post` layout, the home page uses `home` and the *About*, *Contact* and *Now* pages use `page`.

Here's the `page` layout in full.

{% raw %}

```text
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

I'm glad you asked, as I was wondering that too. If you look more closely at [`default.html`](https://github.com/lorepirri/cayman-blog/blob/master/_layouts/default.html), you'll see lots of conditional content like {% raw %}`{% if page.layout == 'home' %}`{% endraw %}.

## Pagination

The first change I made was to enable pagination. The [standard pagination plugin](https://jekyllrb.com/docs/pagination/) included with Jekyll has some limitations. For a start it only works with html source files. It works by repeatedly processing the source file for each page, setting up a `paginator` liquid object with metadata for the current page. It is hardcoded to paginate `site.posts` - you can't use it to paginate any other collections of pages you may define. There is a more recent [jekyll-paginate-v2](https://github.com/sverrirs/jekyll-paginate-v2) plugin with more features, but it isn't supported by GitHub pages.

My home page is defined using Markdown and includes introductory content that makes no sense to duplicate on each page of posts. Clearly, I needed to define a separate area for my paginated list of posts. I created a new html source page using the `page` layout and set up the front matter so that the page would appear in the site menu.

{% raw %}

```text
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

After some fiddling with the site config to enable the paginator, it worked. Jekyll generated two pages with 10 posts per page. With the unfortunate side effect that *each page* was added separately to the site menu.

## Site Menu

By default, Cayman Blog constructs the site menu by looking for `ref` and (optionally) `order` properties in page front matter. It uses the liquid expression `site.pages | sort: "order" | map: "ref"` to sort the list of pages by `order` and then extract the value of each page's ref property, resulting in an array of ref values. Once the pagination plugin has run there are two pages with a `ref: blog` property which results in "Posts" appearing twice in the site menu.

My first thought was that I needed to hack in some de-duplication so that only one copy was included for each value of `ref`. Then I noticed that Cayman blog supports an alternative way of defining the site menu. You can use the site wide config file to directly define the array of `ref` values instead. That avoids the duplicate problem and has the added bonus of defining the site menu all in one place, with no need to fiddle around with `order` properties on multiple pages.

```text
header_page_refs: 
  - blog
  - topics
  - about
  - contact
  - now
```

Cayman Blog then iterates over the array of refs and retrieves the corresponding page to link to. It even uses the first page found if there are duplicates, which is exactly what I want.

{% raw %}

```text
{% for ref in header_page_refs %}
  {% assign my_page = site.pages | where: "ref", ref | first %}
  ...
{% endif %}
```

{% endraw %}

## Navigation Controls

So, I have pagination working and have figured out how to get Posts and Topics into the site menu, without having to hack any extra logic into `default.html`. Next, I need to add some navigation controls so that the user can jump from page to page. The [Jekyll documentation for pagination](https://jekyllrb.com/docs/pagination/) includes a couple of examples of doing this, the second of which was just what I wanted. I added the pagination example to my Posts page and it worked first time.

Now I had to make it look nice.

I used the style sheet from the [Mozilla Release Management Blog](https://release.mozilla.org/) as initial inspiration. Repo specific styles live in `assets/css/style.scss` so they are naturally separate from the theme files which are installed in the `_sass` directory.  Unfortunately, no matter how I tweaked the styles, I couldn't get something I was happy with. The buttons didn't look right on the page with the rest of the Cayman theme and I was using too much space at the top of the page before getting to meaningful content.

I noticed that the Cayman theme includes a button (used to add a "View on GitHub" button to the home page of project repo documentation). The button styling looks great but is intended to be part of the site header. Then I realized I could solve my second problem too, by moving the navigation controls into the bottom margin of the site header.

Unfortunately, that does involve hacking extra logic into `default.html`. However, I was able to make the changes generic. Here's the sum total of the logic I added.

{% raw %}

```text
{% if page.include_header %}
  {% include {{ page.include_header }} paginator=paginator %}
{% elsif layout.include_header %}
  {% include {{ layout.include_header }} paginator=paginator %}
{% endif %}
```

{% endraw %}

The idea is that you put all the pagination logic into a separate html source file that can be included in. You add an `include_header` property to the front matter of whichever page or layout you want to enable pagination for. The property specifies the source file to include. Only global variables (e.g site, page and layout) are accessible from included files, so I have to pass the paginator object explicitly. The parameter is ignored if pagination isn't active and there's no paginator object defined.

Having the pagination logic in a separate include makes it easy to reuse as a footer. The source page for the paginated posts now looks like this:

{% raw %}

```text
---
layout: page
title: Posts
tagline: Every post from The Candid Startup
ref: blog
include_header: pagination.html
---

<ul class="post-list">
{% for post in paginator.posts %}
<li>
  ...
</li>
{% endfor %}
</ul>

{% include pagination.html paginator=paginator footer=true %}
```

{% endraw %}

## Tags

The [Jekyll documentation](https://jekyllrb.com/docs/posts/#tags-and-categories) is very detailed when explaining how to add tags to a post. It's very sketchy when it comes to explaining how to process tagged posts to add topic badges to post excerpts and generate pages for each topic with corresponding lists of post excerpts. After consulting the wisdom of the internet, it seems there are two options. Either use the [jekyll-tagging plugin](https://github.com/pattex/jekyll-tagging) that does all the work for you (which isn't supported by GitHub Pages), or do most of the [heavy](https://longqian.me/2017/02/09/github-jekyll-tag/) [lifting](https://peterroelants.github.io/posts/adding-tags-to-github-pages/) by hand.

Doing it by hand is particularly awkward due to the way that Jekyll manages tags. You tag a post by adding a white space separated list of tags as a `tags` property in the front matter. Jekyll processes all the tagged pages to create a global list of all tags in `site.tags`. For each tag you get access to the name and a list of posts with that tag. So far so good. Presumably I can write liquid expressions like `site.tags | sort: "pages.size" | map "name"` to get a list of tag names in popularity order?

Well, no. Each tag in the `site.tags` array is itself an array with two elements. The first element is the name and the second is an array of pages. This is both clunky and immensely frustrating because you can't use any of the nice liquid filters that operate on arrays of objects. One of the limitations of jekyll is that you can't define objects yourself, you only have access to the ones provided by core jekyll and plugins. So, you can't make your life easier by building your own collection of tag objects.

You also can't generate a page per tag without using a script or plugin. If you use a script or plugin, it won't be supported by GitHub pages. I needed to manually create a page for each topic.

## Topics

I ended up with a structure that I'm pretty happy with. The one advantage of having an explicit page per topic is that you can add additional content, like a paragraph describing the topic.

I put all the complex logic in a new `topic.html` layout. I can't paginate these pages, so over time I will need to manage my use of tags to keep the number of posts with each tag under control.

{% raw %}

```text
---
layout: default
---

  <div class="candid-topic-summary">
  {{ content }}
  </div>

  <ul class="post-list">
    {% for post in site.tags[page.topic] %}
      <li>
         ...
      </li>
    {% endfor %}
  </ul>
```

{% endraw %}

There's one bit of magic here that I can't explain. It's not documented anywhere I can see, but [both]((https://longqian.me/2017/02/09/github-jekyll-tag/)) [examples](https://peterroelants.github.io/posts/adding-tags-to-github-pages/) of manually implementing tagging that I looked at use it. They access the collection of posts with a specific tag by indexing into the site.tags array *by name*. Somehow that is interpreted by Jekyll/Liquid to iterate over the `[tag, pages]` pairs in the array looking for one where the first element matches the name and to return the second element.

Each topic page can now be defined with some simple markdown.

```text
---
layout: topic
title: Blog
topic: blog
tagline: Blogging about the Blog
---

Building and managing the blog.
```

I use the Jekyll [Collections](https://jekyllrb.com/docs/collections/) feature to manage the topic pages. You put the pages that are part of the collection in a subfolder and Jekyll creates a site variable containing all the pages in the collection. In my case, `site.topics`. That makes it simple to create the "Topics" page that lists all topics.

## In-Post Navigation Controls

We've already done the groundwork for adding navigation controls to each post. All the logic is in a separate `post-nav.html` file which is included into the `post.html` layout.

{% raw %}

```text
---
layout: default
include_header: post-nav.html
---
  
<div itemprop="articleBody">
  {{ content }}
</div>

{% include post-nav.html footer=true %}
```

{% endraw %}

The in-post navigation controls include next and previous post as well as the topics for the post.

{% raw %}

```text
{% if page.previous %}
  <a href="{{ page.previous.url }}">&laquo; {{ page.previous.date }}</a>
{% endif %}
{% for tag in page.tags %}
  {% assign topic-page = site.topics | where: "topic", tag | first %}
  {% if topic-page %}
    <a href="{{ topic-page.url }}">{{ topic-page.title | escape }}</a>
  {% endif %}
{% endfor %}
{% if page.next %}
  <a href="{{ page.next.url }}">{{ page.next.date }} &raquo;</a>
{% endif %}
```

{% endraw %}

The only point of interest is that I use the tags to lookup the corresponding topic page. The title of the topic page is used to render the button rather than the "internal" tag name. If there's no corresponding topic, the tag is ignored.

## Topic Badges

I use the same approach to add topic badges to the post excerpts on the home page, paginated posts page and topic pages. I was tempted to pull this common logic into another include. Instead I heeded the [warning](https://jekyllrb.com/docs/includes/#passing-parameters-to-includes) in the Jekyll documentation to avoid using too many includes. Site build time in incremental mode is currently 0.6 seconds. I want to keep it under one second for a responsive *write, build, check* development cycle.

## Topic Cloud

So far, the logic has looked pretty clean. That's all going to change now the time has come to explain how you actually get a list of topics in popularity order. In order to sort anything you need an array of things that you can apply the `sort` filter to. Those things need to either be objects (in which case you can sort by any property of the object), or strings. As mentioned above, there are no tag objects and no way to make any.

Which leaves strings. I need to generate a string for each tag which includes number of posts and tag name in such a way that sorting the strings will get them in number of posts order. I can then iterate over the sorted array, splitting each string to retrieve the ordered tag names.

{% raw %}

```text
{% capture temptags %}
  {% for tag in site.tags %}
    {{ 20000 | minus: tag[1].size }}#{{ tag[0] }}#{{ tag[1].size }}
  {% endfor %}
{% endcapture %}
{% assign sortedtemptags = temptags | split:' ' | sort %}

{% capture sortedtemptagnames %}
{% for temptag in sortedtemptags %}
  {% assign tagitems = temptag | split: '#' %}
  {{ tagitems[1] }}
{% endfor %}
{% endcapture %}
{% assign sortedtagnames = sortedtemptagnames | split:' ' %}
```

{% endraw %}

This will take some unpacking. The first block generates strings like `19995#blog`, one per line, then captures the whole thing as a variable. The variable is split on white space into an array of strings which are then sorted in alphanumeric order. Subtracting the number of posts from 20000 for each tag does two things. First, it ensures that every string has the same number of digits (as long as there are less than 10000 posts per tag). That means a string based sort will work correctly. Second, it means that the tags will be sorted from largest to smallest number of posts per tag, then alphabetically by tag name where tags have the same number of posts.

The second block iterates over the sorted strings, splitting out the tag name part and then doing the capture and split trick again to get a sorted array of tag names. 

Believe me, I've looked for alternatives, but in this case the wisdom of the internet hasn't revealed anything better. If the Jekyll maintainers happen to be reading this, it would be great if you could add support for {% raw %}`{% captureyaml %}`{% endraw %}. This would capture rendered text as normal, then parse it as YAML and store the resulting structure in the variable. You already have a YAML parser for the front matter that does the same thing for site and page variables. I would then have a way of creating objects with name and count properties which I can use with the sort and map filters.

Once I have the sorted tag names, the rest of it is simple enough. I generate the badges in the topic cloud in the normal way, by iterating over the sorted tag names. The only difference is that I add the number of posts to each topic title using {% raw %}`{{ topic-page.title }} ({{ site.tags[tagname] | size }})`{% endraw %}

For the badges on the "More Posts" link (filtered to remove those used on the first three post excerpts) I use:

{% raw %}

```text
{% assign tagsleft = sortedtagnames %}
{% for post in site.posts limit:3 %}
  {% for tag in post.tags %}
    {% assign tagsleft = tagsleft | where_exp:"item", "item != tag" %}
  {% endfor %}
{% endfor %}

{% for tag in tagsleft limit: 5%}
  ...
```

{% endraw %}

And that's it. More than you ever wanted to know about pagination and tagging with Jekyll.
