var ical = require('ical-generator');

var C = require("../../config/config");

var Response = require(C.lib + "response");
var AuthModel = require(C.models + "auth").Auth;
var CustomerCtrl = require(C.ctrl + "customer.ctrl");
var CompanyCtrl = require(C.ctrl + "company.ctrl");
var AuthController = require(C.ctrl + "auth.ctrl");
var Controller = {};

Controller.check = function() {
    return function(req, res, next) {
        var access_token = req.query.access_token;
        var secret_token = req.query.secret_token;

        if (!access_token || !secret_token) return Response.printError(res, "No Authorization");

        var developer = { access_token: access_token, secret_token: secret_token };
        AuthModel.findOne({ developer: developer }, function(err, result) {
            if (err) return Response.printError(res, "No Authorization");

            req.user = result.user;
            req.role = result.role;
            next();

        });
    };
};

Controller.whoiam = function(user, role, cb) {

    cb();
};


Controller.exportCalendarToCustomer = function(user, cb) {
    CustomerCtrl.searchPick(user, {}, cb);
};

Controller.exportCalendarToCompany = function(user, cb) {
    CompanyCtrl.searchPick(user, {}, cb);
};


Controller.exportCalendar = function(user, role, cb) {



    if (AuthController.Roles.Customer(role)) {
        Controller.exportCalendarToCustomer(user, _export);
    } else {

        if (AuthController.Roles.Company(role)) {
            Controller.exportCalendarToCompany(user, _export);
        }

    }


    function _export(err, picks) {
        if (err) return cb(err);

        var ical_picks = Controller.exportPickArrayToiCal(picks);
        
      

        cb(null, ical_picks);
    }

};


Controller.exportPickArrayToiCal = function(picks) {

    var cal = ical({ domain: C.domain });
    cal.prodId({ company: C.company, product: C.product, language: C.lang });
    cal.name("PickYourDayCalendar");
    

    picks.forEach(function(item) {
        var event = cal.createEvent();
        var created = new Date(item.dateCreated);
        event.timestamp(created);

        var start = new Date(item.initDate);
        event.start(start);

        var service = item.service;

        var duration = service.duration || service.default.duration || service.metadata.duration;
        var end = new Date(start.getTime());
        end.setMinutes(end.getMinutes() + duration);
        event.end(end);
        console.log(start);
        console.log(end);
        event.summary(service.name || service.default.name || service.metadata.name);

        event.description(service.description || service.default.description || service.metadata.description);

        var company = item.company;
        var company_location = company.location;

        if (company_location) {
            var key_location = ["address", "zipcode", "city", "province", "country", "geolocation"];

            var location = key_location.reduce(function(prev, a) {
                var value = company_location[a];

                if (value) {

                    if (a === "geolocation") {
                        value = value.latitude + ", " + value.longitude;
                    }

                    prev.push(value);
                }

                return prev;
            }, []).join(" ");




            if (location && location !== "")
                event.location(location);

        }
        event.organizer({
            name: company.name,
            email: company.email
        });

    });

    return cal;
};




module.exports = Controller;


