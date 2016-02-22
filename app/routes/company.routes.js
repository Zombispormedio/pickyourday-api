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
                Response.printSuccess(res, req.showUser);
        });
    }
        )
    .get(AuthController.checkAdmin(), function(req, res){
        CompanyCtrl.search(req.query, function(err, companies){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res,  companies);
        });
    });


router.route("/profile")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.findById(req.user, function (err, company) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, company);
        });
    });

router.route("/pick")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.searchPick(req.user, req.query, function (err, picks) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, picks);
        });
    })
    .delete(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.deletePick(req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  "Pick deleted");
        })
    });

router.route("/serviceName")
    .get(AuthController.checkCompany(),function(req, res){
        CompanyCtrl.searchServiceName(req.query, function(err, serviceNames){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, serviceNames);
        })
    })


router.route("/service")
    .post(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.newService(req.user, req.body, function(err){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res, "Service created");
        });
    })
    .get(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.searchService(req.user, req.query, function(err, services){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res, services);
        });
    })
    .delete(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.deleteService(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  "Service deleted");
        })
    });

router.route("/resource")
	.post(AuthController.checkCompany(), function(req, res){
		CompanyCtrl.newResource(req.user, req.body, function(err){
			if(err) Response.printError(res, err);
			else
				Response.printSuccess(res,  "Resource created");
		});
	})
	.get(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.searchResource(req.user, req.query, function(err, resources){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res,  resources);
        });
    })
	.delete(AuthController.checkCompany(), function (req, res) {
		CompanyCtrl.deteleResource(req.user, req.body, function (err) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, "Resource deleted");
		})
	});
router.route("/servicesAsigned")
    .get(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.getServicesAsigned(req.user, req.query, function(err, services){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res,  services);
        });
    })

router.route("/asignService")
    .post(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.asignService(req.user, req.body, function(err){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res,  "Service asigned");
        });
    })

router.route("/promotion")
    .post(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.newPromotion(req.user, req.body, function(err){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res,  "Promotion created");
        });
    })
    .get(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.searchPromotion(req.user, req.query, function(err, promotions){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res, promotions);
        });
    })
    .delete(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.deletePromotion(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  "Promotion deleted");
        })
    })

router.route("/category")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.searchCategory(req.query, function(err, categories){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, categories);
        } );
    })

router.route("/pick/:id")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.getPickById(req.params.id, function (err, service) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, service);
        });
    })

router.route("/service/:id")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.getServiceById(req.user, req.params.id, function (err, service) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, service);
        });
    })
    .put(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.modifyService(req.user, req.params.id, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "Service modified");
        });
    })

router.route("/resource/:id")
	.get(AuthController.checkCompany(), function (req, res) {
		CompanyCtrl.getResourceById(req.user, req.params.id, function (err, resource) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, resource);
		});
	})
	.put(AuthController.checkCompany(), function (req, res) {
		CompanyCtrl.modifyResource(req.user, req.params.id, req.body, function (err) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res,  "Resource modified");
		});
	})	

router.route("/promotion/:id")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.getPromotionById(req.user, req.params.id, function (err, promotion) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  promotion);
        });
    })
    .put(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.modifyPromotion(req.user, req.params.id, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,"Promotion modified");
        });
    })

router.route("/:id")
    .get(AuthController.checkAdmin(), function(req, res){
        CompanyCtrl.findById(req.params.id, function(err, company){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res,  company);
        } );
    })
     .put(AuthController.checkAdmin(), function (req, res) {
           CompanyCtrl.modify(req.params.id, req.body, function (err, company) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  company);
        });
    })
    .delete(AuthController.checkAdmin(),function (req, res) {
        CompanyCtrl.delete(req.params.id, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "Deleted");

        });
    });



    module.exports = router;
