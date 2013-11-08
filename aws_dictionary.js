var cheerio = require('cheerio'),
request = require('request'),
DICT_DIV_SELECTOR = '#ec2Dictionary',
dictionary = {};

request('http://aws.amazon.com/windows', function(err, resp, html){
	var $ = cheerio.load(html);

    $(DICT_DIV_SELECTOR).children().each(function() {
        var item = $(this);
        dictionary[item.val()] = item.text().trim();
    });
});

exports.dictionary = dictionary;