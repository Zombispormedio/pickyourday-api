var C = require("../../config/config");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var Utils = require(C.lib+"utils");


var PreferencesSchema = new Schema({
   name_group : {
        type: String,
        unique: true,
        required: true
    },
    description:String,

    questions:[{
        type: {
        type: String,
        enum: ["keywords", "yes_no", "options"]
    },
        text:String,
        options:[String],
        relations:[{
            question:Schema.ObjectId,
            answer:String
        }]
    }]


});

PreferencesSchema.statics={
    search:function(params, cb){ //en params no meter id, todos los demas datos si
        var query = this.find({});
        for(var key in params){
            query.where(key).equals(Utils.like(params[key]));
        }
        query.exec(cb);
    },

    modify:function(id, params, cb){
        this.findById(id, function(err, preference){
            if(err) return cb(err);

            if(!preference)
                return cb("Company not found");

          	preference=Utils.mergeMongoObjects(preference, params);

            preference.save(function(err){
                if(err) return cb(err);
                cb();
            });

        });
    }
};
module.exports = mongoose.model("Preferences", PreferencesSchema);
