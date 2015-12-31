	// set up your socket

	var socket = io.connect('http://' + location.host, {
		'reconnect': true,
		'reconnection delay': 50,
		'max reconnection attempts': 300
	});

	socket.on('connect', function(){
		console.log('Connected to the socket.io server');
	});

	// receiving data
	socket.on('initData', function(initData){
		document.getElementById('_data').innerHTML += JSON.stringify(initData)+'<br/>';
	});

	socket.on('news', function(data){
		document.getElementById('_data').innerHTML += JSON.stringify(data)+'<br/>';
	});

	// send data over the socket
	socket.emit('example', {'hello': 'my name is roc'});
