var C=require("../../config/config");

var CompanyModel = require(C.models+"company");
var Controller = {};

Controller.new = function(user, body, cb){
    if (!body || !body.name || !body.initDate|| !body.endDate) return cb("Fields not Filled");

    CompanyModel.newPromotion(user, body, function(err){
        if(err) return cb(err);
        cb();
    });
};

Controller.search = function(user, query, cb){
    CompanyModel.searchPromotion(user, query, function(err, promotions){
        if(err) return cb(err);

        if(!promotions)
            return cb(null, "Promotions not found");

        cb(null, promotions);
    })
};

Controller.findById = function(user, id, cb){
    CompanyModel.findPromotionById(user, id, function(err, promotion){
        if(err) return cb(err);

        cb(null, promotion);

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

    CompanyModel.deletePromotion(user, id, function(err){
        if(err) return cb(err);
        cb();
    });
};



module.exports = Controller;
