(function() {

  "use strict";

  /**
   * Cache variables
   */
  var menu = document.querySelector("#c-circle-nav");
  var toggle = document.querySelector("#c-circle-nav__toggle");
  var mask = document.createElement("div");
  var activeClass = "is-active";

  /**
   * Create mask
   */
  mask.classList.add("c-mask");
  document.body.appendChild(mask);

  /**
   * Listen for clicks on the toggle
   */
  toggle.addEventListener("click", function(e) {
    e.preventDefault();
    toggle.classList.contains(activeClass) ? deactivateMenu() : activateMenu();
  });

  /**
   * Listen for clicks on the mask, which should close the menu
   */
  mask.addEventListener("click", function() {
    deactivateMenu();
    console.log('click');
  });

  /**
   * Activate the menu 
   */
  function activateMenu() {
    menu.classList.add(activeClass);
    toggle.classList.add(activeClass);
    mask.classList.add(activeClass);
  }

  /**
   * Deactivate the menu 
   */
  function deactivateMenu() {
    menu.classList.remove(activeClass);
    toggle.classList.remove(activeClass);
    mask.classList.remove(activeClass);
  }

})();