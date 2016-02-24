var _=require("lodash");
var async=require("async");

var C=require("../../config/config");
var PreferencesModel = require(C.models+"preferences");


var Controller = {};

Controller.new = function (body, cb) {
    if (!body || !body.name_group) return cb("Fields not Filled");

    var preference = new PreferencesModel(body);
    preference.save(function (err, result) {
        if (err) return cb(err);
        cb(null, result);
    });
};

Controller.search = function(query, cb){
    PreferencesModel.search(query, function(err, preferences){
        if(err) return cb(err);

        if(!preferences)
            return cb("Preferences not found");

        cb(null, preferences);

    });
};

Controller.findById = function(id, cb){
    PreferencesModel.findById(id, function(err, preferences){
        if(err) return cb(err);
        if(!preferences)return ("Preferences not found");

        cb(null, preferences);
    });
};

Controller.modify = function(id, body,cb){
    if(!body || !id )
        return cb("Fields not filled");

    PreferencesModel.modify(id, body, function(err){
        if(err) return cb(err);
        cb();
    });
};


Controller.delete = function(id, cb){
    if (!id) return cb("Fields not Filled");

    PreferencesModel.findByIdAndRemove(id, function (err,preferences){
        if(err) return cb(err);

        if(!preferences)
            return cb("Preferences not deleted");
        cb();
    });
};


Controller.getPreferencesByCustomer=function(customer, cb){
    var customer_pref=customer.preferences;
    
    async.waterfall([
        
        function getPreferences(next){
            var worker={};
            
            PreferencesModel.find({}, function(err, pref){
                if(err)return next(err);
                
                worker.pref=pref.toObject();
                next(null, worker);
            });
        }, function reducePreferencesByCustomer(worker, next){
          
           
           worker.pref.forEach(function(pref){
               pref.questions=pref.questions.reduce(function(prev, question){
        
                   if(question.relations.length!==0 && customer_pref.length>0){
                       
                       
                       
                       
                       
                       
                       
                   }else{
                       prev.push(question);
                   }
                     
                   return prev;
                   
               });
   
           });
           
        }
        
    ], function(err, result){
        if(err)return cb(err);
        cb(result);
    });
};



module.exports = Controller;
