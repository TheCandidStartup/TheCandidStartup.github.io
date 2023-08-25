---
title: AlphaESS Smile 5 Home Battery Storage System
tags: gear
---

I've wanted to get a home battery storage system for a while. We had solar panels installed back in 2009. On a sunny day I could see that we were generating much more electricity than we needed. The excess power is exported to the grid for a laughably low rate. Then when the sun goes down I can buy the power back from the grid at an extortionately high rate. 

I first became aware of home battery storage systems when the [Tesla Powerwall](https://en.wikipedia.org/wiki/Tesla_Powerwall) went into mainstream production in 2016. Prices were too high to justify the expense and the idea stayed on the back burner.

It took three changes in circumstances to finally kick me into action. First, we got an electric car and a specialist electricity tariff to go with it. The [Octopus Go](https://octopus.energy/smart/go/) tariff offered a four hour period overnight with electricity at 5p per kWh, compared with 18p during the rest of the day. The idea was that you would charge your car overnight during the cheap period. Of course anything else using electricity at that time would be cheap too. You could charge a home battery overnight at cheap rates and then discharge it during the day. 

Second, the energy crisis hit. Electricity prices increased massively. Our tariff increased to 44p during the day but was only 7.5p overnight. There was no sign of the increases stabilizing. There was even talk of rolling blackouts during the winter. The economics of a home battery were looking increasingly attractive. 

Third, I was about to retire. Suddenly, I had a lot more time on my hands for personal projects.

## Supply Constraints

Unsurprisingly, it seems like lots of people had the same idea. I had great difficulty finding an installer who would even bother to return my calls. When I did find one, I was told there was a six month waiting list. I booked my place in the queue with [Oval Renewables](https://ovalrenewables.com/) and settled down to wait.

At least I could use the time to do some research and decide which storage system to go for. It turns out I wasted my time. As well as a shortage of installers, there was also a shortage of batteries to install. There was the increased demand, but also reduced supply due to the after effects of the pandemic. In the end, once we factored in what would fit in the limited space we had available and what the installer could get their hands on, there was a choice of one.

## Initial Quote

After repeated nudging, we got close enough to the front of the queue to get a quote. I was emailed a questionnaire to fill in. At this point I was unsure what I wanted. Did I just want to add a battery to our existing system or increase our solar capacity at the same time? I asked for a quote with separate estimates for the battery and a couple of different options for increasing the solar capacity. 

After reviewing the quotes, increasing the solar was a non-starter. The only option they could offer was replacing our existing panels with more efficient modern ones. However, the cost and disruption simply wasn't worth the 20% increase in capacity. The existing panels work as well as they did when first installed. Seems awfully wasteful to rip them out and throw them away.

The battery quote seemed reasonable and I confirmed that I wanted to go ahead.

## Survey

I reached the front of the queue in December 2022. Oval contacted me and booked us in for a survey. The only place with any space was the utility room. It was added as a porch when we extended our kitchen. It turns out that the two external doors we already had were all we used, so the "porch" ended up as a dumping ground for recycling bins, running/walking/cycling gear and the cat's litter tray. 

{% include candid-image.html src="/assets/images/alphaess-battery/floor-plan-annotated.jpg" alt="Kitchen, Porch and Meter Cupboard under the Stairs" %}

There's a space 97cm wide x 57cm deep x 210cm high, against an external wall, clear of the doors. Handily our electricity meter and consumer unit are in a space close by, under the stairs. Obviously, I'd like to lose as little space as possible.

It turns out that home storage batteries are *big*. They tend to come in fancy over sized enclosures to try and justify how expensive they are. My earlier research found only one system that had a hope of fitting: the Tesla Powerwall. The Powerwall is 75cm wide and needs 10cm clearance each side for ventilation. It would just fit. It's 15cm deep and 115cm tall, so we wouldn't be losing much space.

My plans were abandoned when Sam turned up for the survey. As well as being *really* expensive, Powerwalls had an 18 month waiting list. However, he could get hold of an AlphaESS Smile 5 system which should just about fit.

## AlphaESS Smile 5

I had looked at the [AlphaESS Smile 5](https://www.alphaess.com/smile5-5kw-residential-energy-storage-system) during my research but had discounted it. It's a modular system. To get the capacity I was looking for, I would need the base inverter unit with two 5.7kWh battery modules. They're designed to stack vertically giving an overall size of 60cm wide x 25cm deep x 182cm high. The AlphaESS documentation recommends 30cm clearance on both sides as well as above, for installation and ventilation.

Sam pointed out that the 30cm clearance was a recommendation and in their experience the system could be installed and would work in the space available. The porch never receives direct sunlight and is cool throughout the year, so overheating won't be a problem. 

The Smile 5 has two interesting features beyond the basic battery storage functionality. 

### AC-Coupled vs DC-Coupled

First, the inverter can also be used as a solar panel inverter. 

You need an inverter to convert DC power from the solar panels to AC. In the same way, you need an inverter to convert DC power from the batteries to AC. Some energy is lost as heat during the conversion. If you use excess solar to charge the battery, you're converting DC from the panels to AC and then converting it back to DC to charge the battery. This is known as an AC-coupled setup.

If you use the Smile 5 as your solar inverter, you can operate in DC-coupled mode. The Smile 5 can use DC from the solar panels to charge the battery without having to convert to AC and back. 

We had an existing solar setup with a standalone inverter. Was it worth replacing that inverter with the Smile 5 so that we could charge from solar in DC-coupled mode? Sam's advice was that it would only be worth doing if the existing inverter was close to the end of it's life. Apparently ours, from [Fronius](https://www.fronius.com/en/solar-energy/home-owners), is one of the good ones and worth hanging on to. It's situated near to the solar panels, at the top of the house. Replacing it would be very disruptive as the existing cabling bringing AC down from the roof is not suitable for DC and would need to be replaced.

### UPS

The Smile 5 can also act as a UPS so you can continue to use power stored in the battery in the event of a power cut. I had originally assumed that a home storage battery would just carry on working if there's a power cut. Sadly, not so. The Distribution Network Operator (DNO) responsible for the infrastructure that brings power to your home has strict rules for how home power generation should behave in the event of a power cut. In particular, any power you generate must be completely isolated from the grid. This is to protect engineers that may be working to restore power.

There are two approaches to implementing a home UPS in the UK. The first, used by Tesla, is a separate high power automated switch. This is what Tesla calls a Backup Gateway. It sits between your home's main consumer unit and the grid connection. It monitors the health of the grid and disconnects your home from the grid if it detects a power outage. UK homes are typically allowed to draw up to 100A, so the switch needs to be rated for high levels of power. 

The second approach, used by most other manufacturers, is that the storage system has a separate physical UPS connection. Whatever you want to keep operating in the event of a power cut is directly connected to the storage system and is not connected to the grid at all. Home battery systems (including the Tesla Powerwall) will typically provide up to 5kW of power, or less than 20A. Having a separate UPS connection keeps costs down as you don't need a separate box and you don't have to worry about handling more power than the battery can provide. 

The downside of a separate UPS connection is that you have to physically move the circuits you want to protect from your existing main consumer unit to a separate consumer unit on the UPS. High power circuits such as ovens, showers and EV chargers should be left where they are. Power to the UPS circuits is always supplied by the storage system, so is always limited to 5kW, even when there's no power cut. 

In contrast, the Tesla system only limits power to 5kW during a power cut. What happens if you don't realize there's a power cut and draw too much power? The system shuts down. If that's a concern, Tesla recommends that you move high power circuits to a separate consumer unit on the grid side of the backup gateway. 

## DNO Permission

I decided to go ahead with the Smile 5, sticking with the simpler AC-Coupled setup. With talk of possible blackouts still very much in mind, I then complicated things by opting for a UPS connection.

DNO rules allow you to connect any form of micro-generation to the grid as long as maximum output is limited to 3.5kW. If you want something bigger, you need to apply to the DNO for formal permission. 

We had the option of going ahead immediately with the system configured to limit it's output, or waiting to obtain DNO permission for the maximum 4.6kW the system is capable of. We didn't want to artificially limit the system, particularly with the constraints on the UPS, so we decided to apply for permission. 

To apply for permission, we needed to first give Oval a letter of authority to apply on our behalf. This was followed by a game of pass the parcel where questions would come from the DNO via Oval, and answers would go back the same way.

Two months later we finally got the letter of permission. Interestingly, permission was only valid for three months. The system needed to be installed by May 2023 or we would have to go through the approval process all over again. Should be plenty of time, right?

## More Delays

Apparently there had recently been a change in UK regulations for UPS systems and the Smile 5 was no longer compliant. Oval were waiting on a fix from AlphaESS before confirming an installation date. 

A month later and I was starting to get nervous. Still no news from AlphaESS regarding a fix. Oval agreed to schedule an installation date in April 2023. If the fix was ready, then great. If not, they would install the battery system and leave the UPS part for a later date.

A week before the installation date there was a new problem. The delivery of the 5.7kWh battery modules from AlphaESS had been delayed until the end of the month. However, Oval could get hold of a newer 10.1kWh battery module for a similar price. I would be losing 1.3kWh of capacity and paying more on a price per kWh basis. On top of that, according to the data sheet, the new module had an 8000 cycle lifetime compared with 10000 cycles for the 5.7kWh batteries. 

I decided to stick with the original plan and wait it out. Luckily, Oval were able to find other sources for the 5.7kWh batteries. In the end, the installation was only delayed by a week. 

## VAT

After the backwards and forwards on the battery modules and UPS, Oval sent me a final quote for the work they would do in the initial installation. Unlike all their previous quotes, this one included VAT at 20%.

VAT is the UK/EU equivalent of the sales tax found in many other countries. The initial quotes explicitly listed VAT at 0%. I took that at face value at the time. I was vaguely aware that some green technologies were zero rated for VAT and assumed that a home battery system was one of them. 

Not quite. A home battery system is zero rated for VAT if solar panels are installed at the same time. If you add a battery system to an existing solar installation, you need to find the extra 20%. 

My mistake was asking for an initial quote that included new solar and then deciding to go ahead with just the battery system. With Oval not updating the quote until two weeks before installation, I didn't have much time to find a solution.

The VAT regulations say nothing about how *much* solar capacity has to be included, just that there is some. Could Oval put a small solar panel on the roof of the porch where it would be easy to connect to the Smile 5 inverter? There's very little direct sunlight but it would be better than nothing if the additional cost was less than the VAT.

The cost was higher than I thought it would be but still less than the VAT. Apparently, there's lots of fixed costs involved regardless of how many solar panels are installed. The real problem was an additional note with the quote pointing out that this setup would never generate any electricity. Traditional solar inverters, like the one built into the Smile 5, are designed to work with a string of solar panels. There's a minimum voltage level needed from the solar panels before the inverter will start up. You need at least four panels to reach that threshold. The porch roof only had room for one.

My final roll of the dice was to add a separate micro-inverter. Micro-inverter based systems use a dedicated micro-inverter per solar panel, and accordingly have a lower startup voltage threshold. This increased the cost to the same amount as the VAT. The killer blow was that adding an additional inverter, no matter how small, would need DNO approval.

I admitted defeat and paid the VAT.

## Battery Installation

A team of three turned up first thing in the morning. By the end of the day they had the inverter and battery modules installed, hooked up and working. Somehow they managed it without having to turn off the power. 

{% include candid-image.html src="/assets/images/alphaess-battery/smile5.jpg" alt="AlphaESS Smile 5 installed and working" %}

The inverter and batteries are heavy and need to be supported by brackets attached to a load bearing wall. Oval like to use fireboard as a backing, partly for safety reasons, but mostly because it makes it easier to mount all the other bits of kit. The picture shows the Smile 5 inverter (top two sections) sat on top of the first battery. The second battery is below the first, out of shot. Also in shot are a wifi dongle and an AC isolator. Ignore the trunking to the right, that didn't arrive until the UPS was installed. 

I don't know why there's a separate external wifi dongle rather than having it built in. A wifi connection is required to access anything beyond the most basic functionality. 

AC power is supplied to the inverter from a dedicated consumer unit that Oval installed in the meter cupboard. Their standard practice is to take the wiring straight through the wall behind the AC isolator and then run it externally to where it needs to go. 

{% include candid-image.html src="/assets/images/alphaess-battery/external-wiring.jpg" alt="External Wiring" %}

Due to the single story construction and sloping roof of the porch, there wasn't a good place to run the cable above the window and door. Instead it goes down and then runs along the wall below the porch door sill. 

## Setup and Tuning

The system is managed using an app, available for phone, tablet and web. The app is backed by a cloud hosted application which the Smile 5 connects to via its wifi dongle. There are pros and cons to this approach. On the positive side, you can control the system from anywhere. I've adjusted settings while away from home a few times. All your settings and historic performance data are backed up to the cloud. 

On the downside, I'm relying on AlphaESS staying in business and continuing to support the Smile 5. Then again, I'm already relying on that for the system's 10 year warranty to be worth anything. 

{% include candid-image.html src="/assets/images/alphaess-battery/app-summary.png" alt="App Summary Screen" %}

The Smile 5 is installed with two CT clamps which measure power generated by the solar panels and power imported/exported from the grid. It also keeps track of how much power is being used to charge/discharge the battery. Combining these figures gives you the load that is being consumed by your home.

By default, the Smile 5 operates in self consumption mode. Any surplus electricity from the solar panels is used to charge the battery. When load is higher than solar can supply, the battery discharges to make up the difference. The Smile 5 is constantly adjusting the rate at which it charges/discharges the battery to match the changing load and solar generation. This is a reactive process, so sometimes it will undershoot and end up consuming some power from the grid, sometimes it will overshoot and feed-in some power to the grid.

We have a smart meter that provides consumption data for every half hour. I was able to confirm that the electricity consumed from the grid when the Smile 5 undershoots is negligible. For most half hour slots we consumed less than 0.001kWh. When loads were extremely variable, with high power loads turning on and off, it rose to at most 0.01kWh. For comparison the house's baseline load (no high power or variable loads active) is about 0.1kWh. 

Most days our solar production isn't enough to supply all the electricity we use. The Smile 5 allows you to define a charging period when the batteries will be charged to a specified level from the grid. I set this up to coincide with our period of cheap overnight electricity. When we first got the system I would adjust these settings all the time. Lowering the charge level when the weather forecast for the next day was good. Or even turning off overnight charging if the battery was close to full. 

On a perfect summer's day, there's enough solar production to fill the battery even when starting from close to empty. When that happens I use the excess solar power to charge the car. The EV charger has its own CT clamps that monitor site consumption and solar generation so it can adjust the charging rate accordingly. I can also configure the car to take less power than the charger makes available, to ensure that the charger doesn't take power from the battery. 

I was annoyed that the battery charging functionality didn't work the way I wanted. During the charging period the battery doesn't supply any power, even if fully charged. I was using power from the grid that I didn't need!

Eventually I realized that I was wasting my time and overusing the battery. We have to use the cheap overnight electricity from time to time. Even if the weather is perfect (a rare occurence), we don't produce enough excess solar to fully charge the car. All I was doing with my micro-management was reducing the amount of excess solar I could use to charge the car and increasing the amount of power from the grid used to charge the car overnight.

I now have the battery configured so that the charging period is always on and the charging level (60%) is high enough that I always have enough stored power to get the house through the day, even if there's no solar production. If the battery hits 90%, I start diverting the excess solar into the car.

The end result is less micro-management for me, and less strain on the battery. We avoid using the battery during the overnight charging period, and avoid having to charge the battery with solar that we would then have to consume instead of using the cheap electricity directly. Here's what a typical day looks like, taken from the app.

{% include candid-image.html src="/assets/images/alphaess-battery/daily-stats.png" alt="Daily Statistics" %}

Note that we've now moved to an electricity tariff with a six hour cheap period (23.30-5.30). 
 
## UPS Installation

It took another four months to get the UPS installed. AlphaESS finally released a software fix for UK regulations. However, it was only compatible with the very latest model inverter, not the one I had. Fortunately, Oval and AlphaESS agreed to swap my inverter for the latest model at no additional cost. 

I asked Oval to add one extra piece of work. The point of getting a UPS is to protect against loss of power on those circuits. The UPS protects against loss of grid power due to a power cut or rolling blackout. However, installing a UPS also adds another failure mode. If the Smile 5 fails, the UPS circuits will lose power. If there's a power cut I expect the power to come back after a few hours without me doing anything. If the Smile 5 fails, I need to get someone to come out and fix it, which could take days.

I wanted a way to manually switch the protected circuits between being UPS connected and being grid connected. Oval specified a three position switch (grid,off,ups) for me and added it to the quote. 

There are two other scenarios where I could see myself switching the protected circuits to be grid connected. First, if work needs to be done on the Smile 5 system in future. Second, if my gas boiler fails in the depths of winter and I need to use electrical heaters until it's fixed. That could take me over the limit for power that the UPS can supply. 

I was amazed when three Oval vans turned up on installation day with what seemed like all their employees. The main jobs were replacing the inverter, installing an earth rod, installing an extra consumer unit for the UPS protected circuits, running another cable between the Smile 5 UPS connection and the UPS consumer unit and finally moving the selected circuits to the UPS consumer unit. 

{% include candid-image.html src="/assets/images/alphaess-battery/earth-rod.jpg" alt="Earth Rod with connection following same route as previous external wiring" %}

When running on a UPS, you can't rely on the grid for an earth connection. An earth rod is a long metal pole (up to 2m long), driven into the ground, that provides a solid earth connection. Installing one is a thankless job. You need to find somewhere that you can drill down far enough without hitting anything. Even then, the first place you try might not provide a good enough earth. Fortunately, Sam was able to find a location near by and use the same cable route as the existing external wiring.

Unfortunately, that left no room to run the UPS cable. The external cables run through a hole drilled through the wall next to the meter cupboard door, positioned under the porch door sill. There wasn't enough space to fit another cable through and not enough space to make the hole bigger. As mentioned previously, there's no good way to run a cable above the porch window and door.

We stood around and thought for a bit. Could we run the cable internally? The porch is a utility space so a bit of trunking wouldn't be an issue. After that it was obvious. Run some trunking up the side of the battery, across the ceiling and down the opposite wall. Then drill through diagonally to the meter cupboard. 

I wish we'd thought of doing that earlier. If we had, we could have done the same thing with the power supply to the battery. We didn't need the external wiring at all. In the end you hardly notice the internal trunking with all the recycling bins and running/walking/cycling gear back in place. It's certainly less visually intrusive than the external wiring.

I had decided to move three circuits over to the UPS. Oval include two circuits as standard, but I wanted to include the house sockets, house lights and our gas combi boiler. If there was a winter blackout we would be able to stay warm, see what we were doing and still have wifi. 

The power used by these circuits is well below the UPS limit. Below 500W most of the time. Up to 2.5kW if we make toast and hoover at the same time. The oven, electric shower, car charger and kitchen extension sockets are on separate circuits. Our 3kW electric kettle is plugged into one of the kitchen extension sockets so there's no danger of exceeding the UPS limit if we decide to make toast, hoover and boil the kettle. 

Whenever an electrician touches something electrical, they're obliged to ensure that it's up to standard. That meant testing each circuit moved to the UPS. The house lights and boiler moved over without a hitch. However, the house sockets circuit didn't look right. There wasn't enough time to investigate and fix whatever needed doing that day. Oval arranged to come back the next day to finish things up. 

In the end it took most of the next day to identify and remediate the issues. A couple of sockets had been added by a keen DIYer and weren't terminated correctly. One socket hadn't worked for years. On investigation, it turned out that internal wiring was loose, and the socket had burnt out. Another, while still functional, had a similar problem and was scorched inside. Both needed to be replaced.

## The Complete System

Solar, home battery, EV Charger, UPS, multiple consumer units, CT clamps and switches. It's hard to keep track of everything. What does the overall system look like?

{% include candid-image.html src="/assets/images/alphaess-battery/schematic.svg" alt="Electrical System Schematic" %}

If you think that looks reasonably straight forward, here's what the meter cupboard actually looks like after four different companies have installed solar, a smart meter, an EV charger and home battery with UPS.

{% include candid-image.html src="/assets/images/alphaess-battery/meter-cupboard.jpg" alt="Using every bit of space in the meter cupboard" %}

## Conclusion

Two weeks on and everything is working as expected. No power cuts, apart from the one I triggered as a test by turning off the AC isolator for the battery. The battery went into UPS mode, the power stayed on and no one else noticed it happen. 

Was it worthwhile? Difficult to say. Electricity prices have come down again. It will be touch and go whether the system pays for itself within the 10 year guarantee period. On the other hand, we are running pretty much exclusively on solar and cheap green overnight electricity. We don't put any load on the grid at peak times. 

The overall installation process was more long winded and convoluted than I would have liked. I'm still annoyed about the VAT. Oval Renewables did a good job and responded well to my unusual requests. However, they are clearly extremely busy and growing fast. Some gentle nagging was needed to get their attention at times.

So far I haven't had any problems with the Smile 5 and have been able to set it up to work the way I want. I don't think it will work for everyone. There's no official API (there are some [reverse engineered open source](https://github.com/CharlesGillanders/alphaess) efforts) so you're limited to what the configuration UI supports. You don't have fine grained enough control to use it with a tariff like Octopus Agile where prices change every half an hour, tracking the wholesale market. 

You can't configure the Smile 5 to discharge the battery and export to the grid. Which means you can't use it with a tariff like Octopus Flux where you import power when there's low demand and then export it at a profit at peak times. 

