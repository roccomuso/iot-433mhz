![IoT 433Mhz Logo](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/logo128x128.png?raw=true "Iot 433Mhz Logo")
[![Build Status](https://travis-ci.org/roccomuso/iot-433mhz.svg?branch=master)](https://travis-ci.org/roccomuso/iot-433mhz) [![bitHound Overall Score](https://www.bithound.io/github/roccomuso/iot-433mhz/badges/score.svg)](https://www.bithound.io/github/roccomuso/iot-433mhz) [![NPM Version](https://img.shields.io/npm/v/iot-433mhz.svg)](https://www.npmjs.com/package/iot-433mhz) [![Dependency Status](https://david-dm.org/roccomuso/iot-433mhz.png)](https://david-dm.org/roccomuso/iot-433mhz)

      ___    _____     _  _  __________ __  __ _
     |_ _|__|_   _|   | || ||___ /___ /|  \/  | |__  ____
      | |/ _ \| |_____| || |_ |_ \ |_ \| |\/| | '_ \|_  /
      | | (_) | |_____|__   _|__) |__) | |  | | | | |/ /
     |___\___/|_|        |_||____/____/|_|  |_|_| |_/___|


# Summary

Iot-433mhz is a home automation framework for 433mhz devices that runs on node.js. You can control 433MHz RC power sockets, PIR sensors, Door Sensors and much more.
To get started you just need a:
- 433mhz transmitter and receiver, both connected to an Arduino with the iot-433mhz sketch on it.
- A PC/RaspberryPi that runs the iot-433mhz platform, connected to Arduino through USB.

# UI Demo

![iot-433mhz UI](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/web-ui.gif?raw=true "Iot-433mhz Web UI")

# Features

- Multi-platform (Windows, Mac OS X, Linux).
- Basic Authentication.
- Intuitive API & WebHooks to build your own interface.
- Built-In Material design cards-based template.
- Real-time UI refresh.
- Detect Radio Frequency codes (433mhz).
- Generate Cards and assign it to your rooms.
- Control RC power sockets, PIR sensors, Door sensors and much more.
- Telegram Bot for alarm notifications.
- Totally Open Source & Open Hardware.

## Recommended Hardware

