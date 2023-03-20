---
title: Six Months In
tags: blog
---

It's been six months since I started the blog. High time to have another look at the analytics. You might want to keep the [previous analytics review]({% link _posts/2022-11-14-blog-analytics.md %}) handy so you can compare and contrast.

I've settled into a cadence of posting weekly on a Monday. That gives me a chance to review whatever I wrote the previous week with fresh eyes and make any final tweaks. I usually have two or three drafts queued up, so haven't found it difficult to keep to the schedule. As I write this, I have 26 posts published, so despite taking a week off at Christmas I'm still on target for 52 posts over the year.

## Users

{% include candid-image.html src="/assets/images/blog-analytics-march-2023/users-90-days.png" alt="Change in Users last quarter vs previous" %}

I've extended the comparison window to a bit over 90 days, so that the preceding period includes the initial flurry of activity when I spammed half of Autodesk with news of my retirement. 

Oh dear. That doesn't look too healthy. Last time I had 1500 users over two months, now I'm down to 650 over three months. 

There are two big outliers in the first two months data. The first spike is all the people at Autodesk who read my retirement announcement and followed the link to the blog. The second, massive spike, is when my "[Seven Reasons why I REALLY left Autodesk]({% link _posts/2022-10-18-leaving-autodesk.md %})" post went viral (in an understated way) on LinkedIn. The smaller spikes to the right are all aftershocks where someone sparks a new round of sharing. Maybe I should have kept going with the clickbait titles?

{% include candid-image.html src="/assets/images/blog-analytics-march-2023/users-60-days.png" alt="Change in Users last 60 days vs previous" %}

What does it look like if I exclude the outliers from those first two months? It's pretty flat. You can't read much into the trends because it really depends on which out of a random pair of blog posts resonated more. Depending on how I change the comparison window, I can get anywhere between a 10% decrease and a 10% increase.

## Demographics

{% include candid-image.html src="/assets/images/blog-analytics-march-2023/user-map.png" alt="Users by Country Map" %}

How are those 400 users over the last two months distributed? Similar to last time. A few places have shifted up or down on the chart. Sheffield is now the most represented city. I wonder how many of those are from my own devices?

|![Users by Country List](/assets/images/blog-analytics-march-2023/user-countries.png)|![Users by City](/assets/images/blog-analytics-march-2023/users-towns.png)|

## Posts

{% include candid-image.html src="/assets/images/blog-analytics-march-2023/posts-all.png" alt="Posts - All Time List" %}

No surprise about what's in the number one spot on the all time list of most popular pages. The top 3 are exactly the same as the previous review. 

| 7 Nov - 7 Jan | 8 Jan - 12 Mar |
|-|-|
|![Users by Country List](/assets/images/blog-analytics-march-2023/posts-q4.png)|![Users by City](/assets/images/blog-analytics-march-2023/posts-q1.png)|

Let's remove the outliers again and compare the last two months against the previous two. The home page is now consistently the most popular. "Seven Reasons" continues to get a significant number of views, enough to keep it in the top 10. 

Most posts follow the same pattern. An initial flurry of views in the first week, a few people catching up the week after and then that's about it. 

{% include candid-image.html src="/assets/images/blog-analytics-march-2023/future-platform-views-per-day.png" alt="Future Platform - Views per Day" %}

You would expect the top posts to change every couple of months. "Seven Reasons" is one exception as the after shocks keep coming. The other, weirdly, is "[Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %})". I don't think I could have come up with a less clickbait title and yet there it is with a very respectable 250 views in its first two months and another 50 in the following two. 

## Sources

{% include candid-image.html src="/assets/images/blog-analytics-march-2023/sources.png" alt="Sources of Traffic" %}

As might be expected, direct traffic and traffic from LinkedIn fell proportionally with the overall fall in users. Twitter was flat, but traffic from Google more than doubled. At last, something to be optimistic about.

There's still a handful of users from GitHub, Teams and Bing. Judging by the number of sessions, you're all regularly returning visitors.

## LinkedIn

{% include candid-image.html src="/assets/images/blog-analytics-march-2023/linkedin-impressions.png" alt="LinkedIn Impressions - last 90 days" %}

LinkedIn impressions are down in line with everything else. The less often links to my posts appear in people's feeds, the less chance they'll click through. But what does LinkedIn use to decide whether to show my links to more people? Well, there seems to be a strong correlation with the amount of engagement (likes + comments) that a post gets. The more people see a post, the more likely that there will be more engagement. At some point, like with "Seven Reasons", you establish a positive feedback loop and go viral.

{% include candid-image.html src="/assets/images/blog-analytics-march-2023/linkedin-top-posts.png" alt="Top Posts according to LinkedIn" %}

## Search

Time to end on a high. What's driving the increased traffic from Google? Let's head over to the search console to find out.

{% include candid-image.html src="/assets/images/blog-analytics-march-2023/google-impressions.png" alt="Google Impressions - last 90 days" %}

Wow. At last a graph that goes up and to the right. We've gone from 39 impressions in Google search results to 4600 in the last three months. Average position is 47 (well below the fold) so that translates into the princely sum of 75 clicks. 

Welcome to you all. What were you looking for?

