
// For socket sending methods see http://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender-socket-io


module.exports = function(socket, rf433mhz, dbFunctions){
	
	var clients = []; // Store sockets
	
	// private methods
	var _methods = {

		onGetInitCards: function(socket_id){
			clients.forEach(function(sock){
				if (sock.id === socket_id){
		            // Sending the cards stored in db.CARDS
		            methods.asyncEmitInitCards(sock);
				}
			});
		},
		onIgnoreCode: function(code){
			// ignore the specified code, isIgnored = true in DB
            dbFunctions.ignoreCode(code, true).then(function(ok){
            	console.log('code ignored: ', code); 
            }).catch(function(err){
            	console.log(err);
            });
            
        },
        onRemoveIgnoreCode: function(code){
        	// make the code no more ignored (putting isIgnored = false)
        	dbFunctions.ignoreCode(code, false).then(function(ok){
            	console.log('code no more ignored: ', code); 
            }).catch(function(err){
            	console.log(err);
            });
        }
	};

	// exposed methods
	var methods = {
		
		onConnection: function(client_socket){ // single user socket
            
            console.log('Client connected via socket.io:', client_socket.id);

            // Save the user:
            clients.push(client_socket); 
		    client_socket.on('disconnect', function() {
		        clients.splice(clients.indexOf(client_socket), 1);
		        console.log('Client disconnected:', client_socket.id);
		        // remaining clients
		        // clients.forEach(function(sckt){ console.log(sckt.id);} );
		    });

            // Sending the cards stored in db.CARDS
            methods.asyncEmitInitCards(client_socket);

            // Listen for socket events
            client_socket.on('getInitCards', _methods.onGetInitCards);
            client_socket.on('ignoreCode', _methods.onIgnoreCode);
            client_socket.on('removeIgnoreCode', _methods.onRemoveIgnoreCode);

                
		},
		asyncEmitInitCards: function(io){
			dbFunctions.getAllCards().then(function(cards){
                io.emit('initCards', cards);
            }).catch(function(err){
                console.log(err);
            });
		}

	};

	return methods;

};