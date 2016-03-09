var C = require("../../config/config");

var async=require("async");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;


var Utils = require(C.lib+"utils");
var CustomType = require("./customType.js");
var GeolocationType = CustomType.GeolocationSchema;
var ImageType=CustomType.ImageSchema;



var RatingSchema = new Schema({
	id_customer: {
		type: Schema.ObjectId, 
		ref: "Customer"
	},
	rating: Number,
	date: Date
});

var HourTime = new Schema({
	initial: Date,
	end: Date
});


var WeekTable = new Schema({
	times: [HourTime],
	day: {
		type: String, 
		enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
	}
});

var IntervalTable=new Schema({
	initial:Date,
	end:Date,
	week:WeekTable
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
	images: [ImageType],
	useLimit: Number,
	description: String,
	timesUsed: Number,
	ownCustomers: Boolean,
	services:[Schema.ObjectId],
	dateCreated: Date
});

var ServiceSchema = new Schema({
	id_name: { 
		type: Schema.ObjectId, 
		ref: "Service_name"
	},
	description: String,
    name:String,
	duration: Number,
	price: Number,
	rating: [RatingSchema],
	dateCreated: Date
});

var Resource = new Schema({
	name: String,
	surname: String,
	description: String,
	phone: String,
	picks: [Schema.ObjectId],
	services: [Schema.ObjectId],
	initDate: Date
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
	images: [ImageType],
	phone: [String],
	keywords: [String],
	web: String,
	location:{
		country: String,
		province: String,
		city: String,
		zipcode: String,
		address: String,
		geolocation: GeolocationType
	},
	category:{
		type: Schema.ObjectId, 
		ref: "Category",
		required: true
	},
	promotions: [PromotionSchema],
	services: [ServiceSchema],
	review: [ReviewSchema],
	resources: [Resource],
	intervalTable: [IntervalTable],

	customers: [{type: Schema.ObjectId, ref: "Customer"}],
	registerDate: Date,
	lastAccess: Date,
	lastUpdate: Date
	

});

