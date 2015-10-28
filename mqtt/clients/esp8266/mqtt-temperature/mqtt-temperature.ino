#include "DHT.h"
#include <ESP8266WiFi.h>
#include "PubSubClient.h"

#define DHTPIN 2     // what digital pin we're connected to

#define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321

// Connect pin 1 (on the left) of the sensor to +5V
// NOTE: If using a board with 3.3V logic like an Arduino Due connect pin 1
// to 3.3V instead of 5V!
// Connect pin 2 of the sensor to whatever your DHTPIN is
// Connect pin 4 (on the right) of the sensor to GROUND
// Connect a 10K resistor from pin 2 (data) to pin 1 (power) of the sensor

// Initialize DHT sensor.

DHT dht(DHTPIN, DHTTYPE);

// Wifi credentials and MQTT broker
const char* ssid = "Vodafone-PensioneDiVece";
const char* password = "dodide1333912";
const char* mqtt_server = "broker.hivemq.com";
int mqtt_port = 1883;
const char* BrokerUsername = "...";
const char* BrokerPassword = "...";

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char msg[128];


void setup() {
  pinMode(BUILTIN_LED, OUTPUT);     // Initialize the BUILTIN_LED pin as an output
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  dht.begin();
}

void setup_wifi() {

  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  // Switch on the LED if an 1 was received as first character
  if ((char)payload[0] == '1') {
    digitalWrite(BUILTIN_LED, LOW);   // Turn the LED on (Note that LOW is the voltage level
    // but actually the LED is on; this is because
    // it is acive low on the ESP-01)
  } else {
    digitalWrite(BUILTIN_LED, HIGH);  // Turn the LED off by making the voltage HIGH
  }

}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP8266Client")) { // variabili AUTENTICAZIONE
      Serial.println("connected");
      // Once connected, publish an announcement...
      client.publish("all", "Sono qui!");
      // ... and resubscribe
      client.subscribe("esp8266/frankestein");
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
    
void loop() {
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
   
    // NB. msg e' definito come un array di 128 caratteri. Aumentare se necessario.
    sprintf (msg, "{\"humidity\": %s, \"temp_celsius\": %s }", hum, temp); // message formatting
    Serial.print("Publish message: ");
    Serial.println(msg);
    client.publish("esp8266/temperature", msg, true); // retained message
  

  }
// END MQTT



}
