
// For socket sending methods see http://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender-socket-io



module.exports = function(socket, rf433mhz, db){
	
	var clients = []; // Store sockets
	
	// exposed methods
	var methods = {
		getInitData: function(){
			// TODO 
			// get data from DB to render the init cards on the UI.
			return {prova: true, come: 'va'};
		},
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
            
            client_socket.emit('initData', methods.getInitData());

            // TODO
            // Tutti i socket.on andrebbero qui.
            client_socket.on('example', function(data){ console.log(data); });
                
		}

	};

	return methods;

};