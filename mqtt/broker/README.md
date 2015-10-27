
Il Broker è scritto esclusivamente usando Mosca (implementazione in Node.js di un Broker MQTT).

- Per funzionalità di client si può usare il MQTT.js (scaricabile con npm)

Sottoscriversi a un topic:
	mqtt sub -t '/test/topic' -h '192.168.1.6' -i 'Rambo' -v --will-topic '/test/topic' --will-message 'I am dead.'
	< mqtt help subscribe		per una lista di comandi>
	
Pubblicare su un topic:
	mqtt pub -t '/test/topic' -h '192.168.1.6' -i 'Megatron' -m 'Hello World...'
	< mqtt help publish		per una lista di comandi>

	
	
- Oppure si può utilizzare Mosquitto:

Nota Bene. Su windows dopo l'installazione di Mosquitto è necessario installare alcune dipendenze:

Dependencies - win32
--------------------

* OpenSSL
    Link: http://slproweb.com/products/Win32OpenSSL.html
    Install "Win32 OpenSSL <version>"
    Required DLLs: libeay32.dll ssleay32.dll
* pthreads
    Link: ftp://sourceware.org/pub/pthreads-win32
    Install "pthreads-w32-<version>-release.zip
    Required DLLs: pthreadVC2.dll

Assicurarsi che le DLL richieste siano nel PATH di sistema, o nella stessa directory dell'eseguibile mosquitto.

E' consigliabile aggiungere alle variabili di sistema (voce Path), il percorso agli eseguibili di Mosquitto: C:\Program Files (x86)\mosquitto

Mosquitto restituisce degli errori se già è in ascolto sulla porta 1883 un'altra istanza di mosquitto. Con netstat -na possiede vedere quali porte sono in LISTENING ed eventualmente chiudere il processo che è in ascolto su quella porta.

Avviare il Broker di Mosquitto:
	mosquitto -v 	(default port: -p 1883)

Sottoscriversi a un topic:
	mosquitto_sub -v -t '/test/topic'

Pubblicare su un topic:
	mosquitto_pub -t '/test/topic' -m 'Hello World'