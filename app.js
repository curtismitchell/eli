
var InstanceInfoPage = function() {
	var request = require('request');
	var url = 'http://aws.amazon.com/ec2/instance-types/';

	this.onDataRetrieved = function(err, resp, html){};

	this.retrieveData = function() {
		var request = require('request');
		if(this.onDataRetrieved) {
			request(url, this.onDataRetrieved);
		} else {
			request(url);
		}
	};
};

/*
var page = new InstanceInfoPage();

page.onDataRetrieved = function(err, resp, html) {
	var parser = new InstanceInfoPageParser(html);
	parser.init();
};

page.retrieveData();
*/

var InstanceInfoPageParser = function(doc) {
	var instance_info = {
		fields: [],
		data: []
	};

	var cheerio = require('cheerio');
	var doc = cheerio.load(doc);
	var _ = require('underscore');

	var Utils = {
		getPropertySafeString: function(str) {
			return str.trim().toLowerCase().replace(/\s/g, '_').replace(/\W/g, '');
		},
		getReadableString: function(str) {
			return str.trim().replace(/\s{2}?/g, '');
		}
	};

	this.init = function() {
		doc('table').each(onTableFound);
	};
	
	function onTableFound(index, table) {
		var tbl = cheerio(table);
		var collection = {
			fields: [],
			data: [],
			name: function() { return Utils.getPropertySafeString(this.desc); },
			desc: null
		};

		collection.desc = tbl.prev().prev().text();

		var headerRow = tbl.siblings('tr').first();

		//get fields
		headerRow.children('td').each(function(iter, field) {
			var f = cheerio(field);
			collection.fields.push({field: Utils.getPropertySafeString(f.text()), desc: Utils.getReadableString(f.text())});
		});

		//get data
		var dataRows = headerRow.parent().siblings('tr'); //headerRow is in a <thead>
		
		dataRows.each(function(ndx, row){
			var obj = {};
			cheerio(row).children('td').each(function(iter, data) {
				obj[collection.fields[iter].field] = Utils.getReadableString(cheerio(data).text());
			});

			collection.data.push(obj);
		});

		var temp = _.union(instance_info.fields, collection.fields);
		instance_info.fields = temp;

		var indexedData = _.indexBy(instance_info.data, 'instance_type');

		collection.data.forEach(function(d){
			var existing = _.findWhere(instance_info.data, {instance_type: d.instance_type });

			if(existing) {
				existing = _.extend(d, existing);
			}
				
			indexedData[d.instance_type] = d;
		});

		instance_info.data = indexedData;
	};

	doc('table').each(onTableFound);

	return instance_info;
};


var fs = require('fs');
var parser = new InstanceInfoPageParser(fs.readFileSync('./sample_page.html'));
//parser.init();
console.log(parser.data['m1.medium']);


