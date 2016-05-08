var C=require("../../config/config");
var async = require("async");
var CompanyModel = require(C.models+"company");
var ServiceCtrl = require(C.ctrl+"service.ctrl");
var PickCtrl = require(C.ctrl + "pick.ctrl");
var Controller = {};

Controller.new= function(user, body, cb){

	if (!body || !body.name)		
	 	return cb("Fields not Filled");

	CompanyModel.newResource(user, body, function(err, resources){
		if(err) return (err);
		cb(null, resources);
	});
}



Controller.delete = function(user, id, cb){
	if (!id) return cb("Fields not Filled Delete Resource");

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


Controller.findById = function(user, id, params, cb){    
	if (!id) return cb("Fields not Filled");
	CompanyModel.findResourceById(user, id, function (err, resource){
    	if(err) return cb(err);

		if(!resource)
			return cb("Resource not found");	
		if(params && params.format != undefined && params.format == false)
			return cb(null, resource);
		else{

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
				}, function(resource, callback){
						async.map(resource.picks, function(idPick, next){						
							PickCtrl.findById(idPick, function(err, pick){									
								idPick=pick;
								
								next(null, idPick);
							});
					},function(err, result){
						if(err) return callback(err);							
						resource.picks = result;
						callback(null, resource);
					});

				}
			],function(err, result){
				if(err) return cb(err);
				cb(null, result);
			});
		}	
	})
};

Controller.search = function(user, query, cb){
    CompanyModel.findById(user, function(err, c){
        if(err) return cb(err); 
        query.state = c.state;

		CompanyModel.searchResources(user, query, function(err, resources){
			if(err) return cb(err);

			if(!resources || resources.length==0 )
				return cb(null, resources);

			if(query.format != undefined && query.format == false){
				return cb(null, resources);
			}else{
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
						}, function(resource, callback){
							var picksTemp = resource.picks;
							resource.picks=[];
							async.map(picksTemp, function(idPick, next){						
								PickCtrl.findById(idPick, function(err, pick){
									if(!err || pick != null) resource.picks.push(pick);	
									
									
									next(null);
								});
							},function(err, result){
								if(err) return callback(err);							
								
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
			}
		});
	})
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
			if(services !== null && services.length > 0){
				for(var service in services){
					resourcesByService.push([]);	
					for(var resource in resources){
						var found = false;
						for(var serviceAux in resources[resource].services){						
								if(resources[resource].services[serviceAux]._id.equals(services[service]._id)){
                                       var temp=resources[resource];
									resourcesByService[service].push({resource:temp.name+" "+temp.surname ,resource_id:temp._id, asigned:true});
									serviceAux = resources[resource].services.length;
									found = true;
								}								
							}
						if(!found){
                            var a=resources[resource];
                            resourcesByService[service].push({resource :a.name+" "+a.surname ,resource_id:a._id,  asigned:false});
                        }
							
                            
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

};




module.exports = Controller;
