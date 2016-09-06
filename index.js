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
var argv = require('./components/arguments-handler.js');

if (typeof argv.debug !== 'undefined') config.debug = argv.debug; // if defined use CLI debug (NB. current choice is not stored inside the config.json file, so other scripts that are including the file from the disk and are not using this variable istance may not retrieve the right DEBUG choice from the User)
var debug = require('./components/debug.js')();

// Create or open the underlying DB store
var Datastore = require('./EventedDatastore.js'); // nedb doesn't provide listener on DB events by default
var db = {};

var dbFunctions, notification, webHooks;

// Radio Frequency Class platform-independent
var rf433mhz;

// Starting Flow
async.series({
        init_db: function(callback){
            debug('calling init_db');
            // load/create DB
            db.RFCODES = new Datastore({
                filename: path.resolve(__dirname, './DB/rfcodes.db'),
                autoload: true
            });
            db.CARDS = new Datastore({
                filename: path.resolve(__dirname, './DB/cards.db'),
                autoload: true
            });
            db.SETTINGS = new Datastore({
                filename: path.resolve(__dirname, './DB/settings.db'),
                autoload: true
            });

            // Compact DB at regular intervals (see nedb: #Persistence)
            if (config.db_compact_interval > 0){
                db.RFCODES.persistence.setAutocompactionInterval(config.db_compact_interval * 60000 * 60);
                db.CARDS.persistence.setAutocompactionInterval(config.db_compact_interval * 60000 * 60);
                db.SETTINGS.persistence.setAutocompactionInterval(config.db_compact_interval * 60000 * 60);
            }

            dbFunctions = require('./components/dbFunctions.js')(db, config);
            callback(null, 1);
        },
        ascii_logo: function(callback) {
            debug('printing ascii_logo');
            require('./components/ascii_logo.js')(function(logo) {
                console.log(chalk.magenta(logo)); // print blue ascii logo
                callback(null, 1);
            });
        },
        init_webhooks: function(callback){
            debug('calling init_webhooks');
            // Initialize WebHooks module.
            var WebHooks = require('node-webhooks');
            webHooks = new WebHooks({
                db: path.resolve(__dirname, './DB/webHooksDB.json') // json file that store webhook URLs
            });
            notification = require('./components/notification.js')(dbFunctions, webHooks);
            callback(null, 1);
        },
        platform: function(callback) {
            debug('platform configuration');
            require('./components/platform.js')(argv, function(rf) {
                rf433mhz = rf; // platform independent class
                callback(null, rf433mhz);
            });

        },
        load_db: function(callback) {
            // Put default demo cards if CARDS DB is empty
            dbFunctions.initDBCards(require('./components/demo_cards.json')).then(dbFunctions.initDBSettings).then(function(settings) {
                callback(null, 1);
            }).catch(function(err) {
                console.log('load_db error:', err);
                console.log(err.stack);
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
            require('./components/server.js')(argv, function(server) {
                // Handling routes and Web Socket Handler.
                var http = server.http;
                var io = server.io;

                require('./components/api.js')(http, io, rf433mhz, dbFunctions, webHooks);

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

                    debug('RFcode received: ', codeData);

                    if (codeData.status === 'received') {
                        // put in DB if doesn't exists yet
                        dbFunctions.putCodeInDB(codeData).then(function(mex) {
                            debug(mex);

                            dbFunctions.isCodeAvailable(codeData.code).then(function(result) { // a code is available if not ignored and not assigned.
                                debug('code available: '+result.isAvailable+' assigned to: '+result.assignedTo);

                                if (result.isAvailable)
                                    io.emit('newRFCode', codeData); // sent to every open socket.
                                else{
                                    // code not available, check if the code is assigned to an alarm card

                                    var card_shortname = result.assignedTo;
                                    dbFunctions.alarmTriggered(card_shortname, 'alarm').then(function(card){
                                            if (card){
                                               io.emit('uiTriggerAlarm', card);
                                               // if Alarm is armed send email or other kind of notification (Telegram mex).
                                               if (card.device.armed){
                                                    notification.alarmAdviseAll(card);
                                                }

                                            }
                                    }, function(err){ console.error(err);});

                                }
                                // another WebHook call type (code detected)
                                notification.webHookCodeDetected(codeData);
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

        // debug('Results: ', results);

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
