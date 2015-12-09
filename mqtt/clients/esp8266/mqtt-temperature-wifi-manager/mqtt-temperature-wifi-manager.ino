#include <DNSServer.h>
#include <WiFiManager.h>
#include <ESP8266WebServer.h>

#include <ESP8266WiFi.h>
#include <DHT.h>
#include <PubSubClient.h>


// Digital Temperature Sensor
#define DHTPIN 2     // what digital pin we're connected to
#define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321
DHT dht(DHTPIN, DHTTYPE); // third parameter: 11 for esp8266-01

// AP wifi
const char* apName = "minitron-AP";
// MQTT
const char* mqtt_server = "192.168.1.111";
int mqtt_port = 1883;
const char* clientUsername = "minitron";
const char* clientPassword = "ciao123456";
const char* handshakeTopic = "dashboard/handshake/";
// TODO: specificare willTopic e willMessage secondo il protocollo implementato
const char* willTopic = "...";
const char* willMessage = "...";
WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char msg[256];


void message_arrived(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

  String mex = "";
  for (int i = 0; i < length; i++) {
    mex += (char)payload[i]; //Serial.print((char)payload[i]);
  }
  Serial.print(" - Messaggio: ");
  Serial.print(mex);

  // Switch command received and process it:
  // TODO    ...if ()

}


void setup() {
  // setup once:
  Serial.begin(115200);
  WiFiManager wifi;

  wifi.setTimeout(120); // retry after 2 minutes to connect to a wifi.

  if(!wifi.autoConnect(apName)) { // timeut reached
    Serial.println("failed to connect and hit timeout");
    delay(3000);
    //reset and try again
    ESP.reset();
    delay(5000);
  } 

  // if you get here you have connected to the WiFi
  Serial.println("connected!");

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(message_arrived);
  
  dht.begin();
  
}

const char* handshake_msg(){
  // return the JSON handshake message.
  // TODO:
  return "prova";
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect(clientUsername, clientUsername, clientPassword, willTopic, 0, 1, willMessage)) { // AUTH
      Serial.println("Connected with the MQTT Broker.");
      // Once connected, publish an announcement... 
      client.publish(handshakeTopic, handshake_msg());
      // SUBSCRIPTIONS:
      client.subscribe("devices/");
      String devTopic = "devices/"+String(clientUsername)+"/"; // devices/<clientUsername>/
      int str_len = devTopic.length() + 1; 
      char char_array[str_len]; // Prepare the character array (the buffer) 
      devTopic.toCharArray(char_array, str_len); // Copy it over 
      client.subscribe(char_array);

    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

char hum[10];
char temp[10];

void action(){

  // Reading temperature or humidity takes about 250 milliseconds!
  // Sensor readings may also be up to 2 seconds 'old' (its a very slow sensor)
  float h = dht.readHumidity();
  // Read temperature as Celsius (the default)
  float t = dht.readTemperature();
  // Read temperature as Fahrenheit (isFahrenheit = true)
  //float f = dht.readTemperature(true);

  // Check if any reads failed and exit early (to try again).
  if (isnan(h) || isnan(t)) { // || isnan(f)
    Serial.println("Failed to read from DHT sensor!");
    return;
  }else{
    // Convert to String the values to be sent with mqtt
        dtostrf(h,4,2,hum);
        dtostrf(t,4,2,temp);
   }
   
    // NB. msg e' definito come un array di 256 caratteri. Aumentare anche all'interno della libreria PubSubClient.h se necessario.
    sprintf (msg, "{\"humidity\": %s, \"temp_celsius\": %s }", hum, temp); // message formatting
    Serial.print("Publish message: ");
    Serial.println(msg);
    client.publish("esp8266/temperature", msg, true); // retained message
  

}


void loop() {
  // run repeatedly
  // Wait a bit between measurements.
  delay(500);


// START MQTT
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 5000) { // se son trascorsi più di 5 secondi, lettura temperatura e invio mqtt
    lastMsg = now;

    action();

  }
// END MQTT


}
