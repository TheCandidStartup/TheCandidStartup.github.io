---
title: Setting up my Mac for local blog development
---

I intend to cover a variety of topics here. For example, deep thinking about industry trends and startup ideas, juicy gossip from my days at Autodesk or lab journal entries documenting my progress. Full disclosure - there's no deep thinking or juicy gossip today.

Lab journal entries can be interesting in their own way. You can see new discoveries happen almost in real time, you can learn techniques that are new to you. Maybe another time. Today I'm going to describe how I setup my Mac for local blog development. Mostly for my own future benefit if I ever need to do it again. 

My blog is hosted on [Github](https://github.com/TheCandidStartup/TheCandidStartup.github.io) using the [Github Pages](https://docs.github.com/en/pages) system. Seemed the obvious choice if I'm being as transparent as possible. Its the same ecosystem I'll need for coding, so two birds with one stone. Github Pages uses [Jekyll](https://jekyllrb.com/) to generate a static web site from Markdown/HTML/CSS content and [Liquid](https://github.com/Shopify/liquid/wiki) templates.  

Github Pages is fully automated. Change any content in your repo and it triggers a Github action that runs Jekyll and updates your web site. There are two problems.
1. You have no way to preview any changes you make before they go live. 
2. The publishing process is asynchronous. It takes a few minutes from changing something to seeing the end result.

Jekyll is written in Ruby so I'll need to setup my Mac for Ruby development. I am a Mac novice so my thought process may seem naive (I'll talk about why I now own a Mac some other time). I do know that Macs have Ruby pre-installed - should be simple, just install a few gems. I started with the Github Pages documentation for [testing your site locally with Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll). That invited me to install Ruby and Bundler and then threw in a cryptic comment about using a package manager if you run into errors. Some frantic googling later and I learnt that I [really shouldn't use the installed Ruby](https://www.moncefbelyamani.com/why-you-shouldn-t-use-the-system-ruby-to-install-gems-on-a-mac/) and that I had many, many options for how to manage the installation of a manager for my Ruby install.

I'll also need Git and an editor. That should be more straight forward - install [Github Desktop](https://desktop.github.com/) and [Visual Studio Code](https://code.visualstudio.com/). That should do it. Turns out neither includes Git. I'll have to install that separately and there are many, many options for where I get it from and how I install it. 

Luckily I stumbled across a [detailed guide for getting everything installed](https://mac.install.guide/ruby/index.html). Even better it describes the main options and why you might choose one over the other. A combination of the [Github Pages](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/creating-a-github-pages-site-with-jekyll) and [Jekyll](https://jekyllrb.com/docs/installation/macos/) install documentation was then enough to get the required gems installed and get Jekyll running. 

Here's what I went with in the form of a handy dependency map showing the order of install and what is managing what.
* [Homebrew](https://brew.sh/) - Seems to be the most popular general package manager for Mac
  * [XCode Command Line Tools](https://developer.apple.com/xcode/features/) - Needed for any development on a Mac and installed by default by Homebrew. Which is great because I got nowhere trying to download and install them manually.
    * Apple Git - Included with the XCode Command Line Tools. I had no reason to install anything else.
  * [asdf](https://asdf-vm.com/) - Apparently I will end up having to juggle multiple versions of Ruby so I need a Ruby install manager. I went with asdf because it will also do the same job for NodeJS which I'll need for future projects.
    * [Ruby](https://www.ruby-lang.org/en/documentation/installation/) - Finally!
      * [bundler](https://bundler.io/)
      * [jekyll](https://jekyllrb.com/docs/installation/)