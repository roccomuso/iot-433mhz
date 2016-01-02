// Execute from root dir with 'npm run watchdb'

// Include node levelup module
var levelup = require('levelup');

// Create or open the underlying LevelDB store
var db = levelup('./mydb', {valueEncoding: 'json'});

// Function to print passed keys
function printDB(keysToGet){
	keysToGet.forEach(function(key){
		console.log('### Getting key:', key);

		db.get(key, function (err, value) {
	    	if (err) return console.log('Ooops!', err) // likely the key was not found 
	 		console.log(value);
		});

	});
}



var keysToGet = ['RFcodes'];

printDB(keysToGet);

