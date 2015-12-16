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
				Response.printSuccess(res, "data", user);
		});
	});
	
router.route("/logout")
	.get(function(req, res){
		AuthCtrl.logout(req.headers.authorization, function(err){
			if(err) 
				Response.printError(res, err);
			else
				Response.printSuccess(res, "data", "Successful");
		});
	});

touer.router("/check")
	.get(function(req, res){
		AuthCtrl.check(req.query,function(err, user){
			if(err) 
				Response.printError(res, err);
			else
				Response.printSuccess(res, "data", user);
		})
	})
	


module.exports = router;