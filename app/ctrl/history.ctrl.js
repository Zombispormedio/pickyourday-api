var async = require("async");
var C = require("../../config/config");
var HPick = require(C.models + "history_pick");
var HPromotion = require(C.models + "history_promotion");
//var HEvent = require(C.models + "history_customer");
//var HEvent = require(C.models + "history_company");

var _=require("lodash");
var Utils = require(C.lib + "utils");
var Controller = {};

Controller.savePick = function(pick, resource, service, cb){
	if(!pick) return cb(-2);
	delete pick._id;
	var p = new HPick(pick);
	p.deleteDate = new Date();
	p.resource = resource;
	if(service.promotion == null)
		p.price = service.price;
	else
		p.price = service.priceDiscounted;

	if(p.price == undefined)
		p.price = 0;
    p.save(function (err) {
        if (err) return cb(err);
        cb();       
    });
};

Controller.savePromotion = function(promotion, cb){
	if(!promotion) return cb([]);

	var p = new HPromotion(promotion);
	p.deleteDate = new Date();
	p.save(function(err){
		if(err) return cb(err);
		cb();
	});
};


Controller.getPicks= function(query, cb){
	HPick.search(query, function(err, picks){
		if(err) return cb(err);
		if(!picks) return cb(null, []);
		cb(null, picks);
	});
};





module.exports = Controller;