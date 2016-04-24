var C=require("../../config/config");

var CompanyModel = require(C.models+"company");
var ServiceCtrl = require(C.ctrl + "service.ctrl");
var HistoryCtrl = require(C.ctrl + "history.ctrl");

var async = require("async");
var Controller = {};

Controller.new = function(user, body, cb){
    if (!body || !body.name || !body.initDate|| !body.endDate) return cb("Fields not Filled");

    CompanyModel.newPromotion(user, body, function(err){
        if(err) return cb(err);
        cb();
    });
};

Controller.search = function(user, query, cb){

    if(user == 0){
        CompanyModel.searchPromotion(0, query, function(err, promotions){
                if(err) return cb(err);

                cb(null, promotions);
            })
    }else{
        CompanyModel.findById(user, function(err, c){
            if(err) return cb(err); 
            query.state = c.state;

            CompanyModel.searchPromotion(user, query, function(err, promotions){
                if(err) return cb(err);

                cb(null, promotions);
            })
        })
    }
};

Controller.findById = function(user, id, cb){
    CompanyModel.findPromotionById(user, id, function(err, promotion){
        if(err) return cb(err);
        promotion = promotion.toObject();
        //promotion.services.toObject();
        if(promotion){
            promotion.company = user;
            var count = 0;
            async.map(promotion.services, function(service, next) {
                if (!service) return next();
                ServiceCtrl.findById(user, service, function(err, serviceData){                   
                    promotion.services[count] =serviceData;
                    count++;
                    next(); 
                })
            }, function(err, result) {
                if (err) return cb(err);
                cb(null, promotion);
            });
        }else cb(null, promotion);

    });
};

Controller.modify = function(user, id, body, cb){
    if(!body || !id )
        return cb("Fields not filled");

    CompanyModel.modifyPromotion(user, id, body, function(err){
        if(err) return cb(err);
        cb();
    });
};

Controller.delete = function(user, id, cb){
    if (!id) return cb("Fields not Filled");

    this.findById(user, id, function(err, promotion){
        if(err) cb(err);
        CompanyModel.deletePromotion(user, id, function(err){
            if(err) return cb(err);
            HistoryCtrl.savePromotion(promotion, function(err){
                cb();
            });
            
        });
    });


};

Controller.refreshPromotions = function(cb){
    var date = new Date();
    var self = this;
    var query = CompanyModel.search({}, function(err, companies){
        if(err) return cb(err);
        async.map(companies, function(companie, callback) {
            async.waterfall([
                function changeStart(next) {
                    var paramsTemp = {};
                    paramsTemp.beforeInitDate = date;
                    paramsTemp.state = "waiting";
                    self.search(companie._id, paramsTemp, function(err, promotions){
                        var params = {"state": "started"};
                        async.map(promotions, function(promotion, subNext){
                            CompanyModel.modifyPromotion(companie._id, promotion._id, params, subNext);
                        }, function(err, result) {
                            if (err) return cb(err);
                            next();
                        });

                    })
                },  function changeFinished(next) {
                    var paramsTemp = {};
                    paramsTemp.beforeEndDate = date;
                    self.search(companie._id, paramsTemp, function(err, promotions){
                        var params = {"state": "finished"};
                        async.map(promotions, function(promotion, subNext){
                            CompanyModel.modifyPromotion(companie._id, promotion._id, params, subNext);
                        }, function(err, result) {
                            if (err) return cb(err);
                            next();
                        });

                    })
                }], function(err, result) {
                        if (err) return callback(err);
                        callback(null, result);
                    });
        }, function(err, result) {
            if (err) return cb(err);
            cb(null, result);
        });


    });



};



module.exports = Controller;