For more about the required 433mhz transmitter/receiver and the supported hardware see the [hardware-layer page](https://github.com/roccomuso/iot-433mhz/tree/master/hardware-layer).

# General Install

[![NPM](https://nodei.co/npm-dl/iot-433mhz.png)](https://nodei.co/npm/iot-433mhz/)

You can get it on [npm](https://www.npmjs.com/package/iot-433mhz):

    npm install iot-433mhz -g

and then execute it from console with:

    iot-433mhz

or Clone this Repo:

<code>git clone https://github.com/roccomuso/iot-433mhz.git</code>

Then don't forget to install all the dependencies with <code>npm install</code> (on UNIX system root privileges are required).

Tested and fully-working with **Node 4.4**.

**Heads Up**: On Raspberry Pi, you can encounter some issue installing all the dependencies, due to permission errors. If that happens try this: <code>sudo chown -R $USER:$GROUP ~/.npm</code> combined with running <code>npm cache clean</code> to get any busted packages out of your cache. In addition, if the error still persist, try adding the flag <code>--unsafe-perm</code>:

    sudo npm install --unsafe-perm   (if installing from git)
    or
    sudo npm install iot-433mhz -g --unsafe-perm   (if installing from npm)

Note: the reason for using the `--unsafe-perm` option is that when node-gyp tries to recompile any native libraries (eg. serialport) it tries to do so as a "nobody" user and then fails to get access to certain directories. Allowing it root access during install allows the dependencies to be installed correctly during the upgrade.

If running on different platforms follow the platform-specific setup below:

## Browser Support

![IE](https://cloud.githubusercontent.com/assets/398893/3528325/20373e76-078e-11e4-8e3a-1cb86cf506f0.png "Internet Explorer") | ![Chrome](https://cloud.githubusercontent.com/assets/398893/3528328/23bc7bc4-078e-11e4-8752-ba2809bf5cce.png "Google Chrome") | ![Firefox](https://cloud.githubusercontent.com/assets/398893/3528329/26283ab0-078e-11e4-84d4-db2cf1009953.png "Firefox") | ![Opera](https://cloud.githubusercontent.com/assets/398893/3528330/27ec9fa8-078e-11e4-95cb-709fd11dac16.png "Opera") | ![Safari](https://cloud.githubusercontent.com/assets/398893/3528331/29df8618-078e-11e4-8e3e-ed8ac738693f.png "Safari")
--- | --- | --- | --- | --- |
IE 11+ ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ |

# Specific Setup

Iot-433Mhz is built on top of Node.js.
The server is multi-platform, can run on different hardware combinations shown below:

## A. Computer with Arduino connected and a 433 MHz transmitter and receiver.

![tx rx arduino](https://github.com/roccomuso/iot-433mhz/blob/master/other/schemes/arduino-transmitter-and-receiver.jpg?raw=true "Arduino Interface and 433mhz")

### Mac, Linux

The iot-433mhz server should run smoothly. Remember to install with root permission (*sudo*):

    sudo npm install iot-433mhz -g

and then execute with:

    iot-433mhz

### Windows

To run the server on windows make sure to install **python 2.7** and **Microsoft Visual Studio Express 2013**. (Required by [node-serialport](https://github.com/voodootikigod/node-serialport)).
Then just do a:

    npm install iot-433mhz -g

and then execute with:

    iot-433mhz

## B. Raspberry Pi (Raspbian Jessie) with 433 MHz transmitter and receiver

To use iot-433mhz on Raspberry Pi first do a **system update**:
- Update <code>/etc/apt/sources.list</code> to have <code>jessie</code> wherever you've currently got <code>wheezy</code>.
- <code>sudo apt-get update && sudo apt-get dist-upgrade</code>.
- <code>sudo rpi-update</code>.
- Reboot.

Then install Node.js:

    wget http://node-arm.herokuapp.com/node_latest_armhf.deb
    sudo dpkg -i node_latest_armhf.deb
    # Check installation
    node -v

### Transmitter and Receiver connected to GPIO

One way to go is directly connecting the radio transmitter and receiver to the GPIO as shown in the following picture, but first remember to install **wiringPi** ([link](http://wiringpi.com/download-and-install/)) and to execute the app with root permission (*sudo*):

![rpi 433mhz](https://github.com/roccomuso/iot-433mhz/blob/master/other/schemes/raspberry-pi-rxb6-kxd10036-on-3.3v.jpg?raw=true "IoT-433mhz with RPi")

**Heads Up**. The RF receiver module operates at 5V. THE GPIO data pins can only support 3.3V! If you put your receiver on 5V, the data io pin of the raspberry will also receive 5V which is way too high. A simple resistor (4.7k) should be fine, as already outlined in many forum posts, but is recommendend a **logic level converter** / level shifter or a simple **voltage divider**:

![level shifter](https://github.com/roccomuso/iot-433mhz/blob/master/other/schemes/rpi-llc-receiver.jpg?raw=true "Level Shifter")

here the voltage divider:

![voltage divider](https://github.com/roccomuso/iot-433mhz/blob/master/other/schemes/voltage-divider.jpg?raw=true "Voltage Divider")

The important thing here is the ratio of R1 to R2; R1 should be just over half R2's value to ensure 5V is divided down to 3.3V. The values shown here should be suitable for most uses.

**NB**. For this configuration the Raspberry Pi platform uses the 433mhz-utils library through the rpi-433 module. But notice that RFSniffer (compiled c) appears to chew up all the RPi CPU (95%). Not ideal at all, therefore an external Arduino is the recommended solution.

### Using RPi with an external Arduino.

- Remember to install with **root** permission.

The system can run on RPi using an external Arduino like the other platforms. To do that, just set to <code>true</code> the <code>use-external-arduino</code> option in the <code>config.json</code> file.
- In this way we'll force the RPi to use an Arduino through USB, using the node.js serialport module.

- I'm not sure if strictly necessary but it's worth installing the arduino IDE and related drivers with <code>apt-get install arduino</code>.

**Heads Up!** Sometimes the USB doesn't get detected on the fly (you should be able to see it with <code>ls /dev/tty*</code> - [USB not working?](https://www.raspberrypi.org/forums/viewtopic.php?f=28&t=53832)). Just plug-it and then reboot your RPi.

Is recommended to run the server on the RPi through a "terminal session". (see [screen](https://www.raspberrypi.org/forums/viewtopic.php?t=8099&p=101209)).

# Config

Through the Settings page from the Web Interface, you can more or less change the general settings (stored in <code>config.json</code>). Few of those settings are there listed with their default values:

    DEBUG: true, // Start the app in Debugging mode.
    username: root, // Username required to authenticate (required also during API calls)
    password: root,  // Password required to authenticate (required also during API calls)
    arduino_baudrate: 9600, // The arduino default baudrate (no need to change it)
    server_port: 8080, // Choose on which port you wanna run the web interface
    db_compact_interval: 12, // Database needs to be compacted to have better performance, by default every 12 hours it will be compacted, put 0 to avoid DB compacting.
    "backend_urls": "..." // You can specify a backend json file containing the urls to carry out notifications. (NB. this requires the iot-433mhz-backend repo)

iot-433mhz makes use of the node DEBUG module. It's enabled by default, but you can enable or disable it using the environment variable <code>DEBUG=iot-433mhz:*</code>. You could also debug a specific part of the application providing as secondary param the file name, like <code>DEBUG=iot-433mhz:socketFunctions.js</code>.

If you made a change to the settings from the Web interface, then to make it effective, you need to restart the app.
The best way to set custom settings is through the CLI optional parameters, shown below.

# Usage

Start the system with the console global command:

    iot-433mhz

Then you'll have to select the correct serial port to which the Arduino is attached to

![start iot-433mhz](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/start-iot-433mhz.PNG?raw=true "Console start iot-433mhz")

Once selected you're ready to go!
You're then free to use the system through the beautiful web interface (thumbs up for material-design) or use the API to build your own interface.

To custom your system settings simply use the CLI options:

    iot-433mhz --help

That shows something like that:

![iot-433mhz cli options](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/iot-433mhz-cli-options.PNG?raw=true "iot-433mhz cli options")

You can provide some parameter also as ENV variables:

    NODE_ENV=development  # for virtual serial port
    PORT=8080  # web server port
    SERIAL_PORT=/dev/ttyUSB0  # serial port


## Built-in Web Interface

Reachable on the <code>http://serverAddress:PORT</code>, the web <code>server_port</code> is defined in <code>config.json</code>, default's value is 8080. It works well in browsers like Chrome (*reccomended*), Firefox, Safari, Opera, Microsoft Edge (it doesn't on Internet Explorer, avoid it).

Once you open the address on your browser an **authentication is required**.
Username and password are stored inside the *config.json* file (default values are: root, root).

If you wanna have a **live console** output of your iot-433mhz running on Node. There's a real time console-mirroring web-console on <code>http://serverAddress:PORT/console.html</code>. (Thanks to [console-mirroring](https://github.com/roccomuso/console-mirroring)).

### Add to Homescreen

The web interface provides along with supported browsers the ability to add the page on your homescreen like a native application. The first time you'll open it, a pop up will come out.

![Added to Homescreen](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/added-to-homescreen.JPG?raw=true "Added to Homescreen")

**Heads Up!** If your server is running on a RPi, make sure to have a static ip address assigned to your server. Otherwise the linked app on the homescreen will not work anymore.

### What kind of devices the system works with

See the [Hardware page](https://github.com/roccomuso/iot-433mhz/tree/master/hardware-layer).

## API

Below every single API available is documented. Too lazy to copy and paste? just download and import the Postman collection ([download](https://github.com/roccomuso/iot-433mhz/blob/master/other/IoT-433Mhz.json.postman_collection)).

**Tip**: The iot-433mhz server requires a basic Authentication also for the API calls. Username and Password are defined inside the *config.json* file (default username and password: root, root). What you need to take into account is to set the following header field during your HTTP requests: <code>Authorization: Basic cm9vdDpyb290</code> where the last string is the base64 encoding of <code>root:root</code>, if you changed default username and password you should update the base64 text too ([learn more](https://en.wikipedia.org/wiki/Basic_access_authentication) on Basic Authentication Access).

- <code>GET /api/settings/get</code>
Return the current settings. Useful to see notification status.

- <code>GET /api/system/get/uid</code>
Return the unique IoT System UID (a unique random ID generated from the system).

- <code>GET /api/system/new/uid</code>
Generate a new unique IoT System UID (a unique random ID generated from the system).

- <code>GET /api/system/telegram/enable</code>
Enable notification through Telegram Bot.

- <code>GET /api/system/telegram/disable</code>
Disable notification through Telegram Bot.

- <code>GET /api/system/email/enable</code>
Enable notification through Email.

- <code>GET /api/system/email/disable</code>
Disable notification through Email.

- <code>GET /api/code/send/[RFcode]</code>
send the specified rfcode. Return a status object: <code>{"status": "ok"}</code> or <code>{"status": "error", "error": "error description.."}</code>

- <code>GET /api/codes/ignored</code>
Return a list of ignored codes stored in DB.

- <code>GET /api/codes/all</code>
Return all the registered codes stored in DB.

- <code>GET /api/codes/available</code>
Return all the available codes stored in DB. Available codes can be assigned to a new device card.

- <code>GET /api/cards/all</code>
Return all the cards stored in DB.

- <code>GET /api/cards/get/[shortname]</code>
Return a single card with the specified shortname.

- <code>POST /api/cards/new</code>
form-data required parameters:

        headline - a brief headline.
        shortname - lower case, no spaces.
        card_body - a description, html allowed.
        room - lower case, no spaces.
        type - must be one of the following types: switch/alarm/info
        device - if type==switch gotta have on_code and off_code parameters. if type==alarm just the trigger_code parameter

Optional parameter: <code>card_img</code>, <code>background_color</code> (must be an hex color with).
Json response: 200 OK - <code>{"done": true, "newCard": ...}</code> where newCard is the json card just inserted. Or <code>{"done": "false", "error": "error description..."}</code>

- <code>GET /api/cards/delete/[shortname]</code>
Delete the card with the specified shortname, it returns <code>{"status": "ok", cards_deleted: 1}</code> or <code>{"status": "error", "error": "error description.."}</code>

- <code>POST /api/cards/arm-all</code>
Arm all the alarm type cards. It returns <code>{"status": "ok", cards_affected: n, armed: true}</code> or <code>{"status": "error", "error": "error description.."}</code>

- <code>POST /api/cards/disarm-all</code>
Disarm all the alarm type cards. It returns <code>{"status": "ok", cards_affected: n, armed: false}</code> or <code>{"status": "error", "error": "error description.."}</code>

- <code>GET /api/alarm/[shortname]/arm</code>
Only alarm type cards can be armed.

- <code>GET /api/alarm/[shortname]/disarm</code>
Only alarm type cards can be disarmed. (If disarmed no WebHook callbacks or any kind of notifications will be sent)

- <code>GET /api/switch/[shortname]/on</code>
Turn on a switch.

- <code>GET /api/switch/[shortname]/off</code>
Turn off a switch

- <code>GET /api/switch/[shortname]/toggle</code>
Toggle a switch

## WebHooks

Webhooks allow you to build or set up integrations which subscribe to certain events on the iot-433mhz system. When one of those events is triggered, we'll send a HTTP POST payload to the webhook's configured URL. (thanks to [node-webhooks](https://github.com/roccomuso/node-webhooks))
Webhooks can be used to catch several events:
- alarm triggered event.
- new card event.
- card deleted event.
- new code detected event.
- switch toggle event.

NB. In this current release WebHooks are not card-specific. For example, a single *alarmTriggered* event type catches every alarm trigger. It's up to you parse the payload and make sure that was the sensor you were wishing for.

Use the API below to set up and interacts with WebHooks.

- <code>POST /api/webhook/add/[WebHookShortname]</code>
Add a new URL for the selected webHook.
Required parameters:

        webHookShortname - Provided in url, it must be one of these*: alarmTriggered, newCard, cardDeleted, newCode, switchToggle.
        url - the URL to which a HTTP POST request will be sent when the event get fired (the request carries a JSON payload field that gotta be parsed).

Let's describe every event JSON payload you're gonna listen for according to the supplied <code>webHookShortname</code>:

<code>alarmTriggered = {"card_id": "...", "last_alert": 1453..., "code": ..., "shortname": "...", "room": "..." }</code> * NB. an alarmTriggered WebHook callback will be executed only if the alarm card is armed!

<code>newCard = {"card_id":"...", "headline": "", "shortname": "", "card_body": "", "img": "", "type": "switch/alarm/info", "room": "", "device": { \*\*\* }}</code> NB. device depends on **type**: if *switch*, we would look for these properties: on_code, off_code, notification_sound, is_on. If *alarm*: last_alert, trigger_code, notification_sound. If *info* device got no properties.

<code>cardDeleted = {"card_id": "..."}</code>

<code>newCode = {"code": "...", "bitlength": ..., "protocol": ...}</code> NB. The detected code could be ignored or already attached to a device card.

<code>switchToggle = {"card_id": "...", "is_on": true/false, "sent_code": ..., "timestamp": 1453... }</code>

- <code>GET /api/webhook/get</code>
Return the whole webHook DB file.

- <code>GET /api/webhook/get/[WebHookShortname]</code>
Return the selected WebHook.

- <code>GET /api/webhook/delete/[WebHookShortname]</code>
Remove all the urls attached to the selected webHook.

- <code>POST /api/webhook/delete/[WebHookShortname]</code>
Remove only one single url attached to the selected webHook.
A json body with the url parameter is required: { "url": "http://..." }

- <code>POST /api/webhook/trigger/[WebHookShortname]</code>
Trigger a webHook. It requires a JSON body that will be turned over to the webHook URLs.

# Telegram Bot & Notifications

Out of the box, the iot-433mhz provides notifications through email and through a Telegram Bot. Of course you're free to develop your own notification system using our WebHooks API.
**Notifications should be enabled and configured through the <code>Menu > Settings</code> page.** This is how the Settings page looks like:

![Telegram settings](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/iot-433mhz-telegram-settings.PNG?raw=true "Telegram Settings")

By default there is a 5 second notification delay (editable from <code>config.json:notificationDelay</code>). So you won't be flooded by alarms signals.

The Email notification system is under construction [#18](https://github.com/roccomuso/iot-433mhz/issues/18).

# Android & iOS Apps

Soon will be available the official app on both the stores.

# Pull requests

If you submit a pull request, thanks! There are a couple rules to follow though to make it manageable:

- The pull request should be atomic, i.e. contain only one feature. If it contains more, please submit multiple pull requests. Reviewing massive, 1000 loc+ pull requests is extremely hard.
- Likewise, if for one unique feature the pull request grows too large (more than 200 loc tests not included), please get in touch first.
- Please stick to the current coding style. It's important that the code uses a coherent style for readability.
- Do not include sylistic improvements ("housekeeping"). If you think one part deserves lots of housekeeping, use a separate pull request so as not to pollute the code.
- Don't forget tests for your new feature.

# Inspiration

Inspired by [pimatic-homeduino](https://www.npmjs.com/package/pimatic-homeduino-dst-dev) this is a project in his Beta stage. Documentation is under construction.

# Author

### @ Rocco Musolino - [hackerstribe.com](http://www.hackerstribe.com)
