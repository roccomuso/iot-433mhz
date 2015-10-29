/*
Funzioni di Autenticazione e Autorizzazione per Mosca
*/

var credentials = require('./credentials.json');

var exports = module.exports = {};

exports.credentials = credentials;


// Accepts the connection if the username and password are valid
exports.authenticate = function(client, username, password, callback) {
  var authorized = ((username in credentials.users) && password.toString() === credentials.users[username]);
  if (authorized) client.user = username;
  callback(null, authorized);
}

// In this case the client authorized as alice can publish to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
exports.authorizePublish = function(client, topic, payload, callback) {
  
  var authorization = true;
  if (topic in credentials.pub_authorizations){ // topic protetto
	// solo gli utenti presenti nel file json sotto il topic specifico sono autorizzati a pubblicare in quel topic. Se non esiste il topic, allora il topic è pubblico, non ha restrizioni.
	authorization = (credentials.pub_authorizations[topic].indexOf(client.user) != -1);
  }
  callback(null, authorization); // il broker disconnette il client se non e' autorizzato
}

// callback(null, client.user == topic.split('/')[1]); 
exports.authorizeSubscribe = function(client, topic, callback) {
	// se c'e' una voce in credentials.json > sub_authorizations allora per quel determinato topic e' limitato l'accesso.
	var authorization = true;
	if (topic in credentials.sub_authorizations){ // topic protetto
		authorization =  (credentials.sub_authorizations[topic].indexOf(client.user) != -1);
	}
  callback(null, authorization);
}