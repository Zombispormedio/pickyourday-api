var C = require("../../config/config");



var Router = require("express").Router;

var Response = require(C.lib + "response");
var DeveloperCtrl = require(C.ctrl + "developer.ctrl");

var router = Router();


router.route("/whoiam")
    .get(DeveloperCtrl.check(), function(req, res) {

        DeveloperCtrl.whoiam(req.user, req.role, function(err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "Successful");
        });



    });


module.exports = router;