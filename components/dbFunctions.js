var crypto = require('crypto');

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
			last_alert: false,
			notification_sound: true,
			armed: params.armed || true,
			trigger_code: parseInt(params.trigger_code)
		};
	else if (params.type === 'info')
		selected_device = {};

	return {
		active: true,
		date: Math.floor(Date.now() / 1000),
		headline: params.headline,
		shortname: params.shortname.trim().toLowerCase().replace(new RegExp(' ', 'g'), '-'),
		card_body: params.card_body,
		background_color: params.background_color || '#FAFAFA',
		img: img_path || false, // false if card got no img.
		room: params.room.trim().toLowerCase().replace(new RegExp(' ', 'g'), '-'),
		type: params.type,
		device: selected_device
	};
}

function _initializeDBSettings(){
	// return settings DB structure

	var settings = {
		telegram: {
			notification_enabled: false,
			iot_uid: false,
		},
		email: {
			notification_enabled: false,
			recipient_email: false
		}
	};

	return settings;
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
					db.RFCODES.find({code: code, isIgnored: false}, function(err, docs){
						if (err) return reject(err);

						if (docs.length === 0) reject('no code found');
						else if (docs.length === 1 && docs[0].assignedTo === 'none')
							resolve({isAvailable: true, assignedTo: docs[0].assignedTo});
						else if (docs.length === 1 && docs[0].assignedTo !== 'none')
							resolve({isAvailable: false, assignedTo: docs[0].assignedTo});
						else return reject('More than one code reference in DB');

					});
				});
			},
			getAvailableCodes: function(){
				return new Promise(function (resolve, reject){
					db.RFCODES.find({isIgnored: false, assignedTo: 'none'}, function(err, docs){
						if (err) return reject(err);
						resolve(docs);
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
			getCard: function(identifiers){
				return new Promise(function(resolve, reject){
					if (!identifiers.hasOwnProperty('_id') && !identifiers.hasOwnProperty('shortname')) return reject('No valid parameters.');
					db.CARDS.find(identifiers, function(err, docs){
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
							// set as assigned the codes in DB (handles both 'switch' and 'alarm' type)
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
			getDBSettings: function(){
				return new Promise(function(resolve, reject){
					db.SETTINGS.find({}, function (err, docs){
						if (err) return reject(err);
						resolve(docs);
					});
				});
			},
			initDBSettings: function(){
				return new Promise(function(resolve, reject){
					methods.getDBSettings().then(function(settings){
						if (settings.length)
							return resolve(settings);
						// no settings, let's init settings DB
						db.SETTINGS.insert(_initializeDBSettings(), function(err, newDocs){
							if (err) return reject(err);
							resolve(newDocs);
						});
					}).catch(function(err){
						reject(err);
					});
				});
			},
			generateNewUID: function(){
				return new Promise(function(resolve, reject){
					// generate and save a new IoT UID.
					var new_uid = crypto.randomBytes(20).toString('hex');
					db.SETTINGS.update({}, { $set: { "telegram.iot_uid": new_uid } }, {}, function (err, numReplaced) {
						if (err) return reject(err);
						if (numReplaced === 1) resolve(new_uid);
						else reject('error saving the new IoT UID');
					});
				});
			},
			getIotUID: function(){ // sync function
				return new Promise(function(resolve, reject){
					// get IoT UID from DB, it not exists let's create one:
					db.SETTINGS.find({}, function(err, docs){
						if (err) return reject(err);
						if (docs.length === 1){
							var _uid = docs[0].telegram.iot_uid;

							// doesn't exists let's generate one, save it and return it
							if (_uid === false)
							methods.generateNewUID().then(function(uid){
								resolve(uid);
							}).catch(function(err){
								reject(err);
							});
							else resolve(_uid); // already exists, return it

						}else reject('No DB Structure found');

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
							resolve({on_code: card.device.on_code, off_code: card.device.off_code, sound: card.device.notification_sound});
						} else reject('no records found');
					});
				});
			},
			getSwitchStatus: function(identifiers){
				return new Promise(function(resolve, reject){
					// get switch status, given card _id or shortname.
					if (!identifiers.hasOwnProperty('_id') && !identifiers.hasOwnProperty('shortname')) return reject('No valid parameters.');
					identifiers.type = 'switch';
					db.CARDS.find(identifiers, function(err, docs){
						if (err) return reject(err);
						if (docs.length === 0) return reject('No card found for given identifiers');
						resolve(docs[0].device.is_on);
					});
				});
			},
			setSwitchStatus: function(card_id, is_on){
				return new Promise(function(resolve, reject){
					db.CARDS.update({ _id: card_id }, { $set: { "device.is_on": is_on } }, {}, function (err, numReplaced) {
					  if (err) return reject(err);
					  resolve(numReplaced);
					});
				});
			},
			alarmTriggered: function(cardShortname, type){
				return new Promise(function(resolve, reject){
					// check if it is an alarm card
					db.CARDS.find({shortname: cardShortname, type: type}, function(err, docs){
						if (err) return reject(err);
						if (docs.length){
							// it is an alarm card, update the DB last_alert field
							var timestamp = Math.floor(Date.now() / 1000);
							db.CARDS.update({ shortname: cardShortname }, { $set: { "device.last_alert": timestamp } }, {}, function (err, numReplaced) {
							  if (err) return reject(err);
							  if (numReplaced){
							  	docs[0].device.last_alert = timestamp;
							  	resolve(docs[0]);
							  }else
							  	reject('error updating last_alert');
							});
						}else resolve(undefined);
					});

				});
			},
			muteCard: function(card_id){
				return new Promise(function(resolve, reject){
					// mute/unmute a card
					db.CARDS.find({_id: card_id}, function(err, docs){
						if (docs.length){
							var new_val = !docs[0].device.notification_sound;
							db.CARDS.update({_id: card_id}, { $set: { "device.notification_sound": new_val } }, {}, function (err, affected) {
							  if (affected !== 1) return reject('error: no value updated');
							  resolve(new_val);
							});
						} else return reject('error: no card found with _id', card_id);
					});

				});
			},
			armCard: function(identifiers){
				return new Promise(function(resolve, reject){
					// arm/disarm alarm type card
					if (!identifiers.hasOwnProperty('_id') && !identifiers.hasOwnProperty('shortname')) return reject('No valid parameters.');
					var query = (identifiers.hasOwnProperty('_id')) ? {_id: identifiers._id} : {shortname: identifiers.shortname};
					query.type = 'alarm';

					db.CARDS.find(query, function(err, docs){
						if (docs.length){
							var new_val = !docs[0].device.armed;
							if (typeof identifiers.arm === 'boolean') new_val = identifiers.arm; // for api arm/disarm requests
							db.CARDS.update(query, { $set: { "device.armed": new_val } }, {}, function (err, affected) {
							  if (affected !== 1) return reject('error: no value updated');
							  resolve({card_id: docs[0]._id, affected: affected, is_armed: new_val});
							});
						} else return reject('error: no card found with given identifiers ', identifiers.toString());
					});

				});
			},
			armDisarmAll: function(arm){
				return new Promise(function(resolve, reject){
					// arm/disarm all Alarm type cards.
					db.CARDS.update({type: 'alarm'}, { $set: { "device.armed": arm } }, {multi: true}, function (err, affected) {
						if (err) return reject(err);
					  var aff = affected ? affected : 'no cards affected';
					  resolve({affected: aff});
					});
				});
			},
			toggleTelegram: function(status){
				return new Promise(function(resolve, reject){
					// enable/disable telegram notification
					if (typeof status !== 'boolean') return reject('toggleTelegram: boolean expected');
					db.SETTINGS.update({}, {$set: {"telegram.notification_enabled": status} }, {}, function (err, numReplaced) {
						if (err) return reject(err);
						if (numReplaced === 1) resolve(status);
						else reject('Error: Zero or More than one telegram entry modified in settings.');
					});
				});
			},
			toggleEmail: function(status){
				return new Promise(function(resolve, reject){
					// enable/disable Email notification
					if (typeof status !== 'boolean') return reject('toggleEmail: boolean expected');
					db.SETTINGS.update({}, {$set: {"email.notification_enabled": status} }, {}, function (err, numReplaced) {
						if (err) return reject(err);
						if (numReplaced === 1) resolve(status);
						else reject('Error: Zero or More than one Email entry modified in settings.');
					});
				});
			},
			isTelegramEnabled: function(){
				return new Promise(function(resolve, reject){
					// check whether telegram is enabled or disabled.
					db.SETTINGS.find({"telegram.notification_enabled": true}, function(err, docs){
						if (err) return reject(err);
						if (docs.length) resolve(true);
						else resolve(false);
					});
				});
			}
	};

	return methods;

};
