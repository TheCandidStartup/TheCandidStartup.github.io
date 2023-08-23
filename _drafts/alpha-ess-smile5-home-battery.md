---
title: AlphaESS Smile 5 Home Battery Storage System
tags: gear
---

I've wanted to get a home battery storage system for a while. We had solar panels installed back in 2009. On a sunny day I could see that we were generating much more electricity than we needed. The excess power is exported to the grid for a laughably low rate. Then when the sun goes down I can buy the power back from the grid at an extortionately high rate. 

I first became aware of home battery storage systems when the [Tesla Powerwall](https://en.wikipedia.org/wiki/Tesla_Powerwall) went into mainstream production in 2016. Prices were too high to justify the expense and the idea stayed on the back burner.

It took three changes in circumstances to finally kick me into action. First, we got an electric car and a specialist electricity tariff to go with it. The [Octopus Go](https://octopus.energy/smart/go/) tariff offered a four hour period overnight with electricity at 5p per kWh, compared with 18p during the rest of the day. The idea was that you would charge your car overnight during the cheap period. Of course anything else using electricity at that time would be cheap too. You could charge a home battery overnight at cheap rates and then discharge it during the day. 

Second, the energy crisis hit. Electricity prices increased massively. Our tariff increased to 44p during the day but was only 7.5p overnight. There was no sign of the increases stabilizing. There was even talk of rolling blackouts during the winter. The economics of a home battery were looking increasingly attractive. 

Third, I was retiring. Suddenly, I had a lot more time on my hands for personal projects.

## Supply Constraints

Unsurprisingly, it seems like lots of people had the same idea. I had great difficulty finding an installer who would even bother to return my calls. When I did find one, I was told there was a six month waiting list. I booked my place in the queue with [Oval Renewables](https://ovalrenewables.com/) and settled down to wait.

At least I could use the time to do some research and decide which storage system to go for. It turns out I wasted my time. As well as a shortage of installers, there was also a shortage of batteries to install. There was the increased demand, but also reduced supply due to the after effects of the pandemic. In the end, once we factored in what would fit in the limited space we had available and what the installer could get their hands on, there was a choice of one.

## Initial Quote

After repeated nudging, we got close enough to the front of the queue to get a quote. I was emailed a questionnaire to fill in. At this point I was unsure what I wanted. Did I just want to add a battery to our existing system or increase our solar capacity at the same time? I asked for a quote with separate estimates for the battery and a couple of different options for increasing the solar capacity. 

After reviewing the quotes, increasing the solar was a non-starter. The only option they could offer was replacing our existing panels with more efficient modern ones. However, the cost and disruption simply wasn't worth the 20% increase in capacity. The existing panels work as well as they did when first installed. Seems awfully wasteful to rip them out and throw them away.

The battery quote seemed reasonable and I confirmed that I wanted to go ahead.

## Survey

I reached the front of the queue in December 2022. Oval contacted me and booked us in for a survey. The only place with any space was our utility room. It was added as a porch when we extended our kitchen. It turns out that the two external doors we already had were all we used, so the "porch" ended up as a dumping ground for recycling bins, running/walking/cycling gear and the cat's litter tray. 

{% include candid-image.html src="/assets/images/alphaess-battery/floor-plan-annotated.jpg" alt="Kitchen, Porch and Meter Cupboard under the Stairs" %}

There's a space 97cm wide x 57cm deep x 210cm high, against an external wall, clear of the doors. Handily our electricity meter and consumer unit are in a space close by, under the stairs. Obviously, I'd like to lose as little space as possible.

It turns out that home storage batteries are *big*. They tend to come in fancy over sized enclosures to try and justify how expensive they are. My earlier research found only one system that had a hope of fitting: the Tesla Powerwall. The Powerwall is 75cm wide and needs 10cm clearance each side for ventilation. It would just fit. It's 15cm deep and 115cm tall, so we wouldn't be losing much space.

My plans were abandoned when Sam turned up for the survey. As well as being *really* expensive, Powerwalls had an 18 month waiting list. However, he could get hold of an AlphaESS Smile 5 system which should just about fit.

## AlphaESS Smile 5

I had looked at the [AlphaESS Smile 5](https://www.alphaess.com/smile5-5kw-residential-energy-storage-system) during my research but had discounted it. It's a modular system. To get the capacity I was looking for, I would need the base Invertor unit with two 5.7kWh battery modules. They're designed to stack vertically giving an overall size of 60cm wide x 25cm deep x 182cm high. The AlphaESS documentation recommends 30cm clearance on both sides as well as above, for installation and ventilation.

Sam pointed out that the 30cm clearance was a recommendation and in their experience the system could be installed and would work in the space available. The porch never receives direct sunlight and is cool throughout the year, so overheating won't be a problem. 

The Smile 5 has two interesting features beyond the basic battery storage functionality. 

### AC-Coupled vs DC-Coupled

First, the inverter can also be used as a solar panel inverter. 

You need an inverter to convert DC power from the solar panels to AC. In the same way, you need an inverter to convert DC power from the batteries to AC. Some energy is lost as heat during the conversion. If you use excess solar to charge the battery, you're converting DC from the panels to AC and then converting it back to DC to charge the battery. This is known as an AC-coupled setup.

If you use the Smile 5 as your solar inverter, you can operate in DC-coupled mode. The Smile 5 can use DC from the solar panels to charge the battery without having to convert to AC and back. 

We had an existing solar setup with a standalone inverter. Was it worth replacing that inverter with the Smile 5 so that we could charge from solar in DC-coupled mode? Sam's advice was that it would only be worth doing if the existing inverter was close to the end of it's life. Apparently ours, from [Fronius](https://www.fronius.com/en/solar-energy/home-owners), is one of the good ones and worth hanging on to. It's situated near to the solar panels, in the eaves of the roof. Replacing it would be very disruptive as the existing cabling bringing AC down from the roof is not suitable for DC. 

### UPS

The Smile 5 can also act as a UPS so you can continue to use power stored in the battery in the event of a power cut. I had originally assumed that a home storage battery would just carry on working in the event of a power cut. Sadly, not so. The Distribution Network Operators (DNO) responsible for the infrastructure that brings power to your home have strict rules for how home power generation should behave in the event of a power cut. In particular, any power you generate must be completely isolated from the grid. This is to protect engineers that may be working to restore power.

There are two approaches to implementing a home UPS in the UK. The first, used by Tesla, is a separate high power automated switch. This is what Tesla calls a Backup Gateway. It sits between your home's main consumer unit and the grid connection. It monitors the health of the grid and disconnects your home from the grid if it detects a power outage. UK homes are typically allowed to draw up to 100A, so the switch needs to be rated for high levels of power. 

The second approach, used by most other battery manufacturers, is that the battery has a separate physical UPS connection. Whatever you want to keep operating in the event of a power cut is directly connected to the battery and is not connected to the grid at all. Home battery systems (including the Tesla Powerwall) will typically provide up to 5kW of power, or less than 20A. Having a separate UPS connection keeps costs down as you don't need a separate box and you don't have to worry about handling more power than the battery can produce. 

The downside of a separate UPS connection is that you have to physically move the circuits you want to protect from your existing main consumer unit to a separate consumer unit on the UPS. High power circuits such as ovens, showers and EV chargers should be left as they are. Power to the UPS circuits is always supplied by the battery storage system, so is always limited to 5kW, even when there's no power cut. 

In contrast, the Tesla system only limits available power to 5kW in the event of a power cut. What happens if you don't realize there's a power cut and draw too much power? The system shuts down. If that's a concern, Tesla recommends that you move high power circuits to a separate consumer unit on the grid side of the backup gateway. 

## DNO Permission

I decided to go ahead with the Smile 5, sticking with the simpler AC-Coupled setup. With talk of possible blackouts still very much in mind, I then complicated things by opting for a UPS connection.

DNO rules allow you to connect any form of micro-generation to the grid as long as maximum output is limited to 3.5kW. If you want something bigger, you need to apply to the DNO for formal permission. 

We had the option of going ahead immediately with the system configured to limit it's output, or waiting to obtain DNO permission for the maximum 4.6kW the system is capable of. We didn't want to artificially limit the system, particularly with the constraints on the UPS, so we decided to apply for permission. 

To apply for permission, we needed to first give Oval a letter of authority to apply on our behalf. This was followed by a game of pass the parcel where questions would come from the DNO via Oval, and answers would go back the same way.

Two months later we finally got the letter of permission. Interestingly, permission was only valid for four months. Should be plenty, right?

## More Delays

## VAT

## Installation Part 1

## Setup and Tuning

## Installation Part 2

## The Complete System

## Conclusion
