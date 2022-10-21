---
title: The Evolution of Multi-Tenant Architecture
---

We've been figuring out how best to share computing resources almost from when we first invented the computer.

# History

* time boxing
* interactive vs batch
* time sharing (monolithic OS, trying to move from single user oriented OS to something that can support multi-user time sharing cleanly)
* virtualization (CP/CMS)
* minicomputers - more advanced monolithic OS supporting multi-user, multi-tasking and virtual memory
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
