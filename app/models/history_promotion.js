var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var C=require("../../config/config");
var CustomType = require("./customType.js");

var ImageType=CustomType.ImageSchema;

var HistoryPromotionSchema = new Schema({
	name: String,
	initDate: Date,
	endDate:Date,
	deleteDate: Date,
	images: [ ImageType],
	useLimit: Number,
	description: String,
	timesUsed: Number,
	ownCustomers: Boolean,
	company: Schema.ObjectId,
	discount: Number,
	dateCreated: Date,
	services:[Schema.ObjectId],
	idPromotion: String, 
	state: {
		type: String, 
		enum: ['waiting', 'started', 'spent', 'finished']
	}

});

HistoryPromotionSchema.statics={
		search:function(params, cb){ //en params no meter id, todos los demas datos si
		var query = this.find({}).sort({initDate: 1});
		for(var key in params){
			switch(key){
				case "company":  
					query.where(key).equals(params[key].toString());
					break;	
				case 'beforeInitDate':
					query.where('initDate').lt(params[key]);
					break;
				case 'afterInitDate':
					query.where('initDate').gt(params[key]);
					break;		
				case 'beforeDateCreated':
					query.where('dateCreated').lt(params[key]);
					break;
				case 'afterDateCreated':
					query.where('dateCreated').gt(params[key]);
					break;
				case 'beforeDeleteDate':
					query.where('deleteDate').lt(params[key]);
					break;
				case 'afterDeleteDate':
					query.where('deleteDate').gt(params[key]);
					break;
				case 'services': 
					query.where( {'_id': { '$in': params[key] }});
					break;
				case 'state': 
					query.where( {'state': { '$in': params[key] }});
					break;
				case 'greaterUseLimit':
					query.where({'useLimit' : {'$gte' : parseInt(params[key])}});
					break;
				case 'lessUseLimit':
					query.where({'useLimit' : {'$gte' : parseInt(params[key])}});
					break;
				case 'greaterTimeUsed':
					query.where({'timesUsed' : {'$gte' : parseInt(params[key])}});
					break;
				case 'lessTimeUsed':
					query.where({'timesUsed' : {'$gte' : parseInt(params[key])}});
					break;
				case 'idPromotion':
					query.where({'idPromotion': params[key].toString()});
					break;
				default:
					query.where(key).equals(Utils.like(params[key]));
			}
		}	
		query.exec(cb);
		
	}


};


module.exports = mongoose.model("HistoryPromotion", HistoryPromotionSchema);