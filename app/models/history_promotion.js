var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var C=require("../../config/config");
var CustomType = require("./customType.js");

var ImageType=CustomType.ImageSchema;

var HistoryPromotionSchema = new Schema({
	name: String,
	initDate: Date,
	endDate:Date,
	deletedDate: Date,
	images: [ ImageType],
	useLimit: Number,
	description: String,
	timesUsed: Number,
	ownCustomers: Boolean,
	id_company: Schema.ObjectId,
	discount: Number,
	dateCreated: Date,
	state: {
		type: String, 
		enum: ['waiting', 'started', 'spent', 'finished']
	}

});

module.exports = mongoose.model("HistoryPromotion", HistoryPromotionSchema);