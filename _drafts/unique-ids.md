---
title: Unique Ids
tags: cloud-architecture autodesk
---

They say that there are only [two hard problems](https://martinfowler.com/bliki/TwoHardThings.html) in Computer Science: cache invalidation and naming things. Cache invalidation is far too difficult, so let's have a go at naming things. Specifically, how do you ensure that the name you use to identify some resource is unique?

The first question you should ask yourself is, unique in what context? Am I trying to make sure that both of my pet cats have different names, or that the local veterinary practice can find the correct records when I take one in, or that the RFID chips implanted in most pets have unique numbers?

The wider scoped the context, the more effort it takes. It didn't take our family long to come up with names for the cats, or to ensure that they were different. There was no formal process involved.

Coming up with a scheme for [implantable microchip ids](https://en.wikipedia.org/wiki/Microchip_implant_(animal)) is clearly more complex. Most of the world has settled on chips that use the [ISO 11784 and ISO 11785](https://en.wikipedia.org/wiki/ISO_11784_and_ISO_11785) standards. This specifies a 15 digit id where the first 3 digits identify a country or manufacturer that is responsible for generating the other 12 digits. The US uses the ISO system together with three other proprietary standards. 

Which nicely illustrates the three main characteristics of any system of ids
1. Who decides how the system works? How many parties are involved? What happens if they can't agree?
2. What's the format for the ids? Crucially, how many different possible ids does the system allow?
3. Who generates the ids? How do they ensure that new ids are unique? What happens if you need multiple generators?

## Sequential Id

The simplest form of unique id is sequential, usually in the form of an incrementing integer. A single generator (for example, a relational database) keeps track of the most recent id generated and increments it when the next id is required. A sequential id is particularly useful when you need to access items in creation order. For example, transaction ids in a database, or events in an event log. 

The only choice to make is how large the integer should be. In most cases you're choosing between 32 bit and 64 bit. You should go for 64 bit. The number of ids available is effectively unlimited. You could generate a billion ids a second and it would be 500 years before you ran out. 

It can be tempting to use 32 bit ids. Four billion ids seems like it should be enough for most purposes. However, it is surprisingly easy to run out as systems scale up. If the ids are used to name objects that are created and later deleted, you may run out of ids even if the current population of objects is small. Reusing ids adds complexity and opens up the door to all sorts of interesting bugs. For example, the Postgres relational database uses 32 bit ids for transactions, which needs [careful management](https://www.postgresql.org/docs/15/routine-vacuuming.html#VACUUM-FOR-MULTIXACT-WRAPAROUND) to avoid problems when the id counter wraps around.

Only use a 32 bit or smaller id when you really can't afford the space of a larger id AND there's a hard limit on the number of active objects AND you have a way of coping when ids wrap around.

## Meaningful Id

The other simple form of id is to use something meaningful. That could be something that already exists in the real world or something that a human comes up with. 

The most common example is user ids. Depending on context, you could use the user's legal name, a telephone number or a social security number. The problem with real world identifiers is that the logic of the real world may not align with the business logic of your application. If it does align today, maybe it won't in future. As your company grows, you may end up with two employees with the same legal name. Telephone number and social security number formats can change over time or between countries. The best real world identifiers are often the most sensitive and private.

Letting users pick their own identifiers can be an exercise in frustration. How many applications have you tried to sign up for where every identifier you try has already been taken? An amazing amount of UX design effort goes into thinking up new ways of suggesting identifiers similar to what you want that haven't been taken yet. Then you have worry about disallowing the more "creative" ids that people will try to sneak past you. 

I can understand going to these lengths for a social media platform where your id is publicly visible to everyone. There's really no point doing it for a banking app where the user id and password are going straight into a password safe.

It may seem like you have multiple id generators. In reality, you need a single gatekeeper that stores all the previously approved ids and ensures that any newly suggested id is unique before allowing it to be used.

## Universal Unique Id (UUID)

The UUID is one of those brilliant ideas that seems simple in hindsight but inconceivable beforehand. Let's have a system of ids where anyone can generate one at any time while ensuring that they are always unique, universally, in every context. No need to worry about scaling to multiple servers, or creating data offline, or running out of ids. 

How is this magic achieved? First, a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier) is 128 bits long. Six bits are used to distinguish between different variants of UUID, leaving 122 bits of payload. That's a *lot* of possible ids. 

The original version 1 uuid combines a 48 bit [MAC address](https://en.wikipedia.org/wiki/MAC_address), a 60 bit timestamp and a [14 bit counter](https://www.rfc-editor.org/rfc/rfc4122#section-4.1.5). A MAC address is a unique identifier for a network interface controller. In theory, every physical network device is assigned a unique MAC address by the manufacturer, where each manufacturer has control over a range of ids. Including the MAC address ensures no collisions between UUIDs generated by different computers. 

The timestamp ensures no collision between UUIDs generated by the same computer at different times, over a period of 4000 years, with 100ns resolution. A single computer can generate up to [10 million uuids per second](https://www.rfc-editor.org/rfc/rfc4122#section-2).

Finally, the counter avoids collisions due to the clock or MAC address changing. The counter is initialized with a random value on startup. UUID generators are expected to remember the last UUID generated. If the clock appears to have gone backwards since the last UUID, the counter should be incremented. If the MAC address appears to have changed, the counter should be set to a new random value.

The problem with UUIDs is that you're relying on every generator to do the right thing and follow the rules. In the case of version 1 UUIDs that responsibility extends to every manufacturer of network interface controllers and every author of a UUID library. It should not be surprising that MAC addresses sometimes get reused, that library authors [don't always follow the spec](https://github.com/uuid6/uuid6-ietf-draft/issues/41), that the [wikipedia description of version 1 UUIDs](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_1_(date-time_and_MAC_address)) is based on an incorrect library implementation, or that creative developers sometimes generate UUIDs [using their own recipes](https://devblogs.microsoft.com/oldnewthing/20110324-00/?p=11143). I particularly like the story of a developer at Microsoft extracting the MAC address from an unused network card and then [smashing the card with a hammer](https://devblogs.microsoft.com/oldnewthing/20040211-00/?p=40663). They then used the MAC address with their own recipe to generate the other bits of the UUID.

UUID version 4 was the result of another brilliant idea. If generating version 1 uuids is complex and buggy, why don't we make all 122 payload bits random? That's far simpler to implement. The chance of a collision by generating the same random value is far less likely than the chance of a bug resulting in a duplicate version 1 UUID. There's a one in a billion chance of finding a collision after generating 100 trillion version 4 UUIDs. To get up to a 50% chance of finding a collision you would have to generate a billion UUIDs a second for 86 years.

Version 4 UUIDs also have advantages from a security perspective. Being able to guess valid ids is helpful for an attacker. That's trivial for a sequential id, easy for meaningful ids and all but impossible for UUIDs. They're a 122 bit random value. Good luck guessing. However, that randomness does mean there's no meaningful creation order.

Unsurprisingly, UUIDs are everywhere and are most people's first choice unique identifier.

## Universal Resource Name (URN)

[Uniform Resource Names](https://en.wikipedia.org/wiki/Uniform_Resource_Name) are part of the world wide web standards. URNs and URLs are both types of [Uniform Resource Identifier](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier) with a similar syntax. URLs start with `http:` or `https:` and can be used to locate a resource. URNs start with `urn:` and simply name a resource. 

An URN consists of a namespace followed by a namespace specific payload. Namespaces need to be registered with the [IANA](https://en.wikipedia.org/wiki/Internet_Assigned_Numbers_Authority). For example, the URN for a book looks like `urn:isbn:0451450523` and the URN for an RFC standards document looks like `urn:ietf:rfc:2648`.

URNs are a meta-system for identifiers. They package together an identifier and some context which tells you which identity system applies. Now you can have one common identifier format that could refer to a book about cats, or an implantable microchip id for a cat, or a shipping container transporting a cat, or a ship carrying the container, or the waterway that the ship is sailing along. Which raises the question, when would you need to use an identifier that can refer to literally anything? 

In the early days of [Autodesk's]({% link _topics/autodesk.md %}) move into the cloud, the platform team were big proponents of URNs. Instead of using whatever id format a service owner thought appropriate, all platform services would use URNs. Rather than registering namespaces, they made up their own. Each service would use a namespace that looked like `adsk.servicename.environment` followed by a component that defined a type of entity within the service and then the actual id. For example, a file stored in a production instance of the file service might have the id `urn:adsk.filestore.prod:fs.file:6e8bc430-9c3a-11d9-9669-0800200c9a66`.

We had a product that interacted with the file storage service and needed to store file ids. The database we were using had native support for UUIDs. We knew that the file storage service internally used UUIDs but instead we were expected to use string keys and store URNs. Now our keys are three times as big as they need to be and the first third is identical for every key we store. Naturally, we decided to strip off the pointless not-really-an-urn prefix, extract the UUID and store it natively.

Whenever we interacted with the file storage service we would read the UUID from our database, format it using the required prefix and pass it to the file storage API, which would strip off the pointless prefix and extract the UUID. To make it even more annoying, URNs contain non-URL safe characters so you have to URL encode the URN on one side and URL decode it on the other. 

Another platform service we used didn't like the resulting unreadable URLs and instead required all callers to [Base64](https://en.wikipedia.org/wiki/Base64) encode the URN. To make the experience even more fun, the standard Base64 encoding is not URL safe either. You had to use a special URL safe variant, which is not what you get when using your preferred language stack's built in Base64 implementation. Everyone who integrated with that service found themselves figuring out a bug where every few calls would fail with a corrupt id. 

Was there any benefit to the URN madness? No. When you're building an application or a service you know the context of the identifiers you're dealing with. When I'm calling the query file API, we all know that the id I'm passing in is a file id. 

Just say no to URNs. Use whatever id the URN encapsulates directly. In the rare cases where more context is needed, pass it explicitly. 

## Universal Unique Lexicographically Sortable Id (ULID)

What is there left to say?  Don't use URNs. Avoid meaningful ids. Use a sequential id if you need your ids to be ordered, or small. Use a UUID if you need to have multiple generators, or if there's no reason to use something else. 

What if you need your ids ordered *and* have multiple generators? That's where [ULIDs](https://github.com/ulid/spec) come in. The idea behind ULIDs has been [invented](https://www.microsoft.com/en-us/research/uploads/prod/2020/12/TO-Algs-Bernstein-GoodmanVLDB1980.pdf) [multiple](https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c) [times](https://firebase.blog/posts/2015/02/the-2120-ways-to-ensure-unique_68). There's no formal standard for ULIDs, just an open source spec and implementations. 

A ULID is a 128 bit value that combines features from version 1 and version 4 UUIDs. There's no backwards compatibility or multiple variants, so all 128 bits are payload. A ULID has a 48 bit timestamp in the most significant bits, together with an 80 bit random count. The timestamp has a period of 8900 years with millisecond precision.

ULIDs are coarsely ordered by timestamp. ULIDs generated by different computers in the same millisecond are arbitrarily ordered by randomness. ULIDs generated in the  same millisecond on the same computer are monotonically ordered. The ULID library is required to remember the last ULID generated. If the next ULID generated would have the same timestamp, the client returns the last ULID + 1.

The chance of a collision depends on how many ULIDs are being generated per millisecond. Version 1 UUIDs can be generated at a rate of 10 million per second, per computer. If we assume the same rate of generation for ULIDs, you would need 490 thousand computers, simultaneously generating flat out, to get a one in a billion chance of a collision.

Despite having "Universal" in the name, the typical use cases for ULIDs (and UUIDs) rarely need universal uniqueness. All you need is uniqueness between the generators that contribute ids used in a common data store. 

There are two common cases for ULIDs. The first is a fleet of servers used to implement a horizontally scaled service. You would need to be operating at AWS scale to get anywhere close to 490 thousand servers. The second case is end user clients that need to generate their own ids, either for reasons of scale, or because they need to operate offline. There could be thousands of clients but each client is unlikely to be generating many ULIDs a second. 

The core principle behind ULIDs is that it doesn't matter what order is chosen for ULIDs generated on different computers in the same millisecond, just that an order is defined. Intuitively that makes sense. Given network delays and the laws of physics, you can't really say which of two near simultaneous events came first. 

Perhaps more surprisingly, ULIDs are not generated in order. Imagine we have 100 servers with perfectly aligned clocks that can instantly add the ULIDs they generate to a central queue. The ULIDs generated by different servers during the same millisecond will be in a random order in the queue. However, the batches of ULIDs from different milliseconds will be correctly ordered.

{% include candid-image.html src="/assets/images/ulid-clock-skew.svg" alt="ULID ordering guarantees are complicated" %}

Of course, clocks are never perfectly aligned. Entries in the queue could be out of order over a time window equal to the maximum clock skew. There are two important implications. First, if you need ULID identified objects in sorted order, you will need to sort them yourself. For maximum efficiency, use a streaming algorithm which only sorts objects within a recent time window. 

Second, if you have some process that depends on the sorted order being stable, like [generating a snapshot for an event log]({% link _posts/2023-08-07-spreadsheet-event-log.md %}), you will have to wait for the sequence of entries in the log to stabilize. If there's a maximum clock skew of 30 seconds, new log entries may be inserted anywhere in the last 30 seconds of log. Any snapshot you create will need to be at least 30 seconds out of date. 

Bugs caused by bad assumptions about clock skew are particularly nasty to deal with. Think carefully when considering whether ULIDs are right for your application.

## Conclusion

Don't use URNs. Avoid meaningful ids. Use a sequential id if you need your ids to be ordered, or small. Use a UUID if you need to have multiple generators, or if there's no reason to use something else. Consider a ULID if you need multiple generators *and* ordered ids.
