// On Raspberry Pi make sure to execute with SUDO.

var fs = require('fs');
var async = require('async');
var config = require('./config.json');
var main_logo = require('./main_logo.js');
var platform = require('./platform.js');



/*


// Receive
rfSniffer.on('codes', function (code) {
  console.log('Code received: '+code);
});
 
// Send 
rfSend(1234, 0, function(error, stdout) {   //Send 1234 
  if(!error) console.log(stdout); //Should display 1234 
});

*/