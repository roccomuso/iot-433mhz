![IoT 433Mhz Logo](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/logo128x128.png?raw=true "Iot 433Mhz Logo")

                                    ___    _____     _  _  __________ __  __ _
                                   |_ _|__|_   _|   | || ||___ /___ /|  \/  | |__  ____
                                    | |/ _ \| |_____| || |_ |_ \ |_ \| |\/| | '_ \|_  /
                                    | | (_) | |_____|__   _|__) |__) | |  | | | | |/ /
                                   |___\___/|_|        |_||____/____/|_|  |_|_| |_/___|


# UI Demo

![iot-433mhz UI](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/web-ui.gif?raw=true "Iot-433mhz Web UI")

# Inspiration

Inspired by [pimatic-homeduino](https://www.npmjs.com/package/pimatic-homeduino-dst-dev) this is a project in his Alpha stage. Documentation is under construction.

# Features

- Multi-platform (Windows, Mac OS X, Linux).
- Intuitive API to build your own interface.
- Built-In Material design cards-based template.
- Real-time UI refresh.
- Detect Radio Frequency codes (433mhz).
- Generate Cards and assign it to your rooms.
- Control RC power sockets, PIR sensors, Door sensors and much more.
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

**Heads Up**: On Raspberry Pi, you can encounter some issue installing all the dependencies, due to permission errors. If that happens try this: <code>sudo chown -R $USER:$GROUP ~/.npm</code> combined with running <code>npm cache clean</code> to get any busted packages out of your cache. In addition, if the error still persist, try adding the flag <code>--unsafe-perm</code>:

    sudo npm install --unsafe-perm   (if installing from git)
    or
    sudo npm install iot-433mhz -g --unsafe-perm   (if installing from npm)

If running on different platforms follow the platform-specific setup below:

# Specific Setup

Iot-433Mhz is built on top of Node.js.
The server is multi-platform, can runs on different hardware combinations shown below:

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

Through the Settings page from the Web Interface, you can change the general settings (stored in <code>config.json</code>). Few of those settings are there listed with their default values:

    DEBUG: true, // Start the app in Debugging mode.
    arduino_baudrate: 9600, // The arduino default baudrate (no need to change it)
    server_port: 8080, // Choose on which port you wanna run the web interface
    db_compact_interval: 12, // Database needs to be compacted to have better performance, by default every 12 hours it will be compacted, put 0 to avoid DB compacting.

If you made a change to the settings from the Web interface, then to make it effective, you need to restart the app.

# Usage

You can use the system through the beautiful web interface (thumbs up for material-design) or use the API.

## Built-in Web Interface

Reachable on the <code>http://serverAddress:PORT</code>, the web <code>server_port</code> is defined in <code>config.json</code>, default's value is 8080. It works well in browsers like Chrome (*reccomended*), Firefox, Safari, Opera, Microsoft Edge (it doesn't on Internet Explorer, avoid it).

If you wanna have a **live console** output of your iot-433mhz running on Node. There's a real time console-mirroring web-console on <code>http://serverAddress:PORT/console.html</code>. (Thanks to [console-mirroring](https://github.com/roccomuso/console-mirroring)).

### Add to Homescreen

The web interface provides along with supported browsers the ability to add the page on your homescreen like a native application. The first time you'll open it, a pop up will come out.

![Added to Homescreen](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/added-to-homescreen.JPG?raw=true "Added to Homescreen")

**Heads Up!** If your server is running on a RPi, make sure to have a static ip address assigned to your server. Otherwise the linked app on the homescreen will not work anymore.

### What kind of devices the system works with

See the [Hardware page](https://github.com/roccomuso/iot-433mhz/tree/master/hardware-layer).


## API


<code>GET /api/code/send/[RFcode]</code>
send the specified rfcode. Return a status object: <code>{"status": "ok"}</code>

<code>GET /api/codes/ignored</code>
Return a list of ignored codes taken from DB.

<code>GET /api/codes/all</code>
Return all the registered codes from DB.

<code>GET /api/room/device/on</code>
Turn on a switch. Example: GET /api/bedroom/lamp1/on

<code>GET /api/room/device/off</code>
Turn off a switch

<code>GET /api/room/device/toggle</code>
Toggle a switch

<code>POST /api/room/device/[on, off, toggle]</code>
Insert rf code assigned to the specified endpoint.
Required parameters: {'new_code': xxxx}

<code>PUT /api/room/device/[on, off, toggle]</code>
Edit rf code assigned to the specified endpoint.
Required parameters: {'new_code': xxxx}


# Notifications

- in-app with notie.js
- and using the html5 features.

# IFTTT Integration

...

# Android & iOS Apps

Soon will be available the official app on both the stores.

# Pull requests

If you submit a pull request, thanks! There are a couple rules to follow though to make it manageable:

- The pull request should be atomic, i.e. contain only one feature. If it contains more, please submit multiple pull requests. Reviewing massive, 1000 loc+ pull requests is extremely hard.
- Likewise, if for one unique feature the pull request grows too large (more than 200 loc tests not included), please get in touch first.
- Please stick to the current coding style. It's important that the code uses a coherent style for readability.
- Do not include sylistic improvements ("housekeeping"). If you think one part deserves lots of housekeeping, use a separate pull request so as not to pollute the code.
- Don't forget tests for your new feature.
