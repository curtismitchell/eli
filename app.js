var request = require('request');
var url = 'http://aws.amazon.com/ec2/instance-types/';

var EC2InstanceInfoParser = function(doc) {
		this.headings = [];
		this._cheerio = require('cheerio');
		this.doc = this._cheerio.load(doc);
		this._enumerateHeadings();
};

EC2InstanceInfoParser.prototype._enumerateHeadings = function() {
	var that = this;
	this.doc('h2').map(function(iter, heading) {
		var h = that._cheerio(heading);
		if(h.text().indexOf('Instance Type') < 0) return;
		if(!that.headings) that.headings = [];
		var propName = jsSafe(h.text());
		that.headings.push(propName);

		that.headings[propName] = that._getDetails(h);

		console.log(propName);
		console.log(that.headings[propName]);

	});
}

EC2InstanceInfoParser.prototype._getDetails = function(h) {
	var tbl = h.siblings('table').first();
	var headerRow = this._cheerio(tbl).children('tr').first();

	var obj = this._getFields(headerRow, true);

	var results = [];	

	var that = this;
	this._cheerio(headerRow).siblings('tr').each(function(iter, row) {
		var vals = that._getFields(row);
		var newObj = {};
		for(var i=0; i < vals.length; i++) {
			newObj[obj[i]] = vals[i];
		}
		results.push(newObj);
	});
	return results;
}

EC2InstanceInfoParser.prototype._getFields = function(headerRow, makeSafe) {
	var r = this._cheerio(headerRow);
	var that = this;
	var vals = [];
	r.children('td').map(function(i, cell) {
		if(makeSafe) {
			vals.push(jsSafe(that._cheerio(cell).text()));
		} else {
			vals.push(readable(that._cheerio(cell).text()));
		}
	});
	console.log(vals.length);
	return vals;
}

var jsSafe = function(str) {
	return str.trim().toLowerCase().replace(/\s/g, '_').replace(/\W/g, '');
}

var readable = function(str) {
	return str.trim().replace(/\s{2}?/g, '');
}


request(url, function(err, resp, html) {
	var er = new EC2InstanceInfoParser(html);
});

/*
request(url, function(err, resp, html) {
	var headings = {};
	if(err) return console.error(err);

	var doc = cheerio.load(html);
	doc('h2').map(function(ndx, header) {
		var h = cheerio(header);
		if(h.text().indexOf('Instance Type') < 0) return;
		
		addHeading(h.text(), function() {
			var results = [];
			var tbl = h.siblings('table').first();

			var obj = [];
			//var results = [];	
			
			cheerio(tbl).siblings('thead tr').each(function(i, heading) {
				obj = getFields(heading, true);
			});	

			obj.push(h.text());
			cheerio(tbl).children('tr').each(function(iter, row) {
				var vals = getFields(row);
				var newObj = {};
				for(var i=0; i < vals.length; i++) {
					newObj[obj[i]] = vals[i];
				}
				results.push(newObj);
			});
			return results;
		});
		
	});

	function addHeading(heading, func) {
		headings[jsSafe(heading)] = func();
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

	console.log(headings);
});
*/




