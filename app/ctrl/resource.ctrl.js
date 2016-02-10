var C=require("../../config/config");
var async = require("async");
var CompanyModel = require(C.models+"company");
var Controller = {};

Controller.new= function(user, body, cb){

	if (!body || !body.id_name || (body.price==null))		
	 	return cb("Fields not Filled");

	CompanyModel.newResource(user, body, function(err){
		if(err) return (err);
		cb();
	});
};



Controller.delete = function(user, body, cb){
	if (!body || !body._id) return cb("Fields not Filled");

	CompanyModel.deleteResource(user, body._id, function(err){
		if(err) return cb(err);		
		cb();
	});
};

Controller.modify = function(user, id, body,cb){
	if(!body || !id )
		return cb("Fields not filled");

	CompanyModel.modifyResource(user, id, body, function(err){
		if(err) return cb(err);		
		cb();
	});
};


Controller.findById = function(user, id, cb){    
	if (!id) return cb("Fields not Filled");

	CompanyModel.findResourceById(user, id, function (err,serviceName){
    	if(err) return cb(err);

		if(!serviceName)
			return cb("Service name not deleted");	
		cb();
	})
};

Controller.search = function(user, query, cb){
	CompanyModel.getResources(user, function(err, resources){
		if(err) return cb(err);

		if(!resources || resources.length==0 )
			return cb(null, "Resources not found");

		cb(null, resources);
		
	});
};
