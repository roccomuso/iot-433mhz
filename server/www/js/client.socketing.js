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

	socket.on('newRFCode', function(data){
		// handle the new RFCode. Show a snackbar.
		var mex = '<span class="pull-left" style="padding-top: 11px">Code detected: '+data.code+'</span> <span class="pull-right"><a href="#" class="btn btn-info btn-xs" onclick="events.emit(\'ignoreCode\', '+data.code+');">Ignore</a><a href="#" class="btn btn-success btn-xs" onclick="events.emit(\'assignCode\', '+data.code+');">Assign</a></span>';
		$.snackbar({content: mex, timeout: 0, htmlAllowed: true}); // print snackbar
		// Click events handled in eventing.js

	});

	socket.on('serverError', function(data){
		// notie.js alert
		// TODO

	});

	// Using EventEmitter.js

	// ...



