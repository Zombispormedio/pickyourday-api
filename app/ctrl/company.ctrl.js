var _=require("lodash");
var C=require("../../config/config");

var CompanyModel = require(C.models+"company");
var ServiceCtrl = require(C.ctrl+"service.ctrl");
var PromotionCtrl = require(C.ctrl+"promotion.ctrl");
var PickCtrl = require(C.ctrl+"pick.ctrl");
var CategoryCtrl = require(C.ctrl+"category.ctrl");
var ServiceNameModel = require(C.models+"service_name");
var CategoryModel = require(C.models+"category");
var PickModel = require(C.models+"pick");
var AuthCtrl = require(C.ctrl + "auth.ctrl");
var ResourceCtrl = require(C.ctrl + "resource.ctrl");
var CustomerModel = require(C.models+"customer");
var async = require("async");
var Controller = {};

Controller.newCompany = function (body, cb) {
	if (!body || !body.cif || !body.email || !body.password) return cb("Fields not Filled");
	var company = new CompanyModel(body);
    company.registerDate=new Date();

	company.save(function (err, result) {
		if (err) return cb(err);
		cb(null, result);
	});
};

Controller.search = function(query, cb){
	CompanyModel.search(query, function(err, companies){
		if(err) return cb(err);

		if(!companies || companies.length==0 )
			return cb(null, "No companies");
		
		async.map(companies, function(companie, next){	
            if(!companie)return next();
			async.waterfall([
				function(callback){
					var c=companie.toObject();
					async.map(c.services, function(service, next){
						async.waterfall([function(subNext){
							ServiceNameModel.findById(service["id_name"])
							.select('name duration keywords description')
							.exec(function(err, service_name){
								if(err) return subNext(err);	
								service.default=service_name;				
								subNext(null, service);
							});
						},function(service, subNext){
							
							CompanyModel.formatServideRating(c._id, service._id, function(err, avg){
								if(err) return subNext(err);
								service.avgRating = avg;
								subNext(null, service);
							})
						}

					],function(err, result){
						if(err) return next(err);
						next(null, result);
					});

					},function(err, result){
						if(err) return cb(err);	
						c.services = result;
						callback(null, c);
					});
				},function(comp, callback){
					async.map(companie.review, function(rev, next){
						CustomerModel.findById(rev["id_customer"])
						.select('name')
						.exec(function(err, rev_customer){
							if(err) return next(err);
							rev.id_customer=rev_customer;
							next(null, rev);
						});
					}, function(err, result){
						if(err) return cb(err);
						comp.review=result;
						callback(null, comp);
					})
				},
				function(comp, callback){
					CategoryModel.findById(comp.category)
					.select('name description color icon image')
					.exec(function(err, category){
						if(err) return callback(err);
						comp.category = category;
						callback(null, comp);
					});
				},
				function(comp, callback){
					CompanyModel.formatReviews(comp._id, function(err, reviews){
						comp.review_ratings= reviews;
						callback(null, comp);
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

Controller.findById = function(id, cb){
	CompanyModel.findById(id, function(err, company){
		if(err) return cb(err);

		if(!company)
			return cb("No company found");
		
		async.waterfall([
			function(callback){
				company=company.toObject();
				async.map(company.services, function(service, next){
					async.waterfall([function(subNext){
						ServiceNameModel.findById(service["id_name"])
						.select('name duration keywords description')
						.exec(function(err, service_name){
							if(err) return subNext(err);	
							service.default=service_name;				
							subNext(null, service);
						});
					},function(service, subNext){
						console.log(company._id, service._id)
						CompanyModel.formatServideRating(company._id, service._id, function(err, avg){
							if(err) return subNext(err);
							service.avgRating = avg;
							subNext(null, service);
						})
					}

					],function(err, result){
						if(err) return next(err);
						next(null, result);
					});

				},function(err, result){
					if(err) return callback(err);	
					company.services = result;
					callback(null, company);
				});
			},
			function(comp, callback){
				CategoryModel.findById(comp.category)
				.select('name description color icon image')
				.exec(function(err, category){
					if(err) return callback(err);
					comp.category = category;
					callback(null, comp);
				});
			}, 
			function(comp, callback){
				async.map(company.review, function(rev, next){
					CustomerModel.findById(rev["id_customer"])
					.select('name')
					.exec(function(err, rev_customer){
						if(err) return next(err);
						rev.id_customer=rev_customer;
						next(null, rev);
					});
				}, function(err, result){
					if(err) return cb(err);
					comp.review=result;
					callback(null, comp);
				})
			},
				function(comp, callback){
					CategoryModel.findById(comp.category)
					.select('name description color icon image')
					.exec(function(err, category){
						if(err) return callback(err);
						comp.category = category;
						callback(null, comp);
					});
				},
				function(comp, callback){
					CompanyModel.formatReviews(comp._id, function(err, reviews){
						comp.review_ratings= reviews;
						callback(null, comp);
					})
				}
		],function(err, result){
			if(err) return cb(err);
			cb(null, result);
		});
	});
};

Controller.modify = function (id, body, cb) {

    if (!body || !id)
        return cb("Fields not filled");

    CompanyModel.modify(id, body, function (err) {
        if (err) return cb(err);
        cb();
    });
}

Controller.delete = function (id, cb) {

    if (!id) return cb("Fields not Filled");

    async.waterfall([
        function getCompany(next) {
            CompanyModel.findOne({ _id: id }, function (err, company) {

                if (err) return next(err);

                if (!company)
                    return next(null, "No Company");


                next(null, company);

            });
        }, function getPicks(company, next){
            PickModel.find({id_company:company._id}, function(err, picks){
               next(null, company, picks); 
            });
            
        },function deletePicks(company, picks, next){
            
            if(picks &&picks.length>0){
               async.eachSeries(picks, function iterator(item, n){
                   item.remove(function(){
                       n();
                   });
                   
               }, function done(){
                   next(null, company);
               })
            }
            
            
        },function unableAccess(company, next) {

            AuthCtrl.UnableAccess(company.email, function (err) {
                if (err) return next(err);
                next(null, company);
            });

        }, function deleteCompany(company, next) {
            company.remove(function (err) {
                if(err)return next();
                    next();
            });
        }

    ], function (err, data) {
        if (err) return cb(err);
        cb(null, "Company deleted");
    });


};





Controller.newReview = function(user, body, cb){
	if (!body || !body.company_id || !body.rating ) return cb("Fields not Filled");
	
	CompanyModel.newReview(user, body, function(err){
		if(err) return cb(err);
		cb();
	});
};

Controller.newRateService = function(user, body, cb){
	if (!body || !body.service_id || !body.company_id || !body.rating ) return cb("Fields not Filled");
	
	CompanyModel.newRateService(user, body, function(err){
		if(err) return cb(err);
		cb();
	})
};




//*********************PICKS
Controller.searchPick=function(company, params, cb){
	params["company.id_company"] = company;
	PickCtrl.search(params, cb);
}

Controller.deletePick=function(params, cb){
	PickCtrl.delete(params, cb);
}

Controller.getPickById=function(id, cb){
	PickCtrl.findById(id, cb);
}

//***********************SERVICES
Controller.searchServiceName=function(params, cb){
	ServiceCtrl.searchServiceName(params, cb);
}

Controller.searchService=function(company, params, cb){
	ServiceCtrl.search(company, params, cb);
}

Controller.newService=function(company, params, cb){

	ServiceCtrl.new(company, params, cb);
}

Controller.modifyService = function(company, params, cb){
	ServiceCtrl.modify(company, params, cb);
}

Controller.deleteService=function(company, params, cb){
	ServiceCtrl.delete(company, params, cb);
}

Controller.getServiceById=function(company, id, cb){
	ServiceCtrl.findById(company, id, cb);
}

//***********************PROMOTIONS
Controller.searchPromotion=function(company, params, cb){
	PromotionCtrl.search(company, params, cb);
}

Controller.newPromotion=function(company, params, cb){
	PromotionCtrl.new(params, cb);
}

Controller.modifyPromotion = function(company, id, params, cb){
	PromotionCtrl.modify(company,id,  params, cb);
}

Controller.deletePromotion=function(company, params, cb){
	PromotionCtrl.delete(company, params, cb);
}

Controller.getPromotionById=function(company,id, cb){
	PromotionCtrl.findById(company, id, cb);
};

//*******************CATEGORY
Controller.searchCategory=function(params, cb){
	CategoryCtrl.search(params, cb);
};


//*******************RESOURCE
Controller.newResource = function(company, params, cb){
	ResourceCtrl.new(company, params, cb);
};

Controller.searchResource = function(company, params, cb){
	ResourceCtrl.search(company, params, cb);
};

Controller.modifyResource = function(company, params, cb){
	ResourceCtrl.modify(company, params, cb);
};

Controller.deleteResource=function(company, params, cb){
	ResourceCtrl.delete(company, params, cb);
};

Controller.getResourceById=function(company, id, cb){
	ResourceCtrl.findById(company, id, cb);
};

Controller.asignService = function(company, params, cb){
	if (!company || !params.idService || !params.idResource ) return cb("Fields not Filled");
	CompanyModel.asignService(company, params.idService, params.idResource, cb);
};

Controller.getServicesAsigned = function(company, params, cb){
	if(!company || !params || !params.idResource) return cb("Fields not filled");

	CompanyModel.getServicesAsigned(company, resource, function(err, idsService){
		services = [];
		async.map(idsService, function(idService, callback){
			ServiceCtrl.findById(company, idService,function(err, service){
				if(err) return callback(err);
				services.push(service);
				callback(null, services);
			});
		}, function(err, result){
			if(err) return cb(err);
			
			cb(null, result);
		});
	});
};



Controller.rollback=function(id){
	CompanyModel.findById(id,function(err, company){
		company.remove();
	});
};



Controller.updateProfile=function(company_id, params, cb){
    var f_params=_.pick(params, ["emailSecond", "name", "description", "images", "phone", "web", "location"]);
    
    CompanyModel.update({_id:company_id}, f_params, function(err, result){
       if(err)return result;
       cb(null, result); 
    });
};





module.exports = Controller;