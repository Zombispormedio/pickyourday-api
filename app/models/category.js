var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var C = require("../../config/config");

var Utils=require(C.lib+"utils");
var CustomType = require("./customType.js");
var ImageType=CustomType.ImageSchema;

var CategorySchema = new Schema({
	name : {
		type: String,
		unique: true,
		required: true
	},
	description: String,
	image: ImageType, 
    icon: ImageType,
    color:String
});


CategorySchema.statics={
	search:function(params, cb){ //en params no meter id, todos los demas datos si
		var query = this.find({});
		for(var key in params){
			query.where(key).equals(Utils.like(params[key]));
		}
		query.exec(cb);	
	},

	modify: function(id, params, cb){
		this.findById(id, function(err, category){
			if(err) return cb(err);

		    if(!category)
				return cb("Category not found");
                
                
            	category=Utils.mergeMongoObjects(category, params);
           

			category.save(function(err, result){
				if(err) return cb(err);			
               
				cb();
			});

		});
	}
};

module.exports = mongoose.model("Category", CategorySchema);