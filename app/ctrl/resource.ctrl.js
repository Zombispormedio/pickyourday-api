var C=require("../../config/config");
var async = require("async");
var CompanyModel = require(C.models+"company");
var ServiceCtrl = require(C.ctrl+"service.ctrl");
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
};

Controller.search = function(user, query, cb){
	CompanyModel.searchResources(user, query, function(err, resources){
		if(err) return cb(err);

		if(!resources || resources.length==0 )
			return cb(null, "Resources not found");
		
		async.map(resources, function(resource, next){	
            if(!resource) return next();
			async.waterfall([
				function(callback){				
					async.map(resource.services, function(service, next){						
						ServiceCtrl.findById(user, service, function(err, serv){
							console.log(serv);
							if(err) return next(err);	
							service=serv;
							
							next(null, service);
						});
					},function(err, result){
						if(err) return callback(err);							
						resource.services = result;
						callback(null, resource);
					});
				}
			],function(err, result){
				if(err) return next(err);
				//resources.push(result);
				next(null, result);
			});

		}, function(err, result){
			if(err) return cb(err);
			cb(null, result);
		});	
	});
}

module.exports = Controller;
