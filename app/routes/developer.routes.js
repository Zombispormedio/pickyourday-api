var C = require("../../config/config");



var Router = require("express").Router;

var Response = require(C.lib + "response");
var DeveloperCtrl = require(C.ctrl + "developer.ctrl");

var router = Router();


router.route("/calendar")
    .get(DeveloperCtrl.check(), function(req, res) {
        DeveloperCtrl.exportCalendar(req.user, req.role, function(err, ical_picks) {
            if (err) Response.printError(res, err);
            else
               ical_picks.serve(res);
        });

    });


module.exports = router;