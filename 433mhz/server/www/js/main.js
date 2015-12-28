// Sidebar Menu

var trigger = $('.hamburger'),
      overlay = $('.overlay'),
     isClosed = false;

    trigger.click(function () {
      hamburger_cross();      
    });

    function hamburger_cross() {

      if (isClosed == true) {          
        overlay.hide();
        trigger.removeClass('is-open');
        trigger.addClass('is-closed');
        isClosed = false;
      } else {   
        overlay.show();
        trigger.removeClass('is-closed');
        trigger.addClass('is-open');
        isClosed = true;
      }
  }

    $('.overlay').click(function(){ // close sidebar on overlay click
        $('#wrapper').toggleClass('toggled');
        hamburger_cross();
    });
  
  $('[data-toggle="offcanvas"]').click(function () {
        $('#wrapper').toggleClass('toggled');
  });

  // Cards

$.material.init();
// NB. on dynamic refresh call these 2 lines below
// $('#cards_container').mixItUp('destroy');
$('#cards_container').mixItUp({animation:{ animateResizeContainer: false}});