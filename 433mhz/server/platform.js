var config = require('./config.json');
var prompt = require('prompt');
// Import events module and create an eventEmitter object
var events = require('events');
var eventEmitter = new events.EventEmitter();

var rf433mhz = function(board){

	var type;
	this.port = undefined;
	this.serial = undefined;
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


		}

	}
	_constructor();

	this.openSerialPort = function (onOpen){
	  if (type === 'arduino')	
		self.serial.open(function (error) {
		  if ( error ) {
		    console.log('failed to open: '+error);
		  } else {
		    if (config.DEBUG) console.log('Serial port opened');
			    onOpen();
		  }
		});

	}

	this.on = function(callback){
		if (type === 'rpi'){ // rpi
			// TODO require('433mhz')
			board.on('codes', callback);
		}else{ // arduino through serial
			// data (RF code) received through serial
			self.serial.on('data', callback);
		
		}
	
	};

	this.send = function(code, callback){
		
		if (type === 'rpi'){ // rpi
			// TODO require('433mhz')
			board.send(code, callback);
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