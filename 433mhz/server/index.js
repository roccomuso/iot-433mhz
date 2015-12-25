// On Raspberry Pi make sure to execute with SUDO.

var fs = require('fs');
var async = require('async');
var config = require('./config.json');

// TODO, magari meglio creare un oggetto e popolarlo?
var SERIAL_PORT;

// Starting Flow
async.series({
    ascii_logo: function(callback){
    	require('./ascii_logo.js')(function(logo){
    		console.log(logo);
    		callback(null, 1);
    	}); 
    },
    platform: function(callback){
    	require('./platform.js')(function(serial_port){
    		SERIAL_PORT = serial_port
    		callback(null, serial_port);
    	});
    	
    },
    serial_listen: function(callback){
    	// TODO...
    	console.log('Got it! ', SERIAL_PORT);
    	callback(null, 3);
    }
   
},
function(err, results) {
    // results is now equal to: {one: 1, two: 2}

    // console.log('Risultati: ', results);

});




/*

// For RPi
rpi433.sniffer(config.platforms.rpi['snif-pin'], config.platforms.rpi['debounce-delay']); //Snif on PIN 2 with a 500ms debounce delay 
rpi433.sendCode;

*/

/*


// Receive
rfSniffer.on('codes', function (code) {
  console.log('Code received: '+code);
});
 
// Send 
rfSend(1234, 0, function(error, stdout) {   //Send 1234 
  if(!error) console.log(stdout); //Should display 1234 
});

*/