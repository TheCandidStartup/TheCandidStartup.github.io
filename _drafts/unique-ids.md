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

The simplest form of unique id is sequential, usually in the form of an incrementing integer. A single generator (for example, a relational database) keeps track of the most recent id generated and increments it when the next id is required. The only choice to make is how large the integer should be. In most cases you're choosing between 32 bit and 64 bit. 

In most cases you should go for 64 bit. The number of ids available is effectively unlimited. You could generate a billion ids a second and it would be 500 years before you ran out. 

It can be tempting to use 32 bit ids. Four billion ids seems like it should be enough for most purposes. However, it is surprisingly easy to run out as systems scale up. If the ids are used to name objects that are created and later deleted, you may run out of ids even if the current population of objects is small. Reusing ids adds complexity and opens up the door to all sorts of interesting bugs. For example, the Postgres relational database uses 32 bit ids for transactions which needs [careful management](https://www.postgresql.org/docs/15/routine-vacuuming.html#VACUUM-FOR-MULTIXACT-WRAPAROUND) to avoid problems when the id counter wraps around.

Only use a 32 bit or smaller id when you really can't afford the space of a larger id AND there's a hard limit on the number of active objects AND you have a way of coping when ids wrap around.

## Meaningful Id

The other simple form of id is to use something meaningful. That could be something that already exists in the real world or something that a human comes up with. 

The most common example is user ids. Depending on context, you could use the user's legal name, a telephone number or a social security number. The problem with real world identifiers is that the logic of the real world may not align with the business logic of your application. If it does align today, maybe it won't in future. As your company grows, you may end up with two employees with the same legal name. Telephone number and social security number formats can change over time or between countries. The best real world identifiers are often the most sensitive and private.

Letting users pick their own identifiers can be an exercise in frustration. How many applications have you tried to sign up for where every identifier you try has already been taken? An amazing amount of UX design effort goes into thinking up new ways of suggesting identifiers similar to what you want that haven't been taken yet. Then you have worry about disallowing the more "creative" ids that people will try to sneak past you. 

I can understand going to these lengths for a social media platform where your id is publicly visible to everyone. There's really no point doing it for a banking app where the user id and password are going straight into a password safe.

It may seem like you have multiple id generators. In reality you need a single gatekeeper that stores all the previously approved ids and ensures that any newly suggested id is unique before allowing it to be used.

## Universal Unique Id (UUID)

The UUID is one of those brilliant ideas that seems simple in hindsight but inconceivable beforehand. Let's have a system of ids where anyone can generate one at any time while ensuring that they are always unique, universally, in every context. No need to worry about scaling to multiple servers, or creating data offline, or running out of ids. 

How is this magic achieved? First, a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier) is 128 bits long. Six bits are used to distinguish between different variants of UUID, leaving 122 bits of payload. That's a *lot* of possible ids. 

The original version 1 uuid combines a 48 bit [MAC address](https://en.wikipedia.org/wiki/MAC_address), a 60 bit timestamp and a [14 bit counter](https://www.rfc-editor.org/rfc/rfc4122#section-4.1.5). A MAC address is a unique identifier for a network interface controller. In theory, every physical network device is assigned a unique MAC address by the manufacturer, where each manufacturer has control over a range of ids. Including the MAC address ensures no collisions between UUIDs generated by different computers. 

The timestamp ensures no collision between UUIDs generated by the same computer at different times, over a period of 4000 years, with 100ns resolution. A single computer can generate up to [10 million uuids per second](https://www.rfc-editor.org/rfc/rfc4122#section-2).

Finally, the counter avoids collisions due to the clock or MAC address changing. The counter is initialized with a random value on startup. UUID generators are expected to remember the last UUID generated. If the clock appears to have gone backwards since the last UUID, the counter should be incremented. If the MAC address appears to have changed the counter should be set to a new random value.

The problem with UUIDs is that you're relying on every generator to do the right thing and follow the rules. In the case of version 1 UUIDs that responsibility extends to every manufacturer of network interface controllers and every author of a UUID library. It should not be surprising that MAC addresses sometimes get reused, that library authors [don't always follow the spec](https://github.com/uuid6/uuid6-ietf-draft/issues/41), that the [wikipedia description of version 1 UUIDs](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_1_(date-time_and_MAC_address)) is based on an incorrect library implementation, or that creative developers sometimes generate UUIDs [using their own recipes](https://devblogs.microsoft.com/oldnewthing/20110324-00/?p=11143). I particularly like the story of a developer at Microsoft extracting the MAC address from an unused network card and then [smashing the card with a hammer](https://devblogs.microsoft.com/oldnewthing/20040211-00/?p=40663). They then used the MAC address with their own recipe to generate the other bits of the UUID.

UUID version 4 was the result of another brilliant idea. If generating version 1 uuids is complex and buggy, why don't we make all 122 payload bits random? That's far simpler to implement. The chance of a collision by generating the same random value is far less likely than the chance of a bug resulting in a duplicate version 1 UUID. There's a one in a billion chance of finding a collision after generating 100 trillion version 4 UUIDs. To get up to a 50% chance of finding a collision you would have to generate a billion UUIDs a second for 86 years.

Unsurprisingly UUIDs are everywhere and are most people's first choice unique identifier. 

## Universal Resource Name (URN)

## Universal Unique Lexicographically Sortable Id (ULID)

* Alternative is ULIDs. 128 bit value like UUID consisting of 48 bit timestamp in milliseconds and 80 bits of randomness. ULIDs generated by different servers in same millisecond are arbitrarily ordered by randomness. ULIDs generated by same client in same millisecond are monotonically ordered by library recognizing this case and returning last ULID+1.
  * If clocks are skewed can get entries inserted earlier in order. Have to do something nasty like waiting for 30 seconds before relying on order.
  * Non-start for me
* More controlled eventually consistent order? Use a singleton Epoch counter. e.g. singleton DynamoDB item with an atomic counter. Streams+Lambda process increments counter on any change, with delay to update once every few milliseconds. Lambda can propagate current Epoch value to other items (e.g. one per shard) to scale read bandwidth if needed. Sort key is current Epoch + large random value. Use with server side conflict resolution. Ignore pending transactions until epoch has moved on. When creating new entry need to check that current entry has same or earlier epoch before attempting to write. ARRGH. Doesn't work. Need absolutely predictable id for next entry to use conditional write to enforce constraint. Have to use transaction with CheckCondition? Doesn't help, need to know that epoch has ended across all shards. 

* https://github.com/ulid/spec
* https://www.microsoft.com/en-us/research/uploads/prod/2020/12/TO-Algs-Bernstein-GoodmanVLDB1980.pdf
* https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c
* https://firebase.blog/posts/2015/02/the-2120-ways-to-ensure-unique_68
