---
title: Vaillant aroTHERM plus 7kW Air Source Heat Pump
tags: gear
---

wise words

* Heat Geek
* Blakemore Heating and Plumbing
* Survey
  * 6 kW heat loss at -3 degrees C
* Design
  * 45 degree design rather than 55, replaced six crufty old radiators, same footprint, double/triple width
  * Vaillant aroTherm plus 7kW with weather compensation and a 0.7 heat curve

{% include candid-image.html src="/assets/images/home-assistant/heat-pump.jpg" alt="Vaillant aroTherm plus Heat Pump" %}

  * Expansion vessel, no buffer
  * Single open heating circuit, DHW circuit with ESBE rotary actuator to switch between the two

{% include candid-image.html src="/assets/images/home-assistant/base-heat-pump-schematic.svg" alt="Heat Pump System Schematic" %}

* Everything apart from the heat pump needs to fit in the cupboard where our old gas boiler lives

{% include candid-image.html src="/assets/images/home-assistant/airing-cupboard.jpg" alt="Airing Cupboard" %}

* The shelves are removable so there's more space above and below the boiler. All the spare space is currently used for storage, so we'd like to retain as much space as possible.

* Install date
  * Either earlier week where they would be working two jobs, so Damon only available some of the time
  * Dedicated week end of September
  * In no hurry so went with end of September. Also, just starting cold weather so better time for seeing whether it's working properly

* Install
  * Text from Damon saying he was needed on another job but the rest of the team would be here first thing Monday
  * Monday: Delivery of materials, including heat pump, mystery hot water system and radiators, changed four radiators. One radiator missing, one damaged. Boiler left in place for another day of hot water. No heating but not needed, still warm.
  * Most radiators were straight forward swaps reusing the existing plumbing. In a couple of cases the old radiator used imperial measurements and the closest new metric equivalent wasn't an exact match.
  * Team offered to lift floor boards and adjust piping out of sight. I was happy to avoid that. Having a little more copper pipework on show doesn't bother me at all. 

{% include candid-image.html src="/assets/images/home-assistant/metric-radiator-resize.jpg" alt="Metric radiator resize" %}

  * Tuesday: Removed boiler, sited heat pump, started work on external piping, electrician on site installing dedicated consumer unit for Heat Pump and starting work in the airing cupboard.

{% include candid-image.html src="/assets/images/home-assistant/external-conduit.jpg" alt="External Conduit" %}

* Wednesday: Finished most of external work and most plumbing in the airing cupboard. Much swearing wrestling with mystery hot water system. It didn't make it into the cupboard today.

{% include candid-image.html src="/assets/images/home-assistant/half-way-install.jpg" alt="Airing Cupboard half way through install" %}


  * Thursday: Final two radiators delivered and changed. Plumbing in the mystery hot water system. Electrician on site finishing the install in the airing cupboard. Some of the small electrical devices need to be protected with a 5A fuse. Chose this ingenious solution.

{% include candid-image.html src="/assets/images/home-assistant/temporary-electrics.jpg" alt="Temporary Electrics" %}

* Extension lead with a 5A fused plug. Only had a 2-way extension so put this temporary solution in place.
* Done by midday. Filled system, found connection to mystery hot water system that leaked. Adjusted, tried again. Repeatedly until 7pm.
* Friday: Damon arrived at 7am to apply his magic touch. Had it working by 8am, then rushed off to another job. Frantic effort to finish everything off and tidy up as storm Amy hit. Damon back at 3pm to hand system over. 
* Standard setup with heating on throughout the day.
* Spent the evening setting up [myVaillant](https://github.com/signalkraft/mypyllant-component) integration for Home Assistant (more on that another time) and called it a night.

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
