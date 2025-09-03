---
title: Rewriting History
tags: blog
---

This is a blog, not a set of living documents. Each post is a moment in time. However, time passes, and sometimes you find things that are wrong in an old post. 

So far I've dealt with errors in an ad hoc way. I now feel the need to be slightly more formal and document the process.

# Site Navigation

I fiddle around with the site navigation all the time. If I write a new post in a series, I'll go back to the previous post and add a "next post" link. If I have too many posts for a particular topic, I'll split it into sub-topics and re-classify the existing posts. 

In the early days of the blog I added a new method of embedding images and updated all the existing posts to use it. 

# Typos and Broken Links

There's no need to be precious about simple errors. If I see a typo or a broken link I'll just fix it. No need to make a song and dance about it.

* [Event Sourced Spreadsheet Data]({% link _posts/2025-06-02-event-sourced-spreadsheet-data.md %}) - Broken source code formatting
* [Styling React Components with CSS]({% link _posts/2024-08-26-css-react-components.md %}) - Fixed a typo in a code sample
* [React Virtual Scroll 0.6.x : Consciously Uncoupling]({% link _posts/2024-11-18-react-virtual-scroll-0-6-x.md %}) - Broken source code formatting
* [Making sense of British keyboard layouts on the Mac]({% link _posts/2022-10-07-mac-british-keyboards.md %}) - Typo, removed repeated word
* [Brainstorming and Benchmarking]({% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}) - Improved table formatting
* [Denormalized Relational Database Grid View]({% link _posts/2023-07-10-denormalized-relational-database-grid-view.md %}) - Typo in sample data
* [The Ubiquitous Database Grid View]({% link _posts/2023-06-12-database-grid-view.md %}) - Typo, "data" should have been "date"
* [Organizational Anti-Patterns #7: Product Managers]({% link _posts/2023-04-24-organizational-anti-pattern-product-managers.md %}) - Typo, "partneship" should have been "partnership"
* [Brainstorming and Benchmarking]({% link _posts/2023-02-27-brainstorming-and-benchmarking.md %}) - Typo, "existinb" should have been "existing".
* [Organizational Anti-Patterns #2: The Old New Thing]({% link _posts/2022-11-21-organizational-anti-pattern-old-new-thing.md %}) - Multiple typos

# Simple Factual Errors and Omissions

This approach extends to simple factual errors. If I see an error that was also an error *at the time* I wrote the blog, and it's a simple one liner kind of change, I'll fix that too.

* [Vodafone Openreach Full Fibre Broadband Install]({% link _posts/2023-04-10-fibre-broadband-install.md %}) - Added a link with more detailed information to a comment about disconnecting extension wiring from a phone line
* [A Trip Down The Graphics Pipeline]({% link _posts/2023-03-13-trip-graphics-pipeline.md %}) - Corrected description of what data is stored in a G-Buffer

# Comments

Where I've made larger scale changes to an existing post, I'll add a comment that explains what I've done. A comment is clearly meta-information about the post and identifies who made the change and when.

The changes made are still small scale and don't change the structure or meaning of the original post. In most cases the changes were made within a couple of weeks of publication. 

* [Bootstrapping NPM Provenance with GitHub Actions]({% link _posts/2024-06-24-bootstrapping-npm-provenance-github-actions.md %}) - I discovered a problem with the GitHub actions workflow I was describing the day after publication. Once I'd fixed it, I updated the source code in the post to match, together with a comment explaining what had happened. 
* [Making Spreadsheet Snapshots work with Insert and Delete]({% link _posts/2023-06-05-spreadsheet-insert-delete.md %}) - I rewrote a couple of paragraphs after I came up with a better approach. Added a comment to explain what I'd done. 
* [Unique Ids]({% link _posts/2023-09-24-unique-ids.md %}) - Got great feedback on this post and addressed the points raised as comments.

There's one post that I updated before I realized I could use comments to track changes. In this case, I added a Revisions section at the end listing the changes.
* [Serverless or Not?]({% link _posts/2022-12-05-serverless-or-not.md %}) - Added new rows to tables of serverless services after new services announced at AWS Re:Invent.

# Legal Jeopardy

Hopefully this case was a one off. Autodesk legal [objected]({% link _posts/2023-12-18-legal-jeopardy.md %}) to a post about the [Navisworks File Format]({% link _posts/2023-10-30-navisworks-file-formats.md %}). Once I'd established which parts they objected to, I rewrote them. 

Luckily, the parts they didn't like weren't that important. I wrote a [separate post]({% link _posts/2023-12-18-legal-jeopardy.md %}) explaining what had happened.

# Rewrites

Finally, there's the case that pushed me to document all this. There's one class of posts where the existing approaches don't work.

I get an increasing amount of traffic from Google search. These are typically for "how to" type posts. Someone has a problem, I've got an answer and they'll read just far enough to solve their problem. 

As time passes, things move on and the post I published is no longer correct. It was valid and useful at the time, which is why it gets so much traffic, but is now out of date. I don't want to change the original post as it's useful as a historical record, for me if no one else.

If I realize that a post is outdated enough to be dangerous, I'll add a highlighted note at the top listing the issues. If I'm interested enough to rewrite the post for modern times, I'll leave the existing post in place for posterity and the Google search index, with a note at the top redirecting users to the latest version. 

Rewritten posts will also have a disclaimer at the top listing the reasons for the rewrite and a link to the previous version.

The first post I'm rewritten is [Vitest Monorepo Setup]({% link _posts/2024-08-19-vitest-monorepo-setup.md %}), which is my second most popular post for visitors from Google Search. Reader [christoph-hue](https://github.com/christoph-hue) left a [comment](https://github.com/TheCandidStartup/TheCandidStartup.github.io/issues/42#issuecomment-3193623479) (thank you!), pointing out that my recommendations were deprecated as of Vitest 3.2. 
