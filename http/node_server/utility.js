exports.gpio_needed = function(needed, gpio){
	
	if (needed)
		if (gpio == null){
			console.log("Il GPIO non puo' essere null con questo comando.");
			return false;
		}else
		if (gpio < 1 || gpio > 2) {
			console.log("Il pin GPIO dev'essere compreso fra 1 e 2!");
			return false;
		}
	
	return true;
};

