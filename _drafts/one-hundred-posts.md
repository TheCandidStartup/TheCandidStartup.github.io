---
title: One Hundred Posts
tags: blog
---

This is my hundredth post to the [Candid Startup]({{ '/' | absolute_url }}). As this is a special celebration, make sure you stick around until the end for an amazing free giveaway.

It feels like a good opportunity to take stock and reflect on how things have been going. I last did one of these reviews for my [one year anniversary]({% link _posts/2023-09-11-one-year-anniversary.md %}), and prior to that after [two months]({% link _posts/2022-11-14-blog-analytics.md %}) and [six months]({% link _posts/2023-03-20-blog-analytics.md %}).

Clearly I'm slowing down. I fiddle around with open source projects and blog about it for fun. I guess looking at analytics is less fun than it used to be. 

In the early days I was curious about the machinery of running a blog. As I've grown more familiar with it, I've lost interest in seeing which post gets marginally more views than another. I haven't really looked at the analytics since last year. 

I get the occasional email from Google when I hit a new milestone in search performance. Which does give me a little dopamine buzz. Other than that I've been [heads down coding]({% link _topics/react-virtual-scroll.md %}). 

{% include candid-image.html src="/assets/images/blog-analytics-august-2024/google-search-impact.png" alt="Google Search Impact - 700 clicks in 28 days" %}

# Engage

Before we get into the graphs and top ten lists, a quick request from me. If you find my posts via LinkedIn or Twitter: react if you have a reaction, reply if you feel more than one of the pre-packaged emotions. 

If you have a GitHub account, you can leave a comment directly on the blog post itself. 

I get an even bigger dopamine buzz than automated emails from Google when I see real people engaging with the blog. 

# Analytics

All analytics are from the last 12 months. At time of capture, that's 19th August 2023 - 19th August 2024. Where relevant I've compared against the previous 12 months, which covers the complete lifetime of the blog. 

# Users

{% include candid-image.html src="/assets/images/blog-analytics-august-2024/users.png" alt="Users over last 12 months" %}

I should have looked sooner. All kinds of interesting things going on. 

Last year I was starting to see a shift in source of traffic towards Google Search. When I started the blog, almost everyone came from the links I posted on LinkedIn and Twitter. I still do that but to ever decreasing effect. A year ago, LinkedIn and direct traffic were neck and neck with Google. This year, they've been blown out of the water. New this year, is a small but significant amount of traffic from Microsoft Teams, Facebook and Bing. I have no idea how my stuff ended up on Facebook.

It's strange that all users appear to be new users. Maybe Google Analytics is having trouble with tracking users, perhaps due to privacy preserving browsers. Alternatively, with the big increase in traffic via search, maybe most users are now one time visitors. 

The huge spike at the beginning of last year is my never to be exceeded, "viral on LinkedIn", [Seven Reasons why I REALLY left Autodesk]({% link _posts/2022-10-18-leaving-autodesk.md %}) post. After that things have been fairly flat until April of this year. Since then, numbers have steadily climbed to over 200 a week. 

Finally, Google Analytics has a new feature. The two circles on the graph represent anomalies where there were 150% week over week increases in visitors. These weeks correspond to posting my [One Year Anniversary]({% link _posts/2023-09-11-one-year-anniversary.md %}) and [Legal Jeopardy]({% link _posts/2023-12-18-legal-jeopardy.md %}) posts. We'll see where they rank when we look at the post analytics later. 

# Demographics

{% include candid-image.html src="/assets/images/blog-analytics-august-2024/demographics.png" alt="Demographics over last 12 months" %}

Overall demographics, as summarized by the map, look similar to last time. However, there's been a huge shift in the proportions of users in different countries and cities. There's a massive jump in users from the United Kingdom and London. India has gone from nowhere to fourth place. 

# Posts

{% include candid-image.html src="/assets/images/blog-analytics-august-2024/top-25-posts.png" alt="Top 25 Posts over last 12 months" %}

