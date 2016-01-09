/**
 * Event Handling
*/


events.on('ignoreCode', function(code){
  socket.emit('ignoreCode', JSON.stringify({codeToIgnore: code})); // NB. socket defined below eventing.js
});

events.on('assignCode', function(code){
  // TODO ... open modal box. To assign it to a device
  console.log('open modal box ', code);
  
});
