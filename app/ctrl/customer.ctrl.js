var async = require("async");
var C = require("../../config/config");
var PickCtrl = require(C.ctrl + "pick.ctrl");
var AuthCtrl = require(C.ctrl + "auth.ctrl");
var EventCtrl = require(C.ctrl + "event.ctrl");
var PrePickCtrl = require(C.ctrl + "prePick.ctrl");
var CompanyCtrl = require(C.ctrl + "company.ctrl");
var ServiceCtrl = require(C.ctrl + "service.ctrl");
var CategoryCtrl = require(C.ctrl + "category.ctrl");
var PromotionCtrl = require(C.ctrl + "promotion.ctrl");
var CustomerModel = require(C.models + "customer");
var PickModel = require(C.models + "pick");
var PreferencesCtrl = require(C.ctrl + "preferences.ctrl");

var _=require("lodash");
var Utils = require(C.lib + "utils");
var Controller = {};



Controller.newUser = function(body, cb) { //datos del body, callback

    if (!body || !body.email || !body.password) return cb("Fields not Filled");

    var customer = new CustomerModel(body);
    customer.registerDate = new Date();
    customer.save(function(err, result) {
        if (err) return cb(err);

        cb(null, result);
    });
};

Controller.search = function(query, cb) {
    CustomerModel.search(query, function(err, customers) {
        if (err) return cb(err);

        if (!customers)
            return cb(null, "No users");

        cb(null, customers);

    });
};

Controller.findById = function(id, cb) {
    CustomerModel.findById(id, function(err, customer) {
        if (err) return cb(err);
        if (!customer)
            return cb(null, "No user");

        return cb(null, customer);
    });
}

Controller.modify = function(id, body, cb) {

    if (!body || !id)
        return cb("Fields not filled");

    CustomerModel.modify(id, body, function(err) {
        if (err) return cb(err);
        cb();
    });
};

Controller.delete = function(id, cb) {
    if (!id) return cb("Fields not Filled");

    async.waterfall([
        function getCustomer(next) {
            CustomerModel.findOne({ _id: id }, function(err, customer) {

                if (err) return next(err);

                if (!customer)
                    return next(null, "No customer");


                next(null, customer);

            });
        }, function getPicks(customer, next) {
            PickModel.find({ id_customer: customer._id }, function(err, picks) {
                next(null, customer, picks);
            });

        }, function deletePicks(customer, picks, next) {

            if (picks && picks.length > 0) {
                async.eachSeries(picks, function iterator(item, n) {
                    item.remove(function() {
                        n();
                    });

                }, function done() {
                    next(null, customer);
                });
            } else {
                next(null, customer);
            }


        }, function unableAccess(customer, next) {

            AuthCtrl.UnableAccess(customer.email, function(err) {
                if (err) return next(err);
                next(null, customer);
            });

        }, function deleteCustomer(customer, next) {
            customer.remove(function(err) {
                if (err) return next();
                next();
            });
        }

    ], function(err, data) {
        if (err) return cb(err);
        cb(null, "Customer deleted");
    });
};

Controller.searchThings = function(params, cb) {
    params = Utils.filterParams(params);
    var things = {};
    things.prepicks = [];
    things.companies = [];
    things.services = [];

    var self = this;
    async.waterfall([
        function getDefaultName(callback) {
            var paramsTemp = {};
            paramsTemp.name = params.name;
            ServiceCtrl.searchServiceName(paramsTemp, function(err, default_names) {
                if (err) return callback(err);
                callback(null, things, default_names);
            });
        }, function getServicesByDefaultName(things, names, callback) {
            var paramsTemp = {};
            var idDefaultNames = [];
            if (names && names.length > 0)
                idDefaultNames = names.map(function(a) {
                    return a._id;
                });
            var paramsTemp = {};
            paramsTemp.idDefaultNames = idDefaultNames;
            paramsTemp["location.city"] = params["location.city"];
            //paramsTemp["location.country"] = params["location.country"]; 
            if (params.category != undefined && params.category != '')
                paramsTemp.category = params.category;
            ServiceCtrl.search(0, paramsTemp, function(err, services) {
                if (err) return callback(err);
                things.services = services;
                callback(null, things);
            });
        }, function getCompaniesByCategory(things, callback) {
            var paramsTemp = {};
            if (params.category != undefined && params.category != '')
                paramsTemp.category = params.category;
            paramsTemp.name = params.name;
            //paramsTemp["location.city"] = params["location.city"];
            paramsTemp["location.country"] = params["location.country"];
            things.params = paramsTemp;
            CompanyCtrl.search(paramsTemp, function(err, companies) {
                if (err) return callback(err);
                if (companies != 'No companies') {
                    for (var i = 0; i < companies.length; i++)
                        things.companies.push(companies[i]);
                }
                callback(null, things);
            });

        }, function getCompaniesByKeywords(things, callback) {
            var paramsTemp = {};
            if (params.category != undefined && params.category != '')
                paramsTemp.category = params.category;
            paramsTemp.keywords = params.name;
            // paramsTemp["location.city"] = params["location.city"]; 
            paramsTemp["location.country"] = params["location.country"];
            if (things.companies != undefined && things.companies.length > 0) {
                var idCompanies = things.companies.map(function(a) {
                    return a._id;
                });
                paramsTemp.idCompanies = idCompanies;
            }
            CompanyCtrl.search(paramsTemp, function(err, companies) {
                if (err) return callback(err);
                if (companies != 'No companies')
                    for (var i = 0; i < companies.length; i++) {
                        if (companies[i] != null)
                            things.companies.push(companies[i]);
                    }
                callback(null, things);
            });
        }
    ], function(err, data) {
        if (err) return cb(err);
        cb(null, data);
    });

};

