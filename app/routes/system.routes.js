var Router = require("express").Router;
var C = require("../../config/config");
var AuthController = require(C.ctrl+"auth.ctrl");
var SystemCtrl = require(C.ctrl+"system.ctrl");
var Response = require("../lib/response");
var router = Router();
router.route("/category")
    .get(AuthController.checkAdmin(), function (req, res) {
        SystemCtrl.searchCategory(req.query, function(err, categories){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, categories);
        } );
    })
    .post(AuthController.checkAdmin(), function (req, res){
        SystemCtrl.newCategory(req.body, function(err, category){
        if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, category);

        });
    });

router.route("/addClient")
        .post(AuthController.checkAdmin(), function (req, res){
        SystemCtrl.addCliente(req.body, function(err, client){
        if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, client);

        });
    });

router.route("/prePick")
    .post(AuthController.checkAdmin(), function(req, res){
        SystemCtrl.calculatePrePicks(req.body, function(err){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, "PrepIcks created");
        });
    })
    .get(AuthController.checkAdmin(),function(req, res){
        SystemCtrl.searchPrePick(req.query, function(err, prePicks){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, prePicks);
        });
    });

router.route("/pick")
    .get(AuthController.checkAdmin(), function (req, res) {
        SystemCtrl.searchPick(req.query, function (err, picks) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, picks);
        });
    });

router.route("/clearPicks")
    .get(function(req, res){
        SystemCtrl.clearPicks(function(err,picks){
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, picks);
        })
    });

router.route("/refreshpromotion")
    .get(function(req, res){
        SystemCtrl.refreshPromotions(function(err,promotions){
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, promotions);
        })
    });


router.route("/service")
    .get(AuthController.checkAdmin(),function(req, res){
        SystemCtrl.searchService(req.query, function(err, services){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, services);
        });
    });

router.route("/default_service")
    .get(AuthController.checkAdmin(),function(req, res){
        SystemCtrl.searchServiceName(req.query, function(err, serviceNames){
            if(err) Response.printError(res, err);
            else
            Response.printSuccess(res,  serviceNames);
        });
    })
    .post(AuthController.checkAdmin(), function(req, res){
        SystemCtrl.newServiceName(req.body, function(err, result){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, result);
        });
    });


router.route("/preferences")
    .get(AuthController.checkAdmin(),function(req, res){
        SystemCtrl.getPreferences(req.query, function(err,  preferences){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, preferences);
        });
    })
        .post(AuthController.checkAdmin(), function(req, res){
        SystemCtrl.newPreference(req.body, function(err, result){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, result);
        });
    });

router.route("/notification")
    .get(function(req, res){
        SystemCtrl.notification(function(err,obj){
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, []);
        })
    });




router.route("/default_service/:id")
    .put(AuthController.checkAdmin(), function (req, res) {
        SystemCtrl.modifyServiceName(req.params.id, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  "Default Service modified");
        });
    })
    .get(AuthController.checkAdmin(), function (req, res) {
        SystemCtrl.getServiceNameById(req.params.id, function (err, default_service) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,default_service);
        });
    })
    .delete(AuthController.checkAdmin(), function (req, res) {
        SystemCtrl.deleteServiceName(req.params.id, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "Default Service deleted");
        });
    });

router.route("/pick/:id")
    .get(AuthController.checkAdmin(), function (req, res) {

        SystemCtrl.getPickById(req.params.id, function (err, pick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, pick);
        });
    })
    .delete(AuthController.checkAdmin(), function (req, res) {
        SystemCtrl.deletePick(req.params.id, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,"Deleted");
        });
    });

router.route("/category/:id")
    .put(AuthController.checkAdmin(), function (req, res) {
        SystemCtrl.modifyCategory(req.params.id, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "Category modified");
        });
    })
    .get(AuthController.checkAdmin(), function (req, res) {
        SystemCtrl.getCategoryById(req.params.id, function (err, category) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  category);
        });
    })
    .delete(AuthController.checkAdmin(), function (req, res) {
        SystemCtrl.deleteCategory(req.params.id, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  "Category deleted");
        });
    });


    router.route("/preferences/:id")
        .put(AuthController.checkAdmin(), function (req, res) {
        SystemCtrl.modifyPreference(req.params.id, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  "Preference modified");
        });
    })
        .get(AuthController.checkAdmin(), function (req, res) {
        SystemCtrl.getPreferenceById(req.params.id, function (err, preference) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,preference);
        });
    })
        .delete(AuthController.checkAdmin(), function (req, res) {
        SystemCtrl.deletePreference(req.params.id, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  "Preference deleted");
        });
    });


    router.route("/image/:type")
        .post(AuthController.checkRegistered(), function(req, res){
        SystemCtrl.uploadImage(req.params.type, req.body, function (err, image) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, image);
        });
    });






module.exports = router;
