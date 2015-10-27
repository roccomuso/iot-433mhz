/*
PC MQTT client
*/

var mqtt    = require('mqtt');

var client  = mqtt.connect('mqtt://192.168.1.6', {
	clientId: 'pc-xps', 
	keepalive:15, 
	will: {topic: 'test/topic', payload: new Buffer('I am dead.')}
 });
// for more options watch this: https://github.com/mqttjs/MQTT.js#client

// Event Handling:

client.on('connect', function () {
	// Emitted on successful (re)connection
	console.log("Client connected.");
	client.subscribe('test/topic');
	client.publish('test/topic', 'Hello mqtt...');
});

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString());
  //client.end(); close connection
});

client.on('offline', function(){
	// Emitted when the client goes offline
	console.log('Client offline');
});

client.on('close', function(){
	// Emitted after a disconnection
	console.log('Client disconnected');
});

client.on('reconnect', function(){
	// Emitted when a reconnect starts
	console.log('Client reconnecting..');
});

client.on('error', function(){
	// Emitted when the client cannot connect
	console.log('Client error.');
});

