var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var C = require("../../config/config");
var Utils = require(C.lib + "utils");
var async = require("async");

var CompanyModel = require(C.models + "company");

var PickSchema = new Schema({
	id_customer: {
		type: Schema.ObjectId,
		ref: "Customer"
	},
	company: {
		id_company: {
			type: Schema.ObjectId,
			ref: "Company",
			required: true
		},
		id_service: {
			type: Schema.ObjectId,
			required: true
		}
	},
	initDate: {
		type: Date,
		required: true
	},
	duration: Number,
	dateCreated: Date,
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


PickSchema.statics = {
	getQuery: function (params, cb) { //en params no meter id, todos los demas datos si
		var query = this.find({}).sort({ initDate: 1 });
		for (var key in params) {
			switch (key) {
				case "id_customer":
				case "company.id_company":
				case "company.id_service":
				case "promotion":
					query.where(key).equals(params[key].toString());
					break;

				case "by_state":
					query.where("state").equals(params[key]);
					break;
				case "by_origin":
					query.where("origin").equals(params[key]);
					break;
				case "nameCli":
				case "phoneCli":
				case "duration":
					query.where(key).equals(params[key]);
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
				case 'picks':
					query.where({ '_id': { '$in': params[key] } });
					break;
				case 'state':
					query.where({ 'state': { '$in': params[key] } });
					break;
				case 'origin':
					query.where({ 'origin': { '$in': params[key] } });
					break;

				case "search_text": {
					var val = params[key];
					var or_seq = [
                        { "observation": { "$regex": Utils.like(val) } },
						{ "nameCli": { "$regex": Utils.like(val) } },
						{ "phoneCli": { "$regex": Utils.like(val) } },

                    ];

					if (Utils.isValidObjectID(val)) {
                        or_seq.push({ "_id": mongoose.Types.ObjectId(val) });
						or_seq.push({ "id_customer": mongoose.Types.ObjectId(val) });
						or_seq.push({ "company.id_company": mongoose.Types.ObjectId(val) });
						or_seq.push({ "company.id_service": mongoose.Types.ObjectId(val) });
						or_seq.push({ "promotion": mongoose.Types.ObjectId(val) });
                    }

                    query.or(or_seq);


                    break;
                }

				case "customer":
					query.where("id_customer").equals(params[key].toString());
					break;
				case "company":
					query.where("company.id_company").equals(params[key].toString());
					break;
				case "service":
					query.where("company.id_service").equals(params[key].toString());
					break;
				case "p": {
                    var p = params[key];

                    var s = Number(params.s) || C.pagination;

                    var skip = s * p;

                    query.skip(skip);
                    query.limit(s);
                    break;
                }
				/*default:
					query.where(key).equals(Utils.like(params[key]));*/
			}
		}
		return query;

	},

	search: function (params, cb) {
        this.getQuery(params).exec(cb);
    },

	changeState: function (id, state, cb) {
		this.findById(id, function (err, pick) {
			if(!pick) return cb(-1);
			pick.state = state;
			pick.save(function (err) {
                if (err) return cb(err);
                cb();
            });
		});
	}

};

module.exports = mongoose.model("Pick", PickSchema);