;(function(window){

//events (publish subscribe) pattern [aka Event Emitter]
var _events = {
  events: {},
  on: function (eventName, fn) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(fn);
  },
  off: function(eventName, fn) {
    if (this.events[eventName]) {
      for (var i = 0; i < this.events[eventName].length; i++) {
        if (this.events[eventName][i] === fn) {
          this.events[eventName].splice(i, 1);
          break;
        }
      }
    }
  },
  emit: function (eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(function(fn) {
        fn(data);
      });
    }
  }
};


var Codes = function(){ // Class RFcodes
	// Attributes
	this.incoming_codes = {};


	// Methods
	this.putCode = function(code, data){
		this.incoming_codes[code] = data;
		_events.emit('newCode', code); // emit event
	};

	this.deleteCode = function(code){
		delete this.incoming_codes[code];
		_events.emit('removedCode', code); // emit event
	};

	this.deleteCodes = function(codesArray){
		var self = this;
		codesArray.forEach(function(code){
			self.deleteCode(code);
		});
	};

	this.getCodesInHTML = function(){
		var html = '<option disabled selected> -- choose -- </option>';
		Object.keys(this.incoming_codes).forEach(function(key){
				html += '<option value="'+key+'">'+key+'</option>';
		});
		return html;
	};

	// event emitting methods
	this.on = function(event_name, callback){
		_events.on(event_name, callback);
	};

	this.off = function(event_name, fn){ // Note: to be removed pass the same function used for the on listener.
		_events.off(event_name, fn);
	};

	this.emit = function(event_name, data){
		_events.emit(event_name, data);
	};

};


/* Events provided:
** RFcodes.on('newCode', function(code){ . . .});
** RFcodes.on('removedCode', function(code){ . . . });
**
** We expose only the istanciated object to the global namespace
*/
window.RFcodes = new Codes();

})(window);