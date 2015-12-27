Inspired by https://www.npmjs.com/package/pimatic-homeduino-dst-dev

If working on RPi, remember to install wiringPi and to execute the app with Sudo.

The server is multi-platform, can runs on different hardware combinations:

A. Computer with connected Arduino (with the right sketch) and 433 MHz transmitter and receiver.
B. Raspberry Pi (Raspbian) with 433 MHz transmitter and receiver


- The Raspberry Pi platform make use of the 433mhz-utils library through the rpi-433 module.
- The other platforms exploits an arduino serial communication, using the node.js serialport module (check out the requirements to have it installed correctly: https://github.com/voodootikigod/node-serialport - on windows make sure to install python 2.7 and Microsoft Visual Studio 2003)