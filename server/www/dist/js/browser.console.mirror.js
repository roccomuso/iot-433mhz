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
			resolve();
		});
	}

	function addStyling(elem){
		elem.style.background = '#000';
  		elem.style.border = '3px groove #ccc';
  		elem.style.color = '#ccc';
 		elem.style.display = 'block';
  		elem.style.padding = '5px';
  		elem.style.width = '70%';
  		elem.style['min-height'] = '300px';
  		elem.style['overflow-y'] = 'scroll';
	}

	methods.init = function(options){
		
		validateOptions(options).then(function(){
			domElem  = document.getElementById(options.containerId);
			addStyling(domElem);
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
