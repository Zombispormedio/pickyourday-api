var _ = require("lodash");
var C = require("../../config/config");

var CompanyModel = require(C.models + "company");
var ServiceCtrl = require(C.ctrl + "service.ctrl");
var PromotionCtrl = require(C.ctrl + "promotion.ctrl");
var PickCtrl = require(C.ctrl + "pick.ctrl");
var CategoryCtrl = require(C.ctrl + "category.ctrl");
var ServiceNameModel = require(C.models + "service_name");
var CategoryModel = require(C.models + "category");
var PickModel = require(C.models + "pick");
var AuthModel = require(C.models + "auth").Auth;

var ResourceCtrl = require(C.ctrl + "resource.ctrl");
var StatsCtrl = require(C.ctrl + "stats.ctrl");
var CustomerModel = require(C.models + "customer");
var async = require("async");
var Utils = require(C.lib + "utils");
var _ = require("lodash");
var Controller = {};

var paypal = require('paypal-rest-sdk');
var request = require('request');

Controller.newCompany = function (body, cb) {
    if (!body || !body.cif || !body.email || !body.password) return cb("Fields not Filled");
    var company = new CompanyModel(body);
    company.registerDate = new Date();
    company.state = "demo";
    company.premium = false;
    company.save(function (err, result) {
        if (err) return cb(err);
        cb(null, result);
    });
};

