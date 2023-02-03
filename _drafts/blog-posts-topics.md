---
title: Posts and Topics
tags: blog
---

I've had a fun few days messing around with the blog. The trigger was some feedback from a first time visitor. They found the long, seemingly endlessly scrolling, list of posts intimidating and hard to navigate. I'd always planned to add more structure to the blog but that's hard to do without a reasonable amount of content to seed it with. Clearly, I now had enough posts to test out whatever navigation scheme I came up with.

{% include candid-image.html src="/assets/images/posts-topics/site-menu.png" alt="New Site Menu" %}

{% assign posts_page = site.pages | where: "ref", "blog" | first %}
The first difference you'll notice (if you're carefully scanning the home page left to right and top to bottom) are two new entries in the site menu: [Posts]({{ posts_page.url | absolute_url }}) and [Topics]({% link topic-index.html %}).

# Posts

*Posts* takes you to a paginated list of all my posts. I looked at a few different styles for pagination controls using the [Jekyll Showcase](https://jekyllrb.com/showcase/) of sites built with Jekyll. Eventually I settled on the approach used by the [Mozilla Release Management Blog](https://release.mozilla.org/). 

{% include candid-image.html src="/assets/images/posts-topics/posts.png" alt="Pagination and Topic badges" %}

I experimented with a few different options for placement. I wanted a decent number of posts on each page (some scrolling is inevitable) so decided on duplicating the navigation controls at the top and bottom of each page. Originally, I had them in the main body of the page. However, it wasted a lot of space at the top of the page and I couldn't get it to look right visually. 

I cracked it once I realized that I could move the controls into the page header. No additional space needed and the buttons look great with the page header background. I added a page footer with the same background for the controls at the bottom of the page.

The eagle eyed amongst you will have noticed the other new feature: topic badges. Each post is classified as relevant to one or more topics. For example, this post has the `Blog` badge. The topic badges are also buttons that take you to a page for each topic.

# Topics

The *Topics* site menu entry takes you to a page listing all the topics covered by my posts so far. Each topic has a dedicated page with a brief description and a list of all the posts on that topic. One subtle bit of design is that the topic badges on each post are ordered based on relevancy. 

{% include candid-image.html src="/assets/images/posts-topics/topic-badge-order.png" alt="Topic badge order is significant" %}

My [Serverless or Not?]({% link _posts/2022-12-05-serverless-or-not.md %}) post is mostly about AWS, but also touches on Cloud Architecture. Meanwhile, my [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) post is about Cloud Architecture in general, but uses AWS for some examples.

# A Post

Each post gets its own dedicated navigation controls. Once you're immersed in a post, you can use the controls to move straight to the next or previous post. You can also use the topic buttons to take you straight to more posts on the same topic.

{% include candid-image.html src="/assets/images/posts-topics/post-header.png" alt="Per post navigation Controls" %}

There's another bit of considered design here. There are multiple ways to reach a post. You could have come from the home page, the Posts page or a Topic page. So, what is the next post? Is it the next post chronologically, or the next post on that topic?

I decided to make it the next post chronologically. To provide an [affordance](https://www.merriam-webster.com/dictionary/affordance) for the user, the button is labelled with the date of the next post rather than the word "next".

# Home Page

Now that the complete list of posts has its own dedicated area, I can be a bit more considered about what lives on the home page. The intention is to encourage a first time visitor to explore further, rather than pressing the back button on their browser. The content is kept short with the hope that most of it will be visible [above the fold](https://en.wikipedia.org/wiki/Above_the_fold). 

## Latest Posts

This is a blog, so it's all about the posts. I've kept the latest posts section but restricted it to the most recent three posts. To keep things compact, the excerpt from each post is limited to 30 words (in the posts and topics areas you get the complete first paragraph).

What if the first three posts don't hook them? That's what the next two sections are for.

## More Posts

I want to provide a way for someone scanning the first three posts to know that we have more posts available and make it easy for them to dive in. It will break their flow if they have to look around to find the site menu. 

{% include candid-image.html src="/assets/images/posts-topics/more-posts.png" alt="Packing information into the More Posts link" %}

Originally I just added a *More Posts* link to the bottom of the list of the three latest posts. To make it flow visually I used the same style as a regular post link. But a regular post link has a date, and topic badges, and an excerpt.

I may have got a bit carried away. 

I'm pleased with how much context I managed to pack in. The date shows the range of dates for the remaining posts, giving you an impression of the scope of what's available. Similarly the topic badges let you know more of the topics covered here. As the blog grows, the list could get out of hand, so I've limited it to the 5 most popular topics. Having the badges in popularity order echoes the relevancy based order on each post. 

There's another subtle bit of design here. I'm limited to showing 5 badges. However, the user already knows the topics covered by the three latest posts. There's no point repeating those badges here. If those topics don't hook the visitor, I want to show them what other topics we have. So, I remove the already mentioned topics from the list.

Finally, I generate an excerpt that tells you exactly how many more posts and topics you have to look forward to.

## Hot Topics

If they make it all the way to the bottom of the page, there's one last treat in store for them. A word cloud showing each topic with the number of posts for that topic. 

{% include candid-image.html src="/assets/images/posts-topics/hot-topics.png" alt="Topic word cloud with number of posts for each topic" %}

Hmm. Maybe I should talk about something other than Autodesk ...

# Implementation

The old home page came as standard with the [Cayman Blog](https://github.com/lorepirri/cayman-blog) Jekyll theme for [GitHub Pages](https://pages.github.com/). [Jekyll](https://github.com/jekyll/jekyll) has built in support for [Pagination](https://jekyllrb.com/docs/pagination/) and [Tags](https://jekyllrb.com/docs/posts/#tags-and-categories), so that was the obvious starting point. 

## Jekyll Primer

Jekyll is a great example of a tool that builds on other tools while making itself open to extension by means of a plugin mechanism. Jekyll sites are defined using a set of input files which are read, optionally transformed and written out as static web content. Transforms are supported for Markdown, HTML, Sass/Scss and CoffeeScript files. Sass/Scss source is compiled into a CSS stylesheet. CoffeeScript is converted to JavaScript. Where it gets interesting is the [rendering process](https://jekyllrb.com/docs/rendering-process/) for Markdown and HTML.

Each source file starts with a YAML front matter section which can be used to define page specific variables and configuration. These are accessible to the next stage which interprets Liquid expressions in the file. [Liquid](https://shopify.github.io/liquid/) is a templating language developed by Shopify. Liquid expressions use `{{ "{{ " }}}}` tags to insert content and `{{ "{% " }}%}` tags for logic and control flow. The language supports number, string, object and array variables with a decent selection of iteration and filtering constructs.

Additional variables are defined at the site level, including arrays of `post` objects. The latest posts section of the home page is defined using liquid expressions which iterate over the `site.posts` array, extracting and rendering page meta-data for each post. 

If the input file is in [Markdown](https://www.markdownguide.org/) format, it is now converted into html. 

The front matter for each source file can optionally define a layout property. This is an html file that can be used to define common content for a family of related pages. If a layout is defined, the rendering process is applied to the layout file with the output of the previous stage available as a `content` variable. The layout html file is defined like any other source file with a YAML front matter section. If that section includes a layout definition too, the process repeats again, allowing you to define hierarchies of layouts.

Typically you will organize your project so that your content is defined in markdown files with all the liquid magic used to generate custom html in your layouts.

## Cayman Blog Structure

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

## Pagination

The first change I made was to enable pagination. The [standard pagination plugin](https://jekyllrb.com/docs/pagination/) included with Jekyll has some limitations. For a start it only works with html source files. It works by repeatedly processing the source file for each page, setting up a `paginator` liquid object with metadata for the current page. It is hardcoded to paginate posts - you can't use it to paginate any other collections of pages you may define. There is a more recent [jekyll-paginate-v2] plugin with more features, but it isn't supported by GitHub pages. 

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

## Site Menu

## Navigation Controls

## Tags

## Topic Cloud