| Page | Impressions | Position | Clicks | Top Queries |
|-|-|-|-|
| [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) | 3173 | 54 | 15 | "saas architecture", "saas product architecture", "saas deployment architecture", "modern saas architecture", "saas architecture diagram", "saas applications architecture", "aws saas architecture", "saas platform architecture", "modern saas", "saas infrastructure architecture" + 45 more |
| [AWS re:invent 2022]({% link _posts/2022-12-12-aws-reinvent-2022.md %}) | 979 | 29 | 10 | "aws event driven architecture", "aws cell based architecture", "cell based architecture aws", "aws replay 2022", "aws reinvent 2022 recordings" + 38 more |
| [The Candid Startup]({{ '/' | absolute_url }}) | 979 | 13 | 31 | "candid startup", "thecandid", "the candid", "startup org", "startup blog" |
| [Organizational Anti-Patterns #1: VP Moves]({% link _posts/2022-10-31-organizational-anti-pattern-vp-moves.md %}) | 123 | 81 | 0 | "inverse conway maneuver", "vp move" |
| [Implementing Pagination and Tagging with Jekyll]({% link _posts/2023-02-20-jekyll-pagination-tagging.md %}) | 119 | 42 | 4 | "pagination tags", "pagination tag", "jekyll paginator", "jekyll pagination", "jekyll paginate", "paginate liquid", "shopify liquid paginate", "jekyll sort by date" |
| [Spreadsheets are the Future of Data Systems]({% link _posts/2023-01-09-spreadsheets-future-data-systems.md %}) | 94 | 42 | 1 | "is google sheets turing complete", "cloud spreadsheet database", "is excel turing complete", "excel turing complete" |
| [The Evolution of Multi-Tenant Architecture]({% link _posts/2022-11-07-evolution-multi-tenant-architecture.md %}) | 89 | 52 | 5 | "what is multi tenant architecture", "multi tenant web application architecture", "tenant meaning in computer" + 8 more |
| [The Seven Reasons why I REALLY left Autodesk]({% link _posts/2022-10-18-leaving-autodesk.md %}) | 39 | 17 | 3 | "autodesk rsu" |
| [Setting up my Mac for local blog development]({% link _posts/2022-09-21-mac-local-blog-dev.md %}) | 30 | 36 | 1 | "jekyll startup" |
| [Organizational Anti-Patterns #5: The Future Platform]({% link _posts/2023-02-13-organizational-anti-pattern-future-platform.md %}) | 23 | 14 | 1 | "inner-platform effect" |

There's clearly a market out there for information on SaaS architecture. Shame so few got to the third page of Google results and clicked through. 

What were the search results with the highest position? Presumably these are the ones where Google thought my content was most relevant.

| Query | Position | Impressions | Clicks | Page |
|-|-|-|-|
| *upstream vs downstream service* | 1 | 7 | 0 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| *what are downstream services* | 1 | 3 | 0 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| *upstream services* | 1 | 2 | 0 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| *sass architecture* | 1 | 2 | 0 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| *client service architecture* | 1 | 1 | 0 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| candid startup | 4 | 69 | 12 | [The Candid Startup]({{ '/' | absolute_url }}) |
| *vp move* | 5 | 1 | 0 | [Organizational Anti-Patterns #1: VP Moves]({% link _posts/2022-10-31-organizational-anti-pattern-vp-moves.md %}) |
| modern saas architecture | 7 | 31 | 1 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| *paas architecture diagram* | 7 | 1 | 0 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| *saas load balancer* | 10 | 1 | 0 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| *demographics via candid* | 10 | 1 | 0 | [How's that blog of yours working out?](/_posts/2022-11-14-blog-analytics.md) |
| *is google sheets turing complete* | 11 | 10 | 0 | [Spreadsheets are the Future of Data Systems]({% link _posts/2023-01-09-spreadsheets-future-data-systems.md %}) |
| thecandid | 15 | 59 | 1 | [The Candid Startup]({{ '/' | absolute_url }}) |
| cell based architecture aws | 27 | 6  | 0 | [AWS re:invent 2022]({% link _posts/2022-12-12-aws-reinvent-2022.md %}) |
| sass microservices architecture | 30 | 44 | 0 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| aws cell based architecture | 30 | 10 | 0 | [AWS re:invent 2022]({% link _posts/2022-12-12-aws-reinvent-2022.md %}) |
| saas backend architecture | 30 | 4 | 0 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| the candid | 31 | 16 | 0 | [The Candid Startup]({{ '/' | absolute_url }}) |
| saas product architecture | 41 | 358 | 1 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| aws replay 2022 | 42 | 3  | 0 | [AWS re:invent 2022]({% link _posts/2022-12-12-aws-reinvent-2022.md %}) |
| aws sam appsync | 43 | 4  | 0 | [AWS re:invent 2022]({% link _posts/2022-12-12-aws-reinvent-2022.md %}) |
| tim wiegand | 43 | 1 | 0 | [Now]({% link now.md %}) |
| saas architecture | 45 | 903 | 1 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| saas deployment architecture | 45 | 101 | 1 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |
| cloud saas architecture | 45 | 16 | 0 | [Modern SaaS Architecture]({% link _posts/2022-11-28-modern-saas-architecture.md %}) |

Look at that. Number one for some surprisingly generic search terms. But only for a small number of impressions. Wonder what happens when I use those search terms now? 

Ahh. Some weird hiccup in the Google algorithm. I've marked the queries that no longer return results for the blog in italic. 

At least I totally own "candid startup" and "modern saas architecture". If not "tim wiegand".
