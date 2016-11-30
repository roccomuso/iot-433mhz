/**
 * Event Handling
*/

events.on('refresh', function(){
  // refresh the page
  window.location.reload();
});

events.on('shakeOccurred', function(){
	// request to reorder cards due to accelerometer shake.
    socket.emit('shakeOccurred');
});

events.on('ignoreCode', function(code){
	// send ignore's command to the Server
	socket.emit('ignoreCode', code); // NB. socket defined below eventing.js
	RFcodes.deleteCode(code); // remove code from the incoming_codes.
  ga('send', 'event', 'Core', 'ignore', 'Ignore code');
});

events.on('removeIgnoreCode', function(code){
	// tells the server to switch the 'isIgnored' flag to false.
	socket.emit('removeIgnoreCode', code);
});

events.on('assignCode', function(code){
  var view = {title: 'Assign code', code: code};
  templating.renderTemplate('assignCode.mustache', $('#main_modal_box'), view).then(function(){
  	$('#assign-dialog').modal('show');
    ga('send', 'event', 'UI', 'assign', 'code assignment');
  }).catch(function(err){ // err
  	notie.alert(2, err, 0);
  });
});


events.on('newCardClick', function(code){
	var view = {title: 'New Card'};
	templating.renderTemplate('newCardForm.mustache', $('#main_modal_box'), view).then(function(){
		$('#new-card-dialog').modal('show');
		// all lower case, no blank space or non alpha numeric chars are admitted for this 2 fields
		$('#roomname').keyup(function(){
		    this.value = this.value.replace(/\W+/g, ' ');
    		this.value = this.value.replace(/\s+/g, '-').toLowerCase();
		});
    $('#headline').keyup(function(){ // shortname = headline, see enhancement #21
        var _shortname = this.value.replace(/\W+/g, ' ');
        _shortname = _shortname.replace(/\s+/g, '-').toLowerCase();
        $('#shortname').val(_shortname);
    });
		// color picker
		var background_color = '#FAFAFA';
		$('.pick_colors .btn-fab').click(function(){
		background_color = rgb2hex($(this).css('background-color'));
		console.log('Card BG color selected:', background_color);
		$('.btn-fab .fa-check').remove();
		$(this).html('<i class="fa fa-check" style="margin-top: 15px; color: #000"></i>');

		});
		// dynamic form adapter
		$('#type').change(function() {
		    var str = '<label for="code" class="col-md-2 control-label">RF Codes</label>';
		    $('#type option:selected').each(function() {
		    	var selected = $(this).val();
		      if(selected === 'switch'){
		      	str += '<div class="col-md-5"><select id="code" name="on_code" class="form-control codes" required>'+RFcodes.getCodesInHTML()+'</select><span class="help-block">ON Code</span></div><div class="col-md-5"><select id="off_code" name="off_code" class="form-control codes" required>'+RFcodes.getCodesInHTML()+'</select><span class="help-block">OFF Code</span></div>';
		      }else if(selected === 'alarm'){
		      	str += '<div class="col-md-5"><select id="code" name="trigger_code" class="form-control codes" required>'+RFcodes.getCodesInHTML()+'</select><span class="help-block">Trigger Code</span></div>';
		      }else if (selected === 'info'){ // we don't need to have codes
		      	str = '';
		      }
		    });
		    $('#type_related_content').html(str);
		  }).change();
		// modal box incoming codes listener (to updated select box lists)
		function updateSelectBoxes(code){
			$('.codes').html(RFcodes.getCodesInHTML()).fadeIn(500);
		}
		RFcodes.on('newCode', updateSelectBoxes); // set listener
		RFcodes.on('removedCode', updateSelectBoxes); // set listener

		// remove listeners when modal gets closed
		$('#new-card-dialog').on('hidden.bs.modal', function (e) {
		  RFcodes.off('newCode', updateSelectBoxes);
		  RFcodes.off('removedCode', updateSelectBoxes);
		  $('.modal-backdrop').remove(); // force backdrop removal
		  console.log('modal box closed');
		  RFcodes.deleteCode(code);
		});
		// form submitting listener
		var $cardForm = $('#newCardForm');
		$cardForm.submit(function(e){
			e.preventDefault();
			// Ajax POST to /api/cards/new
			var form = new FormData();

			form.append('headline', $('input[name=headline]').val());
			form.append('shortname', $('input[name=shortname]').val());
			form.append('card_body', $('#description').val());
			form.append('room', $('input[name=room]').val());
			form.append('background_color', background_color);
			var $type_selected = $('#type option:selected').val();
			form.append('type', $type_selected);

			if ($type_selected == 'switch'){
				form.append('on_code', $('#code option:selected').val());
				form.append('off_code', $('#off_code option:selected').val());
			}else if ($type_selected == 'alarm')
				form.append('trigger_code', $('#code option:selected').val());

			form.append('card_img', $('input[name=card_img]').prop('files')[0]);

			var settings = {
			  'async': true,
			  'crossDomain': true,
			  'url': '/api/cards/new',
			  'method': 'POST',
			  'headers': {
			    'cache-control': 'no-cache'
			  },
			  'processData': false,
			  'contentType': false,
			  'mimeType': 'multipart/form-data',
			  'data': form
			};

			$.ajax(settings).done(function (data) {
				console.log('Data Loaded:', data);
			    notie.alert(1, '<i class="fa fa-paper-plane"></i> Card sent!', 3);
			    RFcodes.deleteCodes([$('#code option:selected').val(), $('#off_code option:selected').val()]); // remove codes from the incoming codes. (in this way it can't be used anymore)
			    $('#new-card-dialog').modal('hide');
          ga('send', 'event', 'Core', 'card', 'new card');
			}).fail(function(error){
				notie.alert(2, JSON.parse(error.responseText).err, 0);
				console.log('Ajax error', error);
			});

		});

	}).catch(function(err){ // err
		notie.alert(2, err, 0);
	});
});


