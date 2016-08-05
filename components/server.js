var express = require('express'); // Get the module
var app = express();
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var config = require('../config.json'); // config file
var basicAuth = require('basic-auth');


module.exports = function(argv, _cb){

  // Setting up parameters passed by CLI
  if (argv.username && argv.password) { config.username = argv.username.trim(); config.password = argv.password.trim();}
  if (argv.port){ config.server_port = argv.port; }

  // Starting Server
  server.listen(config.server_port);
  console.info('Server started on', getLocalIPAddress(), '- Port', config.server_port);

  // Auth function
  var auth = function (req, res, next) {
    function unauthorized(res) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.status(401).send('Unauthorized');
    };

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
      return unauthorized(res);
    };

    if (user.name === config.username && user.pass === config.password) {
      return next();
    } else {
      return unauthorized(res);
    };
  };

  // set authentication middleware
  app.use(auth);
  
  // set middleware
  app.use(bodyParser.json());

  // API and Web Server + Socket part
  _cb({http: app, io: io});

};



// utility function
function getLocalIPAddress() {
  // synchronous method
  var interfaces = require('os').networkInterfaces();
  var IPs = [];
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        IPs.push(alias.address);
    }
  }

  if (IPs.length === 1) return IPs[0];
  else if(IPs.length > 1) return IPs.toString();
  else return '0.0.0.0';
}
