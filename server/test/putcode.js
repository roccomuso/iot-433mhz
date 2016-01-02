// Execute from this directory 'node putcode.js'

// Include node levelup module
var levelup = require('levelup');

// Create or open the underlying LevelDB store
var db = levelup('../mydb', {valueEncoding: 'json'});

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

var new_code = 1364;

db.get('RFcodes', function (err, codes) {
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