Controller.getTimeLine = function(customer, params, cb) {
    if (!params) params = {};

    if (!params.initDate){
        params.initDate = new Date();
        params.initDate.setHours(0);
        params.initDate.setMinutes(0);
        params.initDate.setSeconds(0);
    }else params.initDate = new Date(params.initDate);

    if (!params.endDate) {
        params.endDate = new Date();
        params.endDate.setDate(params.endDate.getDate() + 30);
        params.endDate.setHours(23);
        params.endDate.setMinutes(59);
        params.endDate.setSeconds(0);
    }else params.endDate = new Date(params.endDate);


    var timeLine = [];
    var self = this;

    async.waterfall([
        function getFormatPick(callback) {
            PickCtrl.formatDatePickCustomer(customer, params.initDate, params.endDate, function(err, datePick) {
                if (err) return callback(err);
                timeLine.push({ "picks": datePick });
                callback(null);
            });
        },
        function getFormatEvent(callback) {
            EventCtrl.formatEvent(customer, params.initDate, params.endDate, function(err, dateEvent) {
                if (err) return callback(err);
                timeLine.push({ "events": dateEvent });
                callback(null);
            });
        },
        function getAvailables(callback){

            if(params.service != null && params.company != null){
                self.getServiceById(params.company, params.service, function(err, service){
                    if(err)return callback(err);
                    var paramsTemp = {};
                    paramsTemp.service = params.service;
                    var date = new Date();
                    if(params.initDate > date)
                        paramsTemp.date = params.initDate;
                    else
                        paramsTemp.date = date;
                    paramsTemp.rangeDays = Utils.countDays(params.initDate, params.endDate);
                    paramsTemp.statePick = "all";

                  
                    CompanyCtrl.getTimeLine(params.company, paramsTemp, function(err, timeLineCompany){
                        if(err) return callback(err);
                           
                        if(timeLineCompany){
                            var scheduleCompany = timeLineCompany[0].metadata.schedule;
                            var step = timeLineCompany[0].metadata.step;
                            var need = service.duration/step;
                            need--;                                                    
                            
                            var availables =[];
                            var resources =timeLineCompany[0].timeLine;
                            if(resources!= null && resources.length > 0){
                                var days = scheduleCompany.length;

                                var picks =_.clone(timeLine[0].picks);
                                


                                for(var day=0; day<days; day++){
                                    var stepsSize = scheduleCompany[day].steps;
                                    var initDate = scheduleCompany[day].open;
                                    var closeDate = scheduleCompany[day].close;

                                    var picksDay = [];
                                    if(picks){
                                        while(picks.length > 0 ){
                                            if(picks[0].init < closeDate){
                                                picksDay.push( picks[0]);
                                                picks.splice(0, 1);
                                            }else break;
                                        }
                                    }

                                    for(var key=0; key<stepsSize; key++){                                        
                                        key =parseInt(key);
                                        var resourcesAux = [];
                                        resourcesAux = _.clone(resources);
                                        while(resourcesAux.length > 0){ 
                                            var random = Math.floor(Math.random() * resourcesAux.length);
                                            var steps = resourcesAux[random].steps[day];
                                            if(key+need < stepsSize){
                                                if(steps[key]!= null && typeof (steps[key]) == "object"){
                                                   
                                                    var available = true; 

                                                    var auxDate = new Date(initDate);
                                                    auxDate.setMinutes(key*step);
                                                    auxDate.setMilliseconds(0);

                                                    if(auxDate < date) break;
                                                   
                                                    
                                                    if(picksDay){
                                                        var auxDateNeed = new Date(auxDate);

                                                        for(var n=1; n<=need; n++){  
                                                            for(var p=0; p<picksDay.length; p++){ 
                                                                if(picksDay[p].init < auxDateNeed && picksDay[p].end > auxDateNeed ){
                                                                    available = false;
                                                                    break;
                                                                }       
                                                            }

                                                            auxDateNeed.setMinutes(auxDateNeed.getMinutes()+(n*step));
                                                        }


                                                    }
                                                    //Falta comprobar lomismo de la company, pero conel lsitado de fechas
                                                    //restar duration al auxDate y ver sino hay fechas dentro de ese rango

                                                    if(available){                                                         
                                                        endDate = new Date(auxDate);
                                                        endDate.setMinutes(endDate.getMinutes()+4);
                                                        endDate.setSeconds(59);
                                                        availables.push({"initDate":auxDate,"endDate":endDate, "resource": resourcesAux[random].resource.id});
                                                        break;
                                                    }else resourcesAux.splice(random, 1);                        
                                                }else resourcesAux.splice(random, 1);
                                            }else break;                                  
                                        }      
                                    }
                                }
                            }

                        
                            timeLine.push({ "availables": availables});
                            callback(null, null);
                        } else callback(null, null);

                    })
                })
            }else callback(null, null);
        }

    ], function(err, result) {
        if (err) return cb(err);
        cb(null, timeLine);
    });
};

