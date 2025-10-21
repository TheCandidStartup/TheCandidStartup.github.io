---
title: Vaillant aroTHERM plus 7kW Air Source Heat Pump
tags: gear
---

wise words

{% include candid-image.html src="/assets/images/home-assistant/heat-pump.jpg" alt="Vaillant aroTherm plus Heat Pump" %}

* Heat Geek
  * Originally focused on training heat engineers how to design and install efficient heat pump systems
  * Extra investment. Becoming a platform for heat pump installation. 
  * Fancy website with automated application process
  * Initial guestimate based on publicly available information about your house
  * Next step is a paid design consulation with a local Heat Geek

* Design Consultation
  * Blakemore Heating and Plumbing, local company
  * March 2024
  * Fancy automated scanning software on tablet
  * Worked in half of the rooms - had to do the rest manually
  * Determine sizes, external doors and windows, external walls, ask about insulation
  * 1929 semi-detached. Cavity wall insulation. Suspended wooden floors on ground floor, no insulation. Loft conversion insulated to 2008 building regs.
  * 6 kW heat loss at -3 degrees C
  * Can keep existing radiators with a design temperature of 55 degrees (flow temperature needed to deliver 6kW at -3 outside)
  * Pushed for a more efficient design
  * Replacing 6 radiators with double/triple width versions occupying the same footprint would bring design temperature down to 45 degrees

* Formal proposal
  * Headline overview: 380% guaranteed minimum efficiency, Vaillant aroTHERM plus 7kw, 6 new radiators
  * Detailed design listing heat loss and radiators for each room
  * List of kit to install, including Vaillant sensoCOMFORT control and internet gateway
  * Difficult to understand what actually gets installed and where
  * There's also a control box included with the heat pump that has to go somewhere inside with wiring to heat pump
  * sensoComfort would replace the old boiler controls in our hall. Set schedule, etc.
  * sensoComfort comes in wired or wireless version. Quoted for wireless. Was concerned about batteries running out. Can it have hardwired power? Apparently the choice is all or nothing. If you go wired, also need wire between sensorComfort and heat pump control box, and wire to outdoor temperature sensor.
  * Told batteries last for ages, systems run for years on same batteries.
  * Internet gateway enables use of phone app. Not sure I wanted this but also used so Heat Geek can remotely monitor system for guarantee.
  * Once accepted, Heat Geek handle application for government grant and DNO approval

* EPC Certificate
  * Lived here since 1997 so never had one
  * Needed for UK government grant
  * Doesn't matter what rating you get, as long as you have certificate
  * System is bonkers. Assessor does a simplified version of Heat Geek survey but can only count things they can see themselves. You can't see what's inside the cavity walls or the roof without ripping them open, so they count as uninsulated.
  * Get my EPC certificate with a D rating and recommendations to install cavity wall insulation, roof insulation, and solar panels. All of which I already have.
  * Annoyed enough to dig out old plans, receipts and building regs approvals, and ask the assessor to have another go. 
  * This time I get a C with just suspended floor insulation and solar water heating called out as recommended improvements. Which would increase my score from 74 to 77 out of 100. I'll pass.

{% include candid-image.html src="/assets/images/home-assistant/epc-rating.png" alt="EPC Rating 'C'" %}

# Install Date
  * Either earlier week in June where they would be working two jobs, so Damon only available some of the time
  * Dedicated week end of September
  * In no hurry so went with end of September. Also, just starting cold weather so better time for seeing whether it's working properly

# Installation

* Everything apart from the heat pump needs to fit in the airing cupboard where our old gas boiler lives
* Sunday before installation week we removed everything from the cupboard

{% include candid-image.html src="/assets/images/home-assistant/airing-cupboard.jpg" alt="Airing Cupboard" %}

* The shelves are also removable so there's more space available above and below the boiler. All the spare space is currently used for storage, so we'd like to retain as much as possible.

  * Text from Damon saying he was needed on another job but the rest of the team would be here first thing Monday
  * Monday: Delivery of materials, including heat pump, mystery hot water system and radiators, changed four radiators. One radiator missing, one damaged. Boiler left in place for another day of hot water. No heating but not needed, still warm.
  * Most radiators were straight forward swaps reusing the existing plumbing. In a couple of cases the old radiator used imperial measurements and the closest new metric equivalent wasn't an exact match.
  * Team offered to lift floor boards and adjust piping out of sight. I was happy to avoid that. Having a little more copper pipework on show doesn't bother me at all. 

{% include candid-image.html src="/assets/images/home-assistant/metric-radiator-resize.jpg" alt="Metric radiator resize" %}

  * Tuesday: Removed boiler, sited heat pump, using adjustable legs to level it.
  * Position at side of house. Closest reasonable point to old boiler location in upstairs bathroom
  * Close to meter cupboard and electrical supply and a drain
  * Pipe to drain for condensate rather than a gravel bed soak away
  * started work on external piping, electrician on site installing dedicated consumer unit for Heat Pump and starting work in the airing cupboard.

