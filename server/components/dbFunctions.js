
function initializeRFcodes(data){ // data is the code received through serial
	if (typeof data === 'undefined') data = {};
	// RFcodes table structure
	return {
		code: data.code,
		bitlength: data.bitlength || 24,
		protocol: data.protocol || 1,
		isIgnored: false, // default values
		assignedTo: 'none' // attachable to a Device ID
	};
}

module.exports = function(db, config){

	// exposed methods
	var methods = {
			putInDB: function(data, callback){
				// check if the given code is in DB, if not, put it.
	            db.get('RFcodes', function (err, codes) {
	                if (err) { // likely the key was not found (init RFcodes table)
	                	var rfcodes = [];
	                	rfcodes.push(initializeRFcodes(data));
	                    // create it and put the code:
	                     db.put('RFcodes', rfcodes, function (err) {
	                      	if (err) return console.log('Ooops!', err) // some kind of I/O error 
	                     	callback();
	                     });
	                    
	                }else{ // just put the code if it doesn't exists yet.

	                	if (config.DEBUG) console.log('RFcodes in DB:', codes);
	                	var notFound = true;
	                	codes.forEach(function(obj){
	                		if (obj.code === data.code) notFound = false;
	                	});

	                	if (notFound){
	                		// let's put it
	                		codes.push(initializeRFcodes(data));
	                		// store again on db
	                		db.put('RFcodes', codes, function (err) {
		                    	if (err) return console.log('Ooops!', err) // some kind of I/O error 
		                     	callback();
		                    });
	                	}else callback(); // already there

	                }
	            });

			},
			isIgnored: function(code){
				return new Promise(function(resolve, reject){
					db.get('RFcodes', function (err, codes) {
					    if (err) return reject('Ooops! '+ err); // likely the key was not found

					    var isIgnored = false;
		                codes.forEach(function(obj){
		                	if (obj.code === code)
		                		if (typeof obj.isIgnored === 'boolean') isIgnored = obj.isIgnored;
		                });
		                resolve(isIgnored);
					});
				});
			},
			ignoreCode: function(code, val){
				return new Promise(function(resolve, reject){	
					db.get('RFcodes', function (err, codes) {
			    		if (err) return reject('Ooops! '+ err);
			    		codes.forEach(function(obj, i){
			    			if (obj.code === code){
			    				obj.isIgnored = val;
			    				codes[i] = obj;
			    			}
			    		});
			    		db.put('RFcodes', codes, function (err) {
	                    	if (err) return reject('Ooops! '+ err); // some kind of I/O error 
	                     	resolve(true);
                    	});
			    		
					});

				});

			},
			getIgnoredCodes: function(){
				return new Promise(function(resolve, reject){
					var ignored = [];
					db.get('RFcodes', function (err, codes) {
					    if (err) return reject(err);
					    codes.forEach(function(obj){
					    	if (obj.isIgnored === true) ignored.push(obj);
		                });
		                resolve(ignored);
					});
				});
				
			},
			getAllCodes: function(){
				return new Promise(function(resolve, reject){
					db.get('RFcodes', function (err, codes) {
					    if (err) return reject(err);
		                resolve(codes);
					});
				});
			}
	};

	return methods;

};