var C = require("../../config/config");

var Controller = {};

Controller.check=function(){
    return function(req, res, next) {
       var access_token=req.headers.access_token;
       var secret_token=req.headers.secret_token;
       console.log(req.headers);
       next();
       
       
       
    };
};


module.exports = Controller;


