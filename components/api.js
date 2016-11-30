var express = require('express');
var path = require('path');
var fs = require('fs');
var version = require('../package.json').version;
var debug = require('./debug.js')();
var validator = require('validator');
var multer  = require('multer');
var upload = multer({ dest: path.resolve(__dirname,'../www/uploads/'),
	fileFilter: function(req, file, cb){ // file filter operations
		var allowed_img_ext = ['.jpg','.jpeg','.png','.gif','.bmp'];
		debug(file);
		if (file) // img file not mandatory
			if (validator.isIn(path.extname(file.originalname).toLowerCase(), allowed_img_ext)) cb(null, true);
				else cb(null, false);
	} });

// loading backgrounds imgs
var BACKGROUNDS = fs.readdirSync(path.join(__dirname, '../www/assets/img/backgrounds'));
debug('Available UI backgrounds:', BACKGROUNDS);

module.exports = function(app, io, rf433mhz, dbFunctions, webHooks){

	// get settings
	app.route('/api/settings/get').get(function(req, res){
		dbFunctions.getDBSettings().then(function(docs){
			res.status(200).json({status: 'ok', settings: docs});
		}).catch(function(err){
			res.status(400).json({status: 'error', error: err.toString()});
		});
	});

	// get IoT System UID
	app.route('/api/system/get/uid').get(function(req, res){
		dbFunctions.getIotUID().then(function(UID){
			if (UID)
				res.status(200).json({status: 'ok', uid: UID});
			else
				res.status(400).json({status: 'error', error: 'can\'t generate the IoT System UID'});
		}).catch(function(err){
			res.status(400).json({status: 'error', error: err.toString()});
		});
	});

	// generate a new IoT System UID
	app.route('/api/system/new/uid').get(function(req, res){
		dbFunctions.generateNewUID().then(function(UID){
			res.status(200).json({status: 'ok', uid: UID});
		}).catch(function(err){
			res.status(400).json({status: 'error', error: err.toString()});
		});
	});

	// start Telegram API
	app.route('/api/system/telegram/enable').get(function(req, res){
		dbFunctions.toggleTelegram(true).then(function(outcome){
			res.status(200).json({status: 'ok', enabled: outcome});
		}).catch(function(err){
			res.status(400).json({status: 'error', error: err.toString()});
		});
	});

	// stop Telegram API
	app.route('/api/system/telegram/disable').get(function(req, res){
		dbFunctions.toggleTelegram(false).then(function(outcome){
			res.status(200).json({status: 'ok', enabled: outcome});
		}).catch(function(err){
			res.status(400).json({status: 'error', error: err.toString()});
		});
	});

	// start Email Notification API
	app.route('/api/system/email/enable').get(function(req, res){
		dbFunctions.toggleEmail(true).then(function(outcome){
			res.status(200).json({status: 'ok', enabled: outcome});
		}).catch(function(err){
			res.status(400).json({status: 'error', error: err.toString()});
		});
	});

	// stop Email Notification API
	app.route('/api/system/email/disable').get(function(req, res){
		dbFunctions.toggleEmail(false).then(function(outcome){
			res.status(200).json({status: 'ok', enabled: outcome});
		}).catch(function(err){
			res.status(400).json({status: 'error', error: err.toString()});
		});
	});


	// send the specified code
	app.route('/api/code/send/:code').get(function(req, res) {
		if (typeof req.params.code !== 'undefined'){
			rf433mhz.send(req.params.code, function(err, out){
	    		if(err) debug('Error:', err);
	    		res.status(200).json({status: 'ok'});
	    	});

	  	}else
	  		res.status(400).json({status: 'error', error: 'Provide the code to sent'});
	});

	// return list of ignored codes.
	app.route('/api/codes/ignored').get(function(req, res){
		dbFunctions.getIgnoredCodes().then(function(ignored){
			res.status(200).json(ignored);
		}, function(err){
			res.status(400).json({status: 'error', error: err.toString()});
		});

	});

	// return all the codes in DB
	app.route('/api/codes/all').get(function (req, res){
		dbFunctions.getAllCodes().then(function(codes){
			res.status(200).json(codes);
		}, function(err){
			res.status(400).json({status: 'error', error: err.toString()});
		});
	});

	// list available codes
	app.route('/api/codes/available').get(function (req, res){
		dbFunctions.getAvailableCodes().then(function(codes){
			res.status(200).json(codes);
		}, function(err){
			res.status(400).json({status: 'error', error: err.toString()});
		});
	});

	// return all the codes in DB
	app.route('/api/cards/all').get(function (req, res){
		dbFunctions.getAllCards().then(function(codes){
			res.status(200).json(codes);
		}, function(err){
			res.status(400).json({status: 'error', error: err.toString()});
		});
	});

	// return a signle card with the specified shortname
	app.route('/api/cards/get/:shortname').get(function (req, res){
		if (typeof req.params.shortname !== 'undefined')
			dbFunctions.getCard({shortname: req.params.shortname}).then(function(card){
				res.status(200).json(card);
			}, function(err){
				res.status(400).json({status: 'error', error: err.toString()});
			});
		else res.status(400).json({status: 'error', error: 'Please provide a shortname.'});
	});

	// delete a card given his _id or shortname
	app.route('/api/cards/delete/:shortname').get(function (req, res){
		if (typeof req.params.shortname !== 'undefined')
			dbFunctions.deleteCard({shortname: req.params.shortname}).then(function(numDeleted){
				res.status(200).json({status: 'ok', cards_deleted: numDeleted});
			}, function(err){
				res.status(400).json({status: 'error', error: err.toString()});
			});
		else
			res.status(400).json({status: 'error', error: 'Please provide the shortname if you wanna delete a card'});
	});

	// new card insertion
	app.post('/api/cards/new', upload.single('card_img'), function (req, res, next) {
			// req.body will hold the text fields, if there were any

			if (checkRequiredParams(req.body)){
				dbFunctions.checkDatabaseCorrispondence(req.body).then(function(){
					// req.body will hold the img file
					if (req.file){
						var file_name = req.body.shortname.trim().toLowerCase().replace(new RegExp(' ', 'g'), '-')+path.extname(req.file.originalname);
						var origin_path = path.resolve(__dirname, '..', req.file.path);
						var destination_path = path.resolve(__dirname, '../www/uploads/', file_name);
						fs.rename(origin_path, destination_path, function (err) { // rename file uploaded
							if (err) return res.status(400).json({done: false, err: err.toString()});
							// put data in DB
							dbFunctions.putCardInDatabase(req, './uploads/'+file_name).then(function(newCard){
								res.status(200).json({done: true, newCard: newCard});
							}).catch(function(err){
								res.status(400).json({done: false, err: err.toString()});
							});
						});
					}else{
						// put data (no img) in DB
						dbFunctions.putCardInDatabase(req).then(function(newCard){
								res.status(200).json({done: true, newCard: newCard});
							}).catch(function(err){
								res.status(400).json({done: false, err: err.toString()});
							});

					}
				}).catch(function(err){
					res.status(400).json({done: false, err: err});
				});
			}else res.status(400).json({done: false, err: 'Make sure to pass all the required params.'});

	});

	// arm all cards
	app.route('/api/cards/arm-all').post(function (req, res){
			dbFunctions.armDisarmAll(true).then(function(result){
				io.emit('refresh', '');
				res.status(200).json({status: 'ok', cards_affected: result.affected, armed: true});
			}, function(err){
				res.status(400).json({status: 'error', error: err.toString()});
			});
	});

	// disarm all cards
	app.route('/api/cards/disarm-all').post(function (req, res){
			dbFunctions.armDisarmAll(false).then(function(result){
				io.emit('refresh', '');
				res.status(200).json({status: 'ok', cards_affected: result.affected, armed: false});
			}, function(err){
				res.status(400).json({status: 'error', error: err.toString()});
			});
	});

	// arm card
	app.route('/api/alarm/:shortname/arm').get(function (req, res){
		if (typeof req.params.shortname !== 'undefined')
			dbFunctions.armCard({shortname: req.params.shortname, arm: true}).then(function(result){
				io.emit('uiArmStatus', {card_id: result.card_id, is_armed: true});
				res.status(200).json({status: 'ok', cards_affected: result.affected, armed: true});
			}, function(err){
				res.status(400).json({status: 'error', error: err.toString()});
			});
		else
			res.status(400).json({status: 'error', error: 'Please provide the shortname if you wanna arm a card'});
	});

	// disarm card
	app.route('/api/alarm/:shortname/disarm').get(function (req, res){
		if (typeof req.params.shortname !== 'undefined')
			dbFunctions.armCard({shortname: req.params.shortname, arm: false}).then(function(result){
				io.emit('uiArmStatus', {card_id: result.card_id, is_armed: false});
				res.status(200).json({status: 'ok', cards_affected: result.affected, armed: false});
			}, function(err){
				res.status(400).json({status: 'error', error: err.toString()});
			});
		else
			res.status(400).json({status: 'error', error: 'Please provide the shortname if you wanna disarm a card'});
	});

	// switch: /api/switch/[shortname]/on
	app.route('/api/switch/:shortname/on').get(function (req, res){
		commuteSwitch(req, res, dbFunctions, rf433mhz, io, true);
	});

	// switch: /api/switch/[shortname]/off
	app.route('/api/switch/:shortname/off').get(function (req, res){
		commuteSwitch(req, res, dbFunctions, rf433mhz, io, false);
	});

	// switch: /api/switch/[shortname]/toggle
	app.route('/api/switch/:shortname/toggle').get(function (req, res){
		if (typeof req.params.shortname !== 'undefined')
			dbFunctions.getSwitchStatus({shortname: req.params.shortname}).then(function(status){
				commuteSwitch(req, res, dbFunctions, rf433mhz, io, !status);
			}).catch(function(err){
				res.status(400).json({status: 'error', error: err.toString()});
			});
		else res.status(400).json({status: 'error', error: 'Please provide a valid shortname'});
	});

	// webHooks: GET /api/webhook/get (get all the stored webHooks)
	app.route('/api/webhook/get').get(function (req, res){
		webHooks.getDB().then(function(data){
			if (data)
				res.status(200).json({status: 'OK', data: data});
			else res.status(400).json({status: 'error', error: 'error retrieving the data'});
		}).catch(function(err){ res.status(400).json({status: 'error', error: err }); });
	});

	// webHooks: GET /api/webhook/get/:webHookShortname (get the selected webHook data)
	app.route('/api/webhook/get/:webHookShortname').get(function (req, res){
		if (typeof req.params.webHookShortname !== 'undefined'){
			webHooks.getWebHook(req.params.webHookShortname).then(function(data){
				if (data)
					res.status(200).json({status: 'OK', data: data});
				else res.status(400).json({status: 'error', error: 'error retrieving the data'});
			}).catch(function(err){ res.status(400).json({status: 'error', error: err }); });
		} else res.status(400).json({status: 'error', error: 'Please provide a valid webHook shortname'});
	});

	// webHooks: POST /api/webhook/add/:webHookShortname (add a new webHook url for a specified webhook event name)
	app.route('/api/webhook/add/:webHookShortname').post(function (req, res){
		if (typeof req.params.webHookShortname !== 'undefined'){
			if (req.body.hasOwnProperty('url'))
				webHooks.add(req.params.webHookShortname, req.body.url).then(function(outcome){
					if (outcome)
						res.status(200).json({status: 'OK', message: 'webHook added!', added: true});
					else res.status(400).json({status: 'error', message: 'webHook not added.', added: false});
				}).catch(function(err){ res.status(400).json({status: 'error', error: err, added: false }); });
			else res.status(400).json({status: 'error', error: 'JSON url parameter is required'});
		} else res.status(400).json({status: 'error', error: 'Please provide a valid webHook shortname'});
	});

	// webHooks: GET /api/webhook/delete/:webHookShortname (remove all the urls attached to the webHook selected)
	app.route('/api/webhook/delete/:webHookShortname').get(function (req, res){
		if (typeof req.params.webHookShortname !== 'undefined'){
			webHooks.remove(req.params.webHookShortname).then(function(outcome){
				if (outcome)
					res.status(200).json({status: 'OK', message: 'webHook removed!', deleted: true});
				else res.status(400).json({status: 'OK', message: 'webHook not found', deleted: false});
			}).catch(function(err){ res.status(400).json({status: 'error', error: err }); });
		}else res.status(400).json({status: 'error', error: 'Please provide a valid webHook shortname'});
	});

	// webHooks: POST /api/webhook/delete/:webHookShortname (remove a single webhook url for the selected webHook.)
	app.route('/api/webhook/delete/:webHookShortname').post(function (req, res){
		if (typeof req.params.webHookShortname !== 'undefined'){
			var body = req.body;
			if (body)
			webHooks.remove(req.params.webHookShortname, body.url).then(function(outcome){
				if (outcome)
					res.status(200).json({status: 'OK', message: 'webHook removed!', deleted: true});
				else res.status(400).json({status: 'OK', message: 'webHook not found', deleted: false});
			}).catch(function(err){ res.status(400).json({status: 'error', error: err }); });
			else res.status(400).json({status: 'error', error: 'Body not valid.'});
		} else res.status(400).json({status: 'error', error: 'Please provide a valid webHook shortname'});
	});

	// webHooks: POST /api/webhook/trigger/:webHookShortname (trigger a webHook. It requires a JSON body that will be turned over to the webHook URLs.)
	app.route('/api/webhook/trigger/:webHookShortname').post(function (req, res){
		if (typeof req.params.webHookShortname !== 'undefined'){
			var body = req.body;
			webHooks.trigger(req.params.webHookShortname, body);
			res.status(200).json({status: 'OK', message: 'webHooks called!', called: true});

		} else res.status(400).json({status: 'error', error: 'Please provide a valid webHook shortname'});
	});


	// handle 404 error for API
	app.all('/api/*', function(req, res){
		res.status(404).json({status: 'error', error_code: 404, err: 'API entrypoint not found'});
	});

	// serving index view
	app.get(['/', '/index.html'], function(req, res){
		res.render('index', {
			cache: true,
			title: 'IoT 433Mhz',
			backgrounds: JSON.stringify(BACKGROUNDS),
			version: version,
			googleAnalyticsID: 'UA-5606214-9'
		});
	});

	// serve as static all the other routes
	var web_dir = path.resolve(__dirname, '../www');
	app.get('*', express.static(web_dir));

	// Middleware that handle 404 error for web pages
	app.use(function(req, res, next){
	    res.status(404).sendFile(web_dir + '/404.html');
	});


};

