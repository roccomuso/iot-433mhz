
function _initializeRFcodes(data){ // data is the code received through serial
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

function _initializeCard(params, img_path){ // params received through API
	if (typeof img_path === 'undefined') img_path = false;
	// Card table structure
	var selected_device = {};
	if (params.type === 'switch')
		selected_device = {
			on_code: parseInt(params.on_code),
			off_code: parseInt(params.off_code),
			notification_sound: true,
			is_on: false
		};
	else if (params.type === 'alarm')
		selected_device = {
			last_alert: 'no alert yet',
			notification_sound: true,
			trigger_code: parseInt(params.trigger_code)
		};
	else if (params.type === 'info')
		selected_device = {};

	return {
		active: true,
		date: Math.floor(Date.now() / 1000),
		headline: params.headline,
		shortname: params.shortname,
		card_body: params.card_body,
		background_color: params.background_color || '#FAFAFA',
		img: img_path, // false if card got no img.
		room: params.room,
		type: params.type,
		device: selected_device
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
							db.RFCODES.insert(_initializeRFcodes(data), function(err, newDoc){
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
			isCodeAvailable: function(code){
				return new Promise(function(resolve, reject){
					db.RFCODES.find({code: code, isIgnored: false, assignedTo: 'none'}, function(err, doc){
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
			},
			getAllCards: function(){
				return new Promise(function(resolve, reject){
					db.CARDS.find({}).sort({date: -1}).exec(function(err, docs){
						if (err) return reject(err);
						resolve(docs);
					});
				});
			},
			checkDatabaseCorrispondence: function(params){
				// CHECK THAT:
				// shortname is unique
				// codes are in db.RFCODES
				return new Promise(function(resolve, reject){
					db.CARDS.find({shortname: params.shortname}, function(err, doc){
						if (err) return reject(err);
						if (doc.length !== 0) reject('shortname already exists in DB, choose another one.');
						else{
							// check for codes
							var query = {};
							if (params.type === 'switch') query = { $or: [{ code: parseInt(params.on_code), isIgnored: false, assignedTo: 'none' }, { code: parseInt(params.off_code), isIgnored: false, assignedTo: 'none' }] };
							else if (params.type === 'alarm') query = {code: parseInt(params.trigger_code), isIgnored: false, assignedTo: 'none'};
							else if (params.type === 'info') query = {};
							
							db.RFCODES.find(query, function(err, docs){
								var len = (params.type === 'switch') ? 2 : 1 ; // should have found 2 records in codes' DB for switch type
								if (params.type === 'info') return resolve(true);

								if (docs.length === len)
									resolve(true);
								else 
									reject('Make sure to assign free not Ignored existing codes.');
							});
						}
					});
				});
			},
			putCardInDatabase: function(req, destination_path){
				// req.body e req.file
				return new Promise(function(resolve, reject){
					// normalize 'room' text before DB insertion
					db.CARDS.insert(_initializeCard(req.body, destination_path), function(err, newDoc){
							if (err) return reject(err);
							// set as assigned the codes in DB (handles both 'swtich' and 'alarm' type)
							db.RFCODES.update({ $or: [{ code: parseInt(req.body.on_code) }, { code: parseInt(req.body.off_code) }, {code: parseInt(req.body.trigger_code)}] }, { $set: { assignedTo: req.body.shortname } }, { multi: true }, function (err, numReplaced) {
							  // numReplaced = 2
							  resolve(newDoc); // return the new Card just inserted
							});
					});

				});
			},
			initDBCards: function(demo_cards){
				return new Promise(function(resolve, reject){
					//check if any cards already exists
					methods.getAllCards().then(function(cards){
						if (cards.length)
							return resolve(cards);
						// no cards, let's put demo cards in DB
						db.CARDS.insert(demo_cards, function(err, newDocs){
							if (err) return reject(err);
							resolve(newDocs);
						});
					}).catch(function(err){
						reject(err);
					});

				});
			},
			deleteCard: function(identifiers){
				return new Promise(function(resolve, reject){
					// delete a single card, given his _id or shortname.
					if (!identifiers.hasOwnProperty('_id') && !identifiers.hasOwnProperty('shortname')) return reject('No valid parameters.');
					
					db.CARDS.remove(identifiers, {}, function (err, numRemoved) {
					  if (err) return reject(err);
					  resolve(numRemoved);
					  // NB. the listener in index.js will delete the attached codes.
					});
					

				});
			},
			getSwitchCodes: function(card_id){
				return new Promise(function(resolve, reject){
					// get the switch codes for the specified card _id
					db.CARDS.find({_id: card_id}, function(err, docs){
						if (err) return reject(err);
						if (docs.length){
							var card = docs[0];
							if (card.type !== 'switch') return reject('Misleading card type.');
							resolve({on_code: card.device.on_code, off_code: card.device.off_code});
						}
					});
				});
			}
	};

	return methods;

};