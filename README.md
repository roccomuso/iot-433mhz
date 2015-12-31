Inspired by https://www.npmjs.com/package/pimatic-homeduino-dst-dev this is a project in his Alpha stage. Documentation is under construction.

      ___    _____     _  _  __________ __  __ _
     |_ _|__|_   _|   | || ||___ /___ /|  \/  | |__  ____
      | |/ _ \| |_____| || |_ |_ \ |_ \| |\/| | '_ \|_  /
      | | (_) | |_____|__   _|__) |__) | |  | | | | |/ /
     |___\___/|_|        |_||____/____/|_|  |_|_| |_/___|


If working on RPi, remember to install wiringPi and to execute the app with Sudo.

The server is multi-platform, can runs on different hardware combinations:

- A. Computer with connected Arduino (with the right sketch) and 433 MHz transmitter and receiver.
- B. Raspberry Pi (Raspbian) with 433 MHz transmitter and receiver

Heads Up!

- The Raspberry Pi platform make use of the 433mhz-utils library through the rpi-433 module. But can also run using an external Arduino like the other platforms. To do that, just set to true the <code>use-external-arduino</code> option in the <code>config.json</code> file.
- The other platforms exploits an arduino serial communication, using the node.js serialport module (check out the requirements to have it installed correctly: https://github.com/voodootikigod/node-serialport - on windows make sure to install python 2.7 and Microsoft Visual Studio 2003)


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

