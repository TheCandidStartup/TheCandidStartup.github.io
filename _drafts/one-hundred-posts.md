---
title: One Hundred Posts
tags: blog
---

This is my hundredth post to the [Candid Startup]({{ '/' | absolute_url }}). As this is a special celebration, make sure you stick around until the end for an amazing free giveaway.

It feels like a good opportunity to take stock and reflect on how things have been going. I last did one of these reviews for my [one year anniversary]({% link _posts/2023-09-11-one-year-anniversary.md %}), and prior to that after [two months]({% link _posts/2022-11-14-blog-analytics.md %}) and [six months]({% link _posts/2023-03-20-blog-analytics.md %}).

Clearly I'm slowing down. I fiddle around with open source projects and blog about it for fun. I guess looking at analytics is less fun than it used to be. 

In the early days I was curious about the machinery of running a blog. As I've grown more familiar with it, I've lost interest in seeing which post gets marginally more views than another. I haven't really looked at the analytics since last year. 

I get the occasional email from Google when I hit a new milestone in search performance. Which does give me a little dopamine buzz. Other than that I've been [heads down coding]({% link _topics/react-virtual-scroll.md %}). 

{% include candid-image.html src="/assets/images/blog-analytics-august-2024/google-search-impact-july-2024.png" alt="Google Search Impact - 700 clicks in 28 days" %}

# Engage

Before we get into the graphs and top ten lists, a quick request from me. If you find my posts via LinkedIn or Twitter: react if you have a reaction, reply if you feel more than one of the pre-packaged emotions. 

If you have a GitHub account, you can leave a comment directly on the blog post itself. 

I get an even bigger dopamine buzz than automated emails from Google when I see real people engaging with the blog. 

# Analytics

All analytics are from the last 12 months. At time of capture, that's 19th August 2023 - 19th August 2024. Where relevant I've compared against the previous 12 months, which covers the complete lifetime of the blog. 

# Users

{% include candid-image.html src="/assets/images/blog-analytics-august-2024/users.png" alt="Users over last 12 months" %}

I should have looked sooner. All kinds of interesting things going on. First, Google Analytics is having trouble with tracking users. Doesn't matter what time period  I look at, the figure for "New Users" is pretty much the same as that for overall "Users".

Last year I was starting to see a shift in source of traffic towards Google Search. When I started the blog, almost everyone came from the links I posted on LinkedIn and Twitter. I still do that but to ever decreasing effect. A year ago, LinkedIn and direct traffic were neck and neck with Google. This year, they've been blown out of the water. New this year, is a small but significant amount of traffic from Microsoft Teams, Facebook and Bing. I have no idea how my stuff ended up on Facebook.

The huge spike at the beginning of last year is my never to be exceeded, "viral on LinkedIn", [Seven Reasons why I REALLY left Autodesk]({% link _posts/2022-10-18-leaving-autodesk.md %}) post. After that things have been fairly flat until April of this year. For some reason, since then, numbers have steadily climbed to over 200 a week. 

Finally, Google Analytics has a new feature. The two circles on the graph represent anomalies where there were 150% week over week increases in visitors. These weeks correspond to posting my [One Year Anniversary]({% link _posts/2023-09-11-one-year-anniversary.md %}) and [Legal Jeopardy]({% link _posts/2023-12-18-legal-jeopardy.md %}) posts. We'll see where they rank when we look at the post analytics later. 

# Demographics

{% include candid-image.html src="/assets/images/blog-analytics-august-2024/demographics.png" alt="Demographics over last 12 months" %}

Overall demographics, as summarized by the map, look similar to last time. However, there's been a huge shift in the proportions of users in different countries and cities. There's a massive jump in users from the United Kingdom and London. India has gone from nowhere to fourth place. 

# Posts

{% include candid-image.html src="/assets/images/blog-analytics-august-2024/top-25-posts.png" alt="Top 25 Posts over last 12 months" %}

Drum roll please. It's time for the top 25 posts over the last 12 months. Finally, I get a ranking where [Seven Reasons why I REALLY left Autodesk]({% link _posts/2022-10-18-leaving-autodesk.md %}) isn't on top. Don't worry, it's still number one over the lifetime of the blog, and lands at a respectable 18th for a post that's nearly two years old.

Which is why it's such a shock that the number one post during the last 12 months is even older! Now I know where all those additional United Kingdom users have come from. They're all having trouble figuring out how to use an external keyboard with a UK Mac.

Unbelievably, running it a close second, is a very technical post on setting up code coverage for the Vitest unit testing tool. I'm beginning to get a sense for what the most popular Google Search queries are likely to be.

The next three places are posts from a brief potter into the world of computer graphics. Maybe I should revisit. 

Finally, [Legal Jeopardy]({% link _posts/2023-12-18-legal-jeopardy.md %}) is 6th, and [One Year Anniversary]({% link _posts/2023-09-11-one-year-anniversary.md %}) is 22nd. [Legal Jeopardy]({% link _posts/2023-12-18-legal-jeopardy.md %}) got 6 times as many views as the previous weeks post, which explains the anomaly that Google flagged up. 

