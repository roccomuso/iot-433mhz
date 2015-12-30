var express = require('express'); // Get the module
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var config = require('./config.json'); // config file

server.listen(config.server_port);

console.log("Server started on port ", config.server_port);


module.exports = function(server_cb, socket_cb){
  
  // API and Web Server part
  server_cb(app);

  // Socket part
  io.on('connection', function (socket) {
    // TODO ...
      socket_cb(socket);
  });

};