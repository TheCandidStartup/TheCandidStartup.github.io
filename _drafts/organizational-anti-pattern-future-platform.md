---
title: >
  Organizational Anti-Patterns #5: The Future Platform
tags: org-anti-patterns
---

{% capture vp_url %}
{% link _posts/2022-10-31-organizational-anti-pattern-vp-moves.md %}
{% endcapture %}
{% capture ont_url %}
{% link _posts/2022-11-21-organizational-anti-pattern-old-new-thing.md %}
{% endcapture %}
Let's say you work for a large organization that, for [whatever]({{vp_url | strip | append: "#the-acquisition"}}) [reason]({{ ont_url | strip | append: "#competition" }}), has a lot of duplicate development. Pick any kind of project you can think of and, if you look hard enough, you'll find five different teams working on their own version. Almost inevitably, a VP will decide that the solution to this recurring problem is to build *The Future Platform*. 

{% include organizational-anti-patterns-note.html %}

"If only we had a common platform there would be no need for all this pointless duplication. Teams would be more productive. They could focus on delivering business value rather than doing undifferentiated heavy lifting. We can bake in company policy so that teams will automatically do the right thing."

"Sounds great. How do we get started? All the product teams are fully loaded working on customer commitments and sales blockers."

"No problem, we'll set up a platform group to build it. They can take the time to figure out what we really need without being constrained by all these short term requirements. They can look ahead and build the future platform we're eventually going to need. After all, we [want to skate to where the puck is going](https://archive.canadianbusiness.com/blogs-and-comment/stop-using-gretzky-where-the-puck-is-quote/)."

What could go wrong?

# It's Not the Technology

The biggest problem is the assumption that a common platform will prevent duplicate effort. This is the classic mistake of trying to solve an organizational problem with technology. Teams build their own version of something that already exists because
* They don't know that it already exists (your organization has a communication problem)
* They know that it exists but they can't use it because its written in the wrong language or built on the wrong stack (your organization lacks a strong common culture)
* They know that something exists, built in the right language on the right stack, but they don't trust the team that maintains it (your organization has conflicting priorities)

# Conflicting Priorities

We need to unpack that last point further. Why would a team rather build their own version of something that already exists in a usable form? 

Because they've been burnt before.

Everyone agrees that reuse and sharing make sense. Build it once so we can invest resources in making it better for everyone. It would be crazy to waste resources building multiple partial implementations. The problem is that sharing is hard. Building something that others can use is more work than building something just for yourself. 

