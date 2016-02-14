var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var GeolocationSchema = new Schema({
	longitude: Number,
	latitude: Number,
	name: String
});


var ImageSchema = new Schema({
	src:String,
	alt:String
});

module.exports.GeolocationSchema = GeolocationSchema;

module.exports.ImageSchema = ImageSchema;