function commuteSwitch(req, res, dbFunctions, rf433mhz, io, on){
	if (typeof req.params.shortname !== 'undefined')
		dbFunctions.getCard({shortname: req.params.shortname, type: 'switch'}).then(function(docs){
			if (docs.length === 0) return res.status(400).json({status: 'error', error: 'no device found for given shortname'});
			var card = docs[0];
			var code_to_send = (on) ? card.device.on_code : card.device.off_code;
			// send the code.
			rf433mhz.send(code_to_send, function(err, out){
    			if(err) return res.status(400).json({status: 'error', error: err.toString()});
    			dbFunctions.setSwitchStatus(card._id, on);
    			// eventually update UI
    			io.emit('uiSwitchToggle', {card_id: card._id, set: on, sound: card.device.notification_sound});
    			res.status(200).json({status: 'ok', switch_toggled: req.params.shortname, code_sent: code_to_send});

    		});

		}, function(err){
			res.status(400).json({status: 'error', error: err.toString()});
		});
	else
		res.status(400).json({status: 'error', error: 'Please provide a valid shortname'});
}


function checkRequiredParams(params){ // required params (headline, shortname, room, type, on_code/off_code)

	debug('API:/api/cards/new - Received parameters: ', params);

	if (typeof params === 'undefined') return false;

	var required_params = ['headline', 'shortname', 'room', 'type'];
	var params_name = Object.keys(params);

	var keepGoing = true;
	required_params.forEach(function(param){
		if (!validator.isIn(param, params_name)) keepGoing = false;
	});
	if (!keepGoing) return false;

	// check background color (must be an hex color if passed)
	if (params.background_color && !validator.isHexColor(params.background_color)) return false;

	// check for type-specific params
	switch (params.type){
		case 'switch':
			if (validator.isInt(params.on_code) &&
				validator.isInt(params.off_code)) return true;
			else return false;
		break;
		case 'alarm':
			if (validator.isInt(params.trigger_code)) return true;
			else return false;
		break;
		case 'info':
			// no specific params needed
			return true;
		break;
		case 'monitor':
			// TODO in feature release. Used by temperature sensor etc.
			return true;
		break;
	}

}
