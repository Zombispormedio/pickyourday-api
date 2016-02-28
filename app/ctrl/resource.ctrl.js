var C=require("../../config/config");
var async = require("async");
var CompanyModel = require(C.models+"company");
var Controller = {};

Controller.new= function(user, body, cb){

	if (!body || !body.name)		
	 	return cb("Fields not Filled");

	CompanyModel.newResource(user, body, function(err){
		if(err) return (err);
		cb();
	});
}



Controller.delete = function(user, body, cb){
	if (!body || !body._id) return cb("Fields not Filled");

	CompanyModel.deleteResource(user, body._id, function(err){
		if(err) return cb(err);		
		cb();
	});
}

Controller.modify = function(user, id, body,cb){
	if(!body || !id )
		return cb("Fields not filled");

	CompanyModel.modifyResource(user, id, body, function(err){
		if(err) return cb(err);		
		cb();
	});
}


Controller.findById = function(user, id, cb){    
	if (!id) return cb("Fields not Filled");

	CompanyModel.findResourceById(user, id, function (err,serviceName){
    	if(err) return cb(err);

		if(!serviceName)
			return cb("Service name not deleted");	
		cb();
	})
}

Controller.search = function(user, query, cb){
	CompanyModel.searchResources(user, query, function(err, resources){
		if(err) return cb(err);

		if(!resources || resources.length==0 )
			return cb(null, "Resources not found");
		resources=resources.toObject();
		async.waterfall([
			function(callback){
				services=resources.services;
				async.map(company.services, function(service, next){
					

				},function(err, result){
					if(err) return callback(err);	
					company.services = result;
					callback(null, company);
				});
			},],function(err, result){
			if(err) return cb(err);
			cb(null, result);
		});

		cb(null, resources);
		
	});
}

module.exports = Controller;
