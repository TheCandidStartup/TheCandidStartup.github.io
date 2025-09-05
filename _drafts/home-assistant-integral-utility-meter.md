---
title: >
  Home Assistant: Integrals and Utility Meters
tags: gear
thumbnail: /assets/images/home-assistant/logo.png
---

wise words

* Energy dashboard is very coarse grained because it requires sensors that are *increasing* and the increasing versions of the Alpha ESS sensors that I have available for solar generation, house load, battery charge/discharge and grid import/export have a resolution of 1.2kWh. They change hourly at best.
* The corresponding instantaneous power sensors are more fine grained. They update once a minute (polling the Alpha ESS API) and have a resolution in watts.
* Hypervolt charger also has a CT clamp on main grid connection accessible via API. This works over a web socket with updates pushed from the charger, typically every 3 seconds or so. 
* Can I convert these streams of power samples into more fine grained increasing measurements of energy?

# Utility Meter

* I'd seen mention of utility meters in discussions of more advanced integrations. Sounds like just the thing. Doesn't a utility meter measure increasing energy consumed based on the power passing through?
* Not so. A Home Assistant utility meter takes an increasing measure of energy as input and chops it up in different ways. The basic functionality is to convert the ever increasing measurement into one that resets daily, monthly, yearly, etc. like a utility bill. It can also allocate the energy to different tariffs with an automation switching the active tariff based on time of day or the value of some other sensor.

# Integral

* What I actually need is the  Integral helper. This calculates the Riemann sum of the values provided by a source sensor, which is an approximation of the integral of the values. If you plot the samples on a graph against time, this is equivalent to calculating the area under the line. 
* In more concrete terms, it can take a sequence of samples in Watts and output the total energy produced in kWh. 
* It decides a representative power value for each pair of samples and multiplies it by the time elapsed, then adds the result to the total.
* By default, it uses the average of the two values. This is called a *trapezoidal* integration method because it measures the area of the trapezium between the two samples. 
* You can also use *left* and *right* methods which use just one of the sample values, either the first or last respectively.
* Found documentation unhelpful.
  * The default is the most accurate, "if the source updates often", as it better fits the curve.
  * Left underestimates the source but is very accurate for "rectangular functions which are very stable for long periods of time and change rapidly".
  * Right overestimates the source but is "only appropriate to be used with rectangular functions".
* Which would you choose?
* Didn't make any sense to me. How can using the *left* sample always underestimate, and *right* always over estimate? What makes a function rectangular?
* If I wasn't cursed with an enquiring mind I would have gone with the default. If it's the default it should cover the most common cases, and it says it's more accurate, and my power values jump around all over the place, updating often. Right?
* Wrong. You almost always want to use *left*. In fact, it should be your default choice.
* Nothing magic about the integration methods. I checked the source code. That underestimate and overestimate verbiage is garbage. It depends on the slope of the curve. It's only true if the source values are monotonically increasing. Power measurements are very much not. 
* So why *left*?
* Due to the way Home Assistant works, most sensors are rectangular functions. They only update (generate a new sample) when the value changes. If there's nothing to measure, like solar generation in the middle of the night, there can be a long time between samples. 
* You could have a 0W sample at 7pm when the sun goes down, then nothing until a 200W sample at 7am the following morning when the solar system reaches it's minimum threshold to start generating power.
* What power should you add to the sum for the period between 7pm and 7am. Obviously, 0 kWh.
* The *trapezoidal* method will average the two samples, which gives you 100W * 12 hours, or 1.2 kWh. Oh dear.
* The *left* method gives the correct answer of 0 kWh. In general, it assumes that when each sample arrives the sensor stayed at the previous value for the entire time since the last sample. Which matches how Home Assistant works.
* Max sub interval can reduce impact of using wrong integration method by forcing samples at regular intervals even if input sensor didn't change. But why get HA to do all that extra work? Just use the correct integration method. 

* Are values based on 1 minute samples accurate enough? In my tests it matches the Alpha ESS increasing values to at least their 1.2 KWh resolution. 
* For grid power have the option of using the super high resolution Hypervolt sensor.

# Plan

* Integrals for all the Alpha ESS instantaneous values
* Need to split Battery I/O and Grid I/O into separate sensors for charge/discharge and import/export to produce increasing sums.
* Try one for Hypervolt Grid I/O too. Interesting to see how values differ.
* Use Utility Meters to get daily figures
* Update energy dashboard to use these more "live" values
* Actual costs and consumption from Octopus (day behind external stats). Can I compare against calculated values?
* Use Utility Meter tariffs to measure peak and off-peak load separately. Will that handle long sample intervals correctly, or do I need max sub interval for that???
* Need to charge battery enough to cover next days peak load allowing for forecast solar
* Instead of using hard coded estimate of 7 kWh, measure it. Will change with seasons and possibly day of the week.
