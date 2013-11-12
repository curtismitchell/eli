var request = require('request');
var rootUrl = "http://aws.amazon.com/ec2/pricing/json";
var _ = require('underscore');
var dictionary;

var AWSDictionary = require('./aws_dictionary');

var ec2ImageTypes = [
  {id: "linux", description: "Linux"},
  {id: "mswin", description: "Windows"},
  {id: "rhel", description: "RedHat Enterprise"},
  {id: "sles", description: "SUSE Enterprise"},
  {id: "mswinSQL", description: "Windows w/ Sql Server Standard Edition"},
  {id: "mswinSQLWeb", description: "Windows w/ Sql Server Web Edition"}
];

var ec2ReservationTypes = [
  {id: "ri-light", description: "Reserved Instance/Light Utilization"},
  {id: "ri-medium", description: "Reserved Instance/Medium Utilization"},
  {id: "ri-heavy", description: "Reserved Instance/Heavy Utilization"},
  {id: "od", description: "On-Demand"}
];

function createDataSourceUrl(imageType, reservationType) {
  return rootUrl + '/' + imageType.id + '-' + reservationType.id + '.json';
}

var all_prices = [];
var inprogress = 0;
var whenDone;

module.exports = function(callback) {
  whenDone = callback;
  new AWSDictionary().on('ready', function(d) {
    dictionary = d;
    updatePricing();
  });
};

function updatePricing() {
    for(var k=0; k<ec2ImageTypes.length; k++) {
        for(var i=0; i<ec2ReservationTypes.length; i++) {
            inprogress++;
            var imageType = ec2ImageTypes[k], reservationType = ec2ReservationTypes[i];      
            var ds = createDataSourceUrl(imageType, reservationType);
        
            getEC2Pricing(ds, appendData, {image: imageType, reservation: reservationType});
        }
    }
}

/**
* Retrieves the latest EC2 pricing from AWS
*/
function getEC2Pricing(url, callback, context) {
  request(url,function(err, resp, json){
    callback(JSON.parse(json), context);
  });
}

function appendData(prices, additionalInfo) {
    additionalInfo.isOnDemand = (prices.config.rate && prices.config.rate === "perhr");

    for(var i=0;i<prices.config.regions.length;i++) {
        var region = prices.config.regions[i];
        appendPriceForRegion(region, additionalInfo, prices.config.valueColumns);
    }
    inprogress--;
    
    if(inprogress === 0 && whenDone) {
        whenDone(all_prices);
    }
}

function appendPriceForRegion(region, reservation, rateList) {
  for(var i=0; i<region.instanceTypes.length; i++) {
    var instanceType = region.instanceTypes[i];
    for(var k=0; k<instanceType.sizes.length; k++) {
        var size = instanceType.sizes[k];

        var rates = {};

        _.each(size.valueColumns, function(vc, key, list){
            var isHourly = (vc.name.match(/hourly/i) !== null) || reservation.isOnDemand; 
            var term = _.first(vc.name.match(/\d/));
            if(!term) {
                term = 'ondemand';
            }

            if(rates[term]) {
              _.extend(rates[term], (isHourly)? {
                  term: term,
                  hourlyRate: (isHourly)? parseFloat(vc.prices.USD) : 0
              } : {
                  term: term,
                  upFrontCost: (isHourly)? 0 : parseFloat(vc.prices.USD)
              }); 
            } else {
              rates[term] = (isHourly)? {
                  term: term,
                  description: dictionary[vc.name],
                  hourlyRate: (isHourly)? parseFloat(vc.prices.USD) : 0,
              } : {
                  term: term,
                  description: dictionary[vc.name],
                  upFrontCost: (isHourly)? 0 : parseFloat(vc.prices.USD)
              };
            }
        });

        var price = {
            region: { id: region.region, description: dictionary[region.region] },
            reservation_type: reservation.reservation.description,
            os: reservation.image.description,
            instance_type: { id: size.size, description: dictionary[instanceType.type] },
            rates: rates
        };

        all_prices.push(price);
    }
  }
}