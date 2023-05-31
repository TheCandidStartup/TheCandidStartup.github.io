---
title: The Ubiquitous Database Grid View
tags: databases cloud-architecture
---

You're building a full stack application that enables teams of people to do ... something. In order to manage the process of doing something, the team collaborates by creating, filling in, finding, sorting and deleting forms. There are probably lots of different types of forms relevant to the different phases of doing something. Each form has a distinct set of fields. If you're doing anything even vaguely enterprisey, the set of fields will be customizable.

There are so many forms that they need to be organized into collections of related forms. You might have a set of forms related to a particular project, or a particular person or thing. Maybe you have so many collections that you need to organize them too.

The heart of your application is a GUI that lets you navigate to a particular collection of forms displayed in a grid view. From here you can sort and filter, display a particular form in an editor, or fill out a new form. 

{% include candid-image.html src="/assets/images/github-nodejs-feature-requests.png" alt="GitHub Project of NodeJS Feature Requests" %}