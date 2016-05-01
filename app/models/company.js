var C = require("../../config/config");

var async = require("async");
var _ = require("lodash");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;


var Utils = require(C.lib + "utils");
var CustomType = require("./customType.js");
var GeolocationType = CustomType.GeolocationSchema;
var ImageType = CustomType.ImageSchema;


var RatingSchema = new Schema({
	id_customer: {
		type: Schema.ObjectId,
		ref: "Customer"
	},
	rating: Number,
	date: Date
});


var WeekTable = new Schema({
	times: [String],
	day: {
		type: String,
		enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
	}
});

var IntervalTable = new Schema({
	initial: Date,
	end: Date,
	week: [WeekTable]
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
	services: [Schema.ObjectId],
	discount: Number,
	dateCreated: Date,
	state: {
		type: String,
		enum: ['waiting', 'started', 'spent', 'finished']
	}
});

var ServiceSchema = new Schema({
	id_name: {
		type: Schema.ObjectId,
		ref: "Service_name"
	},
	description: String,
    name: String,
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
	cif: {
		type: String,
		unique: true,
		required: true
	},
	email: {
		type: String,
		unique: true,
		required: true
	},
	emailSecond: [String],
	name: {
		type: String,
		required: true
	},
	description: String,
	images: [ImageType],
	phone: [String],
	keywords: [String],
	web: String,
	location: {
		country: String,
		province: String,
		city: String,
		zipcode: String,
		address: String,
		geolocation: GeolocationType
	},
	category: {
		type: Schema.ObjectId,
		ref: "Category",
		required: true
	},
	promotions: [PromotionSchema],
	services: [ServiceSchema],
	review: [ReviewSchema],
	resources: [Resource],
	scheduleActivity: [IntervalTable],

	customers: [{ type: Schema.ObjectId, ref: "Customer" }],
	registerDate: Date,
	lastAccess: Date,
	lastUpdate: Date,
	state: {
		type: String,
		enum: ['active', 'demo', 'pending', 'refused']
	},

	premium: Boolean,
	dateExpire: Date,
	datePayment: Date,
	
	ra_settings:{
		marker_id:Number,
		animation_url:String
	}


});