The other anomaly is more complex. [One Year Anniversary]({% link _posts/2023-09-11-one-year-anniversary.md %}) wasn't that popular. However, the week that I posted it saw a big jump in views for a handful of older posts. I suspect that Google may have indexed a bunch of additional pages that week. 

# Google Search

{% include candid-image.html src="/assets/images/blog-analytics-august-2024/google-search-console.png" alt="Google Search over last 12 months" %}

Wow. Compared to last year, I'm getting six times as many impressions and clicks. My average position in the search results has jumped from 39 to 19. For some reason, everything has ramped up significantly over the last few months. It's clear that this is where the growth in user visits has come from. 

I put a little bit of effort in at the end of April, trying to improve the number of pages being indexed. I requested a new crawl of the site through the [Google Search Console](https://search.google.com/search-console/about) a couple of times. I use my RSS feed as the sitemap for Google Search. I noticed that it was still using the default of the most recent 20 posts.  I increased it to 100 posts and resubmitted it. Maybe there was an effect or maybe it's just another change in Google's algorithm.

Let's have a look at which pages Google rates.

| Page | Impressions | Position | Clicks | Top Queries |
|-|-|-|-|
| [Making sense of British keyboard layouts on the Mac]({% link _posts/2022-10-07-mac-british-keyboards.md %}) | 129996 | 21 | 1282 | "uk keyboard layout", "mac keyboard layout", "british keyboard", "mac uk keyboard", "backslash on uk keyboard" + 1000 more
| [Vitest Code Coverage]({% link _posts/2024-03-18-vitest-code-coverage.md %}) | 39618 | 9 | 1075 | "vitest coverage", "v8 vs istanbul", "vitest exclude from coverage" + 340 more
| [Navisworks File Formats]({% link _posts/2023-10-30-navisworks-file-formats.md %}) | 15605 | 11 | 140 | "navisworks file formats", "nwd file type", "difference between nwd and nwf", "navisworks jetstream" + 170 more
| [Bootstrapping Vitest]({% link _posts/2024-03-11-bootstrapping-vitest.md %}) | 8421 | 18 | 96 | "vitest no test files found", "window is not defined vitest", "re-optimizing dependencies because vite config has changed", "vitest jsdom", "vitest globals" + 300 more
| [A Trip Down The Graphics Pipeline]({% link _posts/2023-03-13-trip-graphics-pipeline.md %}) | 6714 | 22 | 123 | "a trip through the graphics pipeline", "graphics pipeline", "gpu pipeline", "gpu driven rendering", "graphics pipeline stages" + 83 more
| [Implementing Pagination and Tagging with Jekyll]({% link _posts/2023-02-20-jekyll-pagination-tagging.md %}) | 5337 | 29 | 136 | "pagination tags", "pagination tag", "jekyll pagination", "jekyll paginate", "paginate liquid", "jekyll tags" + 19 more |
| [Bootstrapping Vite]({% link _posts/2023-10-23-bootstrapping-vite.md %}) | 5292 | 14 | 130 | "vite bootstrap", "how to use bootstrap in vite react" + 153 more
| [From Navisworks to Nanite]({% link _posts/2023-04-03-nanite-graphics-pipeline.md %}) | 4807 | 17 | 69 | "nanite siggraph", "nanite lod", "how does nanite work", "nanite virtualized geometry", "nanite occlusion culling", "nanite draw calls", "nanite limitations", "nanite visibility buffer" + 58 more
| [Modern React Virtual Scroll Grid]({% link _posts/2024-01-29-modern-react-virtual-scroll-grid.md %}) | 3421 | 16 | 80 | "react virtual scroll", "candid scroller", "react-window horizontal scroll", "modern react" + 73 more
| [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) | 3330 | 60 | 7 | "saas architecture", "saas product architecture", "saas deployment architecture", "modern saas architecture", "saas architecture diagram", "saas applications architecture", "aws saas architecture", "saas platform architecture", "modern saas" + 51 more |
| [AWS re:invent 2022]({% link _posts/2022-12-12-aws-reinvent-2022.md %}) | 2097 | 40 | 13 | "reinvent 4k run", "aws event driven architecture", "aws reinvent 2022", "aws replay 2022", + 59 more |
| [The Candid Startup]({{ '/' | absolute_url }}) | 1826 | 22 | 83 | "candid startup", "thecandid", "the candid" + 41 more

* Search for "candid startup" in Google Chrome signed into my Google account the top 5 results are me
* Same search in Chrome Incognito mode and I get the top 2 results
* All above the "People also ask" box

* Search for "mac keyboard layout" and I get this at the top of the results (below sponsored links)

{% include candid-image.html src="/assets/images/blog-analytics-august-2024/google-search-performance-box.png" alt="When Google spots you're testing searches" %}

Google knows when I'm googling myself

# LinkedIn

# Free Giveaway!