events.on('renderSnackbar', function(_code){
	ion.sound.play('water_droplet_3');
	if (!RFcodes.incoming_codes.hasOwnProperty(_code)){ // code first time detected
		badge++; favicon.badge(badge); // render favicon badge
		RFcodes.putCode(_code, {badge_count: 1}); // put the code in incoming_codes but using a method (in this way we can implement event handling)
		var mex = '<span class="pull-left" style="padding-top: 11px"><span class="badge">'+RFcodes.incoming_codes[_code].badge_count+'</span> Code detected: '+_code+'</span>'+
		'<span class="pull-right"><a href="#" class="btn btn-info btn-xs" onclick="events.emit(\'ignoreCode\', '+_code+');">Ignore</a>'+
		'<a href="#" class="btn btn-success btn-xs" onclick="events.emit(\'assignCode\', '+_code+');">Assign</a></span>';
		RFcodes.incoming_codes[_code].elem = $.snackbar({
			content: mex,
		 	timeout: 0,
		 	htmlAllowed: true,
		 	onClose: function(){ // when snackbar is closed
		 		badge--; favicon.badge(badge); // render favicon badge
			}}); // print snackbar

	}else{ // RFcode already exists and snackbar too, just increment badge_count field
		if (!RFcodes.incoming_codes[_code].elem.hasClass('snackbar-opened')) // snackbar was dismissed, show it again
			RFcodes.incoming_codes[_code].elem.snackbar('show');
		RFcodes.incoming_codes[_code].badge_count++;
		RFcodes.incoming_codes[_code].elem.find('.badge').fadeOut(500, function() {
        	$(this).html(RFcodes.incoming_codes[_code].badge_count).fadeIn(500);
    	});
	}
});

events.on('renderInitCards', function(initData){

	console.log('initData received: ', initData);

	var rooms = [];
	initData.forEach(function(card){
	  rooms.push(card.room);
	});
	// clean rooms from duplicates
	rooms = distinctElementsArray(rooms);

	// pre-process initData to be rendered
	var dataReady = (JSON.parse(JSON.stringify(initData))); // cloning Object
	for (var i = 0; i < initData.length; i++){
		if(initData[i].device.hasOwnProperty('last_alert') && initData[i].device.last_alert){
			dataReady[i].device.last_alert = moment(dataReady[i].device.last_alert, 'X').format('D MMM YYYY, H:mm:ss');
		}
	}

	var view = {CARDS: dataReady, rooms: rooms, accelerometer: templating.hasAccelerometer};
	templating.renderTemplate('cards.mustache', $('#mainBody'), view).then(function(){
		ion.sound.play('button_tiny'); // sound notification
		// NB. on dynamic refresh always recall these lines below
		$.material.init();
		if($('#cards_container').mixItUp('isLoaded')){ // if already loaded
			$('#cards_container').mixItUp('destroy');
			$('#cards_container').mixItUp({animation:{ animateResizeContainer: false}});
		}else
			$('#cards_container').mixItUp({animation:{ animateResizeContainer: false}});

		// for 'switch' type only
		$('.onoffswitch-label').click(function(e) {
		  e.preventDefault();
		  var _cardId = $(this).parent().attr('switch-id');
		  socket.emit('switchCommuted', { card_id: _cardId, set: (($('#switch-'+_cardId).is(':checked')) ? 'off' : 'on')});
		});
		// for 'alarm' type devices
		$('.card-footer').on('click', '.siren-animated', function(e){
			ion.sound.stop('siren-sound'); // stop sound when clicking on the siren
		});

	}).catch(function(err){ // err
  		notie.alert(2, err, 0);
  	});

});

