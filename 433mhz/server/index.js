// On Raspberry Pi make sure to execute with SUDO.
// On Windows platform make sure to have Visual Studio Express 2013 installed (https://github.com/voodootikigod/node-serialport)

var fs = require('fs');
var async = require('async');
var config = require('./config.json');

// Radio Frequency Class platform-independent
var rf433mhz;

// Starting Flow
async.series({
    ascii_logo: function(callback){
    	require('./ascii_logo.js')(function(logo){
    		console.log(logo);
    		callback(null, 1);
    	}); 
    },
    platform: function(callback){
    	require('./platform.js')(function(rf){
    		rf433mhz = rf; // platform independent class
    		callback(null, rf433mhz);
    	});
    	
    },
    init_rf: function(callback){
    	// Listen on Arduino Serial Port or RF433Mhz chip if on RPi platform.
    	rf433mhz.openSerialPort(function(){
    		
    		setTimeout(function (){
    			callback(null, 1);
    		}, 2000); // Arduino AutoReset requires to wait a few seconds before sending data!
    		
    	});
    	
    },
    rf_ready: function(){
    	// Serial port ready
    	rf433mhz.on(function (code) {
    		var data = JSON.parse(code);
			console.log('data received: ', data);
		});

    	
    	rf433mhz.send(5201, function(err, out){
    		if(err) console.log('Error:', err); 
    		//else console.log(out); //Should display 5201 

    	});

    },
    server: function(){
    	// Start the server interface
    	// TODO... server.. se arriva su POST il codice x, mandalo su RF...
    	
    	callback(null, 1);
    }
   
},
function(err, results) {
    // results is now equal to: {one: 1, two: 2}

    // console.log('Risultati: ', results);

});