{% include candid-image.html src="/assets/images/home-assistant/external-conduit.jpg" alt="External Conduit" %}

* Wednesday: Finished most of external work and most plumbing in the airing cupboard. Much swearing wrestling with mystery hot water system. It didn't make it into the cupboard today.

{% include candid-image.html src="/assets/images/home-assistant/half-way-install.jpg" alt="Airing Cupboard half way through install" %}


  * Thursday: Final two radiators delivered and changed. Plumbing in the mystery hot water system. Electrician on site finishing the install in the airing cupboard. Some of the small electrical devices need to be protected with a 5A fuse. Chose this ingenious solution.

{% include candid-image.html src="/assets/images/home-assistant/temporary-electrics.jpg" alt="Temporary Electrics" %}

* Extension lead with a 5A fused plug. Only had a 2-way extension so put this temporary solution in place.
* Done by midday. Filled system, found connection to mystery hot water system that leaked. Adjusted, tried again. Repeatedly until 7pm.
* Friday: Damon arrived at 7am to apply his magic touch. Had it working by 8am, then rushed off to another job. Frantic effort to finish everything off and tidy up as storm Amy hit. Damon back at 3pm to hand system over. 
* 0.7 heat curve, Inactive mode.
* Standard setup with heating on throughout the day.
* Spent the evening setting up [myVaillant](https://github.com/signalkraft/mypyllant-component) integration for Home Assistant (more on that another time) and called it a night.

# Plumbing

  * Expansion vessel, no buffer
  * Single open heating circuit, DHW circuit with ESBE rotary actuator to switch between the two

{% include candid-image.html src="/assets/images/home-assistant/base-heat-pump-schematic.svg" alt="Heat Pump Plumbing Schematic" %}

# Electrics

{% include candid-image.html src="/assets/images/home-assistant/meter-cupboard-post-heat-pump.jpg" alt="Meter Cupboard" %}

{% include candid-image.html src="/assets/images/home-assistant/electric-schematic.svg" alt="Electrical Schematic" %}

# Initial Performance

{% include candid-image.html src="/assets/images/home-assistant/heating-cycle.png" alt="Heating Cycles" %}

This is a graph from Open Energy Monitoring. Easy access by scanning the QR code on the side of the open energy data logger. The blue shading shows the electricity consumed by the heat pump and the beige shading the corresponding heat generated. The rest of the time water is being pumped round the heating circuit but the heat pump isn't generating any heat.

* Heat Pump is cycling which is supposed to be bad
* Each cycle heat pump ramps up to 800W and then throttles back to 500-600W. Runs for 30 minutes and then turns off for 50 minutes. Water continues to be pumped round the heating circuit while the heat pump if off.
* Target flow rate is about 24 degrees. Heat pump is over shooting.
* Used live monitoring feature on controller to try and work out what was going on.
* Had to read up on Vaillant's energy integral cycle to control when to turn heat pump on and off when running at minimum output
* Heat pumps have a minimum speed at which they can run. For my heat pump that minimum is around 550W. It's producing too much heat to run continuously.
* Energy integral is a simple approximation of how much extra energy is being generated: Difference between target and actual temp * time.
* Heat pump turns on when energy integral at -60. If it hits 0 (60 extra degree minutes of heat generated) it turns off and stays off until energy integral below -60 again.
* Water being pumped round circuit gradually cools. Eventually it goes below target and starts reducing energy integral. New cycle starts when everything balances out.
* The start point is a configuration option. Using -120 instead of -60 will double the length of each cycle. This should improve efficiency as the heat pump runs for longer at a time with fewer cycles. However, if the cycle is too long you'll notice swings in temperature in the house. Something to experiment with.

# Living with a Heat Pump

* Stable temperature
* Radiators don't feel hot at all
* Adjusted schedule from 24x7 running to make most of overnight cheap rate. Off late at night before cheap rate starts, then off again early morning after it ends. Make up for it by extra heat during cheap rate. Opposite of normal practice of a slightly lower set back temperature at night.
* Helps that our bedroom in attic doesn't have any radiators. We tell everyone it has underfloor heating (i.e. the rest of the house).
* sensoComfort is junk, app much better for day to day control
* sensoComfort off by default, takes 5 seconds to turn on, everything you want to do is 3 menus deep.
* Fine tuning can in theory be done with heat pump appliance interface. Can't tell because installing sensoComfort disables the overlapping functionality in the control box.
* Some confusion over weather compensation. Reports on forums from people without sensoCOMFORT say that weather compensation included with heat pump. On the other hand, all the installation details for outdoor sensor are in the sensoCOMFORT documentation. When buying sensoComfort you can choose either a wired package containing sensoComfort and wired sensor, or wireless containing sensoComfort, radio receiver and wireless sensor.
* My best guess is that there's some way of buying those packages without the sensoComfort.  
* Only thing we're using sensoComfort for is indoor temperature pulled through into app. Not needed to control Heat Pump in inactive mode.

# Next Time

Oh yes, what about the mystery hot water system? I'll tell you all about that next time. 
