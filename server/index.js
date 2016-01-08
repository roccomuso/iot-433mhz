// On Raspberry Pi make sure to execute with SUDO.
// On Windows platform make sure to have Visual Studio Express 2013 installed (https://github.com/voodootikigod/node-serialport)

var async = require('async');
var express = require('express');
var levelup = require('levelup');
var config = require('./config.json');

// Create or open the underlying LevelDB store
var db = levelup('./'+config.DB_FolderName, {valueEncoding: 'json'});

// Radio Frequency Class platform-independent
var rf433mhz;

// Starting Flow
async.series({
    ascii_logo: function(callback){
    	require('./components/ascii_logo.js')(function(logo){
    		console.log(logo);
    		callback(null, 1);
    	}); 
    },
    platform: function(callback){

        console.log('Debug Mode: '+ config.DEBUG);

    	require('./components/platform.js')(function(rf){
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
    server: function(callback){
    	// Starting HTTP Server, API, and Web Socket
    	var server = require('./components/server.js')(function(app){
    		  // Handling routes

			  app.route('/rfcode/:code')
			    .get(function(req, res) {
			    	if (typeof req.params.code !== 'undefined'){
			    		rf433mhz.send(req.params.code, function(err, out){
				    		if(err) console.log('Error:', err);  
				    		res.send(JSON.stringify({'status': 'ok'}));
				    	});
			      		
			      	}else
			      		res.send(JSON.stringify({'status': 'error'}));
			    })
			    .post(function(req, res) {
			      res.send('TODO...');
			    });

			  // serve as static all the other routes
			  app.get('*', express.static('www'));
			  // TODO page 404.

			}, function(io){ // Web Socket handler
    		      
                var socketFunctions = require('./components/socketFunctions.js')(io, rf433mhz, db);
                var dbFunctions = require('./components/dbFunctions.js')(db, config);

                io.on('connection', socketFunctions.onConnection);
            
                rf433mhz.on(function (codeData) {
                    var data = JSON.parse(codeData);
                    if (config.DEBUG) console.log('RFcode received: ', data);

                    if (data.status === 'received'){

                        // put in DB if doesn't exists yet
                        dbFunctions.putInDB(data, function(){

                            dbFunctions.isIgnored(data.code, function(isIgnored){
                                if (config.DEBUG) console.log('Ignore code '+data.code+': ', isIgnored);

                                if (!isIgnored)
                                    io.emit('newRFCode', data); // sent to every open socket.

                            });

                        });
                        
                    }
                
                });
 

    	});
    	
    	callback(null, 1);
    }
   
},
function(err, results) {
    // results is now equal to: {one: 1, two: 2}

    // console.log('Risultati: ', results);

});


// (Ctrl + C) - Handler
if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });

  rl.close(); // without it we have conflict with the Prompt Module.
}

process.on("SIGINT", function () {
	console.log('Closing...');
	if (typeof rf433mhz !== 'undefined'){ // Close Serial Port
		rf433mhz.close(function(err){
			if (err) console.log('Error: ', err);
			else console.log('Serial Port closed.');
			//graceful shutdown
  			process.exit();
		});
		
	}else process.exit();
  	
});