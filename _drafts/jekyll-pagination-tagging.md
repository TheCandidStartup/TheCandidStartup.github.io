---
title: Implementing Pagination and Tagging with Jekyll
tags: blog
---

I previously gave you a [guided tour of all the recent changes to the blog]({% link _posts/2023-02-06-blog-posts-topics.md %}). I moved the full list of posts from the home page into a separate paginated *Posts* area and organized them into *Topics*. But how was it implemented?

The old home page came as standard with the [Cayman Blog](https://github.com/lorepirri/cayman-blog) Jekyll theme for [GitHub Pages](https://pages.github.com/). [Jekyll](https://github.com/jekyll/jekyll) has built in support for [Pagination](https://jekyllrb.com/docs/pagination/) and [Tags](https://jekyllrb.com/docs/posts/#tags-and-categories), so that was the obvious starting point. 

# Jekyll Primer

Jekyll is a great example of a tool that builds on other tools while making itself open to extension by means of a plugin mechanism. Jekyll sites are defined using a set of input files which are read, optionally transformed and written out as static web content. Transforms are supported for Markdown, HTML, Sass/Scss and CoffeeScript files. Sass/Scss source is compiled into a CSS stylesheet. CoffeeScript is converted to JavaScript. Where it gets interesting is the [rendering process](https://jekyllrb.com/docs/rendering-process/) for Markdown and HTML.

Each source file starts with a YAML front matter section which can be used to define page specific variables and configuration. These are accessible to the next stage which interprets Liquid expressions in the file. [Liquid](https://shopify.github.io/liquid/) is a templating language developed by Shopify. Liquid expressions use `{{ "{{ " }}}}` tags to insert content and `{{ "{% " }}%}` tags for logic and control flow. The language supports number, string, object and array variables with a decent selection of iteration and filtering constructs.

Additional variables are defined at the site level, including arrays of `post` objects. The latest posts section of the home page is defined using liquid expressions which iterate over the `site.posts` array, extracting and rendering page meta-data for each post. 

If the input file is in [Markdown](https://www.markdownguide.org/) format, it is now converted into html. 

The front matter for each source file can optionally define a layout property. This is an html file that can be used to define common content for a family of related pages. If a layout is defined, the rendering process is applied to the layout file with the output of the previous stage available as a `content` variable. The layout html file is defined like any other source file with a YAML front matter section. If that section includes a layout definition too, the process repeats again, allowing you to define hierarchies of layouts.

Typically you will organize your project so that your content is defined in markdown files with all the liquid magic used to generate custom html in your layouts.

# GitHub Pages

[GitHub Pages](https://pages.github.com/) is an integrated [CI/CD system](https://en.wikipedia.org/wiki/CI/CD) for GitHub repos which generates static websites from source in the repo. GitHub pages has [built in support for Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll) and a [basic set of themes and plugins](https://pages.github.com/versions/). 

I like the idea of being able to make a change to the blog from anywhere and having the site automatically built and deployed. So, I will be sticking to features supported by GitHub pages.

# Cayman Blog Structure

Themes are normally managed and installed as Gems which keep your content and that supplied by the theme separate. GitHub pages doesn't have direct support for the Cayman Blog theme so you need to "install" it by copying files into your repo. I'm trying to keep my content separate from the copied theme files. If I do have to modify the theme files, I try to minimize the changes to make it easier to merge in upstream updates in future. If possible, I try to make generic changes that can be contributed back.

The Cayman Blog theme comes with a set of scss files that define the stylesheet for the blog, together with four layouts. Most of the logic is in the base `default` layout. It includes all the standard per page boiler plate, together with the site menu, header and footer. It inserts the input `content` between the header and footer.

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

After some fiddling with the site config file needed to enable the paginator, it worked. Jekyll generated two pages with 10 posts per page. With the unfortunate side effect that *each page* was added separately to the site menu.

# Site Menu

By default, Cayman Blog constructs the site menu by looking for `ref` and (optionally) `order` properties in page front matter. It uses a liquid expression to sort the list of pages by `order` property and then extract the value of each pages ref property resulting in an array of ref values: `site.pages | sort: "order" | map: "ref"`. Once the pagination plugin has run there are two pages with a `ref: blog` property which results in "Posts" appearing twice in the site menu.

My first thought was that I needed to hack in some de-duplication so that only one copy was included for each value of `ref`. Then I noticed that Cayman blog supports an alternate way of defining the site menu. You can use the site wide config file to directly define the array of `ref` values instead. That avoids the duplicate problem and has the added bonus of defining the site menu all in one place with no need to fiddle around with `order` properties on multiple pages.

```
header_page_refs: 
  - blog
  - topics
  - about
  - contact
  - now
  ```

Cayman Blog then iterates over the array of refs and retrieves the corresponding page to link to. It even uses the first page found if there are duplicates which, is exactly what I want.

{% raw %}
```
{% for ref in page_refs %}
  {% assign my_page = site.pages | where: "ref", ref | first %}
  ...
{% endif %}
```
{% endraw %}

# Navigation Controls

So, I have pagination working and have figured out how to get Posts and Topics into the site menu, without having to hack any extra logic into `default.html`. Next, I need to add some navigation controls so that the user can jump from page to page. The [Jekyll documentation for pagination](https://jekyllrb.com/docs/pagination/) includes a couple of examples of doing this, the second of which was just what I wanted. I added the pagination example to my Posts page and it worked first time. 

Now I had to make it look nice.

I used the style sheet from the [Mozilla Release Management Blog](https://release.mozilla.org/) as initial inspiration. I added my own scss file to keep my styles separate from those that came with the Cayman Blog theme. Unfortunately, no matter how I tweaked the styles, I couldn't get something I was happy with. The buttons didn't look right on the page with the rest of the Cayman theme and I was using to much space at the top of the page before getting to meaningful content.

I noticed that the Cayman Blog theme includes a button (used to add a "View on GitHub" button to the home page of project repo documentation). The button styling looks great but is intended to be part of the site header. Then I realized I could solve my second problem too by moving the navigation controls into the bottom margin of the site header.

Unfortunately, that does involve hacking extra logic into `default.html`. Fortunately, I was able to make the changes generically. 

# Tags

# In Post Navigation Controls

# Topic Cloud
