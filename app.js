var cheerio = require('cheerio');
var request = require('request');

var url = 'http://aws.amazon.com/ec2/instance-types/';
request(url, function(err, resp, html) {
	var headings = [];
	if(err) return console.error(err);

	var html = cheerio.load(html);
	html('h2').map(function(i, header) {
		var h = cheerio(header);
		if(h.text().indexOf('Instance Type') < 0) return;
		
		addHeading(h.text(), function() {
			h.siblings('table').each(function(i, tbl) {
				console.log('table');
				var obj = [];
				var results = [];	
				
				cheerio(tbl).siblings('thead tr').each(function(i, heading) {
					obj = getFields(heading, true);
					//console.log(obj);
				});	

				cheerio(tbl).children('tr').each(function(i, row) {
					//if(i === 0) {
					//	console.log('header');
					//	obj = getFields(row, true);
					//	console.log(obj);
					//}
					//else {
						var vals = getFields(row);
						var newObj = {};
						for(var i=0; i < vals.length; i++) {
							newObj[obj[i]] = vals[i];
						}
						results.push(newObj);
					//}
					console.log(results);
				});
			});

			/*
			h.siblings('table tr').each(function(i, tbl) {
				if(i === 0) {
					obj = getFields(tbl, true);
				}
				else {
					var vals = getFields(tbl);
					var newObj = [];
					for(var i=0; i < vals.length; i++) {
						newObj[obj[i]] = vals[i];
					}
					results.push(newObj);
				}
				//console.log(results);
			});		*/
		});
	});

	function jsSafe(str) {
		return str.trim().toLowerCase().replace(/\s/g, '_').replace(/\W/g, '');
	}

	function readable(str) {
		return str.trim().replace(/\s{2}?/g, '');
	}

	function addHeading(heading, func) {
		headings.push(jsSafe(heading));
		console.log(headings);
		func();
	}

	function getFields(headerRow, makeSafe) {
		var r = cheerio(headerRow);
		var vals = [];
		r.children('td').map(function(i, cell) {
			if(makeSafe) {
				vals.push(jsSafe(cheerio(cell).text()));
			} else {
				vals.push(readable(cheerio(cell).text()));
			}
		});
		
		return vals;
	}


});