Drum roll please. It's time for the top 25 posts over the last 12 months. Finally, I get a ranking where [Seven Reasons why I REALLY left Autodesk]({% link _posts/2022-10-18-leaving-autodesk.md %}) isn't on top. Don't worry, it's still number one over the lifetime of the blog, and lands at a respectable 18th for a post that's nearly two years old.

Which is why it's such a shock that the number one post during the last 12 months is even older! Now I know where all those additional United Kingdom users have come from. They're all having trouble figuring out how to use the keyboard on a UK Mac.

Unbelievably, running it a close second, is a very technical post on setting up code coverage for the Vitest unit testing tool. I'm beginning to get a sense for what the most popular Google Search queries are likely to be.

The next three places are posts from a brief potter into the world of computer graphics. Maybe I should revisit. 

Finally, [Legal Jeopardy]({% link _posts/2023-12-18-legal-jeopardy.md %}) is 6th, and [One Year Anniversary]({% link _posts/2023-09-11-one-year-anniversary.md %}) is 22nd. [Legal Jeopardy]({% link _posts/2023-12-18-legal-jeopardy.md %}) got 6 times as many views as the previous weeks post, which explains the anomaly that Google flagged up. 

The other anomaly is more complex. [One Year Anniversary]({% link _posts/2023-09-11-one-year-anniversary.md %}) wasn't that popular. However, the week that I posted it saw a big jump in views for a handful of older posts. I suspect that Google may have indexed a bunch of additional pages that week. 

# Google Search

{% include candid-image.html src="/assets/images/blog-analytics-august-2024/google-search-console.png" alt="Google Search over last 12 months" %}

Wow. Compared to last year, I'm getting six times as many impressions and clicks. My average position in the search results has jumped from 39 to 19. For some reason, everything has ramped up significantly over the last few months. It's clear that this is where the growth in user visits has come from. 

