#!/usr/bin/env node

/*
 * On Raspberry Pi make sure to execute with SUDO.
 * On Windows platform make sure to have Visual Studio Express 2013 installed (https://github.com/voodootikigod/node-serialport)
 */

var async = require('async');
var chalk = require('chalk');
var fs = require('fs');
var path = require('path');
var config = require('./config.json');

// Create or open the underlying DB store
var Datastore = require('./EventedDatastore.js'); // nedb doesn't provide listener on DB events by default
var db = {};
db.RFCODES = new Datastore({
    filename: 'DB/rfcodes.db',
    autoload: true
});
db.CARDS = new Datastore({
    filename: 'DB/cards.db',
    autoload: true
});

// Compact DB at regular intervals (see nedb: #Persistence)
if (config.db_compact_interval > 0){
    db.RFCODES.persistence.setAutocompactionInterval(config.db_compact_interval * 60000 * 60);
    db.CARDS.persistence.setAutocompactionInterval(config.db_compact_interval * 60000 * 60);
}

var dbFunctions = require('./components/dbFunctions.js')(db, config);

// Radio Frequency Class platform-independent
var rf433mhz;

// Starting Flow
async.series({
        ascii_logo: function(callback) {
            require('./components/ascii_logo.js')(function(logo) {
                console.log(chalk.magenta(logo)); // print blue ascii logo
                callback(null, 1);
            });
        },
        platform: function(callback) {

            console.log(chalk.bgYellow('Debug Mode:', config.DEBUG));

            require('./components/platform.js')(function(rf) {
                rf433mhz = rf; // platform independent class
                callback(null, rf433mhz);
            });

        },
        init_db: function(callback) {
            // Put default demo cards if CARDS DB is empty
            dbFunctions.initDBCards(require('./components/demo_cards.json')).then(function() {
                callback(null, 1);
            }).catch(function(err) {
                console.log('init_db error:', err);
            });

        },
        init_rf: function(callback) {
            // Listen on Arduino Serial Port or RF433Mhz chip if on RPi platform.
            rf433mhz.openSerialPort(function() {
                setTimeout(function() {
                    callback(null, 1);
                }, 2000); // Arduino AutoReset requires to wait a few seconds before sending data!
            });

        },
        server: function(callback) {
            // Starting HTTP Server, API, and Web Socket
            require('./components/server.js')(function(server) {
                // Handling routes and Web Socket Handler.
                var http = server.http;
                var io = server.io;

                require('./components/api.js')(http, io, rf433mhz, dbFunctions);
                
                // Web Socket handler
                require('console-mirroring')(io); // Console mirroring

                var socketFunctions = require('./components/socketFunctions.js')(io, rf433mhz, dbFunctions);

                /* LISTENERS */
                io.on('connection', socketFunctions.onConnection);

                db.CARDS.on('inserted', function(card) { // card just inserted
                    // refresh every client UI
                    socketFunctions.asyncEmitInitCards();

                });

                db.CARDS.on('removed', function(card) { // a card was removed
                    // remove from DB codes attached to this card:
                    var codes_to_remove = {};
                    if (card.type === 'switch') codes_to_remove = {
                        $or: [{
                            code: card.device.on_code
                        }, {
                            code: card.device.off_code
                        }]
                    };
                    else if (card.type === 'alarm') codes_to_remove = {
                        code: card.device.trigger_code
                    };
                    else codes_to_remove = undefined;

                    if (codes_to_remove) {
                        // delete codes.
                        db.RFCODES.remove(codes_to_remove, {
                            multi: true
                        }, function(err, numRemoved) {
                            if (err) console.log(err);
                            console.log(numRemoved + ' code/s deleted.');
                        });
                    }

                    // delete img file
                    if (card.img) fs.unlink(path.resolve('./www/', card.img), function(err){ if (err) console.error('DeleteFile: file not found', err.path); });

                    console.log('Card ' + card.shortname + ' deleted.');
                    // refresh every client UI
                    socketFunctions.asyncEmitInitCards();

                });

                rf433mhz.on(function(codeData) {

                    if (config.DEBUG) console.log('RFcode received: ', codeData);

                    if (codeData.status === 'received') {
                        // put in DB if doesn't exists yet
                        dbFunctions.putCodeInDB(codeData).then(function(mex) {
                            if (config.DEBUG) console.log(mex);

                            dbFunctions.isCodeAvailable(codeData.code).then(function(result) { // a code is available if not ignored and not assigned.
                                if (config.DEBUG) console.log('code available: '+result.isAvailable+' assigned to: '+result.assignedTo);

                                if (result.isAvailable)
                                    io.emit('newRFCode', codeData); // sent to every open socket.
                                else{
                                    // code not available, check if the code is assigned to an alarm card
                                    
                                    var card_shortname = result.assignedTo;
                                    dbFunctions.alarmTriggered(card_shortname, 'alarm').then(function(card){
                                            if (card){
                                               io.emit('uiTriggerAlarm', card);
                                               // TODO: send email or other kind of notification (Telegram mex) if Armed.
                                               // if (card.device.armed) ...
                                               // WebHook call (alarm triggered)

                                            }
                                    }, function(err){ console.error(err);});

                                }
                                // TODO: WebHook call (code detected)
                                
                            }).catch(function(err) {
                                console.error(err);
                            });

                        }, function(err) {
                            console.error(err);
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

    rl.on('SIGINT', function() {
        process.emit('SIGINT');
    });

    rl.close(); // without it we have conflict with the Prompt Module.
}

process.on('SIGINT', function() {
    console.log('Closing...');
    if (typeof rf433mhz !== 'undefined') { // Close Serial Port
        rf433mhz.close(function(err) {
            if (err) console.error('Error: ', err);
            else console.log('Serial Port closed.');
            //graceful shutdown
            process.exit();
        });

    } else process.exit();

});

// Unix Line Ending