Controller.search = function (query, cb) {
    CompanyModel.search(query, function (err, companies) {
        if (err) return cb(err);

        if (!companies || companies.length === 0)
            return cb(null, []);

        async.map(companies, function (companie, next) {
            if (!companie) return next();
            async.waterfall([
                function (callback) {
                    var c = companie.toObject();
                    async.map(c.services, function (service, next) {
                        async.waterfall([function (subNext) {
                            ServiceNameModel.findById(service.id_name)
                                .select('name duration keywords description')
                                .exec(function (err, service_name) {
                                    if (err) return subNext(err);
                                    service.default = service_name;
                                    subNext(null, service);
                                });
                        }, function (service, subNext) {

                            CompanyModel.formatServideRating(c._id, service._id, function (err, avg) {
                                if (err) return subNext(err);
                                service.avgRating = avg;
                                subNext(null, service);
                            });
                        }

                        ], function (err, result) {
                            if (err) return next(err);
                            next(null, result);
                        });

                    }, function (err, result) {
                        if (err) return callback(err);
                        c.services = result;
                        callback(null, c);
                    });
                }, function (comp, callback) {
                    async.map(companie.review, function (rev, next) {
                        CustomerModel.findById(rev["id_customer"])
                            .select('name')
                            .exec(function (err, rev_customer) {
                                if (err) return next(err);
                                rev.id_customer = rev_customer;
                                next(null, rev);
                            });
                    }, function (err, result) {
                        if (err) return cb(err);
                        comp.review = result;
                        callback(null, comp);
                    });
                },
                function (comp, callback) {
                    CategoryModel.findById(comp.category)
                        .select('name description color icon image')
                        .exec(function (err, category) {
                            if (err) return callback(err);
                            comp.category = category;
                            callback(null, comp);
                        });
                },
                function (comp, callback) {
                    CompanyModel.formatReviews(comp._id, function (err, reviews) {
                        comp.review_ratings = reviews;
                        callback(null, comp);
                    });
                },
                function (comp, callback) {
                    async.map(comp.resources, function (resource, next) {
                        async.waterfall([
                            function (subCallback) {
                                async.map(resource.services, function (service, next) {
                                    ServiceCtrl.findById(comp._id, service, function (err, serv) {
                                        if (err) return next(err);
                                        service = serv;
                                        next(null, service);
                                    });
                                }, function (err, result) {
                                    if (err) return subCallback(err);
                                    resource.services = result;
                                    subCallback(null, resource);
                                });
                            }
                        ], function (err, result) {
                            if (err) return next(err);
                            next(null, result);
                        });

                    }, function (err, result) {
                        if (err) return callback(err);
                        comp.resources = result;
                        callback(null, comp);
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

Controller.getProfile = function (id, cb) {
    CompanyModel.findById(id, function (err, company) {
        if (err) return cb(err);

        if (!company)
            return cb([]);

        async.waterfall([
            function (callback) {
                company = company.toObject();
                async.map(company.services, function (service, next) {
                    async.waterfall([function (subNext) {
                        ServiceNameModel.findById(service.id_name)
                            .select('name duration keywords description')
                            .exec(function (err, service_name) {
                                if (err) return subNext(err);
                                service.default = service_name;
                                subNext(null, service);
                            });
                    }, function (service, subNext) {
                        CompanyModel.formatServideRating(company._id, service._id, function (err, avg) {
                            if (err) return subNext(err);
                            service.avgRating = avg;
                            subNext(null, service);
                        });
                    }, function (service, subNext) {
                        CompanyModel.servicePromoted(id, service._id, function (err, promotion) {
                            if (promotion) {
                                service.promotion = promotion;
                                var discount = promotion.discount;
                                if (discount > 0) {
                                    service.priceOff = service.price * (discount / 100);
                                    service.priceDiscounted = service.price - (service.price * (discount / 100));
                                }
                            } else service.promotion = null;

                            subNext(null, service);
                        })
                    }
                    ], function (err, result) {
                        if (err) return next(err);
                        next(null, result);
                    });

                }, function (err, result) {
                    if (err) return callback(err);
                    company.services = result;
                    callback(null, company);
                });
            },
            function (comp, callback) {
                CategoryModel.findById(comp.category)
                    .select('name description color icon image')
                    .exec(function (err, category) {
                        if (err) return callback(err);
                        comp.category = category;
                        callback(null, comp);
                    });
            },
            function (comp, callback) {
                async.map(company.review, function (rev, next) {
                    CustomerModel.findById(rev.id_customer)
                        .select('name')
                        .exec(function (err, rev_customer) {
                            if (err) return next(err);
                            rev.id_customer = rev_customer;
                            next(null, rev);
                        });
                }, function (err, result) {
                    if (err) return cb(err);
                    comp.review = result;
                    callback(null, comp);
                });
            },
            function (comp, callback) {
                CategoryModel.findById(comp.category)
                    .select('name description color icon image')
                    .exec(function (err, category) {
                        if (err) return callback(err);
                        comp.category = category;
                        callback(null, comp);
                    });
            },
            function (comp, callback) {
                CompanyModel.formatReviews(comp._id, function (err, reviews) {
                    comp.review_ratings = reviews;
                    callback(null, comp);
                });
            },
            function (comp, callback) {
                async.map(comp.resources, function (resource, next) {
                    async.waterfall([
                        function (subCallback) {
                            async.map(resource.services, function (service, n) {
                                ServiceCtrl.findById(id, service, function (err, serv) {
                                    if (err) {
                                        return n();
                                    }
                                    service = serv;
                                    n(null, service);
                                });
                            }, function (err, result) {
                                if (err) return subCallback(err);
                                resource.services = result;
                                subCallback(null, resource);
                            });
                        }
                    ], function (err, result) {
                        if (err) return next(err);
                        next(null, result);
                    });

                }, function (err, result) {
                    if (err) return callback(err);
                    comp.resources = result;
                    callback(null, comp);
                });

            },
        ], function (err, result) {
            if (err) return cb(err);
            cb(null, result);
        });
    });
};

Controller.modify = function (id, body, cb) {

    if (!body || !id)
        return cb("Fields not filled");

    CompanyModel.modify(id, body, function (err) {
        if (err) return cb(err);
        cb();
    });
};

Controller.setPremium = function (company_id, body, cb) {
    console.log(body);
    if (!body || !body.premium)
        return cb("Fields not filled");
    var self = this;

    CompanyModel.findById(company_id, function (err, company) {
        var price = 0;
        var product = "";
        var dateExpire = new Date();
        dateExpire.setHours(23);
        dateExpire.setMinutes(0);
        company.datePayment = new Date();

        switch (body.premium) {
            case 1: //1 month
                dateExpire.setMonth(dateExpire.getMonth() + 1);
                product = "Premium durante 1 mes";
                price = 10;
                break;
            case 2: //6 month
                dateExpire.setMonth(dateExpire.getMonth() + 6);
                product = "Premium durante 3 meses";
                price = 50;
                break;
            case 3: //12 month
                dateExpire.setMonth(dateExpire.getMonth() + 12);
                product = "Premium durante 1 año";
                price = 100;
                break;
        }

        company.premium = true;
        company.dateExpire = dateExpire;

        company.save(function (err) {
            if (err) return cb(err);
            //PAGO CON PAYPAL
            paypal.configure({
                'mode': 'sandbox', //sandbox or live
                'client_id': 'Aer8LzXrVO-cOADG6DJgdGlk_jqVVwhsZvEAK2WsoZjcWLhgd016ljoSXryhu8gKLsWMCyo2OYyrmMqd',
                'client_secret': 'EGIpx3hwRRXAz-FW75DzdG3PvgCkxsgPR3uO1PZUzun9i7fB7UljPm5SJ7jGgek79MonBNCs3gJImmvr'
            });

            var date = ((dateExpire.getMonth() + 1) + '/' + dateExpire.getDate() + '/' + dateExpire.getFullYear());
            var create_payment_json = {
                "intent": "authorize",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://business-pickyourday.herokuapp.com/#/dashboard",
                    "cancel_url": "http://business-pickyourday.herokuapp.com/#/profile"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": product,
                            "sku": "premium",
                            "price": price,
                            "currency": "EUR",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "EUR",
                        "total": price
                    },
                    "description": "La cuenta será premium hasta el " + date
                }]
            };

            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    cb(error);
                } else {
                    console.log("Create Payment Response");
                    console.log(payment);
                    cb(null, payment.links[1].href)
                }
            });
        });

    })
}


Controller.payment = function(params, cb){
    var options = {
      method: 'POST', 
      body: {"payer_id": params.PayerID},
      url: 'https://api.sandbox.paypal.com/v1/payments/payment/'+params.paymentId+'/execute',
      headers: {         
        'Authorization': 'Bearer '+params.token
      },
      json: true
    };



    request(options, function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        console.log(info.stargazers_count + " Stars");
        console.log(info.forks_count + " Forks");
      }
    });
}

Controller.delete = function (id, cb) {

    if (!id) return cb("Fields not Filled");

    async.waterfall([
        function getCompany(next) {
            CompanyModel.findOne({ _id: id }, function (err, company) {

                if (err) return next(err);

                if (!company)
                    return next(null, "No Company");


                next(null, company);

            });
        }, function getPicks(company, next) {
            PickModel.find({ id_company: company._id }, function (err, picks) {
                next(null, company, picks);
            });

        }, function deletePicks(company, picks, next) {

            if (picks && picks.length > 0) {
                async.eachSeries(picks, function iterator(item, n) {
                    item.remove(function () {
                        n();
                    });

                }, function done() {
                    next(null, company);
                });
            } else {
                next(null, company);
            }


        }, function unableAccess(company, next) {

            AuthModel.findOne({ email: company.email }, function (err, auth) {
                if (err) return next(err);
                auth.remove(function (err) {
                    if (err) return next(err);
                    next(null, company);
                });

            });

        }, function deleteCompany(company, next) {
            company.remove(function (err) {
                if (err) return next(err);
                next();
            });
        }

    ], function (err, data) {
        if (err) return cb(err);
        cb(null, "Company deleted");
    });
};


Controller.newReview = function (user, body, cb) {
    if (!body || !body.company_id || !body.rating) return cb("Fields not Filled");

    CompanyModel.newReview(user, body, function (err) {
        if (err) return cb(err);
        cb();
    });
};

Controller.searchReview = function (customer, company, cb) {
    CompanyModel.searchReview(customer, company, cb);
}

Controller.newRateService = function (user, body, cb) {
    if (!body || !body.service_id || !body.company_id || !body.rating) return cb("Fields not Filled");

    CompanyModel.newRateService(user, body, function (err) {
        if (err) return cb(err);
        cb();
    });
};


Controller.getTimeLine = function (id_company, params, cb) {
    if (!id_company) return cb("Fields not Filled getTimeLine");
    var self = this;



    if (!params) params = {};
    if (!params.date)
        params.date = new Date();
    else params.date = new Date(params.date);

    if (params.rangeDays == undefined || params.rangeDays == "")
        params.rangeDays = 30;

    if (params.resource == undefined || params.resource == "")
        params.resource = 0;

    var customerData = true;
    if (params.origin == "customer")
        customerData = false;


    var step = 5;



    var timeLine = [];


    async.waterfall([
        function getResources(callback) {
            var paramsTemp = {};
            paramsTemp.format = false;
            if (params.service)
                paramsTemp.service = params.service;
            if (params.resource == 0) {
                ResourceCtrl.search(id_company, paramsTemp, function (err, resources) {
                    if (err) return callback(err);

                    callback(null, resources);
                });
            } else {
                ResourceCtrl.findById(id_company, params.resource, paramsTemp, function (err, resource) {
                    if (err) return callback(err);
                    var resources = [];
                    resources.push(resource);
                    callback(null, resources);
                });
            }
        },
        function getFormatPick(resources, callback) {
            var count = [];

            for (var i = 0; i < resources.length; i++) {
                count.push(i);
                timeLine.push([]);
            }

            async.eachSeries(count, function (i, next) {
                if (params.service != null && params.statePick != "all") {
                    state = ["active", "pending"];
                } else if (params.statePick == "all") {
                    state = ["active", "pending"];
                } else state = ["active"];

                PickCtrl.formatDatePick(id_company, params.date, true, params.rangeDays, resources[i].picks, state, function (err, datePick) {
                    if (err) return next(err);
                    timeLine[i].push({ "id": resources[i]._id, "name": resources[i].name, "surname": resources[i].surname });
                    timeLine[i].push(datePick);
                    next(null, null);
                });
            }, function (err, result) {
                if (err) return callback(err);
                callback(null, timeLine);
            });

        },
        function scheduleCompany(timeLine, callback) {
            self.getProfile(id_company, function (err, company) {
                if (err) return callback(err);
                var timeLineArray = new Array();
                var timeLineTemp = new Array();
                for (var r = 0; r < timeLine.length; r++)
                    timeLineTemp[r] = [];
                var schedule = company.scheduleActivity;
                if (!schedule || schedule.length == 0) return cb([]);
                var scheduleDays = [];
                var dateIterator = new Date(params.date);
                var ranges = [];
                var steps = [];

                for (var day = 0; day < params.rangeDays; day++) {
                    var scheduleNow = dateIterator.getDay() - 1;
                    if (scheduleNow == -1)
                        scheduleNow = 6;
                    scheduleNow = schedule[0].week[scheduleNow];
                    var times = [];
                    for (var key in scheduleNow.times) {
                        var split = scheduleNow.times[key].split("-");
                        for (var time in split) {
                            var date = new Date();
                            var hm = split[time].split(":");
                            date.setHours(parseInt(hm[0]));
                            date.setMinutes(hm[1]);
                            date.setSeconds(0);
                            times.push(date);
                        }
                    }
                    times.sort();

                    var init;
                    var end;
                    var minInit;
                    var minEnd;
                    var count;

                    if (times.length > 1) {
                        init = times[0];
                        init.setDate(dateIterator.getDate());
                        end = times[times.length - 1];
                        end.setDate(dateIterator.getDate());
                        minInit = init.getHours() * 60 + init.getMinutes();
                        minEnd = end.getHours() * 60 + end.getMinutes();
                        count = Math.floor((minEnd - minInit) / 5);

                        scheduleDays.push({ "open": init, "close": end, "steps": count });
                    } else scheduleDays.push([]);


                    var rangesAcum = [];
                    for (var t = 0; t < times.length; t++) {
                        var pos1 = ((times[t].getHours() * 60 + times[t].getMinutes()) - minInit) / step;
                        t++;
                        var pos2 = ((times[t].getHours() * 60 + times[t].getMinutes()) - minInit) / step;

                        rangesAcum.push({ 0: pos1, 1: pos2 });
                    }
                    ranges.push(rangesAcum);



                    dateIterator.setDate(dateIterator.getDate() + 1);
                }

                var metadata = {
                    "schedule": scheduleDays, "step": step, "legend": {
                        "0": "void", "pick": "data pick", "2": "closed", "3": "holiday", "4": "event", "date": "available"
                    }
                };


                var temp = new Array();

                var stepsAcum = [];
                var dayIterator = 0;

                for (var dayI = 0; dayI < params.rangeDays; dayI++) {
                    var rangeTimes = ranges[dayI];

                    var stepsDay = scheduleDays[dayI].steps;
                    var steps = [];

                    for (var i = 0; i < stepsDay; i++) {
                        var inSchedule = false;
                        for (var r = 0; r < rangeTimes.length; r++) {
                            if (i >= rangeTimes[r][0] && i < rangeTimes[r][1]) {
                                inSchedule = true;
                                r = ranges.length;
                            }
                        };
                        if (inSchedule)
                            steps.push(0);
                        else
                            steps.push(2);



                    }

                    for (var resource = 0; resource < timeLine.length; resource++) {
                        timeLineTemp[resource][dayI] = _.clone(steps);
                    }
                }


                for (var r = 0; r < timeLine.length; r++)
                    temp.push({ "resource": timeLine[r][0], "steps": timeLineTemp[r] });


                for (var r = 0; r < timeLine.length; r++) {
                    var days = timeLine[r][1];

                    for (var day = 0; day < days.length; day++) {
                        var picks = days[day];
                        var count = scheduleDays[day].steps;

                        for (var pick = 0; pick < picks.length; pick++) {
                            var date = picks[pick].init;
                            date = new Date(date);

                            var fill = Math.floor(picks[pick].duration / step);
                            var pos = ((date.getHours() * 60 + date.getMinutes()) - minInit) / step;
                            if (pos >= 0 && pos < count) {

                                for (var f = 0; f < fill; f++) {
                                    if (!customerData) {
                                        temp[r]["steps"][day][pos + f] = 1;
                                    } else {

                                        if (picks[pick] != null) {
                                            var pickTemp = picks[pick].pick;

                                            if (pickTemp) {
                                                var customer = pick.customer;
                                                var name = "";
                                                var phone = "";

                                                if (customer == null) {
                                                    name = pickTemp.nameCli;
                                                    phone = pickTemp.phoneCli;
                                                } else {
                                                    if (customer.name != undefined)
                                                        name = customer.name + " " + customer.surname;
                                                    phone = customer.phone;
                                                }
                                                var service = pickTemp.service;

                                                var serviceName = "";
                                                if (name == undefined)
                                                    name = "";
                                                if (phone == undefined)
                                                    phone = "";

                                            }
                                            if (service) {

                                                serviceName = service.name;

                                                if (serviceName == "" || serviceName == undefined) {
                                                    if (service["metadata"])
                                                        serviceName = service["metadata"].name;

                                                }

                                            }

                                            if (serviceName == undefined)
                                                serviceName = "";
                                            if (phone == undefined)
                                                phone = "";

                                            temp[r]["steps"][day][pos + f] = {
                                                "customer": name,
                                                "phone": phone,
                                                "service": serviceName,
                                                "id_pick": pickTemp._id
                                            }

                                        }


                                    }
                                }
                            }


                        }
                    }
                }

                timeLineArray.push({ "metadata": metadata, "timeLine": temp });

                callback(null, timeLineArray);
            });
        }, function getAvailables(timeLineArray, callback) {
            if (params.service != null) {
                self.getServiceById(id_company, params.service, function (err, service) {
                    if (err) return callback(err);
                    if (service != null) {
                        var duration = service.duration;
                        var need = duration / step;
                        need--;
                        var initDate = new Date(params.date);
                        initDate.setMilliseconds(0);
                        var scheduleCompany = timeLineArray[0].metadata.schedule;
                        if (!scheduleCompany || scheduleCompany.length == 0) return callback([]);

                        for (var resource in timeLineArray[0].timeLine) {
                            var days = timeLineArray[0].timeLine[resource].steps;

                            for (var day in days) {

                                if (!scheduleCompany[day]) continue;
                                var open = scheduleCompany[day].open;
                                if (open === void 0) continue;

                                initDate.setHours(open.getHours());
                                initDate.setMinutes(open.getMinutes());
                                initDate.setSeconds(open.getSeconds());

                                var steps = days[day];
                                var size = days[day].length;
                                for (var key in steps) {
                                    key = parseInt(key);
                                    if (key + need < size) {
                                        if (steps[key + need] == 0 && steps[key] == 0) {
                                            var avaiable = true;
                                            var c = key + need - 1;
                                            while (avaiable && key < c) {
                                                if (steps[c] != 0)
                                                    avaiable = false;
                                                c--;
                                            }

                                            if (avaiable) {
                                                var auxDate = new Date(initDate);
                                                auxDate.setDate(initDate.getDate() + parseInt(day));
                                                auxDate.setMinutes(key * step);
                                                if (auxDate > params.date)
                                                    steps[key] = auxDate;
                                            }
                                        }
                                    } else break;
                                }
                            }

                        }

                        callback(null, timeLineArray);
                    }
                })
            } else
                callback(null, timeLineArray);
        }
    ], function (err, result) {
        if (err) return cb(err);
        cb(null, result);
    });
};


//*********************PICKS
Controller.searchPick = function (company, params, cb) {
    params["company.id_company"] = company;
    var self = this;
    if (params.resource != undefined && params.resource != "") {
        var paramsTemp = {};
        paramsTemp.format = false;
        ResourceCtrl.findById(company, params.resource, paramsTemp, function (err, resource) {
            if (err) return cb(err);
            if (!resource) return cb([]);
            params.picks = resource.picks;
            delete params.resource;
            var endDate = new Date();
            endDate.setHours(23);
            endDate.setMinutes(59);
            var initDate = new Date();
            initDate.setHours(0);
            params.beforeInitDate = endDate;
            params.state = ["active"];
            params.afterInitDate = initDate;
            PickCtrl.search(params, cb);
        })
    } else PickCtrl.search(params, cb);


};

Controller.newPick = function (company, params, cb) {
    params.company = { "id_service": params.service, "id_company": company };
    params.origin = "manual";
    params.state = "active";
    delete params.service;
    var self = this;
    PickCtrl.new(params, function (err, pick) {
        if (err) return cb(err);
        if (!pick) return cb(-1);
        if (pick.promotion != null) {
            self.usePromotion(pick.company.id_company, pick.promotion, function (err) {
                cb(null, pick);
            });
        } else cb(null, pick);

    });
};

Controller.getPickById = function (id, cb) {
    PickCtrl.findById(id, cb);
};

Controller.getPickByIdQuick = function (id, cb) {
    PickCtrl.findByIdQuick(id, cb);
};

Controller.deletePick = function (params, cb) {
    PickCtrl.delete(params, cb);
};

Controller.getPickById = function (id, cb) {
    PickCtrl.findById(id, cb);
};

Controller.cancelPick = function (pick, cb) {
    PickCtrl.changeState(pick, "cancelled", function (err) {
        if (err) return cb(err);
        PickCtrl.delete(pick, cb);
    });
};

Controller.activePick = function (id_pick, cb) {
    var self = this;

    self.getPickByIdQuick(id_pick, function (err, pick) {
        if (err) return cb(err);

        if (pick && pick.state != "active") {
            if (pick.promotion != null) {
                self.usePromotion(pick.company.id_company, pick.promotion, function (err) {
                    PickCtrl.changeState(id_pick, "active", cb);
                });
            } else PickCtrl.changeState(id_pick, "active", cb);
        } else cb(-1);
    })
};

Controller.nextPick = function (company, params, cb) {
    this.getResourceById(company, params.resource, function (err, resource) {
        if (err) return cb(err);
        if (!resource) return cb(-1);
        params.picks = resource.picks;
        PickCtrl.nextPick(company, params, cb);
    });

}



//***********************SERVICES
Controller.searchServiceName = function (params, cb) {
    ServiceCtrl.searchServiceName(params, cb);
};

Controller.searchService = function (company, params, cb) {
    CompanyModel.findById(company, function (err, c) {
        if (err) return cb(err);
        params.state = c.state;
        ServiceCtrl.search(company, params, cb);
    });
};

Controller.newService = function (company, params, cb) {
    ServiceCtrl.new(company, params, cb);
};

Controller.modifyService = function (company, id, body, cb) {
    ServiceCtrl.modify(company, id, body, cb);
};

Controller.deleteService = function (company, service_id, cb) {
    
    async.waterfall([
        
        function(next){
            PickModel.find({"company.id_service":service_id}).remove().exec(next);
        },
        function(next){
            ServiceCtrl.delete(company, service_id, next);
        }
        
        
    ], cb);
    
    
};

Controller.getServiceById = function (company, id, cb) {
    ServiceCtrl.findById(company, id, cb);
};

//***********************PROMOTIONS
Controller.searchPromotion = function (company, params, cb) {
    PromotionCtrl.search(company, params, cb);
};

Controller.newPromotion = function (company, params, cb) {
    PromotionCtrl.new(company, params, cb);
};

Controller.modifyPromotion = function (company, id, body, cb) {
    PromotionCtrl.modify(company, id, body, cb);
};

Controller.deletePromotion = function (company, params, cb) {
    PromotionCtrl.delete(company, params, cb);
};

Controller.getPromotionById = function (company, id, cb) {
    PromotionCtrl.findById(company, id, cb);
};

Controller.usePromotion = function (company, id, cb) {
    CompanyModel.usePromotion(company, id, cb);
};

//*******************CATEGORY
Controller.searchCategory = function (params, cb) {
    CategoryCtrl.search(params, cb);
};


//*******************STATS
Controller.statsPicks = function (company, query, cb) {
    StatsCtrl.statsPicks(company, query, cb);
}

Controller.originPicks = function (company, query, cb) {
    StatsCtrl.originPicks(company, query, cb);
}

Controller.scoreServices = function (company, query, cb) {
    StatsCtrl.scoreServices(company, query, cb);
}


//*******************RESOURCE
Controller.newResource = function (company, params, cb) {
    ResourceCtrl.new(company, params, function (err) {
        if (err) return cb(err);

        Controller.searchResource(company, {}, function (err, resources) {
            if (err) return cb(err);
            cb(null, resources);
        });
    });
};

Controller.searchResource = function (company, params, cb) {
    ResourceCtrl.search(company, params, cb);
};

Controller.modifyResource = function (company, id, body, cb) {
    ResourceCtrl.modify(company, id, body, function (err) {
        if (err) return cb(err);

        Controller.searchResource(company, {}, function (err, resources) {
            if (err) return cb(err);
            cb(null, resources);
        });
    });
};

Controller.deleteResource = function (company, params, cb) {
    ResourceCtrl.delete(company, params, function (err) {
        if (err) return cb(err);

        Controller.searchResource(company, {}, function (err, resources) {
            if (err) return cb(err);
            cb(null, resources);
        });
    });
};

Controller.getResourceById = function (company, id, cb) {
    ResourceCtrl.findById(company, id, undefined, cb);
};

Controller.getTimeLineResource = function (company, params, cb) {
    if (params.resource == undefined || params.resource == "")
        params.resource = 0;
    if (params.date == undefined || params.date == "")
        params.date = new Date();

    ResourceCtrl.getTimeLine(company, params.resource, params.date, cb);
};

Controller.getResourcesByService = function (company, params, cb) {
    if (params.service === undefined || params.service == "")
        params.service = 0;
    ResourceCtrl.getResourcesByService(company, params.service, cb);
};
Controller.toggleService = function (company, params, cb) {
    if (!company || !params.service || !params.resource) return cb("Fields not Filled ToggleService");
    CompanyModel.toggleService(company, params.service, params.resource, cb);
};


Controller.asignPick = function (company, params, cb) {
    if (!company || !params.idResource || !params.idPick) return cb("Fields not Filled");
    CompanyModel.asignPick(company, params.idResource, params.pick._id, cb);
};

Controller.getServicesAsigned = function (company, params, cb) {
    if (!company || !params || !params.idResource) return cb("Fields not filled");

    CompanyModel.getServicesAsigned(company, params, function (err, idsService) {
        var services = [];
        async.map(idsService, function (idService, callback) {
            ServiceCtrl.findById(company, idService, function (err, service) {
                if (err) return callback(err);
                services.push(service);
                callback(null, services);
            });
        }, function (err, result) {
            if (err) return cb(err);

            cb(null, result);
        });
    });
};



Controller.rollback = function (id) {
    CompanyModel.findById(id, function (err, company) {
        company.remove();
    });
};

Controller.updateProfile = function (company_id, params, cb) {
    var f_params = _.pick(params, ["emailSecond", "name", "description", "images", "phone", "web", "location", "keywords", "scheduleActivity", "state"]);

    CompanyModel.update({ _id: company_id }, f_params, function (err, result) {
        if (err) return cb(err);

	       CompanyModel.findById(company_id, function (err, company) {
            if (err) return cb(err);
            cb(null, company);
        });

    });
};




Controller.getAll = function (params, cb) {
    var query = CompanyModel.getQuery(params);

    if (params.state && params.state != "")
       	query.where("state").equals(params.state);


    query.exec(cb);
};

Controller.count = function (params, cb) {
    if (params.p) delete params.p;
    var query = CompanyModel.getQuery(params);
    query.count().exec(cb);

};



module.exports = Controller;