---
title: The Evolution of Multi-Tenant Architecture
---

I previously described the [general areas for my initial projects]({% link _posts/2022-10-24-what-projects.md %}). Today I want to dive a little deeper into the multi-tenant SaaS project. This is the project I'm most excited about and the one that will need the most explanation.

What is a [multi-tenant architecture](https://en.wikipedia.org/wiki/Multitenancy)? In general, it's an architecture that allows multiple independent consumers to share common computing resources. Why would you want to share computing resources? To reduce the cost for each consumer. 

I'm going to look at how multi-tenant architectures have evolved over time to help me figure out where they will go next.

# History

We've been figuring out how best to share computing resources almost from when we first invented the computer. Let's start at the beginning and take a journey through time.

## Time Boxing

The first approach used was absurdly simple. Only academic institutions and government departments had access to computers. They were large, complex and absurdly expensive. There was no operating system to speak of. Users booked a time slot and the whole machine was theirs for that time. Typical use was to input a job, set it running and wait anxiously to see whether it ran and completed within the time.

## Interactive vs Batch

The early pioneers soon noticed that there were two different types of activity. Interactive use when setting up the input and retrieving the output, sandwiched around batch use where the job ran unattended. They realized they could make more effective use of their computing resources by separating interactive and batch workloads. 

Interactive used less in the way of computing resource and could even use dedicated simpler hardware. For example, preparing a paper tape that contained your program and input data. The big expensive iron could then be dedicated to running jobs. Jobs could be scheduled to run one after another using a queue. Initially queues were physical - tapes hung on a washing line or lined up on a shelf. Human operators were employed to monitor the machine and load up the next job after the previous one had finished running.

Over time hardware became more powerful and rudimentary operating systems were developed. Jobs queues were automated and multiple jobs could be run at most.

## Time Sharing

[Time Sharing](https://en.wikipedia.org/wiki/Time-sharing) is one of those brilliant ideas that seems obvious now but was revolutionary at the time. Computers were too expensive to use interactively for significant periods of time. However, think about how a human interacts with a computer. There are short bursts of activity as the user enters information or executes commands interspersed with long pauses while nothing is happening. A single user does not make efficient user of a computer, but a large group of users together does. If the users are working at the same time the pauses of one user can be filled by the activity of the others. 

Making Time Sharing a reality needed a huge leap forward in operating system capability. Existing OSes were single user focused. To start with you need multi-tasking and access control. Then there's all the other things you need to come up with to make it run well such as interrupt driven context switching and virtual memory. Finally, users would have to rewrite all their programs which assumed complete control of the computer to work with the new operating systems.

It seemed like it would take a long time to move time sharing from academic research to commercial reality. 

## Virtualization

[Virtualization](https://en.wikipedia.org/wiki/Hardware_virtualization) seems like it must be a relatively recent invention but was actually first implemented in the 1960s. IBM developed hardware that supported full virtualization. You could run software in a virtualized environment without it knowing that it wasn't running directly on the hardware. 

Another team at IBM (working with MIT) realized that virtualization would be a much quicker way to achieve time sharing. They came up with the CP/CMS system. CP refers to the Control Program (now called a hypervisor) which runs on the hardware and implements the virtualization system. CMS is the Console Monitor System, a lightweight single user operating system. CP hosts multiple virtual machines each running a copy of CMS. Each user has access to what looks like a stand alone computer capable of running any software that would run on the bare machine. 

CP/CMS was followed by a whole series of virtualization based operating systems.

## Minicomputers

* minicomputers - more advanced monolithic OS supporting multi-user, multi-tasking and virtual memory

## Microcomputers

* microcomputers - single user, cheap enough that you can have one each

* Client-Server - collaboration software needs sharing. User micro as client, connecting to beefy server (first mini then later server class micro-architectures)
* Hosted Applications
* Virtualization round 2
* Multi-tenant applications
* Cloud Providers - IaaS
* Serverless - PaaS and beyond

# Current State

SaaS company implements multi-tenant architecture using PaaS from one of the big cloud providers. PaaS platform uses sophisticated virtualization techniques to support multiple SaaS companies. We have multi-tenant at application level on multi-tenant at the PaaS level.

# Future?

Time for pendulum to swing again? Customers go direct to cloud provider and create an environment to run serverless open source software. Pay only for what you use. 