CompanySchema.statics = {
	getQuery: function (params, isState) {
		if (isState && (!params.state || params.state === ""))
			params.state = "active";
		params = Utils.filterParams(params);
		var query;

		query = this.find({});
		for (var key in params) {
			switch (key) {
				case 'cif':
				case "name":
				case 'category':
					query.where(key).equals(params[key]);
					break;
				case 'toRegister':
					query.where('registerDate').lt(params[key]);
					break;
				case 'fromRegister':
					query.where('registerDate').gt(params[key]);
					break;
				case 'toLastUpdate':
					query.where('lastUpdate').lt(params[key]);
					break;
				case 'fromLastUpdate':
					query.where('lastUpdate').gt(params[key]);
					break;
				case 'toAccess':
					query.where('lastAccess').lt(params[key]);
					break;
				case 'fromAccess':
					query.where('lastAccess').gt(params[key]);
					break;
				case 'keywords':
					query.where(key).equals(Utils.likeLowerCase(params[key]));
					break;
				case 'idCompanies':
					query.where({ '_id': { $nin: params.idCompanies } });
					break;
				case "search_text": {
					var val = params[key];
					var or_seq=[
                        { "cif": { "$regex": Utils.like(val) } },
                        { "email": { "$regex": Utils.like(val) } },
                        { "emailSecond": { "$regex": Utils.like(val) } },
						{ "name": { "$regex": Utils.like(val) } },
						{ "description": { "$regex": Utils.like(val) } },
						{ "phone": { "$regex": Utils.like(val) } },
						{ "keywords": { "$regex": Utils.like(val) } },
						{ "web": { "$regex": Utils.like(val) } },
                        { "location.country": { "$regex": Utils.like(val) } },
						{ "location.province": { "$regex": Utils.like(val) } },
						{ "location.city": { "$regex": Utils.like(val) } },
						{ "location.zipcode": { "$regex": Utils.like(val) } },
						{ "location.address": { "$regex": Utils.like(val) } }
                    ];
					
					 if(Utils.isValidObjectID(val)){
                        or_seq.push( { "_id":mongoose.Types.ObjectId(val)  });
                    }
                    query.or(or_seq);
					
                    
                    break;
                }
				case 'email': {
					var val = params[key];
                    query.or([
						{ "email": val },
                        { "emailSecond": val },
					]);
					break;
				}
				case "country":
					query.where("location.country").equals(Utils.like(params[key]));
					break;
				case "province":
					query.where("location.province").equals(Utils.like(params[key]));
					break;
				case "city":
					query.where("location.city").equals(Utils.like(params[key]));
					break;
				case "zipcode":
					query.where("location.zipcode").equals(Utils.like(params[key]));
					break;
				case "address":
					query.where("location.address").equals(Utils.like(params[key]));
					break;
				case "phone": {
					query.where(key).equals(Utils.like(params[key]));
					break;
				}
				case "service": {
					query.where("services.id_name").equals(params[key]);
					break;
				}
				
				case "keywords_seq": {
				var val=params[key].split(",");
				query.where("keywords").in(val);
					break;
				}



				case "p": {
                    var p = params[key];

                    var s = Number(params.s) || C.pagination;

                    var skip = s * p;

                    query.skip(skip);
                    query.limit(s);
                    break;
                }



			}

		}

		return query;
	},

	search: function (params, cb) {
        this.getQuery(params, true).exec(cb);
    },

	modify: function (id_company, params, cb) {
        this.findById(id_company, function (err, company) {
			if (err) return cb(err);
			if (!company)
				return cb("Company not found");

			company = Utils.mergeMongoObjects(company, params);

			company.lastUpdate = new Date();

			company.save(function (err) {
				if (err) return cb(err);
				cb();
			});

		});
    },


	newReview: function (user, params, cb) {
		var review = {};
		review.id_customer = user;
		review.rating = params.rating;
		review.description = params.description;
		review.date = new Date();
		this.update(
			{ _id: params.company_id, 'review.id_customer': { $ne: user } },
			{ $addToSet: { review: review } }, function (err, result) {

				if (err) return cb(err);
				if (result.nModified === 0) { return cb("El usuario ya ha hecho un review"); }

				cb();
			});
	},
	searchReview: function (customer, company, cb) {
		var query;
		query = this.aggregate([{ $unwind: "$review" }, { $match: { _id: new mongoose.Types.ObjectId(company) } }]);

		query.match({ 'review.id_customer': new mongoose.Types.ObjectId(customer) });

		query.exec(function (err, companyReview) {
			if (err) return cb(err);
			if (!companyReview) return cb(null, []);
			if (companyReview.length === 0) return cb(null, []);
			cb(null, companyReview[0].review);
		});
	},

	newRateService: function (user, params, cb) {
		this.findOne({ _id: params.company_id }, function (err, company) {
			if (err) return cb(err);
			if (!company) return cb("Company not found");


			var service = company.services.id(params.service_id);
			if (!service) return cb("Service not found in NewRateService");
			service.rating.push({ id_customer: user, rating: params.rating, date: new Date() });
			company.save(function (err) {
				if (err) return cb(err);
				cb();
			});

		});
	},

	newService: function (id_company, params, serviceName, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);
			if (!company) return cb("Company not found");

			company.services.push(params);
			var service = company.services[company.services.length - 1];
			service.dateCreated = new Date();
			if (service.duration == "" || !service.duration || service.duration < 5)
				service.duration = serviceName.duration;
			company.save(function (err) {
				if (err) return cb(err);
				cb();
			});


		});
	},

	searchService: function (id_company, params, cb) {
		var query;
		if (!params.state || params.state == "")
			params.state = "active";
		if (id_company !== 0) {
			query = this.aggregate([{ $unwind: "$services" }, { $match: { _id: id_company, state: params.state } }]);
		} else if (params.category === undefined || params.category === '')
			query = this.aggregate([{ $unwind: "$services" }, { $match: { state: params.state } }]);
		else
			query = this.aggregate([{ $unwind: "$services" }, { $match: { category: new mongoose.Types.ObjectId(params.category), state: params.state } }]);

		var greaterRating = false;
		var lessRating = false;

		for (var key in params) {
			switch (key) {
				case 'id_name':
					var field = "services." + key;
					var match = {};
					match[field] = params[key];
					query.match(match);
					break;
				case 'state': break;
				case 'beforeDateCreated':
					query.match({ 'services.dateCreated': { '$lte': new Date(params[key]) } });
					break;
				case 'afterDateCreated':
					query.match({ 'services.dateCreated': { '$gte': new Date(params[key]) } });
					break;
				case 'greaterPrice':
					query.match({ 'services.price': { '$gte': parseFloat(params[key]) } });
					break;
				case 'lessPrice':
					query.match({ 'services.price': { '$lte': parseFloat(params[key]) } });
					break;
				case 'greaterDuration':
					query.match({ 'services.duration': { '$gte': parseInt(params[key]) } });
					break;
				case 'lessPrice':
					query.match({ 'services.duration': { '$gte': parseInt(params[key]) } });
					break;
				case 'greaterRating':
					greaterRating = true;
					break;
				case 'lessRating':
					lessRating = true;
					break;
				case 'idDefaultNames':
					query.match({ 'services.id_name': { '$in': params[key] } });
					break;
				case 'category': break;
				case 'location.country':
				case 'location.city': {
					var field = "" + key;
					var match = {};
					match[field] = Utils.like(params[key]);
					query.match(match);
					break;
                }
				default: {
					var field = "services." + key;
					var match = {};
					match[field] = Utils.like(params[key]);
					query.match(match);
                }
			}
		}

		query.exec(function (err, companyService) {

			if (companyService.length != 0)
				if (greaterRating || lessRating) {
					var rates = getServiceRating(companyService);
					var noDeleted = 0;
					for (var rate in rates) {
						if (params.greaterRating && params.lessRating) {
							if (!(rates[rate] >= params.greaterRating && rates[rate] <= params.lessRating))
								companyService.splice(noDeleted, 1);
							else
								noDeleted++;
						} else if (params.greaterRating && rates[rate] <= params.greaterRating) {
							companyService.splice(noDeleted, 1);
						} else if (params.lessRating && rates[rate] >= params.lessRating) {
							companyService.splice(noDeleted, 1);
						} else
							noDeleted++;
					}
				}

			if (id_company !== 0) {
				var services = companyService.map(function (a) {
					return a.services;
				});
				return cb(null, services);
			}



			cb(null, companyService);
		});

	},

	findServiceById: function (id_company, id, cb) {
		this.findOne({ _id: id_company }, function (err, company) {

			if (err) return cb(err);

			if (!company)
				return cb("Company not found");

			var service = company.services.id(id);
			if (!service)
				return cb("Service not found FindServiceById");

			cb(null, service);

		});
	},

	modifyService: function (id_company, id, params, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);

			if (!company)
				return cb("Company not found");
			var service = company.services.id(id);
			if (!service)
				return cb("Service not found in ModifyService");
			for (var key in params) {
				service[key] = params[key];
			}

			company.lastUpdate = new Date();

			company.save(function (err) {
				if (err) return cb(err);
				cb();
			});

		});
	},

	deleteService: function (id_company, id, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);

			if (!company)
				return cb("Company not found");

			if (!company.services.id(id))
				return cb("Service not found in DeleteService");

			company.services.id(id).remove();
			company.lastUpdate = new Date();
			company.save(function (err) {
				if (err) return cb(err);
				cb();
			});
		});
	},

	newPromotion: function (id_company, params, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);
			if (!company) return cb("Company not found");

			company.promotions.push(params);
			var promotion = company.promotions[company.promotions.length - 1];
			var now = new Date();
			promotion.dateCreated = now;
			if (promotion.initDate < now) {
				promotion.state = "started";
			} else promotion.state = "waiting";

			promotion.timesUsed = 0;
			company.lastUpdate = new Date();
			company.save(function (err) {
				if (err) return cb(err);
				cb();
			});


		});
	},

	searchPromotion: function (id_company, params, cb) {
		if (!params.state || params.state == "")
			params.state = "active";
		if (id_company == 0)
			var query = this.aggregate([{ $unwind: "$promotions" }, { $match: { state: params.state } }]);
		else
			var query = this.aggregate([{ $unwind: "$promotions" }, { $match: { _id: new mongoose.Types.ObjectId(id_company), state: params.state } }]);

		for (var key in params) {
			switch (key) {
				case 'state': break;
				case 'statePromotion':
					query.match({ 'promotions.state': params.statePromotion });
					break;
				case 'beforeInitDate':
					query.match({ 'promotions.initDate': { '$lte': new Date(params[key]) } });
					break;
				case 'afterInitDate':
					query.match({ 'promotions.initDate': { '$gte': new Date(params[key]) } });
					break;
				case 'beforeEndDate':
					query.match({ 'promotions.endDate': { '$lte': new Date(params[key]) } });
					break;
				case 'afterEndDate':
					query.match({ 'promotions.endDate': { '$gte': new Date(params[key]) } });
					break;
				case 'greaterUseLimit':
					query.match({ 'promotions.useLimit': { '$gte': parseInt(params[key]) } });
					break;
				case 'lessUseLimit':
					query.match({ 'promotions.useLimit': { '$gte': parseInt(params[key]) } });
					break;
				case 'greaterTimeUsed':
					query.match({ 'promotions.timesUsed': { '$gte': parseInt(params[key]) } });
					break;
				case 'lessTimeUsed':
					query.match({ 'promotions.timesUsed': { '$gte': parseInt(params[key]) } });
					break;
				case 'beforeDateCreated':
					query.match({ 'promotions.dateCreated': { '$lte': new Date(params[key]) } });
					break;
				case 'afterDateCreated':
					query.match({ 'promotions.dateCreated': { '$gte': new Date(params[key]) } });
					break;
				case 'service':
					query.match({ 'promotions.services': new mongoose.Types.ObjectId(params.service) });
					break;
				default:
					var field = "promotions." + key;
					var match = {};
					match[field] = Utils.like(params[key]);
					query.match(match);
			}
		}

		query.exec(function (err, companyPromotion) {
			cb(null, companyPromotion);
		});
	},

	findPromotionById: function (id_company, id, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);
			if (!company) return cb([]);

			var promotion = company.promotions.id(id);
			if (!promotion)
				return cb([]);
			cb(null, promotion);

		});
	},

	modifyPromotion: function (id_company, id, params, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);
			if (!company) return cb("Company not found");

			var promotion = company.promotions.id(id);
			if (!promotion)
				return cb("Promotion not found");
			for (var key in params) {
				promotion[key] = params[key];
			}

			company.lastUpdate = new Date();
			company.save(function (err) {
				if (err) return cb(err);
				cb();
			});

		});
	},

	deletePromotion: function (id_company, id, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);
			if (!company) return cb("Company not found");

			if (!company.promotions.id(id))
				return cb("Promotion not found");

			company.promotions.id(id).remove();
			company.lastUpdate = new Date();
			company.save(function (err) {
				if (err) return cb(err);
				cb();
			});
		});
	},

    newResource: function (id_company, params, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);
			if (!company) return cb("Company not found");

			company.resources.push(params);
			var resource = company.resources[company.resources.length - 1];
			resource.initDate = new Date();
			company.lastUpdate = new Date();
			company.save(function (err) {
				if (err) return cb(err);
				cb();
			});
		});
    },

    deleteResource: function (company_id, resource_id, cb) {
		this.findOne({ _id: company_id }, function (err, company) {
			if (err) return cb(err);
			if (!company) return cb("Company not found DeleteResource");

            var index = _.findIndex(company.resources, function (o) { return o._id.equals(resource_id); });
			if (index == -1)
				return cb("Resource not found Delete Resource");

			company.resources.splice(index, 1);
			company.lastUpdate = new Date();
			company.save(function (err) {
				if (err) return cb(err);
				cb();
			});
		});
	},
	modifyResource: function (id_company, id, params, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);
			if (!company) return cb("Company not found");

			var resource = company.resources.id(id);
			if (!resource)
				return cb("Resource not found");
			for (var key in params) {
				resource[key] = params[key];
			}
			company.lastUpdate = new Date();
			company.save(function (err) {
				if (err) return cb(err);
				cb();
			});

		});
	},

	findResourceById: function (id_company, id, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);
			if (!company) return cb("Company not found");

			var resource = company.resources.id(id);
			if (!resource)
				return cb("Resource not found");
			cb(null, resource);

		});
	},

    searchResources: function (id_company, params, cb) {
		if (!params.state || params.state == "")
			params.state = "active";
		var query = this.aggregate([{ $unwind: "$resources" }, { $match: { _id: new mongoose.Types.ObjectId(id_company), state: params.state } }]);
		for (var key in params) {
			switch (key) {
				case 'state': break;
				case 'beforeInitDate':
					query.match({ 'resources.initDate': { '$lte': new Date(params[key]) } });
					break;
				case 'afterInitDate':
					query.match({ 'resources.initDate': { '$gte': new Date(params[key]) } });
					break;
				case 'service':
					query.match({ 'resources.services': new mongoose.Types.ObjectId(params.service) });
					break;
				case 'format': break;
				default:
					var field = "resources." + key;
					var match = {};
					match[field] = Utils.like(params[key]);
					query.match(match);
			}
		}

		query.exec(function (err, companyResource) {
			companyResource = companyResource || [];

			var resources = companyResource.map(function (a) {
				return a.resources;
			});
			cb(null, resources);
		});
	},

	toggleService: function (company_id, service_id, resource_id, cb) {
        var self = this;
		async.waterfall([
			function enable(next) {
				self.update({
					_id: company_id,
					"resources._id": resource_id,
				},
                    { $addToSet: { "resources.$.services": service_id } }, function (err, result) {
						if (err) return next(err);

						next(null, result.nModified);
					});
			},

			function disable(modified, next) {
                if (modified === 1) return next();

				self.findOne({
					_id: company_id,
					"resources._id": resource_id
				}, function (err, result) {
					if (err) return next(err);
					if (!result) return next("Not Found Toggle Service");
					var indexResources = _.findIndex(result.resources, function (o) { return o._id.equals(resource_id); });
					if (indexResources == -1) return next("Not found Resource Toggle Service");

					var resource = result.resources[indexResources];

					var indexService = _.findIndex(resource.services, function (o) { return o.equals(service_id); });
					if (indexService == -1) return next("Not found Service Toggle Service");

					resource.services.splice(indexService, 1);

					result.save(function (err) {
						if (err) return next(err);
						next();
					});
				});
			}

		], function (err) {
			if (err) return cb(err);
			cb();
		});
	},

	getServicesAsigned: function (id_company, id_resource, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);
			if (!company) return cb("Company not found");

			var resource = company.resources.id(id_resource);
			if (!resource) return cb("Resource not found");
			cb(null, resource.services);

		});
	},

	formatReviews: function (id_company, cb) {
		var query = this.aggregate(
			[{ "$project": { "hourly": "$review" } },
				{ "$unwind": "$hourly" },
				{ $match: { _id: id_company } },
				{
					$group: {
						_id: "$hourly.rating",
						count: { $sum: 1 },
					}
				},
			]);

		query.exec(function (err, reviewsRating) {
			if (err) return cb(err);
			var reviewsFormat = {};
			var count = 0;
			var avg = 0;
			var reviesTotal = 0;
			for (var i = 1; i < 6; i++) {
				var posReview = -1;
				for (var x = 0; x < reviewsRating.length; x++)
					if (reviewsRating[x]._id == i) {
						posReview = x;
						break;
					}
				if (posReview != -1) {
					reviewsFormat[i] = reviewsRating[posReview].count;
					count++;
					avg += (reviewsRating[posReview].count * i);
					reviesTotal += reviewsRating[posReview].count;
				} else
					reviewsFormat[i] = 0;
			}
			if (reviesTotal > 0)
				avg = avg / reviesTotal;
			reviewsFormat.avg = Utils.round(avg, 0.5);

			cb(null, reviewsFormat);
		});
	},

	formatServideRating: function (id_company, id_service, cb) {
		this.findServiceById(id_company, id_service, function (err, service) {

			if (service.rating.length !== 0) {
				var rate = 0;

				for (var rating in service.rating)
					rate += service.rating[rating].rating;

				rate = rate / service.rating.length;
				return cb(null, Utils.round(rate));
			} else return cb(null, 0);
		});
	},

	asignPick: function (id_company, id_resource, id_pick, id_service, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);
			if (company) {
				var resource = company.resources.id(id_resource);
				if (resource) {
					var serviceFound = false;

					if (resource.services)
						for (service in resource.services) {
							if (resource.services[service].equals(id_service)) {
								serviceFound = true;
								break;
							}
						}


					if (serviceFound) {
						if (resource.picks)
							resource.picks.push(id_pick);
						else {
							resource.picks = [];
							resource.picks.push(id_pick);
						}


						company.save(function (err) {
							if (err) return cb(err);
							cb();
						});
					} else cb(-1);
				} else cb(-1);
			} else cb(-1);

		});
	},

	removePickAsigned: function (id_company, id_pick, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);
			if (company) {
				var resources = company.resources;
				for (var r in resources) {
					var found = false;
					if (resources[r].picks) {
						for (var p in resources[r].picks) {
							if (resources[r].picks[p].equals(id_pick)) {
								console.log("borrar");
								resources[r].picks.splice(p, 1);
								found = true;
								break;
							}
						}
					}
					if (found) break;
				}
				company.save(function (err) {
					if (err) return cb(err);
					cb();
				});
			}
		});
	},


	servicePromoted: function (id_company, id_service, cb) {
		var params = { 'service': id_service };

		this.searchPromotion(id_company, params, function (err, promotion) {
			if (err) cb(err);

			if (promotion && promotion.length > 0)
				cb(null, promotion[0]);
			else
				cb(null, null);
		})
	},

	usePromotion: function (id_company, id_promotion, cb) {
		this.findOne({ _id: id_company }, function (err, company) {
			if (err) return cb(err);
			if (company) {
				var promotion = company.promotions.id(id_promotion);
				if (promotion && promotion.useLimit > 0) {
					promotion.timesUsed = promotion.timesUsed + 1;
					if (promotion.timesUsed >= promotion.useLimit) {
						promotion.state = "spent";
					}

					company.save(function (err) {
						if (err) return cb(err);
						cb();
					});
				} else cb(-1);
			} else cb(-1);
		});
	}
};


function getServiceRating(services) {
	var rate = 0;
	var rates = [];
	for (var service in services) {
		if (services[service].services.rating.length !== 0) {
			for (var rating in services[service].services.rating) {
				rate += services[service].services.rating[rating].rating;
			}
			rate = rate / services[service].services.rating.length;
		}
		rates.push(rate);
		rate = 0;
	}
	return rates;
}




module.exports = mongoose.model("Company", CompanySchema);

