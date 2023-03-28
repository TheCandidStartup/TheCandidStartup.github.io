---
title: Amortized Cost and the Cloud
tags: cloud-architecture
---

I first came across the concept of [amortized cost](https://en.wikipedia.org/wiki/Amortized_analysis) when I learnt about the [vector](https://cplusplus.com/reference/vector/vector/) class in [C++](https://en.wikipedia.org/wiki/C%2B%2B). At that point I was largely a self-taught programmer without much in the way of theoretical foundation. I was used to using [linked lists](https://en.wikipedia.org/wiki/Linked_list) and understood that the cost of adding a new element was constant, regardless of the size of the list. Vectors seemed like witchcraft to me. 

A vector is basically an array that dynamically changes size as you add elements to it. How can that possibly be efficient? To increase the size of an array, you have to allocate a new block of memory and copy all the elements from the old block. If you do that every time you add an element, the cost will be ridiculous. 

The trick, of course, is that you don't resize the array every time you add an element. Instead you over allocate the size of the array and whenever you do fill it, you allocate a new array double the size. 

{% include candid-image.html src="/assets/images/amortized-cost-vector.svg" alt="Amortized Cost for Linked List vs Vector" %}

Linked lists have a fixed cost for every element added. The cost is relatively high as you need to allocate a new block of memory for each element. The cost to add *n* elements is *O(n)*.

When using a vector, most of the time the cost of adding a new element is very low. No need to allocate more memory - just copy the value into the array and increment the size. For those sizes where the array is full, the cost is much higher, and doubles every time you do it. However, the number of elements added between each reallocation is also doubling. If you average the costs out, the average cost per element is always lower than the linked list, regardless of size. The **amortized cost** to add *n* elements is *O(n)*.

Amortized cost algorithms usually require more memory than fixed cost algorithms. In the case of the vector, up to twice as much memory as the linked list[^1]. You can trade off compute cost against memory use. A vector has *O(n)* amortized cost as long as the array size increases by a constant factor. If you increase the size 1.5 times rather than doubling it, you use less memory at the cost of reallocating more often. Conversely, you can reduce the number of times you reallocate by more than doubling each time. 

[^1]: Linked lists have a fixed amount of memory overhead per element (next/prev pointers, memory allocation costs). For small elements, the overall memory used by a vector can be less than a linked list. As element size grows larger, the linked list fixed overhead becomes insignificant, and worst case memory use for the vector (immediately after a reallocation) approaches twice as much. 

## Garbage Collection

[Garbage Collection](https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)) is an amortized cost algorithm for memory management. Rather than making explicit calls to the memory management system to return memory that is no longer needed, a garbage collection system automatically identifies memory that is no longer referenced.

Explicit memory management has a small fixed cost for each allocation and deallocation of a block of memory. Garbage collection has a small fixed cost for allocation (usually smaller than for explicit memory management) together with no direct cost for deallocation when memory is no longer needed. In exchange there is a periodic, asynchronous, very large cost to collect unreferenced memory so that it can be reused. 

The benefits of garbage collection are programmer convenience, greater safety (no reuse after free errors or forgetting to free memory), and enabling use of dynamic languages. Most people believe that garbage collection is inherently higher cost than manual memory management. However, the same trade offs are available as we saw with the vector. 

For most garbage collection algorithms, the costs are proportional to the amount of memory in use, not the amount of garbage. The more memory you have available, the longer you can leave it before triggering garbage collection and the less it costs for each memory block reclaimed. In fact, if you have enough memory available, you can [reduce the costs to an arbitrarily low level](https://www.cs.princeton.edu/~appel/papers/45.pdf), less than a single machine instruction per block. 

## Tail Latency

You may be wondering what relevance all this has for [cloud architecture]({% link _topics/cloud-architecture.md %}). Amortized cost algorithms work because they amortize the uneven costs of individual operations across an overall computation. If you're adding 1000 items to a vector, it doesn't matter that adding the 513th item costs much more than adding the 514th, as long as the overall cost is acceptable. Similarly, it doesn't matter if your computation is occasionally paused while garbage collection happens, as long as the overall cost of computation plus garbage collection is acceptable. 

In the cloud, the primary unit of computation is a [request to a microservice]({% link _posts/2022-11-28-modern-saas-architecture.md %}). The main metric we use to understand the performance and health of a service is request latency. How long does it take to get a response to our request (if we get one at all)? 

## Databases

* Postgres vacuum
* B-Tree vs LSM tree

## Serverless

## Footnotes

