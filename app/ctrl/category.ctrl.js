
var C=require("../../config/config");

var CategoryModel = require(C.models+"category");
var Controller = {};

Controller.new = function (body, cb) {
	if (!body || !body.name) return cb("Fields not Filled");
	
	var category = new CategoryModel(body);
	category.save(function (err, result) {
		if (err) return cb(err);
		cb(null, result);
	});
};

Controller.search = function(query, cb){
	CategoryModel.search(query, function(err, categories){
		if(err) return cb(err);

		if(!categories)
			return cb("Categories not found");
		
		cb(null, categories);

	});
};

Controller.findById = function(id, cb){
	CategoryModel.findById(id, function(err, category){
		if(err) return cb(err);	
		if(!category)return ("Category not found");

		cb(null, category);
	});
};

Controller.modify = function(id, body,cb){
	if(!body || !id )
		return cb("Fields not filled");

	CategoryModel.modify(id, body, function(err){
		if(err) return cb(err);		
		cb();
	});
};


Controller.delete = function(id, cb){
	if (!id) return cb("Fields not Filled");

	CategoryModel.findByIdAndRemove(id, function (err,category){
    	if(err) return cb(err);

		if(!category)
			return cb("Category not deleted");	
		cb();
	});
};


	
module.exports = Controller;