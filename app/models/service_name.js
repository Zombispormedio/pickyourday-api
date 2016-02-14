var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var C = require("../../config/config");

var Utils = require(C.lib+"utils");



var Service_NameSchema = new Schema({
	name : {
		type: String,
		unique: true,
		required: true
	},
	duration: Number,
	keywords: [String],
	description: String
});

Service_NameSchema.statics={
	search:function(params, cb){ //en params no meter id, todos los demas datos si
		var query = this.find({});
		for(var key in params){

			switch(key){
				case 'greaterDuration':
					query.where('duration').gte(params[key]);
					break;
				case 'lessDuration':
					query.where('duration').lte(params[key]);
					break;
				default:
					query.where(key).equals(Utils.like(params[key]));
			}
		}
		var self = this;
		query.exec(function(err, defaultNames){
			if(err) return cb(err);
			if(params.name != null || params.name != ""){
				//var name = Utils.removeAccents(params.name);
				self.find({'keywords': Utils.likeLowerCase(name)}).exec(function(err, defaultNameKeyword){
					
					if(err) return cb(err);
					return cb(null, defaultNameKeyword);
				});
			}
			cb(null, defaultNames);
		});		
	},

	modify: function(id, params, cb){
		this.findById(id, function(err, serviceName){
			if(err) return cb(err);

		    if(!serviceName)
				return cb("Service name not found");

			for(var key in params){
				serviceName[key] = params[key];
			}

			serviceName.save(function(err){
				if(err) return cb(err);				
				cb();
			});

		});
	}

};

module.exports = mongoose.model("Service_Name", Service_NameSchema);