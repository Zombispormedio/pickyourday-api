var C=require("../../config/config");

var CustomerModel = require(C.models+"customer");
var Utils=require(C.lib+"utils");
var async = require("async");
var Controller = {};

Controller.new = function(user, body, cb){
	if(!body || !body.initDate || !body.endDate || !body.name )
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
    var formatDate = [];
    var count = [];
    var rangeDays = Utils.countDays(initDate, endDate);

    for (var i=0; i<rangeDays; i++){
        count.push(i);
        formatDate.push([]);
    };

    var beforeInitDate = new Date();
    beforeInitDate.setDate(initDate.getDate());
    beforeInitDate.setHours(23);
    beforeInitDate.setMinutes(59);

    var afterInitDate = new Date();
    afterInitDate.setDate(initDate.getDate());
    afterInitDate.setHours(0);
    afterInitDate.setMinutes(0);

    var self = this;
    var paramsTemp = {};

       async.eachSeries(count, function(day, next){ 
        if(day > 0)
            beforeInitDate.setDate(beforeInitDate.getDate()+1);
        paramsTemp.beforeInitDate = beforeInitDate;
        if(day == 0)
            afterInitDate.setDate(afterInitDate.getDate());              
        else
            afterInitDate.setDate(afterInitDate.getDate()+1);
        paramsTemp.afterInitDate = afterInitDate;

        self.search(user, paramsTemp,function(err, events){    
            if(err) return next(err);
            if(events != null && events.length > 0)
                for(var event in events)
                    formatDate[day].push({"event":events[event], "init":events[event].initDate, "duration":Utils.countMinutes(events[event].initDate,events[event].endDate)});  
            
            next(null, null);
        });
    }, function(err, result){
        if(err) return cb(err);           
        cb(null, formatDate);
    }); 


}


module.exports = Controller;