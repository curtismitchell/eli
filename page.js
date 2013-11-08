var request = require('request');

module.exports = function(){
	var url = 'http://aws.amazon.com/ec2/instance-types/';

	this.retrieveData = function(callback) {
		if(callback) {
			request(url, callback);
		} else {
			request(url);
		}
	};
};
