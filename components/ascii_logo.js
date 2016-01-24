var figlet = require('figlet');
var config = require('../config.json');

module.exports = function(module_callback){

	figlet(config.app_title, function(err, data) {
			    if (err) {
			        console.log('Something went wrong...');
			        console.dir(err);
			        return;
			    }
			    module_callback(data); // then print logo con console
			    
			});

}