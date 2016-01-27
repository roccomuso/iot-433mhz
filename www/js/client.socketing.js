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

	// receiving initCards, initialize the UI
	socket.on('initCards', function(initData){
		events.emit('renderInitCards', initData);
	});

	// handle the new RFCode. Show a snackbar.
	socket.on('newRFCode', function(data){
		var _code = data.code;
		events.emit('renderSnackbar', _code);
	});

	// Randomize Cards, new shake detected on a mobile device
	socket.on('randomizeCards', function(){
		$('#cards_container').mixItUp('sort', 'random', true);
	});

	// commute the button on the UI.
	socket.on('uiSwitchToggle', function(data){
		$('#switch-'+data.card_id).prop('checked', data.set);
		if (data.sound) ion.sound.play('switch-toggle'); // sound notification
	});

	// trigger Alarm
	socket.on('uiTriggerAlarm', function(card){

		var $siren = $('div[alarm-id='+card._id+']');
		if (!$siren.hasClass('siren-animated')){ // avoid multiple execution at the same time
			$siren.toggleClass('siren-animated');
			if (card.device.notification_sound) ion.sound.play('siren-sound');
			// format last_alert timestamp
			$siren.parent().find('.last_alert').html(moment(card.device.last_alert, 'X').format('D MMM YYYY, H:mm:ss'));

			var secs = 30;
			$siren.html('<span class="label label-danger" style="position:relative; top: 105px; left: 43px;">30</span>');
			var $label = $siren.children('span');
			var timer = setInterval(function(){
				$label.html(--secs);
			}, 1000);
			setTimeout(function(){
				clearInterval(timer);
				$siren.html('');
				$siren.toggleClass('siren-animated');
			}, 30 * 1000); // siren spins for 30 seconds.
		}

	});

	socket.on('serverError', function(data){
		// notie.js alert
		// TODO

	});


