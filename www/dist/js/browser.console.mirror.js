/*
* Browser module for console mirroring.
* Works with Socket.io
*/

var consoleMirroring = (function(document){ // Module Pattern Design

	var methods = {};
	var domElem;

	function validateOptions(options){
		return new Promise(function(resolve, reject){
			if (typeof options === 'undefined') return reject('pass a valid option argument');
			if (typeof options.socketLib === 'undefined') return reject('pass a valid socket.io instance');
			if (typeof options.socketLib.io === 'undefined') return reject('Socket.io instance not valid');
			if (typeof options.containerId === 'undefined') return reject('containerId required.');
			if (document.getElementById(options.containerId) === null) return reject('containerId not found in the DOM');
			// set default values
			if (typeof options.fullScreen === 'undefined') options.fullScreen = false;
			if (typeof options.border === 'undefined') options.border = true;

			resolve();
		});
	}

	function addStyling(elem, extra){

		elem.style.background = '#000';
  		elem.style.border = (extra.border) ? '3px groove #ccc' : 'none';
  		elem.style.color = '#ccc';
 		elem.style.display = 'block';
  		elem.style.padding = '7px';
  		elem.style.width = (extra.fullScreen) ? '100%' : '70%';
  		elem.style.height = (extra.fullScreen) ? '100%' : '300px';
  		elem.style['overflow-y'] = 'scroll';
	}

	methods.init = function(options){

		validateOptions(options).then(function(){
			domElem  = document.getElementById(options.containerId);
			addStyling(domElem, options);
			var io = options.socketLib;
			io.on('logEvent', function(data){
				// {text: '...', color: '#...'} received through socket
				var mex = '<span style="color:'+data.color+'">'+data.text+'</span>'+'<br/>';
				domElem.insertAdjacentHTML('beforeend', mex);
			});
		}).catch(function(err){
			console.error(err);
		});

	};


	return methods;

})(document);
