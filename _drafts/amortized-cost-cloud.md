---
title: Amortized Cost and the Cloud
tags: cloud-architecture
---

I first came across the concept of amortized cost when I learnt about the [vector](https://cplusplus.com/reference/vector/vector/) class in [C++](https://en.wikipedia.org/wiki/C%2B%2B). At that point I was largely a self-taught programmer without much in the way of theoretical foundation. I was used to using [linked lists](https://en.wikipedia.org/wiki/Linked_list) and understood that the cost of adding a new element was constant, regardless of the size of the list. Vectors seemed like witchcraft to me. 

A vector is basically an array that dynamically changes size as you add elements to it. How can that possibly be efficient? To increase the size of an array, you have to allocate a new block of memory and copy all the elements from the old block. If you do that every time you add an element, the cost will be ridiculous. 

The trick, of course, is that you don't resize the array every time you add an element. Instead you over allocate the size of the array and whenever you do fill it, you allocate a new array double the size. 

{% include candid-image.html src="/assets/images/amortized-cost-vector.svg" alt="Amortized Cost for Linked List vs Vector" %}

Linked lists have a fixed cost for every element added. The cost is relatively high as you need to allocate a new block of memory for each element. The cost to add *n* elements is *O(n)*

When using a vector, most of the time the cost of adding a new element is very low. No need to allocate more memory - just copy the value into the array and increment the size. For those sizes where the array is full, the cost is much higher, and doubles every time you do it. However, the number of elements added between each reallocation is also doubling. If you average the costs out, the average cost per element is lower than the linked list. The **amortized cost** to add *n* elements is also *O(n)*.

## Garbage Collection

## Tail Latency

## Databases

* Postgres vacuum
* B-Tree vs LSM tree

## Serverless
