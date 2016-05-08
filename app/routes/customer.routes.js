var Router = require("express").Router;
var C = require("../../config/config");

var CustomerCtrl = require(C.ctrl + "customer.ctrl");
var AuthController = require(C.ctrl + "auth.ctrl");
var DeveloperCtrl = require(C.ctrl + "developer.ctrl");
var Response = require(C.lib + "response");
var router = Router();

router.route("")
    .post(function (req, res, next) { //function(request, responde, [siguiente funcion]), es como un array de funciones,con next pasas a la siguiente
        CustomerCtrl.newUser(req.body, function (err, user) { //contenido del POST, function(error, return de newUser)
            if (err) Response.printError(res, err);
            else {
                req.showUser = user;
                req.user = user._id;
                next();
            }

        });
    }, function (req, res) {
        AuthController.register(1, req.body, req.user, function (err) {
            if (err) {
                CustomerCtrl.rollback(req.user);
                Response.printError(res, err)
            }
            else
                Response.printSuccess(res, req.showUser);
        });
    }
    )
    .get(AuthController.checkAdmin(), function (req, res) {
        CustomerCtrl.search(req.query, function (err, customers) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, customers);
        });
    })
    .put(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.modify(req.user, req.body, function (err, customer) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, customer);
        });
    });

router.route("/count")
    .get(AuthController.checkAdmin(), function (req, res) {
        CustomerCtrl.count(req.query, function (err, count) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, count);
        });
    });


router.route("/notification")
    .post(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.saveNotification(req.user, req.body, function (err, pick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, pick);
        });
    })
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.checkNotification(req.user, function (err, picks) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, picks);
        });
    });

router.route("/profile")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.findById(req.user, function (err, customer) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, customer);
        });
    });


router.route("/pick")
    .post(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.newPick(req.user, req.body, function (err, pick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, pick);
        });
    })
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.searchPick(req.user, req.query, function (err, picks) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, picks);
        });
    });

router.route("/promotion")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.searchPromotion(req.user, req.query, function (err, promotions) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, promotions);
        });
    });




router.route("/event")
    .post(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.newEvent(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "Event created");
        })
    })

    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.searchEvent(req.user, req.query, function (err, events) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, events);
        });
    })
    .delete(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.deleteEvent(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "Event deleted");
        });
    });

router.route("/prePick")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.searchPrePick(req.user, req.query, function (err, events) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, events);
        });
    })
    .delete(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.deletePrePick(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "PrePick deleted");
        });
    });

router.route("/reviewCompany")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.searchReview(req.user, req.query, function (err, review) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, review);
        });
    })
    .post(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.newReviewCompany(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Review created");
        });
    });

router.route("/rateService")
    .post(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.newRateService(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "Service rated");
        });
    });

router.route("/category")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.searchCategory(req.query, function (err, categories) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, categories);
        });
    });

router.route("/service")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.searchService(req.query, function (err, services) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, services);
        });
    });

router.route("/company")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.searchCompany(req.query, function (err, services) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, services);
        });
    });

router.route("/search")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.searchThings(req.query, function (err, things) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, things);
        });
    });

router.route("/timeLine")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getTimeLine(req.user, req.query, function (err, things) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, things);
        });
    });

router.route("/pickAvailable")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.pickAvailable(req.user, req.query, function (err, pick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, pick);
        });
    });


router.route("/preferences")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getCustomPreferences(req.user, function (err, preferences) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, preferences);
        });
    })
    .post(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.addOrUpdatePreferences(req.user, req.body, function (err, preferences) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, preferences);
        });
    });

router.route("/developer")
    .get(AuthController.checkCustomer(), function (req, res) {
        DeveloperCtrl.getDeveloper(req.oauth, function (err, pair_token) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, pair_token);
        });
    })
    .post(AuthController.checkCustomer(), function (req, res) {
        DeveloperCtrl.CreateOrUpdateDeveloper(req.oauth, function (err, pair_token) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, pair_token);
        });
    });

router.route("/service/:id/:company")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getServiceById(req.params.company, req.params.id, function (err, event) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, event);
        });
    });
router.route("/company/:id")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getCompanyById(req.user, req.params.id, function (err, event) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, event);
        });
    });

router.route("/subscribe/:id")
    .put(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.subscribe(req.user, req.params.id, function (err, result) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, result);
        });
    });
router.route("/unSubscribe/:id")
    .put(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.unSubscribe(req.user, req.params.id, function (err, result) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, result);
        });
    });

router.route("/category/:id")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getCategoryById(req.params.id, function (err, event) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, event);
        });
    });

router.route("/promotion/:id/:company")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getPromotionById(req.params.company, req.params.id, function (err, event) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, event);
        });
    });

router.route("/event/:id")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getEventById(req.user, req.params.id, function (err, event) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, event);
        });
    })
    .put(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.modifyEvent(req.user, req.params.id, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "Event modified");
        });
    });

router.route("/prePick/:id")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getPrePickById(req.user, req.params.id, function (err, prePick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, prePick);
        });
    });


router.route("/pick/:id")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getPickById(req.params.id, function (err, pick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, pick);
        });
    })
    .delete(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.deletePick(req.params.id, function (err, pick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, pick);
        });
    });

router.route("/cancelPick/:id")
    .put(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.cancelPick(req.params.id, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "");
        });
    });
router.route("/activePick/:id")
    .put(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.activePick(req.params.id, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "");
        });
    });

router.route("/augmented_reality/:marker_id")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.applyAugmentedReality(req.params.marker_id, function (err, result) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, result);
        });
    });


router.route("/:id")
    .get(AuthController.checkAdmin(), function (req, res) {
        CustomerCtrl.findById(req.params.id, function (err, customer) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, customer);
        });
    })

    .put(AuthController.checkAdmin(), function (req, res) {
        CustomerCtrl.modify(req.params.id, req.body, function (err, customer) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, customer);
        });
    })
    .delete(AuthController.checkAdmin(), function (req, res) {
        CustomerCtrl.delete(req.params.id, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "Deleted");

        });
    });



module.exports = router;
