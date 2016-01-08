// Execute from this directory 'node putcode.js'

// Include node levelup module
var levelup = require('levelup');
var path = require('path');
var config = require('../config.json');

// DB path
var db_path = path.resolve(path.dirname(require.main.filename), '..'+path.sep, config.DB_FolderName);
console.log('Opening levelup DB: ', db_path, require('os').EOL);

// Create or open the underlying LevelDB store
var db = levelup(db_path, {valueEncoding: 'json'});

function initializeRFcodes(data){ // data is the code received through serial
	if (typeof data === 'undefined') data = {};
	// RFcodes table structure

	return {
		bitlength: (data.bitlength) || 24,
		protocol: (data.protocol) || 1,
		isIgnored: true, // default values
		attachedTo: undefined // attachable to a Device ID
	};
}

var new_code = 3333;

db.get('RFcodes', function (err, codes) {
	if (err) return console.log(err);
	// let's put it
	codes[new_code] = initializeRFcodes();
	// store again on db
	db.put('RFcodes', codes, function (err) {
    	if (err) return console.log('Ooops!', err) // some kind of I/O error 
     	printDB(['RFcodes']);
    });
});

function printDB(keysToGet){
	keysToGet.forEach(function(key){
		console.log('### Getting key:', key);

		db.get(key, function (err, value) {
	    	if (err) return console.log('Ooops!', err) // likely the key was not found 
	 		console.log(value);
		});

	});
}





