---
title: Vodafone Openreach Full Fibre Broadband Install
tags: gear
---

There comes a time in everyone's life when they start to wonder whether they should change their Internet Service Provider. I was with my previous provider for four years. The monthly price steadily rose, the supplied router was lagging behind in terms of features and the speeds from my ADSL line were adequate at best. On a good day I was getting 10 Mbps down, 0.5 Mps up and 33 ms latency.

As I went through the process of selecting a new provider and deciding on a package, I found it hard to find good information on what the tradeoffs are and what would actually happen during installation. So, here's my experience in the hope that someone will find it useful (even if it's just me in four years time).

## Background

Before I go further, some basic background. The broadband market in the UK is split into network infrastructure and internet service providers. The dominant player in network infrastructure is Openreach, with pretty much 100% coverage across the UK. [Openreach](https://www.openreach.com/) is the latest name for what was previously British Telecom and before that the Post Office. They're the former state run monopoly telecommunications provider. They're the people that installed and maintain your old copper phone line. 

The second network infrastructure player is Virgin Media with around 60% coverage. They're the only significant survivor of the introduction of cable tv to the UK market. In addition, there are a few smaller companies that serve specific local areas.

The vast majority of ISPs in the UK use Openreach as their network infrastructure provider. Openreach don't deal with consumers directly. Conversely, Virgin Media and the local infrastructure providers only deal with consumers directly.

Switching between ISPs that use Openreach is quick and easy. You sign up with the new ISP and they handle the coordination of the move with the old ISP. If you can reuse the existing physical network connection the whole thing can be done remotely. You just need to swap the old ISP's router with a new one that's couriered out to you. 

If you're changing network infrastructure provider, the process is more complicated. You need to do the coordination, getting the new package installed and then terminating the subscription to the old one. Leave it too long and you'll be paying for both for days or weeks. Try to make it all happen on the day and you run the risk of being left with no broadband if there's an installation delay.

## Package Types

There are three types of consumer broadband package available in the UK. 

| Connection Type | Download Speed | Upload Speed | Also Known As | Infrastructure |
|-|-|-|-|
| ADSL[^1] | 10Mbps | 1Mbps | Basic, Standard | Copper phone line to the local exchange |
| FTTC[^2] | 38Mbps | 15Mbps | Fibre, Superfast | Copper phone line to cabinet in the street then fibre optic to local exchange |
| FTTP[^3] | 300Mbps | 50Mbps | Full Fibre, Ultrafast | Fibre optic cable from the house direct to local exchange |

ADSL and FTTC both use the existing telephone cables (typically overhead lines via telegraph poles) and don't need any physical on site installation. FTTP uses a fibre optic cable to the premises and will require on site installation if switching from ADSL or FTTC. 

[^1]: [ADSL](https://en.wikipedia.org/wiki/ADSL) is the lowest cost option using standard telephone line copper cables. There is a significant difference in upload and download speeds (typically 10:1) as well as a significant reduction in speeds if you live further from the exchange. Speeds given here are average available in the UK.
[^2]: [FTTC](https://en.wikipedia.org/wiki/Fiber_to_the_x#Fiber_to_the_curb/cabinet/node) (fibre to the cabinet) is the most commonly available form of high speed broadband in the UK. Fibre optic cable is run to street side cabinets with the existing copper cables used for the last mile connection. Speeds available depend on your distance from the cabinet. Speeds given here are [those available to 50% of the population in the UK](https://www.thinkbroadband.com/guides/fibre-fttc-ftth-broadband-guide#what-speed).
[^3]: [FTTP](https://en.wikipedia.org/wiki/Fiber_to_the_x#Fiber_to_the_premises) (fibre to the premises) is the highest speed home broadband available in the UK. Fibre optic cable is run direct to the premises, terminating close to the customer's router. Speeds here are those typically quoted by OpenReach. Most customers have lower priced packages where speeds are capped anywhere down to 36Mbps.

## Research

Looking around, the cheapest deal I could find was with Vodafone. "Full Fibre" broadband for 20% less than I was paying with my old provider. I was surprised. Last time I changed provider, any package with fibre in the name was at least twice the price of a basic ADSL line. In fact, I found it really hard to find anyone offering basic ADSL at all, and certainly not at a significant saving compared to the fibre offerings. Mostly ISPs I'd never heard of with poor ratings for customer service. 

Looks like I had no choice but to accept a significantly better service. Now I had to decide between FTTC and FTTP. My first thought was FTTC. Most of the time, ADSL worked well for us. The occasional bit of buffering when streaming. Having to wait on the rare occasions we did a large download or upload. Four times faster download and fifteen times faster upload would be more than enough. Even better, as both Vodafone and my old supplier use Openreach, no need for a physical installation.

It turns out that we're in a "full fibre" area. A few months ago, I noticed the Openreach engineers installing new kit at the top of the telegraph poles on our street, including the [Connectorised Block Terminals](https://www.increasebroadbandspeed.co.uk/fttp-full-fibre-broadband-installation) that the final fibre connection to your home is run from. 

{% include candid-image.html src="/assets/images/broadband-2023/telegraph-pole-cbt.jpg" alt="Telegraph Pole with CBT ready for Full Fibre Broadband" %}

If you're in a full fibre area, ISPs *really* want you to choose an FTTP package. When you go through the application process, in most cases, the web site doesn't give you the option of choosing FTTC. When I did manage to trick the Vodafdone site into letting me choose an FTTC package, it was £1 a month more expensive than the cheapest FTTP package. 

Both packages had the same advertised speed (36Mps). However, for FTTC that's a not to be exceeded number, available only if you're close enough to the cabinet. For FTTP, it's an artificial limit on physical infrastructure that's capable of going ten times faster. With FTTP, another £1 a month would get me the next package up, with double the speed.

I decided to take a leap of faith and go for full fat fibre.

## Phone Service

The very last thing you're told before you complete the sign up process is that the new fibre optic cable will also replace your telephone landline. Calls will be made via the router using [VOIP](https://en.wikipedia.org/wiki/Voice_over_IP). That opens up all sorts of questions. For a start, can I use our existing landline phones with VOIP?

Our existing setup consists of a copper phone line from the telegraph pole in the street to the corner of the house. It then runs down the front of the house, over and down the side of the front door and through the wall to a main socket in the hall. The hall being the traditional location for your one and only landline phone. Later, someone added an internal extension to another socket in the home office on the second floor. 

The router lives in the home office. The computers in the home office have wired connections to the router. The house has three stories, so having the router on the middle floor ensures good wifi throughout the house. 

Easy enough to plug the home office phone into the router. Assuming it works with VOIP. But what about the phone in the hall?

I couldn't find good answers but decided to proceed anyway. Like most people, our landline is less frequently used. Most calls are made by mobile phone. The landline is mostly there for incoming calls from those that haven't switched to calling the mobile. It's not the end of the world if it only works in the home office and we have to buy a new phone.

The other consideration is that the UK has a plan to [switch off the old phone system](https://www.openreach.com/upgrading-the-UK-to-digital-phone-lines/for-my-home-or-business) and move everyone over to VOIP by 2025[^p1]. If I hung on, I would just be delaying the inevitable.

[^p1]: If you'd like to know more, there's a fantastic [two part article](https://www.draytek.co.uk/information/blog/the-end-of-analogue-phone-lines-pt1) with all the gory details.

## Pre-Installation

I pressed submit on the web form which kicked off a host of automated emails. The most important being an installation date a month later. Unfortunately, there was very little detail about what would happen, just a link to a general [Vodafone broadband FAQ](https://support.vodafone.co.uk/Broadband/). After a lot of random clicking around I finally found a [page that outlines what the installation involves](https://support.vodafone.co.uk/Broadband/Set-up-getting-started-Home-Broadband-/1464003642/How-is-Vodafone-broadband-installed.htm). 

It's a little garbled. Apparently a hole will be drilled, a connection box will be fitted both to the outside wall of the house **and** inside next to two power sockets. No idea how the box can be in two places at once, or what the two power sockets are for.

Some Googling led me to a [much better page on the Openreach site](https://www.openreach.com/help-and-support/full-fibre-broadband-installation-checklist). If only Vodafone had thought to link to it. 

To summarize
1. A fibre optic cable will be run from the telegraph pole to a junction box fitted to an external wall.
2. A hole is drilled through the wall and a smaller cable run through the hole from the junction box. You can tell the engineer where to drill. 
3. A second, powered, wall-mounted unit (an Optical Network Terminal) is fitted on the other side. (That's one power socket accounted for).
4. The router is plugged into the ONT. (That must be what the other power socket was for).

We had some decisions to make. Where did we want the ONT fitted? The router will be in the home office, so that's the obvious place to put it. Fortunately, the home office is at the front of the house just under where the current copper cable connects to the house. 

Simple. Run the cable down the outside wall for a meter or so. Slap on the external junction box nicely out of the way. Drill through, coming out in the corner of the room under the fitted desk. Put the ONT there where no one needs to look at it. 

During the month that we waited I received two emails from Vodafone, two texts from Vodafone and four texts from Openreach to remind me to be in between 8AM and 1PM on the installation day. 

I received the new Vodafone router three days before the installation date. Which answered one question. As well as four gigabit ethernet ports, it had two dedicated [RJ11](https://en.wikipedia.org/wiki/Registered_jack) phone sockets. It came with an RJ11 to RJ11 cable to plug my phone in and a standard ethernet cat5 patch cable to connect the ONT to the router. All I needed to do was wait for installation day to see if it worked.

## On the Day

I made sure I was up by 8AM. Then I waited. Then I waited some more. No one came. No email or text. First they'd been over communicative, now they were ghosting me. 

At 2PM, I gave up waiting and tried to contact Vodafone. Ironically, Vodafone don't want you to contact them by phone. The web site takes every opportunity to direct you towards online chat. Where, of course, you find you're chatting with a robot programmed to suggest looking at the least relevant FAQ article for your query. The trick is to tell it that it's useless, at which point it connects you to a human (or at least a queue where you can wait for a human to respond).

First, they had to take me through security. What was my security pin? No idea. I remembered I'd been sent details for an online account so tried logging into that.  *There seems to be a problem, try again later*. 

"Oh, that won't work until your broadband has been activated. I know the email says you can use it straight away but you can't. I'll have to use a backup process to verify your identity". 

Half an hour later I finally had an answer. They might say 8AM-1PM (over and over), but what they actually mean is that they could turn up at any time that day. Or not. I should wait until 6PM before assuming Openreach won't turn up. At which point it would be too late to do anything, so contact us again tomorrow to get a new appointment booked. Yes, the chatbot is annoying. Here's a link that gets straight through to us. 

At 3PM a white van stopped outside our house. It didn't look like an Openreach van. And it wasn't. The job had been subcontracted out. 

After sitting in his van for ten minutes, the engineer finally approached the house. He had some questions for me. Good job I was prepared. 

Did I want him to remove the old copper cable? I wasn't prepared for that one. I got the impression that he was meant to remove the old cable but would be happy to save himself some work by leaving it there. Leaving it seemed like a good option to me. If anything went wrong with the install we'd still have our old broadband connection.

Next question. Did I want him to run the cable to the existing connector on the house or fit a new one? Not sure how to answer that. Again, I got the impression that he was meant to fit a new one but would again be happy to save himself some work by reusing the existing one. Fine by me. If it's not broke, why fix it?

{% include candid-image.html src="/assets/images/broadband-2023/external-connector.jpg" alt="Old copper cable (above) and new fibre (below) connecting to the house" %}

Finally, where did I want the ONT fitted? I showed him up to the home office and pointed under the desk. He looked a little dubious but was willing to squirm underneath. Apparently, the hole would have to be drilled from the inside to the outside. I should be prepared to lose some of the render from the walls. Two minutes later and it was done. Nice neat hole - no render lost. The ONT was hung on a couple of screws next to the hole (not over it as I'd assumed) and the fibre wired in and pushed through the hole. He put the router on the floor by the ONT and plugged it in. 

In case you're wondering, the ONT is tiny, 80mm x 90mm x 30mm. The plug with integrated power brick is a monster by comparison (50mm x 60mm x 55mm).

Last decision, where did I want the external box? Surely it would go on the outside wall, where the hole comes out. He looked at me pityingly. "No". 

No? It has to be at ground level. Which is why I have a new fibre optic cable running all the way down the front of my house to a grey box (150mm x 160mm x 35mm), with another cable running all the way back up to the hole through to the home office.

{% include candid-image.html src="/assets/images/broadband-2023/external-hole.jpg" alt="Fibre coming back from the external box and entering the building. Old copper cable on the left." %}

{% include candid-image.html src="/assets/images/broadband-2023/external-box.jpg" alt="Openreach External Box" %}

"It's a good job you decided to keep the copper cable", he said. He'd just come down the telegraph pole, after connecting the new fibre to the CBT. Apparently, I was the first person to use the CBT on that pole. "It's all done by contractors. Never works first time. Ninety percent of the time Openreach have to come out and fix it".

The last step was to fit the external junction box and connect the two cables he'd just fitted. Which seems like a complete waste of effort to me. Why not use one cable and run it straight to the ONT? 

We trooped back upstairs to see if it was working. I don't know who was more surprised to see that all the lights on the ONT were green. "That's definitely working", said the engineer. And left as quickly as he could. All in, it had taken him about an hour.

{% include candid-image.html src="/assets/images/broadband-2023/ont.jpg" alt="Optical Network Terminal (ONT). Connections from left to right are power, router and incoming fibre. LEDs are Power, LOS (only lit if there's a problem), PON (connected to exchange), LAN (connected to router)." %}

I felt like an idiot for letting him go before connecting at least one of my devices to the network and confirming it was working properly. To my surprise, it was. Connected first time. 36Mbps down, 9Mbps up, 10ms latency.

## Post-Installation

My first job was to sort out the cable management. I moved the router across the room to where it normally lived. The supplied patch cable was too short but I had my own cat5 cable which worked just fine. 

Next, I turned off the old router. Then changed the SSID and password on the new router to the same values as the old one. Finally, a tour of the house to make sure everything was connecting correctly. Apart from an old iPad where I had to forget the existing network and manually reconnect, everything reconnected automatically.

Now to the big unknown. I plugged the home office phone into the new router and lifted the receiver. To my surprise I heard a dial tone. I checked the phone in the hall (still connected to the old copper phone line). That had a dial tone too. Clearly the phone line and our landline number were still in the process of being switched over. I decided to leave it for the day.

Next morning I checked the phone in the hall again. Dead. OK, I guess they've switched the phone over. I used my mobile to call our landline number. Five weird beeps (not the usual ringing sound) and then it disconnected. No ring from the home office phone, but I did still get a dial tone when I picked it up. 

Time to get back on the chat with Vodafone. At least the online account was working now. Not that it helped. Despite being logged in when I started up the chat, I still had to validate my identity separately. 

"Do you have a VOIP adaptor for your phone?". You what. "You need a VOIP adaptor". 

You never told me I needed one. The leaflet that comes with the router says to just plug the phone in. And I have a dial tone, the problem is with incoming calls. Let me try calling out to my mobile. There, it works. I'll try calling in again. That's weird. It's working now.

"Oh, they test the line during the day after installation. It'll probably be on and off all day". 

OK. Thanks for letting me know. I guess I don't need a VOIP adaptor. 

One phone working, now what about the one in the hall? I don't want to have to run a phone cable down to there. At which point I had a brainwave. I already have a phone cable down to there. It runs from the extension socket in the home office to the main socket in the hall. That also connects to the copper phone line back to the exchange but that's been disconnected. I plugged the second RJ11 socket on the router into the extension socket. Checked the hall phone and got a dial tone. It's alive!

Later, I did a little [more](https://www.draytek.co.uk/information/blog/the-end-of-analogue-phone-lines-pt2) [research](https://support.aa.net.uk/VoIP_How_to:_Voice_reinjection) which suggests this may not work for everyone. If your copper phone line is still active (you have VOIP over ADSL or FTTC), you'll need to disconnect your extension wiring from the phone line. If you have a modern main socket with both RJ45 and RJ11 sockets you will need to upgrade it.

## Conclusion

In the end, it was all pretty painless. If anyone from Vodafone or Openreach ever reads this, I have a few constructive suggestions.
1. Better documentation of what installation involves that's easy to find. Including what to expect in the 24 hours after installation.
2. Let me know if the engineer is running late. Let me know that I should plan to be in all day. 
3. You don't need a VOIP adaptor. It's built into the router. Maybe let your support people know?
4. Provide direct routes to support for people with installation problems.
5. Don't send me an email telling me that my online account is ready to use when it isn't. Give me a meaningful error message when I'm blocked from logging in. Don't make me go through your identity verification process when I've just proved my identity by logging in.

## Footnotes
