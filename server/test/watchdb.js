// Execute from root dir with 'npm run watchdb'

// Include node levelup module
var levelup = require('levelup');
var path = require('path');
var config = require('../config.json');

// DB path
var db_path = path.resolve(path.dirname(require.main.filename), '..'+path.sep, config.DB_FolderName);
console.log('Opening levelup DB: ', db_path, require('os').EOL);

// Create or open the underlying LevelDB store
var db = levelup(db_path, {valueEncoding: 'json'});

// Function to print passed keys
function printDB(keysToGet){
	keysToGet.forEach(function(key){
		console.log('### Getting key:', key);

		db.get(key, function (err, value) {
	    	if (err) return console.log('Ooops!', err); // likely the key was not found 
	 		console.log(value);
		});

	});
}


// Keys to get
var keysToGet = ['RFcodes'];

printDB(keysToGet);