Controller.pickAvailable = function(customer, params, cb) {
    var initDate = new Date(params.initDate);
    var endDate = params.endDate;
    var service = params.service;
    var company = params.company;
    var resource = params.resource;

    if (!service || !company) return cb("Fields not Filled");

    if (!initDate)
        initDate = new Date();
    if (!endDate)
        endDate = new Date(initDate);

    var now =new Date();
    if(initDate < now)
        initDate = now;

    if(endDate < initDate)
        endDate = initDate;

    var self = this;

    async.waterfall([
        function getService(callback) {
            self.getServiceById(company, service, function(err, service) {
                if (err) return callback(err);
                callback(null, service);
            });
        }, function getTimeLine(service, callback) {
            var paramsTemp = {};
            paramsTemp.rangeDays = Utils.countDays(initDate, endDate);
            paramsTemp.date = initDate;

            CompanyCtrl.getTimeLine(company, paramsTemp, function(err, timeLine) {
                if (err) return callback(err);
                var resources = timeLine[0].timeLine;
                var count = 0;
                var available = true;
                var open = timeLine[0].metadata.open;
                var close = timeLine[0].metadata.close;
                var minOpen = open.getHours() * 60 + open.getMinutes();
                var step = 5;
                if (service.duration)
                    duration = service.duration;
                else
                    duration = service.duration;

                var fill = Math.floor(duration / step);
                var posPick = ((initDate.getHours() * 60 + initDate.getMinutes()) - minOpen) / step;
                if (posPick < 0 || posPick > timeLine[0].metadata.steps - 1)
                    available = false;
                else {
                    for (var f in fill) {
                        if (posPick + f > timeLine[0].metadata.steps - 1)
                            available = false;
                    }
                }

                var resourcesAux = resources; 
                var resourceAvailable;
                if(available == true){ 
                    if(resource){
                        for(var key in resourcesAux){                           
                            if(resourcesAux[key].resource.id.equals(resource)){
                                var steps = resourcesAux[key].steps;
                                var f=0;
                                var rAvailable = true;              
                                while(rAvailable && f<fill){
                                    if(steps[posPick+f] == 1)
                                        rAvailable =false;
                                    f++;
                                }

                                if(rAvailable) 
                                    resourceAvailable =resourcesAux[key];
                                resourcesAux.splice(r, 1);     
                            }
                        }
                    }

                    if(!resourceAvailable)
                        while(resourcesAux.length > 0 && !resourceAvailable){                   
                            var r = Math.floor(Math.random() * resourcesAux.length);
                            var steps = resourcesAux[r].steps;
                            var f=0;
                            var rAvailable = true;              
                            while(rAvailable && f<fill){
                                if(steps[posPick+f] == 1)
                                    rAvailable =false;
                                f++;
                            }  
                            if(rAvailable) 
                                resourceAvailable =resourcesAux[r];
                            resourcesAux.splice(r, 1);                       
                        }  
                    
                }               
                callback(null, resourceAvailable);
            });
        }


    ], function(err, result) {
        if (err) return cb(err);
        cb(null, result);
    });
};

//****************PICKS
Controller.searchPick = function(customer, params, cb) {
    params.id_customer = customer;
    params.state = "active";
    PickCtrl.search(params, cb);
};

Controller.newPick = function(customer, params, cb) {
    params.id_customer = customer;
    PickCtrl.new(params, cb);
};

Controller.deletePick = function(id, cb) {
    PickCtrl.delete(id, cb);
};

