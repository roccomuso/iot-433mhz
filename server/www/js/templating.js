var templating = {
	dir: '/templates/',
	render: function(templatePath, $domElem, view){
		return new Promise(function (resolve, reject){
			$.get(templating.dir+templatePath, function(template) {
		    	var rendered = Mustache.render(template, view);
		    	$domElem.html(rendered);
		    	resolve();
		  	}).fail(function(){
		  		reject('GET '+templatePath+' Error.');
		  	});
		});

	}
};