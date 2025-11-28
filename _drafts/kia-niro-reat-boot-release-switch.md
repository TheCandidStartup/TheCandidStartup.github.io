---
title: Kia Niro Rear Boot Release Switch
tags: gear
---

wise words

* Normally trouble free EV started having problems on October 25th
* Lucy had taken it up to the Lake District for the [OMM](https://theomm.com/the-omm/) event.
* As she entered the car parking field, the boot sprang open. It took a couple of goes to get it to stay shut.
* All normal until she returned to the car after the event. The 12v battery was dead.

* Unless you have an EV, you may not realize that they have two batteries. The big high power Lithium-Ion battery used to drive the motor and a normal 12v car battery used for the rest of the electrical systems.
* Two reasons for this. First, car electrical systems are designed to work with 12v DC. It's easier to use standard parts rather than custom stuff that can work with the big battery directly. Second, it's safer if the 400v/800v high power drive circuits are only powered on when needed. 
* The car runs off the 12v battery until you put it in drive mode. Once in drive mode, it recharges the 12v.

* Perhaps surprisingly, EVs often have problems with their 12v batteries. The battery doesn't have much work to do, there's no starter motor to turn over. Starting the car is just a matter of activating a relay. Manufacturers cut their costs by fitting a more basic, lower capacity 12v battery. There's also a theory that turning over a starter motor regularly helps keep a 12v battery in good condition.
* Our original 12v battery died after a couple of years. Our experiences then prompted us to fit a battery monitor and buy a cheap jump starter. As there's no starter motor to turn over, you don't need much to jump start an EV. A small Lithium-Ion power bank will do the job.
* Lucy opened the car with the mechanical key and jump started the car without trouble and it seemed fine after that.
* On November 3rd the 12v started draining rapidly. We last used the car on Nov 4th. By the morning of Nov 5th the battery was completely dead - down to 9v according to the battery monitor. We next tried to use it on Nov 7th. Jump starting didn't work.
* Normally when you connect the jump starter the car turns on in standby mode, as it does when unlocking with the key fob. You put your foot on the brake and press the start button to turn on everything else, including the main battery.
* This time the car tries to start up immediately but without activating the main battery (as if you'd pressed start without your foot on the brake). At this point the current drain from all the other electrical systems starting up is too much for the jump starter and the car dies again.
* Once a 12v battery is completely drained it's never the same again and is likely to need replacement. We'd had this one for a couple of years so took the simple way out and booked a mobile battery replacement service for the next day.
* Once the battery was replaced the car seemed fine. All working normally. This time I checked the battery monitor every few hours. 
* All fine until evening of November 9th when the battery started draining again.

{% include candid-image.html src="/assets/images/car/battery-monitor-nov-10.png" alt="Battery Monitor Nov 10" %}

* Distinctive looking graph. Battery shows steady drain with brief additional drops in voltage every hour or so. Battery gets worryingly low overnight. I had to start the car up twice a day so that the main battery could charge the 12v back up again. 
* We've got a problem. Have heard stories before of 12v battery drain caused by the boot latch not closing properly. Which fits with the issues we had with the boot not closing. 
* Rang our local Kia dealer. They agreed that the car needed to come in. The first slot they had available was, wait for it, on 29th December. Seven weeks of charging the car twice a day and worrying whether it will start if we go on a trip somewhere.
* Lucy rang the local independent garage and they said they could take a look at the boot latch on the 11th. I took the car in and described the problems we'd been having with the 12v battery drain. At which point they refused to take the car. "We're mechanics. You need an Auto Electrician".
* First time I'd heard that phrase. It turns out modern cars really are computers on wheels. Anything electrical needs a specialist. Apparently, there are lots of local auto electricians who offer a mobile service.
* Googled and rang round. The auto electricians that offer a mobile service won't touch EVs. I found one that would work on EVs but only if we brought the car to their workshop. The earliest slot they had was on the 18th. 
* Given the delay and the pain of charging the battery twice a day, I decided to try some detective work. 
* If I could identify the fuse for the boot latch, I could pull it out and see if that stopped the drain.
* The Niro has two fuse boxes. One inside the car on the driver's side with smaller fuses and one under the bonnet with larger fuses.
* The fuses I'm after are in the driver's side fuse box. The Niro comes with a fuse puller which, annoyingly,  is stored in the fuse box under the bonnet.

{% include candid-image.html src="/assets/images/car/driver-fuse-box.png" alt="Driver Side Fuse Box" %}

* The boot closure is actually two separate modules. There's the boot latch itself and the release switch. 

There's a "tail gate relay" fuse for the relays that power the boot latch lock and release. It's the fourth fuse down in the third column from the left.
* I removed it and confirmed that the boot wouldn't open. Waited a couple of hours and confirmed no change in the battery drain.
* There's no obvious fuse for the release switch. After some more digging it looks like all the switches connect to a central control module, effectively acting as inputs to the computer running the car. If I pulled the fuse for the control module nothing would work. 
* The fuse box has a big switch in the middle. Apparently, its used when shipping the car over from Korea. You put the car on the ship, flip the switch to off and lock the car. Once the car goes to sleep, after five minutes or so, pretty much everything electrical is shut down. That includes the door locks. When the ship docks, use the mechanical key to open the car, flip the switch back to on and turn the car on.
* Let's try it and see what happens. I turned it off, locked the car and waited for 10 minutes. Tried the door locks. The car opened. Boot release switch works too. Tried starting the car. There's a message on the dash telling me to turn the fuse switch back on.
* We didn't need the car again until the 15th, so I disconnected the 12v. Fed up with constant battery monitoring and charging.
* Reconnected the battery. Everything working as normal, except the clock needs to be reset. 
* Back to the normal routine of battery monitoring. No drain. Keep monitoring. The 18th rolls around and still no drain. Phone the auto electrician who agrees there's no point seeing the car if there's no drain. 
* Keep monitoring and all looks normal until we try to use the car again on the 19th. I put some stuff in the boot, closed it and got in the car. The boot sprang open. Tried again, and again. The boot would not stay shut. 
* I move the key fob out of range of the car and shut the boot again. This time it stayed shut. Picked up the key and went back to the car. The boot sprang open again. 
* Finally, pulled the boot latch fuse out again. This time it stayed shut for good.

# Hypothesis

* What's going on?
* Why didn't the fuse box switch work?
* The fuse box switch is meant to put the car into a deep sleep when it goes to sleep. It didn't do anything, therefore the car *didn't go to sleep*. If the car doesn't go to sleep, the 12v battery will drain. 
* Cars that don't go to sleep when you lock them is a fairly common problem. The computer control system gets in to a funny state.
* The first thing to try is to disconnect the 12v battery to do a hard reset. The car is a computer so let's turn if off and back on again. 
* That's why it started working when I disconnected and reconnected the battery.
* Why all this trouble with the boot? 
* The switch is dodgy. It sends repeated "button pressed" signals without pressing the switch. The computer gets the boot release switch pressed signal, confirms that the key fob is in range and then sends power to the relay which powers the boot latch open motor. 
* That's why the boot stays shut if the key fob is out of range or when the car is driving. It's not a problem with the door latch.
* Modern cars go to sleep when the computer stops receiving incoming signals. If the boot switch keeps sending signals, the car won't get to sleep.
* The problems with the switch are intermittent, but clearly getting worse. 
* Looking closely, I can see that the rubber seal over the top of the switch is degrading and perforated. It's possible that water has got into the mechanism. 

# Switch Replacement Theory

* The easiest fix is to replace the switch with a new one. 
* Every previous time we've had a problem that needed a new part, the Kia dealer ended up having to order a replacement from Korea. They won't order a part until they've seen the car and they won't look at the car until 29th December.
* A quick search throws up lots of sellers. They divide into three categories. First, there's Ebay sellers who will ship a part direct from China for £15, arriving in a month. Then there's the Ebay sellers who will ship a part direct from China for £35, arriving in a couple of weeks. Finally, there are UK based sellers who will ship a part for £80+ pounds, presumably from the UK, arriving in a few days.
* Assuming we can get the part, can we fit it ourselves or will we need to find a garage to do it?
* Naturally, I did my research, and found a YouTube video. I couldn't find one for a Kia Niro, but a Kia Sportage should be [close enough](https://youtu.be/QaVP4CdzJDA?si=DRA3ahIR8UOP3VA9). 
* Modern cars are not just computers on wheels, they're modular computers on wheels. Each module is a self-contained assembly with a plug that connects into the cars wiring harness. The hardest part is removing the plastic trim covering up the internals. Once you've done that, unplug the old switch, release the catches that hold it in place and plug a new one in.

# Trim Removal

* Before ordering a replacement switch I wanted to confirm that (a) we could remove the plastic switch and (b) unplugging the old switch would stop the boot opening itself. 

{% include candid-image.html src="/assets/images/car/boot-plastic-trim.jpg" alt="Boot Plastic Trim" %}

* A Niro isn't the same as a Sportage but the overall approach is similar
* First pull off the piece of trim labeled (1). In theory, use a plastic trim removal tool to lever it off. In practice, I was able to pull if off with my hands. The trim is held in place by plastic poppers which push into holes in the metal boot panel behind. You need to pull them out one by one to free the trim, starting at the edges labeled (2).
* Underneath the trim at (2) you'll find two screws which secure the main trim. Remove the screws and put them somewhere safe.
* Lever off the two small panels labeled (3). There are gaps where you can insert a removal tool next to the labels.
* Remove the hand hold (4). There are two points on the upper surface either side of the label that you need to push in. 
* Everything else is one big piece of trim. Work your way round, freeing the plastic poppers, starting from (5). There are two special green poppers under the two panels (3), which need some extra jiggling.
* Eventually the whole thing comes away in your hands, revealing the glory behind
* I wish I'd taken some pictures while the trim was off, but at the time we were focused on getting it sorted
* There's a wiring harness from the top corner of the tailgate connecting to all the tailgate modules, including the boot latch and boot release switch. Each module has a plastic connector which you squeeze and pull to unplug. 
* We unplugged the switch, put the boot latch relay fuse back in, and everything was fine. Boot closed and stayed closed. No battery drain. Of course we were stuck having to open the boot from the inside using the manual release. 

{% include candid-image.html src="/assets/images/car/boot-latch-and-switch.jpg" alt="Boot Switch (top) and Latch (bottom)" %}
