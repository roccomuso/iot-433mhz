var config = require('./config.json');

function print_ports(){
	var serialPort = require("serialport");
	serialPort.list(function (err, ports) {
		ports.forEach(function(port) {
			    console.log(port.comName);
			    console.log(port.pnpId);
			    console.log(port.manufacturer);
			  });
	});
}

switch(process.platform){
	case "win32":
		// Under windows
		console.log("Running on Windows platform");
		print_ports();
	break;
	case "darwin":
		// Uder MAC OS X
		console.log("Running on MAC OS X platform");
		print_ports();

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
		print_ports();

	}

	}

});
	break;
	default:
		console.log('Platform '+process.platform+' not supported');
	break;
}
