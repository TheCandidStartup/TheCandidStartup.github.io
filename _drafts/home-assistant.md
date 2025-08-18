---
title: Home Assistant
tags: gear
---

wise words

# Alpha ESS

* Integrate locally via modbus API or via cloud hosted Alpha ESS Open AI
* Modbus gives more control and doesn't need internet connection but does need hardwired ethernet or an ethernet to wifi repeater
* Try Open AI route first
* Register at [https://open.alphaess.com/]( https://open.alphaess.com/)
* Need you serial number and check code from the sticker on the side of the inverter
* Anyone with physical access to your inverter can register to control with API!

# Postman

* Alpha ESS Open API [Postman collection](https://github.com/CharlesGillanders/alphaess-openAPI/blob/main/AlphaESS%20Open%20API.postman_collection.json)
* Create free account
* Fork collection so you can edit config
* Fill in collection level variables (click on root node) - AppId, AppSecret, serial number, etc. Use current values to restrict how far they're shared.
* Ignore auth panel. Auth is handled by pre-request script that signs request using AppId and AppSecret
* Remember to press save before you try using a request. Look like you've changed value, persists when you navigate to another page in Postman web UI and come back, but won't be used.
* Click on console button in bottom right footer to see actual request made
* Hurray - API works!
