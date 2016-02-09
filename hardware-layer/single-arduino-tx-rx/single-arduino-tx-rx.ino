/*
  Simple example for both sender and receiver

  - Dependencies:
  https://github.com/sui77/rc-switch/releases/latest (RC 433mhz library)
  https://github.com/bblanchon/ArduinoJson (Arduino JSON Library)

  How to connect the 433mhz receiver to arduino: GND - 5V - pin D2
  How to connect the 433mhz transmitter to Arduino: GND - 5V - pin D10
  
*/

#include <RCSwitch.h>
#include <ArduinoJson.h>

RCSwitch mySwitch = RCSwitch();

void setup() {
  Serial.begin(9600);

  // Transmitter is connected to Arduino Pin #10  
  mySwitch.enableTransmit(10);
  // Receiver connected on inerrupt 0 => that is pin #2
  mySwitch.enableReceive(0);
  
}


void invia(){


     if (Serial.available() > 0){
      
        String val = Serial.readStringUntil('\n');

        Serial.println(val);
        if (val)
        {

           mySwitch.send(val.toInt(), 24);

          // Serial response
          StaticJsonBuffer<100> jsonBuffer;
          
          JsonObject& root = jsonBuffer.createObject();
          root["type"] = "signal";
          root["status"] = "sent";
          root["code"] = val;
          
          
          root.printTo(Serial);
          Serial.println(); // send a \n

          //Serial.println("@ "+val+" sent!");

           
          /* ALTRI MODI DISPONIBILI D'INVIO */
           /* See Example: TypeA_WithDIPSwitches */
            //mySwitch.switchOn("11111", "00100");
            //delay(5000);
            //mySwitch.switchOff("11111", "00100");
            //delay(1000);

              /* Same switch as above, but using decimal code */
            //mySwitch.send(5201, 24); // on
            //delay(5000);  
            //mySwitch.send(5204, 24); // off
            //delay(1000);  
          
            /* Same switch as above, but using binary code */
            //mySwitch.send("000000000001010001010001"); // on
            //delay(5000);  
            //mySwitch.send("000000000001010001010100"); // off
            //delay(1000);


        }

     }
  
    
}

void ricevi(){

if (mySwitch.available()) {
    
    int value = mySwitch.getReceivedValue();

    StaticJsonBuffer<200> jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();
    
    if (value == 0) {
      Serial.print("Unknown encoding");
      root["type"] = "signal";
      root["status"] = "unknown";
      root["code"] = value;
      root["bitlength"] = mySwitch.getReceivedBitlength();
      root["protocol"] = mySwitch.getReceivedProtocol();
      
      root.printTo(Serial);
      Serial.println(); // send a \n
    
    } else {

      // Serial response
          
          root["type"] = "signal";
          root["status"] = "received";
          root["code"] = mySwitch.getReceivedValue();
          root["bitlength"] = mySwitch.getReceivedBitlength();
          root["protocol"] = mySwitch.getReceivedProtocol();
          
          root.printTo(Serial);
          Serial.println(); // send a \n
          
    }

    mySwitch.resetAvailable();
  }
  
/* // Advanced debug
  if (mySwitch.available()) {
    output(mySwitch.getReceivedValue(), mySwitch.getReceivedBitlength(), mySwitch.getReceivedDelay(), mySwitch.getReceivedRawdata(),mySwitch.getReceivedProtocol());
    mySwitch.resetAvailable();
  }
*/
}

void loop() {
  
  invia();

  ricevi();
  
}

