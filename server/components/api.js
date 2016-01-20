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

module.exports = function(app, rf433mhz, dbFunctions){

	// send the specified code
	app.route('/api/code/send/:code').get(function(req, res) {
		if (typeof req.params.code !== 'undefined'){
			rf433mhz.send(req.params.code, function(err, out){
	    		if(err) console.log('Error:', err);
	    		res.send(JSON.stringify({'status': 'ok'}));
	    	});
	  		
	  	}else
	  		res.send(JSON.stringify({'status': 'error'}));
	});

	// return list of ignored codes.
	app.route('/api/codes/ignored').get(function(req, res){
		dbFunctions.getIgnoredCodes().then(function(ignored){
			res.status(200).json(ignored);
		}, function(err){
			res.status(500).json({error: err});
		});

	});

	// return all the codes in DB
	app.route('/api/codes/all').get(function (req, res){
		dbFunctions.getAllCodes().then(function(codes){
			res.status(200).json(codes);
		}, function(err){
			res.status(500).json({error: err});
		});
	});

	// return all the codes in DB
	app.route('/api/cards/all').get(function (req, res){
		dbFunctions.getAllCards().then(function(codes){
			res.status(200).json(codes);
		}, function(err){
			res.status(500).json({error: err});
		});
	});

	// new card insertion
	app.post('/api/cards/new', upload.single('card_img'), function (req, res, next) {
			// req.body will hold the text fields, if there were any

			if (checkRequiredParams(req.body)){
				// req.body will hold the img file
				if (req.file){
					var file_name = req.body.shortname+path.extname(req.file.originalname);
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
			}else res.status(500).json({done: false, err: 'Make sure to pass all the required params.'});

	});

	// handle 404 error for API
	app.all('/api/*', function(req, res){
		res.status(404).json({error_code: 404, err: 'API entrypoint not found'});
	});

	// serve as static all the other routes
	var web_dir = path.resolve(__dirname, '../www');
	app.get('*', express.static(web_dir));

	// Middleware that handle 404 error for web pages
	app.use(function(req, res, next){
	    res.status(404).sendFile(web_dir + '/404.html');
	});


};


function checkRequiredParams(params){ // required params (headline, shortname, room, type, on_code/off_code)

	console.log('API:/api/cards/new - Received parameters: ', params);

	if (typeof params === 'undefined') return false;

	var required_params = ['headline', 'shortname', 'room', 'type', 'background_color'];
	var params_name = Object.keys(params);

	var keepGoing = true;
	required_params.forEach(function(param){
		if (!validator.isIn(param, params_name)) keepGoing = false;
	});
	if (!keepGoing) return false;

	// check background color
	if (!validator.isHexColor(params.background_color)) return false;

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
