

      ___    _____     _  _  __________ __  __ _
     |_ _|__|_   _|   | || ||___ /___ /|  \/  | |__  ____
      | |/ _ \| |_____| || |_ |_ \ |_ \| |\/| | '_ \|_  /
      | | (_) | |_____|__   _|__) |__) | |  | | | | |/ /
     |___\___/|_|        |_||____/____/|_|  |_|_| |_/___|



# Demo

TODO img

# Inspiration

Inspired by https://www.npmjs.com/package/pimatic-homeduino-dst-dev this is a project in his Alpha stage. Documentation is under construction.

# Features

TODO

# Server

The server is built on top of Node.js.

If working on RPi, remember to install wiringPi and to execute the app with Sudo.

The server is multi-platform, can runs on different hardware combinations:

### A. Computer with connected Arduino (with the right sketch) and 433 MHz transmitter and receiver.

![tx rx arduino](https://github.com/roccomuso/iot-433mhz/blob/master/other/schemes/arduino-transmitter-and-receiver.jpg "Arduino Interface and 433mhz")

### B. Raspberry Pi (Raspbian) with 433 MHz transmitter and receiver

![rpi 433mhz](https://github.com/roccomuso/iot-433mhz/blob/master/other/schemes/raspberry-pi-rxb6-kxd10036-on-3.3v.jpg "IoT-433mhz with RPi")

NB. The RF receiver module operates at 5V. THE GPIO data pins can only support 3.3V! If you put your receiver on 5V, the data io pin of the raspberry will also receive 5V which is way ot high. A simple resistor (4.7k) should be fine, as already outlined in many forum posts, but is recommendend a logic level converter / level shifter or a simple voltage divider:

![level shifter](https://github.com/roccomuso/iot-433mhz/blob/master/other/schemes/rpi-llc-receiver.jpg "Level Shifter")
or
![voltage divider](https://github.com/roccomuso/iot-433mhz/blob/master/other/schemes/voltage-divider.jpg "Voltage Divider")

The important thing here is the ratio of R1 to R2; R1 should be just over half R2's value to ensure 5V is divided down to 3.3V. The values shown here should be suitable for most uses.

Heads Up!

- The Raspberry Pi platform make use of the 433mhz-utils library through the rpi-433 module. But can also run using an external Arduino like the other platforms. To do that, just set to true the <code>use-external-arduino</code> option in the <code>config.json</code> file.
- The other platforms exploits an arduino serial communication, using the node.js serialport module (check out the requirements to have it installed correctly: https://github.com/voodootikigod/node-serialport - on windows make sure to install python 2.7 and Microsoft Visual Studio 2003)

Is recommended to run the server on the RPi through a terminal session. (see screen command).

# Install

You can get it on npm:

TODO ...

# Usage

TODO

# API


<code>GET /rfcode/code </code>
send the specified rfcode.

<code>GET /room/device/on</code>
Turn on a switch. Example: GET /bedroom/lamp1/on

<code>GET /room/device/off</code>
Turn off a switch

<code>GET /room/device/toggle</code>
Toggle a switch

<code>POST /room/device/[on, off, toggle]</code>
Insert rf code assigned to the specified endpoint.
Required parameters: {'new_code': xxxx}

<code>PUT /room/device/[on, off, toggle]</code>
Edit rf code assigned to the specified endpoint.
Required parameters: {'new_code': xxxx}

# Notifications

- in-app with notie.js
- and using the html5 features.

# IFTTT Integration

...

# Android & iOS Apps

Soon will be available the official app on both the stores.

# License

MIT