// alarm triggered
events.on('uiTriggerAlarm', function(card){
	var $siren = $('div[alarm-id='+card._id+']');
	if (!$siren.hasClass('siren-animated')){ // avoid multiple execution at the same time
		$siren.toggleClass('siren-animated');
		if (card.device.notification_sound) ion.sound.play('siren-sound');
		// format last_alert timestamp
		$siren.parent().find('.last_alert').html(moment(card.device.last_alert, 'X').format('D MMM YYYY, H:mm:ss'));

		var secs = 30;
		$siren.html('<span class="label label-danger" style="position:relative; top: 105px;">30</span>');
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

// delete card request
events.on('deleteCard', function(_id){
	socket.emit('deleteCard', _id);
  ga('send', 'event', 'Core', 'delete', 'Card removal', _id);
});

// mute card request
events.on('muteCard', function(_id){
	socket.emit('muteCard', _id);
});

// arm/disarm request
events.on('arm_disarm', function(_id){
	socket.emit('arm_disarm', _id);
  ga('send', 'event', 'Core', 'arm', 'Arm/Disarm request', _id);
});

// update card dropdown menu mute status
events.on('uiMuteStatus', function(data){
	// data.card_id, data.notification_sound
	console.log(data);
	var $dropdown_entry = $('#mute-'+data.card_id);
	if (data.notification_sound)
		$dropdown_entry.html('<i class="fa fa-volume-off fa-fw"></i> Mute');
	else
		$dropdown_entry.html('<i class="fa fa-volume-up fa-fw"></i> Un-mute');

});

// update card dropdown menu arm/disarm status
events.on('uiArmStatus', function(data){
	// data.card_id, data.is_armed
	console.log(data);
	var $dropdown_entry = $('#arm-'+data.card_id);
	if (data.is_armed)
		$dropdown_entry.html('<i class="fa fa-times-circle fa-fw"></i> Disarm');
	else
		$dropdown_entry.html('<i class="fa fa-rocket fa-fw"></i> Arm');

});

// generate a new IoT System UID
events.on('generateNewUID', function(){
	$.get('/api/system/new/uid', function(data){
		if (data.status === 'ok'){
			$('#settings-outcome kbd').html('/register '+data.uid);
      ga('send', 'event', 'Core', 'uid-gen', data.uid);
		}else notie.alert(2, data.error, 0);
	});
});

// enable telegram notification
events.on('startTelegram', function(){
	$.get('/api/system/telegram/enable', function(data){
		if (data.status === 'ok'){
			$('#notification-btns .btn-telegram').replaceWith('<a href="#" class="btn btn-telegram" onClick="events.emit(\'stopTelegram\');"><i class="fa fa-stop"></i> Stop <i class="fa fa-paper-plane-o"></i> Telegram Notification</a>');
      ga('send', 'event', 'Core', 'telegram', 'enabled');
		}else notie.alert(2, data.error, 0);
	});
});

// disable telegram notification
events.on('stopTelegram', function(){
	$.get('/api/system/telegram/disable', function(data){
		if (data.status === 'ok'){
			$('#notification-btns .btn-telegram').replaceWith('<a href="#" class="btn btn-telegram" onClick="events.emit(\'startTelegram\');"><i class="fa fa-play"></i> Start <i class="fa fa-paper-plane-o"></i> Telegram Notification</a>');
      ga('send', 'event', 'Core', 'telegram', 'disabled');
		}else notie.alert(2, data.error, 0);
	});
});

// enable Email notification
events.on('startEmail', function(){
	$.get('/api/system/email/enable', function(data){
		if (data.status === 'ok'){
			$('#notification-btns .btn-email').replaceWith('<a href="#" class="btn btn-email" onClick="events.emit(\'stopEmail\');"><i class="fa fa-stop"></i> Stop <i class="fa fa-envelope-o"></i> Email Notification</a>');
      ga('send', 'event', 'Core', 'email', 'enabled');
		}else notie.alert(2, data.error, 0);
	});
});

// disable Email notification
events.on('stopEmail', function(){
	$.get('/api/system/email/disable', function(data){
		if (data.status === 'ok'){
			$('#notification-btns .btn-email').replaceWith('<a href="#" class="btn btn-email" onClick="events.emit(\'startEmail\');"><i class="fa fa-play"></i> Start <i class="fa fa-envelope-o"></i> Email Notification</a>');
      ga('send', 'event', 'Core', 'email', 'enabled');
		}else notie.alert(2, data.error, 0);
	});
});



/* Menu Buttons */


// Home Menu Button
events.on('clickHome', function(){
	console.log('Home button clicked.');
	socket.emit('getInitCards', socket.id);
	$('#c-circle-nav__toggle').click(); // Close Menu
  ga('send', 'event', 'UI', 'menu', 'Home button click');
});

// Ignored codes Menu Button
events.on('clickIgnoredCodes', function(){
	console.log('Ignored Codes button clicked.');
	$.get('/api/codes/ignored', function(data) {
		//var RFcodes = { RFcodes: JSON.parse(data) };

		var view = {title: 'Ignored RF codes', RFcodes: data};
		templating.renderTemplate('ignoredCodes.mustache', $('#main_modal_box'), view).then(function(){
			$('#ignored-codes-dialog').modal('show');
      ga('send', 'event', 'UI', 'menu', 'Ignored codes button click');
		}).catch(function(err){ // err
			notie.alert(2, err, 0);
		});
	});

	$('#c-circle-nav__toggle').click(); // Close Menu
});

// About Menu Button
events.on('clickAbout', function(){
	console.log('About button clicked.');
	templating.renderTemplate('about.mustache', $('#main_modal_box'), {}).then(function(){
		$('#about-dialog').modal('show');
    ga('send', 'event', 'UI', 'menu', 'About click');
	}).catch(function(err){ // err
		notie.alert(2, err, 0);
	});
	$('#c-circle-nav__toggle').click(); // Close Menu
});

// add Card Menu Button
events.on('clickAddCard', function(){
	events.emit('newCardClick');
	console.log('New Card button clicked.');
	$('#c-circle-nav__toggle').click(); // Close Menu
  ga('send', 'event', 'UI', 'menu', 'New card click');
});

// Settings Menu Button
events.on('clickSettings', function(){
	console.log('Settings button clicked.');

	$.get('/api/settings/get', function(data) {
		var settings = data.settings[0];
		console.log(settings);
		// get IoT system UID (generated using random algorithm)
		$.get('/api/system/get/uid', function(_data){
			var uid = _data.uid;
			if (uid){
				settings.uid = uid;
				templating.renderTemplate('settings.mustache', $('#main_modal_box'), settings).then(function(){
					$('#settings-dialog').modal('show');
          ga('send', 'event', 'UI', 'menu', 'Settings click');
				}).catch(function(err){ // err
					notie.alert(2, err, 0);
				});
			}else notie.alert(2, 'Error: Can\'t retrieve System UID.', 0);
		});


	});

	$('#c-circle-nav__toggle').click(); // Close Menu
});

// change Background
events.on('changeBg', function(){
  var p = ++BACKGROUNDS.p;
  var picked = BACKGROUNDS.imgs[p % BACKGROUNDS.imgs.length];
  document.body.style.backgroundImage = "url('../assets/img/backgrounds/"+picked+"')";
  if (localStorage) localStorage.bg = picked;
  ga('send', 'event', 'UI', 'background', 'background change');
});

/* UTILITY FUNCTIONS */

// Convert RGB to Hex.
function rgb2hex(rgb) {
    if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb;

    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

// Get an array with distinct elements
function distinctElementsArray(array){ // O(n^2)
   var unique = [];
   array.forEach(function(elem){
   		if (unique.indexOf(elem) === -1)
      	unique.push(elem)
   });
   return unique;
}
