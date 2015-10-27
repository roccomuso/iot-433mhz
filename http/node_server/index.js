var http = require('http'); // http for GET request
var express = require('express');
var fs = require('fs');
//var levelup = require('levelup'); // LevelDB is a simple key/value data store built by Google, inspired by BigTable. It's used in Google Chrome and many other products.

var utility = require('./utility.js');
var config = require('./config.json'); // file di configurazione e mappa dei chip.

var app = express();

// id progressivo assegnato a ogni nuovi esp8266 che si autentica presso questo web server.
var mappa_chip = config.mappa_chip; // contiene le info: chip_id, ip_address etc.

// Notifiche provenienti dagli ESP8266 (pir sensor)

app.get('/board/:board_name/pir/:stat', function(req, res){
    console.log("Board: "+req.params.board_name+" - PIR sensor: "+req.params.stat);
    var now = new Date();
	fs.appendFile('pir_log.txt', now+' - Motion detected - board: '+req.params.board_name+" pir: "+req.params.stat+'\n', function (err) {
		if (err) console.log(err);
		
	});

	res.send("RPi: richiesta ricevuta.");
});

app.get('/pir_log', function (req, res){
	console.log("reading pir_log.txt");
	fs.readFile('./pir_log.txt', 'utf-8', function(err, data) {
    if (err) return res.status(400).send("Nessun pir_log.txt");

    var lines = data.trim().split('\n');
	res.status(200).send(lines);
    
	});
	
});

// Comunicazioni con i Chip ESP8266: [richieste provenienti dagli utenti]

app.get('/:chip_name/:cmd/:gpio?', function (req, res){

if (mappa_chip.length == 0){
	res.send("Nessun chip presente nella mappa (mappa_chip)!");
	return console.log("Nessun chip inizializzato nella mappa_chip!");
	}


	var gpio = req.params.gpio;
	var cmd = req.params.cmd.toLowerCase();
var k = 0;
    // cmd can be: toggle, get, on, off:
for (i in mappa_chip)
  if (req.params.chip_name == mappa_chip[i].name)
	if (cmd == "get" || cmd == "on" || cmd == "off" || cmd == "toggle" || cmd == "ping")
         { // prendiamo dalla mappa_chip l'indirizzo ip associato al chip_name passato
            
			
			var ip = mappa_chip[i].ip;
			var percorso = null;
			if (cmd != "ping")
				if(!utility.gpio_needed(true, gpio)) return res.status(400).send("{ \"error\": \"Specificare il pin GPIO (compreso fra 1 e 2)!\"}");
			
			switch (cmd){
				case "ping":
					percorso = "/?ping=board";
				break;
				case "toggle":
					percorso = "/?toggle="+gpio;
				break;
				case "get":
					percorso = "/?get="+gpio;
				break;
				case "on":
					percorso = "/?pin=on"+gpio;
				break;
				case "off":
					percorso = "/?pin=off"+gpio;
				break;
				case "pir":
					percorso = "/?pir=json";
				break;
				case "notification":
					if(gpio != null){
						var tf = (gpio == 1) ? true : false;
						percorso = "/?notification="+tf;
					}else
						percorso = "/?notification=json";
				break;
				
			}

			
			var options = {
				host: ip,
				port: 80,
				path: percorso,
				method: 'GET'
			};
			
			console.log("Richiesto: "+options.host+":80"+options.path);
			
			var request = http.request(options, function(risp) { // Richiesta GET
			  console.log('STATUS CODE: ' + risp.statusCode);
			  
			  var str = "";
        			  
        		risp.on('data', function (chunk) {
                      //console.log('BODY: ' + chunk);
                       str += chunk;
					   
                 });
        
                risp.on('end', function () {
                    // str contiene la risposta..
                     if(risp.statusCode == 200)
        			    res.status(200).send(str); // inoltra all'utente la risposta dello stesso esp8266
        			 else
        			    res.status(400).send("Errore.");
        			 console.log('called GET '+percorso);
                     
                });
                
			  
			});
			
			request.on('error', function(err) {
                // Handle error
                res.status(400).send("Impossibile connettersi! Errore: "+err);
				//throw err;
                console.log("Host non raggiungibile - Errore: "+err);
            });
            
			request.end();
			
        }else{
            res.status(400).send("Comando non riconosciuto!");
            console.log("Ricevuto comando non riconosciuto!");
        }
	else k++;
	
	if (k == mappa_chip.length){
		res.send("Nome chip non trovato nella mappa! N. elementi in mappa: "+mappa_chip.length);
		return console.log("Identificatore chip non trovato nella mappa! N. elementi in mappa: "+mappa_chip.length);
	}
	
});



// Express route for any other unrecognised incoming requests
app.get('*', function(req, res) {
  res.status(404).send('Unrecognised API call');
});


var server = app.listen(8266, function () { // server in ascolto sulla porta 8266 <- LOL

  var host = server.address().address;
  var port = server.address().port;

  console.log('App in ascolto su http://%s:%s', host, port);

});