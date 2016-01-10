
// Cards

$.material.init();
$.material.ripples();
// NB. on dynamic refresh call these 2 lines below
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
