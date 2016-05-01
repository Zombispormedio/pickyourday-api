var _ = require("lodash");
var async = require("async");

var C = require("../../config/config");
var PreferencesModel = require(C.models + "preferences");


var Controller = {};

Controller.new = function (body, cb) {
    if (!body || !body.name_group) return cb("Fields not Filled");

    var preference = new PreferencesModel(body);
    preference.save(function (err, result) {
        if (err) return cb(err);
        cb(null, result);
    });
};

Controller.search = function (query, cb) {
    PreferencesModel.search(query, cb);
};

Controller.count = function (params, cb) {
  
    if(params.p)delete params.p;
     var query= PreferencesModel.getQuery(params);
       query.count().exec(cb);
};



Controller.findById = function (id, cb) {
    PreferencesModel.findById(id, function (err, preferences) {
        if (err) return cb(err);
        if (!preferences) return ("Preferences not found");

        cb(null, preferences);
    });
};

Controller.modify = function (id, body, cb) {
    if (!body || !id)
        return cb("Fields not filled");

    PreferencesModel.modify(id, body, function (err) {
        if (err) return cb(err);
        cb();
    });
};


Controller.delete = function (id, cb) {
    if (!id) return cb("Fields not Filled");

    PreferencesModel.findByIdAndRemove(id, function (err, preferences) {
        if (err) return cb(err);

        if (!preferences)
            return cb("Preferences not deleted");
        cb();
    });
};


Controller.getPreferencesByCustomer = function (customer, cb) {
    var customer_pref = customer.preferences;

    async.waterfall([

        function getPreferences(next) {
            var worker = {};

            PreferencesModel.find({}, function (err, pref) {
                if (err) return next(err);
               
                worker.pref = pref.map(function(a){return a.toObject();});
                next(null, worker);
            });
        }, function reducePreferencesByCustomer(worker, next) {

            worker.pref.forEach(function (pref) {
               pref.questions = pref.questions.reduce(function (prev, question) {
                    
              
                    var quest_dump = true;
                    if (question.relations.length > 0) {
                           
                        if (customer_pref.length > 0) {
                            var rels = question.relations;
                            var i = 0;
                            while (i < rels.length && quest_dump === true) {
                                var relation = rels[i];
                          
                                var customer_quest = _.find(customer_pref, function (o) { return  relation.question.equals(o.question); });
                          
                                if (customer_quest !== void 0) {
                                    //Type date to do
                                    if (relation.answer !== customer_quest.answer) {
                                        quest_dump = false;
                                    }

                                } else {
                                    quest_dump = false;
                                }

                                i++;
                            }
                         
                        } else {
                            quest_dump = false;
                        }
                    }

                    if (quest_dump) {
                        prev.push(question);
                    }

                    return prev;

                }, []);
               

            });

            next(null, worker);

        }, function mergeQuestionsAndAnswers(worker, next) {
            if (customer_pref.length === 0) return next(null, worker.pref);
            worker.pref.forEach(function (pref) {

                pref.questions.forEach(function (element) {
                  

                    var index = _.find(customer_pref, function (o) { return  element._id.equals(o.question); });
                
                    if (index !== void 0) {
                        element.answer = index.answer;
                       
                    }
                });
                   

            });
            
            next(null, worker.pref);

        }

    ], function (err, result) {
        if (err) return cb(err);
        cb(null, result);
    });
};




module.exports = Controller;
