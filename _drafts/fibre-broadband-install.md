---
title: Vodafone Openreach Full Fibre Broadband Install
tags: gear
---

There comes a time in everyone's life when they start to wonder whether they should change their Internet Service Provider. I was with my previous provider for four years. The monthly price steadily rose, the supplied router was lagging behind in terms of features and the speeds from my ADSL line were adequate at best. On a good day I was getting 10 Mbps down, 0.5 Mps up and 33 ms latency.

As I went through the process of selecting a new provider and deciding on a package, I found it hard to find good information on what the tradeoffs are and what would actually happen during installation. So, here's my experience in the hope that someone will find it useful (even if it's just me in four years time).

## Background

Before I go further, some basic background. The broadband market in the UK is split into network infrastructure and internet service providers. The dominant player in network infrastructure is Openreach, with pretty much 100% coverage across the UK. [Openreach](https://www.openreach.com/) is the latest name for what was previously British Telecom and before that the Post Office. The former state run monopoly telecommunications provider. They're the people that installed and maintain your old copper telephone line. 

The second network infrastructure player is Virgin Media with around 60% coverage. They're the only significant survivor of the introduction of cable tv to the UK market. In addition, there are a few smaller companies that serve specific local areas.

The vast majority of ISPs in the UK use Openreach as their network infrastructure provider. Openreach don't deal with consumers directly. Conversely, Virgin Media and the local infrastructure providers only deal with consumers directly.

Switching between ISPs that use Openreach is quick and easy. You sign up with the new ISP and they handle the coordination of the move with the old ISP. If you can reuse the existing physical network connection the whole thing can be done remotely. You just need to swap the old ISP's router with a new one that's couriered out to you. 

If you're changing network infrastructure provider, the process is more complicated. You need to coordinate the process, getting the new package installed and then terminating the subscription to the old one. Leave it too long and you'll be paying for both for days or weeks. Try to make it all happen on the day and you run the risk of being left with no broadband if there's an installation delay.

## Package Types

There are three types of consumer broadband package available in the UK. 

| Connection Type | Download Speed | Upload Speed | Also Known As | Infrastructure |
|-|-|-|-|
| ADSL[^1] | 10Mbps | 1Mbps | Basic, Standard | Copper phone line to the local exchange |
| FTTC[^2] | 38Mbps | 15Mbps | Fibre, Superfast | Copper phone line to cabinet in the street then fibre optic to local exchange |
| FTTP[^3] | 300Mbps | 50Mbps | Full Fibre, Ultrafast | Fibre optic cable from the house to local exchange |

ADSL and FTTC both use the existing telephone cables (typically overhead lines via telegraph poles) and don't need any physical on site installation. FTTP uses a fibre optic cable to the premises and will require on site installation if switching from ADSL or FTTC. 

[^1]: [ADSL](https://en.wikipedia.org/wiki/ADSL) is the lowest cost option using standard telephone line copper cables. There is a significant difference in upload and download speeds (typically 10:1) as well as a significant reduction in speeds if you live further from the exchange. Speeds given here are average available in the UK.
[^2]: [FTTC](https://en.wikipedia.org/wiki/Fiber_to_the_x#Fiber_to_the_curb/cabinet/node) (fibre to the cabinet) is the most commonly available form of high speed broadband in the UK. Fibre optic cable is run to street side cabinets with the existing copper cables used for the last mile connection. Speeds available depend on your distance from the cabinet. Speeds given here are [those available to 50% of the population in the UK](https://www.thinkbroadband.com/guides/fibre-fttc-ftth-broadband-guide#what-speed).
[^3]: [FTTP](https://en.wikipedia.org/wiki/Fiber_to_the_x#Fiber_to_the_premises) (fibre to the premises) is the highest speed home broadband available in the UK. Fibre optic cable is run direct to the premises, terminating close to the customer's router. Speeds here are those typically quoted by OpenReach. Most customers have lower priced packages where speeds are capped anywhere down to 36Mbps.

## Research

Looking around, the cheapest deal I could find was with Vodafone. "Full Fibre" broadband for 20% less than I was paying with my old provider. I was surprised. Last time I changed provider, any package with fibre in the name was at least twice the price of a basic ADSL line. In fact I found it really hard to find anyone offering basic ADSL at all, and certainly not at a significant saving compared to the fibre offerings. Mostly ISPs I'd never heard of with poor ratings for customer service. 

Looks like I had no choice but to get a significantly better service. Now I had to decide between FTTC and FTTP. My first thought was FTTC. Most of the time, ADSL worked well for us. The occasional bit of buffering when streaming. Having to wait on the rare occasions we did a large download or upload. Four times faster download and fifteen times faster upload would be more than enough. Even better, no need for a physical installation.

It turns out that we're in a "full fibre" area. A few months ago, I noticed the Openreach engineers installing new kit at the top of the telegraph poles on our street including the [Connectorised Block Terminals](https://www.increasebroadbandspeed.co.uk/fttp-full-fibre-broadband-installation) that the final fibre connection to your home is run from. 

If you're in a full fibre area, ISPs *really* want you to choose an FTTP package. When you go through the application process, in most cases, the web site doesn't give you the option of choosing FTTC. When I did manage to trick the Vodafdone site into letting me choose an FTTC package, it was £1 a month more expensive than the cheapest FTTP package. 

Both packages had the same advertised speed (36Mps). However, for FTTC that's a not to be exceeded number, available only if you're close enough to the cabinet. For FTTP, it's an artificial limit on physical infrastructure that's capable of going ten times faster. With FTTP, another £1 a month would get me the next package up, with double the speed.

So, I decided to take a leap of faith and go for full fat fibre.

## Pre-Installation

## On the Day

## Post-Installation

## Footnotes
