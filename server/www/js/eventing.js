/**
 * Event Handling
*/


events.on('ignoreCode', function(code){
  // send ignore's command to the Server 
  socket.emit('ignoreCode', JSON.stringify({codeToIgnore: code})); // NB. socket defined below eventing.js
});

events.on('assignCode', function(code){
  // TODO ... open modal dialog. To assign it to a device
  console.log('open modal box ', code);
  var view = {title: 'Assign code', code: code};
  templating.renderTemplate('assignCode.mustache', $('#main_modal_box'), view).then(function(){
  	$('#assign-dialog').modal('show');
  }).catch(function(err){ // err
  	notie.alert(2, err, 0);
  });

  
});

var incoming_codes = {}; // RF codes with an opened snackbar
events.on('renderSnackbar', function(_code){
	if (!incoming_codes.hasOwnProperty(_code)){ // code first time detected
		incoming_codes[_code] = {badge_count: 1};
		var mex = '<span class="pull-left" style="padding-top: 11px"><span class="badge">'+incoming_codes[_code].badge_count+'</span> Code detected: '+_code+'</span>'+
		'<span class="pull-right"><a href="#" class="btn btn-info btn-xs" onclick="events.emit(\'ignoreCode\', '+_code+');">Ignore</a>'+
		'<a href="#" class="btn btn-success btn-xs" onclick="events.emit(\'assignCode\', '+_code+');">Assign</a></span>';
		incoming_codes[_code].elem = $.snackbar({
			content: mex,
		 	timeout: 0,
		 	htmlAllowed: true,
		 	onClose: function(){ // when snackbar is closed
		 		delete incoming_codes[_code];
			}}); // print snackbar

	}else{ // RFcode already exists and snackbar too, just increment badge_count field
		incoming_codes[_code].badge_count++;
		incoming_codes[_code].elem.find('.badge').fadeOut(500, function() {
        	$(this).html(incoming_codes[_code].badge_count).fadeIn(500);
    	});
	}
});

events.on('renderInitCards', function(initData){
	// TODO - stampare cards usando le iterazioni di Mustache!
	console.log(initData);

	var _data = {};
	//temporaneo
	templating.renderTemplate('cards.mustache', $('#mainBody'), _data).then(function(){

		// NB. on dynamic refresh always recall these lines below
		$.material.init();
		if($('#cards_container').mixItUp('isLoaded')){ // if already loaded
			$container.mixItUp();
			$('#cards_container').mixItUp({animation:{ animateResizeContainer: false}});
		}else
			$('#cards_container').mixItUp({animation:{ animateResizeContainer: false}});

	}).catch(function(err){ // err
  		notie.alert(2, err, 0);
  	});

});

// Menu Buttons

// TODOs
events.on('clickHome', function(){
	console.log('Home button clicked.');
});

events.on('clickIgnoredCodes', function(){
	console.log('Ignored Codes button clicked.');
});

events.on('clickTimer', function(){
	console.log('Timer button clicked.');
});

events.on('clickTriggers', function(){
	console.log('Triggers button clicked.');
});

events.on('clickSettings', function(){
	console.log('Settings button clicked.');
});