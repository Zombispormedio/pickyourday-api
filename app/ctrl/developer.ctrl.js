var C = require("../../config/config");
var Response = require(C.lib + "response");
var AuthModel = require(C.models + "auth").Auth;
var Controller = {};

Controller.check = function() {
    return function(req, res, next) {
        var access_token = req.query.access_token;
        var secret_token = req.query.secret_token;
        
        if( !access_token|| !secret_token)return Response.printError(res, "No Authorization");
        
        var developer = { access_token: access_token, secret_token: secret_token };
        AuthModel.findOne({ developer: developer }, function(err, result) {
            if (err) return Response.printError(res, "No Authorization");

            req.user = result.user;
            req.role = result.role;
            next();

        });
    };
};

Controller.whoiam=function(user, role,cb){
    
    cb();
};


module.exports = Controller;


