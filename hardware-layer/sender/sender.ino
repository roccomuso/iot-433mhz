/*
  Simple example for sender
  
  https://github.com/sui77/rc-switch

  How to connect the 433mhz transmitter to Arduino: GND - 5V - pin D10
  
*/

#include <RCSwitch.h>

RCSwitch mySwitch = RCSwitch();

void setup() {
  Serial.begin(9600);

  // Transmitter is connected to Arduino Pin #10  
  mySwitch.enableTransmit(10);
}


void invia(){

     if (Serial.available() > 0){
      
        String val = Serial.readStringUntil('\n');

        Serial.println(val);
        if (val)
        {

           mySwitch.send(val.toInt(), 24);
           Serial.println(val+" inviato!");
          /* MODI DISPONIBILI D'INVIO */
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



void loop() {
  
  invia();


/*
String content = "";
  char character;

  while(Serial.available()) {
      character = Serial.read();
      content.concat(character);
      delay(15);
  }

  if (content != "") {
    Serial.println(content);
  }
*/

}

