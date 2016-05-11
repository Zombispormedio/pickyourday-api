var Router = require("express").Router;
var C = require("../../config/config");
var CompanyCtrl = require(C.ctrl+"company.ctrl");
var DeveloperCtrl = require(C.ctrl + "developer.ctrl");
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
                Response.printError(res, err);
            }
            else
                Response.printSuccess(res, req.showUser);
        });
    }
        )
    .get(AuthController.checkAdmin(), function(req, res){
        CompanyCtrl.getAll(req.query, function(err, companies){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res,  companies);
        });
    });
    
    router.route("/count")
    .get(AuthController.checkAdmin(), function (req, res) {
        CompanyCtrl.count(req.query, function (err, count) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, count);
        });
    });


router.route("/profile")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.getProfile(req.user, function (err, company) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, company);
        });
    })
    .put(AuthController.checkCompany(), function(req, res) {
        CompanyCtrl.updateProfile(req.user, req.body, function (err, company) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, company);
        });
    }) ;

    

router.route("/pick")
    .post(AuthController.checkCompany(), function(req, res) {
        CompanyCtrl.newPick(req.user, req.body, function(err, pick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, pick);
        });
    })
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.searchPick(req.user, req.query, function (err, picks) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, picks);
        });
    });

router.route("/nextPick")
    .post(AuthController.checkCompany(), function(req, res) {
        CompanyCtrl.nextPick(req.user, req.body, function(err, pick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, pick);
        });
    });  


router.route("/serviceName")
    .get(AuthController.checkCompany(),function(req, res){
        CompanyCtrl.searchServiceName(req.query, function(err, serviceNames){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, serviceNames);
        });
    });


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
    });

router.route("/resource")
	.post(AuthController.checkCompany(), function(req, res){
		CompanyCtrl.newResource(req.user, req.body, function(err, resources){
			if(err) Response.printError(res, err);
			else
				Response.printSuccess(res,  resources);
		});
	})
	.get(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.searchResource(req.user, req.query, function(err, resources){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res,  resources);
        });
    });	
router.route("/timeLine")
    .get(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.getTimeLine(req.user, req.query, function(err, timeLine){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res,  timeLine);
        });
    });
router.route("/servicesAsigned")
    .get(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.getServicesAsigned(req.user, req.query, function(err, services){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res,  services);
        });
    });

router.route("/resourcesbyservice")
    .get(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.getResourcesByService(req.user, req.query, function(err, resources){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res,  resources);
        });
    });

router.route("/toggleService")
    .post(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.toggleService(req.user, req.body, function(err){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res,  "Service Toggled");
        });
    });

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
    });
    

router.route("/timelineResource")
    .get(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.getTimeLineResource(req.user, req.query, function(err, timeLine){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res, timeLine);
        });
    });

router.route("/category")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.searchCategory(req.query, function(err, categories){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, categories);
        } );
    });

router.route("/statsPicks")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.statsPicks(req.user, req.query, function(err, stats){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, stats);
        } );
    });
router.route("/originPicks")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.originPicks(req.user, req.query, function(err, stats){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, stats);
        } );
    });
router.route("/scoreService")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.scoreServices(req.user, req.query, function(err, stats){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, stats);
        } );
    });

router.route("/developer")
    .get(AuthController.checkCompany(), function(req, res) {
       DeveloperCtrl.getDeveloper(req.oauth, function(err, pair_token) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, pair_token);
        });
    })
    .post(AuthController.checkCompany(), function(req, res) {
        DeveloperCtrl.CreateOrUpdateDeveloper(req.oauth, function(err, pair_token) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, pair_token);
        });
    });

router.route("/setPremium")
    .post(AuthController.checkCompany(), function(req, res){
        CompanyCtrl.setPremium(req.user, req.body, function(err, url){
            if(err) Response.printError(res, err);
            else
                Response.printSuccess(res, url);
        });
    })


router.route("/pick/:id")
    .get(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.getPickById(req.params.id, function (err, service) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, service);
        });
    })
    .delete(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.deletePick(req.params.id, function (err, pick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  pick);
        });
 });

router.route("/cancelPick/:id")
    .put(AuthController.checkCompany(), function(req, res) {
        CompanyCtrl.cancelPick(req.params.id, function(err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "");
        });
    });
 router.route("/activePick/:id")
    .put(AuthController.checkCompany(), function(req, res) {
        CompanyCtrl.activePick(req.params.id, function(err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "");
        });
    });  

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
    .delete(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.deleteService(req.user, req.params.id, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  "Service deleted");
        });
    });

router.route("/resource/:id")
	.get(AuthController.checkCompany(), function (req, res) {
		CompanyCtrl.getResourceById(req.user, req.params.id, function (err, resource) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res, resource);
		});
	})
	.put(AuthController.checkCompany(), function (req, res) {
		CompanyCtrl.modifyResource(req.user, req.params.id, req.body, function (err, resources) {
			if (err) Response.printError(res, err);
			else
				Response.printSuccess(res,  resources);
		});
	})
    .delete(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.deleteResource(req.user, req.params.id, function (err, resources) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, resources);
        });
    });

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
    .delete(AuthController.checkCompany(), function (req, res) {
        CompanyCtrl.deletePromotion(req.user, req.params.id, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res,  "Promotion deleted");
        });
    });

router.route("/:id")
    .get(AuthController.checkAdmin(), function(req, res){
        CompanyCtrl.getProfile(req.params.id, function(err, company){
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