Controller.getPickById = function(id, cb) {
    PickCtrl.findById(id, cb);
};

Controller.getPickByIdQuick = function(id, cb){
    PickCtrl.findByIdQuick(id, cb);
};

Controller.cancelPick = function(pick, cb) {
    PickCtrl.changeState(pick, "cancelled", cb);
};

Controller.activePick = function(id_pick, cb) {
    var self= this;

    self.getPickByIdQuick(id_pick, function(err, pick){
        if(err) return cb(err);
        
        if(pick && pick.state != "active"){
            if(pick.promotion != null){
            CompanyCtrl.usePromotion(pick.company.id_company, pick.promotion, function(err){
                PickCtrl.changeState(id_pick, "active", cb);
            });         
            }else PickCtrl.changeState(id_pick, "active", cb);
        }else cb(-1);
    })
};

//***************EVENTS
Controller.searchEvent = function(customer, params, cb) {
    EventCtrl.search(customer, params, cb);
};

Controller.newEvent = function(customer, params, cb) {
    EventCtrl.new(customer, params, cb);
};

Controller.modifyEvent = function(customer, params, cb) {
    EventCtrl.modify(customer, params, cb);
};

Controller.deleteEvent = function(customer, params, cb) {
    EventCtrl.delete(customer, params, cb);
};

Controller.getEventById = function(customer, id, cb) {
    EventCtrl.findById(customer, id, cb);
};

//******************PREPICKS
Controller.searchPrePick = function(customer, params, cb) {
    PrePickCtrl.search(customer, params, cb);
};

Controller.deletePrePick = function(customer, params, cb) {
    PrePickCtrl.delete(customer, params, cb);
};

Controller.getPrePickById = function(customer, id, cb) {
    PrePickCtrl.findById(customer, id, cb);
};


//******************REVIEW
Controller.newReviewCompany = function(customer, params, cb) {
    CompanyCtrl.newReview(customer, params, cb);
};

Controller.searchReview = function(customer, params, cb){
    CompanyCtrl.searchReview(customer, params.company, cb);
}

Controller.newRateService = function(customer, params, cb) {
    CompanyCtrl.newRateService(customer, params, cb);
};


//*******************CATEGORY
Controller.searchCategory = function(params, cb) {
    CategoryCtrl.search(params, cb);
};

Controller.getCategoryById = function(id, cb) {
    CategoryCtrl.findById(id, cb);
};


Controller.rollback = function(id) {
    CustomerModel.findById(id, function(err, customer) {
        customer.remove();
    });
};

//******************SEARCH
Controller.searchService = function(params, cb) {
    if (!params.id_company)
        ServiceCtrl.search(0, params, cb);
    else
        ServiceCtrl.search(params.id_company, params, cb);
};

Controller.getServiceById = function(company, service, cb) {
    if (!service || !company)
        return cb("Fields not filled");
    ServiceCtrl.findById(company, service, cb);
};

Controller.searchCompany = function(params, cb) {
    CompanyCtrl.search(params, cb);
};

Controller.getCompanyById = function(id, cb) {
    CompanyCtrl.getProfile(id, cb);
};

//******************PROMOTION

Controller.searchPromotion = function(customer, params, cb){
    params.statePromotion = "started";
    var company = params.company
    if(params.company == null || params.company == "")
        company=0;
    delete params.company;

    PromotionCtrl.search(company, params, cb);
};

Controller.getPromotionById = function(company, id, cb) {
    PromotionCtrl.findById(company, id, cb);
};

// PREFERENCES
Controller.getCustomPreferences = function(id, cb) {
    CustomerModel.findById(id, function(err, customer) {
        if (err) return cb(err);
        if (!customer) return cb("No customer");

        PreferencesCtrl.getPreferencesByCustomer(customer, cb);

    });
};

Controller.addOrUpdatePreferences = function(customer_id, pair, cb) {

    async.waterfall([
        function add(next) {
            CustomerModel.update(
                { _id: customer_id, 'preferences.question': { $ne: pair.question } },
                { $addToSet: { preferences: pair } }, function(err, result) {
                    if (err) return next(err);


                    next(null, result.nModified);
                });
        }, function(modified, next) {
            if (modified === 1) return next();
            CustomerModel.update(
                { _id: customer_id, "preferences.question": pair.question },
                { $set: { "preferences.$": pair } }, function(err) {
                    if (err) return next(err);
                    next();
                }
            );

        }

    ], function(err) {
        if (err) return cb(err);
        cb(null, "Saved Preference");
    });
};

Controller.containsService = function(service_id, services) {
    for (var i = 0; i < services.length; i++) {
        if (services[i].services._id == service_id)
            return true;
    }
    return false;
};





module.exports = Controller;