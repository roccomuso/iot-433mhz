// On Raspberry Pi make sure to execute with SUDO.
// On Windows platform make sure to have Visual Studio Express 2013 installed (https://github.com/voodootikigod/node-serialport)

var async = require('async');
var chalk = require('chalk');
var config = require('./config.json');

// Create or open the underlying DB store
var Datastore = require('./EventedDatastore.js'); // improvement not yet PR into ndb repo, that provides events. - it require('nedb');
var db = {};
db.RFCODES = new Datastore({filename: 'DB/rfcodes.db', autoload: true});
db.CARDS = new Datastore({filename: 'DB/cards.db', autoload: true});

var dbFunctions = require('./components/dbFunctions.js')(db, config);

// Radio Frequency Class platform-independent
var rf433mhz;

// Starting Flow
async.series({
    ascii_logo: function(callback){
    	require('./components/ascii_logo.js')(function(logo){
    		console.log(chalk.magenta(logo)); // print blue ascii logo
    		callback(null, 1);
    	}); 
    },
    platform: function(callback){

        console.log(chalk.bgYellow('Debug Mode:', config.DEBUG));

    	require('./components/platform.js')(function(rf){
    		rf433mhz = rf; // platform independent class
    		callback(null, rf433mhz);
    	});
    	
    },
    init_db: function(callback){
         // init DB - TODO: inseriamo le cards di default se non ne esistono già altre nel DB.
         // dbFunctions.initDBCards()... <-- TODO



         callback(null, 1);
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
    	require('./components/server.js')(function(app){
    		  // Handling routes

              require('./components/api.js')(app, rf433mhz, dbFunctions);

			}, function(io){ // Web Socket handler
    		      
                
                var socketFunctions = require('./components/socketFunctions.js')(io, rf433mhz, dbFunctions);

                /* LISTENERS */
                io.on('connection', socketFunctions.onConnection);

                db.CARDS.on('inserted', function(card){ // card just inserted
                    // refresh every client UI
                    io.emit('initCards', dbFunctions.getInitCards());
                });

                db.CARDS.on('removed', function(card){ // card removed
                    // TODO remove from DB codes attached to this card:
                    // ...

                    // refresh every client UI
                    io.emit('initCards', dbFunctions.getInitCards());
                });
            
                rf433mhz.on(function (codeData) {
                    
                    if (config.DEBUG) console.log('RFcode received: ', codeData);

                    if (codeData.status === 'received'){
                        // put in DB if doesn't exists yet
                        dbFunctions.putCodeInDB(codeData).then(function(mex){
                            if (config.DEBUG) console.log(mex);

                            dbFunctions.isCodeAvailable(codeData.code).then(function(isAvailable){ // code available if not ignored and not assigned.
                                if (config.DEBUG) console.log(codeData.code, 'isAvailable:', isAvailable);

                                if (isAvailable)
                                    io.emit('newRFCode', codeData); // sent to every open socket.

                            }).catch(function(err){
                                console.log(err);
                            });

                        }, function(err){
                            console.log(err);
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
if (process.platform === 'win32') {
  var rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', function () {
    process.emit('SIGINT');
  });

  rl.close(); // without it we have conflict with the Prompt Module.
}

process.on('SIGINT', function () {
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