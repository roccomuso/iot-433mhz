var templating = {
	dir: '/templates/',
	renderTemplate: function(templateFile, $domElem, view){
		return new Promise(function (resolve, reject){
			$.get(templating.dir+templateFile, function(template) {
		    	var rendered = Mustache.render(template, view);
		    	$domElem.html(rendered);
		    	resolve();
		  	}).fail(function(){
		  		reject('GET '+templateFile+' Error.');
		  	});
		});

	}
};