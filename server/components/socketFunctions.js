
module.exports = function(socket){
	
	
	// exposed methods
	var methods = {
		getInitData: function(){
			// TODO 
			// get data from DB to render the init cards on the UI.
			return {prova: true, come: 'va'};
		},
		onConnection: function(user_socket){
            // TODO ...
            console.log('User connected via socket.io');
            // Sending actual configuration
            
            user_socket.emit('initData', methods.getInitData());

            // Tutti i socket.on andrebbero qui.
            user_socket.on('example', function(data){ console.log(data); });
                
		},
		codeInDB: function(code){
			// TODO
			// check if the given code is in DB

		}
	};

	return methods;

};