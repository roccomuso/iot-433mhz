var express = require('express');
var path = require('path');
var fs = require('fs');
var validator = require('validator');
var multer  = require('multer');
var upload = multer({ dest: 'www/uploads/', 
	fileFilter: function(req, file, cb){ // file filter operations
		var allowed_img_ext = ['.jpg','.jpeg','.png','.gif','.bmp'];
		console.log(file);
		if (file) // img file not mandatory
			if (validator.isIn(path.extname(file.originalname).toLowerCase(), allowed_img_ext)) cb(null, true);
				else cb(null, false);
	} });

module.exports = function(app, io, rf433mhz, dbFunctions){

	// send the specified code
	app.route('/api/code/send/:code').get(function(req, res) {
		if (typeof req.params.code !== 'undefined'){
			rf433mhz.send(req.params.code, function(err, out){
	    		if(err) console.log('Error:', err);
	    		res.status(200).json({status: 'ok'});
	    	});
	  		
	  	}else
	  		res.status(500).json({status: 'error', error: 'Provide the code to sent'});
	});

	// return list of ignored codes.
	app.route('/api/codes/ignored').get(function(req, res){
		dbFunctions.getIgnoredCodes().then(function(ignored){
			res.status(200).json(ignored);
		}, function(err){
			res.status(500).json({status: 'error', error: err});
		});

	});

	// return all the codes in DB
	app.route('/api/codes/all').get(function (req, res){
		dbFunctions.getAllCodes().then(function(codes){
			res.status(200).json(codes);
		}, function(err){
			res.status(500).json({status: 'error', error: err});
		});
	});

	// list available codes
	app.route('/api/codes/available').get(function (req, res){
		dbFunctions.getAvailableCodes().then(function(codes){
			res.status(200).json(codes);
		}, function(err){
			res.status(500).json({status: 'error', error: err});
		});
	});

	// return all the codes in DB
	app.route('/api/cards/all').get(function (req, res){
		dbFunctions.getAllCards().then(function(codes){
			res.status(200).json(codes);
		}, function(err){
			res.status(500).json({status: 'error', error: err});
		});
	});

	// return a signle card with the specified shortname
	app.route('/api/cards/get/:shortname').get(function (req, res){
		if (typeof req.params.shortname !== 'undefined')
			dbFunctions.getCard({shortname: req.params.shortname}).then(function(card){
				res.status(200).json(card);
			}, function(err){
				res.status(500).json({status: 'error', error: err});
			});
		else res.status(500).json({status: 'error', error: 'Please provide a shortname.'});
	});

	// delete a card given his _id or shortname
	app.route('/api/cards/delete/:shortname').get(function (req, res){
		if (typeof req.params.shortname !== 'undefined')
			dbFunctions.deleteCard({shortname: req.params.shortname}).then(function(numDeleted){
				res.status(200).json({status: 'ok', cards_deleted: numDeleted});
			}, function(err){
				res.status(500).json({status: 'error', error: err});
			});
		else
			res.status(500).json({status: 'error', error: 'Please provide the shortname if you wanna delete a card'});
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
							if (err) return res.status(500).json({done: false, err: err});
							// put data in DB
							dbFunctions.putCardInDatabase(req, './uploads/'+file_name).then(function(newCard){
								res.status(200).json({done: true, newCard: newCard});
							}).catch(function(err){
								res.status(500).json({done: false, err: err});
							});
						});
					}else{
						// put data (no img) in DB
						dbFunctions.putCardInDatabase(req).then(function(newCard){
								res.status(200).json({done: true, newCard: newCard});
							}).catch(function(err){
								res.status(500).json({done: false, err: err});
							});
						
					}
				}).catch(function(err){
					res.status(500).json({done: false, err: err});
				});
			}else res.status(500).json({done: false, err: 'Make sure to pass all the required params.'});

	});

	// arm card 
	app.route('/api/alarm/:shortname/arm').get(function (req, res){
		if (typeof req.params.shortname !== 'undefined')
			dbFunctions.armCard({shortname: req.params.shortname, arm: true}).then(function(result){
				io.emit('uiArmStatus', {card_id: result.card_id, is_armed: true});
				res.status(200).json({status: 'ok', cards_affected: result.affected, armed: true});
			}, function(err){
				res.status(500).json({status: 'error', error: err});
			});
		else
			res.status(500).json({status: 'error', error: 'Please provide the shortname if you wanna arm a card'});
	});

	// disarm card
	app.route('/api/alarm/:shortname/disarm').get(function (req, res){
		if (typeof req.params.shortname !== 'undefined')
			dbFunctions.armCard({shortname: req.params.shortname, arm: false}).then(function(result){
				io.emit('uiArmStatus', {card_id: result.card_id, is_armed: false});
				res.status(200).json({status: 'ok', cards_affected: result.affected, armed: false});
			}, function(err){
				res.status(500).json({status: 'error', error: err});
			});
		else
			res.status(500).json({status: 'error', error: 'Please provide the shortname if you wanna disarm a card'});
	});

	// switch: /api/switch/[shortname]/on
	app.route('/api/switch/:shortname/on').get(function (req, res){
		commuteSwitch(req, res, dbFunctions, rf433mhz, io, true);
	});	

	// switch: /api/switch/[shortname]/off
	app.route('/api/switch/:shortname/off').get(function (req, res){
		commuteSwitch(req, res, dbFunctions, rf433mhz, io, false);
	});		

	// switch /api/switch/[shortname]/toggle
	app.route('/api/switch/:shortname/toggle').get(function (req, res){
		if (typeof req.params.shortname !== 'undefined')
			dbFunctions.getSwitchStatus({shortname: req.params.shortname}).then(function(status){
				commuteSwitch(req, res, dbFunctions, rf433mhz, io, !status);
			}).catch(function(err){
				res.status(500).json({status: 'error', error: err});
			});
		else res.status(500).json({status: 'error', error: 'Please provide a valid shortname'});
	});

	// handle 404 error for API
	app.all('/api/*', function(req, res){
		res.status(404).json({status: 'error', error_code: 404, err: 'API entrypoint not found'});
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
			if (docs.length === 0) return res.status(500).json({status: 'error', error: 'no device found for given shortname'});
			var card = docs[0];
			var code_to_send = (on) ? card.device.on_code : card.device.off_code;
			// send the code.
			rf433mhz.send(code_to_send, function(err, out){
    			if(err) return res.status(500).json({status: 'error', error: err});
    			dbFunctions.setSwitchStatus(card._id, on);
    			// eventually update UI
    			io.emit('uiSwitchToggle', {card_id: card._id, set: on, sound: card.device.notification_sound});
    			res.status(200).json({status: 'ok', switch_toggled: req.params.shortname, code_sent: code_to_send});

    		});
			
		}, function(err){
			res.status(500).json({status: 'error', error: err});
		});
	else
		res.status(500).json({status: 'error', error: 'Please provide a valid shortname'});
}


function checkRequiredParams(params){ // required params (headline, shortname, room, type, on_code/off_code)

	console.log('API:/api/cards/new - Received parameters: ', params);

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
