	// set up your socket

	var socket = io.connect('http://' + location.host, {
		'reconnect': true,
		'reconnection delay': 50,
		'max reconnection attempts': 300
	});

	// receiving data
	socket.on('news', function(data){
		document.getElementById('_data').innerHTML += JSON.stringify(data)+'<br/>';
	});

	// send data over the socket
	socket.emit('example', {'hello': 'my name is roc'});
