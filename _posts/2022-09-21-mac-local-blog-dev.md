---
title: Setting up my Mac for local blog development
---

I intend to cover a variety of topics here. For example, deep thinking about industry trends and startup ideas, juicy gossip from my days at Autodesk or lab journal entries documenting my progress. Full disclosure - there's no deep thinking or juicy gossip today.

Lab journal entries can be interesting in their own way. You can see new discoveries happen almost in real time, you can learn techniques that are new to you. Not this time. Today I'm going to describe how I setup my Mac for local blog development. Mostly for my own future benefit if I ever need to do it again. 

My blog is hosted on [Github](https://github.com/TheCandidStartup/TheCandidStartup.github.io) using the [Github Pages](https://docs.github.com/en/pages) system. Seemed the obvious choice if I'm being as transparent as possible. It's the same ecosystem I'll need for coding, so two birds with one stone. Github Pages uses [Jekyll](https://jekyllrb.com/) to generate a static web site from Markdown/HTML/CSS content and [Liquid](https://github.com/Shopify/liquid/wiki) templates.  

Github Pages is fully automated. Change any content in your repo and it triggers a Github action that runs Jekyll and updates your web site. There are two problems.
1. You have no way to preview any changes you make before they go live. 
2. The publishing process is asynchronous. It takes a few minutes from changing something to seeing the end result.

Jekyll is written in Ruby so I'll need to setup my MacBook for Ruby development. I am a Mac novice so my thought process may seem naive (I'll talk about why I now own a Mac some other time). I do know that Macs have Ruby pre-installed - should be simple, just install a few gems. I started with the Github Pages documentation for [testing your site locally with Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll). That invited me to install Ruby and Bundler and then threw in a cryptic comment about using a package manager if you run into errors. Some frantic googling later and I learnt that I [really shouldn't use the installed Ruby](https://www.moncefbelyamani.com/why-you-shouldn-t-use-the-system-ruby-to-install-gems-on-a-mac/) and that I had many, many options for how to manage the installation of a manager that would install Ruby for me.

I'll also need Git and an editor. That should be more straight forward - install [Github Desktop](https://desktop.github.com/) and [Visual Studio Code](https://code.visualstudio.com/). That should do it. Turns out neither includes Git. I'll have to install that separately and there are many, many options for where I get it from and how I install it. 

Luckily I stumbled across a [detailed guide for getting everything installed](https://mac.install.guide/ruby/index.html). Even better it describes the main options and why you might choose one over the other. A combination of the [Github Pages](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/creating-a-github-pages-site-with-jekyll) and [Jekyll](https://jekyllrb.com/docs/installation/macos/) install documentation was then enough to get the required gems installed and get Jekyll running. 

Here's what I went with in the form of a handy dependency map showing the order of install and what is managing what.
* [Homebrew](https://brew.sh/) - Seems to be the most popular general package manager for Mac
  * [XCode Command Line Tools](https://developer.apple.com/xcode/features/) - Needed for any development on a Mac and installed by default by Homebrew. Which is great because I got nowhere trying to download and install them manually.
    * Apple Git - Included with the XCode Command Line Tools. I had no reason to install any other version of Git.
  * [asdf](https://asdf-vm.com/) - Apparently I will end up having to juggle multiple versions of Ruby so I need a Ruby install manager. I went with asdf because it will also do the same job for NodeJS which I'll need for future projects.
    * [Ruby](https://www.ruby-lang.org/en/documentation/installation/) - I let asdf pick the current version of Ruby to use
      * [bundler](https://bundler.io/) - Avoiding gem dependency hell seems like it will be worthwhile
      * [jekyll](https://jekyllrb.com/docs/installation/) - At last!
* [Github Desktop](https://desktop.github.com/)
* [Visual Studio Code](https://code.visualstudio.com/)

Nearly there. I cloned the repo locally using Github Desktop. Opened up a terminal in the repo root folder and with some excitement typed `bundle exec jekyll build`. Which failed. Took me a while to figure out. I'd started experimenting with the blog by directly creating and editing files on Github. This works fine using Github's internal Jekyll installation. However, I was missing some files needed for local development - in particular the Gemfile. What I should have done was start by creating the site locally using the [Create site with Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/creating-a-github-pages-site-with-jekyll) instructions on Github. I fixed things up by creating a dummy local site and used that to figure out what was missing from my repo.

Finally, it works! Pretty good development experience. I have VS Code on one side of my main monitor, a browser pointed at `localhost:4000` on the other and a terminal window on the MacBook screen running `bundle exec jekyll serve --livereload`. I can make a change, save and the site is re-generated and the browser refreshes within a second or so. 

To wrap up I have a couple of minor annoyances to document. First, the Jekyll build process outputs a concerning warning: `GitHub Metadata: No GitHub API authentication could be found. Some fields may be missing or have incorrect data`. I don't want to be chasing problems in local builds that won't occur in production. So far, I haven't found anything missing or incorrect. There are [instructions](https://jekyll.github.io/github-metadata/authentication/) for how to create and use a Github access token if I need them. 

Secondly, I noticed that the default location for local repos in Github Desktop is `~/Documents/GitHub`. This isn't great as the Documents folder is setup by Apple to sync with iCloud. Looks like a [lot of people have reported the same problem](https://github.com/desktop/desktop/issues/2889). I manually moved the repo to `~/GitHub`. Then promptly made the same mistake with the next repo I cloned. This time I deleted the local repo and cloned it again with the correct local path. GitHub Desktop remembers the last location you used so subsequent clones will go to the right place. 