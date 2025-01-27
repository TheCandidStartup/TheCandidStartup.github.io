---
title: Now on Bluesky
tags: blog
---

I have an account on [Bluesky](https://bsky.app/profile/thecandidstartup.org) now. As with [Twitter](https://twitter.com/ThCandidStartup) (currently known as X) and [LinkedIn](https://www.linkedin.com/comm/mynetwork/discovery-see-all?usecase=PEOPLE_FOLLOWS&followMember=tim-wiegand-uk), I'll post links to blog articles as they come out. 

Why now? I've been thinking about alternative social media channels for a while but kept putting it off. Should it be Mastodon or Bluesky or something else? Don't I have something more interesting to do instead?

Eventually my hand was forced when one of the people I follow on Twitter moved over. At first I just bookmarked their Bluesky profile page and checked it occasionally. This is obviously not sustainable and I finally snapped. 

For now I'll post to all three accounts, so follow me wherever suits you best.

# Bluesky

Signing up is easy, if tedious. You find yourself stepping through a seemingly interminable wizard, each step asking for just a little more. 
1. Provide your email address, password and date of birth. 
2. Pick a handle. I didn't run into any limits with length, unlike Twitter, so was able to use "@thecandidstartup". Whatever you pick gets a ".bsky.social" suffix. 
3. Complete a Captcha.
4. Do it again.
5. Upload a profile image. Bluesky decided to chop my head off when I uploaded my standard profile pic. I kind of like the end result. 
6. Pick some interests to prime the algorithm.
7. Pick some people to follow.

{% include candid-image.html src="/assets/images/bluesky-profile.png" alt="Bluesky Profile" %}

Weirdly, there's no "email you a link" to validate your email address between step 1 and 2. While poking around in account settings I found you can manually choose to verify. That gives you a reassuring blue tick in the settings UI (which only you can see). Apparently, it also adds a basic form of two factor authentication by emailing you a confirmation code when you try to change other settings. 

# Domain Name as Handle

You may have noticed that my handle is `@thecandidstartup.org`, not `@thecandidstartup.bsky.social`. How did I manage that?

Bluesky has it's own version of the original Twitter blue tick, that ensures you're following who you think you are. Bluesky's system is a clever hack (in the original sense of the term). Instead of implementing a whole new identity verification system, it piggy backs on the domain name system (DNS). 

If you can [demonstrate that you control a domain](https://bsky.social/about/blog/4-28-2023-domain-handle-tutorial), you can use that domain as your handle. If you see a handle like `@laura.kuenssberg.bbc.co.uk`, you can be confident that they're the BBC journalist [Laura Kuenssberg](https://en.wikipedia.org/wiki/Laura_Kuenssberg), or at least someone of that name that works for the BBC.

The [instructions](https://bsky.social/about/blog/4-28-2023-domain-handle-tutorial) are easy to follow if you administer your own domain or have access to whoever does. 

{% include candid-image.html src="/assets/images/bluesky-domain-registration.png" alt="Bluesky Domain Registration" %}

Specify the domain you want to use as a handle and add a corresponding TXT record via your domain registrar. I gave it 5 minutes to propagate and pressed "Verify DNS Record".

The domain was reported as verified and I was presented with another button that would apply the change. Pressing it didn't seem to do anything. I navigated back out to the main settings page which showed that my handle was still `@thecandidstartup.bsky.social`.

On dear. I reached for the all purpose web app fix, and refreshed the page. That sorted it. 

# Follow Me!

Follow me at [@thecandidstartup.org](https://bsky.app/profile/thecandidstartup.org). 

There's nothing much there yet. I briefly thought about porting my posts from Twitter over. However, as all of them are links to content you can find [right here]({{ '/blog/' | absolute_url }}), there's not much point. 

There aren't any official tools for migrating content and the third party tools I found seem to have mixed reviews.

# Changes to the Blog

I've added Bluesky to the [Contact]({% link contact.md %}) page and to the clickable social icons in the page footer.

{% include candid-image.html src="/assets/images/bluesky-social-icon.png" alt="Bluesky Icon with hover style applied" %}

Getting the icon right was both more and less painful than I thought it would be. The existing icons are embedded SVG in the Cayman blog theme that I use. There's a comment that says the icons came from [iconmonstr](https://iconmonstr.com/). Unfortunately, they don't have a Bluesky icon. 

I found links to the official logo in the [Bluesky documentation](https://docs.bsky.app/docs/advanced-guides/intent-links). There's an SVG icon but with a square background. 

Some further searching found a [free circular logo](https://www.iconpacks.net/free-icon/bluesky-blue-round-circle-logo-24461.html) on [iconpacks](https://www.iconpacks.net/). The existing icons are single color circles with the icon as a hole. The iconpacks logo is two separate elements consisting of a white butterfly on a blue circle. It's also much bigger than the other icons. 

After [reading up on SVG](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path), I was able to combine the circle and butterfly into a single path definition and use the [evenodd fill rule](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-rule) to create the hole. I removed all the inline styling and applied the same CSS style as the existing icons. That applied the correct colors and hover behavior, and magically, also scaled the icon to the correct size. 

Job done. 

