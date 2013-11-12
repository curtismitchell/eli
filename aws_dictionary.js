var cheerio = require('cheerio'),
request = require('request'),
DICT_DIV_SELECTOR = '#ec2Dictionary',
dictionary = {},
events = require('events'),
emitter = new events.EventEmitter();

var AWSDictionary = function() {
	events.EventEmitter.call(this);
	var self = this;

	request('http://aws.amazon.com/windows', function(err, resp, html){
		var $ = cheerio.load(html);

	    $(DICT_DIV_SELECTOR).children().each(function() {
	        var item = $(this);
	        dictionary[item.val()] = item.text().trim();
	    });

	    self.emit('ready', dictionary);
	});
};

AWSDictionary.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = AWSDictionary;