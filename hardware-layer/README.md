The Hardware-layer sketches are built for **Arduino** and only if running on platform different from RPi (or on RPI but with the <code>use-external-arduino</code> option setted on <code>true</code> in the <code>config.json</code> file).

In this directory you'll find <code>sender</code>, <code>receiver</code> and a <code>single-arduino-tx-rx</code> that's a single sketch both for sending and receiving with only one arduino board.

Use the latter in production environment.

# RC-Switch

Every sketch is based on the library ([RC-Switch](https://github.com/sui77/rc-switch)) used to receive and send radio signal through the Arduino. This will most likely work with all popular low cost power outlet sockets, Gas sensor, PIR/Door sensors.
Supported devices should have one of the following chipset: *SC5262 / SC5272, HX2262 / HX2272, PT2262 / PT2272, EV1527, RT1527, FP1527 or HS1527*.

# Recommended TX/RX Hardware

Personally my advice is to use an Arduino nano with a common 433mhz radio transmitter and a 433mhz receiver. Both this modules can be bought with few euros on Ebay or Aliexpress.

![cheap tx rx modules 433mhz](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/433mhz-rf.jpg "cheap tx rx modules 433mhz")

better and recommended modules are this **'Super-heterodyne' RXB6**:

![RXB6 super heterodyne](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/RXB6-super-heterodyne.JPG "RXB6 super heterodyne")

## Antenna length

Actually, many 433MHz circuit boards have a coil with a few windings between the circuitry and the solder pad marked ANT. The XD-RF-5V commonly available on the market has a three winding coil with a 5mm diameter. *5mm x 3 x PI accounts* for almost 5cm, so the external part of the antenna should be around 12cm to come to a total length of quarter lambda.

I always find antenna's to be black magic, but for me 12cm seemed to work! Around the internet the most common antenna's length seems to be 17.3 cm.

You can even do some more spires if you want or ... if you don't want to make the antenna by yourself, just buy it somewhere.

### Outlet sockets

Referring to RCSwitch library, there are generally few common kinds of outlet switches (working on a Frequency 433.92Mhz). From a 10 pole DIP switch to the one with two rotary (or sliding) switches with four setting possibilities each.

These are the recommended kind with the 10 pole DIP:

![Outlet Sockets 433mhz](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/rc-433mhz-outplug-dip.png "outlet sockets 433mhz")

![433mhz Remote Controller](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/rc-controller-433mhz-dip.png "Remote controller")

### Other devices

Gas Sensor, Pir Sensor, Door/contact sensor.

![433mhz PIR Sensor](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/433mhz-pir-sensor.jpg "PIR Sensor")

![433mhz Door sensor](https://github.com/roccomuso/iot-433mhz/blob/master/other/pics/433mhz-contact-door-sensor.png "Door Sensor")






