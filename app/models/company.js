var mongoose = require("mongoose");

var C = require("../../config/config");

var Utils = require(C.lib+"utils");

var Schema = mongoose.Schema;
var CustomType = require("./customType.js");
var GeolocationType = CustomType.GeolocationSchema;

var C=require("../../config/config");

var RatingSchema = new Schema({
	id_customer: {
		type: Schema.ObjectId, 
		ref: "Customer"
	},
	rating: Number,
	date: Date
});

var Resource = new Schema({
	name: String,
	surname: String,
	description: String,
	phone: String,


	//services: [ServiceSchema],
	initDate: Date
});

var ReviewSchema = new Schema({
	id_customer: {
		type: Schema.ObjectId, 
		ref: "Customer"
	},
	rating: Number,
	description: String,
	date: Date
});

var PromotionSchema = new Schema({
	name: String,
	initDate: {
		type: Date
	},
	endDate: {
		type: Date
	},
	photos: [String],
	useLimit: Number,
	description: String,
	timesUsed: Number,
	ownCustomers: Boolean,
	dateCreated: Date
});

var ServiceSchema = new Schema({
	id_name: { 
		type: Schema.ObjectId, 
		ref: "Service_name"
	},
	description: String,
	duration: Number,
	price: Number,
	rating: [RatingSchema],
	dateCreated: Date
});


var CompanySchema = new Schema({
	cif:{
		type: String,
		unique: true,
		required: true
	},
	email:{
		type: String,
		unique: true,
		required: true
	},
	emailSecond:[String],
	name:{
		type: String,
		required: true
	}, 
	description: String,
	images: [{
		src:String,
		alt:String
	}],
	phone: [String],
	keywords: [String],
	locations:[{
        name:String,
		country: String,
		province: String,
		city: String,
		zipcode: String,
		address: String,
		geolocation: GeolocationType
	}],
	category:{
		type: Schema.ObjectId, 
		ref: "Category",
		required: true
	},
	promotions: [PromotionSchema],
	services: [ServiceSchema],
	review: [ReviewSchema],
	resources: [Resource],
	customers: [{type: Schema.ObjectId, ref: "Customer"}],
	registerDate: Date,
	lastAccess: Date,
	lastUpdate: Date
	

});