I put a little bit of effort in at the end of April, trying to improve the number of pages being indexed. I requested a new crawl of the site through the [Google Search Console](https://search.google.com/search-console/about) a couple of times. 

I use my RSS feed as the sitemap for Google Search. I noticed that it only included the most recent 20 posts.  I increased it to 100 posts and resubmitted it. Maybe there was an effect or maybe it's just another change in Google's algorithm.

Let's have a look at the 10 pages with the highest number of impressions. Just for fun, I've also added in [The Candid Startup]({{ '/' | absolute_url }}) home page. 

An impression is counted each time a link to that page appears in Google Search's results. I also capture the average position within the results and, in bold, the highest position achieved for that page with the right query. You can then see how many times people clicked through to visit the page. 

I've changed the way I track the queries being used. It's no longer practical to report a list of actual queries. The most popular pages have over a thousand different queries (Google Search Console stops counting at 1000). Instead, I've extracted the most significant keywords used in queries. I show the percentage of impressions queried using each keyword. Keywords in bold are those included in the query that gets the highest position in the search results. Keywords in italic are used less than 1% of the time but are relevant to the content of the page.

| Page | Impressions | Position | Clicks | Query Keywords |
|-|-|-|-|
| [Making sense of British keyboard layouts on the Mac]({% link _posts/2022-10-07-mac-british-keyboards.md %}) | 129996 | 21 (**5**) | 1282 | **keyboard**(94%), **mac**(57%), **layout**(53%), **uk**(37%), british(13%), apple(6%), english(3%), backslash(3%), *karabiner*, *hidutil*, *applause*, *autodesk*
| [Vitest Code Coverage]({% link _posts/2024-03-18-vitest-code-coverage.md %}) | 39618 | 9 (**3**) | 1075 | **vitest**(89%), **coverage**(87%), **v8**(26%), **istanbul**(13%), **vs**(6%), vite(3%)
| [Navisworks File Formats]({% link _posts/2023-10-30-navisworks-file-formats.md %}) | 15605 | 11 (**7**) | 140 | file(86%), **navisworks**(64%), **format**(45%), type(38%), nwd(27%), extension(12%), nwc(3%), nwf(3%), import(2%)
| [Bootstrapping Vitest]({% link _posts/2024-03-11-bootstrapping-vitest.md %}) | 8421 | 18 (**5**) | 100 | **vitest**(80%), **found**(28%), **files**(25%), **exiting**(18%), dependencies(12%), vite(12%), config(10%), window(7%), jsdom(3%)
| [A Trip Down The Graphics Pipeline]({% link _posts/2023-03-13-trip-graphics-pipeline.md %}) | 6714 | 22 (**8**) | 123 | **pipeline**(93%), **graphics**(66%), **trip**(20%), gpu(16%), rendering(13%), down(9%), shader(1%), unified(1%)
| [Bootstrapping Vite]({% link _posts/2023-10-23-bootstrapping-vite.md %}) | 5473 | 14 (**9**) | 135 | **vite**(97%), **bootstrap**(82%), react(37%), localhost(2%), asdf(1%), *rollup*
| [Implementing Pagination and Tagging with Jekyll]({% link _posts/2023-02-20-jekyll-pagination-tagging.md %}) | 5337 | 29 (**11**) | 136 | **pagination**(96%), tag(66%), **jekyll**(35%), liquid(1%) |
| [From Navisworks to Nanite]({% link _posts/2023-04-03-nanite-graphics-pipeline.md %}) | 4807 | 17 (**6**) | 69 | **nanite**(95%), gpu driven material(27%), **visibility buffer**(14%), siggraph(11%), virtualized geometry(9%), lod(7%), culling(6%), cluster(5%), unreal(2%), pipeline(1%), texture(1%), *imposter*
| [Modern React Virtual Scroll Grid]({% link _posts/2024-01-29-modern-react-virtual-scroll-grid.md %}) | 3421 | 16 (**12**) | 80 | **scroll**(86%), react(60%), virtual(58%), **react-window**(12%), grid(8%), **horizontal**(4%), modern(3%)
| [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) | 3330 | 60 (**5**) | 7 | **sass**(96%), **architecture**(87%), diagram(13%), **modern**(10%), platform(9%), infrastructure(6%), service(6%), aws(5%), upstream(3%), downstream(3%) |
| [The Candid Startup]({{ '/' | absolute_url }}) | 1826 | 22 (**1**) | 83 | **candid**(99%), **the**(61%), **startup**(14%)

* Data with known query is a subset. For keyboards 80K impressions (342 clicks) have query data out of 130K impressions (1282 clicks) total. Proportion lower for less popular pages. 
* Average position for "candid startup" query is 2. 
* Search for "candid startup" in Google Chrome signed into my Google account the top 5 results are me
* Same search in Chrome Incognito mode and I get the top 2 results
* All above the "People also ask" box

* Search for "mac keyboard layout" and I get this at the top of the results (below sponsored links)

{% include candid-image.html src="/assets/images/blog-analytics-august-2024/google-search-performance-box.png" alt="When Google spots you're testing searches" %}

Google knows when I'm googling myself

* `(((keyboard|layout)\s*){2})+`
* `(((uk|british|english|mac|apple|keyboard|layout|hidutil|backslash|karabiner|autodesk|applause)\s*){1})+`
* uk 186 29.6K 352
* british 75 10.7K
* english 10 2.69K
* mac 306 45.6K 1000+
* apple 32 5.22K 193
* keyboard 338 74.9K 1000+
* layout 250 42.6K 452
* hidutil 0 46 4
* backslash 0 2.16K 113
* karabiner 1 844 84
* autodesk 0 32 2
* applause 0 54 7

* **keyboard**(94%), **mac**(57%), **layout**(53%), **uk**(37%), british(13%), apple(6%), english(3%), backslash(3%), *karabiner*, *hidutil*, *applause*, *autodesk*

* vitest 40.3k, 18.1K with query data
* v8 192 4.7k 39 26%
* istanbul 174 2.41k 36 13%
* vitest 198 16.2K 245 89%
* coverage 239 15.8K 141 87%
* vs 162 1.02K 20 6%
* vite 15 524 18 3%
* **vitest**(89%), **coverage**(87%), **v8**(26%), istanbul(13%), vs(6%), vite(3%)

* vitest coverage 8
* vitest coverage v8 5
* vitest coverage v8 vs istanbul 3

* NW file formats 15.6K, 6.4K with query data
* navisworks 64%
* nwd 27%
* nwf 3%
* nwc 3%
* format 45%
* type 38%
* import 2%
* extension 12%
* file 86%
* navisworks format - 7
* navisworks file format - 8
* file(86%), **navisworks**(64%), **format**(45%), type(38%), nwd(27%), extension(12%), nwc(3%), nwf(3%), import(2%)

* Bootstrap vitest 2771 out of 8421
* vitest 80%
* files 25%
* found 28%
* exiting 18%
* dependencies 12%
* config 10%
* jsdom 3%
* vite 12%
* window 7%

* vitest
* vitest files found exiting 5
* **vitest**(80%), **found**(28%), **files**(25%), **exiting**(18%), dependencies(12%), vite(12%), config(10%), window(7%), jsdom(3%)
* "vitest window is not defined", "vitest no test files found, existing with code 1", "re-optimizing dependencies because vite config has changed"


* Trip graphics pipeline 2554 out of 6803
* trip 20%
* down 9%
* graphics 66%
* pipeline 93%
* gpu 16%
* rendering 13%
* unified 0.7%
* shader 1%
* trip graphics pipeline 8
* **pipeline**(93%), **graphics**(66%), **trip**(20%), gpu(16%), rendering(13%), down(9%), shader(1%), unified(1%)

* Jekyll 1515 out of 5337
* pagination 96%
* tag 66%
* jekyll 35%
* liquid 1%
* jekyll pagination 11
* **pagination**(96%), tag(66%), **jekyll**(35%), liquid(1%)

* Bootstrapping vite 1590 out of 5473
* vite (97%)
* bootstrap (82%)
* react (37%)
* asdf (1%)
* localhost (2%)
* rollup
* bootstrap vite 9
* **vite**(97%), **bootstrap**(82%), react(37%), localhost(2%), asdf(1%), *rollup*

* nanite pipeline out of 763 out of 4859
* navisworks
* nanite (95%)
* pipeline (1%)
* visibility (9%)
* culling (6%) 
* gpu (28)
* driven (28%)
* material (27%)
* siggraph (11%)
* buffer (14%)
* virtualized (9%)
* culling (6%)
* cluster (5%)
* lod (7%) 
* unreal (2%)
* texture (1%) 
* imposter
* nanite gpu driven material - 9
* nanite visibility buffer - 6
* **nanite**(95%), gpu driven material(27%), **visibility buffer**(14%), siggraph(11%), virtualized geometry(9%), lod(7%), culling(6%), cluster(5%), unreal(2%), pipeline(1%), texture(1%), **imposter**

*  modern react grid 634 out of 3439
* modern(3%)
* react(60%)
* virtual(58%)
* scroll(86%)
* grid(8%)
* react-window(12%)
* horizontal(4%)
* react virtual scroll - 18
* react-window horizontal scroll - 12
* **scroll**(86%), react(60%), virtual(58%), **react-window**(12%), grid(8%), **horizontal**(4%), modern(3%)

* modern saas architecture 2752 out of 3330
* modern(10%)
* saas(96%)
* architecture(87%)
* infrastructure(6%)
* cloud(6%)
* platform(9%)
* diagram(13%)
* service(6%)
* api
* downstream(3%)
* upstream(3%)
* aws(5%)
* saas architecture diagram - 48
* modern saas architecture = 5 (but on live search 31)
* **sass**(96%), **architecture**(87%), diagram(13%), **modern**(10%), platform(9%), infrastructure(6%), service(6%), aws(5%), upstream(3%), downstream(3%)

* candid startup 1306 out of 1826
* the (61)
* candid (99%)
* startup (14%)
* **candid**(99%), **the**(61%), **startup**(14%)
* Top 11 links

# LinkedIn

# Free Giveaway!



