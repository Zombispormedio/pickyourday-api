var Router = require("express").Router;
var C = require("../../config/config");
var CompanyCtrl = require(C.ctrl+"company.ctrl");
var AuthController = require(C.ctrl+"auth.ctrl");
var Response = require("../lib/response");
var router = Router();

router.route("")
    .post(function (req, res, next) {
        CompanyCtrl.newCompany(req.body, function (err, user) {
            if (err) Response.printError(res, err);
            else {
                req.showUser=user;
                req.user = user._id;
                next();
            }

        });
    }, function (req, res) {
        AuthController.register(2, req.body, req.user, function (err) {
            if (err) {
                CompanyCtrl.rollback(req.user);
                Response.printError(res, err)
            }
            else
                Response.printSuccess(res, "company", req.showUser);
        });
    }
        )
    .get(AuthController.checkAdmin(), function(req, res){
        CompanyCtrl.search(req.query, function(err, companies){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res, "companies", companies);
        });
    });


router.route("/profile")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.findById(req.user, function (err, company) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", company);
        });
    });

router.route("/pick")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.searchPick(req.user, req.query, function (err, picks) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", picks);
        });
    })
    .delete(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.deletePick(req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Pick deleted");
        })
    });

router.route("/serviceName")
    .get(AuthController.checkCompany(),function(req, res){
        CompanyCtrl.searchServiceName(req.query, function(err, serviceNames){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, "data", serviceNames);
        })
    })


router.route("/service")
    .post(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.newService(req.user, req.body, function(err){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Service created");
        });
    })
    .get(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.searchService(req.user, req.query, function(err, services){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", services);
        });
    })
    .delete(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.deleteService(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Service deleted");
        })
    });

router.route("/resource")
	.post(AuthController.checkCompany(), function(req, res){
		CompanyCtrl.newResource(req.user, req.body, function(err){
			if(err) Response.printError(res, err);
			else
				Response.printSuccess(res, "data", "Resource created");
		});
	})
	.get(AuthController.checkCompany(), function(req, res){
		CompanyCtrl.searchResource(req.user, req.query, function(err, resources){
			if(err) Response.printError(res, err);
			else
				Response.printSuccess(res, "data", resources);
		});
	})
	.delete(AuthController.checkCompany(), function (req, res) {
		CompanyCtrl.deteleResource(req.user, req.body, function (err) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "data", "Resource deleted");
		})
	});

router.route("/promotion")
    .post(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.newPromotion(req.user, req.body, function(err){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Promotion created");
        });
    })
    .get(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.searchPromotion(req.user, req.query, function(err, promotions){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", promotions);
        });
    })
    .delete(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.deletePromotion(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Promotion deleted");
        })
    });
router.route("/category")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.searchCategory(req.query, function(err, categories){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, "data", categories);
        } );
    })

router.route("/pick/:id")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.getPickById(req.params.id, function (err, service) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", service);
        });
    })

router.route("/service/:id")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.getServiceById(req.user, req.params.id, function (err, service) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", service);
        });
    })
    .put(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.modifyService(req.user, req.params.id, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Service modified");
        });
    })

router.route("/resource/:id")
	.get(AuthController.checkCompany(), function (req, res) {
		CompanyCtrl.getResourceById(req.user, req.params.id, function (err, resource) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "data", resource);
		});
	})
	.put(AuthController.checkCompany(), function (req, res) {
		CompanyCtrl.modifyResource(req.user, req.params.id, req.body, function (err) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "data", "Resource modified");
		});
	})	

router.route("/promotion/:id")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.getPromotionById(req.user, req.params.id, function (err, promotion) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", promotion);
        });
    })
    .put(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.modifyPromotion(req.user, req.params.id, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Promotion modified");
        });
    })

router.route("/:id")
    .get(AuthController.checkAdmin(), function(req, res){
        CompanyCtrl.findById(req.params.id, function(err, company){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res, "company", company);
        } );
    })
     .put(AuthController.checkCompany(), function (req, res) {
           CompanyCtrl.modify(req.params.id, req.body, function (err, company) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "company", company);
        });
    })
    .delete(AuthController.checkAdmin(),function (req, res) {
        CompanyCtrl.delete(req.params.id, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "company", "Deleted");

        });
    });



    module.exports = router;
