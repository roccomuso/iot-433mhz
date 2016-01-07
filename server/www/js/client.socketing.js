	// set up your socket

	var socket = io.connect('http://' + location.host, {
		'reconnect': true,
		'reconnection delay': 50,
		'max reconnection attempts': 300
	});

	socket.on('connect', function(){
		console.log('Connected to the socket.io server');

	});

	// receiving initData, initialize the UI
	socket.on('initData', function(initData){
		// TODO
		document.getElementById('_data').innerHTML += JSON.stringify(initData)+'<br/>';
	});

	var incoming_codes = []; // RF codes with an opened snackbar
	socket.on('newRFCode', function(data){
		// handle the new RFCode. Show a snackbar.
		var _code = data.code;
		if (incoming_codes.indexOf(_code) < 0){ // don't repeat the same RFcode
			incoming_codes.push(_code);
			var mex = '<span class="pull-left" style="padding-top: 11px">Code detected: '+_code+'</span>'+
			'<span class="pull-right"><a href="#" class="btn btn-info btn-xs" onclick="events.emit(\'ignoreCode\', '+_code+');">Ignore</a>'+
			'<a href="#" class="btn btn-success btn-xs" onclick="events.emit(\'assignCode\', '+_code+');">Assign</a></span>';
			$.snackbar({
				content: mex,
			 	timeout: 0,
			 	htmlAllowed: true,
			 	onClose: function(){ // when snackbar is closed
			 		incoming_codes.splice(incoming_codes.indexOf(_code), 1);
				}}); // print snackbar
			// Click events handled in eventing.js
		}

	});

	socket.on('serverError', function(data){
		// notie.js alert
		// TODO

	});

	// Using EventEmitter.js

	// ...



