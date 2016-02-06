var Router = require("express").Router;
var C = require("../../config/config");
var AuthController = require(C.ctrl+"auth.ctrl");
var SystemCtrl = require(C.ctrl+"system.ctrl");
var Response = require("../lib/response");
var router = Router();
router.route("/category")
	.get(AuthController.checkAccess(0), function (req, res) {
		SystemCtrl.searchCategory(req.query, function(err, categories){
			if(err) Response.printError(res, err);
				else
			Response.printSuccess(res, "categories", categories);
		} );
	})
	.post(AuthController.checkAccess(0), function (req, res){
		SystemCtrl.newCategory(req.body, function(err, category){ 
		if(err) Response.printError(res, err);
				else
			Response.printSuccess(res, "category", category);

		});
	});
	
router.route("/prePick")
	.post(AuthController.checkAccess(0), function(req, res){
		SystemCtrl.calculatePrePicks(req.body, function(err){
			if(err) Response.printError(res, err);
				else
			Response.printSuccess(res, "prepick", "PrepIcks created");
		});
	})
	.get(AuthController.checkAccess(0),function(req, res){
		SystemCtrl.searchPrePick(req.query, function(err, prePicks){
			if(err) Response.printError(res, err);
				else
			Response.printSuccess(res, "prepicks", prePicks);
		});
	});

router.route("/pick")
	.get(AuthController.checkAccess(0), function (req, res) {
		SystemCtrl.searchPick(req.query, function (err, picks) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "picks", picks);
		});
	});

	
router.route("/service")
	.get(AuthController.checkAccess(0),function(req, res){
		SystemCtrl.searchService(req.query, function(err, services){
			if(err) Response.printError(res, err);
				else
			Response.printSuccess(res, "data", services);
		});
	});

router.route("/default_service")
	.get(AuthController.checkAccess(0),function(req, res){
		SystemCtrl.searchServiceName(req.query, function(err, serviceNames){
			if(err) Response.printError(res, err);
				else
			Response.printSuccess(res, "default_services", serviceNames);
		});
	})
	.post(AuthController.checkAccess(0), function(req, res){
		SystemCtrl.newServiceName(req.body, function(err, result){
			if(err) Response.printError(res, err);
				else
			Response.printSuccess(res, "default_service", result);
		});
	});
    
    
    router.route("/preferences")
	.get(AuthController.checkAccess(0),function(req, res){
		SystemCtrl.getPreferences(req.query, function(err,  preferences){
			if(err) Response.printError(res, err);
				else
			Response.printSuccess(res, "preferences", preferences);
		});
	})
	.post(AuthController.checkAccess(0), function(req, res){
		SystemCtrl.newPreference(req.body, function(err, result){
			if(err) Response.printError(res, err);
				else
			Response.printSuccess(res, "preference", result);
		});
	});


router.route("/default_service/:id")
	.put(AuthController.checkAccess(0), function (req, res) {
		SystemCtrl.modifyServiceName(req.params.id, req.body, function (err) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "default_service", "Default Service modified");
		});
	})
	.get(AuthController.checkAccess(0), function (req, res) {
		SystemCtrl.getServiceNameById(req.params.id, function (err, default_service) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "default_service", default_service);
		});
	})
    	.delete(AuthController.checkAccess(0), function (req, res) {
		SystemCtrl.deleteServiceName(req.params.id, function (err) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "default_service", "Default Service deleted");
		});
	});

router.route("/pick/:id")
	.get(AuthController.checkAccess(0), function (req, res) {
       
		SystemCtrl.getPickById(req.params.id, function (err, pick) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "pick", pick);
		});
	})
    .delete(AuthController.checkAccess(0), function (req, res) {
		SystemCtrl.deletePick(req.params.id, function (err) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "pick", "Deleted");
		});
	});
	
router.route("/category/:id")
	.put(AuthController.checkAccess(0), function (req, res) {
		SystemCtrl.modifyCategory(req.params.id, req.body, function (err) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "category", "Category modified");
		});
	})
	.get(AuthController.checkAccess(0), function (req, res) {
		SystemCtrl.getCategoryById(req.params.id, function (err, category) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "category", category);
		});
	})
    .delete(AuthController.checkAccess(0), function (req, res) {
		SystemCtrl.deleteCategory(req.params.id, function (err) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "categories", "Category deleted");
		});
	});
    
    
    router.route("/preferences/:id")
	.put(AuthController.checkAccess(0), function (req, res) {
		SystemCtrl.modifyPreference(req.params.id, req.body, function (err) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "preference", "Preference modified");
		});
	})
	.get(AuthController.checkAccess(0), function (req, res) {
		SystemCtrl.getPreferenceById(req.params.id, function (err, preference) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "preference", preference);
		});
	})
    .delete(AuthController.checkAccess(0), function (req, res) {
		SystemCtrl.deletePreference(req.params.id, function (err) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "Preference", "Preference deleted");
		});
	});
    
    
    router.route("/image/:type")
    .post(AuthController.checkAccess(5), function(req, res){
        SystemCtrl.uploadImage(req.params.type, req.body, function (err, image) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "image", image);
		});
    });

	
module.exports = router;