var Router = require("express").Router;
var C = require("../../config/config");

var CustomerCtrl=require(C.ctrl+"customer.ctrl");
var AuthController = require(C.ctrl+"auth.ctrl");
var Response = require(C.lib+"response");
var router = Router();

router.route("")
    .post(function (req, res, next) { //function(request, responde, [siguiente funcion]), es como un array de funciones,con next pasas a la siguiente
        CustomerCtrl.newUser(req.body, function (err, user) { //contenido del POST, function(error, return de newUser)
            if (err) Response.printError(res, err);
            else {
                req.showUser=user;
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
                Response.printSuccess(res, "customer", req.showUser);
        });
    }
        )
    .get(AuthController.checkAdmin(), function (req, res) {
        CustomerCtrl.search(req.query, function (err, customers) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "customers", customers);
        });
    })




router.route("/profile")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.findById(req.user, function (err, customer) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", customer);
        });
    });


router.route("/pick")
    .post(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.newPick(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Pick created");
        });
    })
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.searchPick(req.user, req.query, function (err, picks) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", picks);
        });
    })


router.route("/event")
    .post(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.newEvent(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Event created");
        })
    })

    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.searchEvent(req.user, req.query, function (err, events) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", events);
        })
    })
    .delete(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.deleteEvent(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Event deleted");
        })
    });

router.route("/prePick")
    .get(AuthController.checkCustomer(),function(req, res){
        CustomerCtrl.searchPrePick(req.user, req.query, function(err, events){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, "data", events);
        })
    })
    .delete(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.deletePrePick(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "PrePick deleted");
        })
    });

router.route("/reviewCompany")
    .post(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.newReviewCompany(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Review created");
        })
    })

router.route("/rateService")
    .post(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.newRateService(req.user, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Service rated");
        })
    })

router.route("/category")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.searchCategory(req.query, function(err, categories){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, "data", categories);
        } );
    })

router.route("/service")
    .get(AuthController.checkCustomer(),function(req,res){
        CustomerCtrl.searchService(req.query, function(err, services){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, "data", services);
        })
    })

router.route("/company")
    .get(AuthController.checkCustomer(),function(req,res){
        CustomerCtrl.searchCompany(req.query, function(err, services){
            if(err) Response.printError(res, err);
                else
            Response.printSuccess(res, "data", services);
        })
    })

router.route("/service/:id")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getServiceById(req.query, req.params.id, function (err, event) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", event);
        });
    })
router.route("/company/:id")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getCompanyById(req.params.id, function (err, event) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", event);
        });
    })

router.route("/event/:id")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getEventById(req.user, req.params.id, function (err, event) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", event);
        });
    })
    .put(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.modifyEvent(req.user, req.params.id, req.body, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", "Event modified");
        });
    })

router.route("/prePick/:id")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getPrePickById(req.user, req.params.id, function (err, prePick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", prePick);
        });
    })


router.route("/pick/:id")
    .get(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.getPickById(req.params.id, function (err, pick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", pick);
        });
    })
    .delete(AuthController.checkCustomer(), function (req, res) {
        CustomerCtrl.deletePick(req.params.id, function (err, pick) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "data", pick);
        });
    });

router.route("/:id")
    .get(AuthController.checkAdmin(), function (req, res) {
        CustomerCtrl.findById(req.params.id, function (err, customer) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "customer", customer);
        });
    })

    .put(AuthController.checkAdmin(), function (req, res) {
           CustomerCtrl.modify(req.params.id, req.body, function (err, customer) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "customer", customer);
        });
    })
    .delete(AuthController.checkAdmin(),function (req, res) {
        CustomerCtrl.delete(req.params.id, function (err) {
            if (err) Response.printError(res, err);
            else
                Response.printSuccess(res, "customer", "Deleted");

        });
    });

module.exports = router;
