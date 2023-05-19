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

I was a bit worried about this as [UnrealEngine](https://github.com/EpicGames/UnrealEngine) is a private repo in the [EpicGames](https://github.com/EpicGames) organization. When I agreed to the source code license, I also agreed that I would not expose the source to anyone that hadn't also agreed to the license. I'm using GitHub Free. Doesn't that mean all my repos have to be public?

Turns out I'm behind the times. GitHub Free has supported private repos since 2020, with no limits on number of repos or collaborators. Even before then, GitHub had a cool feature where you could fork a private repo into a free account and it would be covered by the license of the account it was forked from. 

Forking took a few seconds in the GitHub web client. Only I have access, so you'll have to take my word that it's [there](https://github.com/TheCandidStartup/UnrealEngine). Ideally I would give access to the EpicGames [Developers team](https://github.com/orgs/EpicGames/teams/developers) which includes everyone that has agreed to the source license. Unfortunately, GitHub doesn't support cross-organization use of teams. 

### Cloning the Repo

{% capture dsk_url %}
{% link _drafts/my-setup.md %}
{% endcapture %}

 I cloned the forked repo onto my [Windows PC]({{ dsk_url | append: "#14-mid-tower-micro-atx-pc" }}) using GitHub Desktop. I was given the choice of syncing one specific branch or the entire repo. I wasn't sure which branches I would end up needing so decided to take the whole thing.

 I first tried it late in my day (so peak hours for the US) and was seeing transfer rates under 1 MB/s. I decided to try again in the morning (which is very much off peak in the US). Now I was getting up to 4.5 MB/s. My network adaptor was maxing out at 39 Mbps which is a little bit more than the 36 Mbps I should see with my [broadband package]({% link _posts/2023-04-10-fibre-broadband-install.md %}).

It took just over two hours to get everything transferred. The result was 26 GB of source code on disk with another 44 GB in the .git directory.

### Install Visual Studio 2022

The Visual Studio installer has come a long way since I first installed Visual Studio 6 at the end of the 90s. Download and run the installer from the website, choose the optional components that Unreal needs and leave it to chug away. Completed without a hitch. I was doing something else at the time and didn't keep track of how long it took.

### Run Setup Scripts

The 26 GB of source code we cloned? Doesn't include everything. 

Next step is to run the *Setup.bat* file in the root of the repo. This sets up a few dependencies but the only thing that takes any time is downloading additional binary files. The script includes a handy progress monitor showing download rate and amount of data transferred. The backend for this is clearly more bandwidth constrained than GitHub. The reported bandwidth jumped around a lot, but 1 MB/s was typical.

The script completed after 75 minutes and added an extra 20 GB on disk. There's one final step that needs admin access. Whatever the script is doing pops up a Windows admin elevation prompt. In my case it appeared behind my terminal window. I sat there like an idiot for ten minutes, waiting for the script to finish, before I realized what had happened.

The second script to run is *GenerateProjectFiles.bat* which creates a Visual Studio solution and project files for whichever version of Visual Studio you have installed (Unreal supports 2022 and 2019).

Thankfully, this script only took five seconds. I checked my disk storage and noticed that the local UnrealEngine folder was now using 100 GB.

### Build

I opened up the solution and had a look around. 132 projects. A single UE5 project for the main engine and 131 supporting components and utilities. Following the instructions I picked the "*Development Editor*" configuration and x64 platform. Right click on UE5 and then build.

Unreal Engine has a custom build tool. Building the project runs the *Build.bat* script, passing in configuration and platform as parameters. The script builds and runs *UnrealBuildTool*. The build tool analyzes header files, works out dependencies and determines a set of actions to run. In this case, 6229 of them. 

Actions can be executed in parallel. The tool determines the number of parallel processes to use based on the number of physical CPU cores and available memory. I have 6 physical cores and 16 GB of memory. However, the tool decided I only had 3GB of "free" memory and decided that it could only use two processes. Looks like I need to buy more memory.

Each action seems to take from 1 to 10 seconds to complete. My total build time was two hours (the README says it should take 10 to 40 minutes). Task manager showed the PC was using 30% CPU, 60% memory and 2% disk during the build. Unbelievably, to me, the build worked first time with no errors or warnings reported.

At the end of this I was up to 200 GB of disk space used. Looks like I need a bigger disk drive.

### Run

The moment of truth. Will it actually run? I started the debugger. The Unreal Editor splash screen appeared after a few seconds. The splash screen includes a progress line. It quickly got to 45% with the summary "Compiling Shaders (5500)", then "Compiling Shaders (5440)". And so on. For another five minutes. 

Finally, its running. Quick check on memory shows Visual Studio using 4.5 GB and Unreal Editor 5 GB. With no project loaded. Yes, I definitely need more memory. 

The editor is asking me to create a new project from an existing template. I pick Third Person game. Without any further prompting, the editor creates a Visual Studio project and solution for my new project and launches another instance of Visual Studio.

This solution has 74 projects. Luckily, 73 are from core Unreal Engine and they're already built. My project takes a few seconds to build, also using the custom build tool. This time it decides I have 8 GB free and can have 5 processes for my 10 actions.

The standard build configuration for this project is also "*Development Editor*". I've just built a version of my project with an integrated development editor. I run it and the editor launches. What's this?

"Compiling Shaders (5500)", "Compiling Shaders (5440)", ...

That's enough for now. I've got Unreal Engine built. Next, I need to understand the workflow and find out what is going on with all those shaders.

