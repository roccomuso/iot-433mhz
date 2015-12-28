Inspired by https://www.npmjs.com/package/pimatic-homeduino-dst-dev

If working on RPi, remember to install wiringPi and to execute the app with Sudo.

The server is multi-platform, can runs on different hardware combinations:

A. Computer with connected Arduino (with the right sketch) and 433 MHz transmitter and receiver.
B. Raspberry Pi (Raspbian) with 433 MHz transmitter and receiver


- The Raspberry Pi platform make use of the 433mhz-utils library through the rpi-433 module.
- The other platforms exploits an arduino serial communication, using the node.js serialport module (check out the requirements to have it installed correctly: https://github.com/voodootikigod/node-serialport - on windows make sure to install python 2.7 and Microsoft Visual Studio 2003)


# API

GET /rfcode/<code>
send the specified rfcode.

GET /<room>/<device>/on
Turn on a switch. Example: GET /bedroom/lamp1/on

GET /<room>/<device>/off
Turn off a switch

GET /<room>/<device>/toggle
Toggle a switch

POST /<room>/<device>/[on, off, toggle]
Insert rf code assigned to the specified endpoint.
Required parameters: {'new_code': xxxx}

PUT /<room>/<device>/[on, off, toggle]
Edit rf code assigned to the specified endpoint.
Required parameters: {'new_code': xxxx}

# Notifications

- in-app with notie.js
- and using the html5 features.

# IFTTT Integration

...

