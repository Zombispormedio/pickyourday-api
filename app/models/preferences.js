var C = require("../../config/config");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var Utils = require(C.lib + "utils");


var PreferencesSchema = new Schema({
    name_group: {
        type: String,
        unique: true,
        required: true
    },
    description: String,

    questions: [{
        type: {
            type: String,
            enum: ["keywords", "yes_no", "options"]
        },
        text: String,
        options: [String],
        relations: [{
            question: Schema.ObjectId,
            answer: {},
            not_equality: Boolean
        }],
        keywords: [String]
    }]


});

PreferencesSchema.statics = {
    getQuery: function (params) { //en params no meter id, todos los demas datos si
        var query = this.find({});
        for (var key in params) {
            switch (key) {
                case "name":
                case "name_group":
                    query.where("name_group").equals(params[key]);
                    break;
                case "question_id":
                    query.where("questions._id").equals(params[key]);
                    break;
                case "question_text":
                    query.where("questions.text").equals(Utils.like(params[key]));
                    break;
                case "question_type":
                    query.where("questions.type").equals(params[key]);
                    break;
                case "question_options":
                    var val = params[key].split(",");
                    query.where("questions.options").in(val);
                    break;

                case "relation_id":
                    query.where("questions.relations.question").equals(params[key]);
                    break;
                case "relation_answer":
                    query.where("questions.relations.answer").equals(Utils.like(params[key]));
                    break;

                case "question_keywords": {
                    var val = params[key].split(",");
                    query.where("questions.keywords").in(val);
                    break;
                }

                case "search_text": {
                    var val = params[key];
                    var or_seq = [
                        { "name_group": { "$regex": Utils.like(val) } },
                        { "description": { "$regex": Utils.like(val) } },
                        { "questions.text": { "$regex": Utils.like(val) } },
                        { "questions.options": { "$regex": Utils.like(val) } },
                        { "questions.relations.answer": { "$regex": Utils.like(val) } },
                        { "questions.keywords": { "$regex": Utils.like(val) } }
                    ];

                    if (Utils.isValidObjectID(val)) {
                        or_seq.push({ "_id": mongoose.Types.ObjectId(val) });
                        or_seq.push({ "questions._id": mongoose.Types.ObjectId(val) });
                        or_seq.push({ "questions.relations.question": mongoose.Types.ObjectId(val) });
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
        this.getQuery(params, true).exec(cb);
    },

    modify: function (id, params, cb) {
        this.findById(id, function (err, preference) {
            if (err) return cb(err);

            if (!preference)
                return cb("Company not found");

            preference = Utils.mergeMongoObjects(preference, params);

            preference.save(function (err) {
                if (err) return cb(err);
                cb();
            });

        });
    }
};
module.exports = mongoose.model("Preferences", PreferencesSchema);
