var config = require('./config.json');
var prompt = require('prompt');
// Import events module and create an eventEmitter object
var events = require('events');
var eventEmitter = new events.EventEmitter();

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
	    // TODO... dove salvare la porta scelta? emettere altro evento?
	    module_callback(ports[result.port-1].comName);
	    
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
					module_callback(require('rpi-433'));
					
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