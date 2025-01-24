---
title: >
  Now on Bluesky as @thecandidstartup.org
tags: blog
---

wise words
* Forced into it as people I follow on Twitter (now known as X) move over
* Keeping my twitter account for now for those still there

# Bluesky

* Sign up for account - email, password, DOB
* Weirdly no "email you a link" to validate your email address
* Create a username, whatever you want ending with .bsky.social - @thecandidstartup.bsky.social
* Complete a Captcha
* Upload a profile image - Bluesky decided to chop my head off when adjusting for aspect ratio but I kind of like it
* Pick some interests
* Pick some followers

* You can optionally choose to verify your email in account settings
* Gives you a reassuring blue tick in the settings UI and apparently adds an extra layer of security as further changes need a confirmation code sent to the verified email address

# Website as username

* Clever "hack" (in the original sense of the term)
* Verification piggy backing on the domain name system
* If you can demonstrate that you control a domain, you can use that domain as your handle
* https://bsky.social/about/blog/4-28-2023-domain-handle-tutorial
* Followed the instructions

{% include candid-image.html src="/assets/images/bluesky-domain-registration.png" alt="Bluesky Domain Registration" %}

* Added TXT record via my domain registrar. Click to copy host and value from Bluesky.
* Waited 5 minutes then pressed "Verify DNS Record"
* Reported domain verified and then another button to press to apply change
* Navigated back out to main settings page which showed that my handle was now "@thecandidstartup.bsky.social"
* On dear
* Refreshed web page and that sorted it

# Follow Me!

* https://bsky.app/profile/thecandidstartup.org

{% include candid-image.html src="/assets/images/bluesky-profile.png" alt="Bluesky Profile" %}

# Blog Updates

* Added Bluesky to [contact]({% link contact.md %}) page
* Added Bluesky icon and link to page footer

{% include candid-image.html src="/assets/images/bluesky-social-icon.png" alt="Bluesky Icon with hover style applied" %}

* Both more and less painful than I thought it would be
* Existing icons are embedded as code in the Cayman blog theme that I use
* There's a comment that says the icons came from [iconmonstr](https://iconmonstr.com/)
* They don't have a Bluesky icon
* Found links to the official logo in the [Bluesky documentation](https://docs.bsky.app/docs/advanced-guides/intent-links)
* That gives me the butterfly SVG path
* Existing icons are single color circles with the icon as a hole
* After [reading up on SVG](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path) was able to combine a circle path with the butterfly path and use the [evenodd fill rule](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-rule) to create the hole
* Icon was much bigger than the others. Thought I would have to fiddle around applying transforms to get it to the right size.
* Magically, applying the same CSS style as the others corrected the size, applied the correct colors and hover highlight
