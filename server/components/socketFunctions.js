
// For socket sending methods see http://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender-socket-io



module.exports = function(socket, rf433mhz, dbFunctions){
	
	var clients = []; // Store sockets
	
	// private methods
	var _methods = {
		getInitData: function(){
			// TODO 
			// get data from DB to render the init cards on the UI.
			return {prova: true, come: 'va'};
		},
		onIgnoreCode: function(data){
			// data = {codeToIgnore: xxxx} - let's put codeToIgnore.isIgnored = false in DB
            var x = JSON.parse(data);
            dbFunctions.ignoreCode(x.codeToIgnore).then(function(ok){
            	console.log('code ignored: ', x.codeToIgnore); 
            }).catch(function(err){
            	console.log(err);
            });
            
        }
	};

	// exposed methods
	var methods = {
		
		onConnection: function(client_socket){ // single user socket
            // TODO ...
            console.log('User connected via socket.io');

            // Save the user:
            clients.push(client_socket); 
		    client_socket.on('disconnect', function() {
		        clients.splice(clients.indexOf(client_socket), 1);
		        // clients.forEach(function(sckt){ console.log(sckt.id);} ); // remaining clients
		    });

            // Sending actual configuration
            client_socket.emit('initData', _methods.getInitData());

            // Listen for socket events
            client_socket.on('ignoreCode', _methods.onIgnoreCode);

            client_socket.on('assignCode', function(data){ 
            	// TODO

            });
                
		}

	};

	return methods;

};