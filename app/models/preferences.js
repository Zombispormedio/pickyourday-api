var mongoose = require("mongoose");
var Schema = mongoose.Schema;



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
        enum: ["keywords", "yes_no", "options"],
        required: true
    },
        text:String,
        options:[String]
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

            for(var key in params){
                preference[key] = params[key];
            }

            preference.save(function(err){
                if(err) return cb(err);
                cb();
            });

        });
    }
}
module.exports = mongoose.model("Preferences", PreferencesSchema);
