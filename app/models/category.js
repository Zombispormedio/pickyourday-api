var C = require("../../config/config");

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Utils = require(C.lib + "utils");
var Error = require(C.lib + "error")();
var CustomType = require("./customType.js");
var ImageType = CustomType.ImageSchema;

var CategorySchema = new Schema({
	name: {
		type: String,
		unique: true,
		required: true
	},
	description: String,
	image: ImageType,
    icon: ImageType,
    color: String
});


CategorySchema.statics = {
	getQuery: function (params) { //en params no meter id, todos los demas datos si
		var query = this.find({});
		for (var key in params) {
			switch (key) {
				case "name":
					query.where(key).equals(Utils.like(params[key]));
					break;
				case "description":
					query.where(key).equals(Utils.like(params[key]));
					break;
				case "search_text": {
					var val = params[key];
					var or_seq = [
                        { "name": { "$regex": Utils.like(val) } },
                        { "description": { "$regex": Utils.like(val) } },
						{ "color": { "$regex": Utils.like(val) } },
						{ "image.src": { "$regex": Utils.like(val) } },
						{ "image.alt": { "$regex": Utils.like(val) } },
						{ "icon.src": { "$regex": Utils.like(val) } },
						{ "icon.alt": { "$regex": Utils.like(val) } },
                    ];
					if (Utils.isValidObjectID(val)) {
                        or_seq.push({ "_id": mongoose.Types.ObjectId(val) });
                    }


                    query.or(or_seq);


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
        this.getQuery(params).exec(function(err, result){
			if(err)return cb(Error.mongo_find("SearchCategoryModel", err))
			
			cb(null, result);
		});
    },

	modify: function (id, params, cb) {
		var local="ModifyCategoryModel";
		
		this.findById(id, function (err, category) {
			if (err) return cb(Error.mongo_find(local, err));

			if (!category)
				return cb(Error.no_data(local));


			category = Utils.mergeMongoObjects(category, params);


			category.save(function (err, result) {
				if (err) return cb(Error.mongo_save(local, err));

				cb();
			});

		});
	}
};

module.exports = mongoose.model("Category", CategorySchema);