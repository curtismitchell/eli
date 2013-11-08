var request = require('request');
var rootUrl = "http://aws.amazon.com/ec2/pricing/json";
var _ = require('underscore');

var ec2ImageTypes = [
  {id: "linux", description: "Linux"}/*,
  {id: "mswin", description: "Windows"},
  {id: "rhel", description: "RedHat Enterprise"},
  {id: "sles", description: "SUSE Enterprise"},
  {id: "mswinSQL", description: "Windows w/ Sql Server Standard Edition"},
  {id: "mswinSQLWeb", description: "Windows w/ Sql Server Web Edition"}*/
];

var ec2ReservationTypes = [
  {id: "ri-light", description: "Reserved Instance/Light Utilization"},/*
  {id: "ri-medium", description: "Reserved Instance/Medium Utilization"},
  {id: "ri-heavy", description: "Reserved Instance/Heavy Utilization"},*/
  {id: "od", description: "On-Demand"}
];

function createDataSourceUrl(imageType, reservationType) {
  return rootUrl + '/' + imageType.id + '-' + reservationType.id + '.json';
}

var ec2_price = {
  region: null,
  reservationType: null,
  os: null,
  instance: {},
  rates: []
};

var ec2_rate = {
  term: "ondemand",
  hourlyRate: null,
  upFrontCost: null
};

var all_prices = [];

function updatePricing() {
  var results = [];
  for(var k=0; k<ec2ImageTypes.length; k++) {
    for(var i=0; i<ec2ReservationTypes.length; i++) {
      var imageType = ec2ImageTypes[k], reservationType = ec2ReservationTypes[i];      
      var ds = createDataSourceUrl(imageType, reservationType);

      getEC2Pricing(ds, function(pricing){
        appendData(pricing, {image: imageType, reservation: reservationType});
      });
    }
  }
}

/**
* Retrieves the latest EC2 pricing from AWS
*/
function getEC2Pricing(url, callback) {
  console.log(url);
  request(url,function(err, resp, json){
    callback(JSON.parse(json));
  });
}


updatePricing();

function appendData(prices, additionalInfo) {
  for(var i=0;i<prices.config.regions.length;i++) {
    var region = prices.config.regions[i];
    if(additionalInfo.reservation.id.indexOf("od") === 0) {
      appendReservedPricingForRegion(region, additionalInfo);
      console.log(_.findWhere(all_prices, {reservationType: 'On-Demand' }));
    } else {
      appendReservedPricingForRegion(region, additionalInfo);
      console.log(_.first(all_prices));
    }
  }
}

function appendReservedPricingForRegion(region, reservation) {
  for(var i=0; i<region.instanceTypes.length; i++) {
    var instanceType = region.instanceTypes[i];
    for(var k=0; k<instanceType.sizes.length; k++) {
      var size = instanceType.sizes[k];

      var rates = _.map(size.valueColumns, function(vc){
  var isHourly = (vc.name.match(/hourly/i) !== null); 
  var term = _.first(vc.name.match(/\d/));
  if(!term) {
    term = 'ondemand';
    isHourly = false;
  }

  return {
    term: term,
    hourlyRate: (isHourly)? vc.prices.USD : 0,
    upFrontCost: (isHourly)? 0 : vc.prices.USD
  }; 
});

      var price = {
        region: region.region,
        reservationType: reservation.reservation.description,
        os: reservation.image.description,
        instanceType: size.size,
        rates: rates
      };

      all_prices.push(price);
    }
  }
}

function getRate(vc){
  var isHourly = (vc.name.match(/hourly/i) !== null); 
  var term = _.first(vc.name.match(/\d/));
  if(!term) {
    term = 'ondemand';
    isHourly = false;
  }

  return {
    term: term,
    hourlyRate: (isHourly)? vc.prices.USD : 0,
    upFrontCost: (isHourly)? 0 : vc.prices.USD
  }; 
}

function appendOnDemandPricingForRegion(region, reservation) {
  var descs = [];
  var startingRow = sheet.getLastRow() + 1;
  var spreadsheet = getActiveSpreadsheet();
  
  for(var i=0; i<region.instanceTypes.length; i++) {
    var instanceType = region.instanceTypes[i];
    for(var k=0; k<instanceType.sizes.length; k++) {
      var size = instanceType.sizes[k];
      for(var l=0; l<size.valueColumns.length; l++) {
        var vc = size.valueColumns[l];
        sheet.appendRow([
          region.region, 
          reservation.reservation.description, 
          reservation.image.description, 
          size.size, 
          vc.prices.USD]);
      }
    }
  }
  
  var priceCol = sheet.getRange("E" + startingRow + ":E" + sheet.getLastRow());
  priceCol
  .setNumberFormat("$0.00")
  .setNotes(descs); 
}

function genSafeWord(word) {
  return word.replace(/\-/g, '_');
}

function getSheet(name) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(name);
  
  if(sheet) {
    spreadsheet.deleteSheet(sheet);
  }

  sheet = spreadsheet.insertSheet(name);

  return sheet;
}