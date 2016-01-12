var express = require('express');
var path = require('path');

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

	// serve as static all the other routes
	var web_dir = path.resolve(__dirname, '../www');
	app.get('*', express.static(web_dir));

	// Middleware that handle 404 page
	app.use(function(req, res, next){
	    res.status(404).sendFile(web_dir + '/404.html');
	});


};