What about open source or [inner source](https://en.wikipedia.org/wiki/Inner_source)? Building something that others can contribute to is also more work than building something just for yourself. Teams need to be incentivized and recognized for going the extra mile to create something sharable. 

You've convinced your managers to look at the bigger picture and make something sharable. Other teams have started using your shared component. Now it gets really hard. Your team and your management chain have to commit resources to maintaining the component for the long term. You may fully intend to be in it for the long haul but priorities change. It's particularly hard for product teams. Your VP has goals related to product and when resources get tight, what are they going to cut?

So that's why we should have a platform group, right? Their priority is to build and maintain shared components. Like everyone else, the platform group have more feature requests than they can implement. They have to prioritize. What happens when the component your team depends on becomes the [Old New Thing]({% link _posts/2022-11-21-organizational-anti-pattern-old-new-thing.md %})?

Once you've been burnt a couple of times you stop trusting internally developed components. There's a lot of overlap with [Exception Culture]({% link _posts/2022-12-19-organizational-anti-pattern-exception.md %}). You read the political weather to try and figure out whether a potential dependency is going to last. You avoid being the first consumer. Wait until there are enough users that it becomes hard to kill off. If that's too much effort, you'll stick to components developed close to home where you have more influence on their long term survival.

# Solving the Wrong Problem Too Late

Your organization is doing it regardless. They've set up a dedicated platform group and tasked them with building the Future Platform. What sort of platform are they going to build? Hopefully they're going to talk to the product teams and find out what they need, what their pain points are, what will unlock value for them. Surprisingly, that's not always a given. Then what? 

Well, you've asked them to build the future platform. They're energized. They're ambitious. They're ready to take on the challenge of building something new, something groundbreaking, something that will solve everyone's problems. They're looking two to three years ahead. Figuring out where the puck is going. Deciding which exciting new technology is the future.

What are the product teams doing in the meantime? Muddling along as usual. Getting frustrated. They have simple problems that could be solved right now. 

Maybe the compliance team has added new requirements for everyone to implement. Can't the platform team provide some common tooling? *Sorry, they're too busy working on the future.*

There's a database that lots of teams are using. They need help monitoring and managing it correctly. Can the platform team recommend something that everyone could adopt? *No point - where we're going we won't need databases!*

The organization has mandated use of a common identity system. Every client needs to implement a login dialog integrated with the new identity service backend. Can the platform team provide some common login components? *We're building a complete front end framework. All you need to do is rewrite your client to extract all the business logic and plug it in. It'll be ready in two years.*

What happens when the shiny new platform is finally delivered? The product teams have moved on. They've found simpler solutions to their problems using existing technology. They have no interest in rewriting what they have to adopt the new platform. They have serious reservations about quality and lack of documentation. 

The platform teams are frustrated because the product teams won't adopt their wonderful new platform. The product teams are frustrated because the platform teams won't build anything they can use. 

How do you get out of this mess? Well, you could do what you should have done in the first place. Focus on the product teams' biggest problem and provide a focused solution to that problem. Don't boil the ocean and try to solve everything at once. Provide tools, components and services that can be used as building blocks. Let the consuming teams decide how to combine them. If common patterns emerge, build higher level components on top. Learn. Iterate. Build trust.

So, what actually happens? The once Future Platform becomes the [Old New Thing]({% link _posts/2022-11-21-organizational-anti-pattern-old-new-thing.md %}). Everyone foolish enough to be an early adopter gets their fingers burnt. The platform group decide that the real problem is that they picked the wrong technology. Two years on and there are lots of exciting new options. They're setting off to build the new Future Platform. This time they're going to get it right. See you in two years!

# The Inner-Platform Effect

If you're really unlucky the platform group will end up with something similar to the [inner-platform effect](https://thedailywtf.com/articles/The_Inner-Platform_Effect) of [Daily WTF](https://thedailywtf.com/) fame. The only way they can provide a single platform that meets the ridiculously wide range of needs within your organization, is to build something so general that it becomes more effort to configure it to your needs than to build something more focused yourself. 

A particularly malign variation is to build wrappers around third party components in a misguided attempt to avoid vendor lock in. They are invariably less functional, less well documented, with a smaller community around them than the originals. I can't think of a better way to remove value. 

Whoever your cloud provider is, you're paying them a premium to provide a platform. Embrace it. 

# The Platform Bottleneck

Let's say that you manage to establish a strong platform oriented culture. Component developers focus on customer needs and build things that other teams want to use. Components are true building blocks that other teams can use to create higher level shared components. Once you commit to a shared component, you're there as long as your consumers need it. Perhaps theres a [VP mandate]({{vp_url | strip | append: "#the-mandate"}}) that teams **must** use common components. More and more teams are coming onboard. Naturally they all want slightly different things out of your component and the feature requests are piling up. 

How are resources allocated in your organization? Your component is a success and clearly needs more resources. The more teams that are successful with your component, the less resources they need. Perhaps everyone will behave rationally and agree to shift resources from product to shared components? 

If your organization still divides itself on product and platform lines, your organizational problems will conspire to shoot you in the foot again. The product VPs are going to hold onto their resources and areas of influence for dear life. Your component becomes a bottleneck and teams have another reason to avoid using it. 

To really succeed you have to understand that it's platform [all the way down](https://en.wikipedia.org/wiki/Turtles_all_the_way_down). Every team is building something that depends on the output of other teams and is in turn a dependency for someone else. Even the very tip of the pyramid, your customer facing clients, are part of the platform that your customers will build on. 

Your organizational structure and the way it evolves over time needs to recognize that. 

