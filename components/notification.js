var request = require('request');
var config = require('../config.json');

function _getRemoteUrl(url_name){
	return new Promise(function(resolve, reject){
		request(config.backend_urls, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    try{
		    	var data = JSON.parse(body);
		    	if (url_name in data) resolve(data[url_name]);
		    	else reject('Can\'t get the remote URL');
		    }catch(err){
		    	reject(err);
		    }
		  }else reject(error.toString()+' '+response.statusCode);
		});
	});
}

function _postRequestJSON(url, json_data, uid, callback){

	request({
	    method: 'POST',
	    uri: url+'/'+uid, // always attach the uid as entrypoint.
	    strictSSL: false, // because we're using a self-signed certificate
	    headers: {'cache-control': 'no-cache', 'Content-Type': 'application/json'},
	    body: JSON.stringify(json_data) 
	  },
	  callback
	  );

}

module.exports = function(dbFunctions, webHooks){

	var methods = {
		adviceTelegram: function(card){
			return new Promise(function(resolve, reject){
				// advice user through telegram
				dbFunctions.isTelegramEnabled().then(function(outcome){
					if (outcome)
						_getRemoteUrl('telegram_backend').then(function(url){
							dbFunctions.getIotUID().then(function(uid){
								//card.iot_uid = uid; // si può eliminare. passato in URL
								_postRequestJSON(url, card, uid, function (error, response, body) {
								    if (error || response.statusCode !== 200) return reject('HTTP failed: '+ error);
									resolve(body);
								    console.log('Telegram Notification sent! - Server responded with:', body);
							  	});
						  	});
						}).catch(function(err){ reject(err); });
					else console.log('Telegram Notification disabled. Menu > Settings.');
				}).catch(function(err){ reject(err); });
			});
		},
		adviceEmail: function(card){
			return new Promise(function(resolve, reject){
				// TODO
				resolve(card);
			});
		},
		adviceWebHook: function(card){
			return new Promise(function(resolve, reject){
				// WebHook call (alarm triggered)
				webHooks.trigger('alarmTriggered', card);
				resolve(card);
			});
		},
		alarmAdviseAll: function(card){
			// advice telegram, email, webhooks
			methods.adviceEmail(card)
			.then(methods.adviceTelegram)
			.then(methods.adviceWebHook)
			.catch(function(err){
				console.error(err);
			});
		},
		webHookCodeDetected: function(codeData){
			// webHook call (code detected)
			webHooks.trigger('newCode', codeData);
		}
	};



	// expose methods
    return methods;

};