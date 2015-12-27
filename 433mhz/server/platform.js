var config = require('./config.json');
var prompt = require('prompt');
// Import events module and create an eventEmitter object
var events = require('events');
var eventEmitter = new events.EventEmitter();

var rf433mhz = function(board){

	var type;
	// serialport module
	this.port = undefined;
	this.serial = undefined; // require('serialport');
	// rpi-433 module
	this.rpi433 = undefined; // require('rpi-433');
	this.rfSniffer = undefined;
	this.rfSend = undefined;

	var self = this;

	function _constructor(){
		if (typeof board === 'undefined') throw new Error('No parameter passed to rf433mhz class');

		type = (board.platform == 'rpi') ? 'rpi' : 'arduino';
		if (type === 'arduino'){
			self.port = board.port;
			var serialport = require('serialport');
			var SerialPort = serialport.SerialPort; // localize object constructor

			self.serial = new SerialPort(board.port, {
  				parser: serialport.parsers.readline("\n"),
  				baudRate: config.arduino_baudrate
			}, false); // openImmediately flag set to false

		}else{
			// rpi
			self.rpi433 = require('rpi-433');
    		
		}

	}
	_constructor();

	this.openSerialPort = function (onOpen){
	  if (type === 'arduino') // arduino
		self.serial.open(function (error) {
		  if ( error ) {
		    console.log('failed to open: '+error);
		  } else {
		    if (config.DEBUG) console.log('Serial port opened');
			    onOpen();
		  }
		});
	  else{ // rpi
	  	// initialize rpi-433 module
	  	self.rfSniffer = rpi433.sniffer(config.platforms.rpi['sniff-pin'], config.platforms.rpi['debounce-delay']), //Snif on PIN 2 with a 500ms debounce delay 
    	self.rfSend    = rpi433.sendCode;
	  }
	}

	this.on = function(callback){ // Receiving RF Code
		if (type === 'rpi'){ // rpi
			self.rfSniffer.on('codes', callback);
		}else{ // arduino through serial
			self.serial.on('data', callback);
		}
	
	};

	this.send = function(code, callback){
		
		if (type === 'rpi'){ // rpi
			self.rfSend(code, config.platforms.rpi['transmitter-pin'], callback);
		}else{ // arduino through serial
			if (self.serial.isOpen()){
				self.serial.write(String(code), callback);
			}else{
				console.log('SerialPort not open!');
			}
		}
	};

	this.isSerialOpen = function(){
		if (type==='arduino'){
			return self.serial.isOpen();
		}
	}

}

module.exports = function(module_callback){

	function choose_port(){
		var serialPort = require("serialport");
		serialPort.list(function (err, ports) {
			if (ports.length === 0) { console.log('No ports available'); return;}

			console.log('Choose a port:');
			var k = 1;
			ports.forEach(function(port) {
				console.log('('+k+') '+port.comName); k++;
			    //console.log(port);
			});

			prompt.start();

			prompt.get({properties: {port: {required: true, type: "number", conform: function(value){
				if (value > 0 && value <= ports.length) return true;
				else return false;
			}}}}, function (err, result) {
	    // choices:
	    console.log('Choosen port:', ports[result.port-1].comName);
	    // return choosen port
	    var classe = new rf433mhz({platform: 'arduino', port: ports[result.port-1].comName});

	    module_callback(classe);
	    
	});

		});

	}

	eventEmitter.on('choose_port', choose_port);

	switch(process.platform){
		case "win32":
			// Under windows
			console.log("Running on Windows platform");
			eventEmitter.emit('choose_port');
		break;
		case "darwin":
			// Uder MAC OS X
			console.log("Running on MAC OS X platform");
			eventEmitter.emit('choose_port');
		break;
		case "linux":
			// Under Linux
			fs.readFile('/etc/os-release', 'utf-8', function(err, data){
			if (err){
				// File doesn't exists
				return console.log(err);
			}else{
				// Running on Linux system
				if (data.indexOf('ID=raspbian') >= 0){
					console.log("Running on RPi platform");
					// Running on RPi
					// Only on RPi will successfully works.
					module_callback(new rf433mhz({platform: 'rpi'}));
					
				}else{

				// we're on a standard linux
				console.log('Running on Linux platform');
				eventEmitter.emit('choose_port');

				}

			}

			});
		break;
		default:
		console.log('Platform '+process.platform+' not supported');
		break;
	}

}