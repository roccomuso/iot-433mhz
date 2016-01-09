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

	// handle the new RFCode. Show a snackbar.
	socket.on('newRFCode', function(data){
		var _code = data.code;
		events.emit('renderSnackbar', _code);
	});

	socket.on('serverError', function(data){
		// notie.js alert
		// TODO

	});


