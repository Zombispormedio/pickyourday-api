var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var C = require("../../config/config");

var Utils = require(C.lib + "utils");



var Service_NameSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    duration: Number,
    keywords: [String],
    description: String,
    price: Number,
    dateCreated: Date,
    category: {
        type: Schema.ObjectId,
        ref: "Category"
    }
});

Service_NameSchema.statics = {
    getQuery: function (params) { //en params no meter id, todos los demas datos si
        params = Utils.filterParams(params);
        var query = this.find({});
        for (var key in params) {
            switch (key) {
                case 'greaterDuration':
                    query.where('duration').gte(params[key]);
                    break;
                case 'lessDuration':
                    query.where('duration').lte(params[key]);
                    break;

                case 'greaterPrice':
                    query.where('price').gte(params[key]);
                    break;
                case 'lessPrice':
                    query.where('price').lte(params[key]);
                    break;
                case 'beforeDateCreated':
                    query.where('dateCreated').lt(params[key]);
                    break;
                case 'afterDateCreated':
                    query.where('dateCreated').gt(params[key]);
                    break;
                case 'category':
                    query.where("category").equals(new mongoose.Types.ObjectId(params.category));
                    break;
                case "search_text": {
                    var val = params[key];
                    var or_seq = [
                        { "name": { "$regex": Utils.like(val) } },
                        { "keywords": { "$regex": Utils.like(val) } },
                        { "description": { "$regex": Utils.like(val) } },
                    ];

                    if (Utils.isValidObjectID(val)) {
                        or_seq.push({ "category": mongoose.Types.ObjectId(val) });
                    }
                    query.or(or_seq);


                    break;
                }
                case "by_name":
                    query.where("name").equals(params[key]);
                    break;

                case "keywords_seq": {
                    var val = params[key].split(",");
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
        var query = this.getQuery(params);

        var self = this;
        query.exec(function (err, defaultNames) {
            if (err) return cb(err);
            if (params.name !== null && params.name !== "") {
                var name = Utils.removeAccents(params.name);
                self.find({ 'keywords': Utils.likeLowerCase(name) }).exec(function (err, defaultNameKeyword) {
                    if (err) return cb(err);

                    if (defaultNameKeyword.length > 0)
                        for (var i = 0; i < defaultNameKeyword.length; i++) {
                            //if (!in_array(defaultNameKeyword[i], defaultNames))
                            defaultNames[defaultNames.length] = defaultNameKeyword[i];

                        }


                    return cb(null, defaultNames);
                });
            } else {
                cb(null, defaultNames);
            }

        });
    },

    modify: function (id, params, cb) {
        this.findById(id, function (err, serviceName) {
            if (err) return cb(err);

            if (!serviceName)
                return cb("Service name not found");

            serviceName = Utils.mergeMongoObjects(serviceName, params);

            serviceName.save(function (err) {
                if (err) return cb(err);
                cb();
            });

        });
    }

};

module.exports = mongoose.model("Service_Name", Service_NameSchema);