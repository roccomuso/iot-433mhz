
// Cards

$.material.init();
$.material.ripples();
// NB. on dynamic refresh always call these 2 lines below
// $('#cards_container').mixItUp('destroy');
$('#cards_container').mixItUp({animation:{ animateResizeContainer: false}});


// Handler to know if we are on a mobile device
(function(){
	// media query event handler
	if (matchMedia) { // matchMedia supported
		var mq = window.matchMedia("(max-width: 600px)");
		mq.addListener(WidthChange);
		WidthChange(mq);
	}

	// media query change
	function WidthChange(mq) {
		if (mq.matches) {
			// window width is <= 600px
			templating.isMobile = true;
		}
		else {
			// window width is more than 600px
			templating.isMobile = false;
		}

	}
})();


// Init Iot.Sound

// init bunch of sounds
ion.sound({
    sounds: [
        {name: "button_tiny"}, // for cards retrieved.
        {name: "glass"},
        {name: "notification1"},
        {name: "water_droplet_3"} // for code detected (snackbar opened)
    ],

    // main config
    path: "assets/sounds/",
    preload: true,
    multiplay: true,
    volume: 0.9
});

// play sound: 
// ion.sound.play("button_tiny");
