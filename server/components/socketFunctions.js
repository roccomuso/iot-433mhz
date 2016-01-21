
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
        },
        onSwitchCommuted: function(data){
        	// send the RF code | data = {card_id: '...', set: 'on/off'}
        	dbFunctions.getSwitchCodes(data.card_id).then(function(switch_codes){
        		var codeToSend = (data.set === 'on') ? switch_codes.on_code: switch_codes.off_code;
        		rf433mhz.send(codeToSend, function(err, out){
	    			if(err) return console.log('Error:', err);
	    			console.log('Code '+codeToSend+' sent!');
	    		});
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
            client_socket.on('switchCommuted', _methods.onSwitchCommuted);

                
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