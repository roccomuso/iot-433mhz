var prompt = require('prompt');
var fs = require('fs');
var chalk = require('chalk');
var config = require('../config.json');
var debug = require('./debug.js')();
// Import events module and create an eventEmitter object
var events = require('events');
var eventEmitter = new events.EventEmitter();

var rf433mhz = function(board){

	var type;
	// serialport module
	var serial; // require('serialport');
	// rpi-433 module
	var rpi433; // require('rpi-433');
	var rfSniffer, rfSend;


	function _constructor(){
		if (typeof board === 'undefined') throw new Error('No parameter passed to rf433mhz class');

		type = (board.platform == 'rpi' && !config.platforms.rpi['use-external-arduino']) ? 'rpi' : 'arduino';
		if (type === 'arduino'){
			var SerialPort = (process.env.NODE_ENV === 'development') ? require('virtual-serialport'): require('serialport');
			serial = new SerialPort(board.port, {
  				parser: SerialPort.parsers.readline('\n'),
  				baudRate: config.arduino_baudrate,
					autoOpen: false // autoOpen flag set to false, manually need to open the port
			});

		}else{
			// rpi
			rpi433 = require('rpi-433');

		}

	}
	_constructor();

	this.openSerialPort = function (onOpen){
	  if (type === 'arduino') // arduino
		serial.open(function (error) {
		  if ( error ) {
		    debug('failed to open: '+error);
		    throw error;
		  } else {
		     debug('Serial port opened');
	             onOpen();
		  }
		});
	  else{ // rpi
	  	// initialize rpi-433 module
	  	rfSniffer = rpi433.sniffer(config.platforms.rpi['sniff-pin'], config.platforms.rpi['debounce-delay']); //Snif on PIN 2 with a 500ms debounce delay
    	rfSend    = rpi433.sendCode;
	  }
	};

	this.on = function(callback){ // Receiving RF Code
			if (type === 'rpi'){ // rpi
				rfSniffer.on('codes', function(data){
					// TODO - need to analyzie and parse data
					// callback(...); // gotta return JSON data
				});
			}else{ // arduino through serial
				serial.on('data', function(data){
					try{
						callback(JSON.parse(data)); // returning JSON parsed
					}catch(e){
						debug('Error parsing this JSON: ', data);
					}
				});
			}

	};

	this.send = function(code, callback){

		if (type === 'rpi'){ // rpi
			// WATCH OUT code CASTING, it has to be a number type. Just check on RPi.
			rfSend(code, config.platforms.rpi['transmitter-pin'], callback);
		}else{ // arduino through serial
			if (serial.isOpen()){
				serial.write(String(code), callback);
			}else{
				debug('SerialPort not open!');
			}
		}
	};

	this.isSerialOpen = function(){
		if (type==='arduino'){
			return serial.isOpen();
		}
	};

	this.close = function(callback){
		if (type==='arduino'){
			serial.close(callback); // release the Serial Port
		}else{
			// Do nothing, no need to handle that on RPi
		}
	};

};

module.exports = function(argv, module_callback){

	function choose_port(whatToUse){
		var serialPort = require('serialport');
		serialPort.list(function (err, ports) {
			if (process.env.NODE_ENV === 'development') ports.push({comName: '/dev/ttyVIRTUAL'});
			if (ports.length === 0) { debug('No ports available'); return;}

			console.log('Selectable serial ports:');
			var k = 1;
			ports.forEach(function(port) {
				console.log('('+k+') '+port.comName); k++;
			    //console.log(port);
			});


			if (argv.serialport || process.env.SERIAL_PORT){
				// return choosen port
				var port = argv.serialport ? argv.serialport.trim(): process.env.SERIAL_PORT.trim();
				var classe = new rf433mhz({platform: whatToUse, port: port});
		   		module_callback(classe);
			}else{
				prompt.start();
				prompt.get({properties: {port: {required: true, type: 'number', conform: function(value){
					if (value > 0 && value <= ports.length) return true;
					else return false;
				}}}}, function (err, result) {
					if (err) return console.error(err);
		    		// choices:
		    		console.log('Choosen port:', ports[result.port-1].comName);
		    		// return choosen port
		    		var classe = new rf433mhz({platform: whatToUse, port: ports[result.port-1].comName});

		   			 module_callback(classe);

				});

			}

		});

	}

	eventEmitter.on('choose_port', choose_port);

	function print_colored_text(text){
		console.log(chalk.bgCyan(text));
	}

	switch(process.platform){
		case 'win32':
			// Under windows
			print_colored_text('Running on Windows platform');
			eventEmitter.emit('choose_port', 'arduino');
		break;
		case 'darwin':
			// Uder MAC OS X
			print_colored_text('Running on MAC OS X platform');
			eventEmitter.emit('choose_port', 'arduino');
		break;
		case 'linux':
			// Under Linux
			fs.readFile('/etc/os-release', 'utf-8', function(err, data){
			if (err){
				// File doesn't exists
				return console.log(err);
			}else{
				// Running on Linux system
				if (data.indexOf('ID=raspbian') >= 0){
					print_colored_text('Running on RPi platform');
					console.log('Using external Arduino: ',config.platforms.rpi['use-external-arduino']);
					// Running on RPi
					// Only on RPi will successfully works.
					eventEmitter.emit('choose_port', 'rpi');

				}else{

				// we're on a standard linux
				print_colored_text('Running on Linux platform');
				eventEmitter.emit('choose_port', 'arduino');

				}

			}

			});
		break;
		default:
			print_colored_text('Platform '+process.platform+' not supported');
		break;
	}

};
