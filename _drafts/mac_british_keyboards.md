---
title: Making sense of British keyboard layouts on the Mac
---

So, I have a MacBook. Never owned a Mac before. There are two reasons why I now have one. The reason I like to give is that it will make development for iOS and the cloud easier than a Windows machine. The real reason is that I had a lot of Autodesk applause points to spend before I retired. 

Autodesk, like many large companies, has a system for giving ad hoc rewards to employees. At Autodesk you get applause points which need to be spent in the applause store. Seemed like a great opportunity to replace the Windows laptop, dock, monitors, mouse and keyboard that I needed to return to Autodesk. The applause store (at least the UK version) has an eclectic mix of stuff. Lots of homeware and gadgets. There's a great selection of all things Apple and complete junk for anything Windows related. Which is why I ended up exchanging my points for a MacBook Air, an iPhone mini, AirPods and a set of 6 Le Creuset mini-ramekins.

Naturally a Macbook from the UK version of the applause store comes with Apple's British keyboard layout. Which is weird if you're used to a standard (Windows) British keyboard layout. 

## Standard Layout

![United Kingdom Extended Keyboard](/assets/images/KB_United_Kingdom_Ext.png) 
<sub>[KeyboardUK, CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), via Wikimedia Commons</sub>

## Apple Layout

![United Kingdom Mac Apple Keyboard](/assets/images/KB_United_Kingdom_Mac_Apple_Keyboard.svg) 
<sub>[Yes0song, CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0), via Wikimedia Commons</sub>

The `backslash`[^1] key has moved across the keyboard to where `# ~` used to be. `~` joins `grave`[^2] back where `backslash` should be while `#` is only accessible via `Option-3`. Meanwhile `@` and `"` have swapped places and what used to be the `grave` key (top left corner) is used for two symbols I don't know the names for and have never knowingly used. 

Shouldn't be a problem. Most of the time the MacBook will be docked and I'll be using an external keyboard. I used a [Microsoft Natural Ergonomic Keyboard 4000](https://en.wikipedia.org/wiki/Microsoft_ergonomic_keyboards#Natural_Ergonomic_Keyboard_4000) with my Windows laptop and got on very well with it. Of course, like anything good, they don't make them anymore. So I got the replacement for it - the [Microsoft Ergonomic Keyboard](https://www.microsoft.com/en-gb/d/microsoft-ergonomic-keyboard/93841ngdwr1h). The main differences are that the keyboard is less ergonomic, the keys feel cheaper, the integrated mouse wheel has gone but they have (infuriatingly) added dedicated buttons to open Office and an Emoji picker. At this point I should mention that my setup will include both a PC and a Mac with a shared keyboard/mouse/monitor. So, an external Apple keyboard was never an option. 

I plugged the keyboard in and it was detected straight away. I was prompted to press the key to the left of Z so that macOS could determine what kind of keyboard I had. Great, I thought. The famous Mac first class user experience. Everything was fine until I tried typing symbols. When I hit `backslash` I got `grave`, when I hit `#` I got `backslash` and when I tried `grave` I got the symbol that cannot be named, `§`. 

# How keyboards actually work

As far as the Mac is concerned there are only three types of keyboard - ANSI, ISO and JIS.

![Physical Keyboard Layouts - ANSI ISO JIS](/assets/images/Physical_keyboard_layouts_comparison_ANSI_ISO_JIS.png)
<sub>[Brilliantwiki2, CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), via Wikimedia Commons</sub>

The business of pressing the key to the left of Z was just to check whether physically the keyboard had an ISO layout. Modern keyboards use [USB HID Usage Codes](https://gist.github.com/MightyPork/6da26e382a7ad91b5496ee55fdc73db2) to identify which key was pressed. On my ISO layout keyboard the key to the left of Z is code 0x64 described as "Keyboard Non-US \\ and \|". Which is what is printed on the key. So why does pressing it generate a `grave`? Because it doesn't matter what is printed on the key. All the HID code does is identify a physical key. On my MacBook's built in keyboard the key to the left of Z has "\`" and "~" printed on it. The keyboard still sends code 0x64 when it's pressed. 

The mapping from a HID code to the Unicode character generated is defined by the [macOS input source](https://support.apple.com/en-gb/guide/mac-help/mchlp1406/mac). My MacBook has a British input source defined to match the built in British keyboard. Whenever I press a key on my external keyboard it will generate the same character as the corresponding key on the built in keyboard. You can add other input sources and manually switch between them. However, there is no Windows British input source available. Even if there was it would be painful to have to manually switch whenever I moved between keyboards. 

# Enter Karabiner-Elements

I needed a way to remap the keys on my external keyboard while leaving the built in keyboard alone. 

#### Footnotes

[^1]: I can't work out how to escape "\\" *and* have it formatted as code in markdown
[^2]: I can't make it work for "\`" either
