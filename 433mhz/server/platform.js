var config = require('./config.json');
var prompt = require('prompt');
// Import events module and create an eventEmitter object
var events = require('events');
var eventEmitter = new events.EventEmitter();

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
	    // TODO... dove salvare la porta scelta? emettere altro evento?
	    
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
			var rpi433    = require('rpi-433');

			exports.rfSniffer = rpi433.sniffer(config.rpi['snif-pin'], config.rpi['debounce-delay']); //Snif on PIN 2 with a 500ms debounce delay 
			exports.rfSend    = rpi433.sendCode;
		}else{

		// we're on a standard linux
		console.log('Running on Linux platform');
		// TODO ...
		eventEmitter.emit('choose_port');

	}

	}

});
	break;
	default:
		console.log('Platform '+process.platform+' not supported');
	break;
}
