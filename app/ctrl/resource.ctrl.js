var C=require("../../config/config");
var async = require("async");
var CompanyModel = require(C.models+"company");
var ServiceCtrl = require(C.ctrl+"service.ctrl");
var PickCtrl = require(C.ctrl + "pick.ctrl");
var Controller = {};

Controller.new= function(user, body, cb){

	if (!body || !body.name)		
	 	return cb("Fields not Filled");

	CompanyModel.newResource(user, body, function(err){
		if(err) return (err);
		cb();
	});
}



Controller.delete = function(user, id, cb){
	if (!body || !id) return cb("Fields not Filled");

	CompanyModel.deleteResource(user, id, function(err){
		if(err) return cb(err);		
		cb();
	});
}

Controller.modify = function(user, id, body,cb){
	if(!id )
		return cb("Fields not filled");

	CompanyModel.modifyResource(user, id, body, function(err){
		if(err) return cb(err);		
		cb();
	});
}


Controller.findById = function(user, id, cb){    
	if (!id) return cb("Fields not Filled");

	CompanyModel.findResourceById(user, id, function (err, resource){
    	if(err) return cb(err);

		if(!resource)
			return cb("Resource not found");	
		cb(null, resource);
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
				next(null, result);
			});

		}, function(err, result){
			if(err) return cb(err);
			cb(null, result);
		});	
	});
};

Controller.getResourcesByService = function(company, idService, cb){
	var self = this;
    async.waterfall([
    	function getServices(callback){
    		var paramsTemp ={};
    		self.search(company, paramsTemp, function(err, resources){
    			if(err) return callback(err);
				callback(null, resources);
    		})
    	}, function getResources(resources, callback){
    		if(idService != 0){
    			ServiceCtrl.findById(company, idService, function(err, service){
    				if(err) return callback(err);
    				var services = [];
    				services.push(service);
    				callback(null, resources, services);
    			});
    		}else{
				var paramsTemp ={};
				ServiceCtrl.search(company, paramsTemp, function(err, services){
					if(err) return callback(err);
					callback(null, resources, services);
				});
    		}
    	}, function(resources, services, callback){
    		var resourcesByService = [];
			if(services != null && services.length > 0){
				for(var service in services){
					resourcesByService.push([]);
					resourcesByService[service].push(services[service]);
				}

				for(var service in services){				
					for(var resource in resources){
						var found = false;
						if(resources[resource].services != null)
							for(var serviceAux in resources[resource].services){						
								if(resources[resource].services[serviceAux]._id.equals(services[service]._id)){
									resourcesByService[service].push({"resource":resources[resource]});
									serviceAux = resources[resource].services.length;
									found = true;
								}								
							}
						if(found)
							resource = resources.length;
					}
				}
			}

			callback(null, resourcesByService);
    	}

    ], function(err, result){
    	if(err) return cb(err);
    	cb(null, result);
    });
};

Controller.getTimeLine = function(company, idResource, date, cb){
	var endDate = new Date();
	endDate.setDate(date.getDate());
    endDate.setHours(23);
    endDate.setMinutes(59);
    var self = this;
    async.waterfall([
    	function getPicks(callback){
    		var paramsTemp = {};
    		paramsTemp["company.id_company"] = company;
    		paramsTemp.beforeInitDate = endDate;
    		paramsTemp.afterInitDate = date;
    		PickCtrl.search(paramsTemp, function(err, picks){
    			if(err) return callback(err);
				callback(null, picks);
    		});

    	}, function getResources(picks, callback){

    		if(idResource != 0){
    			self.findById(company, idResource, function(err, resource){
    				if(err) return callback(err);
    				var resources = [];
    				resources.push(resource);
    				callback(null, resources, picks);
    			});
    		}else{
				var paramsTemp ={};
				self.search(company, paramsTemp, function(err, resources){
					if(err) return callback(err);
					callback(null, resources, picks);
				});
    		}

    	}, function formatTimeLine(resources, picks, callback){
			var timeLine = [];
			if(resources != null && resources.length > 0){
				for(var resource in resources){
					timeLine.push([]);
					timeLine[resource].push(resources[resource]);
				}

				for(var pick in picks){

					for(var resource in resources){
						var found = false;
						if(resources[resource].picks != null)
							for(var pickAux in resources[resource].picks){							
								if(resources[resource].picks[pickAux].equals(picks[pick]._id)){
									timeLine[resource].push({"pick":picks[pick]});
									pickAux = resources[resource].picks.length;
									found = true;
								}								
							}
						if(found)
							resource = resources.length;
					}
				}
				
				callback(null, timeLine);

			}else return callback(null, timeLine);
    	}


    ], function(err, result){
    	if(err) return cb(err);
    	cb(null, result);
    });

}




module.exports = Controller;
