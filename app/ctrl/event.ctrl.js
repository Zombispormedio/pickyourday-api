var C=require("../../config/config");

var CustomerModel = require(C.models+"customer");
var Utils=require(C.lib+"utils");
var async = require("async");
var Controller = {};

Controller.new = function(user, body, cb){
	if(!body || !body.initDate || !body.endDate )
		return cb("Fields not filled");

	CustomerModel.newEvent(user, body, function(err){
		if(err) return cb(err);
		cb();
	});
};

Controller.search = function(user, body, cb){
	CustomerModel.searchEvent(user, body, function(err, events){
		
		if(err) return cb(err);

		if(!events)
			return cb(null, "Events not found");

		cb(null, events);
	})
};

Controller.findById = function(user, id, cb){

	CustomerModel.findEventById(user, id, function(err, event){
		if(err) return cb(err);	
		if(!event) return cb("Event not found");	
		cb(null, event);
	});
};

Controller.delete = function(user, body, cb){
	if (!body || !body._id) return cb("Fields not Filled");

	CustomerModel.deleteEvent(user, body._id, function(err){
		if(err) return cb(err);		
		cb();
	});
};

Controller.modify = function(user, id, body,cb){
	if(!body || !id )
		return cb("Fields not filled");

	CustomerModel.modifyEvent(user, id, body, function(err){
		if(err) return cb(err);		
		cb();
	});
};


Controller.formatEvent = function(user, initDate, endDate, cb){

    var self = this;
    var paramsTemp = {};
    var formatDate = [];


    paramsTemp.beforeInitDate = endDate;
    paramsTemp.afterInitDate  = initDate;

    self.search(user, paramsTemp,function(err, events){    
        if(err) return cb(err);
        if(events != null && events.length > 0)
            for(var event in events)
                formatDate.push(events[event]);  
        
        cb(null, formatDate);
    });


}


module.exports = Controller;