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
	rating: Number
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
	ownCustomers: Boolean
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
	photos: [String],
	phone: [String],
	keywords: [String],
	locations:[{
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
	customers: [{type: Schema.ObjectId, ref: "Customer"}],
	registerDate: Date,
	lastAccess: Date,
	lastUpdate: Date
	

});

CompanySchema.statics={
	search:function(params, cb){ 
		var query = this.find({});
		for(var key in params){
			query.where(key).equals(Utils.like(params[key]));
		}
		
		query.exec(cb);	
	},

	newReview: function(user, params, cb){
		//{$addToSet: {'review.id_customer': user}},
		this.findOneAndUpdate({_id: params.company_id},  {$addToSet:{review:{id_customer: user}}}, {safe:true, upsert:true, new:true},  function(err, company){
			if(err)return cb(err);
			if(!company)return cb("Company not found");

			var service = company.services.id(params.service_id);
			//review.id_customer = user;
			review.rating = params.rating;
			review.description = params.description;
			review.date = new Date();

			company.save(function(err){
				if(err) return cb(err);				
				cb();
			});
		});
	},

	newRateService: function(user, params, cb){
		this.findOne({_id: params.company_id},  function(err, company){
			if(err)return cb(err);
			if(!company)return cb("Company not found");

		
			var service = company.services.id(params.service_id);
			if(!service) return cb("Service not found");
			service.rating.push( {id_customer: user, rating: params.rating});
			company.save(function(err){
				if(err) return cb(err);				
				cb();
			});

		});
	},

	newService: function(user, params, cb){
		this.findOne({_id: user}, function(err, company){
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

	searchService: function(user, params, cb){
		var query = this.aggregate([{$unwind:"$services"},{$match: {_id: user}}]);
		var greaterRating=false;
		var lessRating=false;
		for(var key in params){
			switch(key){
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
			if(greaterRating || lessRating)	{
				var rates = getServiceRating(companyService);
				var noDeleted=0;
				for(var rate in rates){	
					if (!(params.greaterRating <= rates[rate] <= params.lessRating)){
						console.log(params.greaterRating, rates[rate], params.lessRating );	
					
						companyService.splice(noDeleted,noDeleted+1);

					}else
					noDeleted++;
				}
			}
			
			var services = companyService.map(function(a){
				return a.services;
			});
			cb(null, services);
		});

	},

	findServiceById: function(user, id, cb){
		this.findOne({_id: user}, function(err, company){

			if(err) return cb(err);

		    if(!company)
				return cb("Company not found");

			var service = company.services.id(id);
			if(!service)
				return cb("Service not found");
			cb(null, service);

		})
	},

	modifyService: function(user, id, params, cb){
		this.findOne({_id: user}, function(err, company){
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

	deleteService: function(user, id, cb){
		this.findOne({_id: user}, function(err, company){
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
	}

	

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

