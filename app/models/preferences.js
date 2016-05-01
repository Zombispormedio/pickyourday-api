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
            answer:{},
            not_equality:Boolean
        }],
        keywords:[String]
    }]


});

PreferencesSchema.statics={
    getQuery:function(params){ //en params no meter id, todos los demas datos si
        var query = this.find({});
        for(var key in params){
            switch(key){
                
            }
        }
        return query;
    },
    
    search: function (params, cb) {
        this.getQuery(params, true).exec(cb);
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