CompanySchema.statics={
	search:function(params, cb){ 
		params = Utils.filterParams(params);
		var query;



			query = this.find({});
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
				case 'keywords':
					query.where(key).equals(Utils.likeLowerCase(params[key]));
					break;
				case 'idCompanies':
					query.where( {'_id': { $nin: params.idCompanies }});
					break;
				default:
					query.where(key).equals(Utils.like(params[key]));

			}
			
		}
	
		query.exec(function(err, companies){
			if(err) return cb(err);

			cb(null, companies);
		});	
	},
    
   modify:function(id_company, params, cb){
        this.findById(id_company, function(err, company){
			if(err) return cb(err);
		
		    if(!company)
				return cb("Company not found");

			company=Utils.mergeMongoObjects(company, params);
		
		
			
			
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
					if(result.nModified === 0){return cb("El usuario ya ha hecho un review");}
						
					cb();
	    });
	},

	newRateService: function(user, params, cb){
		this.findOne({_id: params.company_id},  function(err, company){
			if(err)return cb(err);
			if(!company)return cb("Company not found");

		
			var service = company.services.id(params.service_id);
			if(!service) return cb("Service not found in NewRateService");
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


		});
	},

	searchService: function(id_company, params, cb){
		var query;
		if(id_company !== 0){
			query = this.aggregate([{$unwind:"$services"},{$match: {_id: id_company}}]);
		}else if(params.category === undefined || params.category=== '')
			query = this.aggregate([{$unwind:"$services"}]);
		else
			query = this.aggregate([{$unwind:"$services"},{$match: {category :new mongoose.Types.ObjectId(params.category)}}]);
		
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
				case 'idDefaultNames':
					query.match( {'services.id_name': { '$in': params[key] }});
					break;
				case 'category': break;
				case 'location.country': 
				case 'location.city': 
					var field = ""+key;
					var match={};
					match[field] = Utils.like(params[key]);
					query.match(match);	
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

			if(id_company !== 0){		
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
				return cb("Service not found FindServiceById");
			
			cb(null, service);

		});
	},

	modifyService: function(id_company, id, params, cb){
		this.findOne({_id: id_company}, function(err, company){
			if(err) return cb(err);

		    if(!company)
				return cb("Company not found");
			var service = company.services.id(id);
			if(!service)
				return cb("Service not found in ModifyService");
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
				return cb("Service not found in DeleteService");

			company.services.id(id).remove();
			company.save(function(err){
				if(err) return cb(err);
				cb();
			});
		});
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


		});
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

		});
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
			});
		});
	},

    newResource: function(id_company, params, cb){
    	

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
		});
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
			});
		});
	},
	modifyResource: function(id_company, id, params, cb){
		this.findOne({_id: id_company}, function(err, company){
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

			var resource = company.resources.id(id);
			if(!resource)
				return cb("Resource not found");
			cb(null, resource);

		});
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

	toggleService: function(company_id, service_id, resource_id , cb){
		this.findOne({_id: company_id}, function(err, company){
			if(err) return cb(err);
		    if(!company)return cb("Company not found");

	    	var resource = company.resources.id(id_resource);
	    	if(!resource) return cb("Resource not found");
	    	if(resource.services.indexOf(id_service) == -1)
	    		resource.services.push(id_service);
	    	else
	    		return cb("Service already asigned");
			company.save(function(err){
				if(err) return cb(err);				
				cb();
			});

		});
        
        
       async.waterfall([
           function enable(next){
               this.update({_id: company_id, 
                   "resources._id":resource_id,
                   "resources.services":{$ne:service_id}},
                    {$addToSet:{"resources.$":service_id}}, function(err, result){
                   if(err)return next(err);
                   next(null, result.nModified);
               });
           },
           
           function disable(next){
                   if(modified===1)next();
                 this.update({_id: company_id, 
                   "resources._id":resource_id,
                   "resources.services":service_id},
                    {$unset:{"resources.$":service_id}}, function(err, result){
                   if(err)return next(err);
                   
                   if(result.nModified!==1)return next("No Toggle Service");
                   next();
               });
           }
           
       ], function(err){
           if(err)return cb(err);
           cb();
       });
        
	},

	getServicesAsigned: function(id_company, id_resource, cb){
		this.findOne({_id: id_company}, function(err, company){
			if(err) return cb(err);
		    if(!company)return cb("Company not found");

	    	var resource = company.resources.id(id_resource);
	    	if(!resource) return cb("Resource not found");
	    	cb(null, resource.services);
			
		});
	},

	formatReviews: function(id_company, cb){
		var query = this.aggregate(
		[   { "$project" : { "hourly" : "$review" } },
	    	{ "$unwind" : "$hourly" },
	    	{$match: {_id: id_company}},
		    {$group : {	        	
		           _id:   "$hourly.rating"  ,
		           count: { $sum: 1 },		          
		        }
		    },
	    ]);

		query.exec(function(err, reviewsRating){
			if(err) return cb(err);
			var reviewsFormat = {};
			var count=0;
			var avg=0;
			var reviesTotal=0;
			for(var i=1; i<6; i++){
				var posReview=-1;
				for(var x=0; x<reviewsRating.length; x++)
					if(reviewsRating[x]._id == i){
						posReview = x;
						break;
					}
				if(posReview != -1){
					reviewsFormat[i] =  reviewsRating[posReview].count;
					count++;
					avg+=(reviewsRating[posReview].count*i);
					reviesTotal+=reviewsRating[posReview].count;
				}else
					reviewsFormat[i] = 0;
			}
			if(reviesTotal > 0)
				avg = avg/reviesTotal;
			reviewsFormat.avg = Utils.round(avg, 0.5);

			cb(null, reviewsFormat);
		});
	},

	formatServideRating: function(id_company, id_service, cb){
		this.findServiceById(id_company, id_service, function(err, service){

			if(service.rating.length !== 0){
				var rate=0;

				for(var rating in service.rating)
					rate += service.rating[rating].rating;
			
				rate = rate / service.rating.length;
				return cb(null, Utils.round(rate));
			}else return cb(null, 0);
		});
	},

	asignPick: function(id_company, id_resource, id_pick, cb){
		this.findResourceById(id_company, id_resource, function(err, resource){
			if(err) return cb(err);
		    resource.picks.push(id_pick);
			cb();
		});
	},

};


function getServiceRating(services){		
	var rate =0;
	var rates=[];
	for(var service in services){
		if(services[service].services.rating.length !== 0){
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

