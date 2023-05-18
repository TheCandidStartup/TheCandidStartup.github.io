---
title: Compiling Unreal Engine
tags: computer-graphics
---

I want to use [Unreal Engine 5](https://docs.unrealengine.com/5.1/en-US/) as a starting point for [implementing Navisworks like features with a modern graphics pipeline]({% link _posts/2023-04-03-nanite-graphics-pipeline.md %}). Every journey starts with the first step. Which in my case is compiling Unreal Engine from source code.

I've worked on some large code bases in my time. They all had one common feature. Setting up a new developer machine and getting everything built and running locally is a nightmare. I was expecting a similar battle with Unreal Engine. Unfortunately for the dramatic narrative of this blog post, it turned out to be surprisingly easy, if time consuming. 

The Unreal Engine repo README covers *almost* everything you need. Fork the repo, clone it locally, install Visual Studio 2022 (community edition is fine), run a couple of scripts (one to download binaries, one to generate Visual Studio solutions), open the Visual Studio solution, build and run. 

When installing Visual Studio make sure you follow the link to "[Setting Up Visual Studio](https://docs.unrealengine.com/5.2/en-US/setting-up-visual-studio-development-environment-for-cplusplus-projects-in-unreal-engine/)" and install all the required components for Unreal Development. You'll save yourself a world of hurt if you install all the dependencies before trying to build. I also found this [YouTube video](https://youtu.be/8xJRr6Yr_LU) helpful so I could watch someone else walk through all the steps before trying myself.

Now, those steps in more detail.

### Forking the Repo

I was a bit worried about this as [UnrealEngine](https://github.com/EpicGames/UnrealEngine) is a private repo in the [EpicGames](https://github.com/EpicGames) organization. When I agreed to the source code license, I also agreed that I would not expose the source to anyone that hadn't also agreed to the license. 

### Cloning the Repo

* Wasn't sure whether I'd only need the release branch or be on the cutting edge, so decided to clone the whole repo
* Tried it late in my day (peak hours for US) and was only getting 1MB/s. Would have taken 8 hours
* Tried again first thing in the morning (very much off peak in the US) and was getting up to 4.5 MB/s. Network adaptor was hitting 39 Mbps which is just over the 36 Mbps I should be getting.
* Took just over 2 hours, resulting in 26 GB of source code and 44 GB in the .git directory locally

### Install Visual Studio 2022

### Run Setup Scripts

* Next run Setup.bat in the root directory of the repo
* Spends most of its time downloading binaries that aren't stored in the repo
* More bandwidth constrained - jumped around a lot but 1 MB/s was typical
* Took 75 minutes and added an extra 20 GB on disk
* Final step needs admin access. Popped up a windows admin elevation prompt hidden behind my terminal window. Sat there waiting like an idiot until I realized.

* Next GenerateProjectFiles.bat to create visual studio solution for whichever version of VS you have installed (supports 2022 and 2019)
* Took about 5 seconds
* Checked total disk usage and now at 100 GB

### Build

* Open up the solution, set build configuration to "Development Editor" and target to x64.
* 130  projects
* Right click on UE5 *what's this thing called?" and choose build
* UE has a custom build tool. Uses VC build system to build the build tool and then run it.
* Output nicely integrated into VC output window
* Build tool analyses header files, works out dependencies, and determines a set of actions to run. 6229 in this case.
* Determines number of parallel processes to use based on physical cores and memory available.
* I have 6 physical cores and 16 GB of memory. Tool decided I only had 3GB free (how?) so only 2 parallel actions
* In reality was using 30% CPU, 60% memory, 2% disk
* Each action took 1-10 seconds
* Total build time of 2 hours (docs say 10 to 40 minutes!)
* Think I'm going to need more RAM (Docs say 8GB is the minimum)

### Run

* Start editor under the debugger
* Get to splash screen in a few seconds
* Progress in splash screen
* Quickly to 45% and then Compiling Shaders (5300)
* Using 99% of CPU, 85% memory.
* Counting down. Took 5 minutes. *Much faster than first time I tried with 5.1? Change in 5.2?*
* VS using 4.5GB, editor 5GB (with nothing loaded). Yes, will need more RAM.

* Use editor to create my first unreal project. Generates VS project and solution, source code from a template.
* 74 projects! Luckily 73 are from core Unreal Engine and they're already built. My project takes a few seconds to build.
* Also uses custom build tool. This time decides  i have 8GB free and can have 5 processes for my 10 actions

* Standard build target for all projects is with the UnrealEditor integrated.
* Build was quick but when I run it ... 5500 shaders to compile ...

