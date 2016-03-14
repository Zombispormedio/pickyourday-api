var C=require("../../config/config");
var async = require("async");
var ServiceNameModel = require(C.models+"service_name");
var CompanyModel = require(C.models+"company");
var CategoryModel = require(C.models+"category");
var Controller = {};

Controller.newServiceName= function (body, cb) {
	if (!body || !body.name) return cb("Fields not Filled");
	
	var service = new ServiceNameModel(body);
	service.save(function (err, result) {
		if (err) return cb(err);
		cb(null, result);
	});
};

Controller.searchServiceName = function(query, cb){
	ServiceNameModel.search(query, function(err, serviceNames){
		if(err) return cb(err);

		if(!serviceNames)
			return cb(null, "Services name not found");
		
		cb(null, serviceNames);

	});
};

Controller.findServiceNameById = function(id, cb){
	ServiceNameModel.findById(id, function(err, serviceName){
		if(err) return cb(err);	
		if(!serviceName)return ("Service name not found");

		cb(null, serviceName);
	});
};

Controller.modifyServiceName = function(id, body,cb){
	if(!body || !id )
		return cb("Fields not filled");

	ServiceNameModel.modify(id, body, function(err){
		if(err) return cb(err);		
		cb();
	});
};


Controller.deleteServiceName = function(id, cb){    
	if (!id) return cb("Fields not Filled");

	ServiceNameModel.findByIdAndRemove(id, function (err,serviceName){
    	if(err) return cb(err);

		if(!serviceName)
			return cb("Service name not deleted");	
		cb();
	})
};

Controller.new= function(user, body, cb){

	if (!body || !body.id_name || (body.price==null))		
	 	return cb("Fields not Filled");

	CompanyModel.newService(user, body, function(err){
		if(err) return (err);
		cb();
	});
};

Controller.search = function(user, query, cb){
	CompanyModel.searchService(user, query, function(err, services){
		if(err) return cb(err);
		

		if(!services || services.length==0 )
			return cb(null, "Services not found");

		async.map(services, function(service, next){

			async.waterfall([
				function(callback){
					var id_name;

					if(!service.services)
						id_name = service.id_name;
					else
						id_name=service.services.id_name;

					ServiceNameModel.findById(id_name)
					.select('name duration keywords description')
					.exec(function(err, service_name){
						if(err) return callback(err);

						if(!service.services)
							service.id_name=service_name;
						else
							service.services.id_name=service_name;

						callback(null, service);
					});
				},
				function(s, callback){
					CategoryModel.findById(s.category)
						.select('name description')
						.exec(function(err, category){
							if(err) return callback(err);

							s.category = category;
							callback(null, s);
						});
				}

				],function(err, result){
				if(err) return next(err);
				next(null, result);
			});
			
		}, function(err, result){
			if(err) return cb(err);
			cb(null, result);
		});	
	})
};

Controller.findById = function(id, cb){

	CompanyModel.findServiceById(id, function(err, service){
		if(err) return cb(err);	
		
		ServiceNameModel.findById(service.id_name)
		.select('name duration keywords description')
		.exec(function(err, service_name){
			service =service.toObject();
			service.id_name = service_name;
			cb(null, service);			
		});		
	});
};
	
Controller.modify = function(user, id, body, cb){
	if(!body || !id )
		return cb("Fields not filled");

	CompanyModel.modifyService(user, id, body, function(err){
		if(err) return cb(err);		
		cb();
	});
};

Controller.delete = function(user, id, cb){
	if (!id) return cb("Fields not Filled");

	CompanyModel.deleteService(user, id, function(err){
		if(err) return cb(err);		
		cb();
	});
};
module.exports = Controller;