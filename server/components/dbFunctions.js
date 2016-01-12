
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
			putCodeInDB: function(data, callback){
				return new Promise(function(resolve, reject){
					// check if the given code is already in DB, if not, put it.
					db.RFCODES.find({code: data.code}, function(err, doc){
						if (err) return reject(err);
						if (doc.length !== 0){
							// already exists
							resolve('Code already exists in DB');
						}else{
							// put it
							db.RFCODES.insert(initializeRFcodes(data), function(err, newDoc){
								if (err) return reject(err);
								resolve(newDoc);
							});
						}
					});
	            });
			},
			isCodeIgnored: function(code){
				return new Promise(function(resolve, reject){
					db.RFCODES.find({code: code, isIgnored: true}, function(err, doc){
						if (err) return reject(err);
						if (doc.length === 0) resolve(false);
						else resolve(true);
					});
				});
			},
			ignoreCode: function(code, val){
				return new Promise(function(resolve, reject){
					db.RFCODES.update({ code: code }, {$set: {isIgnored: val} }, {}, function (err, numReplaced) {
						if (err) return reject(err);
						resolve(numReplaced); // 1
					});

				});

			},
			getIgnoredCodes: function(){
				return new Promise(function(resolve, reject){
					db.RFCODES.find({isIgnored: true}, function(err, docs){
						if (err) return reject(err);
						resolve(docs);
					});
				});
			},
			getAllCodes: function(){
				return new Promise(function(resolve, reject){
					db.RFCODES.find({}, function(err, docs){
						if (err) return reject(err);
						resolve(docs);
					});
				});
			}
	};

	return methods;

};