CompanySchema.statics={
	search:function(params, cb){ 
		var query = this.find({});
		for(var key in params){
			switch(key){
				case 'cif':
				case 'email':
				case 'category':
					query.where(key).equals(params[key]);
					break;
				case 'beforeRegister':
					query.where('registerDate').lt(params[key]);
					break;
				case 'afterRegister':
					query.where('registerDate').gt(params[key]);
					break; 
				case 'beforeLastUpdate':
					query.where('lastUpdate').lt(params[key]);
					break;
				case 'afterLastUpdate':
					query.where('lastUpdate').gt(params[key]);
					break; 		
				case 'beforeAccess':
					query.where('lastAccess').lt(params[key]);
					break;
				case 'afterAccess':
					query.where('lastAccess').gt(params[key]);
					break;
				default:query.where(key).equals(Utils.like(params[key]));

			}
			
		}
		
		query.exec(cb);	
	},
    
   modify:function(id_company, params, cb){
        this.findById(id_company, function(err, company){
			if(err) return cb(err);

		    if(!company)
				return cb("Company not found");

			for(var key in params){
				company[key] = params[key];
			}
			
			company.lastUpdate=new Date();
		
			company.save(function(err){
				if(err) return cb(err);				
				cb();
			});

		});
    },
    

	newReview: function(user, params, cb){
		var review = {};
		review.id_customer = user;
		review.rating = params.rating;
		review.description = params.description;
		review.date = new Date();
		this.update(
	   		{_id: params.company_id, 'review.id_customer': {$ne: user}},
	    	{$addToSet: {review: review}}, function(err, result){

					if(err) return cb(err);	
					if(result.nModified == 0)
						return cb("El usuario ya ha hecho un review");
					cb();
	    });
	},

	newRateService: function(user, params, cb){
		this.findOne({_id: params.company_id},  function(err, company){
			if(err)return cb(err);
			if(!company)return cb("Company not found");

		
			var service = company.services.id(params.service_id);
			if(!service) return cb("Service not found");
			service.rating.push( {id_customer: user, rating: params.rating, date: new Date()});
			company.save(function(err){
				if(err) return cb(err);				
				cb();
			});

		});
	},

	newService: function(id_company, params, cb){
		this.findOne({_id: id_company}, function(err, company){
			if(err)return cb(err);
			if(!company)return cb("Company not found");

			company.services.push(params);
			var service = company.services[company.services.length-1];
			service.dateCreated = new Date();
			company.save(function(err){
				if(err) return cb(err);				
				cb();
			});


		})
	},

	searchService: function(id_company, params, cb){
		var query;
		if(id_company != 0)
			query = this.aggregate([{$unwind:"$services"},{$match: {_id: id_company}}]);
		else
			query = this.aggregate([{$unwind:"$services"}]);

		var greaterRating=false;
		var lessRating=false;
		for(var key in params){
			switch(key){
				case 'id_name':
					var field = "services."+key;
					var match={};
					match[field] = params[key];
					query.match(match);	
					break;
				case 'beforeDateCreated':
					query.match({'services.dateCreated': {'$lte': new Date(params[key])}});
					break;
				case 'afterDateCreated':
					query.match({'services.dateCreated': {'$gte': new Date(params[key])}});
					break;
				case 'greaterPrice':
					query.match({'services.price' : {'$gte' : parseFloat(params[key])}});
					break;
				case 'lessPrice':
					query.match({'services.price' : {'$lte' : parseFloat(params[key])}});
					break;
				case 'greaterDuration':
					query.match({'services.duration' : {'$gte' : parseInt(params[key])}});
					break;
				case 'lessPrice':
					query.match({'services.duration' : {'$gte' : parseInt(params[key])}});
					break;
				case 'greaterRating': 
					greaterRating=true;	
					break;
				case 'lessRating':
					lessRating=true;
					break;
				default : 
					var field = "services."+key;
					var match={};
					match[field] = Utils.like(params[key]);
					query.match(match);	
			}
		}

		query.exec(function(err, companyService){
			if(companyService.length != 0)
				if(greaterRating || lessRating)	{
					var rates = getServiceRating(companyService);
					var noDeleted=0;
					for(var rate in rates){	
						if(params.greaterRating && params.lessRating){
							if(!(rates[rate] >= params.greaterRating && rates[rate] <= params.lessRating))
								companyService.splice(noDeleted,1);
							else
								noDeleted++;
						}else if(params.greaterRating && rates[rate] <= params.greaterRating){
							companyService.splice(noDeleted,1);
						}else if(params.lessRating && rates[rate] >= params.lessRating){
							companyService.splice(noDeleted,1);
						}else 
							noDeleted++;
					}
				}

			if(id_company != 0){		
				var services = companyService.map(function(a){
					return a.services;
				});
				return cb(null, services);
			}
			
			cb(null, companyService);
		});

	},

	findServiceById: function(id_company, id, cb){
		this.findOne({_id: id_company}, function(err, company){

			if(err) return cb(err);

		    if(!company)
				return cb("Company not found");

			var service = company.services.id(id);
			if(!service)
				return cb("Service not found");
			
			cb(null, service);

		})
	},

	modifyService: function(id_company, id, params, cb){
		this.findOne({_id: id_company}, function(err, company){
			if(err) return cb(err);

		    if(!company)
				return cb("Company not found");
			var service = company.services.id(id);
			if(!service)
				return cb("Service not found");
			for(var key in params){
				service[key] = params[key];
			}

			company.save(function(err){
				if(err) return cb(err);				
				cb();
			});

		});
	},

	deleteService: function(id_company, id, cb){
		this.findOne({_id: id_company}, function(err, company){
			if(err) return cb(err);

		    if(!company)
				return cb("Company not found");

			if(!company.services.id(id))
				return cb("Service not found");

			company.services.id(id).remove();
			company.save(function(err){
				if(err) return cb(err);
				cb();
			})
		})
	},

	newPromotion: function(id_company, params, cb){
		this.findOne({_id: id_company}, function(err, company){
			if(err)return cb(err);
			if(!company)return cb("Company not found");

			company.promotions.push(params);
			var promotion = company.promotions[company.promotions.length-1];
			promotion.dateCreated = new Date();
			company.save(function(err){
				if(err) return cb(err);				
				cb();
			});


		})
	},

	searchPromotion: function(id_company, params, cb){
		var query = this.aggregate([{$unwind:"$promotions"},{$match: {_id: id_company}}]);
		for(var key in params){
			switch(key){
				case 'beforeInitDate':
					query.match({'promotions.initDate': {'$lte': new Date(params[key])}});
					break;
				case 'afterInitDate':
					query.match({'promotions.initDate': {'$gte': new Date(params[key])}});
					break;
				case 'beforeEndDate':
					query.match({'promotions.endDate': {'$lte': new Date(params[key])}});
					break;
				case 'afterEndDate':
					query.match({'promotions.endDate': {'$gte': new Date(params[key])}});
					break;
				case 'greaterUseLimit':
					query.match({'services.useLimit' : {'$gte' : parseInt(params[key])}});
					break;
				case 'lessUseLimit':
					query.match({'services.useLimit' : {'$gte' : parseInt(params[key])}});
					break;
				case 'greaterTimeUsed':
					query.match({'services.timesUsed' : {'$gte' : parseInt(params[key])}});
					break;
				case 'lessTimeUsed':
					query.match({'services.timesUsed' : {'$gte' : parseInt(params[key])}});
					break;
				case 'beforeDateCreated':
					query.match({'promotions.dateCreated': {'$lte': new Date(params[key])}});
					break;
				case 'afterDateCreated':
					query.match({'promotions.dateCreated': {'$gte': new Date(params[key])}});
					break;

				default : 
					var field = "promotions."+key;
					var match={};
					match[field] = Utils.like(params[key]);
					query.match(match);	
			}
		}

		query.exec(function(err, companyPromotion){			
			var promotions = companyPromotion.map(function(a){
				return a.promotions;
			});
			cb(null, promotions);
		});
	},	

	findPromotionById: function(id_company, id, cb){
		this.findOne({_id: id_company}, function(err, company){
			if(err) return cb(err);
		    if(!company)return cb("Company not found");

			var promotion = company.promotions.id(id);
			if(!promotion)
				return cb("Promotion not found");
			cb(null, promotion);

		})
	},

	modifyPromotion: function(id_company, id, params, cb){
		this.findOne({_id: id_company}, function(err, company){
			if(err) return cb(err);
		    if(!company)return cb("Company not found");

			var promotion = company.promotions.id(id);
			if(!promotion)
				return cb("Promotion not found");
			for(var key in params){
				promotion[key] = params[key];
			}

			company.save(function(err){
				if(err) return cb(err);				
				cb();
			});

		});
	},

	deletePromotion: function(id_company, id, cb){
		this.findOne({_id: id_company}, function(err, company){
			if(err) return cb(err);
		    if(!company)return cb("Company not found");

			if(!company.promotions.id(id))
				return cb("Promotion not found");

			company.promotions.id(id).remove();
			company.save(function(err){
				if(err) return cb(err);
				cb();
			})
		})
	},

    newResource: function(id_company, params, cb){
    	var resource = {};

    	this.findOne({_id: id_company}, function(err, company){
			if(err)return cb(err);
			if(!company)return cb("Company not found");

			company.resources.push(params);
			var resource = company.resources[company.resources.length-1];
			resource.initDate = new Date();
			company.save(function(err){
				if(err) return cb(err);				
				cb();
			});
		})
    },

    deleteResource: function(id_company, id, cb){
		this.findOne({_id: id_company}, function(err, company){
			if(err) return cb(err);
		    if(!company)return cb("Company not found");

			if(!company.resource.id(id))
				return cb("Promotion not found");

			company.resource.id(id).remove();
			company.save(function(err){
				if(err) return cb(err);
				cb();
			})
		})
	},
	modifyPromotion: function(id_company, id, params, cb){
		this.findOne({_id: user}, function(err, company){
			if(err) return cb(err);
		    if(!company)return cb("Company not found");

			var resource = company.resources.id(id);
			if(!resource)
				return cb("Resource not found");
			for(var key in params){
				resource[key] = params[key];
			}

			company.save(function(err){
				if(err) return cb(err);				
				cb();
			});

		});
	},

	findResourceById: function(id_company, id, cb){
		this.findOne({_id: id_company}, function(err, company){
			if(err) return cb(err);
		    if(!company)return cb("Company not found");

			var resource = company.resource.id(id);
			if(!resource)
				return cb("Promotion not found");
			cb(null, promotion);

		})
	},

    searchResources: function(id_company, params, cb){
		var query = this.aggregate([{$unwind:"$resources"},{$match: {_id: id_company}}]);
		for(var key in params){
			switch(key){
				case 'beforeInitDate':
					query.match({'resources.initDate': {'$lte': new Date(params[key])}});
					break;
				case 'afterInitDate':
					query.match({'resources.initDate': {'$gte': new Date(params[key])}});
					break;				
				default : 
					var field = "resources."+key;
					var match={};
					match[field] = Utils.like(params[key]);
					query.match(match);	
			}
		}

		query.exec(function(err, companyResource){			
			var resources = companyResource.map(function(a){
				return a.resources;
			});
			cb(null, resources);
		});
	},	




};


function getServiceRating(services){		
	var rate =0;
	var rates=[];
	for(var service in services){
		if(services[service].services.rating.length != 0){
			for(var rating in services[service].services.rating){
				rate += services[service].services.rating[rating].rating;
			}
			rate = rate / services[service].services.rating.length;
		}
		rates.push(rate);
		rate=0;			
	}
	return rates;			
}

module.exports = mongoose.model("Company", CompanySchema);

