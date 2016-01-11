	// set up your socket

	var socket = io.connect('http://' + location.host, {
		'reconnect': true,
		'reconnection delay': 50,
		'max reconnection attempts': 300
	});

	socket.on('connect', function(){
		notie.alert(1, '<i class="fa fa-desktop"></i> Connected to the server!', 3);
	});

	socket.on('connect_error', function(){
		console.log('WebSocket Connection error...');
	});

	socket.on('disconnect', function(){
		notie.alert(3, '<i class="fa fa-plug"></i> Disconnected. Trying to reconnect... <i class="fa fa-refresh fa-spin"></i>', 0);
	})

	// receiving initData, initialize the UI
	socket.on('initData', function(initData){
		events.emit('renderInitCards', initData);
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


