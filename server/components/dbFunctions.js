
function initializeRFcodes(data){ // data is the code received through serial
	if (typeof data === 'undefined') data = {};
	// RFcodes table structure
	return {
		bitlength: data.bitlength || 24,
		protocol: data.protocol || 1,
		isIgnored: false, // default values
		attachedTo: undefined // attachable to a Device ID
	};
}

module.exports = function(db, config){

	// exposed methods
	var methods = {
			putInDB: function(data, callback){
				// check if the given code is in DB, if not, put it.
	            db.get('RFcodes', function (err, codes) {
	                if (err) { // likely the key was not found (init RFcodes table)
	                	var rfcode = {};
	                	rfcode[data.code] = initializeRFcodes(data);
	                    // create it and put the code:
	                     db.put('RFcodes', rfcode, function (err) {
	                      	if (err) return console.log('Ooops!', err) // some kind of I/O error 
	                     	callback();
	                     });
	                    
	                }else{ // just put the code if it doesn't exists yet.

	                	if (config.DEBUG) console.log('RFcodes in DB:', codes);
	                	var notFound = true;
	                	Object.keys(codes).forEach(function(code){
	                		if (code == data.code) notFound = false;
	                	});

	                	if (notFound){
	                		// let's put it
	                		codes[data.code] = initializeRFcodes(data);
	                		// store again on db
	                		db.put('RFcodes', codes, function (err) {
		                    	if (err) return console.log('Ooops!', err) // some kind of I/O error 
		                     	callback();
		                    });
	                	}else callback(); // already there

	                }
	            });

			},
			isIgnored: function(code, callback){
				db.get('RFcodes', function (err, codes) {
				    if (err) return console.log('Ooops!', err) // likely the key was not found 

				    var isIgnored = false;
	                Object.keys(codes).forEach(function(item){
	                	if (item == code)
	                		if (typeof codes[item].isIgnored === 'boolean') isIgnored = codes[item].isIgnored;
	                });
	                callback(isIgnored);
				});
			}
	};

	return methods;

};