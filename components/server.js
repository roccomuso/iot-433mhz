var express = require('express'); // Get the module
var app = express();
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var config = require('../config.json'); // config file
var basicAuth = require('basic-auth');

server.listen(config.server_port);

console.info('Server started on', getLocalIPAddress(), '- Port', config.server_port);

module.exports = function(_cb){

  // set authentication middleware
  app.use(auth);
  
  // set middleware
  app.use(bodyParser.json());

  // API and Web Server + Socket part
  _cb({http: app, io: io});

};

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