var ii = require('./instance_info');
var p = require("./pricing");
var _ = require('underscore');
var express = require('express');
var app = express();
var info, prices, isReady = false;

ii(function(data){
	info = data.data;
	onReady();
});

p(function(priceInfo) {
    prices = priceInfo;
    onReady();
});

function onReady() {
    if((!info) || (!prices)) return;
    isReady = true;
}

app.use(express.json());
app.use(express.urlencoded());

app.get("/instances", confirmDataReady, function(req, res) {
    res.json(_.keys(info));
});

app.get("/prices", confirmDataReady, function(req, res){
    res.json(prices);
});

app.get("/instances/:id", confirmDataReady, function(req, res){
    var obj = info[req.params.id];
    
    if(req.query.includePricing) {
        obj.pricing = _.where(prices, {instance_type: req.params.id});
    }
    
    res.json(obj);
});

app.get("/regions/:region", confirmDataReady, function(req, res){
    var regionPrices = _.where(prices, {region: req.params.region});
    var types = _.pluck(regionPrices, "instance_type");
    var instances = _.filter(info, function(d) {
       _.contains(types, d.instance_type); 
    });
    
    res.json(regionPrices);
});

//middleware
function confirmDataReady(req, res, next) {
    if(!isReady) {
        res.send("not yet");
    }
    
    next();
}

app.listen(process.env.PORT);

