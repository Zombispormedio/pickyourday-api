
var C = require("../../config/config");
var async = require("async");
var PickModel = require(C.models + "pick");
var CompanyModel = require(C.models + "company");
var CustomerModel = require(C.models + "customer");
var ServiceNameModel = require(C.models + "service_name");
var CategoryModel = require(C.models + "category");
var Controller = {};

Controller.new = function (body, cb) {
    if (!body || !body.id_customer || !body.company || !body.initDate || !body.state)
        return cb("Fields not filled");

    var pick = new PickModel(body);
    pick.dateCreated = new Date();

    pick.save(function (err) {
        if (err) return cb(err);
        cb();

    });
};

Controller.search = function (query, cb) {
    PickModel.search(query, function (err, picks) {

        if (err) return cb(err);

        if (!picks || picks.length == 0)
            return cb(null, []);

        async.map(picks, function (pick, next) {
            async.waterfall([
                function (callback) {
                    CustomerModel.findById(pick.id_customer, 'name surname email location', function (err, customer) {
                        if (err) return callback(err);
                        var pObj = pick.toObject();
                        delete pObj.id_customer
                        pObj.customer = customer;
                        callback(null, pObj);
                    });
                },
                function (p, callback) {
                    CompanyModel.findById(p.company.id_company, 'cif email name category promotions locations phone photos ', function (err, company) {
                        if (err) return callback(err);
                        var c = company.toObject();
                        delete p.company.id_company;
                        p.service = p.company.id_service;
                     
                        p.company = c;
                        callback(null, p);
                    });
                },
                function (p, callback) {

                    CompanyModel.findServiceById(p.company._id, p.service, function (err, service) {
                        //if(err) return callback(err);
                        console.log(service);
                        if (service) {
                          
                            var s = service.toObject();          
                            p.service = s;
                            p.service.default=service;	
                        }
                        callback(null, p);

                    })
                },
                function (p, callback) {
                    ServiceNameModel.findById(p.service.id_name)
                        .select('name duration keywords description')
                        .exec(function (err, service_name) {
                            if (err) return callback(err);
                            delete p.service.id_name;
                            p.service.metadata = service_name;

                            callback(null, p);
                        });
                },
                function (p, callback) {
                    CategoryModel.findById(p.company.category)
                        .select('name description')
                        .exec(function (err, category) {
                            if (err) return callback(err);

                            p.company.category = category;
                            callback(null, p);
                        });
                }
            ], function (err, result) {
                if (err) return next(err);
                next(null, result);
            });


        }, function (err, result) {
            if (err) return cb(err);
            cb(null, result);
        });
    });
};

Controller.findById = function (id, cb) {
    PickModel.findById(id, function (err, pick) {
        if (err) return cb(err);

        if (!pick)
            return cb("No pick found");

        CustomerModel.findById(pick.id_customer, 'name surname email location', function (err, customer) {
            if (err) return cb(err);
            pick.id_customer = customer;
            CompanyModel.findById(pick.company.id_company, 'cif email name category promotions locations phone photos ', function (err, company) {
                if (err) return cb(err);
                pick.company.id_company = company;
                CompanyModel.findServiceById(pick.company.id_company, pick.company.id_service, function (err, service) {
                    if (err) return cb(err);
                    var pickData = [];
                    pickData.push(pick);
                    pickData.push({ "serviceData": service });
                    cb(null, pickData);
                })
            });
        });
    });
};

Controller.delete = function (id, cb) {

    if (!id) return cb("Fields not Filled");

    PickModel.findByIdAndRemove(id, function (err, pick) {
        if (err) return cb(err);

        if (!pick)
            return cb("No pick deleted");
        cb();
    })

}

module.exports = Controller;