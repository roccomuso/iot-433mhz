var sp = require("serialport");
var SerialPort = sp.SerialPort;
var serialPort = new SerialPort("COM4", {
  parser: sp.parsers.readline("\n"),
  baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false
}, false); // this is the openImmediately flag [default is true]


serialPort.open(function (error) {
  if ( error ) {
    console.log('failed to open: '+error);
  } else {
    console.log('open');
    

    setTimeout(function(){ // Arduino AutoReset requires to wait a few seconds before sending data!

      serialPort.on('data', function(data) {
      console.log('data received: ' + data);
    });

      /*
        serialPort.write(new Buffer('5201','ascii'), function(err, results) {
          if (err) console.log('err ' + err);
          console.log('results ' + results);
        });
        */
    }, 2000);

  }
});
