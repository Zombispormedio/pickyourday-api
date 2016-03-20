var C = require("../../config/config");

var Router = require("express").Router;

var Response = require(C.lib + "response");
var DeveloperCtrl=require(C.ctrl+"developer.ctrl");

var router = Router();


router.route("/whoiam")
    .get(DeveloperCtrl.check(), function(req, res) {
      
                Response.printSuccess(res, "Successful");
       
    });


module.exports = router;