var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var C=require("../../config/config");

var HistoryPickSchema = new Schema({
	id_customer: { 
		type: Schema.ObjectId, 
		ref: "Customer"
	},
	company: {
		id_company:{
			type: Schema.ObjectId,
			ref: "Company",
			required: true
		},
		id_service: Schema.ObjectId
	},
	resource: Schema.ObjectId,
	initDate: Date,
	duration: Number,
	dateCreated: Date,
	deleteDate: Date,
	observation: String,
	promotion: Schema.ObjectId,
	nameCli: String,
	phoneCli: String,
	state: {
		type: String, 
		enum: ['pending', 'active', 'cancelled', 'finished'],
		required: true
	},
	origin: {
		type: String, 
		enum: ['prepick', 'mobile', 'manual', 'promotion']
		
	}
});

HistoryPickSchema.statics={
	search:function(params, cb){ //en params no meter id, todos los demas datos si
		var query = this.find({}).sort({initDate: 1});
		for(var key in params){
			switch(key){
				case "id_customer":  
				case "company.id_company":
				case "company.id_service":
					query.where(key).equals(params[key].toString());
					break;	
				case 'toInitDate':
					query.where('initDate').lt(params[key]);
					break;
				case 'fromInitDate':
					query.where('initDate').gt(params[key]);
					break;		
				case 'toDateCreated':
					query.where('dateCreated').lt(params[key]);
					break;
				case 'fromDateCreated':
					query.where('dateCreated').gt(params[key]);
					break;
				case 'picks': 
					query.where( {'_id': { '$in': params[key] }});
					break;
				case 'state': 
					query.where( {'state': { '$in': params[key] }});
					break;
				case 'origin': 
					query.where( {'origin': { '$in': params[key] }});
					break;
				case 'toDeleteDate':
					query.where('deleteDate').lt(params[key]);
					break;
				case 'fromDeleteDate':
					query.where('deleteDate').gt(params[key]);
					break;
				default:
					query.where(key).equals(Utils.like(params[key]));
			}
		}	
		query.exec(cb);
		
	}
};

module.exports = mongoose.model("Historypick", HistoryPickSchema);