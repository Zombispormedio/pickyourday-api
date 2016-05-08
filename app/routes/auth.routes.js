var Router = require("express").Router;
var C = require("../../config/config");
var AuthCtrl=require(C.ctrl+"auth.ctrl");
var Response = require(C.lib+"response");
var router = Router();
router.route("")
    .get(function (req, res) {
        Response.printSuccess(res, "message", "Do you want register?" );
    })
    .post(function (req, res){
        AuthCtrl.login(req.body, function(err, user){
            if(err)
                Response.printError(res, err);
            else
                Response.printSuccess(res,  user);
        });
    });

router.route("/logout")
    .get(function(req, res){
        AuthCtrl.logout(req.headers.authorization, function(err){
            if(err)
                Response.printError(res, err);
            else
                Response.printSuccess(res,  "Successful");
        });
    });

router.route("/check")
    .get(function(req, res){
        AuthCtrl.check(req.query,function(err, user){
            if(err)
                Response.printError(res, err);
            else
                Response.printSuccess(res,  user);
        });
    });

router.route("/role/:role")
    .get(function(req, res){
    AuthCtrl.getRole(req.params.role,function(err, role){
        if(err)
            Response.printError(res, err);
        else
            Response.printSuccess(res,  role);
    });
});

router.route("/forgot_password")
    .post(function(req, res){
    AuthCtrl.forgotPassword(req.body,function(err){
        if(err)
            Response.printError(res, err);
        else
            Response.printSuccess(res, "You will receive a message with a code");
    });
});

router.route("/reset_password")
    .post(function(req, res){
    AuthCtrl.resetPassword(req.body,function(err){
        if(err)
            Response.printError(res, err);
        else
            Response.printSuccess(res, "Password Reset Successfully");
    });
});



module.exports = router;
