var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var C=require("../../config/config");
var Utils=require(C.lib+"utils");

var PickSchema = new Schema({
	id_customer: { 
		type: Schema.ObjectId, 
		ref: "Customer",
		required: true
	},
	company: {
		id_company:{
			type: Schema.ObjectId,
			ref: "Company",
			required: true
		},
		id_service:{		
			type: Schema.ObjectId,
			required: true
		}
	},
	initDate: {
		type: Date,
		required: true
	},
	dateCreated: Date,
	observation: String,
	state: {
		type: String, 
		enum: ['pending', 'active', 'cancelled', 'finished'],
		required: true
	}
});


PickSchema.statics={
	search:function(params, cb){ //en params no meter id, todos los demas datos si
		var query = this.find({});
		for(var key in params){

			switch(key){

				case "id_customer":  
				case "company.id_company":
				case "id_service":
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
				default:
					query.where(key).equals(Utils.like(params[key]));
			}
		}	
		query.exec(cb);
		
	}

};

module.exports = mongoose.model("Pick", PickSchema);