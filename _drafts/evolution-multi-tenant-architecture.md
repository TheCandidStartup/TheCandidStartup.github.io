---
title: The Evolution of Multi-Tenant Architecture
---

I previously described the [general areas for my initial projects]({% link _posts/2022-10-24-what-projects.md %}). Today I want to dive a little deeper into the multi-tenant SaaS project. This is the project I'm most excited about and the one that will need the most explanation.

What is a [multi-tenant architecture](https://en.wikipedia.org/wiki/Multitenancy)? In general, it's an architecture that allows multiple independent consumers to share common computing resources. Why would you want to share computing resources? To reduce the cost for each consumer. 

I'm going to look at how multi-tenant architectures have evolved over time to help me figure out where they might go next.

# History

We've been figuring out how best to share computing resources almost from when we first invented the computer. Let's start at the beginning.

## Time Boxing

The first approach used was absurdly simple. Only academic institutions and government departments had access to computers. They were large, complex and absurdly expensive. There was no operating system to speak of. Users booked a time slot and the whole machine was theirs for that time. Typical use was to input a job, set it running and wait anxiously to see whether it ran and completed within the time.

## Interactive vs Batch

The early pioneers soon noticed that there were two different types of activity. Interactive use when setting up the input and retrieving the output, sandwiched around batch use where the job ran unattended. They realized they could make more effective use of their computing resources by separating interactive and batch workloads. 

Interactive used less in the way of computing resource and could even use dedicated simpler hardware. For example, preparing a paper tape that contained your program and input data. The big expensive iron could then be dedicated to running jobs. Jobs could be scheduled to run one after another using a queue. Initially queues were physical - tapes hung on a washing line or lined up on a shelf. Human operators were employed to monitor the machine and load up the next job after the previous one had finished running.

Over time hardware became more powerful and rudimentary operating systems were developed. Jobs queues were automated and multiple jobs could be run at once.

## Time Sharing

[Time Sharing](https://en.wikipedia.org/wiki/Time-sharing) is one of those brilliant ideas that seems obvious now but was revolutionary at the time. Computers were too expensive to use interactively for significant periods of time. However, think about how a human interacts with a computer. There are short bursts of activity as the user enters information or executes commands interspersed with long pauses while nothing is happening. A single user does not make efficient user of a computer, but a large group of users together does. If the users are working at the same time the pauses of one user can be filled by the activity of the others. 

Making time sharing a reality needed a huge leap forward in operating system capability. Existing OSes were single user focused. To start with you need multi-tasking and access control. Then there's all the other things you need to come up with to make it run well such as interrupt driven context switching and virtual memory. Finally, users would have to rewrite all their programs (which assumed complete control of the computer) to work with the new operating systems.

It seemed like it would take a long time to move time sharing from academic research to commercial reality. 

## Virtualization

[Virtualization](https://en.wikipedia.org/wiki/Hardware_virtualization) seems like it must be a relatively recent invention but was actually first implemented in the 1960s. IBM developed hardware that supported full virtualization. You could run software in a virtualized environment without it knowing that it wasn't running directly on the hardware. 

Another team at IBM (working with MIT) realized that virtualization would be a much quicker way to achieve time sharing. They came up with the [CP/CMS](https://en.wikipedia.org/wiki/History_of_CP/CMS) system. CP refers to the Control Program (now called a hypervisor) which runs on the hardware and implements the virtualization system. CMS is the Console Monitor System, a lightweight single user operating system. CP hosts multiple virtual machines each running a copy of CMS. Each user has access to what looks like a stand alone computer capable of running any software that would run on the bare machine. 

CP/CMS was followed by a whole series of virtualization based operating systems. Eventually, full multi-user, multi-tasking operating systems could be run as virtual machines. 

This is the point at which we see the first introduction of multi-tenant business models. For example, in 1968 a [startup](https://en.wikipedia.org/wiki/National_CSS) had the bright idea of leasing an IBM Mainframe running CP/CMS and reselling computer time. Each tenant had access to a dedicated virtual machine. 

## Minicomputers

Single chip CPU microprocessors first appeared in the early 1970s. This led to an explosion of new (relatively) inexpensive commercial computers known as minicomputers. Rather than filling a room, a minicomputer took up a single rack cabinet. To fit a CPU on a single microprocessor they had simpler instructions, smaller data words and no room for fancy features like virtualization. 

Fortunately, OS development had come a long way by this time. Minicomputer OSes directly supported time sharing features like multi-tasking, access control and virtual memory. The first version of the Unix operating system was developed for use on a minicomputer.

Minicomputers were cheap enough that individual departments within Universities could have their own. Small companies could afford their own rather than paying for a tenant in a time shared mainframe. 

## Microcomputers

As the microprocessor revolution continued, microcomputers were developed. They used processors with even simpler instruction sets than minicomputers. They were designed for single person use, priced cheaply enough that individuals could afford them. By the end of the 1980s the Intel based IBM compatible PC that we're still familiar with today was becoming dominant. 

Who needs multi-tenant architecture when you can have a computer each?

## Client-Server

You still needed a "real" computer for multi-user collaborative applications. You could, however, replace the dumb terminals that users previously used with microcomputers. Now you have a client-server architecture. You can move some compute and most of the smarts needed to run the user interface to the client. 

Initially minicomputers were used as servers. As the microcomputer industry scaled up, minicomputers were unable to compete on price. They were replaced with servers based on microcomputer architectures. 

Computers are inherently unreliable. It's not a huge problem if a client machine dies. One user is inconvenienced and needs a replacement machine. All their important data is safely stored on the server so they can soon be back up and running.

Its a massive problem if a server dies. All users are out of action and their data is at risk. The solution was to make servers more reliable. They used higher end components and used redundancy at the hardware level. Error correcting memory, RAID disk arrays, redundant power supplies and network connections, hot swap capabilities. 

As well as the capital cost for a decent server, you also need skilled personnel to manage it. It needs to be monitored, failing components identified and replaced, software updates applied, periods of down time managed.

There were increasing numbers of customers that didn't write their own software and had a server just to run a handful of critical applications (CRMs, ERPs, and other TLAs). If only there was some way they could access the applications without needing to know anything about servers.

## Hosted Applications

We've reached the 90s. The internet is about to explode in usage. Good network connectivity is becoming table stakes. [Application Service Providers](https://en.wikipedia.org/wiki/Application_service_provider) started to appear that would host popular applications for you. The ASP owns and operates the servers and manages the application software licenses. They provide access to the software to customers that want to use the application without the hassle of managing it themselves. 

This is a multi-tenant business model but not yet a multi-tenant architecture. If the application assumes that only one instance is running on a server, then each tenant needs a dedicated server. If you're lucky the software allows you to run multiple instances. However, you need careful management to ensure that each instance has enough resources and you don't end up with one tenant degrading the experience of another.

## Virtualization: Round Two

Luckily microprocessors have now matured to the point that the manufacturers are looking for new features they can use to distinguish themselves. Virtualization becomes feasible again. First with some creative approaches in the hypervisors to work round missing features, later with full virtualization support in the hardware. ASPs can use a dedicated virtual machine for each tenant. Tenants are fully isolated from each other and easier to manage. Hypervisors are developed that manage a cluster of physical servers and even allow for virtual machines to be migrated between servers with almost zero downtime.

## Web Applications

By the late 90s dedicated hosted applications were being developed. They were written from the ground up to support multi-tenant hosted business models. Typically they were designed to use web browsers on the client side and so were known as [web applications](https://en.wikipedia.org/wiki/Web_application). The first examples were email services like [Hotmail](https://en.wikipedia.org/wiki/Outlook.com). With a dedicated multi-tenant application you could host many thousands of customers on a single server. 

Tenant isolation was handled entirely at the application level. Application bugs could allow one customer to degrade the experience of another (noisy neighbor syndrome), or even worse allow one customer to gain access to other customer's data. Hotmail, for example, suffered from multiple security vulnerabilities in its first few years.

## Software as a Service (SaaS)

New entrants appeared that used the web application playbook to offer more business critical applications. Rather than single users, each tenant could support multiple collaborating users. [Salesforce](https://en.wikipedia.org/wiki/Salesforce) was an early pioneer of what came to be known as *Software as a Service*.

## Infrastructure as a Service (IaaS)

## Platform as a Service (PaaS)

## Micro-Services

# Now What?

So, I've obviously been skimming a lot of Wikipedia articles. Where has that got me? Well, you'll have to bear with me. 

Next time I'll go deep on how a modern SaaS application is built, look at some of the challenges with that approach and make a modest proposal for how multi-tenant architecture might evolve again.