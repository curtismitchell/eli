var Page = require('./page');
var Parser = require('./parser');

var InstanceInfo = module.exports = function(callback) {
	var page = new Page();
	page.retrieveData(function(err, resp, html){
		var instance_info = new Parser(html);	
		callback(instance_info);
	});
};